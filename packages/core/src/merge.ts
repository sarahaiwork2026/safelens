import type { ExtractionData, LlmData, Form, Engine } from './schema';
import { PAIRS } from './claims';
import { findArea } from './gazetteer';
import { parseTime } from './time';
import { CONTACT_NUMBERS } from './contacts';
export function guardText(text:string,fallback:string,limit:number,action=false):string {
 const clean=text.replace(/https?:\/\/\S+/g,'').replace(/<[^>]*>/g,'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim();
 if(!clean || /[؀-ۿ]|\b(verified|confirmed|proven|true|false|criminal|terrorist|suspect|culprit|guilty|accused|ignore)\b/i.test(clean) || (action && (clean.match(/\d+/g)??[]).some(n=>!CONTACT_NUMBERS.has(n)))) return fallback;
 return clean.length<=limit ? clean : clean.slice(0,limit).replace(/\s+\S*$/,'');
}
export function mergeExtraction(rules:ExtractionData,llm:LlmData,form:Form,now:number,engine:Exclude<Engine,'rules'>,model:string):ExtractionData {
 const x:ExtractionData={...rules,claims:[...new Set(llm.claims)],flags:llm.flags,engine,model};
 if(llm.type!=='unclear' && llm.confidence.type>=0.5) { x.type=llm.type; x.confidence.type=llm.confidence.type; }
 for(const [a,b] of PAIRS) {
  if((b==='no_weapon'||b==='no_injury') && rules.claims.includes(b)) x.claims=x.claims.filter(c=>c!==a).concat(b).filter((c,i,all)=>all.indexOf(c)===i);
  if(x.claims.includes(a) && x.claims.includes(b)) x.claims=x.claims.filter(c=>c!==a&&c!==b).concat(rules.claims.filter(c=>c===a||c===b));
 }
 x.severity=x.claims.includes('weapon')||x.claims.includes('injury')?3:llm.severity;
 if(!x.areaId && llm.location_text) { const area=findArea(llm.location_text); if(area) { x.areaId=area.id;x.lat=area.lat;x.lng=area.lng;x.confidence.location=llm.confidence.location; } x.locationText=form.location || llm.location_text; }
 if(x.occurredAt===null && llm.confidence.time>=0.7) { const time=llm.minutes_ago!==null?{minutesAgo:llm.minutes_ago}:llm.clock_time?parseTime(llm.clock_time,now):null; if(time){x.occurredAt=time.occurredAt??now-time.minutesAgo*60000;x.confidence.time=llm.confidence.time;} }
 x.summary=guardText(llm.summary,rules.summary,200);
 x.recommendedAction=guardText(llm.recommended_action,rules.recommendedAction,200,true);
 x.severityReason=guardText(llm.severity_reason,rules.severityReason,160);
 return x;
}
