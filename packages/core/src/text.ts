const EAST_DIGITS = /[۰-۹٠-٩]/g;
export const toAsciiDigits = (s: string) => s.replace(EAST_DIGITS, (d) => String((d.charCodeAt(0) & 0xf) % 10));
export function sanitize(raw: string) {
  let s = raw.normalize("NFC");
  s = s.replace(/[‪-‮⁦-⁩​﻿]/g, "");
  s = s.replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, " ");
  s = toAsciiDigits(s);
  s = s.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  return [...s].slice(0, 1000).join("");
}
export function norm(s: string) {
  let t = toAsciiDigits(s.normalize("NFC")).toLowerCase();
  t = t.replace(/ي/g, "ی").replace(/ى/g, "ی").replace(/ك/g, "ک").replace(/ه/g, "ہ").replace(/ة/g, "ہ");
  t = t.replace(/[ً-ٰٟـ]/g, "");
  t = t.replace(/[^\p{L}\p{M}\p{N}]+/gu, " ");
  t = t.replace(/([a-z])\1{2,}/g, "$1$1");
  return ` ${t.trim().replace(/ +/g, " ")} `;
}
const termOf = (t: string) => (t.startsWith("=") ? { s: norm(t.slice(1)).trim(), whole: true } : { s: norm(t).trim(), whole: false });
export function findTerm(text: string, term: string) {
  const { s, whole } = termOf(term);
  const needle = whole ? ` ${s} ` : ` ${s}`;
  const i = text.indexOf(needle);
  return i < 0 ? null : { start: i + 1, end: i + 1 + s.length };
}
export const has = (text: string, terms: readonly string[]) => terms.some((t) => findTerm(text, t));
export function removeWords(text: string, start: number, end: number) {
  // remove from start through the end of the word containing end-1
  let e = end; while (e < text.length && text[e] !== " ") e++;
  return text.slice(0, start) + " ".repeat(e - start) + text.slice(e);
}

