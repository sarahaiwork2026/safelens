import { QueryClient, queryOptions } from '@tanstack/react-query';
import { api } from './api';
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5000, retry: 1, refetchOnWindowFocus: true },
    mutations: { retry: false },
  },
});
export const incidentsQuery = (status = 'active') =>
  queryOptions({
    queryKey: ['incidents', status],
    queryFn: () => api.incidents(status),
  });
