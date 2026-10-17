import { useState } from 'react';
import { Link,useParams } from 'react-router';
import { useMutation,useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { MapPin,ArrowLeft } from 'lucide-react';
import type { IncidentDetail,Status } from 'core';
import { api } from '../../lib/api';
import { queryClient } from '../../lib/query';
import { copy } from '../../copy';
import { ActionLink,Card,ErrorState,Skeleton,EmptyState } from '../../components/ui';
import { Select } from '../../components/ui/Select';
import { SeverityPill,StatusPill,UnverifiedPill,severityClass } from '../../components/severity';
import { typeIcons } from '../../components/incident/type-icons';
import { Timeline } from '../../components/incident/Timeline';
import { EvidencePanel } from '../../components/incident/EvidencePanel';
import { ReportCard } from '../../components/incident/ReportCard';
import { Contacts } from '../../components/incident/Contacts';
import { EscalationPath } from '../../components/incident/EscalationPath';
import { when } from '../../lib/format';
export default function IncidentPage(){const {ref=''}=useParams(),[highlighted,setHighlighted]=useState<string[]>([]);const query=useQuery({queryKey:['incident',ref],queryFn:()=>api.incident(ref)});const mutation=useMutation({mutationFn:(status:string)=>api.status(Number(ref),status),onMutate:async status=>{await queryClient.cancelQueries({queryKey:['incident',ref]});const previous=queryClient.getQueryData<IncidentDetail>(['incident',ref]);if(previous)queryClient.setQueryData(['incident',ref],{...previous,incident:{...previous.incident,status:status as Status}});return {previous};},onError:(_error,_status,context)=>{if(context?.previous)queryClient.setQueryData(['incident',ref],context.previous);toast.error(copy.incident.statusError);},onSuccess:data=>{queryClient.setQueryData(['incident',ref],data);void queryClient.invalidateQueries({queryKey:['incidents']});toast(copy.incident.status(copy.status[data.incident.status]));}});
 if(query.isPending)return <div className="container page"><Skeleton/></div>;
 if(query.isError)return <div className="container page"><ErrorState title={copy.errors.incident} retry={()=>void query.refetch()}/><ActionLink to="/incidents" variant="secondary">{copy.actions.back}</ActionLink></div>;
 if(!query.data)return <EmptyState title={copy.headings.incidentNotFound}><ActionLink to="/incidents">{copy.actions.back}</ActionLink></EmptyState>;
 const data=query.data,i=data.incident,Icon=typeIcons[i.type],escalation=data.timeline.filter(t=>t.kind==='escalated').at(-1);
 function highlight(ids:string[]){setHighlighted(ids);document.getElementById(`report-${ids[0]??''}`)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});setTimeout(()=>setHighlighted([]),1500);}
 return <div className="container page incident-page"><Link to="/incidents" className="breadcrumb"><ArrowLeft size={14}/>{copy.nav.incidents}<span>/</span><span>{i.code}</span></Link><div className="incident-header"><div className="incident-heading"><div className={`type-tile ${severityClass[i.severity]}`}><Icon size={24}/></div><h1>{copy.incident.title(copy.type[i.type],i.areaName)}</h1></div><div className="actions"><ActionLink variant="secondary" to={`/map?selected=${i.ref}`}><MapPin size={15}/>{copy.actions.map}</ActionLink><Select id="incident-status" label={copy.fields.status} value={i.status} disabled={mutation.isPending} onChange={v=>mutation.mutate(v)} options={[...(i.status==='escalated'?[{value:'escalated',label:copy.status.escalated}]:[]),...(['open','monitoring','resolved'] as const).map(s=>({value:s,label:copy.status[s]}))].filter(o=>o.value!=='escalated'||i.status==='escalated')}/></div></div><div className="inline"><SeverityPill level={i.severity}/><StatusPill status={i.status}/><UnverifiedPill/></div>{escalation?.fromType&&escalation.toType&&escalation.fromSeverity&&escalation.toSeverity&&<div className="incident-escalation"><EscalationPath escalation={{fromType:escalation.fromType,toType:escalation.toType,fromSeverity:escalation.fromSeverity,toSeverity:escalation.toSeverity}}/></div>}<hr className="subtle-rule"/><div className="two-column"><div className="stack"><Timeline timeline={data.timeline} reports={data.reports}/><section className="reports-section"><h2>{copy.headings.reports} <span className="muted">({i.reportCount})</span></h2><div className="stack">{data.reports.map(r=><ReportCard key={r.id} report={r} highlighted={highlighted.includes(r.id)}/>)}</div></section></div><aside className="stack"><EvidencePanel labels={data.labels} reportCount={i.reportCount} onHighlight={highlight}/><Card><h2>{copy.headings.details}</h2><dl className="detail-fields">{[{label:copy.fields.area,value:i.areaName},{label:copy.fields.first,value:when(i.firstSeen)},{label:copy.fields.latest,value:when(i.lastSeen)},{label:copy.fields.reports,value:i.reportCount},{label:copy.fields.languages,value:i.languages.join(', ')}].map(r=><div key={r.label}><dt>{r.label}</dt><dd>{r.value}</dd></div>)}</dl></Card><Card><h2>{copy.headings.guidance}</h2><p>{data.guidance}</p></Card><Contacts type={i.type}/><p className="meta">{copy.guidanceDisclaimer}</p></aside></div></div>;
}
