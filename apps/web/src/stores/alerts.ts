import { create } from 'zustand';
import { createElement } from 'react';
import { toast } from 'sonner';
import type { ReportOk } from 'core';
import type { AlertCandidate } from '../lib/alert-diff';
import { AlertToast } from '../components/alerts/AlertToast';
import { copy } from '../copy';
import { playAlertSound } from '../lib/sound';
export interface SessionAlert extends AlertCandidate {at:number;key:string}
interface AlertsState {alerts:SessionAlert[];high:SessionAlert[];pending:AlertCandidate[];sound:boolean;unseen:number;toggleSound:()=>void;dismissHigh:()=>void;markSeen:()=>void}
export const useAlerts=create<AlertsState>(set=>({alerts:[],high:[],pending:[],sound:false,unseen:0,toggleSound:()=>set(s=>({sound:!s.sound})),dismissHigh:()=>set({high:[],unseen:0}),markSeen:()=>set({unseen:0})}));
export const ownRefs=new Set<number>();
let seen:Record<string,number>={};
try{const data:unknown=JSON.parse(localStorage.getItem('safelens-alerts')??'{}');if(data&&typeof data==='object')for(const [key,at] of Object.entries(data))if(typeof at==='number'&&at>Date.now()-86400000)seen[key]=at;}catch{seen={};}
export function publishAlerts(candidates:AlertCandidate[],flush=false){if(!candidates.length)return;if(document.hidden&&!flush){useAlerts.setState(s=>({pending:[...s.pending,...candidates]}));return;}
 const now=Date.now(),unique=candidates.filter(c=>{const key=`${c.incident.ref}:${c.incident.severity}`;if((seen[key]??0)>now-86400000)return false;seen[key]=now;return true;}).map(c=>({...c,at:now,key:`${c.incident.ref}:${c.incident.severity}`}));
 if(!unique.length)return;try{localStorage.setItem('safelens-alerts',JSON.stringify(seen));}catch(error){if(error instanceof Error)console.info('Alert history is unavailable');}
 const high=unique.filter(a=>a.incident.severity===3),other=unique.filter(a=>a.incident.severity!==3);
 useAlerts.setState(s=>({alerts:[...unique,...s.alerts].slice(0,100),high:flush?s.high:[...s.high,...high],unseen:s.unseen+high.length}));
 if(flush)toast(copy.alerts.away(unique.length));else{if(other.length>2)toast(copy.alerts.combined(other.length),{action:{label:copy.alerts.viewAll,onClick:()=>{window.location.assign('/incidents');}}});else for(const alert of other)toast.custom(()=>createElement(AlertToast,{incident:alert.incident}),{duration:alert.incident.severity===2?8000:5000});if(high.length&&useAlerts.getState().sound)void playAlertSound();}
}
export function publishOwn(result:ReportOk){ownRefs.add(result.incident.ref);if(!result.duplicate)publishAlerts([{incident:result.incident,reason:result.outcome==='escalated'?'escalated':'new'}]);}
export function flushAlerts(){const pending=useAlerts.getState().pending;useAlerts.setState({pending:[]});publishAlerts(pending,true);}
