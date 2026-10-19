import { getCookie } from 'hono/cookie';
import type { Context } from 'hono';
import { createMiddleware } from 'hono/factory';
import type { Env } from '../env';
import { base64url, unbase64, sha256 } from './crypto';
import { ApiError } from './errors';

export const SESSION_SECONDS = 8 * 60 * 60;
export const cookieName = (env: Env) =>
  env.ENVIRONMENT === 'production' ? '__Host-safelens_admin' : 'safelens_admin';

export async function hashPassword(
  password: string,
  salt = crypto.getRandomValues(new Uint8Array(24)),
) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  // Workers Web Crypto supports at most 100,000 PBKDF2 iterations per derivation.
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    key,
    256,
  );
  return `pbkdf2-sha256$100000$${base64url(salt)}$${base64url(new Uint8Array(derived))}`;
}

export async function passwordMatches(password: string, encoded: string) {
  if (!/^pbkdf2-sha256\$100000\$[\w-]{32}\$[\w-]{43}$/.test(encoded))
    return false;
  const salt = encoded.split('$')[2];
  if (!salt) return false;
  const actual = await hashPassword(password, unbase64(salt));
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(encoded),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(actual),
  );
  return crypto.subtle.verify(
    'HMAC',
    key,
    signature,
    new TextEncoder().encode(encoded),
  );
}

async function credentialVersion(env: Env) {
  return sha256(`${env.ADMIN_EMAIL}:${env.ADMIN_PASSWORD_HASH}`);
}

export async function createSession(env: Env) {
  const token = base64url(crypto.getRandomValues(new Uint8Array(32)));
  await env.DB.batch([
    env.DB.prepare('DELETE FROM admin_sessions WHERE expires_at<=?').bind(
      Date.now(),
    ),
    env.DB.prepare(
      'INSERT INTO admin_sessions(token_hash,expires_at,credential_version) VALUES (?,?,?)',
    ).bind(
      await sha256(token),
      Date.now() + SESSION_SECONDS * 1000,
      await credentialVersion(env),
    ),
  ]);
  return token;
}

export async function authenticated(c: Context<{ Bindings: Env }>) {
  const token = getCookie(c, cookieName(c.env));
  if (
    !c.env.ADMIN_EMAIL ||
    !c.env.ADMIN_PASSWORD_HASH ||
    !token ||
    !/^[\w-]{43}$/.test(token)
  )
    return false;
  const session = await c.env.DB.prepare(
    'SELECT credential_version FROM admin_sessions WHERE token_hash=? AND expires_at>?',
  )
    .bind(await sha256(token), Date.now())
    .first<{ credential_version: string }>();
  return session?.credential_version === (await credentialVersion(c.env));
}

export const requireAdmin = createMiddleware<{ Bindings: Env }>(
  async (c, next) => {
    if (!(await authenticated(c)))
      throw new ApiError(401, 'unauthorized', 'Sign in as the administrator.');
    await next();
    c.header('Cache-Control', 'private, no-store');
  },
);
