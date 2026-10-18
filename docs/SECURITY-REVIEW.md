# Security review

## Controls implemented

- Production refuses report intake without signing, salt and Turnstile secrets. Secret values never enter health output or client bundles.
- First submissions verify Turnstile when configured; signed follow-ups verify HMAC and expiry instead.
- Origin and JSON checks precede streaming body size enforcement and API/report rate limits. IPs are salted and hashed for rate keys, never stored or logged.
- D1 queries use bound parameters. Each stored report, thread update and event batch is atomic.
- Phone/CNIC redaction applies to text and form fields before providers and storage; bidi controls are stripped. Identifying-detail flags hide original text in public responses.
- Model output is schema validated, repaired at most once, guarded, and rendered as text. Negative rules claims override positive model claims.
- Accusation lexicon and model accusation/hate flags reject before storage.
- Daily budgets count repair calls, cooldowns limit retry traffic and provider failures fall back to rules.
- CSP, MIME protection, frame restrictions, referrer policy, permissions policy and HSTS cover API and static responses.
- Test datasets are isolated; status controls follow the intentionally public prototype model with rate limits and a timeline.
- Dependency lifecycle scripts remain denied by default; known binary-package scripts are explicitly denied. Locked optional platform artifacts provide the tested executables.

## Evidence and limits

The production dependency audit reported zero vulnerabilities. Integration tests cover origin, JSON, body size, rate limits, missing production configuration, signed/tampered/expired drafts, redaction, immutable reports, duplicate suppression and atomic incident/history behavior.

Production account configuration, a real Turnstile widget, live provider behavior, external service permissions and contact rechecks are not validated by local tests. Do not publish a public demonstration until the production phase checks in PLAN.md are complete. The local D1 ID and test Turnstile key are rejected by the deployment precheck.

An intentionally accepted prototype limitation is that simultaneous first reports can create separate incident threads. Public status edits are also intentional scope; there are no accounts or role controls.

Build-time HTML uses React's server renderer and rejects inline scripts. Dynamic report data is fetched after hydration and never written into generated static pages. Zod uses its supported jitless mode so strict CSP does not trigger an eval probe.
