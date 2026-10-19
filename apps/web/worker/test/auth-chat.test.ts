import { expect, it, vi, inject } from 'vitest';
import type { ChatReply, IncidentDetail } from 'core';
import { analyzeReport } from 'core';
import app from '../index';
import { bindings, TEST_PASSWORD, adminCookie } from './setup';
import { storeReport } from '../db/write';
import { sha256 } from '../services/crypto';
import { passwordMatches } from '../services/auth';
const origin = 'https://safelens.test';
function request(
  path: string,
  body?: unknown,
  cookie?: string,
  method = 'POST',
) {
  return app.request(
    origin + path,
    {
      method: body === undefined ? 'GET' : method,
      headers: {
        Origin: origin,
        'Content-Type': 'application/json',
        ...(cookie ? { Cookie: cookie } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    },
    bindings,
  );
}
async function seed() {
  await bindings.DB.exec(
    inject('seed')
      .split('\n')
      .filter((line) => !line.startsWith('--'))
      .join(' '),
  );
}

it('protects every dashboard API while leaving chat and intake available', async () => {
  for (const path of [
    '/api/incidents',
    '/api/incidents/1',
    '/api/test-runs/fake',
  ])
    expect((await request(path)).status).toBe(401);
  expect(
    (
      await request(
        '/api/incidents/1',
        { status: 'resolved' },
        undefined,
        'PATCH',
      )
    ).status,
  ).toBe(401);
  expect((await request('/api/test-runs', { engine: 'rules' })).status).toBe(
    401,
  );
  for (const path of ['/incidents', '/incidents/1', '/map', '/test-lab']) {
    const response = await request(path);
    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toMatch(/^\/login\?next=/);
  }
  expect(
    (await request('/api/chat', { message: 'Gas leak in Korangi' })).status,
  ).toBe(200);
});

it('logs in with secure opaque cookies, rejects wrong credentials and revokes logout', async () => {
  expect(
    await passwordMatches('wrong', bindings.ADMIN_PASSWORD_HASH ?? ''),
  ).toBe(false);
  expect(
    (
      await request('/api/auth/login', {
        email: 'wrong@example.com',
        password: TEST_PASSWORD,
      })
    ).status,
  ).toBe(401);
  const response = await request('/api/auth/login', {
    email: bindings.ADMIN_EMAIL,
    password: TEST_PASSWORD,
  });
  expect(response.status).toBe(200);
  const setCookie = response.headers.get('Set-Cookie') ?? '';
  expect(setCookie).toContain('HttpOnly');
  expect(setCookie).toContain('SameSite=Strict');
  const cookie = setCookie.split(';')[0] ?? '';
  expect((await request('/api/incidents', undefined, cookie)).status).toBe(200);
  expect(
    (await request('/api/incidents', undefined, 'safelens_admin=forged'))
      .status,
  ).toBe(401);
  await request('/api/auth/logout', {}, cookie);
  expect((await request('/api/incidents', undefined, cookie)).status).toBe(401);
});

it('expires sessions, rejects credential rotations and rate limits login guesses', async () => {
  const token = adminCookie.split('=')[1] ?? '';
  expect(
    (
      await app.request(
        origin + '/api/incidents',
        {
          headers: { Cookie: adminCookie },
        },
        { ...bindings, ADMIN_EMAIL: 'rotated@example.com' },
      )
    ).status,
  ).toBe(401);
  await bindings.DB.prepare(
    'UPDATE admin_sessions SET expires_at=0 WHERE token_hash=?',
  )
    .bind(await sha256(token))
    .run();
  expect((await request('/api/incidents', undefined, adminCookie)).status).toBe(
    401,
  );
  for (let i = 0; i < 5; i++)
    expect(
      (
        await request('/api/auth/login', {
          email: bindings.ADMIN_EMAIL,
          password: 'incorrect',
        })
      ).status,
    ).toBe(401);
  const limited = await request('/api/auth/login', {
    email: bindings.ADMIN_EMAIL,
    password: TEST_PASSWORD,
  });
  expect(limited.status).toBe(429);
  expect(limited.headers.get('Retry-After')).toBe('900');
});

it('returns real multilingual demo summaries without raw reports or fabricated safety claims', async () => {
  await seed();
  for (const [message, language] of [
    ['Any reports in Clifton?', 'English'],
    ['کلفٹن میں کیا خطرہ ہے؟', 'Urdu'],
    ['Clifton ka rasta mehfooz hai?', 'Roman Urdu'],
  ]) {
    const response = await request('/api/chat', { message });
    expect(response.status).toBe(200);
    const data = await response.json<ChatReply>();
    expect(data.language).toBe(language);
    expect(data.incidents[0]?.area).toBe('Clifton');
    expect(data.incidents[0]?.simulated).toBe(true);
    expect(data.incidents[0]?.reportCount).toBe(5);
    expect(data.incidents[0]?.sources).toEqual([]);
    expect(JSON.stringify(data)).not.toContain('Two men on a motorbike');
    expect(
      data.contacts.every((c) =>
        c.source.startsWith('https://karachipolice.gov.pk/'),
      ),
    ).toBe(true);
  }
  expect(
    (await request('/api/chat', { message: 'One more question' })).status,
  ).toBe(429);
});

it('handles no-data, roads, route approximations and dangerous situations with local guidance', async () => {
  const empty = await (
    await request('/api/chat', { message: 'Is Garden East safe?' })
  ).json<ChatReply>();
  expect(empty.answer).toContain('does not mean');
  expect(empty.incidents).toEqual([]);
  const route = await (
    await request('/api/chat', { message: 'Traffic from Clifton to Saddar' })
  ).json<ChatReply>();
  expect(route.routeApproximate).toBe(true);
  const gas = await (
    await request('/api/chat', { message: 'I smell gas in Korangi' })
  ).json<ChatReply>();
  expect(gas.advice.join(' ')).toContain('Do not light a flame');
  expect(gas.contacts.map((c) => c.number)).toContain('1122');
});

it('uses Groq only for a validated plan, redacts inputs and falls back on provider errors', async () => {
  const mock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    Response.json({
      choices: [
        {
          message: {
            content: JSON.stringify({
              intent: 'area',
              language: 'English',
              areas: ['clifton'],
              advice: ['travel'],
            }),
          },
        },
      ],
    }),
  );
  const env = {
    ...bindings,
    GROQ_API_KEY: 'test-key',
    EXTRACTOR_CHAIN: 'groq,rules',
  };
  const response = await app.request(
    origin + '/api/chat',
    {
      method: 'POST',
      headers: { Origin: origin, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Is Clifton safe? Call 0300-1234567' }),
    },
    env,
  );
  expect((await response.json<ChatReply>()).engine).toBe('groq');
  expect(String(mock.mock.calls[0]?.[1]?.body)).not.toContain('0300-1234567');
  mock.mockResolvedValue(new Response('', { status: 429 }));
  const limited = await app.request(
    origin + '/api/chat',
    {
      method: 'POST',
      headers: { Origin: origin, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Clifton updates' }),
    },
    env,
  );
  expect(await limited.json<ChatReply>()).toMatchObject({
    engine: 'rules',
    limited: true,
  });
  mock.mockRestore();
});

it('allows only the admin to attach real official references and exposes bounded citations to chat', async () => {
  const analysis = analyzeReport(
    'Gas leak smell in Korangi right now',
    {},
    Date.now(),
  );
  if (analysis.status !== 'ok') throw new Error('Invalid fixture');
  const report = await storeReport(bindings.DB, analysis);
  const path = `/api/incidents/${report.incident.ref}/sources`;
  const source = {
    title: 'Official emergency contact directory',
    url: 'https://karachipolice.gov.pk/?p=46',
    summary:
      'Official emergency contacts are available here. This reference does not confirm the reported incident.',
    publishedAt: Date.now() - 1000,
  };
  expect((await request(path, source)).status).toBe(401);
  expect(
    (
      await request(
        path,
        { ...source, url: 'https://karachipolice.gov.pk.evil.test/' },
        adminCookie,
      )
    ).status,
  ).toBe(400);
  expect((await request(path, source, adminCookie)).status).toBe(200);
  const detail = await (
    await request(
      `/api/incidents/${report.incident.ref}`,
      undefined,
      adminCookie,
    )
  ).json<IncidentDetail>();
  expect(detail.sources).toHaveLength(1);
  const chat = await (
    await request('/api/chat', { message: 'Road hazards in Korangi?' })
  ).json<ChatReply>();
  expect(chat.incidents[0]?.sources[0]?.url).toBe(source.url);
  expect(chat.incidents[0]?.simulated).toBe(false);
  expect(chat.answer).toContain('unverified');
});
