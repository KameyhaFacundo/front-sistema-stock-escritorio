import { useQuery, useQueryClient } from '@tanstack/react-query';
import { productosService } from '../../services/productosService';
import { DEMO_MODE } from '../../auth/demoMode';
import { DEMO_PRODUCTOS } from '../../auth/demoData';
import { useOptimisticListMutation } from './optimisticListMutation';

export const PRODUCTOS_KEYS = {
  all: ['productos'],
  lists: () => [...PRODUCTOS_KEYS.all, 'list'],
  list: (params) => [...PRODUCTOS_KEYS.lists(), params],
  details: () => [...PRODUCTOS_KEYS.all, 'detail'],
  detail: (id) => [...PRODUCTOS_KEYS.details(), id],
  historialPrecios: (id) => [...PRODUCTOS_KEYS.all, 'historialPrecios', id],
};

export function useProductos(params = {}, options = {}) {
  return useQuery({
    queryKey: PRODUCTOS_KEYS.list(params),
    queryFn: () => productosService.getAll(params),
    enabled: !DEMO_MODE && (options.enabled ?? true),
    initialData: DEMO_MODE ? DEMO_PRODUCTOS : undefined,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

export function useProducto(id) {
  return useQuery({
    queryKey: PRODUCTOS_KEYS.detail(id),
    queryFn: () => productosService.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useHistorialPrecios(id) {
  return useQuery({
    queryKey: PRODUCTOS_KEYS.historialPrecios(id),
    queryFn: () => productosService.getHistorialPrecios(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCrearProducto() {
  return useOptimisticListMutation({
    listsKey: PRODUCTOS_KEYS.lists(),
    listKey: PRODUCTOS_KEYS.list({}),
    mutationFn: (data) => productosService.create(data),
    updater: (old, newItem) => old ? [newItem, ...old] : [newItem],
  });
}

export function useActualizarProducto() {
  return useOptimisticListMutation({
    listsKey: PRODUCTOS_KEYS.lists(),
    listKey: PRODUCTOS_KEYS.list({}),
    mutationFn: ({ id, data }) => productosService.update(id, data),
    updater: (old, { id, data }) => old?.map((p) => (p.id === id ? { ...p, ...data } : p)),
  });
}

export function useEliminarProducto() {
  return useOptimisticListMutation({
    listsKey: PRODUCTOS_KEYS.lists(),
    listKey: PRODUCTOS_KEYS.list({}),
    mutationFn: (id) => productosService.delete(id),
    updater: (old, id) => old?.filter((p) => p.id !== id),
  });
}

export function usePrefetchProductos() {
  const queryClient = useQueryClient();
  return () => queryClient.prefetchQuery({
    queryKey: PRODUCTOS_KEYS.list({}),
    queryFn: () => productosService.getAll({}),
    staleTime: 1000 * 60 * 5,
  });
}