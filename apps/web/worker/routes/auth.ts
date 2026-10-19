import { Hono } from 'hono';
import { z } from 'zod';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import type { Env } from '../env';
import {
  authenticated,
  cookieName,
  createSession,
  passwordMatches,
  SESSION_SECONDS,
} from '../services/auth';
import { reserveBudget } from '../services/budget';
import { sha256 } from '../services/crypto';
import { ApiError, invalid } from '../services/errors';

export const authRoutes = new Hono<{ Bindings: Env }>();
authRoutes.get('/session', async (c) => {
  const ok = await authenticated(c);
  return c.json({ authenticated: ok, email: ok ? c.env.ADMIN_EMAIL : null });
});
authRoutes.post('/login', async (c) => {
  if (!c.env.ADMIN_EMAIL || !c.env.ADMIN_PASSWORD_HASH)
    throw new ApiError(
      503,
      'auth_unavailable',
      'Admin sign-in is not configured.',
    );
  const input = z
    .object({
      email: z.string().trim().email().max(254),
      password: z.string().min(1).max(256),
    })
    .strict()
    .safeParse(await c.req.json());
  if (!input.success) throw invalid();
  const ip = await sha256(
    `${c.env.IP_HASH_SALT ?? 'local'}:${c.req.header('CF-Connecting-IP') ?? 'local'}`,
  );
  const window = String(Math.floor(Date.now() / 900000));
  if (
    !(await reserveBudget(c.env.DB, `login:${ip}`, 5, window)) ||
    !(await reserveBudget(c.env.DB, 'login:global', 30, window))
  ) {
    c.header('Retry-After', '900');
    throw new ApiError(
      429,
      'login_limited',
      'Too many sign-in attempts. Try again in 15 minutes.',
    );
  }
  const matches = await passwordMatches(
    input.data.password,
    c.env.ADMIN_PASSWORD_HASH,
  );
  if (
    !matches ||
    input.data.email.toLowerCase() !== c.env.ADMIN_EMAIL.toLowerCase()
  )
    throw new ApiError(
      401,
      'invalid_credentials',
      'Email or password is incorrect.',
    );
  const previous = getCookie(c, cookieName(c.env));
  if (previous)
    await c.env.DB.prepare('DELETE FROM admin_sessions WHERE token_hash=?')
      .bind(await sha256(previous))
      .run();
  const token = await createSession(c.env);
  setCookie(c, cookieName(c.env), token, {
    httpOnly: true,
    secure: c.env.ENVIRONMENT === 'production',
    sameSite: 'Strict',
    path: '/',
    maxAge: SESSION_SECONDS,
  });
  return c.json({ authenticated: true, email: c.env.ADMIN_EMAIL });
});
authRoutes.post('/logout', async (c) => {
  const token = getCookie(c, cookieName(c.env));
  if (token)
    await c.env.DB.prepare('DELETE FROM admin_sessions WHERE token_hash=?')
      .bind(await sha256(token))
      .run();
  deleteCookie(c, cookieName(c.env), {
    path: '/',
    secure: c.env.ENVIRONMENT === 'production',
    sameSite: 'Strict',
    httpOnly: true,
  });
  return c.json({ authenticated: false, email: null });
});
