# SafeLens implementation checkpoints

## Resume here

Read AGENTS.md, docs/PLAN.md and this file. Use the existing checkout. Do not create a worktree. Inspect git status before editing. Continue the first incomplete phase and rerun its gates. Never mark unrun checks complete.

## Current work

Phase 0 local gate passed. Phase 1 local fixture gate passed. Next: implement D1 persistence and secure API routes.

Validated: frozen-lockfile install, typecheck, lint, 1 fixture integrity test, 1 workerd health test, dev HTML response and /api/health. The command entries for later phases will gain implementations with their features.

Cloud-only shell setup: export XDG_DATA_HOME=/workspace/.cache/data XDG_CACHE_HOME=/workspace/.cache XDG_CONFIG_HOME=/workspace/.cache/config PNPM_HOME=/workspace/.cache/pnpm-home WRANGLER_SEND_METRICS=false before pnpm. Dev service started on 5173.

The approved Worker test pool is deprecated and its embedded workerd supports compatibility dates through 2026-08-22. Worker tests explicitly use that date; application configuration uses its creation date. No production test is claimed.

## Decisions

- Follow the TypeScript stack in AGENTS.md over the older Python stack in the proposal.
- Keep production deployment separate from local validation until the human supplies Cloudflare configuration and secrets securely.
- Pin a Vitest release supported by the Cloudflare worker pool.
- No Groq, Gemini or Cloudflare credential bindings were present at initial inspection. Rules mode requires no API key.

## External validation prerequisites

- A Groq key is needed for live AI scores. Never store the key in tracked files.
- An identifying Nominatim contact is needed before verifying unlocked gazetteer coordinates or enabling network geocoding.
- Production needs Cloudflare account, D1 ID, Turnstile widget/site key, signing secret, IP salt and Turnstile secret.

## Phase 1 validation

36 core tests passed: all 25 base reports with exact thread fields and labels, all 26 extra cases, and domain invariants. Typecheck and lint passed. The original reference also reported ALL PASS against the moved fixtures before removal. Removed docs/specs/rules-reference.mjs after the typed port passed. Unlocked coordinate verification remains unrun pending an identifying contact; local rules and fixture tests require no geocoding.

## Phase 2 validation

Local D1 migration applied. Twelve Workers integration tests pass against actual local D1, including all 25 fixture steps, exact threads and labels, isolated datasets, idempotency, signed and expired drafts, redaction, origin/body/rate guards, status history and reopen. Local HTTP submissions T01 to T05 joined INC-0001 with 5 reports and escalated from Low to High. Next: provider adapter and guarded fallback, then UI.

## Phase 3 local checkpoint

Provider adapter and guarded fallback implemented. 18 Worker tests and 36 core tests passed; typecheck and lint passed. AI tests cover schema validation, one repair, repeated invalid output, missing credentials, timeout, budget, denial merge, unsafe output and cooldown. No live AI scores are claimed. User explicitly chose local development first, so proceed with the UI while the external AI evaluation and unlocked gazetteer check remain deferred. eval-llm currently scores the 25 base cases only and documents the extra AI evaluation as outstanding.

Next: Phase 4 design tokens, accessible app shell and primitives, then report/dashboard/detail/map/Test Lab/landing.

## Phase 4 validation

App shell, tokens, fonts, copy deck and shared primitives implemented. Four Playwright shell checks passed over all five app routes at 320px and 1440px, light and dark, with reduced motion. Axe reported zero violations and no horizontal overflow. Three component/format tests passed, including severity icons, arrow-key selection and Karachi midnight formatting. The browser uses preinstalled /usr/bin/chromium; downloading a Playwright browser was denied by the environment domain policy and was unnecessary. Next: report intake UI and signed follow-ups.

## Phase 5 validation

Report UI wired to the real Worker: multilingual live preview, area combobox, time parsing, signed missing-field follow-up, structured results, engine/confidence/guidance and offline/error handling. Eight feature browser checks passed: four languages, Urdu RTL, exact missing location/time/type prompts, short-input validation and responsive screenshots at 390px and 1440px. Axe passed on structured results. Typecheck and lint passed. Screenshots reviewed against the supplied calm card, typography and spacing references. Next: incident dashboard, responder view and full alerts.

## Phase 6 validation

Dashboard, severity URL filters, activity and distribution, responder timeline, evidence/report highlighting, immutable source reports, status history, guidance/contacts and full in-app alerts implemented. Two browser checks passed for filters/status/axe and external Low, Moderate and High alerts; screenshots captured for each. Reduced motion had zero running animations. A separate browser flow passed for three languages joining one thread, escalation, high alert and responder evidence. Seven frontend tests passed, including dedupe, burst coalescing, hidden-tab queue and alert diffs. Typecheck and lint passed. Responder screenshots at 390px and 1440px reviewed.

Map network: tiles.openfreemap.org returned HTTP 403 from environment policy. Added that single required domain to the saved draft while preserving presets. Saving the draft did not apply network access; live tiles remain unverified until environment settings are saved. Next: Phase 7 MapLibre and offline fallback tests.

## Phase 7 local checkpoint

MapLibre 6 integration implemented with lazy module worker, light/dark styles, keyboard markers, URL selection, radius halo, viewport list, incident panel and deferred responder mini-map. Two browser tests passed for real map/marker/filter/selection/navigation behavior with a fixture style, plus a separate failed-style fallback. Typecheck, lint and production build passed. Bundle check excluded map code from initial chunks, with 141.6 KB initial JS gzip, 7.3 KB CSS gzip and 69.1 KB fonts before final landing work. Core is pure and now declares sideEffects:false so unused validation modules can be removed from browser entry chunks. Live tiles and the live warm-cache timing target remain unverified due the saved network requirement.

Next: Phase 8 Test Lab UI, generated landing snapshot, landing and About.

## Phase 8 validation

All app routes implemented. Landing displays real shared components from a generated C01 snapshot; a core test detects stale snapshots. Landing browser checks confirmed no API, map, Test Lab or report feature requests on load and valid CTAs. Responsive light/dark screenshots at 390px and 1440px passed axe and overflow checks. Test Lab browser run reached 25/25 report passes, 12 passing threads, 23 stored, 2 held, all seven real coverage checks, then reset cleared data. All 44 core/frontend tests and 18 Worker tests passed. Typecheck and lint passed.

Next: Phase 9 full production-preview demo, follow-ups, all-route accessibility/keyboard/console checks, performance, audit and README. Phase 10 deployment remains deferred under the user local-first choice.
