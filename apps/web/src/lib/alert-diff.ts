import type { IncidentSummary } from 'core';
export interface AlertCandidate {
  incident: IncidentSummary;
  reason: 'new' | 'escalated';
}
export function diffAlerts(
  previous: Record<number, number> | null,
  current: IncidentSummary[],
  own: Set<number>,
): AlertCandidate[] {
  if (!previous) return [];
  return current
    .filter(
      (i) =>
        i.status !== 'resolved' &&
        ((!(i.ref in previous) && !own.has(i.ref)) ||
          (i.ref in previous && i.severity > (previous[i.ref] ?? 0))),
    )
    .map((i) => ({
      incident: i,
      reason: i.ref in previous ? 'escalated' : 'new',
    }));
}
export function activeSnapshot(current: IncidentSummary[]) {
  return Object.fromEntries(current.map((i) => [i.ref, i.severity]));
}
