# SafeLens architecture

## 0. What we are building

The proposal's expected outcome is a working end-to-end prototype:

```
Report -> AI -> Structured Incident -> Database -> Related Reports -> Escalation -> Map -> Responder View
```

Its main value is transparency: show what is reported, what is supported, what is disputed and what still needs verification. Every part of this document serves that chain. The demo is "working" when the minimum demonstration (docs/specs/TEST-DATA.md section 7) runs end to end in Playwright and in a browser against the deployed site, with no API key required (rules engine) and better wording when a free Groq key is present.

## 1. System overview

```
Browser (React SPA, same origin)
  |  report form, live language and time preview (packages/core runs in the browser)
  |  polls GET /api/incidents every 10 s while visible -> alert engine
  v
Cloudflare Worker (Hono)  /api/*                       static assets (Vite build) for everything else
  |-- security middleware: headers, origin check, body limit, rate limits, Turnstile on first submit
  |-- report pipeline (packages/core): sanitize -> reject -> redact -> language -> rules -> LLM -> merge -> location -> time -> missing
  |-- threading + escalation + claim counts (packages/core) -> one D1 batch
  |-- extractors: Groq (primary) -> Gemini (optional) -> rules (always available)
  |-- geocoder: local gazetteer first, Nominatim fallback (cached in D1, 1 req/s)
  v
Cloudflare D1 (SQLite): incidents, reports, timeline_events, geocode_cache, usage_counters, test_runs

Map tiles: browser -> tiles.openfreemap.org (vector, OpenStreetMap data), only on map views
```

One deployable: a single Worker serves the SPA through Workers Static Assets and the API under `/api/*`. Same origin means no CORS, simple CSP and no cookies.

`packages/core` is pure TypeScript with no DOM and no network. The browser, the Worker and Node tests all import it. The Worker only adds I/O around it.

## 2. Stack

| Layer | Choice | Why |
|---|---|---|
| Language | TypeScript (strict) everywhere | One language for browser, edge and tests. Shared Zod schemas end contract drift. |
| Frontend | Vite, React 19, React Router (data router, SPA mode) | Fast builds, route-level code splitting, tiny runtime. |
| Styling | Tailwind CSS v4 with CSS variables from `docs/DESIGN.md` | Tokens live in CSS, unused classes are purged. |
| UI primitives | Radix UI (Dialog, AlertDialog, Popover, Select, Tooltip, ToggleGroup, VisuallyHidden), `cmdk` for the area combobox, `lucide-react` icons, `class-variance-authority` + `clsx` | Accessible headless parts. Icons tree-shake. |
| Server state | TanStack Query | Polling, caching, loading and error states in one place. |
| Client state | Zustand (alert store only), URL search params for filters | About 1 KB. Filters stay shareable. |
| Toasts | `sonner` | Small, accessible, stacks well. |
| Red alerts | Custom `RedAlertDialog` on Radix AlertDialog | On-brand, focus-trapped, no extra library. Replaces SweetAlert2 from the old plan. |
| Map | `maplibre-gl` with OpenFreeMap vector styles (Positron light, Dark) | Crisp vector map that can be styled to the design tokens, free with no keys or limits, lazy loaded. |
| API | Cloudflare Workers + Hono + Zod | No cold starts, free tier, secrets stay server side. |
| Database | Cloudflare D1 (SQLite, as in the proposal) | Free, SQL migrations, batch transactions. |
| AI | Groq `openai/gpt-oss-120b` (primary), Gemini Flash-Lite (optional), rules parser (always) | Free tiers, strict JSON schema output, works with no key at all. |
| Geocoding | Local gazetteer, Nominatim fallback through the Worker | Instant for known areas, policy compliant. |
| Bot protection | Cloudflare Turnstile (free) on the first report submit | Stops scripted floods without a visible captcha for most users. |
| Fonts | Self-hosted with Fontsource: Newsreader (display serif, 400 only) and Inter Variable (UI). System fonts for Urdu. | Closest free match to incident.io's serif and sans pairing. No runtime font requests. |
| Tests | Vitest, `@cloudflare/vitest-pool-workers` (Worker + D1 in workerd), Playwright + `@axe-core/playwright`, Lighthouse CI | Unit, integration, e2e, accessibility, performance. |
| Tooling | pnpm workspaces, ESLint (typescript-eslint, react-hooks, jsx-a11y), Prettier, GitHub Actions | Standard, free. |
| Hosting | Cloudflare Workers (free plan) via Wrangler 4 and `@cloudflare/vite-plugin` | One deploy for SPA and API. Use Wrangler, not the `cf` CLI (open beta since 2026-09-28). |

How this maps to the proposal's stack (section 9):

| Proposal | Built with | Reason |
|---|---|---|
| Python | TypeScript | Shared types and logic between browser and server. |
| Streamlit | React + Vite | Streamlit cannot deliver the incident.io-level interface, custom alerts, motion or the performance budget. |
| Groq API | Groq API, plus optional Gemini and a rules fallback | As proposed, plus resilience when quota or network fails. |
| SQLite | Cloudflare D1 | It is SQLite, hosted free. |
| Folium + OpenStreetMap | MapLibre GL + OpenFreeMap (OpenStreetMap data) | Interactive vector map with custom markers. |
| geopy + Nominatim | Gazetteer + Nominatim via the Worker | Faster and within Nominatim's usage policy. |
| pandas | `packages/core` functions | No data science runtime needed. |
| python-dotenv | `.dev.vars` locally, Worker secrets in production | Same purpose. |
| Figma or Canva | `docs/DESIGN.md` + reference screenshots | Design lives in the repo. |

