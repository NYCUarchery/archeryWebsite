import { lstatSync, readFileSync, realpathSync, openSync, closeSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

// Reset is a host-side runner operation, never an HTTP endpoint. The token is
// inherited only by this run's Playwright worker and binds it to a live owner.
export function loadOwnedManifest() {
  const manifestPath = process.env.ARCHERY_TEST_MANIFEST;
  if (!manifestPath || !path.isAbsolute(manifestPath)) throw new Error('runner manifest required');
  const work = path.dirname(manifestPath);
  if (path.basename(manifestPath) !== 'manifest.json' ||
      path.dirname(work) !== realpathSync(tmpdir()) ||
      !/^archery-test-[A-Za-z0-9]+$/.test(path.basename(work))) throw new Error('invalid runner manifest path');
  for (const target of [work, manifestPath]) {
    const stat = lstatSync(target);
    if (stat.isSymbolicLink() || (stat.mode & 0o077) !== 0 ||
        (process.getuid && stat.uid !== process.getuid())) throw new Error('runner manifest ownership mismatch');
  }
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  if (!/^r\d+_[a-f0-9]{8}$/.test(manifest.runID) ||
      manifest.project !== `archery-test-${manifest.runID.replaceAll('_', '-')}` ||
      manifest.database !== `archery_test_${manifest.runID}` ||
      manifest.configDir !== path.join(work, 'config') ||
      !manifest.token || manifest.token !== process.env.ARCHERY_TEST_TOKEN ||
      !Number.isInteger(manifest.ownerPID) || manifest.ownerPID <= 1) throw new Error('not an active runner-owned environment');
  process.kill(manifest.ownerPID, 0);
  if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(manifest.baseURL)) throw new Error('invalid runner origin');
  return { manifest, work };
}

export async function waitForService(baseURL, resource, timeout = 180_000, signal) {
  const deadline = Date.now() + timeout;
  let lastError;
  while (Date.now() < deadline) {
    signal?.throwIfAborted();
    try {
      const response = await fetch(`${baseURL}${resource}`, {
        signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(2000)]) : AbortSignal.timeout(2000),
      });
      if (response.ok) {
        // Drain the body so persistent connections are available on each poll.
        await response.arrayBuffer();
        return;
      }
      lastError = new Error(`HTTP ${response.status}`);
      await response.arrayBuffer();
    } catch (error) { lastError = error; }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error(`${resource} readiness timed out: ${lastError?.message}`);
}

function ownerIsAlive(ownerPID) {
  if (!Number.isInteger(ownerPID) || ownerPID <= 1) throw new Error('invalid control lease');
  try { process.kill(ownerPID, 0); return true; }
  catch (error) { if (error.code === 'ESRCH') return false; throw error; }
}

function acquireControlLock(lock) {
  let descriptor;
  try { descriptor = openSync(lock, 'wx', 0o600); }
  catch (error) {
    if (error.code !== 'EEXIST') throw error;
    // A hard-killed controller may have left Docker work in flight. Never
    // recover its lease in-place: the parent runner discards the whole project.
    let lease;
    try { lease = JSON.parse(readFileSync(lock, 'utf8')); }
    catch { throw new Error('invalid control lease; environment must be discarded'); }
    if (ownerIsAlive(lease.ownerPID)) throw new Error('another runner control is active');
    throw new Error('stale control lease; environment must be discarded');
  }
  try { writeFileSync(descriptor, JSON.stringify({ ownerPID: process.pid })); }
  catch (error) { closeSync(descriptor); unlinkSync(lock); throw error; }
  return descriptor;
}

export async function controlEnvironment(command, args, compose, { signal, cleanup = async () => {} } = {}) {
  if (!['reset', 'restart'].includes(command)) throw new Error('unknown runner control command');
  if (command === 'reset' && (args.length !== 2 || args[0] !== '--fixture' ||
      !['empty', 'legacy', 'accounts'].includes(args[1]))) throw new Error('reset requires --fixture empty|legacy|accounts');
  if (command === 'restart' && args.length) throw new Error('restart accepts no arguments');
  const { manifest, work } = loadOwnedManifest();
  const lock = path.join(work, 'control.lock');
  const descriptor = acquireControlLock(lock);
  let failure;
  try {
    signal?.throwIfAborted();
    await compose(manifest, ['stop', '--timeout', '10', 'backend']);
    if (command === 'reset') {
      await compose(manifest, ['run', '--rm', '--name', `${manifest.project}-reset`, '-T', 'backend', 'go', 'run', './cmd/testdb', 'reset', '--fixture', args[1]]);
    }
    await compose(manifest, ['start', 'backend']);
    await waitForService(manifest.baseURL, '/api/competition/', 60_000, signal);
  } catch (error) { failure = error; }
  finally {
    try { await cleanup(manifest); } catch (error) { failure ??= error; }
    closeSync(descriptor);
    unlinkSync(lock);
  }
  if (failure) throw failure;
}
