import { useQuery } from '@tanstack/react-query';
import { api } from './api';
export function useAdmin(enabled = true) {
  return useQuery({
    queryKey: ['admin-session'],
    queryFn: api.session,
    enabled,
    staleTime: 30000,
    retry: false,
  });
}
export function adminDestination(value: string | null) {
  return value &&
    /^\/(incidents(?:\/\d+)?|map|test-lab)(?:\?[^#]*)?$/.test(value)
    ? value
    : '/incidents';
}
