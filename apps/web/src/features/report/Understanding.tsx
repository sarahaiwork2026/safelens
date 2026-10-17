import { Check,CircleDashed } from 'lucide-react';
import { AREAS } from 'core';
import type { Analysis } from 'core';
import { copy } from '../../copy';
import { Card } from '../../components/ui';
import { when } from '../../lib/format';
export function Understanding({analysis}:{analysis:Analysis}){const x=analysis.status==='rejected'?null:analysis.extraction;const rows=[{label:copy.fields.language,value:x?.language},{label:copy.fields.type,value:x&&x.type!=='unclear'?copy.type[x.type]:null},{label:copy.fields.area,value:AREAS.find(a=>a.id===x?.areaId)?.name},{label:copy.fields.time,value:x?.occurredAt!==null&&x?.occurredAt!==undefined?when(x.occurredAt):null}];return <Card className="understanding"><h2>{copy.headings.understanding}</h2><dl aria-live="polite">{rows.map(({label,value})=><div key={label}><dt>{label}</dt><dd>{value||copy.report.notFound}{value?<Check size={14}/>:<CircleDashed size={14}/>}</dd></div>)}</dl></Card>;}
