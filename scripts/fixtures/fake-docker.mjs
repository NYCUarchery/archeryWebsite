#!/usr/bin/env node
// Test double for scripts/test-env.test.mjs. It records only command names and
// paths; it deliberately never records the runner environment or credentials.
import { appendFileSync, mkdirSync } from 'node:fs';

const args = process.argv.slice(2);
const mode = process.env.FAKE_DOCKER_MODE ?? 'success';
const logFile = process.env.FAKE_DOCKER_LOG;
const command = args[0] === 'container' ? args[1]
  : args.includes('down') ? 'down'
  : args.includes('logs') ? 'logs'
    : args.includes('run') ? 'run'
      : args.includes('up') ? 'up'
        : args.includes('stop') ? 'stop'
          : args.includes('start') ? 'start' : 'other';

function record(event) {
  if (logFile) appendFileSync(logFile, JSON.stringify({
    event, command, args, configDir: process.env.ARCHERY_TEST_CONFIG_DIR,
  }) + '\n');
}

record('invoke');
if (command === 'inspect') {
  const project = args.at(-1).replace(/-reset$/, '');
  process.stdout.write(JSON.stringify([{ Config: { Labels: { 'com.docker.compose.project': project } } }]));
}
if (command === 'run') {
  if (mode === 'go-fail') process.exit(7);
  if (mode === 'log-write-fail') {
    const volume = args[args.indexOf('-v') + 1];
    const reportDirectory = volume?.split(':/reports')[0];
    if (!reportDirectory) process.exit(97);
    mkdirSync(`${reportDirectory}/services.log`);
  }
  if (mode === 'hang') {
    record('run-started');
    process.on('SIGTERM', () => {
      record('terminated');
      process.exit(0);
    });
    process.on('SIGINT', () => {
      record('terminated');
      process.exit(0);
    });
    setInterval(() => {}, 1000);
  }
}
if (command === 'logs') {
  process.stdout.write('fake service logs\n');
  if (mode === 'log-command-fail') process.exit(9);
}
if (command === 'down' && mode === 'down-fail') process.exit(11);
