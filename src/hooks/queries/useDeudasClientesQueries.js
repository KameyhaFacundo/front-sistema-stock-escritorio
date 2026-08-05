import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deudasClientesService } from '../../services/deudasClientesService';

export const DEUDAS_CLIENTES_KEYS = {
  all: ['deudasClientes'],
  lists: () => [...DEUDAS_CLIENTES_KEYS.all, 'list'],
  list: (params) => [...DEUDAS_CLIENTES_KEYS.lists(), params],
  resumen: () => [...DEUDAS_CLIENTES_KEYS.all, 'resumen'],
};

export function useDeudasClientes(params = {}) {
  return useQuery({
    queryKey: DEUDAS_CLIENTES_KEYS.list(params),
    queryFn: () => deudasClientesService.getAll(params),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
  });
}

export function useResumenFiados() {
  return useQuery({
    queryKey: DEUDAS_CLIENTES_KEYS.resumen(),
    queryFn: () => deudasClientesService.resumen(),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
  });
}

export function useCobrarFiado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ idVenta, data }) => deudasClientesService.cobrar(idVenta, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEUDAS_CLIENTES_KEYS.resumen() });
      queryClient.invalidateQueries({ queryKey: DEUDAS_CLIENTES_KEYS.lists() });
    },
  });
}

export function useActualizarPreciosFiado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ idVenta, data }) => deudasClientesService.actualizarPrecios(idVenta, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEUDAS_CLIENTES_KEYS.resumen() });
      queryClient.invalidateQueries({ queryKey: DEUDAS_CLIENTES_KEYS.lists() });
    },
  });
}

export function useRevertirPreciosFiado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (idVenta) => deudasClientesService.revertirPrecios(idVenta),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEUDAS_CLIENTES_KEYS.resumen() });
      queryClient.invalidateQueries({ queryKey: DEUDAS_CLIENTES_KEYS.lists() });
    },
  });
}

export function usePrefetchDeudasClientes() {
  const queryClient = useQueryClient();
  return () => queryClient.prefetchQuery({
    queryKey: DEUDAS_CLIENTES_KEYS.resumen(),
    queryFn: () => deudasClientesService.resumen(),
    staleTime: 1000 * 60 * 2,
  });
}