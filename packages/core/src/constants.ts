export const LANGUAGES = ['English', 'Urdu', 'Roman Urdu', 'Mixed'] as const;
export const INCIDENT_TYPES = [
  'suspicious',
  'theft',
  'snatching',
  'robbery',
  'harassment',
  'assault',
  'firing',
  'kidnapping',
  'fire',
  'accident',
  'hazard',
  'unclear',
] as const;
export const CLAIM_KEYS = [
  'weapon',
  'no_weapon',
  'injury',
  'no_injury',
  'ongoing',
  'resolved',
  'motorbike',
  'multiple',
] as const;
export const FLAGS = [
  'accusation',
  'identifying_details',
  'hate',
  'not_an_incident',
  'multiple_incidents',
] as const;
export const STATUSES = [
  'open',
  'escalated',
  'monitoring',
  'resolved',
] as const;
export const ENGINES = ['groq', 'gemini', 'rules'] as const;
export const MISSING = ['type', 'location', 'time'] as const;
export type Language = (typeof LANGUAGES)[number];
export type IncidentType = (typeof INCIDENT_TYPES)[number];
export type ClaimKey = (typeof CLAIM_KEYS)[number];
export type Severity = 1 | 2 | 3;
export type Status = (typeof STATUSES)[number];
export type Engine = (typeof ENGINES)[number];
export type Missing = (typeof MISSING)[number];
export type Family = 'property' | 'violence' | 'fire' | 'accident' | 'hazard';
