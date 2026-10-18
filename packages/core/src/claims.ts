import type { ClaimKey } from './schema';
export type ClaimCounts = Partial<Record<ClaimKey, number>>;
export interface EvidenceLabel {
  kind: 'contradictory' | 'supported' | 'unconfirmed';
  claim: ClaimKey;
  count: number;
  opposing?: { claim: ClaimKey; count: number };
  reportIds?: string[];
  opposingReportIds?: string[];
}
export const PAIRS: [ClaimKey, ClaimKey][] = [
  ['weapon', 'no_weapon'],
  ['injury', 'no_injury'],
  ['ongoing', 'resolved'],
];
export function labelsFromCounts(counts: ClaimCounts): EvidenceLabel[] {
  const out: EvidenceLabel[] = [],
    used = new Set<ClaimKey>();
  for (const [a, b] of PAIRS)
    if (counts[a] && counts[b]) {
      out.push({
        kind: 'contradictory',
        claim: a,
        count: counts[a] ?? 0,
        opposing: { claim: b, count: counts[b] ?? 0 },
      });
      used.add(a);
      used.add(b);
    }
  for (const [claim, n] of Object.entries(counts))
    if (n && !used.has(claim as ClaimKey))
      out.push({
        kind: n >= 2 ? 'supported' : 'unconfirmed',
        claim: claim as ClaimKey,
        count: n,
      });
  const order = { contradictory: 0, supported: 1, unconfirmed: 2 };
  return out.sort((a, b) => order[a.kind] - order[b.kind] || b.count - a.count);
}
export function countClaims(reports: { claims: ClaimKey[] }[]): ClaimCounts {
  const counts: ClaimCounts = {};
  for (const r of reports)
    for (const c of new Set(r.claims)) counts[c] = (counts[c] ?? 0) + 1;
  return counts;
}
export function evidenceSummary(labels: EvidenceLabel[]) {
  return {
    supported: labels.filter((l) => l.kind === 'supported').length,
    disputed: labels.filter((l) => l.kind === 'contradictory').length,
    unconfirmed: labels.filter((l) => l.kind === 'unconfirmed').length,
  };
}
