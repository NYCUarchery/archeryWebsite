// Owns only disposable test projects. Never sources shell manifests or local DB config.
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync, createWriteStream, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { controlEnvironment, waitForService } from './test-env-control.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mode = process.argv[2];
const extra = process.argv.slice(3);
const composeFile = path.join(root, 'docker-compose-e2e.yml');
let activeChild;

export function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const { logFile, timeout, killSignal = 'SIGTERM', ...spawnOptions } = options;
    const child = spawn(command, args, { detached: process.platform !== 'win32', stdio: logFile ? ['inherit', 'pipe', 'inherit'] : 'inherit', cwd: root, ...spawnOptions });
    activeChild = child;
    let timedOut = false;
    // Node's spawn timeout kills only the direct child. Docker plugins and
    // browser workers must receive the same signal as their process leader.
    const timer = timeout ? setTimeout(() => {
      timedOut = true;
      terminateChild(child, killSignal);
    }, timeout) : undefined;
    let log;
    if (logFile) {
      log = createWriteStream(logFile);
      child.stdout.pipe(log);
      log.on('error', error => { terminateChild(child, 'SIGKILL'); reject(error); });
    }
    child.on('error', error => { clearTimeout(timer); reject(error); });
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      if (activeChild === child) activeChild = undefined;
      const finish = () => code === 0 && !timedOut ? resolve() : reject(Object.assign(new Error(`${command} failed (${timedOut ? 'timeout' : code ?? signal})`), { exitCode: timedOut ? 124 : code || 1 }));
      if (log && !log.writableFinished) log.once('finish', finish); else finish();
    });
  });
}

function terminateChild(child, signal) {
  if (!child?.pid) return;
  try {
    if (process.platform === 'win32') child.kill(signal);
    else process.kill(-child.pid, signal);
  } catch (error) { if (error.code !== 'ESRCH') throw error; }
}

function environment(manifest) {
  return { ...process.env, ARCHERY_TEST_DATABASE: manifest.database,
    ARCHERY_TEST_RUN_ID: manifest.runID,
    ARCHERY_TEST_DB_PASSWORD: manifest.dbPassword, ARCHERY_TEST_ROOT_PASSWORD: manifest.rootPassword,
    ARCHERY_TEST_CONFIG_DIR: manifest.configDir, ARCHERY_GO_MOD_CACHE: manifest.modCache,
    ARCHERY_GO_BUILD_CACHE: manifest.buildCache };
}
function compose(manifest, args, options = {}) {
  return run('docker', ['compose', '-p', manifest.project, '-f', composeFile, ...args], { env: environment(manifest), ...options });
}

async function removeResetContainer(manifest) {
  const name = `${manifest.project}-reset`;
  const inspected = spawnSync('docker', ['container', 'inspect', name], { encoding: 'utf8', timeout: 15000 });
  if (inspected.status !== 0) {
    if (inspected.status === 1 && inspected.stderr.includes(`No such container: ${name}`)) return;
    throw inspected.error ?? new Error(`cannot inspect owned reset container ${name}: ${inspected.stderr}`);
  }
  const [container] = JSON.parse(inspected.stdout);
  if (container.Config?.Labels?.['com.docker.compose.project'] !== manifest.project) throw new Error('reset container ownership mismatch');
  await run('docker', ['container', 'rm', '--force', name], { timeout: 15000, killSignal: 'SIGKILL' });
}

