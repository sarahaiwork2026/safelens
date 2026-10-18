import { Hono } from 'hono';
import { z } from 'zod';
import {
  missingFields,
  AREAS,
  INCIDENT_TYPES,
  parseTime,
  summarize,
  GUIDANCE,
  severityFor,
  norm,
} from 'core';
import type { Env } from '../env';
import { invalid, ApiError } from '../services/errors';
import { configured, verifyTurnstile } from '../services/turnstile';
import { signDraft, verifyDraft } from '../services/draft-token';
import { storeReport } from '../db/write';
import { sha256 } from '../services/crypto';
import { analyzeWithChain } from '../extractors/chain';
import { geocode } from '../services/geocode';
const intake = z
  .object({
    text: z.string(),
    location: z.string().max(120).optional(),
    time: z.string().max(60).optional(),
    turnstileToken: z.string().max(4096).optional(),
  })
  .strict();
const follow = z
  .object({
    draft: z.string().max(12000),
    answers: z
      .object({
        type: z.enum(INCIDENT_TYPES).optional(),
        areaId: z.string().optional(),
        time: z.string().max(60).optional(),
      })
      .strict(),
  })
  .strict();
export const reportRoutes = new Hono<{ Bindings: Env }>();
reportRoutes.post('/', async (c) => {
  if (!configured(c.env))
    throw new ApiError(
      503,
      'unavailable',
      'Report submission is not configured.',
    );
  const limited = await c.env.REPORT_LIMITER.limit({
    key: await sha256(
      `${c.env.IP_HASH_SALT ?? 'local'}:${c.req.header('CF-Connecting-IP') ?? 'local'}`,
    ),
  });
  if (!limited.success) {
    c.header('Retry-After', '60');
    throw new ApiError(
      429,
      'rate_limited',
      'Too many reports from this connection. Try again in a minute.',
    );
  }
  const body: unknown = await c.req.json();
  const followup = follow.safeParse(body);
  if (followup.success) {
    const draft = await verifyDraft(followup.data.draft, c.env.DRAFT_SECRET),
      x = draft.extraction,
      a = followup.data.answers;
    if (a.type) {
      if (a.type === 'unclear')
        throw new ApiError(422, 'invalid_answer', 'Choose an incident type.');
      x.type = a.type;
      x.severity = severityFor(a.type, x.claims, norm(draft.text));
      x.recommendedAction = GUIDANCE[a.type];
      x.confidence.type = 1;
    }
    if (a.areaId) {
      const area = AREAS.find((area) => area.id === a.areaId);
      if (!area) throw new ApiError(422, 'invalid_answer', 'Choose an area.');
      x.areaId = area.id;
      x.lat = area.lat;
      x.lng = area.lng;
      x.locationText = area.name;
      x.confidence.location = 1;
    }
    if (a.time) {
      const time = parseTime(a.time, Date.now());
      if (!time)
        throw new ApiError(
          422,
          'invalid_answer',
          'Use a time within the last 24 hours.',
        );
      x.occurredAt = time.occurredAt ?? Date.now() - time.minutesAgo * 60000;
      x.timeText = a.time;
      x.confidence.time = 1;
    }
    x.summary = summarize(x);
    const missing = missingFields(x);
    if (missing.length)
      return c.json({
        status: 'needs_info',
        missing,
        understood: x,
        draft: await signDraft(draft.text, x, c.env.DRAFT_SECRET),
      });
    return c.json(
      await storeReport(c.env.DB, {
        status: 'ok',
        extraction: x,
        missing,
        stored: draft.text,
      }),
    );
  }
  const parsed = intake.safeParse(body);
  if (!parsed.success) throw invalid();
  const data = parsed.data;
  await verifyTurnstile(c.env, data.turnstileToken);
  const analysis = await analyzeWithChain(c.env, data.text, {
    ...(data.location ? { location: data.location } : {}),
    ...(data.time ? { time: data.time } : {}),
  });
  if (analysis.status === 'rejected')
    throw new ApiError(
      422,
      analysis.code,
      analysis.code === 'accusation'
        ? 'Describe the event without naming or labelling people.'
        : 'Check the report length and try again.',
    );
  if (!analysis.extraction.areaId && data.location) {
    const point = await geocode(c.env, data.location);
    if (point) {
      Object.assign(analysis.extraction, {
        areaId: point.area.id,
        lat: point.lat,
        lng: point.lng,
      });
      analysis.extraction.summary = summarize(analysis.extraction);
    }
  }
  const missing = missingFields(analysis.extraction);
  if (missing.length)
    return c.json({
      status: 'needs_info',
      missing,
      understood: analysis.extraction,
      draft: await signDraft(
        analysis.stored,
        analysis.extraction,
        c.env.DRAFT_SECRET,
      ),
    });
  return c.json(
    await storeReport(c.env.DB, { ...analysis, status: 'ok', missing }),
  );
});
