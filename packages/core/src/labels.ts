import type { IncidentType, ClaimKey, Language } from './schema';
export const TYPE_LABELS: Record<IncidentType,string> = { suspicious:'Suspicious activity',theft:'Theft',snatching:'Snatching',robbery:'Robbery',harassment:'Harassment',assault:'Assault',firing:'Firing',kidnapping:'Kidnapping attempt',fire:'Fire',accident:'Accident',hazard:'Hazard',unclear:'Unclear' };
export const CLAIM_LABELS: Record<ClaimKey,string> = { weapon:'Weapon involved',no_weapon:'No weapon',injury:'Injuries reported',no_injury:'No injuries',ongoing:'Still ongoing',resolved:'Resolved or under control',motorbike:'Motorbike involved',multiple:'More than one person' };
export const SEVERITY_LABELS = { 1:'Low', 2:'Moderate', 3:'High' } as const;
export const STATUS_LABELS = { open:'Open', escalated:'Escalated', monitoring:'Monitoring', resolved:'Resolved' } as const;
export const LANGUAGE_TAGS: Record<Language,string> = { English:'en', Urdu:'ur', 'Roman Urdu':'ur-Latn', Mixed:'ur' };
