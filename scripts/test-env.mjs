// Owns only disposable test projects. Never sources shell manifests or local DB config.
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync, createWriteStream, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mode = process.argv[2];
const extra = process.argv.slice(3);
const composeFile = path.join(root, 'docker-compose-e2e.yml');
let activeChild;

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const { logFile, ...spawnOptions } = options;
    const child = spawn(command, args, { stdio: logFile ? ['inherit', 'pipe', 'inherit'] : 'inherit', cwd: root, ...spawnOptions });
    activeChild = child;
    let log;
    if (logFile) {
      log = createWriteStream(logFile);
      child.stdout.pipe(log);
      log.on('error', error => { child.kill('SIGTERM'); reject(error); });
    }
    child.on('error', reject);
    child.on('close', (code, signal) => {
      if (activeChild === child) activeChild = undefined;
      const finish = () => code === 0 ? resolve() : reject(Object.assign(new Error(`${command} failed (${code ?? signal})`), { exitCode: code || 1 }));
      if (log && !log.writableFinished) log.once('finish', finish); else finish();
    });
  });
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

async function main() {
  if (mode !== 'go-integration') throw new Error('supported environment suite: go-integration');
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
  const stop = signal => {
    interrupted ||= signal === 'SIGINT' ? 130 : 143;
    const child = activeChild;
    if (child && !cleaningUp) {
      child.kill('SIGTERM');
      const timer = setTimeout(() => { if (activeChild === child) child.kill('SIGKILL'); }, 10000);
      timer.unref();
    }
  };
  const onInt = () => stop('SIGINT');
  const onTerm = () => stop('SIGTERM');
  process.on('SIGINT', onInt); process.on('SIGTERM', onTerm);
  try {
    await compose(manifest, ['up', '-d', '--wait', 'mysql']);
    if (interrupted) throw new Error('test interrupted');
    await compose(manifest, ['run', '--rm', '-T', '-v', `${reportDir}:/reports`, 'backend', 'go', 'test', '-tags=integration', '-p', '1', '-count=1', '-json', '-coverprofile=/reports/coverage.out', './...', ...extra], { logFile: path.join(reportDir, 'go-test.jsonl') });
  } catch (error) { failure = error; }
  finally {
    cleaningUp = true;
    try {
      const logs = spawnSync('docker', ['compose', '-p', manifest.project, '-f', composeFile, 'logs', '--no-color'], { env: environment(manifest), encoding: 'utf8', timeout: 15000, maxBuffer: 32 * 1024 * 1024 });
      writeFileSync(path.join(reportDir, 'services.log'), `${logs.stdout ?? ''}${logs.stderr ?? ''}`);
      if (logs.error || logs.status !== 0) throw logs.error ?? new Error(`service log collection failed (${logs.status ?? logs.signal})`);
    } catch (error) { failure ??= error; }
    try {
      try {
        await compose(manifest, ['down', '--timeout', '10', '--remove-orphans'], { timeout: 45000, killSignal: 'SIGKILL' });
      } catch (error) {
        console.error(`Cleanup failed; retrying owned project ${manifest.project}: ${error.message}`);
        await compose(manifest, ['down', '--timeout', '10', '--remove-orphans'], { timeout: 45000, killSignal: 'SIGKILL' });
      }
    } catch (error) { failure ??= error; }
    try { rmSync(work, { recursive: true }); } catch (error) { failure ??= error; }
    process.off('SIGINT', onInt); process.off('SIGTERM', onTerm);
    console.log(`Test artifacts: ${reportDir}`);
  }
  if (interrupted) throw Object.assign(new Error('test interrupted'), { exitCode: interrupted });
  if (failure) throw failure;
}
main().catch(error => { console.error(error.message); process.exitCode = error.exitCode || 1; });
