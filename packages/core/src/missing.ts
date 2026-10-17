import type { ExtractionData, Missing } from './schema';
export function missingFields(x: ExtractionData): Missing[] {
 const fields:Missing[] = [];
 if(x.type==='unclear') fields.push('type');
 if(!x.areaId) fields.push('location');
 if(x.occurredAt===null) fields.push('time');
 return fields;
}
