import { Hono } from 'hono';
import type { Env } from './env';
const app = new Hono<{ Bindings: Env }>();
app.get('/api/health', c => c.json({ ok: true, engines: { groq: false, gemini: false, rules: true }, version: '0.1.0' }));
export default app;
