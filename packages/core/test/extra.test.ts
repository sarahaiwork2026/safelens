import { expect, it } from 'vitest';
import fixtures from '../fixtures/test-reports-extra.json';
import { analyzeReport } from '../src';
for(const r of fixtures.reports) it(`${r.id}: multilingual extraction and edge case`,()=>{
 const now=Date.parse(r.now??fixtures.defaultNow),result=analyzeReport(r.text,r.form,now),e=r.expected;
 expect(result.status).toBe(e.status);
 if(result.status==='rejected'){expect(result.code).toBe(e.code);return;}
 for(const key of ['language','type','severity','areaId'] as const) if(key in e)expect(result.extraction[key],key).toBe(e[key]);
 if(e.claims)expect([...result.extraction.claims].sort()).toEqual([...e.claims].sort());
 if(e.missing)expect(result.missing).toEqual(e.missing);
 if(e.minutesAgo!==undefined)expect(result.extraction.occurredAt).toBe(now-e.minutesAgo*60000);
 if(e.occurredAt)expect(result.extraction.occurredAt).toBe(Date.parse(e.occurredAt));
 if(e.storedTextContains)expect(result.stored).toContain(e.storedTextContains);
 if(e.storedTextExcludes)expect(result.stored).not.toContain(e.storedTextExcludes);
 if(e.forbiddenWords)for(const word of e.forbiddenWords)expect(result.extraction.summary.toLowerCase()).not.toContain(word);
});
