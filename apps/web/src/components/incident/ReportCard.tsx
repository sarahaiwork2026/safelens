import { LANGUAGE_TAGS } from 'core';
import type { ReportView } from 'core';
import { copy } from '../../copy';
import { LanguageBadge,EngineBadge,SeverityPill } from '../severity';
import { when } from '../../lib/format';
export function ReportCard({report,highlighted=false}:{report:ReportView;highlighted?:boolean}){const urdu=report.language==='Urdu'||report.language==='Mixed';return <article className={`report-card ${highlighted?'report-highlight':''}`} id={`report-${report.id}`}><div className="report-meta"><LanguageBadge language={report.language}/><EngineBadge engine={report.engine} model={report.model}/><SeverityPill level={report.severity}/><time>{report.occurredAt!==null?when(report.occurredAt):''}</time></div><p>{report.summary}</p>{report.text===null?<p className="meta">{copy.incident.hidden}</p>:<details><summary>{copy.actions.original}</summary><p dir="auto" lang={LANGUAGE_TAGS[report.language]} className={`user-text ${urdu?'user-text-urdu':''}`}>{report.text}</p></details>}</article>;}
