import { defineConfig } from 'vitest/config';
import { readFileSync } from 'node:fs';
import { cloudflareTest } from '@cloudflare/vitest-pool-workers';
export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: './wrangler.jsonc' },
      miniflare: { compatibilityDate: '2026-08-22' },
    }),
  ],
  test: {
    provide: {
      migration: ['0001_init.sql', '0002_demo_flag.sql']
        .map((file) => readFileSync(`migrations/${file}`, 'utf8'))
        .join('\n'),
      seed: readFileSync('migrations/0003_demo_incidents.sql', 'utf8'),
    },
    include: ['worker/test/**/*.test.ts'],
  },
});
