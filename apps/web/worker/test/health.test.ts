import { describe, expect, it } from 'vitest';
import app from '../index';
import { bindings } from './setup';
describe('health', () => {
  it('advertises the working rules fallback', async () => {
    const response = await app.request(
      'https://safelens.test/api/health',
      {},
      bindings,
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      ok: true,
      engines: { rules: true },
    });
  });
  it('reports incomplete production settings', async () => {
    const response = await app.request(
      'https://safelens.test/api/health',
      {},
      { ...bindings, ENVIRONMENT: 'production' },
    );
    expect(await response.json()).toMatchObject({ ok: false });
  });
});
