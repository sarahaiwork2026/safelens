import { ArrowRight } from 'lucide-react';
import { Fragment } from 'react';
import { copy } from '../../copy';
export function Pipeline() {
  return (
    <ol className="pipeline-rail">
      {copy.landing.steps.map((step, index) => (
        <Fragment key={step}>
          <li>{step}</li>
          {index < copy.landing.steps.length - 1 && (
            <li className="pipeline-arrow" aria-hidden="true">
              <ArrowRight size={16} />
            </li>
          )}
        </Fragment>
      ))}
    </ol>
  );
}
