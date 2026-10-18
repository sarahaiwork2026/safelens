import data from '../data/karachi-areas.json';
import { norm } from './text';
export const AREAS = data.areas;
export type Area = (typeof AREAS)[number];
export const ALIASES = AREAS.flatMap((a) =>
  [...a.aliases, ...a.urdu].map((alias) => ({
    id: a.id,
    alias: norm(alias).trim(),
  })),
).sort((a, b) => b.alias.length - a.alias.length);
export function findArea(text: string): Area | null {
  const n = norm(text);
  for (const a of ALIASES)
    if (n.includes(` ${a.alias} `))
      return AREAS.find((area) => area.id === a.id) ?? null;
  return null;
}
export function maskAreas(text: string): string {
  let n = text;
  for (const { alias } of ALIASES)
    n = n.replaceAll(` ${alias} `, ` ${' '.repeat(alias.length)} `);
  return n.replace(/ +/g, ' ');
}
export function searchAreas(text: string): Area[] {
  const n = norm(text).trim();
  return AREAS.filter((a) =>
    [a.name, ...a.aliases, ...a.urdu].some((v) => norm(v).includes(n)),
  );
}
