import { AREAS, km } from '../packages/core/src';
const agent=process.env.NOMINATIM_USER_AGENT;
if(!agent || !agent.includes('@'))throw new Error('Set NOMINATIM_USER_AGENT with your contact email before running this check.');
for(const area of AREAS.filter(a=>!a.locked)) {
 const url=new URL('https://nominatim.openstreetmap.org/search');url.search=new URLSearchParams({q:`${area.name}, Karachi, Pakistan`,format:'json',limit:'1'}).toString();
 const response=await fetch(url,{headers:{'User-Agent':agent},signal:AbortSignal.timeout(8000)});if(!response.ok)throw new Error(`Geocoder returned ${response.status}`);
 const rows:unknown=await response.json();
 if(Array.isArray(rows) && rows[0] && typeof rows[0]==='object' && 'lat' in rows[0] && 'lon' in rows[0]){const distance=km(area,{lat:Number(rows[0].lat),lng:Number(rows[0].lon)});process.stdout.write(`${area.name}: ${Math.round(distance*1000)} m ${distance>0.5?'REVIEW':'within tolerance'}\n`);}else process.stdout.write(`${area.name}: no match\n`);
 await new Promise(resolve=>setTimeout(resolve,1100));
}
