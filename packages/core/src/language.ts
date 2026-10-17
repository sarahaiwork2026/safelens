import { RU_MARKERS, EN_FUNC } from "./lexicon";
import type { Language } from "./schema";
export function detectLanguage(text: string): Language {
  const arabic = /[؀-ۿ]/.test(text);
  const latinWords = text.match(/[A-Za-z]{3,}/g) ?? [];
  if (arabic) return latinWords.length ? "Mixed" : "Urdu";
  const toks = text.toLowerCase().match(/[a-z]+/g) ?? [];
  const ru = toks.filter((t) => RU_MARKERS.has(t)).length;
  const en = toks.filter((t) => EN_FUNC.has(t)).length;
  if (ru >= 2) return en >= 2 ? "Mixed" : "Roman Urdu";
  return "English";
}
