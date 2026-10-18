import { createMiddleware } from 'hono/factory';
import type { Env } from '../env';
import { ApiError } from '../services/errors';
import { sha256 } from '../services/crypto';
export const CSP =
  "default-src 'self'; script-src 'self' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' https://tiles.openfreemap.org; worker-src 'self' blob:; frame-src https://challenges.cloudflare.com; frame-ancestors 'none'; base-uri 'none'; form-action 'self'; object-src 'none'";
export const security = createMiddleware<{ Bindings: Env }>(async (c, next) => {
  const requestId = crypto.randomUUID(),
    start = Date.now();
  c.header('X-Request-ID', requestId);
  c.header('Content-Security-Policy', CSP);
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  );
  c.header('Cross-Origin-Opener-Policy', 'same-origin');
  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  c.header('Cache-Control', 'no-store');
  if (['POST', 'PATCH', 'DELETE'].includes(c.req.method)) {
    if (c.req.header('Origin') !== new URL(c.req.url).origin)
      throw new ApiError(
        403,
        'forbidden_origin',
        'Use SafeLens from the same browser origin.',
      );
    if (
      c.req.header('Content-Type')?.split(';')[0]?.trim() !== 'application/json'
    )
      throw new ApiError(415, 'unsupported_type', 'Send JSON data.');
    const size = Number(c.req.header('Content-Length') ?? 0);
    if (size > 16384)
      throw new ApiError(413, 'too_large', 'The request is too large.');
  }
  await next();
  console.info(
    JSON.stringify({
      requestId,
      route: c.req.routePath,
      status: c.res.status,
      durationMs: Date.now() - start,
    }),
  );
});

export const apiLimiter = createMiddleware<{ Bindings: Env }>(
  async (c, next) => {
    const key = await sha256(
      `${c.env.IP_HASH_SALT ?? 'local'}:${c.req.header('CF-Connecting-IP') ?? 'local'}`,
    );
    if (!(await c.env.API_LIMITER.limit({ key }).then((r) => r.success))) {
      c.header('Retry-After', '60');
      throw new ApiError(
        429,
        'rate_limited',
        'Too many requests. Try again in a minute.',
      );
    }
    await next();
  },
);
