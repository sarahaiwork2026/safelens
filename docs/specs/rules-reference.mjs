// SafeLens rules reference oracle.
// Validated on 2026-10-18: passes all 25 base fixtures and all extra cases in docs/data.
// Run before Phase 0 moves the data: node docs/specs/rules-reference.mjs docs/data
// Run after the move:                node docs/specs/rules-reference.mjs packages/core/data packages/core/fixtures
// Port this behaviour into typed modules in packages/core (see docs/specs/EXTRACTION.md).
// This file is a reference, not product code. Delete it once packages/core passes the same fixtures.
import { readFileSync } from "node:fs";
const dataDir = process.argv[2] ?? "docs/data";
const fixturesDir = process.argv[3] ?? dataDir;
const read = (dir, f) => JSON.parse(readFileSync(`${dir}/${f}`, "utf8"));
const AREAS = read(dataDir, "karachi-areas.json").areas;
const FIX = read(fixturesDir, "test-reports.json");
const EXTRA = read(fixturesDir, "test-reports-extra.json");

// ---------- lexicon (mirrors docs/specs/EXTRACTION.md) ----------
const TYPE_RULES = [
  ["firing",     ["firing", "gunshot", "gun shot", "shots fired", "shot fired", "goli", "fire kiye", "fire kiya", "fire kar", "فائرنگ", "گولی"]],
  ["kidnapping", ["kidnap", "abduct", "aghwa", "agwa", "اغوا"]],
  ["robbery",    ["robber", "robbed", "dacoit", "loot", "daketi", "dakaiti", "dakait", "ڈکیتی", "ڈاکو", "لوٹ"]],
  ["fire",       ["=fire", "blaze", "=aag", "dhuan", "dhuwan", "jal raha", "jal rahi", "jal gaya", "jal gayi", "=آگ", "دھواں"]],
  ["assault",    ["assault", "attack", "beaten", "=beat", "=fight", "=fighting", "maar peet", "marpeet", "maarpeet", "ladai", "larai", "jhagra", "jhagda", "مار پیٹ", "لڑائی", "جھگڑا"]],
  ["snatching",  ["snatch", "cheen", "chheen", "chhin", "chhina", "jhapat", "چھین"]],
  ["theft",      ["theft", "thief", "stole", "steal", "broke into", "burglar", "chori", "chura", "چوری"]],
  ["accident",   ["accident", "crash", "collision", "hadsa", "haadsa", "ulat", "takkar", "takar", "حادثہ", "ٹکر"]],
  ["harassment", ["harass", "eve teas", "pareshan kar", "tang kar", "chhed", "ہراس", "تنگ کر", "چھیڑ"]],
  ["hazard",     ["gas leak", "leak", "=gas", "=wire", "=wires", "flood", "short circuit", "manhole", "=gutter", "=taar", "current lag", "گیس", "=تار", "کرنٹ", "گٹر", "سیلاب"]],
  ["suspicious", ["suspicious", "strange", "unattended", "circling", "loiter", "mashkook", "lawaris", "ajeeb", "مشکوک", "لاوارث", "عجیب"]],
];
const CLAIM_NEG = {
  no_weapon: ["=unarmed", "no weapon", "without weapon", "bina asla", "bina hathiyar", "بغیر اسلحہ", "بغیر ہتھیار"],
  no_injury: ["no injur", "no one hurt", "no one was hurt", "nobody hurt", "nobody was hurt", "no one injured", "nobody injured", "=unhurt", "koi zakhmi nahi", "koi zakhmi nahin", "کوئی زخمی نہیں"],
};
const CLAIM_POS = {
  weapon: ["=gun", "=guns", "=pistol", "=pistols", "=knife", "=knives", "=armed", "=weapon", "=weapons", "=lathi", "=danda", "=asla", "=chaku", "=chhuri", "=bandook", "=tamancha", "پستول", "اسلحہ", "ہتھیار", "بندوق", "چاقو"],
  injury: ["injur", "=hurt", "wound", "bleed", "=killed", "=dead", "zakhmi", "zakhmee", "khoon", "ghayal", "jaan bahaq", "زخمی", "جاں بحق", "ہلاک", "خون"],
  ongoing: ["=still", "ongoing", "happening now", "abhi bhi", "ab bhi", "abhi tak", "=jari", "جاری", "ہو رہی", "ہو رہا", "اب بھی"],
  resolved: ["under control", "control mein", "resolved", "khatam", "chale gaye", "=fled", "=saved", "=rescued", "bach gaya", "bach gayi", "ختم", "قابو پا", "بچ گیا", "بچ گئی"],
  motorbike: ["=bike", "=bikes", "motorbike", "motorcycle", "motor cycle", "موٹر سائیکل", "بائیک"],
};
const MULTI_NUM = ["2", "3", "4", "5", "two", "three", "four", "five", "do", "teen", "char", "chaar", "paanch", "دو", "تین", "چار", "پانچ"];
const MULTI_NOUN = ["men", "people", "persons", "log", "guys", "boys", "youths", "armed", "bike", "bikes", "suspects", "larke", "larkay", "larkon", "admi", "aadmi", "afraad", "bande", "banday", "لوگ", "لڑکے", "آدمی", "افراد"];
const MULTI_WORD = ["=group", "گروہ"];
const MINOR = ["minor", "small", "=chota", "=choti", "=chhota", "=chhoti", "halka", "halki", "معمولی", "چھوٹی", "چھوٹا", "چھوٹے"];
const BASE_SEV = { suspicious: 1, harassment: 2, theft: 2, snatching: 2, accident: 2, hazard: 2, robbery: 3, assault: 3, firing: 3, kidnapping: 3, fire: 3, unclear: 2 };
const FAMILY = { suspicious: ["property", 1], theft: ["property", 2], snatching: ["property", 2], robbery: ["property", 3], harassment: ["violence", 1], assault: ["violence", 2], firing: ["violence", 3], kidnapping: ["violence", 3], fire: ["fire", 1], accident: ["accident", 1], hazard: ["hazard", 1] };
const RU_MARKERS = new Set("hai hain mein ne ki ko se pe par abhi aur ka ke wala wale log nahi nahin tha thi gaya gayi raha rahe rahi kar ho hua hui bohat madad chahiye kuch ek teen kya koi aaj bhi yeh woh hum mujhe".split(" "));
const EN_FUNC = new Set("the and near at is in of was with on for".split(" "));
const ACCUSATION = ["is a thief", "is the thief", "is a robber", "is a criminal", "is a terrorist", "are thieves", "are criminals", "chor hai", "chor tha", "chor hain", "dakait hai", "daku hai", "criminal hai", "dehshatgard", "چور ہے", "چور تھا", "ڈاکو ہے", "دہشت گرد ہے"];

