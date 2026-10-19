import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { EscalationPath } from '../incident/EscalationPath';
import { useRef } from 'react';
import { Link } from 'react-router';
import { AlertDialog } from 'radix-ui';
import { ShieldAlert, Volume2, VolumeX, Info } from 'lucide-react';
import { CONTACTS } from 'core';
import { useAlerts } from '../../stores/alerts';
import { copy } from '../../copy';
import { Button, buttonClass } from '../ui';
import { relative } from '../../lib/format';
export function RedAlertDialog() {
  const high = useAlerts((s) => s.high),
    sound = useAlerts((s) => s.sound),
    toggle = useAlerts((s) => s.toggleSound),
    dismiss = useAlerts((s) => s.dismissHigh),
    first = high[0],
    link = useRef<HTMLAnchorElement>(null);
  const detail = useQuery({
    queryKey: ['incident', String(first?.incident.ref ?? '')],
    queryFn: () => api.incident(String(first?.incident.ref ?? '')),
    enabled: Boolean(first && first.reason === 'escalated'),
  });
  const escalation = detail.data?.timeline
    .filter((e) => e.kind === 'escalated')
    .at(-1);
  if (!first) return null;
  const i = first.incident;
  return (
    <AlertDialog.Root
      open
      onOpenChange={(open) => {
        if (!open) dismiss();
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="dialog-overlay" />
        <AlertDialog.Content
          className="dialog-card red-alert"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            link.current?.focus();
          }}
          onEscapeKeyDown={() => dismiss()}
        >
          <div className="alert-top">
            <div className="radar-icon">
              <ShieldAlert size={26} />
            </div>
            <Button
              variant="icon"
              onClick={toggle}
              aria-label={sound ? copy.alerts.soundOff : copy.alerts.soundOn}
            >
              {sound ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </Button>
          </div>
          <AlertDialog.Title>
            {first.reason === 'escalated'
              ? copy.alerts.escalated
              : copy.alerts.high}
          </AlertDialog.Title>
          <h3>{copy.incident.title(copy.type[i.type], i.areaName)}</h3>
          {escalation?.fromType &&
            escalation.toType &&
            escalation.fromSeverity &&
            escalation.toSeverity && (
              <div className="incident-escalation">
                <EscalationPath
                  escalation={{
                    fromType: escalation.fromType,
                    toType: escalation.toType,
                    fromSeverity: escalation.fromSeverity,
                    toSeverity: escalation.toSeverity,
                  }}
                />
              </div>
            )}
          <AlertDialog.Description className="alert-description">
            {i.summary}
          </AlertDialog.Description>
          <p className="meta">
            {i.simulated && <>{copy.demo.incident} </>}
            {i.code} · {copy.incident.reports(i.reportCount)} ·{' '}
            {relative(i.updatedAt)}
          </p>
          <p className="alert-warning">
            <Info size={16} />
            {copy.alerts.warning}
          </p>
          <div className="inline alert-contacts">
            {CONTACTS.filter((c) => c.id === 'police' || c.id === 'rescue').map(
              (c) => (
                <a key={c.id} href={`tel:${c.number}`}>
                  {c.id === 'police'
                    ? copy.contacts.police
                    : copy.contacts.rescue}{' '}
                  {c.number}
                </a>
              ),
            )}
          </div>
          <div className="actions">
            <AlertDialog.Action asChild>
              <Link
                ref={link}
                to={`/incidents/${i.ref}`}
                onClick={dismiss}
                className={buttonClass()}
              >
                {copy.actions.open}
              </Link>
            </AlertDialog.Action>
            <AlertDialog.Cancel asChild>
              <Button variant="secondary" onClick={dismiss}>
                {copy.actions.dismiss}
              </Button>
            </AlertDialog.Cancel>
            {high.length > 1 && (
              <Link to="/incidents?level=high" onClick={dismiss}>
                {copy.alerts.more(high.length - 1)}
              </Link>
            )}
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