## 3. Free services and limits (checked 2026-10-18)

Re-check each before building and before a public demo. If any stops being free, stop and ask the human.

| Service | Free allowance relevant to us | How we stay inside it |
|---|---|---|
| Cloudflare Workers Free | 100,000 requests per day, 10 ms CPU per request, 50 subrequests per request, 128 MB memory | Polling uses ETag (304s are cheap), no heavy libraries in the Worker, Test Lab runs one report per request. |
| Cloudflare D1 Free | 10 databases, 500 MB per database, 50 queries per Worker invocation | Small rows, indexes on every hot query, batches. |
| Workers Static Assets | 20,000 files, 25 MiB per file | A few dozen files. |
| Workers Rate Limiting binding | Period 10 or 60 s, eventually consistent, per location | Used as a loose filter, with Turnstile and budgets behind it. |
| Groq Free (gpt-oss-120b) | 30 RPM, 1,000 RPD, 8,000 TPM, 200,000 TPD, per organization. Cached prompt tokens do not count toward limits | Daily budget counter (800), static prompt prefix for caching, rules fallback. |
| Google Gemini API free tier | Per project, changes often, see AI Studio | Optional secondary only. |
| Cloudflare Turnstile | Free | Managed widget, test keys in dev and CI. |
| OpenFreeMap | Free, no key, no request limits, commercial use allowed, attribution required | MapLibre shows attribution automatically, keep it visible. |
| Nominatim | Max 1 request per second, identifying User-Agent, cache results, no autocomplete, no bulk | Fallback only, cached in D1, global 1 req/s gate. |
| GitHub + Actions | Free for public repos, generous minutes for private | CI on push and pull request. |

## 4. Repository layout

```
safelens/
  AGENTS.md
  README.md                       # written in Phase 9
  package.json                    # pnpm workspace root, scripts in AGENTS.md section 8
  pnpm-workspace.yaml
  .github/workflows/ci.yml
  docs/
    ARCHITECTURE.md  DESIGN.md  PLAN.md
    specs/EXTRACTION.md  specs/TEST-DATA.md  specs/rules-reference.mjs
    design/reference/*.png
    eval-log.md                   # AI engine scores per model (created in Phase 3)
  packages/core/                  # pure TS, no DOM, no network
    src/
      schema.ts  labels.ts        # enums, Zod schemas, UI labels for types and claims
      text.ts  redact.ts  policy.ts language.ts
      rules-parser.ts  lexicon.ts severity.ts
      time.ts  gazetteer.ts  geo.ts            # geo: haversine, circle polygon
      llm-schema.ts  prompt.ts  merge.ts  missing.ts
      threading.ts  claims.ts  guidance.ts  contacts.ts
      pipeline.ts                 # pure orchestration used by Worker, tests and the landing snapshot
      api.ts                      # request and response types shared with the web app
      index.ts
    data/karachi-areas.json  data/emergency-contacts.json
    fixtures/test-reports.json  fixtures/test-reports-extra.json
    test/*.test.ts
  apps/web/                       # one deployable: SPA + Worker
    index.html  vite.config.ts  wrangler.jsonc  tailwind (in CSS)
    public/_headers  public/favicon.svg  public/favicon-alert.svg  public/robots.txt
    migrations/0001_init.sql
    src/                          # React app (structure in section 12)
    worker/
      index.ts                    # Hono app
      env.ts                      # typed bindings
      middleware/  routes/  extractors/  db/  services/
      test/*.test.ts              # vitest-pool-workers
    e2e/*.spec.ts                 # Playwright
    lighthouserc.json
  scripts/
    verify-gazetteer.ts  build-demo-snapshot.ts  check-bundle.ts  seed-demo.ts
```

## 5. Domain model

| Concept | Definition |
|---|---|
| Report | One citizen submission after extraction. Belongs to exactly one incident. Immutable once stored. |
| Incident (thread) | A group of related reports. Has a type, family, severity, status, area and a timeline. Shown as `INC-0012` (zero-padded `ref`). |
| Family and rank | property: suspicious 1, theft 2, snatching 2, robbery 3. violence: harassment 1, assault 2, firing 3, kidnapping 3. fire: fire 1. accident: accident 1. hazard: hazard 1. Only reports of the same family can join a thread. |
| Severity | 1 Low (green), 2 Moderate (yellow), 3 High (red). Thread severity is the maximum over its reports. |
| Status | `open`, `escalated` (set by the system), `monitoring`, `resolved` (set by responders, `open` too). |
| Active | Status is not `resolved` and `last_seen` is within 24 hours. The beacon, alerts and default lists use active incidents only. |
| Claim | One of 8 controlled keys extracted per report. Three opposing pairs: weapon/no_weapon, injury/no_injury, ongoing/resolved. |
| Evidence label | Per thread, from claim counts: Contradictory (both sides of a pair present), Supported (2 or more reports), Unconfirmed (1 report). |
| Dataset | `live` for real use. `test:<runId>` for each Test Lab run, isolated and auto-deleted after 1 hour. |

