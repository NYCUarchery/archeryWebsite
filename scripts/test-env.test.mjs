import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { afterEach, test } from 'node:test';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { run as runProcess } from './test-env.mjs';

const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptsDirectory, '..');
const runner = path.join(scriptsDirectory, 'test-env.mjs');
const fakeDocker = path.join(scriptsDirectory, 'fixtures', 'fake-docker.mjs');
const temporaryPaths = [];

afterEach(() => {
  for (const temporaryPath of temporaryPaths.splice(0)) rmSync(temporaryPath, { recursive: true, force: true });
});

function startRunner(mode) {
  const temporary = mkdtempSync(path.join(tmpdir(), 'archery-test-env-test-'));
  temporaryPaths.push(temporary);
  const bin = path.join(temporary, 'bin');
  const log = path.join(temporary, 'docker.jsonl');
  mkdirSync(bin);
  const docker = path.join(bin, 'docker');
  writeFileSync(docker, `#!/bin/sh\nexec ${process.execPath} ${fakeDocker} "$@"\n`, { mode: 0o700 });
  chmodSync(docker, 0o700);
  const child = spawn(process.execPath, [runner, 'go-integration'], {
    cwd: root,
    env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, FAKE_DOCKER_MODE: mode, FAKE_DOCKER_LOG: log },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  child.stdout.on('data', chunk => { output += chunk; });
  child.stderr.on('data', chunk => { output += chunk; });
  return { child, log, output: () => output };
}

function dockerEvents(log) {
  if (!existsSync(log)) return [];
  return readFileSync(log, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
}

function assertCleaned(events) {
  const configDir = events.find(event => event.command === 'up')?.configDir;
  assert.ok(configDir, 'runner never started the isolated mysql service');
  const downIndex = events.findIndex(event => event.command === 'down');
  assert.ok(downIndex >= 0, 'runner did not tear down its compose project');
}

function runnerReportDirectory(events) {
  const run = events.find(event => event.command === 'run');
  assert.ok(run, 'runner did not invoke go test container');
  const volume = run.args[run.args.indexOf('-v') + 1];
  assert.ok(volume?.endsWith(':/reports'), 'runner did not mount its report directory');
  return volume.slice(0, -':/reports'.length);
}

function waitForExit(child) {
  return new Promise(resolve => child.once('close', (code, signal) => resolve({ code, signal })));
}

async function waitForEvent(log, event) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (dockerEvents(log).some(item => item.event === event)) return;
    await new Promise(resolve => setTimeout(resolve, 20));
  }
  throw new Error(`timed out waiting for ${event}`);
}

test('successful run tears down services and removes generated config workdir', { timeout: 15_000 }, async () => {
  const run = startRunner('success');
  const result = await waitForExit(run.child);
  assert.equal(result.code, 0, run.output());
  const events = dockerEvents(run.log);
  assertCleaned(events);
  const runCommand = events.find(event => event.command === 'run');
  const configDir = runCommand.args.find(argument => argument.includes('ARCHERY_TEST_CONFIG_DIR'));
  assert.equal(configDir, undefined, 'fake logs must not receive runner secrets/environment');
  const reportDirectory = runnerReportDirectory(events);
  assert.ok(existsSync(path.join(reportDirectory, 'go-test.jsonl')));
  assert.equal(existsSync(runCommand.configDir), false, 'runner must remove generated config workdir');
  rmSync(reportDirectory, { recursive: true, force: true });
});

test('go test failure keeps its exit code and still tears down', async () => {
  const run = startRunner('go-fail');
  const result = await waitForExit(run.child);
  assert.equal(result.code, 7);
  const events = dockerEvents(run.log);
  assertCleaned(events);
  const reportDirectory = runnerReportDirectory(events);
  assert.ok(existsSync(path.join(reportDirectory, 'services.log')));
  rmSync(reportDirectory, { recursive: true, force: true });
});

test('services log write failure still tears down', async () => {
  const run = startRunner('log-write-fail');
  const result = await waitForExit(run.child);
  assert.notEqual(result.code, 0);
  assertCleaned(dockerEvents(run.log));
  rmSync(runnerReportDirectory(dockerEvents(run.log)), { recursive: true, force: true });
});

test('service log command failure is nonzero and still tears down', async () => {
  const run = startRunner('log-command-fail');
  const result = await waitForExit(run.child);
  assert.notEqual(result.code, 0);
  assertCleaned(dockerEvents(run.log));
  rmSync(runnerReportDirectory(dockerEvents(run.log)), { recursive: true, force: true });
});

test('cleanup failure is retried, exits nonzero, and removes generated credentials', async () => {
  const run = startRunner('down-fail');
  const result = await waitForExit(run.child);
  assert.notEqual(result.code, 0);
  const events = dockerEvents(run.log);
  assert.equal(events.filter(event => event.command === 'down').length, 2);
  assert.equal(existsSync(events[0].configDir), false);
  rmSync(runnerReportDirectory(events), { recursive: true, force: true });
});

test('SIGTERM stops a hanging child, tears down, and exits 143', async () => {
  const run = startRunner('hang');
  await waitForEvent(run.log, 'run-started');
  run.child.kill('SIGTERM');
  const result = await waitForExit(run.child);
  assert.equal(result.code, 143);
  const events = dockerEvents(run.log);
  assert.ok(events.some(event => event.event === 'terminated'));
  assertCleaned(events);
  rmSync(runnerReportDirectory(events), { recursive: true, force: true });
});

test('command timeout terminates both leader and grandchild process group', { timeout: 10_000 }, async () => {
  const temporary = mkdtempSync(path.join(tmpdir(), 'archery-process-test-'));
  temporaryPaths.push(temporary);
  const log = path.join(temporary, 'processes.jsonl');
  await assert.rejects(runProcess(process.execPath, [path.join(scriptsDirectory, 'fixtures/process-tree.mjs'), log], {
    timeout: 1000, killSignal: 'SIGTERM',
  }), error => error.exitCode === 124);
  const events = dockerEvents(log);
  assert.deepEqual(events.filter(event => event.event === 'ready').map(event => event.role).sort(), ['grandchild', 'parent']);
  assert.deepEqual(events.filter(event => event.event === 'terminated').map(event => event.role).sort(), ['grandchild', 'parent']);
});
