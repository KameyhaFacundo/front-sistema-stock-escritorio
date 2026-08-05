import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { movimientosService } from '../../services/movimientosService';
import { PRODUCTOS_KEYS } from './useProductosQueries';
import { useOptimisticListMutation } from './optimisticListMutation';

export const MOVIMIENTOS_KEYS = {
  all: ['movimientos'],
  lists: () => [...MOVIMIENTOS_KEYS.all, 'list'],
  list: (params) => [...MOVIMIENTOS_KEYS.lists(), params],
  details: () => [...MOVIMIENTOS_KEYS.all, 'detail'],
  detail: (id) => [...MOVIMIENTOS_KEYS.details(), id],
};

export function useMovimientos(params = {}) {
  return useQuery({
    queryKey: MOVIMIENTOS_KEYS.list(params),
    queryFn: () => movimientosService.getAll(params),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 15,
  });
}

export function useCrearMovimiento() {
  return useOptimisticListMutation({
    listsKey: MOVIMIENTOS_KEYS.lists(),
    listKey: MOVIMIENTOS_KEYS.list({}),
    mutationFn: (data) => movimientosService.create(data),
    updater: (old, newMovimiento) => (old ? [newMovimiento, ...old] : [newMovimiento]),
    // Un movimiento de tipo "ajuste" (alta/baja manual) cambia el stock real —
    // sin esto, la tabla de Productos se queda mostrando el valor viejo hasta
    // que el cache expira solo (staleTime 5min) o se refresca la página.
    extraInvalidateKeys: [PRODUCTOS_KEYS.lists()],
  });
}

export function useTransferirStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => movimientosService.transferir(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MOVIMIENTOS_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: PRODUCTOS_KEYS.lists() });
    },
  });
}

export function usePrefetchMovimientos() {
  const queryClient = useQueryClient();
  return () => queryClient.prefetchQuery({
    queryKey: MOVIMIENTOS_KEYS.list({}),
    queryFn: () => movimientosService.getAll({}),
    staleTime: 1000 * 60 * 2,
  });
}