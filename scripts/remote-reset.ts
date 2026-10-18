import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { spawnSync } from 'node:child_process';
if (!stdin.isTTY)
  throw new Error(
    'Production reset is human-only and requires an interactive terminal.',
  );
const terminal = createInterface({ input: stdin, output: stdout });
const answer = await terminal.question(
  'This permanently deletes all production incident and test data. Type RESET PRODUCTION to continue: ',
);
terminal.close();
if (answer !== 'RESET PRODUCTION') {
  process.stdout.write('Cancelled\n');
  process.exit(0);
}
const result = spawnSync(
  'pnpm',
  [
    '--filter',
    'web',
    'exec',
    'wrangler',
    'd1',
    'execute',
    'safelens',
    '--remote',
    '--command',
    'DELETE FROM incidents; DELETE FROM test_runs; DELETE FROM usage_counters; DELETE FROM geocode_cache;',
  ],
  { stdio: 'inherit' },
);
process.exit(result.status ?? 1);
