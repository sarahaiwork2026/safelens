import { CheckCheck, Split, CircleDashed } from 'lucide-react';
import type { EvidenceLabel } from 'core';
import { copy } from '../../copy';
import { Card, Pill } from '../ui';
export function ClaimLabel({ kind }: { kind: EvidenceLabel['kind'] }) {
  const Icon = {
    supported: CheckCheck,
    contradictory: Split,
    unconfirmed: CircleDashed,
  }[kind];
  return (
    <Pill className={`claim-${kind}`}>
      <Icon size={13} />
      {copy.evidence[kind]}
    </Pill>
  );
}
function Dots({ count }: { count: number }) {
  return (
    <span className="evidence-dots" aria-hidden="true">
      {Array.from({ length: Math.min(count, 8) }, (_, i) => (
        <i key={i} />
      ))}
      {count > 8 && <span>+{count - 8}</span>}
    </span>
  );
}
export function EvidencePanel({
  labels,
  reportCount,
  onHighlight,
}: {
  labels: EvidenceLabel[];
  reportCount: number;
  onHighlight?: ((ids: string[]) => void) | undefined;
}) {
  const stats = [
    { label: copy.fields.reports, count: reportCount },
    {
      label: copy.evidence.supported,
      count: labels.filter((l) => l.kind === 'supported').length,
    },
    {
      label: copy.evidence.disputed,
      count: labels.filter((l) => l.kind === 'contradictory').length,
    },
    {
      label: copy.evidence.needs,
      count: labels.filter((l) => l.kind === 'unconfirmed').length,
    },
  ];
  return (
    <Card className="evidence-panel">
      <h2>{copy.headings.evidence}</h2>
      <div className="evidence-stats">
        {stats.map((s) => (
          <div key={s.label}>
            <strong>{s.count}</strong>
            <span>{s.label}</span>
          </div>
        ))}
      </div>
      {!labels.length && <p className="meta">{copy.empty.claims}</p>}
      <div className="evidence-rows">
        {labels.map((l) => {
          const content = (
            <>
              <ClaimLabel kind={l.kind} />
              <span className="evidence-claim">
                {copy.claim[l.claim]}
                <Dots count={l.count} />
                {l.opposing && (
                  <>
                    <span className="muted">{copy.evidence.versus}</span>
                    <Dots count={l.opposing.count} />
                    {copy.claim[l.opposing.claim]}
                  </>
                )}
              </span>
            </>
          );
          return onHighlight ? (
            <button
              key={l.claim}
              onClick={() =>
                onHighlight([
                  ...(l.reportIds ?? []),
                  ...(l.opposingReportIds ?? []),
                ])
              }
            >
              {content}
            </button>
          ) : (
            <div key={l.claim}>{content}</div>
          );
        })}
      </div>
    </Card>
  );
}
