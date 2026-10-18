import { describe, expect, it } from 'vitest';
import fixtures from '../fixtures/test-reports.json';
import {
  analyzeReport,
  AREAS,
  countClaims,
  labelsFromCounts,
  matchThread,
  threadChange,
  FAMILY,
} from '../src';
import type { ClaimKey, ThreadCandidate } from '../src';
interface TestThread extends ThreadCandidate {
  areaId: string;
  reports: { id: string; claims: ClaimKey[] }[];
}
describe('25-report pipeline and threading contract', () => {
  it('matches every field, cluster, label, escalation and total', () => {
    const now = Date.parse('2026-10-18T22:00:00+05:00');
    const threads: TestThread[] = [],
      clusters: Record<string, string> = {};
    let held = 0,
      stored = 0,
      escalations = 0;
    for (const r of [...fixtures.reports].sort(
      (a, b) => b.minutesAgo - a.minutesAgo,
    )) {
      const x = analyzeReport(
        r.text,
        { time: `${r.minutesAgo} minutes ago` },
        now,
      );
      expect(x.status).not.toBe('rejected');
      if (x.status === 'rejected') throw new Error(r.id);
      for (const key of ['language', 'type', 'severity', 'areaId'] as const)
        expect(x.extraction[key], `${r.id} ${key}`).toBe(r.expected[key]);
      expect([...x.extraction.claims].sort(), r.id).toEqual(
        [...r.expected.claims].sort(),
      );
      if (x.status === 'needs_info') {
        held++;
        expect(r.expected.outcome).toBe('held');
        expect(x.missing).toEqual(r.expected.missing);
        continue;
      }
      stored++;
      const e = x.extraction,
        area = AREAS.find((a) => a.id === e.areaId);
      if (!area || e.type === 'unclear' || e.occurredAt === null)
        throw new Error(r.id);
      let t = matchThread(threads, e, area) as TestThread | null;
      let outcome = 'new';
      if (t) {
        const change = threadChange(t, e);
        Object.assign(t, change);
        outcome = change.escalated ? 'escalated' : 'grouped';
        if (change.escalated) escalations++;
        t.firstSeen = Math.min(t.firstSeen, e.occurredAt);
        t.lastSeen = Math.max(t.lastSeen, e.occurredAt);
      } else {
        t = {
          id: `thread-${threads.length}`,
          family: FAMILY[e.type][0],
          type: e.type,
          severity: e.severity,
          status: 'open',
          areaId: area.id,
          lat: area.lat,
          lng: area.lng,
          firstSeen: e.occurredAt,
          lastSeen: e.occurredAt,
          reports: [],
        };
        threads.push(t);
      }
      t.reports.push({ id: r.id, claims: e.claims });
      expect(outcome, r.id).toBe(r.expected.outcome);
      const cluster = r.expected.cluster;
      if (!cluster) throw new Error(r.id);
      clusters[cluster] ??= t.id;
      expect(t.id, r.id).toBe(clusters[cluster]);
    }
    for (const expected of fixtures.threads) {
      const t = threads.find((t) => t.id === clusters[expected.cluster]);
      expect(t).toBeDefined();
      if (!t) throw new Error(expected.cluster);
      for (const key of ['type', 'severity', 'status'] as const)
        expect(t[key]).toBe(expected[key]);
      expect(t.reports.map((r) => r.id).sort()).toEqual(
        [...expected.reports].sort(),
      );
      const actual = labelsFromCounts(countClaims(t.reports));
      expect(actual.map((l) => JSON.stringify(l)).sort()).toEqual(
        expected.labels.map((l) => JSON.stringify(l)).sort(),
      );
    }
    expect({ stored, held, threads: threads.length, escalations }).toEqual({
      stored: 23,
      held: 2,
      threads: 12,
      escalations: 3,
    });
  });
});
