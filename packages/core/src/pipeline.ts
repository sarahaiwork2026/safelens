import { sanitize, norm } from './text';
import { redact } from './redact';
import { rejectReason } from './policy';
import { detectLanguage } from './language';
import { findArea, maskAreas, AREAS } from './gazetteer';
import { detectType, detectClaims } from './rules-parser';
import { parseTime } from './time';
import { severityFor, severityReason } from './severity';
import { missingFields } from './missing';
import { GUIDANCE } from './guidance';
import { TYPE_LABELS, CLAIM_LABELS } from './labels';
import type { Analysis, Form, ExtractionData } from './schema';
export function summarize(
  x: Pick<ExtractionData, 'type' | 'areaId' | 'claims'>,
): string {
  const area = AREAS.find((a) => a.id === x.areaId);
  return `${TYPE_LABELS[x.type]} reported${area ? ` in ${area.name}` : ''}${area && x.claims.length ? `: ${x.claims.map((c) => CLAIM_LABELS[c].toLowerCase()).join(', ')}` : ''}.`.slice(
    0,
    200,
  );
}
export function analyzeReport(
  text: string,
  form: Form = {},
  now = Date.now(),
): Analysis {
  form = {
    ...(form.location
      ? { location: redact(sanitize(form.location)).slice(0, 120) }
      : {}),
    ...(form.time ? { time: redact(sanitize(form.time)).slice(0, 60) } : {}),
  };
  const clean = redact(sanitize(text));
  const reason = rejectReason(text, clean);
  if (reason) return { status: 'rejected', code: reason };
  const masked = maskAreas(norm(clean));
  const type = detectType(masked),
    claims = detectClaims(masked);
  const area =
    (form.location ? findArea(form.location) : null) ?? findArea(clean);
  const time =
    (form.time ? parseTime(form.time, now, 'form') : null) ??
    parseTime(clean, now, 'text');
  const x: ExtractionData = {
    language: detectLanguage(clean),
    type,
    severity: severityFor(type, claims, masked),
    severityReason: severityReason(type, claims, masked),
    summary: '',
    recommendedAction: GUIDANCE[type],
    claims,
    confidence: {
      type: type === 'unclear' ? 0 : 1,
      location: area ? 1 : 0,
      time: time ? 1 : 0,
    },
    flags: [],
    locationText: form.location || area?.name || null,
    areaId: area?.id ?? null,
    lat: area?.lat ?? null,
    lng: area?.lng ?? null,
    occurredAt: time
      ? (time.occurredAt ?? now - time.minutesAgo * 60000)
      : null,
    timeText: form.time?.slice(0, 60) ?? null,
    engine: 'rules',
    model: null,
  };
  x.summary = summarize(x);
  const missing = missingFields(x);
  return {
    status: missing.length ? 'needs_info' : 'ok',
    extraction: x,
    missing,
    stored: clean,
  };
}
export const previewReport = analyzeReport;
