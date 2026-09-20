import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const project = 'archery-config-test';
const specialSessionKey = 'config test: $dollar; quote="yes" unicode=弓';

function cleanEnvironment(overrides = {}) {
  const environment = Object.fromEntries(Object.entries(process.env).filter(([name]) =>
    !name.startsWith('COMPOSE_') && !name.startsWith('MYSQL_') && !name.startsWith('ARCHERY_') &&
    name !== 'NEXT_PUBLIC_API_BASE_PATH'));
  return { ...environment, COMPOSE_DISABLE_ENV_FILE: '1', ...overrides };
}

function config(file, { envFile = '.env.example', environment = {} } = {}) {
  return spawnSync('docker', [
    'compose', '--env-file', envFile, '-p', project, '-f', file, 'config', '--format', 'json',
  ], {
    cwd: root,
    env: cleanEnvironment(environment),
    encoding: 'utf8',
    timeout: 30_000,
    maxBuffer: 4 * 1024 * 1024,
  });
}

function rendered(file) {
  const result = config(file, {
    environment: {
      ARCHERY_SESSION_KEY: specialSessionKey,
      NEXT_PUBLIC_API_BASE_PATH: '/api/',
    },
  });
  assert.equal(result.status, 0, `docker compose config failed for ${file}`);
  return JSON.parse(result.stdout);
}

function assertLiteralSpecialValue(value) {
  // Do not include a rendered secret in assertion output.
  // `compose config` doubles literal dollars in its serialized model; Docker
  // receives one literal dollar when it creates the container.
  assert.ok(value === specialSessionKey.replace('$', '$$$$'), 'Compose changed an explicit special-character value');
}

test('production deployment config exposes only intended ports and secrets', () => {
  const document = rendered('docker-compose.yml');
  const { services, volumes } = document;

  assert.equal(document.name, project);
  assert.equal(volumes.db_data.name, `${project}_db_data`);
  assert.deepEqual(Object.keys(services).filter(name => services[name].ports?.length), ['reverse-proxy']);
  assert.deepEqual(services['reverse-proxy'].ports.map(port => `${port.published}:${port.target}`).sort(), ['443:443', '80:80']);

  assert.equal('MYSQL_ROOT_PASSWORD' in services.mysql.environment, true);
  for (const [service, definition] of Object.entries(services)) {
    if (service === 'mysql') continue;
    assert.equal('MYSQL_ROOT_PASSWORD' in (definition.environment ?? {}), false);
  }
  for (const service of ['frontend', 'reverse-proxy']) {
    const environment = services[service].environment ?? {};
    assert.equal('MYSQL_ROOT_PASSWORD' in environment, false);
    assert.equal('ARCHERY_SESSION_KEY' in environment, false);
    assert.equal('ARCHERY_DICTATOR_PASSWORD' in environment, false);
  }
  assertLiteralSpecialValue(services.backend.environment.ARCHERY_SESSION_KEY);
  assert.equal(services.frontend.build.args.NEXT_PUBLIC_API_BASE_PATH, '/api/');
});

test('development deployment config keeps frontend path and service-secret boundary', () => {
  const document = rendered('docker-compose-dev.yml');
  const { services } = document;

  assert.equal(services.frontend.environment.NEXT_PUBLIC_API_BASE_PATH, '/api/');
  assertLiteralSpecialValue(services.backend.environment.ARCHERY_SESSION_KEY);
  assert.equal('ARCHERY_SESSION_KEY' in (services.frontend.environment ?? {}), false);
  assert.equal('ARCHERY_SESSION_KEY' in (services['reverse-proxy'].environment ?? {}), false);
  assert.equal('MYSQL_ROOT_PASSWORD' in (services.backend.environment ?? {}), false);
});

test('deployment config rejects missing required configuration without repository .env', () => {
  const result = config('docker-compose.yml', { envFile: '/dev/null' });
  assert.notEqual(result.status, 0, 'required deployment configuration unexpectedly rendered');
});