## 6. Report intake and multilingual input

### 6.1 The description field

- `<textarea dir="auto" lang={detected} autoComplete="off" autoCorrect="off" autoCapitalize="sentences" spellCheck={false}>` with CSS `unicode-bidi: plaintext` so each line takes its direction from its own first strong character. Mixed lines such as `Lyari میں firing ہو رہی ہے` render correctly. `autoCorrect="off"` stops iOS from "fixing" Roman Urdu. Spellcheck is off because it underlines every Roman Urdu word.
- Font: Inter for Latin with the Urdu system stack as fallback in the same `font-family`, so mixed text picks the right glyphs per character. Line height 1.7, raised to 2 when the detected language is Urdu or Mixed (Nastaliq needs room).
- Live preview: while the user types, debounce 250 ms (and skip while an IME composition is active, `event.nativeEvent.isComposing`), then run `previewReport(text, form)` from `packages/core` in the browser. It returns language, type, area and time from the rules engine. The "Understanding" panel shows these four with a check when found. This is real local parsing, not decoration, and it tells the user what is missing before they submit.
- Example chips: English, اردو, Roman Urdu, Mixed. Each fills the textarea with a fixture report so a first-time user sees the multilingual capability in one click.
- Counter appears after 800 code points, hard stop at 1000 (`[...text].length`, the same count the server uses).
- Submit with the button or Ctrl/Cmd+Enter. Enter inserts a newline.
- Validation messages are inline under the field and announced with `aria-live="polite"`.

### 6.2 The location field ("Where")

- Combobox (`cmdk` in a Radix Popover) over the local gazetteer: matches English names, aliases and Urdu names, accent and case insensitive. The gazetteer ships in the report route chunk (about 10 KB), so there is no network call.
- Free text is allowed ("Use what I typed"). The server resolves it (gazetteer, then Nominatim).
- If the description already names an area and this field is empty, the preview shows the detected area. The field stays optional.

### 6.3 The time field ("When")

- Free text with three chips: "Just now", "15 min ago", "1 hour ago". Accepts English, Roman Urdu and Urdu (`10 minutes ago`, `abhi`, `9:30 pm`, `raat 9 baje`, `۱۰ منٹ پہلے`).
- Under the field the parsed result is shown live ("Today, 9:30 pm"). Unreadable input shows "Couldn't read that time" before submit.

### 6.4 Submit flow

```
idle -> analyzing (button disabled + spinner, result skeleton appears)
     -> ok          : StructuredResult replaces the skeleton, alert fires by severity, focus moves to the result heading
     -> needs_info  : FollowUpCard asks only for the missing fields, shows kept fields as chips, resubmits with the draft token
     -> rejected    : inline message under the description (too short, too long, accusation)
     -> error       : inline error with "Try again", text kept
offline (navigator.onLine false): banner, submit disabled, text kept in memory
```

The first submit includes a Turnstile token. Follow-up resubmits use the signed draft token instead (it proves the first check passed).

## 7. Extraction

Full spec: `docs/specs/EXTRACTION.md`. Summary of the contract:

- Input: sanitized, redacted text plus optional form location and time.
- Output: one `Extraction` (language, type, severity, reason, summary, recommended action, claims, confidence, flags, location, time, engine, model) or `needs_info` with the missing list and a signed draft, or a rejection code.
- Engines: Groq first, Gemini second, rules always. The engine and model are stored with every report and shown in the UI.
- The server decides what is missing. The model never does.
- The report text is untrusted data. It is placed between delimiters, the model is told to ignore instructions in it, the output is schema-bound, and text fields pass output guards.

What the product extracts and where each field is shown:

| Field | Source | Shown in |
|---|---|---|
| Language | local detector | preview, structured result, report cards, Test Lab |
| Incident type | LLM or rules | everywhere (title is "{type} in {area}") |
| Location | form, text, LLM, geocoder | result, incident header, map |
| Time | form, text, LLM | result, timeline, report cards |
| Severity + reason | LLM or rules, with guard | pills, beacon, map markers, alerts |
| Summary | LLM or template | result, incident rows, map panel, alerts |
| Recommended action | LLM or template | result |
| Claims | LLM and rules merged | result chips, evidence panel |
| Confidence | LLM (rules: 1 for found, 0 for missing) | result confidence meter |
| Engine, model | pipeline | engine badge on result and report cards |

## 8. Threading and escalation (`packages/core/src/threading.ts`)

```ts
export const THREAD = { WINDOW_MIN: 180, RADIUS_KM: 1.5, AMBIGUITY: 0.1 } as const;
```

Match a new report to candidate incidents in the same dataset where:
1. family is the same,
2. haversine distance between the report's area centroid and the incident's area centroid is at most `RADIUS_KM`,
3. `occurredAt` lies within `[first_seen - WINDOW_MIN, last_seen + WINDOW_MIN]`,
4. status is anything (a resolved incident can be reopened).

