import { expect,it } from 'vitest';
import { activeSnapshot,diffAlerts } from './alert-diff';
import type { IncidentSummary } from 'core';
const incident:IncidentSummary={id:'one',ref:1,code:'INC-0001',type:'suspicious',family:'property',severity:1,status:'open',areaId:'clifton',areaName:'Clifton',lat:24.8,lng:67,summary:'Suspicious activity reported.',reportCount:1,languages:['English'],evidence:{supported:0,disputed:0,unconfirmed:0},firstSeen:1,lastSeen:1,escalatedAt:null,updatedAt:1};
it('does not alert on a baseline, own submissions, resolved incidents or unchanged snapshots',()=>{expect(diffAlerts(null,[incident],new Set())).toEqual([]);expect(diffAlerts(activeSnapshot([incident]),[incident],new Set())).toEqual([]);expect(diffAlerts({},[incident],new Set([1]))).toEqual([]);expect(diffAlerts({},[{...incident,status:'resolved'}],new Set())).toEqual([]);});
it('detects a new incident and a severity increase',()=>{expect(diffAlerts({},[incident],new Set())[0]?.reason).toBe('new');expect(diffAlerts({1:1},[{...incident,severity:3}],new Set())[0]?.reason).toBe('escalated');});
