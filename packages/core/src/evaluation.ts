import fixtures from '../fixtures/test-reports.json';
import type { ExtractionData } from './schema';
import type { TestStepResult, IncidentDetail, TestRunView } from './api';
export const BASE_FIXTURES = fixtures;
export function compareReport(
  reportId: string,
  x: ExtractionData,
  outcome: TestStepResult['outcome'],
  missing: string[],
  ai = false,
): string[] {
  const expected = fixtures.reports.find((r) => r.id === reportId)?.expected;
  if (!expected) return ['Unknown fixture'];
  const differences: string[] = [];
  for (const key of ['language', 'areaId', 'type', 'severity'] as const) {
    if (
      ai &&
      key === 'severity' &&
      Math.abs(x.severity - expected.severity) <= 1
    )
      continue;
    if (x[key] !== expected[key])
      differences.push(
        `${key}: ${String(x[key])}, expected ${String(expected[key])}`,
      );
  }
  if (
    !ai &&
    JSON.stringify([...x.claims].sort()) !==
      JSON.stringify([...expected.claims].sort())
  )
    differences.push(
      `claims: ${x.claims.join(', ')}, expected ${expected.claims.join(', ')}`,
    );
  if (outcome !== expected.outcome)
    differences.push(`outcome: ${outcome}, expected ${expected.outcome}`);
  if (
    JSON.stringify([...missing].sort()) !==
    JSON.stringify([...(expected.missing ?? [])].sort())
  )
    differences.push('Missing fields differ');
  return differences;
}
export function evaluateRun(
  id: string,
  engine: 'rules' | 'ai',
  baseTime: number,
  results: TestStepResult[],
  details: IncidentDetail[],
): TestRunView {
  const threads = details.map((detail) => {
    const steps = results.filter((r) => r.incidentRef === detail.incident.ref),
      reportIds = steps.map((r) => r.reportId);
    const expected = fixtures.threads.find((t) =>
      t.reports.includes(reportIds[0] ?? ''),
    );
    const differences: string[] = [];
    if (expected) {
      for (const k of ['type', 'severity', 'status'] as const)
        if (detail.incident[k] !== expected[k])
          differences.push(
            `${k}: ${detail.incident[k]}, expected ${expected[k]}`,
          );
      if (
        JSON.stringify([...reportIds].sort()) !==
        JSON.stringify([...expected.reports].sort())
      )
        differences.push('Reports differ');
      const labels = detail.labels
        .map((l) =>
          JSON.stringify({
            kind: l.kind,
            claim: l.claim,
            count: l.count,
            ...(l.opposing ? { opposing: l.opposing } : {}),
          }),
        )
        .sort();
      if (
        JSON.stringify(labels) !==
        JSON.stringify(expected.labels.map((l) => JSON.stringify(l)).sort())
      )
        differences.push('Evidence labels differ');
    } else differences.push('Unexpected thread');
    return {
      cluster: expected?.cluster ?? null,
      detail,
      reportIds,
      pass: !differences.length,
      differences,
    };
  });
  const stored = results.filter((r) => r.outcome !== 'held'),
    labels = details.flatMap((d) => d.labels);
  const coverage = [
    {
      label: 'Minor, moderate and major incidents',
      pass: [1, 2, 3].every((s) =>
        stored.some((r) => r.extraction.severity === s),
      ),
    },
    {
      label: 'English, Urdu, Roman Urdu and mixed language',
      pass: ['English', 'Urdu', 'Roman Urdu', 'Mixed'].every((l) =>
        results.some((r) => r.extraction.language === l),
      ),
    },
    {
      label: 'Duplicate and related reports grouped',
      pass: details.some((d) => d.incident.reportCount >= 2),
    },
    {
      label: 'Corroborating statements',
      pass: labels.some((l) => l.kind === 'supported'),
    },
    {
      label: 'Contradictory statements',
      pass: labels.some((l) => l.kind === 'contradictory'),
    },
    {
      label: 'Escalating incidents',
      pass: details.some((d) => d.timeline.some((t) => t.kind === 'escalated')),
    },
    {
      label: 'Missing or unclear location asked for',
      pass: results.some(
        (r) => r.outcome === 'held' && r.missing.includes('location'),
      ),
    },
  ];
  return {
    id,
    engine,
    baseTime,
    results,
    threads,
    totals: {
      stored: stored.length,
      held: results.length - stored.length,
      threads: threads.length,
      escalations: details
        .flatMap((d) => d.timeline)
        .filter((t) => t.kind === 'escalated').length,
    },
    coverage,
  };
}
