import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { copy } from '../../copy';
import { Button } from '../../components/ui';
import { Confirm } from '../../components/ui/Confirm';
import { SegmentedControl } from '../../components/severity';
import { Coverage } from './Coverage';
import { LabTables } from './LabTables';
import { useTestRun } from './useTestRun';
export default function TestLabPage() {
  const [confirm, setConfirm] = useState(false);
  const {
    engine,
    setEngine,
    run,
    running,
    error,
    waiting,
    health,
    query,
    data,
    passed,
    total,
    start,
    reset,
  } = useTestRun();
  const tiles = [
    { label: copy.lab.passed, value: `${passed}/${total}` },
    { label: copy.lab.stored, value: data?.totals.stored ?? 0 },
    { label: copy.lab.held, value: data?.totals.held ?? 0 },
    { label: copy.headings.threads, value: data?.totals.threads ?? 0 },
  ];
  return (
    <div className="container page test-lab">
      <div className="page-title">
        <h1>{copy.headings.lab}</h1>
        <div className="actions">
          <SegmentedControl
            label={copy.engine.rules}
            value={engine}
            onChange={(v) => {
              if (v === 'rules' || v === 'ai') setEngine(v);
            }}
            items={[
              { value: 'rules', label: copy.lab.rules, disabled: running },
              {
                value: 'ai',
                label: copy.lab.ai,
                disabled:
                  running ||
                  !(health.data?.engines.groq || health.data?.engines.gemini),
              },
            ]}
          />
          <Button busy={running} onClick={() => void start()}>
            {running ? copy.lab.running : copy.lab.run}
          </Button>
          <Button
            variant="secondary"
            disabled={!run || running}
            onClick={() => setConfirm(true)}
          >
            <RotateCcw size={14} />
            {copy.actions.reset}
          </Button>
        </div>
      </div>
      <div className="lab-progress">
        <progress
          value={total}
          max={25}
          aria-label={copy.lab.progress(total)}
        />
        <span className="numbers">{copy.lab.progress(total)}</span>
      </div>
      {waiting > 0 && (
        <p className="meta" role="status">
          {copy.lab.waiting(waiting)}
        </p>
      )}
      {(error || query.isError) && (
        <p className="field-error" role="alert">
          {error || copy.errors.lab}
        </p>
      )}
      <div className="stat-grid">
        {tiles.map((tile) => (
          <div className="stat-tile" key={tile.label}>
            <span>{tile.label}</span>
            <strong>{tile.value}</strong>
          </div>
        ))}
      </div>
      <p className="meta lab-disclaimer">{copy.academic}</p>
      <Coverage data={data} />
      <LabTables data={data} />
      <Confirm
        open={confirm}
        onOpenChange={setConfirm}
        title={copy.lab.reset}
        onConfirm={() => void reset()}
      />
    </div>
  );
}
