import { extraResults, extraStep, extraOrder } from './extra-evaluation';
import { Hono } from 'hono';
import { z } from 'zod';
import type { TestStepResult } from 'core';
import { BASE_FIXTURES, compareReport, evaluateRun } from 'core/evaluation';
import type { Env } from '../env';
import { ApiError, invalid } from '../services/errors';
import { storeReport } from '../db/write';
import { detail } from '../db/read';
import { analyzeWithChain } from '../extractors/chain';
import { reserveBudget } from '../services/budget';
interface RunRow {
  id: string;
  engine: 'rules' | 'ai';
  base_time: number;
  created_at: number;
  results: string;
}
export const testRoutes = new Hono<{ Bindings: Env }>();
async function getRun(db: D1Database, id: string) {
  const row = await db
    .prepare('SELECT * FROM test_runs WHERE id=?')
    .bind(id)
    .first<RunRow>();
  if (!row) throw new ApiError(404, 'not_found', 'Test run not found.');
  return row;
}
function readResults(row: RunRow): TestStepResult[] {
  return JSON.parse(row.results) as TestStepResult[];
}
const order = [...BASE_FIXTURES.reports]
  .sort((a, b) => b.minutesAgo - a.minutesAgo)
  .map((r) => r.id);
testRoutes.post('/', async (c) => {
  const input = z
    .object({
      engine: z.enum(['rules', 'ai']),
      suite: z.enum(['base', 'extra']).optional(),
    })
    .strict()
    .safeParse(await c.req.json());
  if (!input.success) throw invalid();
  if (input.data.engine === 'ai') {
    if (!c.env.GROQ_API_KEY && !c.env.GEMINI_API_KEY)
      throw new ApiError(503, 'unavailable', 'Add a Groq key to enable AI.');
    if (!(await reserveBudget(c.env.DB, 'testrun:ai', 20))) {
      c.header('Retry-After', '3600');
      throw new ApiError(
        429,
        'rate_limited',
        'The daily AI test limit has been reached.',
      );
    }
  }
  const cutoff = Date.now() - 3600000;
  await c.env.DB.batch([
    c.env.DB.prepare(
      "DELETE FROM incidents WHERE dataset IN (SELECT 'test:'||id FROM test_runs WHERE created_at<?)",
    ).bind(cutoff),
    c.env.DB.prepare('DELETE FROM test_runs WHERE created_at<?').bind(cutoff),
  ]);
  const id = `${input.data.suite === 'extra' ? 'extra-' : ''}${crypto.randomUUID()}`,
    now = Date.now();
  await c.env.DB.prepare(
    'INSERT INTO test_runs (id,engine,base_time,created_at,results) VALUES (?,?,?,?,?)',
  )
    .bind(id, input.data.engine, now, now, '[]')
    .run();
  return c.json({
    runId: id,
    baseTime: now,
    order: input.data.suite === 'extra' ? extraOrder : order,
  });
});
testRoutes.post('/:id/steps', async (c) => {
  const input = z
    .object({ reportId: z.string() })
    .strict()
    .safeParse(await c.req.json());
  if (!input.success) throw invalid();
  const run = await getRun(c.env.DB, c.req.param('id'));
  if (run.id.startsWith('extra-'))
    return c.json(await extraStep(c.env, run, input.data.reportId));
  const results = readResults(run),
    existing = results.find((r) => r.reportId === input.data.reportId);
  if (existing) return c.json(existing);
  if (order[results.length] !== input.data.reportId)
    throw new ApiError(
      409,
      'invalid_order',
      'Process reports in the supplied order.',
    );
  const fixture = BASE_FIXTURES.reports.find(
    (r) => r.id === input.data.reportId,
  );
  if (!fixture) throw invalid();
  const analysis = await analyzeWithChain(
    c.env,
    fixture.text,
    { time: `${fixture.minutesAgo} minutes ago` },
    run.base_time,
    run.engine,
  );
  if (analysis.status === 'rejected') throw new Error('Fixture rejected');
  let incidentRef: number | null = null,
    outcome: TestStepResult['outcome'] = 'held';
  if (!analysis.missing.length) {
    const stored = await storeReport(c.env.DB, analysis, `test:${run.id}`);
    incidentRef = stored.incident.ref;
    outcome = stored.outcome === 'added' ? 'grouped' : stored.outcome;
  }
  const differences = compareReport(
    fixture.id,
    analysis.extraction,
    outcome,
    analysis.missing,
    run.engine === 'ai',
  );
  const result: TestStepResult = {
    reportId: fixture.id,
    outcome,
    extraction: analysis.extraction,
    missing: analysis.missing,
    incidentRef,
    pass: !differences.length,
    differences,
  };
  results.push(result);
  await c.env.DB.prepare('UPDATE test_runs SET results=? WHERE id=?')
    .bind(JSON.stringify(results), run.id)
    .run();
  return c.json(result);
});
testRoutes.get('/:id', async (c) => {
  const row = await getRun(c.env.DB, c.req.param('id'));
  if (row.id.startsWith('extra-')) return c.json(extraResults(row));
  const results = readResults(row);
  const { results: refs } = await c.env.DB.prepare(
    'SELECT ref FROM incidents WHERE dataset=? ORDER BY ref',
  )
    .bind(`test:${row.id}`)
    .all<{ ref: number }>();
  const details = await Promise.all(
    refs.map((r) => detail(c.env.DB, r.ref, `test:${row.id}`)),
  );
  return c.json(
    evaluateRun(row.id, row.engine, row.base_time, results, details),
  );
});
testRoutes.delete('/:id', async (c) => {
  const row = await getRun(c.env.DB, c.req.param('id'));
  await c.env.DB.batch([
    c.env.DB.prepare('DELETE FROM incidents WHERE dataset=?').bind(
      `test:${row.id}`,
    ),
    c.env.DB.prepare('DELETE FROM test_runs WHERE id=?').bind(row.id),
  ]);
  return c.body(null, 204);
});