// ---------- text helpers ----------
const EAST_DIGITS = /[۰-۹٠-٩]/g;
const toAsciiDigits = (s) => s.replace(EAST_DIGITS, (d) => String((d.charCodeAt(0) & 0xf) % 10));
function sanitize(raw) {
  let s = raw.normalize("NFC");
  s = s.replace(/[‪-‮⁦-⁩​﻿]/g, "");
  s = s.replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, " ");
  s = toAsciiDigits(s);
  s = s.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  return [...s].slice(0, 1000).join("");
}
function redact(s) {
  return s
    .replace(/\b\d{5}-?\d{7}-?\d\b/g, "[id removed]")
    .replace(/(?:\+92|0092|\b0)[\s-]?3\d{2}[\s-]?\d{7}\b/g, "[phone removed]")
    .replace(/\b(?:\+92[\s-]?21|021)[\s-]?\d{7,8}\b/g, "[phone removed]");
}
function norm(s) {
  let t = toAsciiDigits(s.normalize("NFC")).toLowerCase();
  t = t.replace(/ي/g, "ی").replace(/ى/g, "ی").replace(/ك/g, "ک").replace(/ه/g, "ہ").replace(/ة/g, "ہ");
  t = t.replace(/[ً-ٰٟـ]/g, "");
  t = t.replace(/[^\p{L}\p{M}\p{N}]+/gu, " ");
  t = t.replace(/([a-z])\1{2,}/g, "$1$1");
  return ` ${t.trim().replace(/ +/g, " ")} `;
}
const termOf = (t) => (t.startsWith("=") ? { s: norm(t.slice(1)).trim(), whole: true } : { s: norm(t).trim(), whole: false });
function findTerm(text, term) {
  const { s, whole } = termOf(term);
  const needle = whole ? ` ${s} ` : ` ${s}`;
  const i = text.indexOf(needle);
  return i < 0 ? null : { start: i + 1, end: i + 1 + s.length };
}
const has = (text, terms) => terms.some((t) => findTerm(text, t));
function removeWords(text, start, end) {
  // remove from start through the end of the word containing end-1
  let e = end; while (e < text.length && text[e] !== " ") e++;
  return text.slice(0, start) + " ".repeat(e - start) + text.slice(e);
}

// ---------- gazetteer ----------
const ALIASES = AREAS.flatMap((a) => [...a.aliases, ...a.urdu].map((al) => ({ id: a.id, al: norm(al).trim() })))
  .sort((x, y) => y.al.length - x.al.length);