async function runControl() {
  const controller = new AbortController();
  let interrupted = 0;
  let cleaningUp = false;
  const stop = signal => {
    interrupted ||= signal === 'SIGINT' ? 130 : signal === 'SIGTERM' ? 143 : 124;
    controller.abort(new Error('runner control interrupted'));
    if (!cleaningUp) {
      const child = activeChild;
      terminateChild(child, 'SIGTERM');
      const force = setTimeout(() => { if (activeChild === child) terminateChild(child, 'SIGKILL'); }, 5000);
      force.unref();
    }
  };
  const onInt = () => stop('SIGINT');
  const onTerm = () => stop('SIGTERM');
  process.on('SIGINT', onInt); process.on('SIGTERM', onTerm);
  const deadline = setTimeout(() => stop('deadline'), 120_000);
  try {
    await controlEnvironment(mode, extra, (manifest, args) => {
      controller.signal.throwIfAborted();
      return compose(manifest, args, { timeout: 60_000, killSignal: 'SIGKILL' });
    }, {
      signal: controller.signal,
      cleanup: async manifest => {
        cleaningUp = true;
        try { await removeResetContainer(manifest); }
        finally { cleaningUp = false; }
      },
    });
    if (interrupted) throw new Error('runner control interrupted');
  } catch (error) {
    if (interrupted) throw Object.assign(error, { exitCode: interrupted });
    throw error;
  } finally {
    clearTimeout(deadline);
    process.off('SIGINT', onInt); process.off('SIGTERM', onTerm);
  }
}

