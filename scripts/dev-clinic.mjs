import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
const nextPort = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(nextPort) || nextPort < 1 || nextPort > 65535) throw new Error('PORT must be a valid local port.');
const actions = '(read_clinic_information|identify_patient|find_open_times|book_appointment|manage_appointment|record_emergency_escalation)';
const toolPath = new RegExp(`^/api/scenarios/08-medical-triage-booking/sessions/[0-9a-f-]{36}/${actions}$`);

// The public relay exposes only the six simulated clinic tools, never invite,
// token generation, session creation, source files or the rest of the app.
export function createClinicRelay(port) {
  return createServer(async (request, response) => {
    if (request.method !== 'POST' || !toolPath.test(request.url ?? '')) {
      response.writeHead(404).end();
      return;
    }
    try {
      let size = 0;
      const chunks = [];
      for await (const chunk of request) {
        size += chunk.length;
        if (size > 8192) { response.writeHead(413).end(); return; }
        chunks.push(chunk);
      }
      const result = await fetch(`http://127.0.0.1:${port}${request.url}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: Buffer.concat(chunks), signal: AbortSignal.timeout(15000),
      });
      response.writeHead(result.status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      response.end(await result.text());
    } catch {
      response.writeHead(502, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ error: 'Local clinic is not ready. No operation can be confirmed.' }));
    }
  });
}

async function main() {
  const relay = createClinicRelay(nextPort);
  const children = [];
  let stopping = false;
  let startupTimeout;
  function stop(code = 0) {
    if (stopping) return;
    stopping = true;
    clearTimeout(startupTimeout);
    for (const child of children) child.kill('SIGTERM');
    relay.closeAllConnections();
    relay.close();
    process.exitCode = code;
  }
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => stop());

  await new Promise((resolve, reject) => {
    relay.once('error', reject);
    relay.listen(0, '127.0.0.1', resolve);
  });
  const address = relay.address();
  console.log('Starting an ephemeral HTTPS relay for the six local simulated clinic tools.');
  console.log('Clinic records remain in this Next.js process. Press Ctrl+C to stop both services.');
  const tunnel = spawn('cloudflared', ['tunnel', '--url', `http://127.0.0.1:${address.port}`, '--no-autoupdate'], {
    cwd: root, stdio: ['ignore', 'pipe', 'pipe'],
  });
  children.push(tunnel);
  let log = '';
  let started = false;
  startupTimeout = setTimeout(() => {
    console.error('No tunnel URL was received. Check cloudflared/network access, or use pnpm dev to test only the local clinic APIs.');
    stop(1);
  }, 45000);
  function observe(chunk) {
    log = (log + chunk.toString()).slice(-16000);
    const origin = log.match(/https:\/\/(?!api\.)[a-z0-9-]+\.trycloudflare\.com/)?.[0];
    if (started || !origin) return;
    started = true;
    clearTimeout(startupTimeout);
    console.log(`Clinic tools relay: ${origin}`);
    console.log(`Open http://localhost:${nextPort} for the voice conversation.`);
    const next = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'dev', '--webpack', '--port', String(nextPort)], {
      cwd: root, stdio: 'inherit', env: { ...process.env, TOP_TEN_SCENARIO_TOOL_BASE_URL: origin },
    });
    children.push(next);
    next.on('error', (error) => { console.error(error.message); stop(1); });
    next.on('exit', (code) => { if (!stopping) stop(code ?? 1); });
  }
  tunnel.stdout.on('data', observe);
  tunnel.stderr.on('data', observe);
  tunnel.on('error', (error) => {
    console.error(`cloudflared could not start: ${error.message}. Install cloudflared or supply TOP_TEN_SCENARIO_TOOL_BASE_URL for an existing deployment.`);
    stop(1);
  });
  tunnel.on('exit', (code) => {
    if (!stopping) { console.error(log.slice(-2500)); stop(code || 1); }
  });

}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
