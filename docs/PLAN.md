# SafeLens build plan

From an empty repository to a deployed, demo-ready product. Work through the phases in order. Each phase ends with a gate: every listed command passes and every exit check is true. Do not start the next phase with a failing gate.

The order follows the proposal's methodology (section 10): database design and AI extraction, report form and storage, related-report matching and threads, claim labels and contradiction detection, map and dashboard, responder view and polish, testing and documentation. Logic comes first and is proven by tests. Interface comes after.

| Phase | Builds | Proposal step |
|---|---|---|
| 0 | Repository, tooling, CI, data files in place | setup |
| 1 | `packages/core`: parsing, time, gazetteer, threading, claims. Fixture suite passes. | 1, 3, 4 |
| 2 | D1 schema, Worker API, security middleware, Test Lab endpoints | 1, 2 |
| 3 | Groq and Gemini extractors, merge, guards, budget, evaluation | 1 |
| 4 | Design tokens, fonts, components, app shell | 6 |
| 5 | Report page: input, preview, follow-up, structured result | 2 |
| 6 | Incidents dashboard, responder view, alerts | 5, 6 |
| 7 | Map | 5 |
| 8 | Test Lab page, landing, About | 7 |
| 9 | Hardening: e2e demo, accessibility, performance, security, README | 7 |
| 10 | Production deploy and demo rehearsal | 7 |

## Phase 0: Setup

