import { env } from 'cloudflare:workers';
import { beforeAll, beforeEach, inject } from 'vitest';
import type { Env } from '../env';
import app from '../index';
import { hashPassword, createSession } from '../services/auth';
export const TEST_PASSWORD = 'Local-only-test-password-2026';
export let adminCookie = '';
export const adminApp = {
  request: (url: string, init: RequestInit = {}, env: Env = bindings) =>
    app.request(
      url,
      {
        ...init,
        headers: {
          ...Object.fromEntries(new Headers(init.headers)),
          Cookie: adminCookie,
        },
      },
      env,
    ),
};
declare module 'vitest' {
  export interface ProvidedContext {
    migration: string;
    seed: string;
  }
}
export const bindings: Env = {
  ...env,
  DB: (env as Pick<Env, 'DB'>).DB,
  ENVIRONMENT: 'development',
  ADMIN_EMAIL: 'admin@safelens.test',
  ADMIN_PASSWORD_HASH: '',
  EXTRACTOR_CHAIN: 'rules',
  GROQ_API_KEY: '',
  GEMINI_API_KEY: '',
  TURNSTILE_SECRET_KEY: '',
  NOMINATIM_USER_AGENT: '',
  GROQ_MODEL: 'openai/gpt-oss-120b',
  GEMINI_MODEL: 'gemini-3.5-flash-lite',
  LLM_DAILY_BUDGET: '800',
  DRAFT_SECRET: 'test-only-signing-secret-not-for-deployment',
  API_LIMITER: { limit: async () => ({ success: true }) },
  REPORT_LIMITER: { limit: async () => ({ success: true }) },
};
beforeAll(async () => {
  bindings.ADMIN_PASSWORD_HASH = await hashPassword(TEST_PASSWORD);
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
    bindings.DB.prepare('DELETE FROM admin_sessions'),
  ]);
  adminCookie = `safelens_admin=${await createSession(bindings)}`;
});
