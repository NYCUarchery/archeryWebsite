import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, writeFileSync, rmSync, existsSync, mkdirSync, symlinkSync, readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { controlEnvironment, loadOwnedManifest, waitForService } from './test-env-control.mjs';

function environment(t, overrides = {}) {
  const work = mkdtempSync(path.join(tmpdir(), 'archery-test-'));
  const manifestPath = path.join(work, 'manifest.json');
  const manifest = { runID: 'r1234_12345678', project: 'archery-test-r1234-12345678',
    database: 'archery_test_r1234_12345678', ownerPID: process.pid,
    token: 'private-run-capability', configDir: path.join(work, 'config'),
    baseURL: 'http://127.0.0.1:43210', ...overrides };
  writeFileSync(manifestPath, JSON.stringify(manifest), { mode: 0o600 });
  const previous = { manifest: process.env.ARCHERY_TEST_MANIFEST, token: process.env.ARCHERY_TEST_TOKEN };
  process.env.ARCHERY_TEST_MANIFEST = manifestPath;
  process.env.ARCHERY_TEST_TOKEN = 'private-run-capability';
  t.after(() => {
    for (const [key, value] of [['ARCHERY_TEST_MANIFEST', previous.manifest], ['ARCHERY_TEST_TOKEN', previous.token]]) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
    rmSync(work, { recursive: true });
  });
  return work;
}

test('control requires a live, privately owned runner capability', t => {
  environment(t);
  assert.equal(loadOwnedManifest().manifest.database, 'archery_test_r1234_12345678');
  process.env.ARCHERY_TEST_TOKEN = 'wrong';
  assert.throws(loadOwnedManifest, /not an active runner/);
});

for (const [name, values] of Object.entries({
  'shared schema': { database: 'development' },
  'different project': { project: 'archery-dev' },
  'outside config': { configDir: '/etc' },
  'external origin': { baseURL: 'https://example.com' },
})) {
  test(`control rejects ${name} before Docker`, async t => {
    environment(t, values);
    let calls = 0;
    await assert.rejects(controlEnvironment('reset', ['--fixture', 'empty'], async () => calls++));
    assert.equal(calls, 0);
  });
}

test('reset stops backend before resetting and restarts only after success', async t => {
  const work = environment(t);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response('[]');
  t.after(() => { globalThis.fetch = originalFetch; });
  const commands = [];
  await controlEnvironment('reset', ['--fixture', 'accounts'], async (_, args) => commands.push(args));
  assert.deepEqual(commands.map(args => args[0]), ['stop', 'run', 'start']);
  assert.deepEqual(commands[1].slice(-3), ['reset', '--fixture', 'accounts']);
  assert.equal(existsSync(path.join(work, 'control.lock')), false);
});

test('failed reset leaves backend stopped and releases the control lock', async t => {
  const work = environment(t);
  const commands = [];
  await assert.rejects(controlEnvironment('reset', ['--fixture', 'legacy'], async (_, args) => {
    commands.push(args[0]);
    if (args[0] === 'run') throw new Error('fixture failed');
  }), /fixture failed/);
  assert.deepEqual(commands, ['stop', 'run']);
  assert.equal(existsSync(path.join(work, 'control.lock')), false);
});

test('restart never invokes reset', async t => {
  environment(t);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response('[]');
  t.after(() => { globalThis.fetch = originalFetch; });
  const commands = [];
  await controlEnvironment('restart', [], async (_, args) => commands.push(args[0]));
  assert.deepEqual(commands, ['stop', 'start']);
});

test('readiness wait observes cancellation without polling', async () => {
  const cancellation = new AbortController();
  cancellation.abort(new Error('cancelled'));
  await assert.rejects(waitForService('http://127.0.0.1:1', '/', 180_000, cancellation.signal), /cancelled/);
});

test('live control lease rejects concurrent reset without calling Docker', async t => {
  const work = environment(t);
  writeFileSync(path.join(work, 'control.lock'), JSON.stringify({ ownerPID: process.pid }));
  let calls = 0;
  await assert.rejects(controlEnvironment('reset', ['--fixture', 'empty'], async () => calls++), /another runner control is active/);
  assert.equal(calls, 0);
  assert.equal(existsSync(path.join(work, 'control.lock.recovery')), false);
});

test('dead control lease rejects reuse without Docker or unsafe in-place recovery', async t => {
  const work = environment(t);
  writeFileSync(path.join(work, 'control.lock'), JSON.stringify({ ownerPID: 2147483647 }));
  const events = [];
  await assert.rejects(controlEnvironment('restart', [], async (_, args) => events.push(args[0]), {
    cleanup: async () => events.push('cleanup'),
  }), /stale control lease; environment must be discarded/);
  assert.deepEqual(events, []);
  assert.equal(existsSync(path.join(work, 'control.lock')), true);
});

test('SIGTERM control stops its child, removes the reset container and releases its lease', { timeout: 15_000 }, async t => {
  const work = environment(t);
  const scripts = path.dirname(fileURLToPath(import.meta.url));
  const bin = path.join(work, 'bin');
  mkdirSync(bin);
  symlinkSync(path.join(scripts, 'fixtures', 'fake-docker.mjs'), path.join(bin, 'docker'));
  const log = path.join(work, 'docker.jsonl');
  const child = spawn(process.execPath, [path.join(scripts, 'test-env.mjs'), 'reset', '--fixture', 'accounts'], {
    env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, FAKE_DOCKER_MODE: 'hang', FAKE_DOCKER_LOG: log },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  child.stdout.on('data', data => { output += data; });
  child.stderr.on('data', data => { output += data; });
  const exited = new Promise(resolve => child.once('close', code => resolve(code)));
  t.after(() => { if (child.exitCode === null) child.kill('SIGKILL'); });
  const events = () => existsSync(log) ? readFileSync(log, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse) : [];
  for (let tries = 0; !events().some(event => event.event === 'run-started'); tries++) {
    assert.ok(tries < 200, `reset never started: ${output}`);
    await new Promise(resolve => setTimeout(resolve, 20));
  }
  child.kill('SIGTERM');
  assert.equal(await exited, 143, output);
  assert.ok(events().some(event => event.event === 'terminated'));
  assert.ok(events().some(event => event.command === 'rm'));
  assert.equal(existsSync(path.join(work, 'control.lock')), false);
});
