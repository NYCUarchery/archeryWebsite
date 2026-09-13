import { appendFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const [log, role = 'parent'] = process.argv.slice(2);
const record = event => appendFileSync(log, JSON.stringify({ role, event, pid: process.pid }) + '\n');
process.on('SIGTERM', () => { record('terminated'); process.exit(0); });
record('ready');
if (role === 'parent') {
  spawn(process.execPath, [fileURLToPath(import.meta.url), log, 'grandchild'], { stdio: 'inherit' });
}
setInterval(() => {}, 1000);
