import { z } from 'zod';
export const LANGUAGES = ['English', 'Urdu', 'Roman Urdu', 'Mixed'] as const;
export const INCIDENT_TYPES = ['suspicious','theft','snatching','robbery','harassment','assault','firing','kidnapping','fire','accident','hazard','unclear'] as const;
export const CLAIM_KEYS = ['weapon','no_weapon','injury','no_injury','ongoing','resolved','motorbike','multiple'] as const;
export const FLAGS = ['accusation','identifying_details','hate','not_an_incident','multiple_incidents'] as const;
export const STATUSES = ['open','escalated','monitoring','resolved'] as const;
export const ENGINES = ['groq','gemini','rules'] as const;
export const MISSING = ['type','location','time'] as const;
export type Language = typeof LANGUAGES[number];
export type IncidentType = typeof INCIDENT_TYPES[number];
export type ClaimKey = typeof CLAIM_KEYS[number];
export type Severity = 1 | 2 | 3;
export type Status = typeof STATUSES[number];
export type Engine = typeof ENGINES[number];
export type Missing = typeof MISSING[number];
export type Family = 'property' | 'violence' | 'fire' | 'accident' | 'hazard';
export const severitySchema = z.union([z.literal(1),z.literal(2),z.literal(3)]);
const confidenceSchema = z.object({ type:z.number().min(0).max(1), location:z.number().min(0).max(1), time:z.number().min(0).max(1) });
export const LlmExtraction = z.object({
 type:z.enum(INCIDENT_TYPES), location_text:z.string().max(120).nullable(), minutes_ago:z.number().int().min(0).max(1440).nullable(), clock_time:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable(), severity:severitySchema, severity_reason:z.string().max(160), summary:z.string().max(200), recommended_action:z.string().max(200), claims:z.array(z.enum(CLAIM_KEYS)).max(8), confidence:confidenceSchema, flags:z.array(z.enum(FLAGS)).max(5),
});
export type LlmData = z.infer<typeof LlmExtraction>;
export const Extraction = z.object({ language:z.enum(LANGUAGES), type:z.enum(INCIDENT_TYPES), severity:severitySchema, severityReason:z.string().max(160), summary:z.string().max(200), recommendedAction:z.string().max(200), claims:z.array(z.enum(CLAIM_KEYS)), confidence:confidenceSchema, flags:z.array(z.enum(FLAGS)), locationText:z.string().max(120).nullable(), areaId:z.string().nullable(), lat:z.number().nullable(), lng:z.number().nullable(), occurredAt:z.number().int().nullable(), timeText:z.string().max(60).nullable(), engine:z.enum(ENGINES), model:z.string().nullable() });
export type ExtractionData = z.infer<typeof Extraction>;
export interface Form { location?: string; time?: string }
export type RejectionCode = 'too_short' | 'too_long' | 'accusation' | 'hate';
export type Analysis = { status:'rejected'; code:RejectionCode } | { status:'ok' | 'needs_info'; extraction:ExtractionData; missing:Missing[]; stored:string };
