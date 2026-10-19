import type {
  Health,
  IncidentList,
  IncidentDetail,
  ReportResponse,
  TestRunCreated,
  TestRunView,
  TestStepResult,
  AdminSession,
  ChatReply,
  OfficialSource,
} from 'core';
import { copy } from '../copy';
declare global {
  interface Window {
    safelensPreloads?: Record<string, Promise<Response | Error>>;
  }
}
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public retryAfter = 0,
  ) {
    super(message);
  }
}
const listCache = new Map<string, { tag: string; data: IncidentList }>();
async function request<T>(
  path: string,
  method = 'GET',
  body?: unknown,
): Promise<T> {
  let response: Response;
  const cached = listCache.get(path);
  try {
    const pending = window.safelensPreloads?.[`/api${path}`];
    if (pending && method === 'GET') {
      delete window.safelensPreloads?.[`/api${path}`];
      const result = await pending;
      if (result instanceof Error) throw result;
      response = result;
    } else
      response = await fetch(`/api${path}`, {
        method,
        headers: {
          ...(method !== 'GET' ? { 'Content-Type': 'application/json' } : {}),
          ...(cached ? { 'If-None-Match': cached.tag } : {}),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
  } catch {
    throw new ApiError('network', copy.errors.network);
  }
  if (response.status === 304 && cached) return cached.data as T;
  if (!response.ok) {
    if (response.status === 401 && !path.startsWith('/auth')) {
      listCache.clear();
      window.location.assign(
        `/login?next=${encodeURIComponent(location.pathname + location.search)}`,
      );
    }
    let code = 'generic';
    try {
      const value: unknown = await response.json();
      if (
        value &&
        typeof value === 'object' &&
        'error' in value &&
        value.error &&
        typeof value.error === 'object' &&
        'code' in value.error &&
        typeof value.error.code === 'string'
      )
        code = value.error.code;
    } catch {
      code = 'generic';
    }
    throw new ApiError(
      code,
      code in copy.errors
        ? copy.errors[code as keyof typeof copy.errors]
        : copy.errors.generic,
      Number(response.headers.get('Retry-After')) || 0,
    );
  }
  if (response.status === 204) return undefined as T;
  const result: unknown = await response.json();
  const tag = response.headers.get('ETag');
  if (tag && path.startsWith('/incidents?'))
    listCache.set(path, { tag, data: result as IncidentList });
  return result as T;
}
export const api = {
  session: () => request<AdminSession>('/auth/session'),
  login: (email: string, password: string) =>
    request<AdminSession>('/auth/login', 'POST', { email, password }),
  logout: async () => {
    await request('/auth/logout', 'POST', {});
    listCache.clear();
  },
  chat: (message: string, history: string[], language?: string) =>
    request<ChatReply>('/chat', 'POST', {
      message,
      history,
      ...(language ? { language } : {}),
    }),
  source: (
    ref: number,
    body: { title: string; url: string; summary: string; publishedAt: number },
  ) => request<OfficialSource[]>(`/incidents/${ref}/sources`, 'POST', body),
  removeSource: (ref: number, id: string) =>
    request<undefined>(`/incidents/${ref}/sources/${id}`, 'DELETE', {}),
  health: () => request<Health>('/health'),
  incidents: (status = 'active') =>
    request<IncidentList>(`/incidents?status=${status}`),
  incident: (ref: string) => request<IncidentDetail>(`/incidents/${ref}`),
  report: (body: unknown) => request<ReportResponse>('/reports', 'POST', body),
  status: (ref: number, status: string) =>
    request<IncidentDetail>(`/incidents/${ref}`, 'PATCH', { status }),
  run: (engine: 'rules' | 'ai') =>
    request<TestRunCreated>('/test-runs', 'POST', { engine }),
  step: (id: string, reportId: string) =>
    request<TestStepResult>(`/test-runs/${id}/steps`, 'POST', { reportId }),
  results: (id: string) => request<TestRunView>(`/test-runs/${id}`),
  reset: (id: string) => request<undefined>(`/test-runs/${id}`, 'DELETE', {}),
};
