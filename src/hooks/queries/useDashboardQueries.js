import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getDashboardStats } from '../../services/dashboardService';

export const DASHBOARD_KEYS = {
  all: ['dashboard'],
  stats: (params) => [...DASHBOARD_KEYS.all, 'stats', params],
};

export function useDashboardStats(params = {}) {
  return useQuery({
    queryKey: DASHBOARD_KEYS.stats(params),
    queryFn: () => getDashboardStats(params),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
  });
}

export function usePrefetchDashboardStats() {
  const queryClient = useQueryClient();
  return () => queryClient.prefetchQuery({
    queryKey: DASHBOARD_KEYS.stats({}),
    queryFn: () => getDashboardStats({}),
    staleTime: 1000 * 60 * 2,
  });
}