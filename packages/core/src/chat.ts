import { AREAS, ALIASES } from './gazetteer';
import { norm } from './text';
import { detectLanguage } from './language';
import { km } from './geo';
import type { Point } from './geo';
export const CHAT_INTENTS = [
  'area',
  'route',
  'road',
  'guidance',
  'offtopic',
] as const;
export const CHAT_LANGUAGES = ['English', 'Urdu', 'Roman Urdu'] as const;
export const ADVICE_KEYS = [
  'general',
  'travel',
  'road',
  'fire',
  'gas',
  'violence',
  'medical',
] as const;
export interface ChatPlan {
  intent: (typeof CHAT_INTENTS)[number];
  language: (typeof CHAT_LANGUAGES)[number];
  areas: string[];
  advice: (typeof ADVICE_KEYS)[number][];
}
export function chatAreas(text: string) {
  const clean = norm(text);
  return [
    ...new Set(
      ALIASES.filter((a) => clean.includes(` ${a.alias} `)).map((a) => a.id),
    ),
  ].slice(0, 3);
}
export function localChatPlan(
  text: string,
  history: string[],
  language?: ChatPlan['language'],
): ChatPlan {
  const current = chatAreas(text),
    areas = current.length
      ? current
      : (history
          .map(chatAreas)
          .reverse()
          .find((ids) => ids.length) ?? []);
  const detected = detectLanguage(text);
  const lang =
    language ??
    (/[؀-ۿ]/.test(text)
      ? 'Urdu'
      : detected === 'Roman Urdu' ||
          /\b(hai|hain|kya|kaise|kese|mujhe|rasta|raasta|mehfooz)\b/i.test(text)
        ? 'Roman Urdu'
        : 'English');
  const advice: ChatPlan['advice'] = /gas|leak|گیس|رساؤ/i.test(text)
    ? ['gas']
    : /fire|smoke|aag|dhuan|آگ|دھواں/i.test(text)
      ? ['fire']
      : /injur|hurt|bleed|zakhm|زخمی|خون/i.test(text)
        ? ['medical']
        : /attack|follow|rob|gun|firing|chori|dakaiti|حملہ|فائرنگ|ڈکیتی/i.test(
              text,
            )
          ? ['violence']
          : /road|traffic|accident|block|سڑک|ٹریفک|حادثہ|راستہ|rasta|raasta/i.test(
                text,
              )
            ? ['road', 'travel']
            : ['travel'];
  const relevant =
    areas.length ||
    /safe|danger|security|help|emergen|mehfooz|madad|khatra|محفوظ|مدد|خطر|حفاظت/i.test(
      text,
    ) ||
    advice[0] !== 'travel';
  const intent = !relevant
    ? 'offtopic'
    : areas.length > 1
      ? 'route'
      : /traffic|accident|roadblock|blocked|road closure|ٹریفک|حادثہ|سڑک بند/i.test(
            text,
          )
        ? 'road'
        : advice[0] !== 'travel'
          ? 'guidance'
          : 'area';
  return { intent, language: lang, areas, advice };
}
// This approximates a straight corridor, not a road route or navigation service.
export function nearChatRoute(point: Point, areaIds: string[]) {
  const areas = areaIds
    .map((id) => AREAS.find((a) => a.id === id))
    .filter((a) => a !== undefined);
  if (areas.some((a) => km(point, a) <= 2)) return true;
  const a = areas[0],
    b = areas[1];
  if (!a || !b) return false;
  const scale = Math.cos((a.lat * Math.PI) / 180),
    dx = (b.lng - a.lng) * scale,
    dy = b.lat - a.lat;
  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.lng - a.lng) * scale * dx + (point.lat - a.lat) * dy) /
        (dx * dx + dy * dy || 1),
    ),
  );
  return (
    km(point, { lat: a.lat + t * dy, lng: a.lng + t * (b.lng - a.lng) }) <= 2
  );
}
