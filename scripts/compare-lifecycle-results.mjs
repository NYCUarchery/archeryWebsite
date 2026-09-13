#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { basename, dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const SNAPSHOT_ATTACHMENT = "lifecycle-result-snapshot";
export const COVERAGE_LEDGER_ATTACHMENT = "lifecycle-coverage-ledger";

function fail(message) {
  throw new Error(`lifecycle comparison: ${message}`);
}

function asObject(value, path) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`invalid ${path}`);
  return value;
}

function parseJSON(text, path) {
  try {
    return JSON.parse(text);
  } catch {
    fail(`invalid JSON in ${path}`);
  }
}

function collectLifecycleSpecs(suites, result = []) {
  for (const suite of suites ?? []) {
    const isLifecycleSuite = basename(suite.file ?? "") === "competitionLifecycle.spec.ts";
    if (isLifecycleSuite) result.push(...(suite.specs ?? []).map(spec => ({ suite, spec })));
    collectLifecycleSpecs(suite.suites, result);
  }
  return result;
}

function readAttachment(attachment, reportPath) {
  const name = typeof attachment.name === "string" ? attachment.name : "unnamed attachment";
  if (typeof attachment.body === "string") return parseJSON(Buffer.from(attachment.body, "base64").toString("utf8"), `${name} body`);
  if (typeof attachment.path !== "string") fail(`missing ${name} attachment path`);
  const attachmentPath = isAbsolute(attachment.path) ? attachment.path : resolve(dirname(reportPath), attachment.path);
  return parseJSON(readFileSync(attachmentPath, "utf8"), attachmentPath);
}

const EXPECTED_COVERAGE = {
  "full-ui": {
    enrollment: { expected: 25, uiApplied: 25, apiApplied: 0, uiApproved: 25, apiApproved: 0 },
    qualification: { expected: 144, ui: 144, api: 0 },
    elimination: { expectedSides: 184, uiSides: 184, apiSides: 0 },
  },
  hybrid: {
    enrollment: { expected: 25, uiApplied: 3, apiApplied: 22, uiApproved: 3, apiApproved: 22 },
    qualification: { expected: 144, ui: 14, api: 130 },
    elimination: { expectedSides: 184, uiSides: 42, apiSides: 142 },
  },
};

function extractMode(payload) {
  const ledger = asObject(payload, COVERAGE_LEDGER_ATTACHMENT);
  if (typeof ledger.mode !== "string" || !["full-ui", "hybrid"].includes(ledger.mode)) fail(`missing valid mode in ${COVERAGE_LEDGER_ATTACHMENT}`);
  for (const [section, expected] of Object.entries(EXPECTED_COVERAGE[ledger.mode])) {
    const actual = asObject(ledger[section], `${COVERAGE_LEDGER_ATTACHMENT}.${section}`);
    for (const [field, value] of Object.entries(expected)) {
      if (!Number.isInteger(actual[field]) || actual[field] < 0) fail(`invalid ${COVERAGE_LEDGER_ATTACHMENT}.${section}.${field}`);
      if (actual[field] !== value) fail(`unexpected ${COVERAGE_LEDGER_ATTACHMENT}.${section}.${field}: got ${actual[field]}, expected ${value}`);
    }
  }
  return ledger.mode;
}

export function flattenStepTimings(steps, prefix = []) {
  const timings = [];
  for (const step of steps ?? []) {
    const title = typeof step.title === "string" ? step.title : "unnamed step";
    const path = [...prefix, title];
    timings.push({ path: path.join(" > "), duration: Number(step.duration ?? 0) });
    timings.push(...flattenStepTimings(step.steps, path));
  }
  return timings;
}

