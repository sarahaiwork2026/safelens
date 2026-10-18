export interface Env {
  ASSETS?:Fetcher;
  DB: D1Database;
  REPORT_LIMITER: RateLimit;
  API_LIMITER: RateLimit;
  ENVIRONMENT: string;
  EXTRACTOR_CHAIN: string;
  GROQ_MODEL: string;
  GEMINI_MODEL: string;
  LLM_DAILY_BUDGET: string;
  NOMINATIM_USER_AGENT?: string;
  GROQ_API_KEY?: string;
  GEMINI_API_KEY?: string;
  DRAFT_SECRET?: string;
  IP_HASH_SALT?: string;
  TURNSTILE_SECRET_KEY?: string;
}