Tasks
- [x] Initialise git, add `.gitignore` (node_modules, dist, `.wrangler`, `.dev.vars`, `playwright-report`, `.lighthouseci`).
- [x] pnpm workspace with `packages/core` and `apps/web`. Node 22 LTS or newer. Pin the pnpm version in `packageManager`.
- [x] TypeScript strict in every package (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`).
- [x] `apps/web` from the Cloudflare React template pattern: Vite + React + `@cloudflare/vite-plugin`, Worker entry `worker/index.ts`, `wrangler.jsonc` as in ARCHITECTURE.md section 21 (local D1 for now).
- [x] Install only the approved dependencies (AGENTS.md section 5), latest stable versions, exact versions in the lockfile.
- [x] ESLint (typescript-eslint strict, react-hooks, jsx-a11y), Prettier, and `scripts/check-copy-and-style.ts` that fails on: em dashes in `apps/web/src` and `docs`, `font-mono`/`monospace`, Tailwind default palette classes, `dangerouslySetInnerHTML`, `href="#"`, `console.log` in source, `TODO` or `FIXME`.
- [x] Move `docs/data/*.json` into `packages/core/data` and `packages/core/fixtures` (git mv, see docs/specs/TEST-DATA.md section 1).
- [ ] Root scripts from AGENTS.md section 8, even if some are stubs that exit 0 until their phase.
- [x] GitHub Actions `ci.yml`: install with frozen lockfile, typecheck, lint, check script, unit tests. (E2E, bundle and Lighthouse jobs are added in Phase 9.)
- [x] `apps/web/.dev.vars.example` with every secret name and empty values. `README.md` placeholder with the project name only.

Gate: `pnpm install --frozen-lockfile && pnpm typecheck && pnpm lint && pnpm test` pass on a clean clone. `pnpm dev` serves a blank page and `GET /api/health` returns JSON.

## Phase 1: Core domain (`packages/core`)

Port `docs/specs/rules-reference.mjs` into typed modules following docs/specs/EXTRACTION.md. Write tests with each module.

Tasks
- [x] `schema.ts`, `labels.ts`: enums, Zod schemas, UI labels for types, claims, severities, statuses.
- [x] `text.ts` (sanitize, match copy, term matching), `redact.ts`, `policy.ts` (too short, too long, accusation).
- [x] `language.ts`.
- [x] `lexicon.ts` (all term lists, copied exactly from EXTRACTION.md), `rules-parser.ts`, `severity.ts`.
- [x] `time.ts` with an injected `now`, form and text modes, Karachi offset by hand.
- [x] `gazetteer.ts` (alias index, lookup, masking, search for the combobox), `geo.ts` (haversine, nearest area, `circlePolygon`).
- [x] `missing.ts`, `merge.ts` (written now with the rules-only path, LLM path tested with stub data), `llm-schema.ts`, `prompt.ts` (system prompt and few-shot pairs as constants).
- [x] `threading.ts` (pure: given candidates and a report, returns the match decision, the incident patch and the events), `claims.ts` (`labelsFromCounts`, evidence summary).
- [x] `guidance.ts`, `contacts.ts` (typed access to `emergency-contacts.json`).
- [x] `pipeline.ts`: `previewReport` (browser) and `analyzeReport` (pure part of the server pipeline, with the LLM result passed in).
- [ ] `scripts/verify-gazetteer.ts`: one-off Nominatim check of `locked: false` areas (1 request per second, identifying User-Agent). Run once, fix coordinates by hand, commit.

Tests
- [x] `fixtures.test.ts`: the 25 base reports through the pure pipeline in memory, oldest first, asserting every field, every thread, every label and the totals exactly (docs/specs/TEST-DATA.md sections 2 to 5).
- [x] `extra.test.ts`: all extra cases (section 6).
- [x] Unit tests per module, including: every number in guidance and templates exists in the contacts JSON, the LLM JSON schema and the Zod schema accept the same valid sample, no lexicon term is duplicated across types, alias index is sorted longest first.

Gate: `pnpm --filter core test` passes with the rules engine. `node docs/specs/rules-reference.mjs packages/core/data packages/core/fixtures` still passes against the moved files. Then delete `docs/specs/rules-reference.mjs` and note it in the commit message.

## Phase 2: Database and API (`apps/web/worker`)

Tasks
- [x] `migrations/0001_init.sql` exactly as ARCHITECTURE.md section 10. `pnpm db:migrate` applies it locally.
- [x] `env.ts` typed bindings. `db/` repository functions with prepared statements only: find candidates, insert incident, update incident, insert report, insert events, list incidents, get detail, set status, counters, test runs.
- [x] Middleware in this order: request ID and logging, security headers, `Origin` check on mutating methods, content type check, body limit (16 KB), `API_LIMITER`, error mapper (`{ error: { code, message } }`, no stack traces).
- [x] Services: `draft-token.ts` (HMAC sign and verify with expiry), `turnstile.ts` (siteverify, skipped only when `ENVIRONMENT` is not production and no secret is set), `geocode.ts` (Nominatim with D1 cache and 1 request per second gate), `budget.ts` (daily counters), `ip-key.ts` (salted SHA-256).
- [x] Routes: `POST /api/reports` (both bodies, `REPORT_LIMITER`, duplicate suppression, one `db.batch` per stored report), `GET /api/incidents` (ETag, 304, counts, 24 hourly activity buckets), `GET /api/incidents/:ref`, `PATCH /api/incidents/:ref`, `GET /api/health`, the four test-run routes with per-run datasets and cleanup of runs older than one hour.
- [x] `ENVIRONMENT=production` refuses to accept reports without its required secrets.

Tests (`@cloudflare/vitest-pool-workers`, real local D1)
- [x] Submit, needs_info, follow-up with a valid draft, tampered draft (`invalid_draft`), expired draft, rejected accusation, too short, duplicate within 60 s.
- [x] The full 25-report run through the test-run endpoints matches the expected threads and totals.
- [x] Status change writes an event and returns 409 when unchanged. Resolved incident reopens on a new matching report.
- [x] Security: cross-origin POST rejected, wrong content type rejected, oversized body rejected, rate limit returns 429 with `Retry-After`, responses carry the security headers, no response body contains a stack trace.
- [x] ETag: second identical list request returns 304.

Gate: all Worker tests pass. `curl` against `pnpm dev` can submit T01 to T05 and see one escalated incident.

## Phase 3: AI extraction

Tasks
- [x] `extractors/openai-compatible.ts`: one function for both providers (base URL, key, model, strict flag), `AbortSignal.timeout(8000)`, 429 cooldown, response parsing, one repair retry.
- [x] `extractors/chain.ts`: reads `EXTRACTOR_CHAIN`, checks budget, tries providers in order, records `engine`, `model`, latency and fallback reason.
- [x] Wire the chain into `POST /api/reports` and Test Lab AI runs. Keep the static prompt prefix byte-identical across calls (cache hits).
- [x] Output guards and merge rules from EXTRACTION.md sections 9.6 and 9.7.
- [x] `scripts/eval-llm.ts`: runs the 25 base and the extra set through the chain against a local Worker, prints per-field scores, appends a dated entry to `docs/eval-log.md`. Pacing respects 30 requests per minute.
- [ ] Verify live with a real Groq key: strict `json_schema` works on the chosen model, `include_reasoning: false` accepted. If the Gemini OpenAI endpoint rejects `json_schema`, switch Gemini to `json_object`.

Tests
- [x] Unit tests with recorded provider responses (fixtures in `worker/test/fixtures/llm/`): valid output, invalid JSON then repaired, invalid twice then fallback, 429 then next provider, timeout, missing key, output guard replacements (Arabic summary, banned word, unknown phone number, URL).
- [x] Never call a real provider in CI.

Gate: unit tests pass. One recorded eval run meets docs/specs/TEST-DATA.md section 5 thresholds for the AI engine, logged in `docs/eval-log.md`. If it does not, try `llama-3.3-70b-versatile` and record both.

## Phase 4: Design system and app shell

Tasks
- [x] `tokens.css` and `base.css` from docs/DESIGN.md sections 3, 5, 9.5 and 11. Tailwind v4 `@theme inline` mapping. Fonts through Fontsource, Newsreader preloaded, fallback metrics adjusted.
- [x] `copy.ts` with the full copy deck (DESIGN.md section 12.2).
- [x] UI components: Button, Pill family, SegmentedControl, Field, Textarea, Combobox, Card, CreamPanel, FramedWindow, Dialog, Popover, Tooltip, Skeleton, EmptyState, StatTile, Select.
- [x] Severity components: SeverityPill, SeverityIcon, SeverityBeacon, SeverityToggle.
- [x] AppShell: TopBar, MobileTabBar, Footer (contacts from JSON), skip link, ErrorBoundary, NotFound, route-level lazy loading, View Transitions.
- [x] `lib/api.ts`, `lib/query.ts`, `lib/format.ts` (Karachi time and relative time with one shared 30 s ticker).

Tests
- [x] Component tests for SegmentedControl keyboard behaviour, SeverityPill text and icon per level, format functions across midnight in Karachi time.

Gate: every route renders inside the shell with real headings and working navigation, light and dark, at 320 px and 1440 px, with zero axe violations on the shell.

## Phase 5: Report page

Tasks
- [x] Description field with all input details from ARCHITECTURE.md section 6.1 (dir, lang, bidi, IME-safe debounced preview, counter, Ctrl or Cmd+Enter, example chips).
- [x] Where combobox over the gazetteer with Urdu names and free text. When field with chips and live parsed preview.
- [x] Understanding panel driven by `previewReport` from core.
- [x] Turnstile widget loaded only on this route (managed mode), token sent on first submit, reset on failure.
- [x] Submit state machine (idle, analyzing, ok, needs_info, rejected, error, offline), FollowUpCard with draft resubmit, StructuredResult with outcome banner, escalation path, confidence meters, engine badge, actions.
- [x] Own-submission alerts through the alert store (Phase 6 completes the dialog, use a toast until then).

Tests
- [x] Playwright: English, Urdu, Roman Urdu and Mixed inputs each produce a valid structured result (rules engine). Missing type, location and time each trigger the follow-up card with only those fields. Too short shows the inline error. Double submit is impossible while analyzing.

Gate: the four language tests and the follow-up tests pass. Urdu text is right to left in the field and in the result.

## Phase 6: Dashboard, responder view and alerts

Tasks
- [x] `/incidents`: title row with SeverityToggle (URL state) and status select, stat tiles, distribution bar, activity strip, IncidentRow table, loading, empty and error states.
- [x] `/incidents/:ref`: header with icon tile, pills, escalation path, status control (optimistic, rollback), View on map; Timeline; Reports with hidden-text handling and "Show original"; EvidencePanel with row-to-report highlighting; Details; mini-map placeholder (filled in Phase 7); Guidance; Emergency contacts with source; disclaimer.
- [x] Alerts: AlertHost (polling, baseline, diff, dedupe, hidden-tab queue), RedAlertDialog, custom sonner toasts, AlertCenter popover, beacon states, favicon and title signals, Web Audio cue with toggle, reduced motion handling.

Tests
- [x] Playwright: severity toggle filters the list and survives reload. Status change appears in the timeline. A red alert fires when a High incident is created from a second browser context, a yellow toast for Moderate, a green toast for Low, all three look different (screenshot assertions) and each contains "Unverified". With `reducedMotion: "reduce"` no element has a running animation.
- [x] Unit: alert diff logic (baseline, new, escalated, dedupe, coalescing, own submissions).

Gate: tests pass. The minimum demonstration steps 1 to 4 work by hand.

## Phase 7: Map

Tasks
- [ ] Lazy `MapCanvas` with MapLibre, OpenFreeMap Positron or Dark by color scheme, POI layers hidden, bounds and zoom limits, visible attribution.
- [ ] DOM markers with size by report count, pulse by severity, hover tooltip, keyboard focus, selection ring, `?selected=` URL state.
- [ ] Side panel, grouping radius halo, In view list (desktop) and bottom sheet (mobile), shared SeverityToggle.
- [ ] Mini-map on the responder view (non-interactive, loaded after main content).
- [ ] Failure fallback when WebGL or the style fails.

Tests
- [ ] Playwright: markers render for seeded incidents, the toggle hides and shows markers, clicking a marker opens the panel and "Open incident" navigates, the attribution text is visible. Assert on DOM markers, not canvas pixels.
- [ ] Bundle check: no `maplibre-gl` code in the initial chunks.

Gate: tests pass. Map loads in under 1.5 s on a warm cache on desktop.

## Phase 8: Test Lab, landing and About

Tasks
- [ ] `/test-lab`: engine toggle (AI enabled only if health says so), run, live progress, tiles, coverage checklist from real results, results and threads tables with expected vs actual, failure details, reset with confirm, AI pacing message on 429.
- [ ] `scripts/build-demo-snapshot.ts`: run fixture cluster C01 through the pure pipeline and write `features/landing/demo-incident.json`. A unit test fails if the committed snapshot is stale.
- [ ] `/` landing exactly as DESIGN.md section 8.2, rendering real components from the snapshot inside inert frames.
- [ ] `/about` with ethics, limitations, free services and contacts.

Tests
- [ ] Playwright: Test Lab rules run reaches 25 of 25 passed, all 7 coverage items checked, reset clears it. Landing has both CTAs going to real pages, no network request to `/api` on load, and no map code loaded.

Gate: tests pass. A first-time visitor can go from landing to a completed Test Lab run without reading any instructions.

## Phase 9: Hardening and documentation

Tasks
- [ ] `e2e/demo.spec.ts`: the minimum demonstration from docs/specs/TEST-DATA.md section 7, steps 1 to 7, against a fresh local database with `EXTRACTOR_CHAIN=rules`.
- [ ] `e2e/follow-up.spec.ts`: T18 with Saddar and T19 with Lyari get stored.
- [ ] Axe on every route, light and dark. Keyboard-only run through the demo.
- [ ] `scripts/check-bundle.ts` enforces the budget (ARCHITECTURE.md section 18). Lighthouse CI on `/`, `/report`, `/incidents` with mobile preset: performance 90+, accessibility 100, best practices 100, LCP under 2.0 s.
- [ ] Security pass: run the checklist in AGENTS.md section 7 and the threat table in ARCHITECTURE.md section 17. `pnpm audit --prod` clean or each finding explained in the README.
- [ ] No console errors or warnings on any route (Playwright listens and fails on them).
- [ ] README: what SafeLens is (two sentences), setup in under 10 steps, commands, free services used with links, environment variables, how to run the Test Lab, limitations, credits (OpenStreetMap, OpenFreeMap, Groq, Cloudflare).
- [ ] CI runs e2e, bundle check and Lighthouse on every pull request.

Gate: the full Definition of Done in AGENTS.md section 10 is true locally and in CI.

## Phase 10: Production and demo rehearsal

Steps for the human and the agent together (the agent prepares commands, the human owns accounts and secrets):
1. Create a free Cloudflare account (no card). `npx wrangler login`.
2. `npx wrangler d1 create safelens`, put the ID in `wrangler.jsonc`.
3. `pnpm db:migrate:remote`.
4. Create a Turnstile widget (managed mode) for the `*.workers.dev` hostname. Put the site key in the build environment as `VITE_TURNSTILE_SITE_KEY`.
5. Set secrets: `wrangler secret put GROQ_API_KEY`, `GEMINI_API_KEY` (optional), `DRAFT_SECRET`, `IP_HASH_SALT`, `TURNSTILE_SECRET_KEY`. Set `NOMINATIM_USER_AGENT` with the human's contact email.
6. `pnpm deploy`.
7. Smoke test on the live URL: `/api/health` shows `ok: true` and the Groq engine, submit one report in each language, open the map, run the Test Lab (Rules and AI), check response headers with `curl -I`, run Lighthouse against production.
8. Seed context incidents away from Clifton with `pnpm seed:demo --target <url>` (posts the fixture reports for Gulshan, North Nazimabad, Korangi, Orangi and Johar through the real API, paced under the rate limit), so the map is not empty and the Clifton demo still opens a fresh thread.
9. Rehearse docs/specs/TEST-DATA.md section 7 on a phone and a laptop. If the live dataset needs a reset before the presentation, the human runs `pnpm db:reset:remote` (destructive, asks for confirmation) and then step 8 again.
10. Re-check the emergency contacts against the source page and the free tier limits on the day before the demo.

Gate: the demo script runs on the production URL with a Groq key, and again with the key removed (rules fallback).
