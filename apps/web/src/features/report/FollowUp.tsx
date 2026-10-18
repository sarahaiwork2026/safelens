import { useState } from 'react';
import { Check } from 'lucide-react';
import { INCIDENT_TYPES, AREAS } from 'core';
import type { ReportNeedsInfo } from 'core';
import { copy } from '../../copy';
import { Card, Field, Button, Pill } from '../../components/ui';
import { AreaCombobox } from '../../components/ui/Combobox';
export function FollowUp({
  result,
  onSubmit,
  busy,
}: {
  result: ReportNeedsInfo;
  onSubmit: (answers: {
    type?: string;
    areaId?: string;
    time?: string;
  }) => void;
  busy: boolean;
}) {
  const [type, setType] = useState(''),
    [areaId, setAreaId] = useState(''),
    [time, setTime] = useState(''),
    [submitted, setSubmitted] = useState(false);
  const missing = result.missing,
    x = result.understood;
  const incomplete = missing.some(
    (k) => !(k === 'type' ? type : k === 'location' ? areaId : time),
  );
  return (
    <Card className="follow-up" key={result.draft}>
      <h2>{copy.headings.missing}</h2>
      <div className="kept">
        <h3>{copy.headings.understood}</h3>
        <div className="inline">
          {[
            x.language,
            x.type !== 'unclear' ? copy.type[x.type] : null,
            AREAS.find((a) => a.id === x.areaId)?.name,
          ]
            .filter(Boolean)
            .map((v) => (
              <Pill key={v}>
                <Check size={12} />
                {v}
              </Pill>
            ))}
        </div>
      </div>
      <div className="stack">
        {missing.includes('type') && (
          <Field
            id="follow-type"
            label={copy.fields.type}
            {...(submitted && !type ? { error: copy.report.chooseType } : {})}
          >
            <select
              id="follow-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              aria-invalid={submitted && !type}
            >
              <option value="">{copy.report.chooseType}</option>
              {INCIDENT_TYPES.filter((t) => t !== 'unclear').map((t) => (
                <option value={t} key={t}>
                  {copy.type[t]}
                </option>
              ))}
            </select>
          </Field>
        )}
        {missing.includes('location') && (
          <Field
            id="follow-area"
            label={copy.fields.area}
            {...(submitted && !areaId
              ? { error: copy.report.areaPlaceholder }
              : {})}
          >
            <AreaCombobox
              id="follow-area"
              value={areaId}
              onChange={setAreaId}
              byId
              required
            />
          </Field>
        )}
        {missing.includes('time') && (
          <Field
            id="follow-time"
            label={copy.fields.when}
            {...(submitted && !time
              ? { error: copy.errors.invalid_answer }
              : {})}
          >
            <input
              id="follow-time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder={copy.report.timePlaceholder}
            />
            <div className="time-chips">
              {copy.report.timeChips.map((t) => (
                <Button
                  key={t}
                  type="button"
                  variant="ghost"
                  onClick={() => setTime(t)}
                >
                  {t}
                </Button>
              ))}
            </div>
          </Field>
        )}
        <Button
          type="button"
          busy={busy}
          onClick={() => {
            setSubmitted(true);
            if (!incomplete)
              onSubmit({
                ...(type ? { type } : {}),
                ...(areaId ? { areaId } : {}),
                ...(time ? { time } : {}),
              });
          }}
        >
          {copy.actions.continue}
        </Button>
      </div>
    </Card>
  );
}
