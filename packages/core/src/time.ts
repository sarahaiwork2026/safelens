import { norm, toAsciiDigits, has } from "./text";
const NUMW: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, ten: 10, fifteen: 15, twenty: 20, thirty: 30, ek: 1, do: 2, teen: 3, char: 4, chaar: 4, paanch: 5, das: 10, bees: 20, "ایک": 1, "دو": 2, "تین": 3, "چار": 4, "پانچ": 5, "دس": 10 };
const MIN_U = ["min", "mins", "minute", "minutes", "minat", "minut", "منٹ"];
const HR_U = ["hr", "hrs", "hour", "hours", "ghanta", "ghante", "ghantay", "ghanty", "گھنٹہ", "گھنٹے"];
const AGO = ["ago", "pehle", "pehlay", "pahle", "qabal", "پہلے", "قبل"];
const NOW = ["just now", "right now", "abhi abhi", "abhi", "now", "isi waqt", "ابھی"];
const PM_PART = ["raat", "shaam", "sham", "dopahar", "رات", "شام", "دوپہر"];
const AM_PART = ["subah", "صبح"];
const KHI = 5 * 3600e3;
export function parseTime(input: string, nowMs: number, mode: "form" | "text" = "form"): { minutesAgo: number; occurredAt?: number } | null {
  const n = norm(input); const toks = n.trim().split(/ +/);
  for (let i = 0; i < toks.length; i++) {
    const num = /^\d+$/.test(toks[i] ?? "") ? Number(toks[i]) : NUMW[toks[i] ?? ""];
    if (num == null) continue;
    const unit = toks[i + 1] ?? "";
    const mult = MIN_U.includes(unit) ? 1 : HR_U.includes(unit) ? 60 : null;
    if (mult == null) continue;
    const agoOk = mode === "form" || AGO.includes(toks[i + 2] ?? "") || AGO.includes(toks[i + 3] ?? "");
    if (agoOk) return num * mult <= 1440 ? { minutesAgo: num * mult } : null;
  }
  if (/ (an|one|ek) (hour|ghanta) (ago|pehle) /.test(n) || / ایک گھنٹہ پہلے /.test(n) || (mode === "form" && / (an|one|ek) (hour|ghanta) /.test(n))) return { minutesAgo: 60 };
  if (/ (half an hour|aadha ghanta) (ago|pehle) /.test(n) || / آدھا گھنٹہ پہلے /.test(n)) return { minutesAgo: 30 };
  // clock
  const raw = toAsciiDigits(input.toLowerCase());
  let h: number | null = null, mi = 0, ampm: string | null = null;
  let m = raw.match(/\b(\d{1,2})[:.](\d{2})\s*(am|pm)?\b/);
  if (m) { h = Number(m[1]); mi = Number(m[2]); ampm = m[3] ?? null; }
  else if ((m = raw.match(/\b(\d{1,2})\s*(am|pm)\b/))) { h = Number(m[1]); ampm = m[2] ?? null; }
  else if ((m = raw.match(/(\d{1,2})\s*(baje|بجے)/))) { h = Number(m[1]); ampm = has(n, PM_PART) ? "pm" : has(n, AM_PART) ? "am" : null; }
  if (h != null && h <= 23 && mi <= 59) {
    const nowK = new Date(nowMs + KHI); // shifted clock
    const dayStart = Date.UTC(nowK.getUTCFullYear(), nowK.getUTCMonth(), nowK.getUTCDate()) - KHI;
    const cands = [];
    if (ampm === "pm") cands.push((h % 12) + 12); else if (ampm === "am") cands.push(h % 12); else if (h > 12) cands.push(h); else cands.push(h % 12, (h % 12) + 12);
    let best: number | null = null;
    for (const hh of cands) for (const d of [0, -1]) {
      const t = dayStart + d * 86400e3 + (hh * 60 + mi) * 60e3;
      if (t <= nowMs && (best == null || t > best)) best = t;
    }
    if (best != null) return { occurredAt: best, minutesAgo: Math.round((nowMs - best) / 60e3) };
  }
  if (has(n, NOW)) return { minutesAgo: 0 };
  return null;
}

