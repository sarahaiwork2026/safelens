import { Check, CircleDashed } from 'lucide-react';
import { copy } from '../../copy';
import { Card } from '../ui';
export function UnderstandingPanel({
  rows,
}: {
  rows: { label: string; value: string | null | undefined }[];
}) {
  return (
    <Card className="understanding">
      <h2>{copy.headings.understanding}</h2>
      <dl aria-live="polite">
        {rows.map(({ label, value }) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>
              {value || copy.report.notFound}
              {value ? <Check size={14} /> : <CircleDashed size={14} />}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
