import { Link, useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Plus, ArrowUpRight } from 'lucide-react';
import { incidentsQuery } from '../../lib/query';
import { copy } from '../../copy';
import {
  SeverityPill,
  StatusPill,
  SeverityToggle,
  severityClass,
} from '../../components/severity';
import {
  ActionLink,
  EmptyState,
  ErrorState,
  Skeleton,
} from '../../components/ui';
import { Select } from '../../components/ui/Select';
import { relative, clock } from '../../lib/format';
import { useNow } from '../../lib/useNow';
const levels = { high: 3, moderate: 2, low: 1 };
export default function IncidentsPage() {
  const [params, setParams] = useSearchParams(),
    status = params.get('status') ?? 'active',
    level = params.get('level'),
    now = useNow();
  const query = useQuery(incidentsQuery(status)),
    data = query.data;
  const selected =
    level && level in levels ? levels[level as keyof typeof levels] : null;
  const list =
    data?.incidents.filter((i) => !selected || i.severity === selected) ?? [];
  const setLevel = (value: string) =>
    setParams((p) => {
      if (value === 'all') p.delete('level');
      else p.set('level', value);
      return p;
    });
  return (
    <div className="container page">
      <div className="page-title">
        <h1>{copy.headings.incidents}</h1>
        <div className="actions">
          <SeverityToggle {...(data ? { counts: data.counts } : {})} />
          <Select
            id="list-status"
            label={copy.fields.status}
            value={status}
            onChange={(v) =>
              setParams((p) => {
                p.set('status', v);
                return p;
              })
            }
            options={[
              { value: 'active', label: copy.incidents.active },
              { value: 'resolved', label: copy.incidents.resolved },
              { value: 'all', label: copy.incidents.all },
            ]}
          />
        </div>
      </div>
      {query.isPending ? (
        <Skeleton />
      ) : query.isError ? (
        <ErrorState
          title={copy.errors.incidents}
          retry={() => void query.refetch()}
        />
      ) : (
        data && (
          <>
            <div className="stat-grid">
              {[
                {
                  label: copy.incidents.active,
                  value: data.counts.active,
                  filter: 'all',
                },
                {
                  label: copy.severity[3],
                  value: data.counts.high,
                  filter: 'high',
                },
                {
                  label: copy.severity[2],
                  value: data.counts.moderate,
                  filter: 'moderate',
                },
                {
                  label: copy.severity[1],
                  value: data.counts.low,
                  filter: 'low',
                },
              ].map((s) => (
                <button
                  className={`stat-tile ${(level ?? 'all') === s.filter ? 'selected' : ''}`}
                  key={s.filter}
                  onClick={() => setLevel(s.filter)}
                >
                  <span>{s.label}</span>
                  <strong>{s.value}</strong>
                  <ArrowUpRight size={14} />
                </button>
              ))}
            </div>
            <div className="distribution" aria-hidden="true">
              {([3, 2, 1] as const).map((s) => {
                const count =
                  s === 3
                    ? data.counts.high
                    : s === 2
                      ? data.counts.moderate
                      : data.counts.low;
                return (
                  <i
                    key={s}
                    className={severityClass[s]}
                    style={{ flex: count }}
                  />
                );
              })}
            </div>
            <div className="activity-panel">
              <span className="meta">{copy.incidents.hours}</span>
              <div
                className="activity-strip"
                role="img"
                aria-label={copy.incidents.bar(
                  copy.incidents.hours,
                  data.counts.reports24h,
                )}
              >
                {data.activity.map((a) => (
                  <span
                    key={a.hourStart}
                    title={copy.incidents.bar(clock(a.hourStart), a.reports)}
                    className={
                      a.maxSeverity ? severityClass[a.maxSeverity] : ''
                    }
                    style={{
                      height:
                        4 +
                        (36 * a.reports) /
                          Math.max(1, ...data.activity.map((a) => a.reports)),
                    }}
                  />
                ))}
              </div>
            </div>
            {!list.length ? (
              <EmptyState
                title={
                  selected
                    ? copy.empty.filtered(copy.severity[selected as 1 | 2 | 3])
                    : copy.empty.incidents
                }
              >
                {selected ? (
                  <button
                    className="button button-secondary"
                    onClick={() => setLevel('all')}
                  >
                    {copy.actions.all}
                  </button>
                ) : (
                  <>
                    <ActionLink to="/report">
                      <Plus size={16} />
                      {copy.actions.report}
                    </ActionLink>
                    <ActionLink to="/test-lab" variant="secondary">
                      {copy.actions.lab}
                    </ActionLink>
                  </>
                )}
              </EmptyState>
            ) : (
              <div className="table-wrap">
                <table className="incident-table">
                  <thead>
                    <tr>
                      {[
                        copy.fields.severity,
                        copy.fields.incident,
                        copy.fields.status,
                        copy.fields.reports,
                        copy.fields.updated,
                      ].map((s) => (
                        <th key={s} scope="col">
                          {s}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((i) => (
                      <tr key={i.ref} className={severityClass[i.severity]}>
                        <td>
                          <SeverityPill level={i.severity} />
                        </td>
                        <td>
                          <div className="incident-title">
                            <span className="meta numbers">{i.code}</span>
                            <Link
                              to={`/incidents/${i.ref}`}
                              className="incident-link"
                            >
                              {copy.incident.title(
                                copy.type[i.type],
                                i.areaName,
                              )}
                            </Link>
                          </div>
                          <p className="meta row-summary">{i.summary}</p>
                        </td>
                        <td>
                          <StatusPill status={i.status} />
                        </td>
                        <td className="numbers">{i.reportCount}</td>
                        <td className="meta numbers">
                          {relative(i.updatedAt, now)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )
      )}
    </div>
  );
}
