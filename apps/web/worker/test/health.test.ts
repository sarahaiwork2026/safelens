import { describe, expect, it } from 'vitest';
import app from '../index';
describe('health', () => { it('advertises the working rules fallback', async () => { const response = await app.request('/api/health'); expect(response.status).toBe(200); expect(await response.json()).toMatchObject({ ok: true, engines: { rules: true } }); }); });
