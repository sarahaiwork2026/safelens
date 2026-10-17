import { describe, expect, it } from 'vitest';
import { ALIASES, analyzeReport, CONTACT_NUMBERS, GUIDANCE, parseTime, guardText, labelsFromCounts, matchThread, threadChange } from '../src';
import { TYPE_RULES } from '../src/lexicon';
import { LlmExtraction } from '../src/schema';
import { LLM_JSON_SCHEMA } from '../src/llm-schema';
import { FEW_SHOT_PAIRS } from '../src/prompt';
describe('domain invariants',()=>{
 it('keeps every guidance number in the official directory',()=>{for(const text of Object.values(GUIDANCE))for(const number of text.match(/\d+/g)??[])expect(CONTACT_NUMBERS.has(number)).toBe(true);});
 it('matches longer aliases before shorter ones',()=>{expect(ALIASES.map(a=>a.alias.length)).toEqual(ALIASES.map(a=>a.alias.length).sort((a,b)=>b-a));});
 it('keeps type lexicon terms unique',()=>{const terms=TYPE_RULES.flatMap(([,t])=>t);expect(new Set(terms).size).toBe(terms.length);});
 it('rejects overlong input before truncating and refuses stale times',()=>{expect(analyzeReport('x'.repeat(1001))).toEqual({status:'rejected',code:'too_long'});expect(parseTime('25 hours ago',Date.now())).toBeNull();});
 it('removes injection language and unsafe output',()=>{for(const text of ['مصدقہ رپورٹ','A confirmed criminal','https://bad.example','<b>verified</b>'])expect(guardText(text,'Safe fallback',200)).toBe('Safe fallback');expect(guardText('Call 999','Safe fallback',200,true)).toBe('Safe fallback');});
 it('uses matching strict JSON and Zod schema fields in every example',()=>{for(const pair of FEW_SHOT_PAIRS.filter(p=>p.role==='assistant')){const data:unknown=JSON.parse(pair.content);const parsed=LlmExtraction.parse(data);expect(Object.keys(parsed).sort()).toEqual([...LLM_JSON_SCHEMA.required].sort());expect(LLM_JSON_SCHEMA.additionalProperties).toBe(false);}});
 it('keeps opposing claims contradictory regardless of report counts',()=>{expect(labelsFromCounts({weapon:3,no_weapon:1})).toEqual([{kind:'contradictory',claim:'weapon',count:3,opposing:{claim:'no_weapon',count:1}}]);});
 it('reopens a matching resolved incident',()=>{const r=analyzeReport('Robbery in Clifton right now');if(r.status==='rejected')throw new Error('unexpected');const t={id:'one',family:'property' as const,type:'robbery' as const,severity:3 as const,status:'resolved' as const,lat:24.8138,lng:67.0320,firstSeen:Date.now(),lastSeen:Date.now()};expect(matchThread([t],r.extraction,t)?.id).toBe('one');expect(threadChange(t,r.extraction)).toMatchObject({reopened:true,status:'open'});});
});
