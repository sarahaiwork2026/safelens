import { Hono } from 'hono';
import { z } from 'zod';
import { AREAS, CONTACTS, CONTACTS_CHECKED, redact, sanitize } from 'core';
import type { ChatReply } from 'core';
import {
  CHAT_LANGUAGES,
  nearChatRoute,
} from '../../../../packages/core/src/chat';
import { CHAT_COPY } from '../../../../packages/core/src/chat-copy';
import type { Env } from '../env';
import { ApiError, invalid } from '../services/errors';
import { reserveBudget } from '../services/budget';
import { sha256 } from '../services/crypto';
import { planChat } from '../services/chat-plan';
import { sourcesFor } from '../db/sources';
import { incidentView } from '../db/rows';
import type { IncidentRow } from '../db/rows';

const input = z
  .object({
    message: z.string().trim().min(2).max(600),
    history: z.array(z.string().max(400)).max(3).default([]),
    language: z.enum(CHAT_LANGUAGES).optional(),
  })
  .strict();
export const chatRoutes = new Hono<{ Bindings: Env }>();
chatRoutes.post('/', async (c) => {
  const parsed = input.safeParse(await c.req.json());
  if (!parsed.success) throw invalid();
  const ip = await sha256(
    `${c.env.IP_HASH_SALT ?? 'local'}:${c.req.header('CF-Connecting-IP') ?? 'local'}`,
  );
  if (
    !(await reserveBudget(
      c.env.DB,
      `chat:ip:${ip}`,
      3,
      String(Math.floor(Date.now() / 60000)),
    )) ||
    !(await reserveBudget(
      c.env.DB,
      `chat:hour:${ip}`,
      20,
      String(Math.floor(Date.now() / 3600000)),
    ))
  ) {
    c.header('Retry-After', '60');
    throw new ApiError(
      429,
      'chat_limited',
      'Chat limit reached. Please try again later.',
    );
  }
  const text = redact(sanitize(parsed.data.message));
  const { plan, engine, limited } = await planChat(
    c.env,
    text,
    parsed.data.history.map((s) => redact(sanitize(s))),
    parsed.data.language,
  );
  const now = Date.now(),
    words = CHAT_COPY[plan.language];
  let rows: IncidentRow[] = [];
  if (plan.intent !== 'offtopic' && plan.areas.length) {
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM incidents WHERE dataset='live' AND (is_demo=1 OR updated_at>=?) ORDER BY is_demo ASC,updated_at DESC LIMIT 200",
    )
      .bind(now - 7 * 86400000)
      .all<IncidentRow>();
    rows = results
      .filter(
        (r) =>
          plan.areas.includes(r.area_id) ||
          (plan.intent === 'route' &&
            nearChatRoute({ lat: r.lat, lng: r.lng }, plan.areas)),
      )
      .filter(
        (r) =>
          plan.intent !== 'road' ||
          ['accident', 'hazard', 'fire'].includes(r.type),
      )
      .slice(0, 8);
  }
  const incidents = await Promise.all(
    rows.map(async (row) => {
      const i = incidentView(row);
      return {
        verification: 'unverified' as const,
        reportCount: i.reportCount,
        code: i.code,
        area: i.areaName,
        type: i.type,
        severity: i.severity,
        status: i.status,
        simulated: Boolean(i.simulated),
        updatedAt: i.updatedAt,
        lat: i.lat,
        lng: i.lng,
        evidence: i.evidence,
        sources: await sourcesFor(c.env.DB, row.id),
      };
    }),
  );
  const answer =
    plan.intent === 'offtopic'
      ? words.offtopic
      : plan.intent === 'guidance'
        ? `${words.guidance}${incidents.length ? ` ${words.found}` : ''}`
        : !plan.areas.length
          ? words.ask
          : incidents.length
            ? words.found
            : words.empty;
  const relevantContacts = plan.advice.includes('violence')
    ? ['police', 'rescue']
    : plan.advice.includes('gas') || plan.advice.includes('fire')
      ? ['rescue', 'fire']
      : ['police', 'rescue', 'edhi'];
  const reply: ChatReply = {
    answer,
    language: plan.language,
    incidents,
    areas: plan.areas.map((id) => AREAS.find((a) => a.id === id)?.name ?? id),
    advice:
      plan.intent === 'offtopic'
        ? []
        : [...new Set(['general' as const, ...plan.advice])].map(
            (key) => words[key],
          ),
    retrievedAt: now,
    engine,
    limited,
    routeApproximate: plan.intent === 'route',
    contacts: CONTACTS.filter((contact) =>
      relevantContacts.includes(contact.id),
    ).map((contact) => ({
      name: contact.name,
      number: contact.number,
      source: contact.source,
      checked: CONTACTS_CHECKED,
    })),
  };
  return c.json(reply);
});