Pick the candidate with the smallest time gap, then the smallest distance. If the two best candidates are within 10 percent of each other on both, and an LLM is available, ask once: "Do these two reports describe the same event? Answer yes or no." with both summaries; otherwise take the first.

On a match:
- add the report, update `last_seen`, `first_seen`, `report_count`, `claim_counts`, `updated_at`, and the incident summary (the summary of the highest severity report, latest on ties);
- if the incident was `resolved`: status becomes `open`, write a `reopened` event;
- if the report's type rank is higher than the incident's: the incident type becomes the report's type;
- if the report's severity is higher: the incident severity becomes the report's severity;
- if type or severity changed: status becomes `escalated`, `escalated_at = now`, write an `escalated` event with `from_type`, `from_severity`, `to_type`, `to_severity`;
- always write a `report_added` event.

No match: create an incident with the report's type and severity, status `open`, and an `opened` event.

Everything for one report (incident insert or update, report insert, timeline events) commits in one `db.batch([...])`. Use app-generated UUIDs for `incidents.id` and `reports.id` so the batch needs no read-back. The display number `ref` is assigned inside the insert: `(SELECT COALESCE(MAX(ref), 0) + 1 FROM incidents WHERE dataset = ?)`, guarded by `UNIQUE(dataset, ref)` with one retry on conflict.

Known limitation: two reports about the same new event arriving in the same instant can open two incidents. Acceptable for a prototype.

## 9. Claim evidence (`packages/core/src/claims.ts`)

- `claim_counts` on the incident row is a JSON object `{ claimKey: reportCount }`, updated on every report write.
- `labelsFromCounts(counts)`: for each opposing pair with both counts above zero, one Contradictory item with both counts. Every remaining claim: Supported if count is 2 or more, Unconfirmed if 1. Order: Contradictory, Supported, Unconfirmed, then by count.
- Detail view adds `reportIds` per claim side (computed from the reports at read time) so the UI can highlight which reports back each side.
- Evidence summary for the proposal's four questions: Reported (number of reports), Supported (count of Supported labels), Disputed (count of Contradictory labels), Needs verification (count of Unconfirmed labels).
- Words that never appear for claims: true, false, verified, proven, confirmed.

## 10. Data model (D1 migration `0001_init.sql`)

```sql
CREATE TABLE incidents (
  id TEXT PRIMARY KEY,                               -- uuid
  ref INTEGER NOT NULL,                              -- display number, INC-0012
  dataset TEXT NOT NULL DEFAULT 'live',              -- 'live' or 'test:<runId>'
  type TEXT NOT NULL,
  family TEXT NOT NULL CHECK (family IN ('property','violence','fire','accident','hazard')),
  severity INTEGER NOT NULL CHECK (severity BETWEEN 1 AND 3),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','escalated','monitoring','resolved')),
  area_id TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  summary TEXT NOT NULL,
  report_count INTEGER NOT NULL DEFAULT 0,
  claim_counts TEXT NOT NULL DEFAULT '{}',          -- JSON { claimKey: count }
  languages TEXT NOT NULL DEFAULT '[]',             -- JSON array of languages seen
  first_seen INTEGER NOT NULL,                       -- epoch ms, earliest occurred_at
  last_seen INTEGER NOT NULL,                        -- epoch ms, latest occurred_at
  escalated_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE (dataset, ref)
);
CREATE INDEX idx_incidents_match ON incidents (dataset, family, last_seen);
CREATE INDEX idx_incidents_list ON incidents (dataset, status, updated_at DESC);

CREATE TABLE reports (
  id TEXT PRIMARY KEY,                               -- uuid
  incident_id TEXT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  dataset TEXT NOT NULL,
  text TEXT NOT NULL,                                -- sanitized and redacted
  text_hidden INTEGER NOT NULL DEFAULT 0,            -- 1 when flagged identifying_details
  text_hash TEXT NOT NULL,                           -- sha-256 of the match copy, for duplicate suppression
  language TEXT NOT NULL CHECK (language IN ('English','Urdu','Roman Urdu','Mixed')),
  type TEXT NOT NULL,
  severity INTEGER NOT NULL CHECK (severity BETWEEN 1 AND 3),
  severity_reason TEXT NOT NULL,
  area_id TEXT NOT NULL,
  location_text TEXT,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  occurred_at INTEGER NOT NULL,
  time_text TEXT,
  summary TEXT NOT NULL,
  recommended_action TEXT NOT NULL,
  claims TEXT NOT NULL DEFAULT '[]',
  confidence TEXT NOT NULL,                          -- JSON { type, location, time }
  flags TEXT NOT NULL DEFAULT '[]',
  engine TEXT NOT NULL CHECK (engine IN ('groq','gemini','rules')),
  model TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_reports_incident ON reports (incident_id, occurred_at);
CREATE INDEX idx_reports_dedupe ON reports (dataset, text_hash, created_at);
CREATE INDEX idx_reports_recent ON reports (dataset, created_at);

CREATE TABLE timeline_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  incident_id TEXT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  at INTEGER NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('opened','report_added','escalated','status_changed','reopened')),
  severity INTEGER NOT NULL CHECK (severity BETWEEN 1 AND 3), -- incident severity after the event
  report_id TEXT REFERENCES reports(id) ON DELETE CASCADE,
  from_type TEXT, to_type TEXT,
  from_severity INTEGER, to_severity INTEGER,
  from_status TEXT, to_status TEXT
);
CREATE INDEX idx_timeline_incident ON timeline_events (incident_id, at, id);

CREATE TABLE geocode_cache (
  query TEXT PRIMARY KEY, lat REAL, lng REAL, label TEXT, created_at INTEGER NOT NULL  -- null lat = known miss
);

CREATE TABLE usage_counters (
  day TEXT NOT NULL,                                 -- 'YYYY-MM-DD' (UTC) or 'global'
  key TEXT NOT NULL,                                 -- 'llm:groq', 'llm:gemini', 'testrun:ai', 'nominatim:last'
  n INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, key)
);

CREATE TABLE test_runs (
  id TEXT PRIMARY KEY,
  engine TEXT NOT NULL CHECK (engine IN ('rules','ai')),
  base_time INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  results TEXT NOT NULL DEFAULT '{}'                 -- JSON { reportId: TestStepResult }
);
```

