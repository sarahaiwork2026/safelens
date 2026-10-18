import { createServer, request as upstreamRequest } from 'node:http';
import { spawn } from 'node:child_process';
import { createGzip } from 'node:zlib';
const upstreamPort = 4175,
  port = 4173;
const worker = spawn(
  'pnpm',
  [
    '--filter',
    'web',
    'preview:worker',
    '--port',
    String(upstreamPort),
    '--strictPort',
  ],
  { stdio: ['ignore', 'pipe', 'pipe'], detached: true },
);
worker.stderr?.on('data', (chunk) => process.stderr.write(chunk));
const server = createServer((incoming, outgoing) => {
  const upstream = upstreamRequest(
    {
      hostname: '127.0.0.1',
      port: upstreamPort,
      path: incoming.url,
      method: incoming.method,
      headers: incoming.headers,
    },
    (response) => {
      const headers = { ...response.headers };
      const compress =
        incoming.method !== 'HEAD' &&
        response.statusCode !== 304 &&
        !headers['content-encoding'] &&
        /\bgzip\b/.test(String(incoming.headers['accept-encoding'])) &&
        /javascript|json|css|html|text|svg/.test(
          String(headers['content-type']),
        );
      if (compress) {
        delete headers['content-length'];
        headers['content-encoding'] = 'gzip';
        headers.vary = headers.vary
          ? `${headers.vary}, Accept-Encoding`
          : 'Accept-Encoding';
      }
      outgoing.writeHead(response.statusCode ?? 502, headers);
      if (compress) response.pipe(createGzip()).pipe(outgoing);
      else response.pipe(outgoing);
    },
  );
  upstream.on('error', () => {
    if (!outgoing.headersSent) outgoing.writeHead(502);
    outgoing.end('Preview unavailable');
  });
  incoming.pipe(upstream);
});
function stop() {
  server.closeAllConnections();
  server.close();
  if (worker.pid) {
    try {
      process.kill(-worker.pid, 'SIGTERM');
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code !== 'ESRCH')
        process.stderr.write('Preview Worker did not stop cleanly\n');
    }
  }
}
process.on('SIGTERM', () => {
  stop();
  process.exit(0);
});
process.on('SIGINT', () => {
  stop();
  process.exit(0);
});
worker.on('exit', (code) => {
  server.close();
  if (code) process.exitCode = code;
});
let ready = false;
for (let i = 0; i < 40; i++) {
  try {
    if (
      (
        await fetch(`http://127.0.0.1:${upstreamPort}/api/health`, {
          signal: AbortSignal.timeout(500),
        })
      ).ok
    ) {
      ready = true;
      break;
    }
  } catch (error) {
    if (error instanceof Error && worker.exitCode !== null) break;
  }
  await new Promise((resolve) => setTimeout(resolve, 250));
}
if (!ready) {
  stop();
  throw new Error('The built Worker did not start.');
}
server.on('error', (error) => {
  stop();
  process.stderr.write(error.message + '\n');
  process.exitCode = 1;
});
server.listen(port, '0.0.0.0', () =>
  process.stdout.write(
    `SafeLens production preview listening on port ${port} with edge-style text compression\n`,
  ),
);
