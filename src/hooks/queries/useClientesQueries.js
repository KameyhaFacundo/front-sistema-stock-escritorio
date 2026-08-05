import { useQuery, useQueryClient } from '@tanstack/react-query';
import { clientesService } from '../../services/clientesService';
import { useOptimisticListMutation } from './optimisticListMutation';

export const CLIENTES_KEYS = {
  all: ['clientes'],
  lists: () => [...CLIENTES_KEYS.all, 'list'],
  list: (params) => [...CLIENTES_KEYS.lists(), params],
  details: () => [...CLIENTES_KEYS.all, 'detail'],
  detail: (id) => [...CLIENTES_KEYS.details(), id],
};

export function useClientes(params = {}) {
  return useQuery({
    queryKey: CLIENTES_KEYS.list(params),
    queryFn: () => clientesService.getAll(params),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

export function useCliente(id) {
  return useQuery({
    queryKey: CLIENTES_KEYS.detail(id),
    queryFn: () => clientesService.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCrearCliente() {
  return useOptimisticListMutation({
    listsKey: CLIENTES_KEYS.lists(),
    listKey: CLIENTES_KEYS.list({}),
    mutationFn: (data) => clientesService.create(data),
    updater: (old, newItem) => old ? [newItem, ...old] : [newItem],
  });
}

export function useActualizarCliente() {
  return useOptimisticListMutation({
    listsKey: CLIENTES_KEYS.lists(),
    listKey: CLIENTES_KEYS.list({}),
    mutationFn: ({ id, data }) => clientesService.update(id, data),
    updater: (old, { id, data }) => old?.map((c) => (c.id === id ? { ...c, ...data } : c)),
  });
}

export function useEliminarCliente() {
  return useOptimisticListMutation({
    listsKey: CLIENTES_KEYS.lists(),
    listKey: CLIENTES_KEYS.list({}),
    mutationFn: (id) => clientesService.delete(id),
    updater: (old, id) => old?.filter((c) => c.id !== id),
  });
}

export function usePrefetchClientes() {
  const queryClient = useQueryClient();
  return () => queryClient.prefetchQuery({
    queryKey: CLIENTES_KEYS.list({}),
    queryFn: () => clientesService.getAll({}),
    staleTime: 1000 * 60 * 5,
  });
}