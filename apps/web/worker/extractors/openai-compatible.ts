import { LlmExtraction } from 'core';
import type { LlmData, Form } from 'core';
import { SYSTEM_PROMPT, FEW_SHOT_PAIRS } from 'core/prompt';
import { LLM_JSON_SCHEMA } from 'core/llm-schema';
export interface ProviderOptions {
  engine: 'groq' | 'gemini';
  model: string;
  key: string;
  reserve: () => Promise<boolean>;
  signal: AbortSignal;
  fetcher?: typeof fetch;
}
export type ProviderResult =
  | { ok: true; data: LlmData }
  | {
      ok: false;
      reason: 'cooldown' | 'budget' | 'timeout' | 'unavailable' | 'invalid';
    };
const cooldown = new Map<string, number>();
export async function extractProvider(
  options: ProviderOptions,
  text: string,
  form: Form,
  now: number,
): Promise<ProviderResult> {
  const { engine, model, key, reserve } = options,
    fetcher = options.fetcher ?? fetch;
  if ((cooldown.get(engine) ?? 0) > Date.now())
    return { ok: false, reason: 'cooldown' };
  const shifted = new Date(now + 5 * 3600000)
    .toISOString()
    .replace('Z', '+05:00');
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...FEW_SHOT_PAIRS,
    {
      role: 'user',
      content: `Time now in Asia/Karachi: ${shifted}\nForm location: ${form.location || '(empty)'}\nForm time: ${form.time || '(empty)'}\n<<<\n${text}\n>>>`,
    },
  ];
  let strict = engine === 'groq' ? model.startsWith('openai/gpt-oss') : true;
  const url =
    engine === 'groq'
      ? 'https://api.groq.com/openai/v1/chat/completions'
      : 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
  for (let attempt = 0; attempt < 2; attempt++) {
    if (!(await reserve())) return { ok: false, reason: 'budget' };
    try {
      const response = await fetcher(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.any([options.signal, AbortSignal.timeout(8000)]),
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.1,
          max_completion_tokens: 700,
          response_format: strict
            ? {
                type: 'json_schema',
                json_schema: {
                  name: 'incident_extraction',
                  strict: true,
                  schema: LLM_JSON_SCHEMA,
                },
              }
            : { type: 'json_object' },
          ...(engine === 'groq' && model.startsWith('openai/gpt-oss')
            ? { reasoning_effort: 'low', include_reasoning: false }
            : {}),
        }),
      });
      if (response.status === 429) {
        const seconds = Math.max(
          1,
          Number(response.headers.get('Retry-After')) || 60,
        );
        cooldown.set(engine, Date.now() + seconds * 1000);
        return { ok: false, reason: 'cooldown' };
      }
      if (response.status === 400 && engine === 'gemini' && strict) {
        strict = false;
        continue;
      }
      if (!response.ok) return { ok: false, reason: 'unavailable' };
      const payload: unknown = await response.json();
      let content = '';
      if (
        payload &&
        typeof payload === 'object' &&
        'choices' in payload &&
        Array.isArray(payload.choices)
      ) {
        const choice: unknown = payload.choices[0];
        if (
          choice &&
          typeof choice === 'object' &&
          'message' in choice &&
          choice.message &&
          typeof choice.message === 'object' &&
          'content' in choice.message &&
          typeof choice.message.content === 'string'
        )
          content = choice.message.content;
      }
      let data: unknown;
      try {
        data = JSON.parse(content);
      } catch {
        data = null;
      }
      const parsed = LlmExtraction.safeParse(data);
      if (parsed.success) return { ok: true, data: parsed.data };
      messages.push(
        { role: 'assistant', content: content.slice(0, 5000) },
        {
          role: 'user',
          content: `Your JSON failed validation: ${parsed.error.message.slice(0, 300)}. Return corrected JSON only.`,
        },
      );
    } catch (error) {
      if (
        error instanceof Error &&
        (error.name === 'AbortError' || error.name === 'TimeoutError')
      )
        return { ok: false, reason: 'timeout' };
      return { ok: false, reason: 'unavailable' };
    }
  }
  return { ok: false, reason: 'invalid' };
}
