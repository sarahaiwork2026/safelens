import { CheckCircle2, XCircle } from 'lucide-react';
import { LANGUAGE_TAGS } from 'core';
import type { TestRunView } from 'core';
import { copy } from '../../copy';
import { Pill } from '../../components/ui';
import { SeverityPill } from '../../components/severity';
function ResultPill({ pass }: { pass: boolean }) {
  const Icon = pass ? CheckCircle2 : XCircle;
  return (
    <Pill className={`lab-result ${pass ? 'level-low' : 'level-high'}`}>
      <Icon size={12} />
      {pass ? copy.lab.pass : copy.lab.fail}
    </Pill>
  );
}

export function LabTables({ data }: { data: TestRunView | undefined }) {
  return (
    <>
      <section className="lab-results">
        <h2>{copy.headings.results}</h2>
        <div
          className="table-wrap"
          role="region"
          aria-label={copy.headings.results}
          tabIndex={0}
        >
          <table>
            <thead>
              <tr>
                {[
                  copy.fields.id,
                  copy.fields.description,
                  copy.fields.language,
                  copy.fields.type,
                  copy.fields.severity,
                  copy.fields.area,
                  copy.fields.outcome,
                  copy.fields.result,
                ].map((label) => (
                  <th key={label}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data?.results.map((r) => (
                <tr className={r.pass ? '' : 'lab-failure'} key={r.reportId}>
                  <td>{r.reportId}</td>
                  <td className="lab-summary">
                    <span
                      dir="auto"
                      lang={LANGUAGE_TAGS[r.extraction.language]}
                    >
                      {r.extraction.summary}
                    </span>
                    {!r.pass && (
                      <details>
                        <summary>{copy.fields.result}</summary>
                        {r.differences.map((d) => (
                          <p key={d}>{d}</p>
                        ))}
                      </details>
                    )}
                  </td>
                  <td>{r.extraction.language}</td>
                  <td>{copy.type[r.extraction.type]}</td>
                  <td>
                    <SeverityPill level={r.extraction.severity} />
                  </td>
                  <td>{r.extraction.locationText ?? copy.report.notFound}</td>
                  <td>{r.outcome}</td>
                  <td>
                    <ResultPill pass={r.pass} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="lab-results">
        <h2>{copy.headings.threads}</h2>
        <div
          className="table-wrap"
          role="region"
          aria-label={copy.headings.threads}
          tabIndex={0}
        >
          <table>
            <thead>
              <tr>
                {[
                  copy.fields.cluster,
                  copy.fields.incident,
                  copy.fields.type,
                  copy.fields.severity,
                  copy.fields.status,
                  copy.fields.reports,
                  copy.fields.labels,
                  copy.fields.result,
                ].map((label) => (
                  <th key={label}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data?.threads.map((t) => (
                <tr key={t.detail.incident.ref}>
                  <td>{t.cluster}</td>
                  <td>{t.detail.incident.code}</td>
                  <td>{copy.type[t.detail.incident.type]}</td>
                  <td>
                    <SeverityPill level={t.detail.incident.severity} />
                  </td>
                  <td>{copy.status[t.detail.incident.status]}</td>
                  <td>{t.reportIds.join(', ')}</td>
                  <td>
                    {t.detail.labels.map((l) => (
                      <span className="lab-evidence" key={l.claim}>
                        {copy.evidence[l.kind]}: {copy.claim[l.claim]} (
                        {l.count})
                        {l.opposing
                          ? ` ${copy.evidence.versus} ${copy.claim[l.opposing.claim]} (${l.opposing.count})`
                          : ''}
                      </span>
                    ))}
                  </td>
                  <td>
                    <ResultPill pass={t.pass} />
                    {!t.pass && (
                      <details>
                        <summary>{copy.fields.result}</summary>
                        {t.differences.map((d) => (
                          <p key={d}>{d}</p>
                        ))}
                      </details>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
