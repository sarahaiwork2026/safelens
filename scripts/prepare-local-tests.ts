import { readFile, writeFile } from 'node:fs/promises';
const path = 'apps/web/.dev.vars';
let contents: string;
try {
  contents = await readFile(path, 'utf8');
} catch (error) {
  if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
    contents = 'ENVIRONMENT=development\nEXTRACTOR_CHAIN=rules\n';
    await writeFile(path, contents, { flag: 'wx' });
  } else throw error;
}
if (
  !/^ENVIRONMENT\s*=\s*["']?development["']?\s*$/m.test(contents) ||
  !/^EXTRACTOR_CHAIN\s*=\s*["']?rules["']?\s*$/m.test(contents)
)
  throw new Error(
    'Local e2e requires ENVIRONMENT=development and EXTRACTOR_CHAIN=rules in apps/web/.dev.vars. Existing values were preserved.',
  );
process.stdout.write('Local rules-mode test configuration confirmed\n');
