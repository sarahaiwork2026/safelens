import { AREAS } from 'core';
import type { Analysis } from 'core';
import { copy } from '../../copy';
import { UnderstandingPanel } from '../../components/incident/UnderstandingPanel';
import { when } from '../../lib/format';
export function Understanding({ analysis }: { analysis: Analysis }) {
  const x = analysis.status === 'rejected' ? null : analysis.extraction;
  const rows = [
    { label: copy.fields.language, value: x?.language },
    {
      label: copy.fields.type,
      value: x && x.type !== 'unclear' ? copy.type[x.type] : null,
    },
    {
      label: copy.fields.area,
      value: AREAS.find((a) => a.id === x?.areaId)?.name,
    },
    {
      label: copy.fields.time,
      value:
        x?.occurredAt !== null && x?.occurredAt !== undefined
          ? when(x.occurredAt)
          : null,
    },
  ];
  return <UnderstandingPanel rows={rows} />;
}
