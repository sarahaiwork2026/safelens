import type {
  ExtractionData,
  IncidentType,
  Family,
  Severity,
  Status,
  Language,
  Missing,
} from './schema';
import type { EvidenceLabel } from './claims';
export interface IncidentSummary {
  simulated?: boolean;
  id: string;
  ref: number;
  code: string;
  type: Exclude<IncidentType, 'unclear'>;
  family: Family;
  severity: Severity;
  status: Status;
  areaId: string;
  areaName: string;
  lat: number;
  lng: number;
  summary: string;
  reportCount: number;
  languages: Language[];
  evidence: { supported: number; disputed: number; unconfirmed: number };
  firstSeen: number;
  lastSeen: number;
  escalatedAt: number | null;
  updatedAt: number;
}
export interface ReportView extends ExtractionData {
  id: string;
  text: string | null;
  createdAt: number;
}
export interface TimelineEvent {
  id: number;
  at: number;
  kind: 'opened' | 'report_added' | 'escalated' | 'status_changed' | 'reopened';
  severity: Severity;
  reportId: string | null;
  fromType: IncidentType | null;
  toType: IncidentType | null;
  fromSeverity: Severity | null;
  toSeverity: Severity | null;
  fromStatus: Status | null;
  toStatus: Status | null;
}
export interface IncidentDetail {
  sources?: OfficialSource[];
  incident: IncidentSummary;
  reports: ReportView[];
  timeline: TimelineEvent[];
  labels: EvidenceLabel[];
  guidance: string;
}
export interface OfficialSource {
  id: string;
  title: string;
  url: string;
  summary: string;
  publishedAt: number;
  reviewedAt: number;
}
export interface AdminSession {
  authenticated: boolean;
  email: string | null;
}
export interface ChatIncident {
  reportCount: number;
  verification: 'unverified';
  code: string;
  area: string;
  type: Exclude<IncidentType, 'unclear'>;
  severity: Severity;
  status: Status;
  simulated: boolean;
  updatedAt: number;
  lat: number;
  lng: number;
  evidence: IncidentSummary['evidence'];
  sources: OfficialSource[];
}
export interface ChatReply {
  answer: string;
  language: 'English' | 'Urdu' | 'Roman Urdu';
  advice: string[];
  incidents: ChatIncident[];
  areas: string[];
  retrievedAt: number;
  engine: 'groq' | 'rules';
  limited: boolean;
  routeApproximate: boolean;
  contacts: { name: string; number: string; source: string; checked: string }[];
}
export interface IncidentList {
  incidents: IncidentSummary[];
  counts: {
    active: number;
    high: number;
    moderate: number;
    low: number;
    reports24h: number;
  };
  activity: {
    hourStart: number;
    reports: number;
    maxSeverity: Severity | null;
  }[];
  serverTime: number;
}
export interface Escalation {
  fromType: IncidentType;
  toType: IncidentType;
  fromSeverity: Severity;
  toSeverity: Severity;
}
export interface ReportOk {
  status: 'ok';
  outcome: 'new' | 'added' | 'escalated';
  duplicate: boolean;
  report: ReportView;
  incident: IncidentSummary;
  escalation: Escalation | null;
}
export interface ReportNeedsInfo {
  status: 'needs_info';
  missing: Missing[];
  understood: ExtractionData;
  draft: string;
}
export type ReportResponse = ReportOk | ReportNeedsInfo;
export interface Health {
  ok: boolean;
  engines: { groq: boolean; gemini: boolean; rules: boolean };
  chain: string;
  turnstile: boolean;
  version: string;
}
export interface TestStepResult {
  reportId: string;
  outcome: 'new' | 'grouped' | 'escalated' | 'held';
  extraction: ExtractionData;
  missing: Missing[];
  incidentRef: number | null;
  pass: boolean;
  differences: string[];
}
export interface TestRunView {
  id: string;
  engine: 'rules' | 'ai';
  baseTime: number;
  results: TestStepResult[];
  threads: {
    cluster: string | null;
    detail: IncidentDetail;
    reportIds: string[];
    pass: boolean;
    differences: string[];
  }[];
  totals: {
    stored: number;
    held: number;
    threads: number;
    escalations: number;
  };
  coverage: { label: string; pass: boolean }[];
}
export interface TestRunCreated {
  runId: string;
  baseTime: number;
  order: string[];
}
export interface ExtraEvaluationStep {
  reportId: string;
  status: 'ok' | 'needs_info' | 'rejected';
  extraction: ExtractionData | null;
  code: string | null;
  missing: Missing[];
  pass: boolean;
  differences: string[];
  observations: string[];
}
export interface ExtraRunView {
  id: string;
  suite: 'extra';
  engine: 'rules' | 'ai';
  results: ExtraEvaluationStep[];
}