export function parseLifecycleReport(reportPath, expectedMode) {
  const report = asObject(parseJSON(readFileSync(reportPath, "utf8"), reportPath), reportPath);
  if (Array.isArray(report.errors) && report.errors.length !== 0) fail(`${reportPath} contains ${report.errors.length} report error(s)`);
  if (report.stats !== undefined) {
    const stats = asObject(report.stats, `${reportPath}.stats`);
    for (const field of ["unexpected", "flaky", "skipped"]) {
      if (stats[field] !== undefined && Number(stats[field]) !== 0) fail(`${reportPath} stats.${field} is ${String(stats[field])}`);
    }
  }
  const matches = collectLifecycleSpecs(report.suites);
  if (matches.length !== 1) fail(`${reportPath} must contain exactly one competition lifecycle spec, got ${matches.length}`);
  const [{ spec }] = matches;
  const tests = spec.tests;
  if (!Array.isArray(tests) || tests.length !== 1) fail(`${reportPath} lifecycle spec must contain exactly one test`);
  const test = tests[0];
  if (test.expectedStatus !== "passed") fail(`${reportPath} lifecycle test expectedStatus is not passed`);
  if (!Array.isArray(test.results) || test.results.length !== 1) fail(`${reportPath} lifecycle test must have exactly one result`);
  const result = test.results[0];
  if (result.status !== "passed") fail(`${reportPath} lifecycle test status is ${String(result.status)}`);
  if (result.retry !== 0) fail(`${reportPath} lifecycle test retried ${String(result.retry)} time(s)`);
  if (Array.isArray(result.errors) && result.errors.length !== 0) fail(`${reportPath} lifecycle test contains ${result.errors.length} error(s)`);
  const attachments = result.attachments;
  if (!Array.isArray(attachments)) fail(`${reportPath} lifecycle test has no attachments`);
  const snapshots = attachments.filter(attachment => attachment.name === SNAPSHOT_ATTACHMENT);
  const ledgers = attachments.filter(attachment => attachment.name === COVERAGE_LEDGER_ATTACHMENT);
  if (snapshots.length !== 1) fail(`${reportPath} must contain exactly one ${SNAPSHOT_ATTACHMENT} attachment, got ${snapshots.length}`);
  if (ledgers.length !== 1) fail(`${reportPath} must contain exactly one ${COVERAGE_LEDGER_ATTACHMENT} attachment, got ${ledgers.length}`);
  const snapshot = asObject(readAttachment(snapshots[0], reportPath), SNAPSHOT_ATTACHMENT);
  const mode = extractMode(readAttachment(ledgers[0], reportPath));
  if (mode !== expectedMode) fail(`${reportPath} reports mode ${mode}, expected ${expectedMode}`);
  return { mode, snapshot, duration: Number(result.duration ?? 0), timings: flattenStepTimings(result.steps) };
}

export function compareLifecycleReports(entries) {
  if (entries.length !== 2 && entries.length !== 3) fail("provide full-ui report hybrid report [hybrid report]");
  if (entries[0]?.mode !== "full-ui" || entries.slice(1).some(entry => entry.mode !== "hybrid")) fail("first report must be full-ui and remaining report(s) hybrid");
  const reports = entries.map(entry => ({ ...entry, parsed: parseLifecycleReport(entry.path, entry.mode) }));
  for (const report of reports.slice(1)) assert.deepStrictEqual(report.parsed.snapshot, reports[0].parsed.snapshot, `semantic snapshot differs: ${report.path}`);
  return reports;
}

export function parseArguments(args) {
  if (args.length !== 4 && args.length !== 6) fail("usage: compare-lifecycle-results.mjs full-ui RESULTS hybrid RESULTS [hybrid RESULTS]");
  const entries = [];
  for (let index = 0; index < args.length; index += 2) entries.push({ mode: args[index], path: args[index + 1] });
  return entries;
}

function main() {
  const reports = compareLifecycleReports(parseArguments(process.argv.slice(2)));
  for (const { mode, path, parsed } of reports) {
    console.log(`${mode}\t${path}\ttest=${parsed.duration}ms`);
    for (const timing of parsed.timings) console.log(`  ${timing.duration}ms\t${timing.path}`);
  }
  console.log(`lifecycle snapshots match across ${reports.length} run(s)`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
