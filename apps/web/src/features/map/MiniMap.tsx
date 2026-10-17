import { lazy,Suspense,useEffect,useRef,useState } from 'react';
import type { IncidentSummary } from 'core';
import { ActionLink,Skeleton } from '../../components/ui';
import { copy } from '../../copy';
const Canvas=lazy(()=>import('./MapCanvas'));
export default function MiniMap({incident}:{incident:IncidentSummary}){const ref=useRef<HTMLDivElement>(null),[visible,setVisible]=useState(false);useEffect(()=>{const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){setVisible(true);observer.disconnect();}},{rootMargin:'100px'});if(ref.current)observer.observe(ref.current);return()=>observer.disconnect();},[]);return <div className="mini-map" ref={ref}>{visible?<Suspense fallback={<Skeleton/>}><Canvas incidents={[incident]} selected={incident.ref} interactive={false}/></Suspense>:<Skeleton/>}<ActionLink variant="secondary" to={`/map?selected=${incident.ref}`}>{copy.actions.map}</ActionLink></div>;}