function findArea(text) {
  const n = typeof text === "string" && text.startsWith(" ") ? text : norm(text ?? "");
  for (const { id, al } of ALIASES) { const i = n.indexOf(` ${al} `); if (i >= 0) return { id, start: i + 1, end: i + 1 + al.length }; }
  return null;
}
function maskAreas(n) {
  let t = n; let guard = 0;
  while (guard++ < 10) { const m = findArea(t); if (!m) break; t = t.slice(0, m.start) + " ".repeat(m.end - m.start) + t.slice(m.end); }
  return t.replace(/ +/g, " ");
}

// ---------- detectors ----------
function detectLanguage(text) {
  const arabic = /[؀-ۿ]/.test(text);
  const latinWords = text.match(/[A-Za-z]{3,}/g) ?? [];
  if (arabic) return latinWords.length ? "Mixed" : "Urdu";
  const toks = text.toLowerCase().match(/[a-z]+/g) ?? [];
  const ru = toks.filter((t) => RU_MARKERS.has(t)).length;
  const en = toks.filter((t) => EN_FUNC.has(t)).length;
  if (ru >= 2) return en >= 2 ? "Mixed" : "Roman Urdu";
  return "English";
}
function detectType(m) { for (const [type, terms] of TYPE_RULES) if (has(m, terms)) return type; return "unclear"; }
function detectClaims(m) {
  let t = m; const out = new Set();
  for (const [neg, terms] of Object.entries(CLAIM_NEG)) {
    for (const term of terms) { let f; while ((f = findTerm(t, term))) { out.add(neg); t = removeWords(t, f.start, f.end); } }
  }
  for (const [pos, terms] of Object.entries(CLAIM_POS)) if (has(t, terms)) out.add(pos);
  const toks = t.trim().split(/ +/);
  for (let i = 0; i < toks.length - 1; i++) if (MULTI_NUM.includes(toks[i]) && MULTI_NOUN.includes(toks[i + 1])) out.add("multiple");
  if (has(t, MULTI_WORD)) out.add("multiple");
  return [...out];
}
function severityFor(type, claims, m) {
  const base = BASE_SEV[type];
  if (claims.includes("weapon") || claims.includes("injury")) return 3;
  if (has(m, MINOR) || claims.includes("resolved")) return Math.max(1, base - 1);
  return base;
}

// ---------- time ----------
const NUMW = { one: 1, two: 2, three: 3, four: 4, five: 5, ten: 10, fifteen: 15, twenty: 20, thirty: 30, ek: 1, do: 2, teen: 3, char: 4, chaar: 4, paanch: 5, das: 10, bees: 20, "ایک": 1, "دو": 2, "تین": 3, "چار": 4, "پانچ": 5, "دس": 10 };
const MIN_U = ["min", "mins", "minute", "minutes", "minat", "minut", "منٹ"];
const HR_U = ["hr", "hrs", "hour", "hours", "ghanta", "ghante", "ghantay", "ghanty", "گھنٹہ", "گھنٹے"];
const AGO = ["ago", "pehle", "pehlay", "pahle", "qabal", "پہلے", "قبل"];
const NOW = ["just now", "right now", "abhi abhi", "abhi", "now", "isi waqt", "ابھی"];
const PM_PART = ["raat", "shaam", "sham", "dopahar", "رات", "شام", "دوپہر"];
const AM_PART = ["subah", "صبح"];
const KHI = 5 * 3600e3;
function parseTime(input, nowMs, mode) {
  const n = norm(input); const toks = n.trim().split(/ +/);
  for (let i = 0; i < toks.length; i++) {
    const num = /^\d+$/.test(toks[i]) ? Number(toks[i]) : NUMW[toks[i]];
    if (num == null) continue;
    const unit = toks[i + 1];
    const mult = MIN_U.includes(unit) ? 1 : HR_U.includes(unit) ? 60 : null;
    if (mult == null) continue;
    const agoOk = mode === "form" || AGO.includes(toks[i + 2]) || AGO.includes(toks[i + 3]);
    if (agoOk) return { minutesAgo: num * mult };
  }
  if (/ (an|one|ek) (hour|ghanta) (ago|pehle) /.test(n) || / ایک گھنٹہ پہلے /.test(n) || (mode === "form" && / (an|one|ek) (hour|ghanta) /.test(n))) return { minutesAgo: 60 };
  if (/ (half an hour|aadha ghanta) (ago|pehle) /.test(n) || / آدھا گھنٹہ پہلے /.test(n)) return { minutesAgo: 30 };
  // clock
  const raw = toAsciiDigits(input.toLowerCase());
  let h = null, mi = 0, ampm = null;
  let m = raw.match(/\b(\d{1,2})[:.](\d{2})\s*(am|pm)?\b/);
  if (m) { h = +m[1]; mi = +m[2]; ampm = m[3] ?? null; }
  else if ((m = raw.match(/\b(\d{1,2})\s*(am|pm)\b/))) { h = +m[1]; ampm = m[2]; }
  else if ((m = raw.match(/(\d{1,2})\s*(baje|بجے)/))) { h = +m[1]; ampm = has(n, PM_PART) ? "pm" : has(n, AM_PART) ? "am" : null; }
  if (h != null && h <= 23 && mi <= 59) {
    const nowK = new Date(nowMs + KHI); // shifted clock
    const dayStart = Date.UTC(nowK.getUTCFullYear(), nowK.getUTCMonth(), nowK.getUTCDate()) - KHI;
    const cands = [];
    if (ampm === "pm") cands.push((h % 12) + 12); else if (ampm === "am") cands.push(h % 12); else if (h > 12) cands.push(h); else cands.push(h % 12, (h % 12) + 12);
    let best = null;
    for (const hh of cands) for (const d of [0, -1]) {
      const t = dayStart + d * 86400e3 + (hh * 60 + mi) * 60e3;
      if (t <= nowMs && (best == null || t > best)) best = t;
    }
    if (best != null) return { occurredAt: best, minutesAgo: Math.round((nowMs - best) / 60e3) };
  }
  if (has(n, NOW)) return { minutesAgo: 0 };
  return null;
}

