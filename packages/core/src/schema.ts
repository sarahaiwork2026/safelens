import { z } from 'zod';
import { LANGUAGES,INCIDENT_TYPES,CLAIM_KEYS,FLAGS,ENGINES } from './constants';
import type { Missing } from './constants';
export * from './constants';
// Use Zod's supported interpreter under the strict Worker and browser CSP.
z.config({jitless:true});
export const severitySchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
]);
const confidenceSchema = z.object({
  type: z.number().min(0).max(1),
  location: z.number().min(0).max(1),
  time: z.number().min(0).max(1),
});
export const LlmExtraction = z.object({
  type: z.enum(INCIDENT_TYPES),
  location_text: z.string().max(120).nullable(),
  minutes_ago: z.number().int().min(0).max(1440).nullable(),
  clock_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .nullable(),
  severity: severitySchema,
  severity_reason: z.string().max(160),
  summary: z.string().max(200),
  recommended_action: z.string().max(200),
  claims: z.array(z.enum(CLAIM_KEYS)).max(8),
  confidence: confidenceSchema,
  flags: z.array(z.enum(FLAGS)).max(5),
});
export type LlmData = z.infer<typeof LlmExtraction>;
export const Extraction = z.object({
  language: z.enum(LANGUAGES),
  type: z.enum(INCIDENT_TYPES),
  severity: severitySchema,
  severityReason: z.string().max(160),
  summary: z.string().max(200),
  recommendedAction: z.string().max(200),
  claims: z.array(z.enum(CLAIM_KEYS)),
  confidence: confidenceSchema,
  flags: z.array(z.enum(FLAGS)),
  locationText: z.string().max(120).nullable(),
  areaId: z.string().nullable(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  occurredAt: z.number().int().nullable(),
  timeText: z.string().max(60).nullable(),
  engine: z.enum(ENGINES),
  model: z.string().nullable(),
});
export type ExtractionData = z.infer<typeof Extraction>;
export interface Form {
  location?: string;
  time?: string;
}
export type RejectionCode = 'too_short' | 'too_long' | 'accusation' | 'hate';
export type Analysis =
  | { status: 'rejected'; code: RejectionCode }
  | {
      status: 'ok' | 'needs_info';
      extraction: ExtractionData;
      missing: Missing[];
      stored: string;
    };
