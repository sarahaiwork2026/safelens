import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
async function files(dir: string): Promise<string[]> {
 const entries = await readdir(dir, { withFileTypes: true });
 return (await Promise.all(entries.map(e => e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)]))).flat();
}
const errors: string[] = [];
for (const path of [...await files('apps/web/src'), ...await files('docs')]) {
 if (!/\.(tsx?|css|md)$/.test(path)) continue;
 const text = await readFile(path, 'utf8');
 if (/\u2014/.test(text)) errors.push(`${path}: use plain punctuation`);
 if (path.startsWith('apps/web/src') && /font-mono|monospace|dangerouslySetInnerHTML|href=["']#["']|console\.log|\bTODO\b|\bFIXME\b|(?:bg|text|border)-(?:red|green|yellow|gray|slate|indigo|blue|zinc)-\d/.test(text)) errors.push(`${path}: prohibited style or source pattern`);
}
if (errors.length) { process.stderr.write(errors.join('\n')+'\n'); process.exit(1); }
process.stdout.write('Copy and style checks passed\n');
