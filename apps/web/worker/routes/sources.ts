import { Hono } from 'hono';
import { z } from 'zod';
import { redact, sanitize } from 'core';
import type { Env } from '../env';
import { ApiError, invalid } from '../services/errors';
import { sourcesFor } from '../db/sources';

export function officialUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      !url.port &&
      ['gov.pk', 'gos.pk', 'edhi.org', 'chhipa.org'].some(
        (host) => url.hostname === host || url.hostname.endsWith(`.${host}`),
      )
    );
  } catch {
    return false;
  }
}
const input = z
  .object({
    title: z.string().trim().min(3).max(180),
    url: z.string().url().max(1000).refine(officialUrl),
    summary: z.string().trim().min(10).max(600),
    publishedAt: z.number().int().positive(),
  })
  .strict();
export const sourceRoutes = new Hono<{ Bindings: Env }>();
sourceRoutes.post('/:ref/sources', async (c) => {
  const data = input.safeParse(await c.req.json());
  if (!data.success || data.data.publishedAt > Date.now()) throw invalid();
  const row = await c.env.DB.prepare(
    "SELECT id,is_demo FROM incidents WHERE dataset='live' AND ref=?",
  )
    .bind(Number(c.req.param('ref')))
    .first<{ id: string; is_demo: number }>();
  if (!row) throw new ApiError(404, 'not_found', 'Incident not found.');
  if (row.is_demo)
    throw new ApiError(
      422,
      'demo_source',
      'Attach official sources only to public reports.',
    );
  const { title, url, summary, publishedAt } = data.data;
  const result = await c.env.DB.prepare(
    'INSERT INTO official_sources(id,incident_id,title,url,summary,published_at,reviewed_at) SELECT ?,?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM official_sources WHERE incident_id=?)<5',
  )
    .bind(
      crypto.randomUUID(),
      row.id,
      redact(sanitize(title)),
      url,
      redact(sanitize(summary)),
      publishedAt,
      Date.now(),
      row.id,
    )
    .run();
  if (!result.meta.changes)
    throw new ApiError(
      422,
      'source_limit',
      'Keep up to five official references per incident.',
    );
  await c.env.DB.prepare('UPDATE incidents SET updated_at=? WHERE id=?')
    .bind(Date.now(), row.id)
    .run();
  return c.json(await sourcesFor(c.env.DB, row.id));
});
sourceRoutes.delete('/:ref/sources/:id', async (c) => {
  const result = await c.env.DB.prepare(
    "DELETE FROM official_sources WHERE id=? AND incident_id IN (SELECT id FROM incidents WHERE dataset='live' AND ref=?)",
  )
    .bind(c.req.param('id'), Number(c.req.param('ref')))
    .run();
  if (!result.meta.changes)
    throw new ApiError(404, 'not_found', 'Source not found.');
  return c.body(null, 204);
});
