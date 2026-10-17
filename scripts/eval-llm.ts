import { appendFile } from 'node:fs/promises';
import type { Health,TestRunCreated,TestRunView } from '../packages/core/src';
import { BASE_FIXTURES } from '../packages/core/src/evaluation';
const target=process.env.SAFELENS_TARGET??'http://127.0.0.1:5173';
async function request<T>(path:string,body?:unknown):Promise<T>{const response=await fetch(target+path,body===undefined?{}:{method:'POST',headers:{Origin:new URL(target).origin,'Content-Type':'application/json'},body:JSON.stringify(body)});if(!response.ok)throw new Error(`Evaluation request failed: ${response.status}`);return response.json() as Promise<T>;}
const health=await request<Health>('/api/health');if(!health.engines.groq&&!health.engines.gemini)throw new Error('Configure a Groq or Gemini key securely before live AI evaluation.');
const run=await request<TestRunCreated>('/api/test-runs',{engine:'ai'});
for(const reportId of run.order){await request(`/api/test-runs/${run.runId}/steps`,{reportId});await new Promise(resolve=>setTimeout(resolve,3000));}
const result=await request<TestRunView>(`/api/test-runs/${run.runId}`);
const scores={type:0,severity:0,outcome:0,language:0,area:0,provider:0};
for(const r of result.results){const e=BASE_FIXTURES.reports.find(f=>f.id===r.reportId)?.expected;if(!e)continue;if(e.type===r.extraction.type)scores.type++;if(Math.abs(e.severity-r.extraction.severity)<=1)scores.severity++;if(e.outcome===r.outcome)scores.outcome++;if(e.language===r.extraction.language)scores.language++;if(e.areaId===r.extraction.areaId)scores.area++;if(r.extraction.engine!=='rules')scores.provider++;}
const passed=scores.type>=23&&scores.severity===25&&scores.outcome>=23&&scores.language===25&&scores.area===25&&scores.provider===25;
const record=`\n## ${new Date().toISOString()}\n\nModels: ${[...new Set(result.results.map(r=>r.extraction.model??r.extraction.engine))].join(', ')}\n\n${JSON.stringify(scores)}\n\nBase thresholds: ${passed?'passed':'failed'}. Extra multilingual AI cases are not scored by this command; run their separate evaluation before recording the full AI gate.\n`;
await appendFile('docs/eval-log.md',record);process.stdout.write(record);if(!passed)process.exitCode=1;
