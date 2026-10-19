import type { OfficialSource } from 'core';
export async function sourcesFor(
  db: D1Database,
  incidentId: string,
): Promise<OfficialSource[]> {
  const { results } = await db
    .prepare(
      'SELECT id,title,url,summary,published_at AS publishedAt,reviewed_at AS reviewedAt FROM official_sources WHERE incident_id=? ORDER BY published_at DESC LIMIT 5',
    )
    .bind(incidentId)
    .all<OfficialSource>();
  return results;
}
