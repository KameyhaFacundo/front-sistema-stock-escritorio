import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ventasService } from '../../services/ventasService';
import { DEMO_MODE } from '../../auth/demoMode';
import { DEMO_VENTAS } from '../../auth/demoData';
import { useOptimisticListMutation } from './optimisticListMutation';
import { PAGE_SIZES } from '../../constants';

export const VENTAS_KEYS = {
  all: ['ventas'],
  lists: () => [...VENTAS_KEYS.all, 'list'],
  list: (params) => [...VENTAS_KEYS.lists(), params],
  details: () => [...VENTAS_KEYS.all, 'detail'],
  detail: (id) => [...VENTAS_KEYS.details(), id],
};

export function useVentas(params = {}) {
  return useQuery({
    queryKey: VENTAS_KEYS.list(params),
    queryFn: () => ventasService.getAll(params),
    enabled: !DEMO_MODE,
    initialData: DEMO_MODE ? DEMO_VENTAS : undefined,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 15,
  });
}

export function useVenta(id) {
  return useQuery({
    queryKey: VENTAS_KEYS.detail(id),
    queryFn: () => ventasService.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

// Coincide con los params que usa VentasContext.jsx al llamar useVentas({ per_page: 300 }).
const DEFAULT_LIST_PARAMS = { per_page: PAGE_SIZES.VENTAS };

export function useCrearVenta() {
  return useOptimisticListMutation({
    listsKey: VENTAS_KEYS.lists(),
    listKey: VENTAS_KEYS.list(DEFAULT_LIST_PARAMS),
    mutationFn: (data) => ventasService.create(data),
    updater: (old, newVenta) => (old ? [newVenta, ...old] : [newVenta]),
  });
}

export function usePrefetchVentas() {
  const queryClient = useQueryClient();
  return () => queryClient.prefetchQuery({
    queryKey: VENTAS_KEYS.list({}),
    queryFn: () => ventasService.getAll({}),
    staleTime: 1000 * 60 * 2,
  });
}