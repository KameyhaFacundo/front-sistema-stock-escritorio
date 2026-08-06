import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { presupuestosService } from '../../services/presupuestosService';
import { PRODUCTOS_KEYS } from './useProductosQueries';

export const PRESUPUESTOS_KEYS = {
  all: ['presupuestos'],
  lists: () => [...PRESUPUESTOS_KEYS.all, 'list'],
  list: (params) => [...PRESUPUESTOS_KEYS.lists(), params],
  details: () => [...PRESUPUESTOS_KEYS.all, 'detail'],
  detail: (id) => [...PRESUPUESTOS_KEYS.details(), id],
};

export function usePresupuestos(params = {}) {
  return useQuery({
    queryKey: PRESUPUESTOS_KEYS.list(params),
    queryFn: () => presupuestosService.getAll(params),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 15,
  });
}

export function usePresupuesto(id, options = {}) {
  return useQuery({
    queryKey: PRESUPUESTOS_KEYS.detail(id),
    queryFn: () => presupuestosService.getById(id),
    enabled: !!id,
    ...options,
  });
}

export function useCrearPresupuesto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => presupuestosService.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PRESUPUESTOS_KEYS.lists() }),
  });
}

export function useActualizarPresupuesto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => presupuestosService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: PRESUPUESTOS_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: PRESUPUESTOS_KEYS.detail(id) });
    },
  });
}

export function useEliminarPresupuesto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => presupuestosService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PRESUPUESTOS_KEYS.lists() }),
  });
}

export function useConvertirPresupuesto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, metodoPago }) => presupuestosService.convertir(id, metodoPago),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRESUPUESTOS_KEYS.lists() });
      // Convertir descuenta stock real — sin esto, Productos se queda mostrando
      // el valor viejo hasta que el caché expira solo (mismo criterio que
      // useCrearMovimiento en useMovimientosQueries.js).
      queryClient.invalidateQueries({ queryKey: PRODUCTOS_KEYS.lists() });
    },
  });
}
