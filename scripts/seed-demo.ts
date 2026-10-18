import { readFile } from 'node:fs/promises';
import { BASE_FIXTURES } from '../packages/core/src/evaluation';
const argv = process.argv.slice(2),
  target = argv[argv.indexOf('--target') + 1];
if (!argv.includes('--target') || !target)
  throw new Error('Use pnpm seed:demo --target <url>.');
const url = new URL(target);
if (!['http:', 'https:'].includes(url.protocol))
  throw new Error('Use an HTTP or HTTPS target.');
const healthResponse = await fetch(new URL('/api/health', url));
if (!healthResponse.ok) throw new Error('Target health check failed.');
const health: unknown = await healthResponse.json();
const tokenPath = argv.includes('--tokens-file')
  ? argv[argv.indexOf('--tokens-file') + 1]
  : undefined;
let tokens: string[] = [];
if (tokenPath) {
  const data: unknown = JSON.parse(await readFile(tokenPath, 'utf8'));
  if (!Array.isArray(data) || !data.every((v) => typeof v === 'string'))
    throw new Error(
      'Token file must contain a JSON array of single-use Turnstile tokens.',
    );
  tokens = data;
}
const selected = BASE_FIXTURES.reports.filter((r) =>
  ['T06', 'T07', 'T08', 'T11', 'T12', 'T14', 'T22', 'T23', 'T24'].includes(
    r.id,
  ),
);
if (
  health &&
  typeof health === 'object' &&
  'turnstile' in health &&
  health.turnstile === true &&
  tokens.length < selected.length
)
  throw new Error(
    'This target requires one valid, unused Turnstile token per report. Provide a private --tokens-file or submit these reports through the browser.',
  );
for (const [index, report] of selected.entries()) {
  const response = await fetch(new URL('/api/reports', url), {
    method: 'POST',
    headers: { Origin: url.origin, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: report.text,
      time: `${report.minutesAgo} minutes ago`,
      ...(tokens[index] ? { turnstileToken: tokens[index] } : {}),
    }),
  });
  if (!response.ok)
    throw new Error(`Seed ${report.id} failed with ${response.status}`);
  process.stdout.write(`${report.id}: stored\n`);
  if (index < selected.length - 1)
    await new Promise((resolve) => setTimeout(resolve, 7000));
}