Rules: every query uses prepared statements with `.bind()`. No string-built SQL. Timeline text is never stored; the UI renders it from the structured columns, so stored data cannot inject markup or copy. Deleting an incident cascades to its reports and events (D1 enforces foreign keys).

## 11. API

All under `/api`, JSON only, same origin. Errors: `{ "error": { "code": string, "message": string } }` with a short human message. Request and response types live in `packages/core/src/api.ts`.

| Method and path | Purpose | Notes |
|---|---|---|
| `POST /api/reports` | Submit or complete a report | Body A `{ text, location?, time?, turnstileToken? }`. Body B `{ draft, answers: { type?, areaId?, time? } }`. Returns `ok`, `needs_info` or an error. |
| `GET /api/incidents?status=active\|resolved\|all` | List incidents (live only, max 200, newest update first) | Returns `{ incidents, counts, activity, serverTime }`. Strong `ETag`, answers `304` to `If-None-Match`. |
| `GET /api/incidents/:ref` | Incident detail | Incident, reports (text hidden when flagged), timeline, evidence labels with report IDs, guidance, contacts. |
| `PATCH /api/incidents/:ref` | Set status | Body `{ status: "open" \| "monitoring" \| "resolved" }`. Writes a `status_changed` event. `409` if unchanged. |
| `GET /api/health` | Liveness and configuration | `{ ok, engines: { groq, gemini, rules }, chain, turnstile, version }`. Never returns secrets. |
| `POST /api/test-runs` | Start a Test Lab run | Body `{ engine: "rules" \| "ai" }`. Deletes runs older than 1 hour. Returns `{ runId, baseTime, order }` (report IDs oldest first). |
| `POST /api/test-runs/:id/steps` | Process one fixture report | Body `{ reportId }`. Idempotent: a repeated step returns the stored result. |
| `GET /api/test-runs/:id` | Run results | Per-report results, actual threads with labels, totals, coverage checklist. |
| `DELETE /api/test-runs/:id` | Reset test data | Deletes the run's incidents (cascade) and the run row. |

Response shapes (abbreviated):

```ts
type ReportOk = { status: "ok"; outcome: "new" | "added" | "escalated"; duplicate: boolean;
  report: ReportView; incident: IncidentSummary;
  escalation: { fromType: IncidentType; fromSeverity: Severity; toType: IncidentType; toSeverity: Severity } | null };
type ReportNeedsInfo = { status: "needs_info"; missing: Missing[]; timeReason?: "too_old" | "unreadable";
  understood: Partial<ReportView>; draft: string };
type IncidentSummary = { ref: number; code: string; type: IncidentType; family: Family; severity: Severity; status: Status;
  areaId: string; areaName: string; lat: number; lng: number; summary: string; reportCount: number;
  languages: Language[]; evidence: { supported: number; disputed: number; unconfirmed: number };
  firstSeen: number; lastSeen: number; escalatedAt: number | null; updatedAt: number };
type IncidentList = { incidents: IncidentSummary[];
  counts: { active: number; high: number; moderate: number; low: number; reports24h: number };
  activity: { hourStart: number; reports: number; maxSeverity: Severity | null }[];   // 24 items, oldest first
  serverTime: number };
```

Status codes: `200`, `204`, `304`, `400 invalid_input`, `403 forbidden_origin | captcha_failed`, `404 not_found`, `409 unchanged`, `413 too_large`, `415 unsupported_type`, `422 too_short | too_long | accusation | hate | invalid_draft | invalid_answer`, `429 rate_limited` (with `Retry-After`), `500 internal`, `503 unavailable`.

## 12. Front end

Routes (each lazy loaded except the shell):

| Path | Page | Data |
|---|---|---|
| `/` | Landing | static `demo-incident.json` (no API call) |
| `/report` | Report | `POST /api/reports`, gazetteer from core |
| `/incidents` | Incidents dashboard | `GET /api/incidents` |
| `/incidents/:ref` | Responder view | `GET /api/incidents/:ref`, `PATCH` |
| `/map` | Map | `GET /api/incidents` (shared cache), MapLibre lazy |
| `/test-lab` | Test Lab | test-run endpoints |
| `/about` | Ethics, limitations, services | static |
| `*` | Not found | static |

