import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { lotesService } from '../../services/lotesService';
import { PRODUCTOS_KEYS } from './useProductosQueries';

export const LOTES_KEYS = {
  all: ['lotes'],
  lists: () => [...LOTES_KEYS.all, 'list'],
  list: (params) => [...LOTES_KEYS.lists(), params],
  byProducto: (id) => [...LOTES_KEYS.all, 'producto', id],
  vencimientos: (dias) => [...LOTES_KEYS.all, 'vencimientos', dias],
};

export function useLotes(params = {}, options = {}) {
  return useQuery({
    queryKey: LOTES_KEYS.list(params),
    queryFn: () => lotesService.getAll(params),
    staleTime: 1000 * 60 * 2,
    ...options,
  });
}

export function useLotesPorProducto(idProducto, options = {}) {
  return useQuery({
    queryKey: LOTES_KEYS.byProducto(idProducto),
    queryFn: () => lotesService.getByProducto(idProducto),
    enabled: !!idProducto,
    staleTime: 1000 * 60 * 2,
    ...options,
  });
}

export function useVencimientosProximos(dias = 7, options = {}) {
  return useQuery({
    queryKey: LOTES_KEYS.vencimientos(dias),
    queryFn: () => lotesService.getProximosAVencer(dias),
    staleTime: 1000 * 60 * 5,
    ...options,
  });
}

export function useCrearLote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => lotesService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LOTES_KEYS.all });
      qc.invalidateQueries({ queryKey: PRODUCTOS_KEYS.lists() });
    },
  });
}

export function useActualizarLote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => lotesService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LOTES_KEYS.all });
      qc.invalidateQueries({ queryKey: PRODUCTOS_KEYS.lists() });
    },
  });
}

export function useEliminarLote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => lotesService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LOTES_KEYS.all });
      qc.invalidateQueries({ queryKey: PRODUCTOS_KEYS.lists() });
    },
  });
}
