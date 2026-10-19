import { labelsFromCounts, GUIDANCE } from 'core';
import type { IncidentDetail, IncidentList, Severity } from 'core';
import { claimCounts, eventView, incidentView, reportView } from './rows';
import type { IncidentRow, ReportRow, EventRow } from './rows';
import { ApiError } from '../services/errors';
import { sourcesFor } from './sources';
export async function detail(
  db: D1Database,
  ref: number,
  dataset = 'live',
): Promise<IncidentDetail> {
  const row = await db
    .prepare('SELECT * FROM incidents WHERE dataset=? AND ref=?')
    .bind(dataset, ref)
    .first<IncidentRow>();
  if (!row) throw new ApiError(404, 'not_found', 'Incident not found.');
  const [{ results: reports }, { results: timeline }] = await Promise.all([
    db
      .prepare(
        'SELECT * FROM reports WHERE incident_id=? ORDER BY occurred_at,created_at,id',
      )
      .bind(row.id)
      .all<ReportRow>(),
    db
      .prepare(
        'SELECT * FROM timeline_events WHERE incident_id=? ORDER BY at,id',
      )
      .bind(row.id)
      .all<EventRow>(),
  ]);
  const views = reports.map(reportView),
    labels = labelsFromCounts(claimCounts(row.claim_counts)).map((l) => ({
      ...l,
      reportIds: views
        .filter((r) => r.claims.includes(l.claim))
        .map((r) => r.id),
      opposingReportIds: l.opposing
        ? views
            .filter((r) => r.claims.includes(l.opposing?.claim ?? l.claim))
            .map((r) => r.id)
        : [],
    }));
  return {
    incident: incidentView(row),
    sources: await sourcesFor(db, row.id),
    reports: views,
    timeline: timeline.map(eventView),
    labels,
    guidance: GUIDANCE[row.type],
  };
}
export async function list(
  db: D1Database,
  status = 'active',
  now = Date.now(),
): Promise<IncidentList> {
  const { results: rows } = await db
    .prepare(
      'SELECT * FROM incidents WHERE dataset=? ORDER BY severity DESC,updated_at DESC LIMIT 200',
    )
    .bind('live')
    .all<IncidentRow>();
  const active = rows.filter(
    (r) =>
      r.status !== 'resolved' &&
      (r.is_demo === 1 || r.last_seen >= now - 86400000),
  );
  const filtered =
    status === 'all'
      ? rows
      : status === 'resolved'
        ? rows.filter((r) => r.status === 'resolved')
        : active;
  const { results: reports } = await db
    .prepare(
      'SELECT created_at,severity FROM reports WHERE dataset=? AND created_at>=?',
    )
    .bind('live', now - 86400000)
    .all<{ created_at: number; severity: Severity }>();
  const hour = Math.floor(now / 3600000) * 3600000;
  const activity = Array.from({ length: 24 }, (_, i) => {
    const start = hour - (23 - i) * 3600000;
    const group = reports.filter(
      (r) => r.created_at >= start && r.created_at < start + 3600000,
    );
    return {
      hourStart: start,
      reports: group.length,
      maxSeverity: group.length
        ? (Math.max(...group.map((r) => r.severity)) as Severity)
        : null,
    };
  });
  return {
    incidents: filtered.map(incidentView),
    counts: {
      active: active.length,
      high: active.filter((r) => r.severity === 3).length,
      moderate: active.filter((r) => r.severity === 2).length,
      low: active.filter((r) => r.severity === 1).length,
      reports24h: reports.length,
    },
    activity,
    serverTime: now,
  };
}