Source layout in `apps/web/src`:
```
main.tsx  router.tsx
styles/tokens.css  styles/base.css
app/AppShell.tsx  TopBar.tsx  MobileTabBar.tsx  Footer.tsx  ErrorBoundary.tsx  NotFound.tsx
lib/api.ts  query.ts  format.ts (relative time, Karachi time)  sound.ts  favicon.ts  motion.ts
stores/alerts.ts
components/ui/        Button Pill SegmentedControl Field Textarea Combobox Card Dialog Popover Tooltip Skeleton EmptyState Stat
components/severity/  SeverityPill SeverityIcon SeverityBeacon SeverityToggle
components/incident/  IncidentRow IncidentHeader EscalationPath Timeline EvidencePanel ClaimRow ReportCard Guidance Contacts StatusControl
components/alerts/    AlertHost RedAlertDialog AlertCenter
features/landing/ report/ incidents/ incident/ map/ test-lab/ about/
```

Rules:
- One `api.ts` wrapper: JSON in and out, typed with `packages/core` types, throws a typed `ApiError` with the server code. No other `fetch` calls in components.
- One TanStack Query client. The active incident list query (`["incidents", "active"]`) is mounted once by `AlertHost` with `refetchInterval: 10_000` and `refetchIntervalInBackground: false`. The beacon, dashboard and map read the same cache.
- Severity filter lives in the URL: `?level=high|moderate|low` (absent means all). The same `SeverityToggle` drives the dashboard list and the map.
- Status change uses an optimistic update with rollback and an error toast on failure.
- Route transitions use the View Transitions API through React Router's `viewTransition` where supported, 150 ms, disabled under reduced motion.
- Every page has loading (skeleton shaped like the final layout), empty (with a next action) and error (with retry) states.

## 13. Alerts engine (`components/alerts/AlertHost.tsx`, `stores/alerts.ts`)

Alerts are basic in-app system alerts, as the proposal says. No push notifications, no emails, no service worker.

Inputs:
1. The reporter's own submission (from the `POST /api/reports` response).
2. Changes seen by polling the active list every 10 s while the tab is visible.

Algorithm:
```
first snapshot after page load: store a baseline {ref -> severity}, fire nothing
each later snapshot:
  new incident not created by this tab                      -> candidate "new" at its severity
  known incident whose severity rose                         -> candidate "escalated" at the new severity
dedupe: key = `${ref}:${severity}`, remembered in localStorage for 24 h (wrapped in try/catch)
tab hidden: hold candidates; on return show one summary toast "N updates while you were away"
deliver:
  severity 3: RedAlertDialog, one at a time; extra high alerts collapse into "+N more high severity" inside the open dialog
  severity 2 or 1: sonner toast; if more than 2 arrive in one snapshot, one combined toast "N new incidents"
  sound (off by default, toggle in AlertCenter and in the dialog): one short two-tone Web Audio cue for severity 3 only, never on page load
  unseen high alert: favicon switches to favicon-alert.svg and the title gets "(1) " until the dialog is dismissed or the tab is focused
own submission: deliver immediately by outcome and severity, add the ref to the tab's own set so polling does not alert twice
never alert for: test datasets, resolved incidents, incidents not active
```

Every alert says the information is unverified. Exact copy and visuals are in `docs/DESIGN.md` section 9.

## 14. Map (`features/map`)

- `maplibre-gl` is imported only inside the map route and the incident mini-map, through `React.lazy`. The web worker is set with `setWorkerUrl` using Vite's `?worker&url` import.
- Style: `https://tiles.openfreemap.org/styles/positron` in light mode, `https://tiles.openfreemap.org/styles/dark` in dark mode. After the style loads, hide POI and transit symbol layers to keep the map quiet.
- View: center `[67.06, 24.88]`, zoom 10.6, `minZoom` 9.5, `maxZoom` 16, `maxBounds [[66.6, 24.65], [67.6, 25.25]]`. Attribution control not compact, always visible.
- Markers: one DOM marker per incident (`maplibregl.Marker({ element })`), a `<button>` with an `aria-label` such as "High severity robbery in Clifton, 5 reports". Diff by `ref` on each data update: add, update classes, remove. No clustering.
- Micro-interactions: hover or focus shows a tooltip card (type, area, reports, last update). Click selects: marker gets a ring, the map eases to it (jump under reduced motion), the side panel slides in, and a 1.5 km radius halo (GeoJSON polygon from `geo.circlePolygon`, fill at 8 percent opacity plus a dashed line) shows the grouping radius. Severity toggle fades non-matching markers out over 150 ms then removes them. Selection lives in the URL (`?selected=12`) so it survives reloads and back.
- Left list panel ("In view", desktop only) lists incidents sorted by severity then recency. Hover highlights the marker, click selects it. On mobile the list becomes a bottom sheet.
- Failure: if WebGL is unavailable or the style fails to load within 8 s, show "The map could not load" with a button to the incident list.

## 15. Visualizations

All hand-built with CSS and a little inline SVG for icons only. No chart library.

