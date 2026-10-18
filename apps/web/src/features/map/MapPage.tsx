import { lazy, Suspense, useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';
import { X } from 'lucide-react';
import { copy } from '../../copy';
import { incidentsQuery } from '../../lib/query';
import {
  ActionLink,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Skeleton,
} from '../../components/ui';
import { SeverityPill, SeverityToggle } from '../../components/severity';
import { relative } from '../../lib/format';
import { useNow } from '../../lib/useNow';
const MapCanvas = lazy(() => import('./MapCanvas'));
const levels = { high: 3, moderate: 2, low: 1 };
export default function MapPage() {
  const [params, setParams] = useSearchParams(),
    [inView, setInView] = useState<number[] | null>(null),
    now = useNow();
  const query = useQuery(incidentsQuery()),
    selected = Number(params.get('selected')) || null,
    level = params.get('level'),
    filter =
      level && level in levels ? levels[level as keyof typeof levels] : null;
  const incidents = useMemo(
      () =>
        query.data?.incidents.filter((i) => !filter || i.severity === filter) ??
        [],
      [query.data, filter],
    ),
    current = incidents.find((i) => i.ref === selected);
  const select = useCallback(
    (ref: number) =>
      setParams((p) => {
        p.set('selected', String(ref));
        return p;
      }),
    [setParams],
  );
  const updateInView = useCallback((refs: number[]) => setInView(refs), []);
  const visible = incidents.filter((i) => !inView || inView.includes(i.ref));
  return (
    <div className="map-page">
      <h1 className="sr-only">{copy.headings.map}</h1>
      {query.isPending ? (
        <div className="container page">
          <Skeleton />
        </div>
      ) : query.isError ? (
        <div className="container page">
          <ErrorState
            title={copy.errors.incidents}
            retry={() => void query.refetch()}
          />
        </div>
      ) : (
        <>
          <aside className="map-list">
            <h2>{copy.map.inView}</h2>
            {visible.length ? (
              visible.map((i) => (
                <button
                  key={i.ref}
                  className={`map-list-item ${selected === i.ref ? 'selected' : ''}`}
                  onClick={() => select(i.ref)}
                >
                  <SeverityPill level={i.severity} />
                  <strong>
                    {copy.incident.title(copy.type[i.type], i.areaName)}
                  </strong>
                  <small>
                    {copy.incident.reports(i.reportCount)} ·{' '}
                    {relative(i.updatedAt, now)}
                  </small>
                </button>
              ))
            ) : (
              <EmptyState title={copy.empty.map}>
                {filter ? (
                  <Button
                    variant="secondary"
                    onClick={() =>
                      setParams((p) => {
                        p.delete('level');
                        return p;
                      })
                    }
                  >
                    {copy.map.all}
                  </Button>
                ) : (
                  <ActionLink
                    to={query.data?.incidents.length ? '/incidents' : '/report'}
                    variant="secondary"
                  >
                    {query.data?.incidents.length
                      ? copy.actions.incidents
                      : copy.actions.report}
                  </ActionLink>
                )}
              </EmptyState>
            )}
          </aside>
          <div className="map-view">
            <Suspense fallback={<Skeleton />}>
              <MapCanvas
                incidents={incidents}
                selected={selected}
                onSelect={select}
                onInView={updateInView}
              />
            </Suspense>
            <div className="map-filters">
              <SeverityToggle
                {...(query.data ? { counts: query.data.counts } : {})}
              />
            </div>
            {current && (
              <Card className="map-selection">
                <div className="result-heading">
                  <SeverityPill level={current.severity} />
                  <Button
                    variant="icon"
                    aria-label={copy.actions.close}
                    onClick={() =>
                      setParams((p) => {
                        p.delete('selected');
                        return p;
                      })
                    }
                  >
                    <X size={18} />
                  </Button>
                </div>
                <h2>
                  {copy.incident.title(
                    copy.type[current.type],
                    current.areaName,
                  )}
                </h2>
                <p>{current.summary}</p>
                <p className="meta">
                  {copy.incident.reports(current.reportCount)} ·{' '}
                  {copy.map.radius}
                </p>
                <ActionLink to={`/incidents/${current.ref}`}>
                  {copy.actions.open}
                </ActionLink>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}
