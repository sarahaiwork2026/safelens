import { spawnSync } from 'node:child_process';
if (process.argv.length > 2)
  throw new Error('This command resets local D1 only and accepts no flags.');
for (const args of [
  ['db:migrate'],
  [
    '--filter',
    'web',
    'exec',
    'wrangler',
    'd1',
    'execute',
    'safelens',
    '--local',
    '--command',
    'DELETE FROM incidents; DELETE FROM test_runs; DELETE FROM usage_counters; DELETE FROM geocode_cache;',
  ],
]) {
  const result = spawnSync('pnpm', args, { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
process.stdout.write('Local D1 reset and migrations applied\n');
