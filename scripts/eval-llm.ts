import { appendFile } from 'node:fs/promises';
import type {
  Health,
  TestRunCreated,
  TestRunView,
  ExtraRunView,
} from '../packages/core/src';
import { BASE_FIXTURES } from '../packages/core/src/evaluation';
const target = process.env.SAFELENS_TARGET ?? 'http://127.0.0.1:5173';
let adminCookie = '';
async function request<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(
    target + path,
    body === undefined
      ? { headers: { Cookie: adminCookie } }
      : {
          method: 'POST',
          headers: {
            Origin: new URL(target).origin,
            'Content-Type': 'application/json',
            Cookie: adminCookie,
          },
          body: JSON.stringify(body),
        },
  );
  if (!response.ok)
    throw new Error(`Evaluation request failed: ${response.status}`);
  return response.json() as Promise<T>;
}
async function runSuite(suite: 'base' | 'extra') {
  const run = await request<TestRunCreated>('/api/test-runs', {
    engine: 'ai',
    suite,
  });
  for (const reportId of run.order) {
    await request(`/api/test-runs/${run.runId}/steps`, { reportId });
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
  return run.runId;
}
const health = await request<Health>('/api/health');
const email = process.env.SAFELENS_ADMIN_EMAIL,
  password = process.env.SAFELENS_ADMIN_PASSWORD;
if (!email || !password)
  throw new Error(
    'Set SAFELENS_ADMIN_EMAIL and SAFELENS_ADMIN_PASSWORD securely, or run Test Lab after signing in through the browser.',
  );
const login = await fetch(target + '/api/auth/login', {
  method: 'POST',
  headers: {
    Origin: new URL(target).origin,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ email, password }),
});
if (!login.ok)
  throw new Error(`Admin sign-in failed with HTTP ${login.status}.`);
adminCookie = login.headers.get('Set-Cookie')?.split(';')[0] ?? '';
if (!health.engines.groq && !health.engines.gemini)
  throw new Error(
    'Configure a Groq or Gemini key securely before live AI evaluation.',
  );
const baseId = await runSuite('base'),
  result = await request<TestRunView>(`/api/test-runs/${baseId}`);
const scores = {
  type: 0,
  severity: 0,
  outcome: 0,
  language: 0,
  area: 0,
  provider: 0,
};
for (const r of result.results) {
  const e = BASE_FIXTURES.reports.find((f) => f.id === r.reportId)?.expected;
  if (!e) continue;
  if (e.type === r.extraction.type) scores.type++;
  if (Math.abs(e.severity - r.extraction.severity) <= 1) scores.severity++;
  if (e.outcome === r.outcome) scores.outcome++;
  if (e.language === r.extraction.language) scores.language++;
  if (e.areaId === r.extraction.areaId) scores.area++;
  if (r.extraction.engine !== 'rules') scores.provider++;
}
const extraId = await runSuite('extra'),
  extra = await request<ExtraRunView>(`/api/test-runs/${extraId}`);
const providerExtra = extra.results.filter(
    (r) => r.extraction?.engine !== 'rules' && r.extraction !== null,
  ).length,
  expectedProviderExtra = extra.results.filter(
    (r) => r.extraction !== null,
  ).length;
const passed =
  scores.type >= 23 &&
  scores.severity === 25 &&
  scores.outcome >= 23 &&
  scores.language === 25 &&
  scores.area === 25 &&
  scores.provider === 25 &&
  extra.results.length === 26 &&
  extra.results.every((r) => r.pass) &&
  providerExtra === expectedProviderExtra;
const models = [
  ...new Set([
    ...result.results.map((r) => r.extraction.model ?? r.extraction.engine),
    ...extra.results.flatMap((r) =>
      r.extraction ? [r.extraction.model ?? r.extraction.engine] : [],
    ),
  ]),
];
const details = extra.results
  .map(
    (r) =>
      `${r.reportId}: ${r.pass ? 'pass' : 'fail'}${r.differences.length ? `; ${r.differences.join('; ')}` : ''}${r.observations.length ? `; observed ${r.observations.join('; ')}` : ''}`,
  )
  .join('\n');
const record = `\n## ${new Date().toISOString()}\n\nModels: ${models.join(', ')}\n\nBase scores: ${JSON.stringify(scores)}\n\nExtra cases: ${extra.results.filter((r) => r.pass).length}/26; AI used for ${providerExtra}/${expectedProviderExtra} non-rejected cases.\n\n${details}\n\nFull thresholds: ${passed ? 'passed' : 'failed'}. Rules fallback does not count as a live AI evaluation.\n`;
await appendFile('docs/eval-log.md', record);
process.stdout.write(record);
if (!passed) process.exitCode = 1;
