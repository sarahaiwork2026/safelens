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
