import { ShieldAlert,TriangleAlert,ShieldCheck,Info,Cpu,Languages,Circle,TrendingUp,Activity,CircleCheck } from 'lucide-react';
import { ToggleGroup } from 'radix-ui';
import { useSearchParams } from 'react-router';
import type { Severity,Status,Engine,Language } from 'core';
import { Pill } from '../ui';
import { copy } from '../../copy';
export const severityClass={1:'level-low',2:'level-mod',3:'level-high'} as const;
export const SeverityIcon=({level,size=14}:{level:Severity;size?:number})=>{const Icon=level===3?ShieldAlert:level===2?TriangleAlert:ShieldCheck;return <Icon size={size} aria-hidden="true"/>;};
export function SeverityPill({level}:{level:Severity}){return <Pill className={`severity ${severityClass[level]}`}><SeverityIcon level={level}/>{copy.severity[level]}</Pill>;}
export function StatusPill({status}:{status:Status}){const Icon={open:Circle,escalated:TrendingUp,monitoring:Activity,resolved:CircleCheck}[status];return <Pill><Icon size={14}/>{copy.status[status]}</Pill>;}
export function UnverifiedPill(){return <Pill><Info size={14}/>{copy.unverifiedPill}</Pill>;}
export function EngineBadge({engine,model}:{engine:Engine;model?:string|null}){return <Pill title={engine==='rules'?copy.engine.fallback:undefined}><Cpu size={14}/>{copy.engine[engine]}{model?` · ${model.replace('openai/','')}`:''}</Pill>;}
export function LanguageBadge({language}:{language:Language}){return <Pill><Languages size={14}/>{language}</Pill>;}
export function SegmentedControl({label,value,onChange,items}:{label:string;value:string;onChange:(value:string)=>void;items:{value:string;label:string;count?:number;level?:Severity;disabled?:boolean}[]}){return <ToggleGroup.Root type="single" value={value} onValueChange={v=>{if(v)onChange(v);}} className="segments" aria-label={label}>{items.map(item=><ToggleGroup.Item key={item.value} value={item.value} disabled={item.disabled} title={item.disabled?copy.lab.addKey:undefined}>{item.level&&<span className={`dot ${severityClass[item.level]}`}/>}<span>{item.label}</span>{item.count!==undefined&&<span className="segment-count">{item.count}</span>}</ToggleGroup.Item>)}</ToggleGroup.Root>;}
export function SeverityToggle({counts}:{counts?:{high:number;moderate:number;low:number}}){const [params,setParams]=useSearchParams();return <SegmentedControl label={copy.fields.severity} value={params.get('level')??'all'} onChange={v=>setParams(prev=>{if(v==='all')prev.delete('level');else prev.set('level',v);return prev;})} items={[{value:'all',label:copy.incidents.all},{value:'high',label:copy.severity[3],level:3,...(counts?{count:counts.high}:{})},{value:'moderate',label:copy.severity[2],level:2,...(counts?{count:counts.moderate}:{})},{value:'low',label:copy.severity[1],level:1,...(counts?{count:counts.low}:{})}]}/>;}
