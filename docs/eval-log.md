# AI evaluation log

## 2026-10-18 local and live checks

The local adapter, schema, repair, timeout, cooldown, budget and output guard tests pass. All 25 base fixtures and 26 extra fixtures pass with rules.

The supplied Groq key authenticated successfully. Direct adapter smoke calls through the environment HTTPS proxy with openai/gpt-oss-120b returned validated, merged extractions:

| Language | Type | Area | Severity | Engine |
| --- | --- | --- | --- | --- |
| English | fire | gulshan-e-iqbal | 3 | groq |
| Urdu | robbery | clifton | 3 | groq |
| Roman Urdu | suspicious | clifton | 1 | groq |

The fourth mixed-language request reached provider cooldown. These are smoke checks, not the 51-fixture evaluation or a threshold pass.

The full Worker evaluation was attempted but could not complete. Local workerd could not resolve api.groq.com under the managed network policy, triggering rules fallback. Running a second Worker against the same local D1 persistence directory also caused SQLITE_BUSY and stopped evaluation with HTTP 500. The second process was stopped. No complete AI score or production validation is claimed. Next run must use one Worker process with supported outbound connectivity, then run pnpm eval:llm and record all thresholds.

## 2026-10-18T23:19:18.877Z

Models: openai/gpt-oss-120b, rules

Base scores: {"type":25,"severity":25,"outcome":25,"language":25,"area":25,"provider":14}

Extra cases: 26/26; AI used for 8/24 non-rejected cases.

E01: pass; observed claims: motorbike, expected motorbike, multiple
E02: pass
E03: pass
E04: pass
E05: pass
E06: pass
E07: pass
E08: pass
E09: pass
E10: pass
E11: pass; observed claims: ongoing, expected
E12: pass
E13: pass
E14: pass
E15: pass
E16: pass
E17: pass
E18: pass
E19: pass
E19b: pass
E20: pass
E21: pass
E22: pass
E23: pass
E24: pass
E25: pass; observed severity: 1, expected 2; claims: no_injury, expected

Full thresholds: failed. Rules fallback does not count as a live AI evaluation.
