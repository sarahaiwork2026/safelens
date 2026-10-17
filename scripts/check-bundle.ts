import { readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
interface Chunk {file:string;isEntry?:boolean;imports?:string[];css?:string[]}
const root='apps/web/dist/client';
const manifest=JSON.parse(await readFile(`${root}/.vite/manifest.json`,'utf8')) as Record<string,Chunk>;
const entries=Object.keys(manifest).filter(k=>manifest[k]?.isEntry||k.endsWith('features/landing/LandingPage.tsx'));
const visited=new Set<string>(),scripts=new Set<string>(),styles=new Set<string>();
function visit(key:string){if(visited.has(key))return;visited.add(key);const entry=manifest[key];if(!entry)return;scripts.add(entry.file);for(const css of entry.css??[])styles.add(css);for(const imported of entry.imports??[])visit(imported);}
for(const key of entries)visit(key);
let js=0,css=0;const fonts=new Set<string>();
for(const path of scripts){const source=await readFile(`${root}/${path}`,'utf8');js+=gzipSync(source).length;if(/getRTLTextPluginStatus|maplibre-gl-worker|maplibregl-ctrl/.test(source))throw new Error(`Map code leaked into initial bundle: ${path}`);}
for(const path of styles){const source=await readFile(`${root}/${path}`,'utf8');css+=gzipSync(source).length;for(const match of source.matchAll(/url\(["']?(\/?assets\/[^)"']+\.woff2)/g))if(match[1])fonts.add(match[1].replace(/^\//,''));}
let fontBytes=0;for(const path of fonts)fontBytes+=(await readFile(`${root}/${path}`)).length;
process.stdout.write(`Initial JS: ${(js/1024).toFixed(1)} KB gzip\nInitial CSS: ${(css/1024).toFixed(1)} KB gzip\nFonts: ${(fontBytes/1024).toFixed(1)} KB\nMap code excluded from initial chunks\n`);
if(js>150*1024||css>30*1024||fontBytes>90*1024)throw new Error('Bundle exceeds the documented performance budget.');
