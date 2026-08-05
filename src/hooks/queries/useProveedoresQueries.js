import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { proveedoresService } from '../../services/proveedoresService';
import { useOptimisticListMutation } from './optimisticListMutation';

export const PROVEEDORES_KEYS = {
  all: ['proveedores'],
  lists: () => [...PROVEEDORES_KEYS.all, 'list'],
  list: (params) => [...PROVEEDORES_KEYS.lists(), params],
  details: () => [...PROVEEDORES_KEYS.all, 'detail'],
  detail: (id) => [...PROVEEDORES_KEYS.details(), id],
};

export function useProveedores(params = {}) {
  return useQuery({
    queryKey: PROVEEDORES_KEYS.list(params),
    queryFn: () => proveedoresService.getAll(params),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

export function useProveedor(id) {
  return useQuery({
    queryKey: PROVEEDORES_KEYS.detail(id),
    queryFn: () => proveedoresService.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCrearProveedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => proveedoresService.create(data),
    onSuccess: (newProveedor) => {
      queryClient.setQueryData(PROVEEDORES_KEYS.list({}), (old) =>
        old ? [newProveedor, ...old] : [newProveedor]
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: PROVEEDORES_KEYS.lists() });
    },
  });
}

export function useActualizarProveedor() {
  return useOptimisticListMutation({
    listsKey: PROVEEDORES_KEYS.lists(),
    listKey: PROVEEDORES_KEYS.list({}),
    mutationFn: ({ id, data }) => proveedoresService.update(id, data),
    updater: (old, { id, data }) => old?.map((p) => (p.id === id ? { ...p, ...data } : p)),
  });
}

export function useEliminarProveedor() {
  return useOptimisticListMutation({
    listsKey: PROVEEDORES_KEYS.lists(),
    listKey: PROVEEDORES_KEYS.list({}),
    mutationFn: (id) => proveedoresService.delete(id),
    updater: (old, id) => old?.filter((p) => p.id !== id),
  });
}

export function usePrefetchProveedores() {
  const queryClient = useQueryClient();
  return () => queryClient.prefetchQuery({
    queryKey: PROVEEDORES_KEYS.list({}),
    queryFn: () => proveedoresService.getAll({}),
    staleTime: 1000 * 60 * 5,
  });
}