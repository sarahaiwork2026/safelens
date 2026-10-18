import { Hono } from 'hono';
import type { Env } from './env';
import { bodyLimit } from 'hono/body-limit';
import { security, apiLimiter } from './middleware/security';
import { ApiError } from './services/errors';
import { configured } from './services/turnstile';
import { reportRoutes } from './routes/reports';
import { testRoutes } from './routes/test-runs';
import { incidentRoutes } from './routes/incidents';
const app = new Hono<{ Bindings: Env }>();
app.use('/api/*', security);
app.use(
  '/api/*',
  bodyLimit({
    maxSize: 16384,
    onError: () => {
      throw new ApiError(413, 'too_large', 'The request is too large.');
    },
  }),
);
app.use('/api/*', apiLimiter);
app.get('/api/health', async (c) => {
  await c.env.DB.prepare('SELECT 1').first();
  return c.json({
    ok: configured(c.env),
    engines: {
      groq: Boolean(c.env.GROQ_API_KEY),
      gemini: Boolean(c.env.GEMINI_API_KEY),
      rules: true,
    },
    chain: c.env.EXTRACTOR_CHAIN,
    turnstile: Boolean(c.env.TURNSTILE_SECRET_KEY),
    version: '0.1.0',
  });
});
app.route('/api/test-runs', testRoutes);
app.route('/api/reports', reportRoutes);
app.route('/api/incidents', incidentRoutes);
app.get('/', (c) => {
  const url = new URL(c.req.url);
  url.pathname = '/landing';
  return c.env.ASSETS
    ? c.env.ASSETS.fetch(new Request(url, c.req.raw))
    : c.text('Static assets are unavailable', 503);
});
app.notFound((c) =>
  c.json({ error: { code: 'not_found', message: 'Page not found.' } }, 404),
);
app.onError((error, c) => {
  if (error instanceof ApiError)
    return c.json(
      { error: { code: error.code, message: error.message } },
      error.status,
    );
  if (error instanceof SyntaxError)
    return c.json(
      {
        error: {
          code: 'invalid_input',
          message: 'Check the request and try again.',
        },
      },
      400,
    );
  console.error(
    JSON.stringify({
      requestId: c.res.headers.get('X-Request-ID'),
      code: 'internal',
    }),
  );
  return c.json(
    {
      error: {
        code: 'internal',
        message: "Couldn't save the report. Try again.",
      },
    },
    500,
  );
});
export default app;
