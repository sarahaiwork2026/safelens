import { analyzeReport,mergeExtraction,missingFields } from 'core';
import type { Form,Analysis } from 'core';
import type { Env } from '../env';
import { reserveBudget } from '../services/budget';
import { extractProvider } from './openai-compatible';
export async function analyzeWithChain(env:Env,text:string,form:Form,now=Date.now(),mode?:'rules'|'ai'):Promise<Analysis>{
 const rules=analyzeReport(text,form,now);if(rules.status==='rejected'||mode==='rules')return rules;
 const chain=mode==='ai'?'groq,gemini,rules':env.EXTRACTOR_CHAIN;
 const signal=AbortSignal.timeout(12000);
 for(const name of chain.split(',').map(n=>n.trim())){
  if(name==='rules')break;if(name!=='groq'&&name!=='gemini')continue;
  const key=name==='groq'?env.GROQ_API_KEY:env.GEMINI_API_KEY,model=name==='groq'?env.GROQ_MODEL:env.GEMINI_MODEL;if(!key)continue;
  const start=Date.now(),result=await extractProvider({engine:name,key,model,signal,reserve:()=>reserveBudget(env.DB,`llm:${name}`,Number(env.LLM_DAILY_BUDGET)||800)},rules.stored,form,now);
  console.info(JSON.stringify({engine:name,model,llmLatencyMs:Date.now()-start,fallbackReason:result.ok?null:result.reason}));
  if(!result.ok){if(signal.aborted)break;continue;}
  if(result.data.flags.includes('accusation'))return {status:'rejected',code:'accusation'};if(result.data.flags.includes('hate'))return {status:'rejected',code:'hate'};
  const x=mergeExtraction(rules.extraction,result.data,form,now,name,model),missing=missingFields(x);return {status:missing.length?'needs_info':'ok',extraction:x,stored:rules.stored,missing};
 }
 return rules;
}
