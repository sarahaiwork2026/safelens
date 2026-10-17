import { useSyncExternalStore } from 'react';
let now=Date.now();
const listeners=new Set<()=>void>();
let timer:ReturnType<typeof setInterval>|undefined;
function subscribe(listener:()=>void){listeners.add(listener);if(!timer)timer=setInterval(()=>{now=Date.now();for(const callback of listeners)callback();},30000);return()=>{listeners.delete(listener);if(!listeners.size&&timer){clearInterval(timer);timer=undefined;}};}
export function useNow(){return useSyncExternalStore(subscribe,()=>now);}
