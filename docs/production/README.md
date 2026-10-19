# Production verification

Checked on 19 October 2026 in Asia/Karachi.

Live URL: https://safelens.sarah-aiwork2026.workers.dev

## Admin authentication and safety chat

Commit 2714e8e deployed through connected Cloudflare Builds. Live browser checks passed for admin login, dashboard authorization, secure cookies, logout revocation and preserved incident data. The official-reference form is available on the original real incident. No official source was fabricated for production. A live chat request returned HTTP 200, engine groq, English, Clifton and its matching database incident. The new routes are `/login` and `/chat`.

Local checks cover 81 unit/Worker tests, all four new browser flows, source attachment/removal, multilingual responses, quota fallback, map markers and mobile accessibility. Public entry-page Lighthouse scores are 100/100/100/99 for landing/report/login/chat, with 100 accessibility and best practices, and LCP below one second. Final browser review is recorded in auth-chat-check.json when complete.

## Theme and demo release

The connected GitHub build deployed commit 79df1bc on 19 October. Production D1 now contains five labeled demo incidents with eleven fixture reports, plus the original public incident, which was preserved. The examples cover Clifton, Lyari, North Nazimabad, Korangi and DHA, all four input languages and High, Moderate and Low severities. They remain unresolved and have real detail pages, timelines and selected map markers. The alert center includes active incidents on initial load.

Local validation: typecheck, lint, 74 unit/Worker tests and all 30 browser tests passed. The initial bundle is 130.1 KB JavaScript and 18.2 KB CSS gzip. Production browser checks verified the light default on a dark device, keyboard switching, saved preference, real light/dark map styles, all five detail-to-map links, original Urdu text expansion, and responsive layouts at 320, 390 and 1440 pixels. See demo-release-check.json and the demo screenshots.

## Earlier deployment checks

- HTTP 200 for landing, incident dashboard, About and Map.
- Health confirms D1, Groq, rules fallback and production Turnstile.
- Browser Rules Test Lab: 25/25, all seven coverage checks.
- Real Karachi map tiles, glyphs and sprites returned HTTP 200 and rendered.
- Empty-map action works by keyboard in light/dark mode at 320 and 1440 pixels, without overflow or browser exceptions.
- Hosted base evaluation: type, severity, outcome, language and area all 25/25. Extra suite: 26/26. Groq handled 22 cases across all four languages; other eligible cases used rules fallback. The stricter pure-AI gate failed and is not claimed complete.
- Automated report submission could not finish Turnstile: this environment's managed proxy refused the challenge subdomain. Verification remains enabled for public browsers. No CAPTCHA bypass or production test secret was used.

Cloudflare build settings: root /; pnpm build; pnpm --filter web deploy. The deploy script installs a native Groq build secret as a runtime secret without logging or writing its value. Signing and Turnstile secrets are stored in Cloudflare. No paid service or plan upgrade was introduced.

See smoke-results.json, final-browser-check.json and ../eval-log.md for exact observations. Some aborted tile requests occur when the keyboard test leaves the map before loading finishes; the dedicated map check and screenshot show actual live rendering.
