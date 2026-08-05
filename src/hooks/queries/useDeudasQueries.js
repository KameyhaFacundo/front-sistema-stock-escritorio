import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deudasService } from '../../services/deudasService';

export const DEUDAS_KEYS = {
  all: ['deudas'],
  lists: () => [...DEUDAS_KEYS.all, 'list'],
  list: (params) => [...DEUDAS_KEYS.lists(), params],
  resumen: () => [...DEUDAS_KEYS.all, 'resumen'],
};

export function useDeudas(params = {}) {
  return useQuery({
    queryKey: DEUDAS_KEYS.list(params),
    queryFn: () => deudasService.getAll(params),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
  });
}

export function useResumenDeudas() {
  return useQuery({
    queryKey: DEUDAS_KEYS.resumen(),
    queryFn: () => deudasService.resumen(),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
  });
}

export function usePagarDeuda() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ idCompra, monto }) => deudasService.pagar(idCompra, monto),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: DEUDAS_KEYS.resumen() });
      const previous = queryClient.getQueryData(DEUDAS_KEYS.resumen());
      return { previous };
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(DEUDAS_KEYS.resumen(), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: DEUDAS_KEYS.resumen() });
      queryClient.invalidateQueries({ queryKey: DEUDAS_KEYS.lists() });
    },
  });
}