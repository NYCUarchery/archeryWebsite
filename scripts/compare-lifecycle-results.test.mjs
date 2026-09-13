import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { compareLifecycleReports, COVERAGE_LEDGER_ATTACHMENT, flattenStepTimings, parseArguments, parseLifecycleReport, SNAPSHOT_ATTACHMENT } from "./compare-lifecycle-results.mjs";

const snapshot = { groups: [{ name: "E2E 反曲弓", qualification: [{ name: "E2E Archer 01", rank: 1, ends: [[10, 9, 8]] }] }], brackets: [{ groupName: "E2E 反曲弓", teamSize: 1, medals: ["gold"] }] };
const ledger = mode => mode === "full-ui"
  ? { mode, enrollment: { expected: 25, uiApplied: 25, apiApplied: 0, uiApproved: 25, apiApproved: 0 }, qualification: { expected: 144, ui: 144, api: 0 }, elimination: { expectedSides: 184, uiSides: 184, apiSides: 0 } }
  : { mode, enrollment: { expected: 25, uiApplied: 3, apiApplied: 22, uiApproved: 3, apiApproved: 22 }, qualification: { expected: 144, ui: 14, api: 130 }, elimination: { expectedSides: 184, uiSides: 42, apiSides: 142 } };

function report(mode, options = {}) {
  return {
    errors: options.reportErrors ?? [],
    stats: options.stats,
    suites: [{ file: "competitionLifecycle.spec.ts", specs: [{ title: "完整生命週期", tests: [{ expectedStatus: "passed", results: [{ status: options.status ?? "passed", retry: options.retry ?? 0, errors: options.resultErrors ?? [], duration: 123, steps: [{ title: "資格賽", duration: 10, steps: [{ title: "第 1 波", duration: 3 }] }], attachments: options.attachments ?? [
      { name: SNAPSHOT_ATTACHMENT, body: Buffer.from(JSON.stringify(options.snapshot ?? snapshot)).toString("base64") },
      { name: COVERAGE_LEDGER_ATTACHMENT, body: Buffer.from(JSON.stringify(options.ledger ?? ledger(mode))).toString("base64") },
    ] }] }] }] }],
  };
}

function writeReport(directory, name, value) {
  const path = join(directory, name);
  writeFileSync(path, JSON.stringify(value));
  return path;
}

test("compares full-ui and one or two hybrid reports with semantic snapshots", () => {
  const directory = mkdtempSync(join(tmpdir(), "archery-lifecycle-"));
  try {
    const fullUI = writeReport(directory, "full.json", report("full-ui"));
    const hybrid = writeReport(directory, "hybrid.json", report("hybrid"));
    const hybridAgain = writeReport(directory, "hybrid-again.json", report("hybrid"));
    assert.equal(compareLifecycleReports(parseArguments(["full-ui", fullUI, "hybrid", hybrid, "hybrid", hybridAgain])).length, 3);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test("rejects missing, failed, skipped-like, retried, mismatched mode, and unequal reports", () => {
  const directory = mkdtempSync(join(tmpdir(), "archery-lifecycle-"));
  try {
    const fullUI = writeReport(directory, "full.json", report("full-ui"));
    for (const [name, value, message] of [
      ["failed", report("hybrid", { status: "failed" }), /status is failed/],
      ["skipped", report("hybrid", { status: "skipped" }), /status is skipped/],
      ["retry", report("hybrid", { retry: 1 }), /retried/],
      ["report-errors", report("hybrid", { reportErrors: [{ message: "worker failed" }] }), /report error/],
      ["result-errors", report("hybrid", { resultErrors: [{ message: "step failed" }] }), /contains 1 error/],
      ["stats", report("hybrid", { stats: { unexpected: 1, flaky: 0, skipped: 0 } }), /stats.unexpected/],
      ["missing-ledger-count", report("hybrid", { ledger: { mode: "hybrid" } }), /invalid .*enrollment/],
      ["wrong-ledger-count", report("hybrid", { ledger: { ...ledger("hybrid"), qualification: { expected: 144, ui: 13, api: 131 } } }), /unexpected .*qualification.ui/],
      ["missing", report("hybrid", { attachments: [] }), /exactly one/],
      ["mode", report("full-ui"), /reports mode full-ui/],
    ]) assert.throws(() => parseLifecycleReport(writeReport(directory, `${name}.json`, value), "hybrid"), message);
    const unequal = writeReport(directory, "unequal.json", report("hybrid", { snapshot: { groups: [] } }));
    assert.throws(() => compareLifecycleReports(parseArguments(["full-ui", fullUI, "hybrid", unequal])), /semantic snapshot differs/);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test("flattens nested Playwright test.step timings", () => {
  assert.deepEqual(flattenStepTimings([{ title: "A", duration: 5, steps: [{ title: "B", duration: 2 }] }]), [
    { path: "A", duration: 5 }, { path: "A > B", duration: 2 },
  ]);
});

test("resolves JSON reporter attachment paths relative to results.json", () => {
  const directory = mkdtempSync(join(tmpdir(), "archery-lifecycle-"));
  try {
    mkdirSync(join(directory, "attachments"));
    writeFileSync(join(directory, "attachments", "snapshot.json"), JSON.stringify(snapshot));
    writeFileSync(join(directory, "attachments", "ledger.json"), JSON.stringify(ledger("full-ui")));
    const value = report("full-ui", { attachments: [
      { name: SNAPSHOT_ATTACHMENT, path: "attachments/snapshot.json" },
      { name: COVERAGE_LEDGER_ATTACHMENT, path: "attachments/ledger.json" },
    ] });
    assert.deepEqual(parseLifecycleReport(writeReport(directory, "results.json", value), "full-ui").snapshot, snapshot);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
