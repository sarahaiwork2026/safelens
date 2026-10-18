import { existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';
const external = process.env.SAFELENS_E2E_URL;
const executable =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ??
  (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  expect: { timeout: 10000 },
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: external ?? 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    launchOptions: {
      ...(executable ? { executablePath: executable } : {}),
      args: [
        '--no-sandbox',
        '--use-gl=angle',
        '--use-angle=swiftshader',
        '--enable-unsafe-swiftshader',
      ],
    },
    ...devices['Desktop Chrome'],
  },
  ...(external
    ? {}
    : {
        webServer: {
          command: 'pnpm -w build && pnpm -w db:reset && pnpm -w preview',
          url: 'http://127.0.0.1:4173',
          timeout: 120000,
          reuseExistingServer: false,
        },
      }),
});
