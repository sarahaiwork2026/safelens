# SafeLens implementation checkpoints

## Resume here

Read AGENTS.md, docs/PLAN.md and this file. Use the existing checkout. Do not create a worktree. Inspect git status before editing. Continue the first incomplete phase and rerun its gates. Never mark unrun checks complete.

## Current work

Phase 0 local gate passed. Next: port the reference parser into typed core modules and fixture tests.

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
