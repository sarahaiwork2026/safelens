import { defineConfig } from 'vitest/config';
import { readFileSync } from 'node:fs';
import { cloudflareTest } from '@cloudflare/vitest-pool-workers';
export default defineConfig({ plugins: [cloudflareTest({ wrangler: { configPath: './wrangler.jsonc' }, miniflare: { compatibilityDate: '2026-08-22' } })], test: { provide:{ migration:readFileSync('migrations/0001_init.sql','utf8') }, include: ['worker/test/**/*.test.ts'] } });