| Visual | Where | Built from |
|---|---|---|
| Severity pill (icon + word + tint) | everywhere | severity |
| Header beacon (dot + label, pulse by level) | top bar | highest active severity |
| Stat strip (Active, High, Moderate, Low) with a one-line severity distribution bar | Incidents | `counts` |
| 24-hour activity strip: 24 thin bars, height by report count, color by max severity, empty hours as hairlines | Incidents | `activity` |
| Escalation path: `Suspicious activity · Low` to `Robbery · High` | incident header, result, alert | escalation event |
| Vertical timeline with severity-colored nodes, escalation rows emphasized | Responder view, landing | timeline events |
| Evidence panel: label pill, claim name, one dot per backing report; Contradictory shows both sides split by "vs" | Responder view, landing | labels with counts |
| Evidence summary: Reports, Supported, Disputed, Needs verification | Responder view | evidence |
| Confidence meter (three short segments) for type, location, time | Structured result | confidence |
| Map markers with pulse + grouping radius halo | Map, mini-map | incidents |
| Test Lab progress bar, coverage checklist, pass and fail pills | Test Lab | run results |

## 16. Test Lab

- `POST /api/test-runs` creates `dataset = 'test:<runId>'` with a fixed `baseTime`. The browser then calls `POST /steps` for each report in order. Each step is one short Worker request (inside the 10 ms CPU limit) and the table fills in live.
- Engine toggle: Rules (default, deterministic, exact assertions) or AI (enabled only when `/api/health` reports an LLM, capped at 20 AI runs per day, paced: on `429` the UI shows "Waiting for the free tier limit, 12 s" and continues).
- The results view compares expected and actual per report and per thread, computes the coverage checklist from actual results, and shows totals. Reset deletes the run.
- Concurrent visitors never interfere because every run has its own dataset.
- The same fixture JSON drives core unit tests, Worker integration tests and the Test Lab, so there is one definition of "correct".

## 17. Security layer

| Threat | Controls |
|---|---|
| Bot floods and spam | Turnstile on first submit (test keys in dev and CI), `REPORT_LIMITER` 10 per minute and `API_LIMITER` 120 per minute keyed by a salted SHA-256 of the client IP (raw IP never stored or logged), 16 KB body limit, duplicate suppression (same text hash within 60 s returns the existing result). |
| AI quota exhaustion | Daily per-provider budget in D1, cooldown on `429`, AI Test Lab cap, rules fallback keeps the product working. |
| Prompt injection | Delimited data, explicit instruction to ignore embedded instructions, strict JSON schema with enums, Zod validation, output guards (EXTRACTION.md 9.7), server-side missing-field decision. |
| XSS | React text rendering only, no `dangerouslySetInnerHTML`, no HTML from the LLM, strict CSP. |
| CSRF | No cookies, same-origin API, `Origin` must equal the request origin on POST, PATCH and DELETE, `Content-Type: application/json` required (`415` otherwise). |
| Tampering with follow-up data | HMAC-SHA256 signed draft token with 15 minute expiry. The client never sends extraction fields directly. |
| Personal data | Phone and CNIC redaction before LLM and storage, `identifying_details` hides raw text in public views, no accounts, no cookies, no IPs, logs carry no report text. |
| Accusations and hate | Accusation lexicon and LLM flags reject the report before storage. Summaries never name people. |
| Bidi spoofing | Bidi control characters stripped in sanitize. |
| SQL injection | Prepared statements with `.bind()` only. |
| Secrets | Worker secrets in production, `.dev.vars` git-ignored, never a `VITE_` secret, `.dev.vars.example` committed with empty values. |
| Supply chain | pnpm lockfile committed, `pnpm audit --prod` in CI, only the approved dependencies (AGENTS.md section 5), pnpm's default block on install scripts kept. |
| Open status controls | No accounts by design (out of scope). Status changes are rate limited, origin checked and recorded in the timeline. |
| Error leakage | Generic messages, no stack traces, unknown errors become `500 internal`. |
| Third-party terms | Nominatim policy (1 req/s, User-Agent, cache, no autocomplete), OpenFreeMap and OpenStreetMap attribution visible. |
| CPU exhaustion | Lexicon matching uses `includes`, not backtracking regex. Input capped at 1000 code points. |

Response headers (Worker middleware for `/api/*`, `public/_headers` for static assets):

```
Content-Security-Policy: default-src 'self'; script-src 'self' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' https://tiles.openfreemap.org; worker-src 'self' blob:; frame-src https://challenges.cloudflare.com; frame-ancestors 'none'; base-uri 'none'; form-action 'self'; object-src 'none'
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
Cross-Origin-Opener-Policy: same-origin
Strict-Transport-Security: max-age=31536000; includeSubDomains
```
`style-src 'unsafe-inline'` is needed because MapLibre, Radix and sonner set inline styles. Scripts stay strict. API responses also send `Cache-Control: no-store` except `GET /api/incidents`, which uses `no-cache` with its ETag.

## 18. Performance

Budget (enforced in CI by `scripts/check-bundle.ts` and Lighthouse CI):

