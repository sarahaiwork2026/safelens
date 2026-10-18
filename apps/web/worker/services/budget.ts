export async function reserveBudget(
  db: D1Database,
  key: string,
  limit: number,
  day = new Date().toISOString().slice(0, 10),
): Promise<boolean> {
  if (!Number.isFinite(limit) || limit <= 0) return false;
  const row = await db
    .prepare(
      'INSERT INTO usage_counters (day,key,n) VALUES (?,?,1) ON CONFLICT(day,key) DO UPDATE SET n=n+1 WHERE n<? RETURNING n',
    )
    .bind(day, key, limit)
    .first<{ n: number }>();
  return Boolean(row);
}
