import { writeFile } from 'node:fs/promises';
import { buildDemoSnapshot } from '../packages/core/src/demo-snapshot';
await writeFile(
  'apps/web/src/features/landing/demo-incident.json',
  JSON.stringify(buildDemoSnapshot(), null, 2) + '\n',
);
process.stdout.write('Landing snapshot generated from the real C01 pipeline\n');