| Metric | Target |
|---|---|
| LCP, mobile, simulated Fast 4G | under 2.0 s on `/`, `/report`, `/incidents` |
| Initial JS (shell + landing route) | under 150 KB gzip |
| Initial CSS | under 30 KB gzip |
| Fonts | Newsreader 400 Latin subset and Inter Variable Latin subset, woff2, total under 90 KB, display font preloaded |
| Map chunk | only on `/map` and after the responder view's main content renders |
| Lighthouse mobile | Performance 90+, Accessibility 100, Best Practices 100 |
| API p95 GET | under 200 ms |
| Report analysis | skeleton within 100 ms, Groq typically 1 to 3 s, hard cap 12 s then rules |
| Worker CPU | under 10 ms per request (free plan) |

Techniques: route-level `React.lazy`, the landing page imports nothing from the map, Test Lab or report features, hashed assets cached for a year, HTML not cached, `ETag` polling, `preload` for the display font, `font-display: swap`, system font fallbacks with matched metrics (`size-adjust`) to avoid layout shift, SVG icons only, no images on the landing page except the product rendered as real components.

## 19. Failure behaviour

| Failure | Behaviour |
|---|---|
| No API key or provider down | Rules engine. Engine badge reads "Local rules". |
| Provider rate limited | Next provider, then rules. |
| Invalid JSON from model | One repair retry, then next provider. |
| Daily AI budget spent | Rules until midnight UTC. |
| Geocoder unavailable or rate gate closed | Ask the user to pick an area. |
| D1 write error | Nothing partial is stored (batch). User sees "Couldn't save the report. Try again." with the text kept. |
| Turnstile fails | `403 captcha_failed`, widget resets, user can retry. |
| Browser offline | Banner, submit disabled, draft kept in memory. Polling pauses. |
| Map tiles or WebGL fail | Fallback card with a link to the incident list. |
| Draft expired | Restart the submission with the same text, one click. |

## 20. Limitations (product requirements)

The proposal's limitations are shown on the landing page and the About page, and each one shapes behaviour:

| Limitation | Where it shows | What the product does about it |
|---|---|---|
| The prototype uses simulated data. | Landing, About, Test Lab | Test Lab and demo data are clearly separate from live reports. |
| AI may misunderstand incomplete, unclear or heavily mixed-language reports. | About, result card | Engine badge, confidence meter, follow-up card, local language detection, rules cross-check. |
| Location accuracy depends on what users provide. | About, result card | Gazetteer, typed text shown next to the resolved area, follow-up asks for the area. |
| Analysis depends on internet and API availability. | About, engine badge | Rules fallback, offline banner. |
| Alerts are basic system alerts, not full emergency notifications. | About, alert copy | In-app alerts only, always marked unverified. |
| The prototype is for academic demonstration and is not a replacement for official emergency services. | Footer on every page, landing, About | Verified emergency contacts on every incident and in the footer. No dispatch button. |

## 21. Configuration

`apps/web/wrangler.jsonc`:
```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "safelens",
  "main": "./worker/index.ts",
  "compatibility_date": "<the date the project is created>",
  "assets": { "not_found_handling": "single-page-application", "run_worker_first": ["/api/*"] },
  "d1_databases": [
    { "binding": "DB", "database_name": "safelens", "database_id": "<from wrangler d1 create safelens>", "migrations_dir": "migrations" }
  ],
  "ratelimits": [
    { "name": "REPORT_LIMITER", "namespace_id": "1001", "simple": { "limit": 10, "period": 60 } },
    { "name": "API_LIMITER", "namespace_id": "1002", "simple": { "limit": 120, "period": 60 } }
  ],
  "vars": {
    "ENVIRONMENT": "production",
    "EXTRACTOR_CHAIN": "groq,gemini,rules",
    "GROQ_MODEL": "openai/gpt-oss-120b",
    "GEMINI_MODEL": "gemini-3.5-flash-lite",
    "LLM_DAILY_BUDGET": "800",
    "NOMINATIM_USER_AGENT": "SafeLens/1.0 (academic prototype; contact: <email from the human>)"
  },
  "observability": { "enabled": true },
  "upload_source_maps": true
}
```

Secrets (`wrangler secret put`, and `apps/web/.dev.vars` locally): `GROQ_API_KEY`, `GEMINI_API_KEY` (optional), `DRAFT_SECRET` (32+ random bytes), `IP_HASH_SALT` (32+ random bytes), `TURNSTILE_SECRET_KEY`.

Public build variable: `VITE_TURNSTILE_SITE_KEY`. Dev and CI use Cloudflare's test keys: site key `1x00000000000000000000AA`, secret `1x0000000000000000000000000000000AA` (always pass).

`ENVIRONMENT=production` requires `DRAFT_SECRET`, `IP_HASH_SALT` and `TURNSTILE_SECRET_KEY`. If one is missing, `/api/health` reports `ok: false` and report submission returns `503`.

E2E and CI set `EXTRACTOR_CHAIN=rules` so tests never call an LLM.

## 22. Observability

- Workers Logs (free) with one structured JSON line per request: request ID, route, status, duration, engine, model, LLM latency, fallback reason. Never report text, never IP.
- `/api/health` for uptime checks.
- `docs/eval-log.md` records AI engine scores against the fixtures whenever the model or prompt changes.
