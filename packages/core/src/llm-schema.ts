export const LLM_JSON_SCHEMA = {
  "type": "object",
  "additionalProperties": false,
  "required": ["type", "location_text", "minutes_ago", "clock_time", "severity", "severity_reason", "summary", "recommended_action", "claims", "confidence", "flags"],
  "properties": {
    "type": { "type": "string", "enum": ["suspicious", "theft", "snatching", "robbery", "harassment", "assault", "firing", "kidnapping", "fire", "accident", "hazard", "unclear"] },
    "location_text": { "type": ["string", "null"] },
    "minutes_ago": { "type": ["integer", "null"] },
    "clock_time": { "type": ["string", "null"] },
    "severity": { "type": "integer", "enum": [1, 2, 3] },
    "severity_reason": { "type": "string" },
    "summary": { "type": "string" },
    "recommended_action": { "type": "string" },
    "claims": { "type": "array", "items": { "type": "string", "enum": ["weapon", "no_weapon", "injury", "no_injury", "ongoing", "resolved", "motorbike", "multiple"] } },
    "confidence": {
      "type": "object", "additionalProperties": false, "required": ["type", "location", "time"],
      "properties": { "type": { "type": "number" }, "location": { "type": "number" }, "time": { "type": "number" } }
    },
    "flags": { "type": "array", "items": { "type": "string", "enum": ["accusation", "identifying_details", "hate", "not_an_incident", "multiple_incidents"] } }
  }
} as const;