// ---------- extraction ----------
function extract(text, form, nowMs) {
  const clean = redact(sanitize(text));
  if ([...clean.replace(/\s/g, "")].length < 10 || clean.split(/\s+/).length < 2) return { status: "rejected", code: "too_short" };
  const n = norm(clean);
  if (has(n, ACCUSATION)) return { status: "rejected", code: "accusation" };
  const language = detectLanguage(clean);
  const area = (form.location && findArea(norm(form.location))) || findArea(n);
  const m = maskAreas(n);
  const type = detectType(m);
  const claims = detectClaims(m);
  const severity = severityFor(type, claims, m);
  let time = null;
  if (form.time) time = parseTime(form.time, nowMs, "form");
  if (!time) time = parseTime(clean, nowMs, "text");
  const missing = [];
  if (type === "unclear") missing.push("type");
  if (!area) missing.push("location");
  if (!time) missing.push("time");
  const occurredAt = time ? (time.occurredAt ?? nowMs - time.minutesAgo * 60e3) : null;
  return { status: missing.length ? "needs_info" : "ok", missing, language, type, severity, areaId: area?.id ?? null, claims, minutesAgo: time?.minutesAgo ?? null, occurredAt, stored: clean };
}

// ---------- threading ----------
const areaById = Object.fromEntries(AREAS.map((a) => [a.id, a]));
function km(a, b) {
  const R = 6371, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
function run() {
  const now = Date.now();
  const threads = []; const results = []; let escalations = 0;
  const order = [...FIX.reports].sort((a, b) => b.minutesAgo - a.minutesAgo);
  for (const r of order) {
    const x = extract(r.text, { time: `${r.minutesAgo} minutes ago` }, now);
    if (x.status !== "ok") { results.push({ r, x, outcome: "held" }); continue; }
    const [fam, rank] = FAMILY[x.type]; const pt = areaById[x.areaId];
    const cands = threads.filter((t) => t.family === fam && km(t, pt) <= 1.5 && x.occurredAt >= t.first - 180 * 60e3 && x.occurredAt <= t.last + 180 * 60e3)
      .map((t) => ({ t, dt: Math.min(Math.abs(x.occurredAt - t.last), Math.abs(x.occurredAt - t.first)), d: km(t, pt) }))
      .sort((a, b) => a.dt - b.dt || a.d - b.d);
    if (!cands.length) {
      const t = { id: threads.length + 1, family: fam, type: x.type, rank, severity: x.severity, status: "open", lat: pt.lat, lng: pt.lng, areaId: x.areaId, first: x.occurredAt, last: x.occurredAt, reports: [{ id: r.id, claims: x.claims }] };
      threads.push(t); results.push({ r, x, outcome: "new", thread: t }); continue;
    }
    const t = cands[0].t; let changed = false;
    if (rank > t.rank) { t.type = x.type; t.rank = rank; changed = true; }
    if (x.severity > t.severity) { t.severity = x.severity; changed = true; }
    t.first = Math.min(t.first, x.occurredAt); t.last = Math.max(t.last, x.occurredAt); t.reports.push({ id: r.id, claims: x.claims });
    if (changed) { t.status = "escalated"; escalations++; }
    results.push({ r, x, outcome: changed ? "escalated" : "grouped", thread: t });
  }
  return { results, threads, escalations };
}
const PAIRS = [["weapon", "no_weapon"], ["injury", "no_injury"], ["ongoing", "resolved"]];
function labels(reports) {
  const c = {}; for (const r of reports) for (const k of r.claims) c[k] = (c[k] ?? 0) + 1;
  const out = []; const used = new Set();
  for (const [a, b] of PAIRS) if (c[a] && c[b]) { out.push({ kind: "contradictory", claim: a, count: c[a], opposing: { claim: b, count: c[b] } }); used.add(a); used.add(b); }
  for (const [k, n] of Object.entries(c)) if (!used.has(k)) out.push({ kind: n >= 2 ? "supported" : "unconfirmed", claim: k, count: n });
  return out;
}

// ---------- assertions ----------
let fails = 0;
const eqSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
const { results, threads, escalations } = run();
const clusterToThread = {};
for (const { r, x, outcome, thread } of results) {
  const e = r.expected; const errs = [];
  for (const k of ["language", "type", "severity", "areaId"]) if (x[k] !== e[k]) errs.push(`${k}: ${x[k]} != ${e[k]}`);
  if (!eqSet(x.claims ?? [], e.claims)) errs.push(`claims: ${x.claims} != ${e.claims}`);
  if (outcome !== e.outcome) errs.push(`outcome: ${outcome} != ${e.outcome}`);
  if (e.missing && !eqSet(x.missing, e.missing)) errs.push(`missing: ${x.missing} != ${e.missing}`);
  if (thread) { clusterToThread[e.cluster] ??= thread.id; if (clusterToThread[e.cluster] !== thread.id) errs.push(`cluster ${e.cluster} split`); }
  if (errs.length) { fails++; console.log("FAIL", r.id, errs.join("; ")); }
}
for (const exp of FIX.threads) {
  const t = threads.find((t) => t.id === clusterToThread[exp.cluster]); const errs = [];
  if (!t) { console.log("FAIL thread missing", exp.cluster); fails++; continue; }
  if (t.type !== exp.type) errs.push(`type ${t.type}`); if (t.severity !== exp.severity) errs.push(`sev ${t.severity}`); if (t.status !== exp.status) errs.push(`status ${t.status}`);
  if (!eqSet(t.reports.map((r) => r.id), exp.reports)) errs.push(`reports ${t.reports.map((r) => r.id)}`);
  const got = labels(t.reports); const norml = (l) => JSON.stringify(l);
  if (!eqSet(got.map(norml), exp.labels.map(norml))) errs.push(`labels ${JSON.stringify(got)}`);
  if (errs.length) { fails++; console.log("FAIL", exp.cluster, errs.join("; ")); }
}
const stored = results.filter((r) => r.outcome !== "held").length;
console.log(`base: stored ${stored}, held ${results.length - stored}, threads ${threads.length}, escalations ${escalations}`);
if (stored !== FIX.totals.stored || threads.length !== FIX.totals.threads || escalations !== FIX.totals.escalations) { fails++; console.log("FAIL totals"); }

for (const r of EXTRA.reports) {
  const now = Date.parse(r.now ?? EXTRA.defaultNow);
  const x = extract(r.text, r.form, now); const e = r.expected; const errs = [];
  if (x.status !== e.status) errs.push(`status ${x.status} (${x.missing ?? x.code})`);
  if (e.code && x.code !== e.code) errs.push(`code ${x.code}`);
  for (const k of ["language", "type", "severity", "areaId", "minutesAgo"]) if (k in e && x[k] !== e[k]) errs.push(`${k}: ${x[k]} != ${e[k]}`);
  if (e.claims && !eqSet(x.claims, e.claims)) errs.push(`claims ${x.claims}`);
  if (e.missing && !eqSet(x.missing, e.missing)) errs.push(`missing ${x.missing}`);
  if (e.occurredAt && x.occurredAt !== Date.parse(e.occurredAt)) errs.push(`occurredAt ${new Date(x.occurredAt).toISOString()}`);
  if (e.storedTextContains && !x.stored.includes(e.storedTextContains)) errs.push(`stored ${x.stored}`);
  if (e.storedTextExcludes && x.stored.includes(e.storedTextExcludes)) errs.push(`stored leaks ${x.stored}`);
  if (errs.length) { fails++; console.log("FAIL", r.id, errs.join("; ")); }
}
console.log(fails ? `${fails} FAILURES` : "ALL PASS");
