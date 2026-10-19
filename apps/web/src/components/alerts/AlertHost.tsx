import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Popover } from 'radix-ui';
import { Toaster, toast } from 'sonner';
import { Volume2, VolumeX } from 'lucide-react';
import { copy } from '../../copy';
import { Button } from '../ui';
import { incidentsQuery } from '../../lib/query';
import {
  useAlerts,
  ownRefs,
  publishAlerts,
  flushAlerts,
} from '../../stores/alerts';
import { diffAlerts, activeSnapshot } from '../../lib/alert-diff';
import { SeverityIcon, severityClass } from '../severity';
import { relative } from '../../lib/format';
import { RedAlertDialog } from './RedAlertDialog';
import { useNow } from '../../lib/useNow';
import { useTheme } from '../../lib/theme';
export default function AlertHost() {
  const { data, dataUpdatedAt } = useQuery({
      ...incidentsQuery(),
      refetchInterval: 10000,
      refetchIntervalInBackground: false,
    }),
    baseline = useRef<Record<number, number> | null>(null),
    now = useNow();
  const state = useAlerts();
  const theme = useTheme();
  const activeAlerts =
    data?.incidents.filter((i) => i.status !== 'resolved') ?? [];
  const alerts = [
    ...activeAlerts.map((incident) => ({
      incident,
      at: incident.updatedAt,
      key: `active:${incident.ref}`,
    })),
    ...state.alerts.filter(
      (a) => !activeAlerts.some((i) => i.ref === a.incident.ref),
    ),
  ];
  useEffect(() => {
    const dismiss = (event: KeyboardEvent) => {
      if (
        event.key === 'Escape' &&
        document.activeElement?.closest('[data-sonner-toast]')
      ) {
        toast.dismiss();
      }
    };
    document.addEventListener('keydown', dismiss);
    return () => document.removeEventListener('keydown', dismiss);
  }, []);
  useEffect(() => {
    if (!data) return;
    publishAlerts(diffAlerts(baseline.current, data.incidents, ownRefs));
    baseline.current = activeSnapshot(data.incidents);
  }, [data, dataUpdatedAt]);
  useEffect(() => {
    const visible = () => {
      if (!document.hidden) {
        flushAlerts();
        useAlerts.getState().markSeen();
      }
    };
    document.addEventListener('visibilitychange', visible);
    return () => document.removeEventListener('visibilitychange', visible);
  }, []);
  useEffect(() => {
    document.title = state.unseen
      ? `(${state.unseen}) ${copy.brand}`
      : copy.brand;
    const icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (icon) icon.href = state.unseen ? '/favicon-alert.svg' : '/favicon.svg';
  }, [state.unseen]);
  const level = data?.counts.high
    ? 3
    : data?.counts.moderate
      ? 2
      : data?.counts.low
        ? 1
        : 0;
  const count =
    level === 3
      ? data?.counts.high
      : level === 2
        ? data?.counts.moderate
        : data?.counts.low;
  return (
    <>
      <Popover.Root
        onOpenChange={(open) => {
          if (open) state.markSeen();
        }}
      >
        <Popover.Trigger asChild>
          <Button variant="secondary" className="beacon">
            <span
              className={`dot ${level ? severityClass[level] : 'level-low'} ${level === 3 ? 'pulse-high' : level === 2 ? 'pulse-mod' : ''}`}
            />
            {data
              ? level
                ? copy.alerts.count(count ?? 0, copy.severity[level])
                : copy.alerts.clear
              : copy.alerts.title}
          </Button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            className="popover alert-center"
            sideOffset={12}
            align="end"
          >
            <div className="result-heading">
              <h2>{copy.alerts.title}</h2>
              <Button
                variant="icon"
                aria-label={
                  state.sound ? copy.alerts.soundOff : copy.alerts.soundOn
                }
                aria-pressed={state.sound}
                onClick={state.toggleSound}
              >
                {state.sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </Button>
            </div>
            {!alerts.length ? (
              <p className="meta">{copy.empty.alerts}</p>
            ) : (
              alerts.map((a) => (
                <Popover.Close asChild key={`${a.key}:${a.at}`}>
                  <Link
                    to={`/incidents/${a.incident.ref}`}
                    className={`alert-center-row ${severityClass[a.incident.severity]}`}
                  >
                    <SeverityIcon level={a.incident.severity} size={18} />
                    <span>
                      <strong>
                        {copy.incident.title(
                          copy.type[a.incident.type],
                          a.incident.areaName,
                        )}
                      </strong>
                      <small>
                        {a.incident.simulated && <>{copy.demo.badge} · </>}
                        {relative(a.at, now)} · {copy.unverifiedPill}
                      </small>
                    </span>
                  </Link>
                </Popover.Close>
              ))
            )}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      <RedAlertDialog />
      <Toaster position="top-right" visibleToasts={3} theme={theme} />
    </>
  );
}
