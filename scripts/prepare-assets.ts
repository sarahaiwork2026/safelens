import { readFile, writeFile, unlink, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
interface Chunk {
  file: string;
  imports?: string[];
}
const directory = 'apps/web/dist/client';
const manifest = JSON.parse(
  await readFile(`${directory}/.vite/manifest.json`, 'utf8'),
) as Record<string, Chunk>;
const routes: Record<string, string[]> = {};
for (const [path, feature] of Object.entries({
  '/': 'landing/LandingPage',
  '/report': 'report/ReportPage',
  '/incidents': 'incidents/IncidentsPage',
  '/incident': 'incident/IncidentPage',
  '/map': 'map/MapPage',
  '/test-lab': 'test-lab/TestLabPage',
  '/about': 'about/AboutPage',
  '/chat': 'chat/ChatPage',
  '/login': 'auth/LoginPage',
})) {
  const key = Object.keys(manifest).find((k) =>
    k.endsWith(`features/${feature}.tsx`),
  );
  const files = new Set<string>(),
    visited = new Set<string>();
  function visit(name: string) {
    if (visited.has(name)) return;
    visited.add(name);
    const chunk = manifest[name];
    if (!chunk) return;
    files.add(`/${chunk.file}`);
    for (const dependency of chunk.imports ?? []) visit(dependency);
  }
  if (key) visit(key);
  if (['/incidents', '/incident', '/map', '/test-lab'].includes(path)) {
    const alert = Object.keys(manifest).find((k) =>
      k.endsWith('components/alerts/AlertHost.tsx'),
    );
    if (alert) visit(alert);
  }
  routes[path] = [...files];
}
const source = `(()=>{const routes=${JSON.stringify(routes)},path=location.pathname.replace(/\\/$/,'')||'/',key=path.startsWith('/incidents/')?'/incident':path;for(const file of routes[key]||[]){const link=document.createElement('link');link.rel='modulepreload';link.fetchPriority='low';link.href=file;document.head.appendChild(link);}if(path==='/report'){window.safelensPreloads={'/api/health':fetch('/api/health').then(response=>response,error=>error)};}})();`;
const filename = `route-preload-${createHash('sha256').update(source).digest('hex').slice(0, 10)}.js`;
for (const file of await readdir(`${directory}/assets`))
  if (/^route-preload-.*\.js$/.test(file))
    await unlink(`${directory}/assets/${file}`);
await writeFile(`${directory}/assets/${filename}`, source);
for (const file of await readdir(directory))
  if (file.endsWith('.html')) {
    let html = await readFile(`${directory}/${file}`, 'utf8');
    html = html
      .replace(
        /<script src="\/assets\/route-preload-[^"]+" defer><\/script>/g,
        '',
      )
      .replace(
        '<head>',
        `<head><script src="/assets/${filename}" defer fetchpriority="low"></script>`,
      )
      .replace(
        '<script type="module"',
        '<script fetchpriority="low" type="module"',
      );
    for (const tag of html.match(/<link[^>]+>/g) ?? []) {
      if (!tag.includes('rel="stylesheet"')) continue;
      const href = tag.match(/href="\/(assets\/[^"?]+\.css)"/)?.[1];
      if (href) {
        const css = await readFile(`${directory}/${href}`, 'utf8');
        html = html.replace(
          tag,
          `<style data-safelens-styles>${css}</style>${tag.replace('rel="stylesheet"', 'rel="stylesheet" media="print"')}`,
        );
      }
    }
    await writeFile(`${directory}/${file}`, html);
  }
process.stdout.write(
  'Prepared route module preloads and real API warmup for non-landing pages\n',
);
