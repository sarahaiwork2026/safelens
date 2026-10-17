import fixtures from '../fixtures/test-reports.json';
import { analyzeReport } from './pipeline';
import { AREAS } from './gazetteer';
import { FAMILY } from './lexicon';
import { threadChange } from './threading';
import { countClaims,labelsFromCounts,evidenceSummary } from './claims';
import { GUIDANCE } from './guidance';
import type { IncidentDetail,ReportView,TimelineEvent } from './api';
export function buildDemoSnapshot():IncidentDetail {
 const now=Date.parse('2026-10-18T22:00:00+05:00'),reports:ReportView[]=[],timeline:TimelineEvent[]=[];
 let current:IncidentDetail['incident']|undefined;
 for(const fixture of fixtures.reports.filter(r=>r.expected.cluster==='C01').sort((a,b)=>b.minutesAgo-a.minutesAgo)){
  const result=analyzeReport(fixture.text,{time:`${fixture.minutesAgo} minutes ago`},now);if(result.status!=='ok')throw new Error('Demo fixture is incomplete');const x=result.extraction,area=AREAS.find(a=>a.id===x.areaId);if(!area||x.type==='unclear'||x.occurredAt===null)throw new Error('Demo location or type is missing');
  const report:ReportView={...x,id:`demo-${fixture.id}`,text:result.stored,createdAt:x.occurredAt};reports.push(report);
  const event=(kind:TimelineEvent['kind']):TimelineEvent=>({id:timeline.length+1,at:report.createdAt,kind,severity:current?.severity??x.severity,reportId:report.id,fromType:null,toType:null,fromSeverity:null,toSeverity:null,fromStatus:null,toStatus:null});
  if(!current){current={id:'demo-C01',ref:1,code:'INC-0001',type:x.type,family:FAMILY[x.type][0],severity:x.severity,status:'open',areaId:area.id,areaName:area.name,lat:area.lat,lng:area.lng,summary:x.summary,reportCount:1,languages:[x.language],evidence:{supported:0,disputed:0,unconfirmed:0},firstSeen:x.occurredAt,lastSeen:x.occurredAt,escalatedAt:null,updatedAt:report.createdAt};timeline.push(event('opened'));}
  else{const change=threadChange(current,x);if(change.escalated)timeline.push({...event('escalated'),severity:change.severity,fromType:current.type,toType:change.type,fromSeverity:current.severity,toSeverity:change.severity});current={...current,type:change.type,severity:change.severity,status:change.status,reportCount:reports.length,languages:[...new Set([...current.languages,x.language])],lastSeen:x.occurredAt,escalatedAt:change.escalated?report.createdAt:current.escalatedAt,summary:x.severity>=current.severity?x.summary:current.summary,updatedAt:report.createdAt};timeline.push(event('report_added'));}
 }
 if(!current)throw new Error('Demo contains no reports');const labels=labelsFromCounts(countClaims(reports)).map(l=>({...l,reportIds:reports.filter(r=>r.claims.includes(l.claim)).map(r=>r.id),opposingReportIds:l.opposing?reports.filter(r=>r.claims.includes(l.opposing?.claim??l.claim)).map(r=>r.id):[]}));current.evidence=evidenceSummary(labels);return {incident:current,reports,timeline,labels,guidance:GUIDANCE[current.type]};
}
