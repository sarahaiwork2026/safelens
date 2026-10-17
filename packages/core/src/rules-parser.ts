import { CLAIM_NEG, CLAIM_POS, MULTI_NUM, MULTI_NOUN, MULTI_WORD, TYPE_RULES } from "./lexicon";
import { has, findTerm, removeWords } from "./text";
import type { ClaimKey, IncidentType } from "./schema";
export function detectType(m: string): IncidentType { for (const [type, terms] of TYPE_RULES) if (has(m, terms)) return type; return "unclear"; }
export function detectClaims(m: string): ClaimKey[] {
  let t = m; const out = new Set<ClaimKey>();
  for (const [neg, terms] of Object.entries(CLAIM_NEG)) {
    for (const term of terms) { let f; while ((f = findTerm(t, term))) { out.add(neg as ClaimKey); t = removeWords(t, f.start, f.end); } }
  }
  for (const [pos, terms] of Object.entries(CLAIM_POS)) if (has(t, terms)) out.add(pos as ClaimKey);
  const toks = t.trim().split(/ +/);
  for (let i = 0; i < toks.length - 1; i++) if (MULTI_NUM.includes(toks[i] ?? "") && MULTI_NOUN.includes(toks[i + 1] ?? "")) out.add("multiple");
  if (has(t, MULTI_WORD)) out.add("multiple");
  return [...out];
}
