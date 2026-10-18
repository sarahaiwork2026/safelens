import { Check, CircleDashed } from 'lucide-react';
import type { TestRunView } from 'core';
import { copy } from '../../copy';
import { Card } from '../../components/ui';
export function Coverage({ data }: { data: TestRunView | undefined }) {
  const labels = copy.lab.coverage;
  return (
    <Card className="lab-coverage">
      <h2>{copy.headings.coverage}</h2>
      <ul>
        {(
          data?.coverage ?? labels.map((label) => ({ label, pass: false }))
        ).map((item) => (
          <li className={item.pass ? 'coverage-pass' : ''} key={item.label}>
            {item.pass ? <Check size={16} /> : <CircleDashed size={16} />}
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
