import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { loadEnv } from 'vite';
const config = JSON.parse(
  await readFile('apps/web/wrangler.jsonc', 'utf8'),
) as {
  d1_databases: { database_id: string }[];
  vars: { NOMINATIM_USER_AGENT?: string };
};
if (
  config.d1_databases.some(
    (db) => db.database_id === '00000000-0000-0000-0000-000000000001',
  )
)
  throw new Error('Set the real Cloudflare D1 database ID before deploying.');
const siteKey =
  process.env.VITE_TURNSTILE_SITE_KEY ??
  loadEnv('production', resolve('apps/web'), 'VITE_').VITE_TURNSTILE_SITE_KEY;
if (!siteKey || siteKey === '1x00000000000000000000AA')
  throw new Error(
    'Set the production VITE_TURNSTILE_SITE_KEY before deploying.',
  );
if (!config.vars.NOMINATIM_USER_AGENT?.includes('@'))
  throw new Error(
    'Set NOMINATIM_USER_AGENT with the human contact email before production.',
  );
process.stdout.write(
  'Public deployment configuration checked. Configure Worker secrets securely before the live smoke test.\n',
);
