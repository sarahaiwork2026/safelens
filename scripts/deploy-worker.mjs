import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const wrangler = join(
  dirname(require.resolve('wrangler/package.json')),
  'bin/wrangler.js',
);
const web = fileURLToPath(new URL('../apps/web/', import.meta.url));

function run(args, input) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [wrangler, ...args], {
      cwd: web,
      stdio: [input === undefined ? 'inherit' : 'pipe', 'inherit', 'inherit'],
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Wrangler ${args[0]} failed with exit ${code}.`));
    });
    if (input !== undefined) child.stdin.end(input);
  });
}

await run(['d1', 'migrations', 'apply', 'safelens', '--remote']);
await run(['deploy']);

// Workers Builds variables must be explicitly installed as runtime secrets.
// Proxy-bound credentials are preserved locally and never uploaded as keys.
const groqKey = process.env.GROQ_API_KEY?.trim();
if (groqKey?.startsWith('gsk_')) {
  await run(['secret', 'bulk'], JSON.stringify({ GROQ_API_KEY: groqKey }));
  process.stdout.write('Groq runtime secret configured securely.\n');
} else {
  process.stdout.write('Preserving existing Worker AI secrets.\n');
}
