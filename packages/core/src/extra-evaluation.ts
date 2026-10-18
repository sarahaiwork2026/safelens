import fixtures from '../fixtures/test-reports-extra.json';
import { FAMILY } from './lexicon';
import type { Analysis } from './schema';
import type { ExtraEvaluationStep } from './api';
export const EXTRA_FIXTURES = fixtures;
export function compareExtra(
  reportId: string,
  analysis: Analysis,
  now: number,
  ai: boolean,
): ExtraEvaluationStep {
  const expected = fixtures.reports.find((r) => r.id === reportId)?.expected;
  if (!expected) throw new Error('Unknown evaluation fixture');
  const differences: string[] = [],
    observations: string[] = [];
  if (analysis.status !== expected.status)
    differences.push(`status: ${analysis.status}, expected ${expected.status}`);
  if (analysis.status === 'rejected') {
    if (expected.code && analysis.code !== expected.code)
      differences.push(`code: ${analysis.code}, expected ${expected.code}`);
    return {
      reportId,
      status: analysis.status,
      extraction: null,
      code: analysis.code,
      missing: [],
      pass: !differences.length,
      differences,
      observations,
    };
  }
  const x = analysis.extraction;
  if (expected.language && x.language !== expected.language)
    differences.push(`language: ${x.language}, expected ${expected.language}`);
  if (expected.type && x.type !== expected.type) {
    const sameFamily =
      x.type !== 'unclear' &&
      expected.type !== 'unclear' &&
      FAMILY[x.type][0] === FAMILY[expected.type as keyof typeof FAMILY][0];
    if (!ai || !sameFamily)
      differences.push(`type: ${x.type}, expected ${expected.type}`);
    else
      observations.push(
        `type: ${x.type}, expected ${expected.type}, same family`,
      );
  }
  const report = (message: string) => {
    if (ai) observations.push(message);
    else differences.push(message);
  };
  for (const key of ['severity', 'areaId'] as const)
    if (key in expected && x[key] !== expected[key])
      report(`${key}: ${String(x[key])}, expected ${String(expected[key])}`);
  if (
    expected.claims &&
    JSON.stringify([...x.claims].sort()) !==
      JSON.stringify([...expected.claims].sort())
  )
    report(
      `claims: ${x.claims.join(', ')}, expected ${expected.claims.join(', ')}`,
    );
  if (
    expected.missing &&
    JSON.stringify(analysis.missing) !== JSON.stringify(expected.missing)
  )
    report('Missing fields differ');
  if (
    expected.minutesAgo !== undefined &&
    x.occurredAt !== now - expected.minutesAgo * 60000
  )
    report('Relative time differs');
  if (expected.occurredAt && x.occurredAt !== Date.parse(expected.occurredAt))
    report('Clock time differs');
  for (const word of expected.forbiddenWords ?? [])
    if (
      [x.summary, x.recommendedAction, x.severityReason].some((text) =>
        text.toLowerCase().includes(word.toLowerCase()),
      )
    )
      differences.push(`Output contains forbidden word: ${word}`);
  return {
    reportId,
    status: analysis.status,
    extraction: x,
    code: null,
    missing: analysis.missing,
    pass: !differences.length,
    differences,
    observations,
  };
}
