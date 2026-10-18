import { chromium } from '@playwright/test';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
const target = 'http://127.0.0.1:4173';
async function available() {
  try {
    return (
      await fetch(target + '/api/health', { signal: AbortSignal.timeout(1000) })
    ).ok;
  } catch {
    return false;
  }
}
let server: ReturnType<typeof spawn> | undefined;
try {
  if (!(await available())) {
    server = spawn('pnpm', ['preview'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true,
    });
    let ready = false;
    for (let i = 0; i < 40; i++) {
      if (await available()) {
        ready = true;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    if (!ready)
      throw new Error(
        'Preview did not start. Run pnpm build and check local D1.',
      );
  }
  const child = spawn('pnpm', ['--filter', 'web', 'exec', 'lhci', 'autorun'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      CHROME_PATH:
        process.env.CHROME_PATH ??
        (existsSync('/usr/bin/chromium')
          ? '/usr/bin/chromium'
          : chromium.executablePath()),
    },
  });
  const code = await new Promise<number>((resolve) =>
    child.on('exit', (value) => resolve(value ?? 1)),
  );
  process.exitCode = code;
} finally {
  if (server?.pid) process.kill(-server.pid, 'SIGTERM');
}
