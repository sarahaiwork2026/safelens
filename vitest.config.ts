import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { include: ['packages/core/test/**/*.test.ts', 'apps/web/src/**/*.test.ts', 'apps/web/src/**/*.test.tsx'], maxWorkers: 4 } });
