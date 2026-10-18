# Production verification

Checked on 19 October 2026 in Asia/Karachi.

Live URL: https://safelens.sarah-aiwork2026.workers.dev

- HTTP 200 for landing, incident dashboard, About and Map.
- Health confirms D1, Groq, rules fallback and production Turnstile.
- Browser Rules Test Lab: 25/25, all seven coverage checks.
- Real Karachi map tiles, glyphs and sprites returned HTTP 200 and rendered.
- Empty-map action works by keyboard in light/dark mode at 320 and 1440 pixels, without overflow or browser exceptions.
- Hosted base evaluation: type, severity, outcome, language and area all 25/25. Extra suite: 26/26. Groq handled 22 cases across all four languages; other eligible cases used rules fallback. The stricter pure-AI gate failed and is not claimed complete.
- Automated report submission could not finish Turnstile: this environment's managed proxy refused the challenge subdomain. Verification remains enabled for public browsers. No CAPTCHA bypass or production test secret was used.

Cloudflare build settings: root /; pnpm build; pnpm --filter web deploy. The deploy script installs a native Groq build secret as a runtime secret without logging or writing its value. Signing and Turnstile secrets are stored in Cloudflare. No paid service or plan upgrade was introduced.

See smoke-results.json, final-browser-check.json and ../eval-log.md for exact observations. Some aborted tile requests occur when the keyboard test leaves the map before loading finishes; the dedicated map check and screenshot show actual live rendering.
