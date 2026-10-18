import { FAMILY } from './lexicon';
import { km } from './geo';
import type {
  ExtractionData,
  Family,
  IncidentType,
  Severity,
  Status,
} from './schema';
export const THREAD = {
  WINDOW_MIN: 180,
  RADIUS_KM: 1.5,
  AMBIGUITY: 0.1,
} as const;
export interface ThreadCandidate {
  id: string;
  family: Family;
  type: Exclude<IncidentType, 'unclear'>;
  severity: Severity;
  status: Status;
  lat: number;
  lng: number;
  firstSeen: number;
  lastSeen: number;
}
export function matchThread(
  candidates: ThreadCandidate[],
  x: ExtractionData,
  centroid: { lat: number; lng: number },
): ThreadCandidate | null {
  if (x.type === 'unclear' || x.occurredAt === null) return null;
  const at = x.occurredAt,
    family = FAMILY[x.type][0],
    window = THREAD.WINDOW_MIN * 60000;
  return (
    candidates
      .filter(
        (t) =>
          t.family === family &&
          km(t, centroid) <= THREAD.RADIUS_KM &&
          at >= t.firstSeen - window &&
          at <= t.lastSeen + window,
      )
      .map((t) => ({
        t,
        d: km(t, centroid),
        dt: Math.min(Math.abs(at - t.firstSeen), Math.abs(at - t.lastSeen)),
      }))
      .sort(
        (a, b) => a.dt - b.dt || a.d - b.d || a.t.id.localeCompare(b.t.id),
      )[0]?.t ?? null
  );
}
export function threadChange(t: ThreadCandidate, x: ExtractionData) {
  const rank = x.type === 'unclear' ? 0 : FAMILY[x.type][1];
  const type =
    rank > FAMILY[t.type][1] && x.type !== 'unclear' ? x.type : t.type;
  const severity = Math.max(t.severity, x.severity) as Severity;
  const escalated = type !== t.type || severity !== t.severity;
  return {
    type,
    severity,
    escalated,
    reopened: t.status === 'resolved',
    status: escalated
      ? ('escalated' as const)
      : t.status === 'resolved'
        ? ('open' as const)
        : t.status,
  };
}
