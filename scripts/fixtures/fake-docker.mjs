#!/usr/bin/env node
// Test double for scripts/test-env.test.mjs. It records no credentials.
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
    event, command, args,
    environment: {
      composeProject: process.env.COMPOSE_PROJECT_NAME,
      mysqlHost: process.env.MYSQL_HOST,
      mysqlDatabase: process.env.MYSQL_DATABASE,
      testDatabase: process.env.ARCHERY_TEST_DATABASE,
      testRunID: process.env.ARCHERY_TEST_RUN_ID,
      testSessionKeyPresent: Boolean(process.env.ARCHERY_TEST_SESSION_KEY),
    },
  }) + '\n');
}

record('invoke');
if (command === 'inspect') {
  const project = args.at(-1).replace(/-reset$/, '');
  console.log(JSON.stringify([{ Config: { Labels: { 'com.docker.compose.project': project } } }]));
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
