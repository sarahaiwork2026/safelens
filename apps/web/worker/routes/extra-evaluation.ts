import type { ExtraEvaluationStep, ExtraRunView } from 'core';
import { EXTRA_FIXTURES, compareExtra } from 'core/extra-evaluation';
import type { Env } from '../env';
import { analyzeWithChain } from '../extractors/chain';
import { ApiError, invalid } from '../services/errors';
interface ExtraRow {
  id: string;
  engine: 'rules' | 'ai';
  results: string;
}
export function extraResults(row: ExtraRow): ExtraRunView {
  return {
    id: row.id,
    suite: 'extra',
    engine: row.engine,
    results: JSON.parse(row.results) as ExtraEvaluationStep[],
  };
}
export async function extraStep(
  env: Env,
  row: ExtraRow,
  reportId: string,
): Promise<ExtraEvaluationStep> {
  const results = extraResults(row).results,
    existing = results.find((r) => r.reportId === reportId);
  if (existing) return existing;
  if (EXTRA_FIXTURES.reports[results.length]?.id !== reportId)
    throw new ApiError(
      409,
      'invalid_order',
      'Process reports in the supplied order.',
    );
  const fixture = EXTRA_FIXTURES.reports.find((r) => r.id === reportId);
  if (!fixture) throw invalid();
  const now = Date.parse(fixture.now ?? EXTRA_FIXTURES.defaultNow),
    analysis = await analyzeWithChain(
      env,
      fixture.text,
      fixture.form,
      now,
      row.engine,
    ),
    result = compareExtra(reportId, analysis, now, row.engine === 'ai');
  results.push(result);
  await env.DB.prepare('UPDATE test_runs SET results=? WHERE id=?')
    .bind(JSON.stringify(results), row.id)
    .run();
  return result;
}
export const extraOrder = EXTRA_FIXTURES.reports.map((r) => r.id);
