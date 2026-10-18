// Keep statement construction together so every report commits as one ordered D1 batch.
import { AREAS, FAMILY, norm, matchThread, threadChange } from 'core';
import type { Analysis, ReportOk, ExtractionData } from 'core';
import { claimCounts, incidentView, reportView } from './rows';
import type { IncidentRow, ReportRow } from './rows';
import { sha256 } from '../services/crypto';
import { detail } from './read';
import { ApiError } from '../services/errors';
type Complete = Exclude<Analysis, { status: 'rejected' }>;
function insertReport(
  db: D1Database,
  id: string,
  incidentId: string,
  dataset: string,
  text: string,
  hash: string,
  x: ExtractionData,
  now: number,
) {
  return db
    .prepare(
      `INSERT INTO reports (id,incident_id,dataset,text,text_hidden,text_hash,language,type,severity,severity_reason,area_id,location_text,lat,lng,occurred_at,time_text,summary,recommended_action,claims,confidence,flags,engine,model,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    )
    .bind(
      id,
      incidentId,
      dataset,
      text,
      Number(x.flags.includes('identifying_details')),
      hash,
      x.language,
      x.type,
      x.severity,
      x.severityReason,
      x.areaId,
      x.locationText,
      x.lat,
      x.lng,
      x.occurredAt,
      x.timeText,
      x.summary,
      x.recommendedAction,
      JSON.stringify(x.claims),
      JSON.stringify(x.confidence),
      JSON.stringify(x.flags),
      x.engine,
      x.model,
      now,
    );
}
export async function storeReport(
  db: D1Database,
  result: Complete,
  dataset = 'live',
  now = Date.now(),
  retry = true,
): Promise<ReportOk> {
  const x = result.extraction,
    area = AREAS.find((a) => a.id === x.areaId);
  if (!area || x.type === 'unclear' || x.occurredAt === null)
    throw new ApiError(422, 'invalid_input', 'Complete the missing details.');
  const hash = await sha256(norm(result.stored));
  const duplicate = await db
    .prepare(
      'SELECT * FROM reports WHERE dataset=? AND text_hash=? AND created_at>=? ORDER BY created_at DESC LIMIT 1',
    )
    .bind(dataset, hash, now - 60000)
    .first<ReportRow>();
  if (duplicate) {
    const row = await db
      .prepare('SELECT * FROM incidents WHERE id=?')
      .bind(duplicate.incident_id)
      .first<IncidentRow>();
    if (row)
      return {
        status: 'ok',
        outcome: 'added',
        duplicate: true,
        report: reportView(duplicate),
        incident: incidentView(row),
        escalation: null,
      };
  }
  const { results: rows } = await db
    .prepare(
      'SELECT * FROM incidents WHERE dataset=? AND family=? AND last_seen>=? AND first_seen<=?',
    )
    .bind(
      dataset,
      FAMILY[x.type][0],
      x.occurredAt - 10800000,
      x.occurredAt + 10800000,
    )
    .all<IncidentRow>();
  const candidates = rows.map((r) => ({
    id: r.id,
    family: r.family,
    type: r.type,
    severity: r.severity,
    status: r.status,
    lat: r.lat,
    lng: r.lng,
    firstSeen: r.first_seen,
    lastSeen: r.last_seen,
  }));
  const matched = matchThread(candidates, x, area),
    row = rows.find((r) => r.id === matched?.id),
    incidentId = row?.id ?? crypto.randomUUID(),
    id = crypto.randomUUID(),
    statements: D1PreparedStatement[] = [];
  let outcome: ReportOk['outcome'] = 'new',
    escalation: ReportOk['escalation'] = null;
  if (row && matched) {
    const change = threadChange(matched, x),
      counts = claimCounts(row.claim_counts);
    for (const claim of x.claims) counts[claim] = (counts[claim] ?? 0) + 1;
    const languages = new Set(incidentView(row).languages);
    languages.add(x.language);
    statements.push(
      db
        .prepare(
          'UPDATE incidents SET type=?,severity=?,status=?,report_count=report_count+1,claim_counts=?,languages=?,first_seen=MIN(first_seen,?),last_seen=MAX(last_seen,?),summary=?,escalated_at=?,updated_at=? WHERE id=?',
        )
        .bind(
          change.type,
          change.severity,
          change.status,
          JSON.stringify(counts),
          JSON.stringify([...languages]),
          x.occurredAt,
          x.occurredAt,
          x.severity >= row.severity ? x.summary : row.summary,
          change.escalated ? now : row.escalated_at,
          now,
          row.id,
        ),
    );
    outcome = change.escalated ? 'escalated' : 'added';
    if (change.escalated)
      escalation = {
        fromType: row.type,
        toType: change.type,
        fromSeverity: row.severity,
        toSeverity: change.severity,
      };
    if (change.reopened)
      statements.push(
        db
          .prepare(
            'INSERT INTO timeline_events (incident_id,at,kind,severity,from_status,to_status) VALUES (?,?,?,?,?,?)',
          )
          .bind(
            incidentId,
            now,
            'reopened',
            change.severity,
            'resolved',
            'open',
          ),
      );
  } else {
    const counts = Object.fromEntries(x.claims.map((c) => [c, 1]));
    statements.push(
      db
        .prepare(
          `INSERT INTO incidents (id,ref,dataset,type,family,severity,status,area_id,lat,lng,summary,report_count,claim_counts,languages,first_seen,last_seen,created_at,updated_at) VALUES (?,(SELECT COALESCE(MAX(ref),0)+1 FROM incidents WHERE dataset=?),?,?,?,?,'open',?,?,?,?,1,?,?,?,?,?,?)`,
        )
        .bind(
          incidentId,
          dataset,
          dataset,
          x.type,
          FAMILY[x.type][0],
          x.severity,
          area.id,
          area.lat,
          area.lng,
          x.summary,
          JSON.stringify(counts),
          JSON.stringify([x.language]),
          x.occurredAt,
          x.occurredAt,
          now,
          now,
        ),
    );
  }
  statements.push(
    insertReport(db, id, incidentId, dataset, result.stored, hash, x, now),
  );
  if (escalation)
    statements.push(
      db
        .prepare(
          'INSERT INTO timeline_events (incident_id,at,kind,severity,report_id,from_type,to_type,from_severity,to_severity) VALUES (?,?,?,?,?,?,?,?,?)',
        )
        .bind(
          incidentId,
          now,
          'escalated',
          escalation.toSeverity,
          id,
          escalation.fromType,
          escalation.toType,
          escalation.fromSeverity,
          escalation.toSeverity,
        ),
    );
  statements.push(
    db
      .prepare(
        'INSERT INTO timeline_events (incident_id,at,kind,severity,report_id) VALUES (?,?,?,?,?)',
      )
      .bind(
        incidentId,
        now,
        row ? 'report_added' : 'opened',
        escalation?.toSeverity ?? row?.severity ?? x.severity,
        id,
      ),
  );
  try {
    await db.batch(statements);
  } catch (error) {
    if (
      retry &&
      error instanceof Error &&
      /UNIQUE constraint failed: incidents.dataset, incidents.ref/.test(
        error.message,
      )
    )
      return storeReport(db, result, dataset, now, false);
    throw error;
  }
  const finalRow = await db
    .prepare('SELECT * FROM incidents WHERE id=?')
    .bind(incidentId)
    .first<IncidentRow>();
  if (!finalRow) throw new Error('Incident write failed');
  const complete = await detail(db, finalRow.ref, dataset),
    report = complete.reports.find((r) => r.id === id);
  if (!report) throw new Error('Report write failed');
  return {
    status: 'ok',
    outcome,
    duplicate: false,
    report,
    incident: complete.incident,
    escalation,
  };
}
