import type { IncidentDetail,TimelineEvent } from 'core';
import { copy } from '../../copy';
import { Card } from '../ui';
import { severityClass,LanguageBadge } from '../severity';
import { EscalationPath } from './EscalationPath';
import { clock } from '../../lib/format';
export function Timeline({timeline,reports}:{timeline:TimelineEvent[];reports:IncidentDetail['reports']}){return <Card className="timeline-card"><h2>{copy.headings.timeline}</h2><ol className="timeline">{timeline.map((event,i)=>{const report=reports.find(r=>r.id===event.reportId),title=event.kind==='status_changed'?copy.incident.status(copy.status[event.toStatus??'open']):copy.incident.events[event.kind];return <li key={event.id} className={`${severityClass[event.severity]} ${event.kind==='escalated'?'timeline-escalated':''}`}><span className="timeline-node"/><div className="timeline-item"><div className="timeline-title"><h3>{title}</h3><time>{clock(event.at)}</time></div>{event.kind==='escalated'&&event.fromType&&event.toType&&event.fromSeverity&&event.toSeverity?<EscalationPath escalation={{fromType:event.fromType,toType:event.toType,fromSeverity:event.fromSeverity,toSeverity:event.toSeverity}}/>:report&&<p>{report.summary}</p>}<div className="inline meta">{report&&<LanguageBadge language={report.language}/>}<span>{i===timeline.length-1?copy.incident.latest:''}</span></div></div></li>;})}</ol></Card>;}
