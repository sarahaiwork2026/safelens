// @vitest-environment jsdom
import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { custom: vi.fn() }),
}));
import { toast } from 'sonner';
import { publishAlerts, useAlerts, flushAlerts } from './alerts';
import type { IncidentSummary } from 'core';
const incident: IncidentSummary = {
  id: 'alert',
  ref: 101,
  code: 'INC-0101',
  type: 'theft',
  family: 'property',
  severity: 2,
  status: 'open',
  areaId: 'clifton',
  areaName: 'Clifton',
  lat: 24.8,
  lng: 67,
  summary: 'Theft reported.',
  reportCount: 1,
  languages: ['English'],
  evidence: { supported: 0, disputed: 0, unconfirmed: 0 },
  firstSeen: 1,
  lastSeen: 1,
  escalatedAt: null,
  updatedAt: 1,
};
beforeEach(() => {
  vi.clearAllMocks();
  useAlerts.setState({
    alerts: [],
    high: [],
    pending: [],
    sound: false,
    unseen: 0,
  });
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
});
it('deduplicates a severity delivery and coalesces bursts', () => {
  publishAlerts([{ incident, reason: 'new' }]);
  publishAlerts([{ incident, reason: 'new' }]);
  expect(toast.custom).toHaveBeenCalledTimes(1);
  publishAlerts(
    [102, 103, 104].map((ref) => ({
      incident: { ...incident, ref },
      reason: 'new',
    })),
  );
  expect(toast).toHaveBeenCalledWith('3 new incidents', expect.anything());
  expect(useAlerts.getState().alerts).toHaveLength(4);
});
it('queues hidden-tab updates and shows one summary on return', () => {
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
  publishAlerts([{ incident: { ...incident, ref: 105 }, reason: 'new' }]);
  expect(toast.custom).not.toHaveBeenCalled();
  expect(useAlerts.getState().pending).toHaveLength(1);
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
  flushAlerts();
  expect(toast).toHaveBeenCalledWith('1 update while you were away');
  expect(useAlerts.getState().pending).toHaveLength(0);
});
