import { expect, inject, it } from 'vitest';
import type { IncidentDetail, IncidentList, ReportOk } from 'core';
import { analyzeReport } from 'core';
import { bindings } from './setup';
import { list } from '../db/read';
import { storeReport } from '../db/write';
import { adminApp as app } from './setup';

async function seed() {
  await bindings.DB.exec(
    inject('seed')
      .split('\n')
      .filter((line) => !line.startsWith('--'))
      .join(' '),
  );
}

it('seeds five linked, multilingual demo threads once and preserves existing reports', async () => {
  const real = analyzeReport(
    'Suspicious activity in Saddar right now',
    {},
    Date.now(),
  );
  if (real.status !== 'ok') throw new Error('Incomplete test report');
  const saved = await storeReport(bindings.DB, real);
  await seed();
  await seed();
  const response = await app.request(
    'https://safelens.test/api/incidents',
    {},
    bindings,
  );
  const data = await response.json<IncidentList>();
  const demos = data.incidents.filter((i) => i.simulated);
  expect(demos).toHaveLength(5);
  expect(demos.map((i) => i.severity).sort()).toEqual([1, 2, 2, 3, 3]);
  expect(new Set(demos.flatMap((i) => i.languages))).toEqual(
    new Set(['English', 'Urdu', 'Roman Urdu', 'Mixed']),
  );
  expect(
    data.incidents.find((i) => i.id === saved.incident.id)?.simulated,
  ).toBeUndefined();
  let reports = 0;
  for (const i of demos) {
    const detail = await (
      await app.request(
        `https://safelens.test/api/incidents/${i.ref}`,
        {},
        bindings,
      )
    ).json<IncidentDetail>();
    reports += detail.reports.length;
    expect(detail.reports).toHaveLength(i.reportCount);
    expect(detail.timeline.filter((e) => e.kind === 'opened')).toHaveLength(1);
    expect(
      detail.timeline.filter((e) => e.kind === 'report_added'),
    ).toHaveLength(i.reportCount - 1);
    expect(detail.incident.lat).toBeGreaterThan(24.6);
    expect(detail.incident.lng).toBeGreaterThan(66.6);
    expect(detail.incident.status).not.toBe('resolved');
  }
  expect(reports).toBe(11);
  const later = await list(bindings.DB, 'active', Date.now() + 2 * 86400000);
  expect(later.incidents).toHaveLength(5);
});

it('keeps real reports separate from demo threads and supports demo status changes', async () => {
  await seed();
  const demo = (await list(bindings.DB)).incidents.find(
    (i) => i.areaId === 'clifton',
  );
  if (!demo) throw new Error('Missing Clifton demo');
  const response = await app.request(
    'https://safelens.test/api/reports',
    {
      method: 'POST',
      headers: {
        Origin: 'https://safelens.test',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: 'Armed robbery at a shop in Clifton, two men with pistols took cash',
        time: '70 minutes ago',
      }),
    },
    bindings,
  );
  const result = await response.json<ReportOk>();
  expect(result.outcome).toBe('new');
  expect(result.incident.id).not.toBe(demo.id);
  expect(result.incident.simulated).toBeUndefined();
  const patch = await app.request(
    `https://safelens.test/api/incidents/${demo.ref}`,
    {
      method: 'PATCH',
      headers: {
        Origin: 'https://safelens.test',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'resolved' }),
    },
    bindings,
  );
  expect(patch.status).toBe(200);
  expect((await patch.json<IncidentDetail>()).timeline.at(-1)?.kind).toBe(
    'status_changed',
  );
  expect(
    (await list(bindings.DB)).incidents.find((i) => i.id === demo.id),
  ).toBeUndefined();
  expect(
    (await list(bindings.DB, 'resolved')).incidents.find(
      (i) => i.id === demo.id,
    )?.simulated,
  ).toBe(true);
});
