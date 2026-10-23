import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const name = '08-medical-triage-booking-smoke-' + randomUUID().slice(0, 8);
const image = process.env.DOCKER_IMAGE || 'agora-scenario/08-medical-triage-booking:local';
const appId = '0123456789abcdef0123456789abcdef';
const certificate = 'fedcba9876543210fedcba9876543210';
const check = {
  "path": "/api/scenarios/08-medical-triage-booking/sessions",
  "method": "POST",
  "body": {},
  "status": 201
};
function docker(args, options = {}) {
  const result = spawnSync('docker', args, { encoding: 'utf8', ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || 'docker failed');
  return result.stdout?.trim();
}
let started = false;
try {
  docker(['build', '--build-arg', 'NEXT_PUBLIC_AGORA_APP_ID=' + appId, '-t', image, '.'], { stdio: 'inherit' });
  docker(['run', '-d', '--name', name, '-p', '127.0.0.1::3000',
    '-e', 'NEXT_PUBLIC_AGORA_APP_ID=' + appId,
    '-e', 'NEXT_AGORA_APP_CERTIFICATE=' + certificate, image]);
  started = true;
  const port = docker(['port', name, '3000/tcp']).split(':').at(-1);
  const origin = 'http://127.0.0.1:' + port;
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const response = await fetch(origin, { signal: AbortSignal.timeout(2000) });
      if (response.ok) { ready = true; break; }
    } catch { /* Retry only while the new container starts. */ }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  assert.ok(ready, 'Container did not serve the home page.');
  if (check.hotelDate) check.path += new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
  const response = await fetch(origin + check.path, {
    method: check.method,
    headers: { 'Content-Type': 'application/json' },
    ...(check.body ? { body: JSON.stringify(check.body) } : {}),
    signal: AbortSignal.timeout(10000),
  });
  const body = await response.text();
  assert.equal(response.status, check.status, body);
  assert.ok(JSON.parse(body), 'Expected a JSON scenario response.');
  console.log('Docker image, HTTP startup and scenario route passed: 08-medical-triage-booking. No live Agora call was made.');
} catch (error) {
  if (started) console.error(docker(['logs', name]));
  throw error;
} finally {
  if (started) docker(['rm', '-f', name]);
}