async function main() {
  if (mode === 'reset' || mode === 'restart') return runControl();
  if (!['go-integration', 'e2e'].includes(mode)) throw new Error('supported environment suites: go-integration, e2e');
  const runID = `r${Date.now()}_${randomBytes(4).toString('hex')}`;
  const work = mkdtempSync(path.join(tmpdir(), 'archery-test-'));
  const configDir = path.join(work, 'config');
  const reportDir = path.join(root, 'test-artifacts', mode, runID);
  let manifest;
  try {
  mkdirSync(configDir, { mode: 0o700 });
  const modResult = spawnSync('go', ['env', 'GOMODCACHE'], { encoding: 'utf8' });
  if (modResult.status !== 0) throw new Error('cannot resolve Go module cache');
  mkdirSync(reportDir, { recursive: true });
  const buildCache = path.join(tmpdir(), 'archery-container-go-build');
  mkdirSync(buildCache, { recursive: true });
  manifest = { runID, project: `archery-test-${runID.replaceAll('_', '-')}`,
    ownerPID: process.pid, token: randomBytes(32).toString('hex'),
    database: `archery_test_${runID}`, dbPassword: randomBytes(32).toString('hex'),
    rootPassword: randomBytes(32).toString('hex'), configDir, modCache: modResult.stdout.trim(), buildCache, reportDir };
  writeFileSync(path.join(configDir, 'db.yaml'), `username: archery_test\npassword: ${manifest.dbPassword}\nhost: mysql\nport: 3306\ndatabase: ${manifest.database}\nmode: test\ntest_run_id: ${runID}\n`, { mode: 0o600 });
  writeFileSync(path.join(configDir, 'dictator.yaml'), 'username: e2e.admin\npassword: archery-e2e-password\nemail: e2e.admin@example.test\n', { mode: 0o600 });
  writeFileSync(path.join(configDir, 'session.yaml'), `SessionKey: ${randomBytes(32).toString('hex')}\n`, { mode: 0o600 });
  writeFileSync(path.join(work, 'manifest.json'), JSON.stringify(manifest), { mode: 0o600 });
  } catch (error) {
    rmSync(work, { recursive: true });
    throw error;
  }
  let failure;
  let interrupted = 0;
  let cleaningUp = false;
  const readiness = new AbortController();
  const stop = signal => {
    interrupted ||= signal === 'SIGINT' ? 130 : 143;
    readiness.abort(new Error('test interrupted'));
    const child = activeChild;
    if (child && !cleaningUp) {
      terminateChild(child, 'SIGTERM');
      const timer = setTimeout(() => { if (activeChild === child) terminateChild(child, 'SIGKILL'); }, 10000);
      timer.unref();
    }
  };
  const onInt = () => stop('SIGINT');
  const onTerm = () => stop('SIGTERM');
  process.on('SIGINT', onInt); process.on('SIGTERM', onTerm);
  try {
    await compose(manifest, ['up', '-d', '--wait', 'mysql']);
    if (interrupted) throw new Error('test interrupted');
    if (mode === 'go-integration') {
      await compose(manifest, ['run', '--rm', '-T', '-v', `${reportDir}:/reports`, 'backend', 'go', 'test', '-tags=integration', '-p', '1', '-count=1', '-json', '-coverprofile=/reports/coverage.out', './...', ...extra], { logFile: path.join(reportDir, 'go-test.jsonl') });
    } else {
      await compose(manifest, ['run', '--rm', '--name', `${manifest.project}-reset`, '-T', 'backend', 'go', 'run', './cmd/testdb', 'reset', '--fixture', 'empty']);
      await compose(manifest, ['up', '-d', '--build', 'backend', 'frontend', 'proxy']);
      const port = spawnSync('docker', ['compose', '-p', manifest.project, '-f', composeFile, 'port', 'proxy', '80'], { env: environment(manifest), encoding: 'utf8', timeout: 15000 });
      if (port.error || port.status !== 0 || !/^127\.0\.0\.1:\d+$/.test(port.stdout.trim())) throw new Error('could not resolve isolated proxy port');
      manifest.baseURL = `http://${port.stdout.trim()}`;
      writeFileSync(path.join(work, 'manifest.json'), JSON.stringify(manifest), { mode: 0o600 });
      await waitForService(manifest.baseURL, '/api/competition/', 180_000, readiness.signal);
      await waitForService(manifest.baseURL, '/login', 180_000, readiness.signal);
      if (interrupted) throw new Error('test interrupted');
      const projectArgs = extra.some(arg => arg === '--project' || arg.startsWith('--project=')) ? [] : ['--project=chromium'];
      await run(process.execPath, ['node_modules/@playwright/test/cli.js', 'test', '--config=playwright.config.ts', ...projectArgs, ...extra, '--workers=1', '--retries=0', '--max-failures=1'], {
        cwd: path.join(root, 'frontend'),
        env: { ...process.env, PLAYWRIGHT_BASE_URL: manifest.baseURL,
          ARCHERY_TEST_MANIFEST: path.join(work, 'manifest.json'), ARCHERY_TEST_TOKEN: manifest.token,
          ARCHERY_TEST_REPORT_DIR: reportDir },
      });
    }
  } catch (error) { failure = error; }
  finally {
    cleaningUp = true;
    if (mode === 'e2e') {
      try { await removeResetContainer(manifest); } catch (error) { failure ??= error; }
    }
    try {
      const logs = spawnSync('docker', ['compose', '-p', manifest.project, '-f', composeFile, 'logs', '--no-color'], { env: environment(manifest), encoding: 'utf8', timeout: 15000, maxBuffer: 32 * 1024 * 1024 });
      writeFileSync(path.join(reportDir, 'services.log'), `${logs.stdout ?? ''}${logs.stderr ?? ''}`);
      if (logs.error || logs.status !== 0) throw logs.error ?? new Error(`service log collection failed (${logs.status ?? logs.signal})`);
    } catch (error) { failure ??= error; }
    try {
      try {
        await compose(manifest, ['down', '--timeout', '10', '--remove-orphans', '--rmi', 'local'], { timeout: 45000, killSignal: 'SIGKILL' });
      } catch (error) {
        console.error(`Cleanup failed; retrying owned project ${manifest.project}: ${error.message}`);
        await compose(manifest, ['down', '--timeout', '10', '--remove-orphans', '--rmi', 'local'], { timeout: 45000, killSignal: 'SIGKILL' });
      }
    } catch (error) { failure ??= error; }
    try { rmSync(work, { recursive: true }); } catch (error) { failure ??= error; }
    process.off('SIGINT', onInt); process.off('SIGTERM', onTerm);
    console.log(`Test artifacts: ${reportDir}`);
  }
  if (interrupted) throw Object.assign(new Error('test interrupted'), { exitCode: interrupted });
  if (failure) throw failure;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = error.exitCode || 1; });
}
