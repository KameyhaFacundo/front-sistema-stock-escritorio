import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cajaService } from '../../services/cajaService';
import { DEMO_MODE } from '../../auth/demoMode';
import { DEMO_CAJA } from '../../auth/demoData';

export const CAJA_KEYS = {
  all: ['caja'],
  turnoActivo: () => [...CAJA_KEYS.all, 'turnoActivo'],
  historial: (params) => [...CAJA_KEYS.all, 'historial', params],
};

export function useTurnoActivo() {
  return useQuery({
    queryKey: CAJA_KEYS.turnoActivo(),
    queryFn: () => cajaService.turnoActivo(),
    enabled: !DEMO_MODE,
    initialData: DEMO_MODE ? DEMO_CAJA : undefined,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
  });
}

export function useHistorialCaja(params = {}) {
  return useQuery({
    queryKey: CAJA_KEYS.historial(params),
    queryFn: () => cajaService.historial(params),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
  });
}

export function useAbrirCaja() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => cajaService.abrir(data),
    onSuccess: (newTurno) => {
      queryClient.setQueryData(CAJA_KEYS.turnoActivo(), newTurno);
    },
  });
}

export function useCerrarCaja() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (montoContado) => cajaService.cerrar(montoContado),
    onSuccess: () => {
      queryClient.setQueryData(CAJA_KEYS.turnoActivo(), null);
      queryClient.invalidateQueries({ queryKey: CAJA_KEYS.historial({}) });
    },
  });
}

export function useAgregarMovimientoCaja() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tipo, monto, motivo }) => cajaService.agregarMovimiento(tipo, monto, motivo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CAJA_KEYS.turnoActivo() });
      queryClient.invalidateQueries({ queryKey: CAJA_KEYS.historial({}) });
    },
  });
}