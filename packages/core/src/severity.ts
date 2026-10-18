import { BASE_SEV, MINOR } from './lexicon';
import { has } from './text';
import { TYPE_LABELS } from './labels';
import type { IncidentType, ClaimKey, Severity } from './schema';
export function severityFor(
  type: IncidentType,
  claims: ClaimKey[],
  text: string,
): Severity {
  if (claims.includes('weapon') || claims.includes('injury')) return 3;
  if (has(text, MINOR) || claims.includes('resolved'))
    return Math.max(1, BASE_SEV[type] - 1) as Severity;
  return BASE_SEV[type];
}
export function severityReason(
  type: IncidentType,
  claims: ClaimKey[],
  text: string,
): string {
  if (claims.includes('weapon') || claims.includes('injury'))
    return 'Weapon or injury mentioned';
  if (has(text, MINOR) || claims.includes('resolved'))
    return 'Described as minor or under control';
  return `Typical level for ${TYPE_LABELS[type].toLowerCase()}`;
}
