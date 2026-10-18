import { copyFile, constants } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
const web = join(root, 'apps/web');
const require = createRequire(import.meta.url);
let vite;
let wrangler;
try {
  vite = join(dirname(require.resolve('vite/package.json')), 'bin/vite.js');
  wrangler = join(
    dirname(require.resolve('wrangler/package.json')),
    'bin/wrangler.js',
  );
} catch {
  process.stderr.write('Install the project first: npm run setup\n');
  process.exit(1);
}

try {
  await copyFile(
    join(web, '.dev.vars.example'),
    join(web, '.dev.vars'),
    constants.COPYFILE_EXCL,
  );
  process.stdout.write(
    'Created local configuration. No API key is required.\n',
  );
} catch (error) {
  if (
    !(error instanceof Error) ||
    !('code' in error) ||
    error.code !== 'EEXIST'
  )
    throw error;
}

const migration = spawnSync(
  process.execPath,
  [wrangler, 'd1', 'migrations', 'apply', 'safelens', '--local'],
  { cwd: web, stdio: 'inherit' },
);
if (migration.error) throw migration.error;
if (migration.status !== 0) process.exit(migration.status ?? 1);

const server = spawn(
  process.execPath,
  [vite, '--host', '0.0.0.0', ...process.argv.slice(2)],
  { cwd: web, stdio: 'inherit' },
);
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => server.kill(signal));
server.on('error', (error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
server.on('exit', (code) => {
  process.exitCode = code ?? 0;
});
