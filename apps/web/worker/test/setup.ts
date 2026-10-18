import { env } from 'cloudflare:workers';
import { beforeAll, beforeEach, inject } from 'vitest';
import type { Env } from '../env';
declare module 'vitest' {
  export interface ProvidedContext {
    migration: string;
  }
}
export const bindings: Env = {
  ...env,
  DB: (env as Pick<Env, 'DB'>).DB,
  ENVIRONMENT: 'development',
  EXTRACTOR_CHAIN: 'rules',
  GROQ_MODEL: 'openai/gpt-oss-120b',
  GEMINI_MODEL: 'gemini-3.5-flash-lite',
  LLM_DAILY_BUDGET: '800',
  DRAFT_SECRET: 'test-only-signing-secret-not-for-deployment',
  API_LIMITER: { limit: async () => ({ success: true }) },
  REPORT_LIMITER: { limit: async () => ({ success: true }) },
};
beforeAll(async () => {
  await bindings.DB.exec(
    inject('migration')
      .split('\n')
      .filter((line) => !line.trim().startsWith('--'))
      .map((line) => line.replace(/--.*$/, ''))
      .join(' '),
  );
});
beforeEach(async () => {
  await bindings.DB.batch([
    bindings.DB.prepare('DELETE FROM incidents'),
    bindings.DB.prepare('DELETE FROM test_runs'),
    bindings.DB.prepare('DELETE FROM usage_counters'),
  ]);
});
