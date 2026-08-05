import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sucursalesService } from '../../services/sucursalesService';

export const SUCURSALES_KEYS = {
  all: ['sucursales'],
  lists: () => [...SUCURSALES_KEYS.all, 'list'],
};

export function useSucursales(options = {}) {
  return useQuery({
    queryKey: SUCURSALES_KEYS.lists(),
    queryFn: () => sucursalesService.getAll(),
    staleTime: 1000 * 60 * 5,
    ...options,
  });
}

export function useCrearSucursal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => sucursalesService.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SUCURSALES_KEYS.lists() }),
  });
}

export function useActualizarSucursal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => sucursalesService.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SUCURSALES_KEYS.lists() }),
  });
}

export function useEliminarSucursal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => sucursalesService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SUCURSALES_KEYS.lists() }),
  });
}
