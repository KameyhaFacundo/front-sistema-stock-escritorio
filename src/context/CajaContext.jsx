import { useCallback, useEffect } from 'react';
import { useTurnoActivo, useAbrirCaja, useCerrarCaja, useAgregarMovimientoCaja } from '../hooks/queries/useCajaQueries';
import { DEMO_MODE } from '../auth/demoMode';
import { CajaCtx } from './CajaContextBase';

const CAJA_INIT = {
  abierta: false, montoInicial: 0, horaApertura: null,
  movimientosDetalle: [], ventasEfectivo: 0, efectivoActual: 0,
};

export function CajaProvider({ children, onError }) {
  const { data: caja, isLoading, isError, error, refetch } = useTurnoActivo();
  const abrirCajaMutation = useAbrirCaja();
  const cerrarCajaMutation = useCerrarCaja();
  const agregarMovimientoMutation = useAgregarMovimientoCaja();

  useEffect(() => {
    if (isError) onError?.('No se pudo cargar la caja', error);
  }, [isError, error, onError]);

  const recargarCaja = useCallback(() => {
    refetch();
  }, [refetch]);

  const runMutation = useCallback(async (mutation, msg, ...args) => {
    if (DEMO_MODE) return;
    try {
      return await mutation.mutateAsync(...args);
    } catch (e) {
      onError?.(msg, e);
      throw e;
    }
  }, [onError]);

  const abrirCaja = useCallback((montoInicial) =>
    runMutation(abrirCajaMutation, 'No se pudo abrir la caja', montoInicial),
  [runMutation, abrirCajaMutation]);

  const cerrarCaja = useCallback((montoContado = null) =>
    runMutation(cerrarCajaMutation, 'No se pudo cerrar la caja', montoContado),
  [runMutation, cerrarCajaMutation]);

  const agregarMovimientoCaja = useCallback((mov) =>
    runMutation(agregarMovimientoMutation, 'No se pudo registrar el movimiento', mov),
  [runMutation, agregarMovimientoMutation]);

  return (
    <CajaCtx.Provider value={{ 
      caja: caja || CAJA_INIT, 
      isLoading, 
      recargarCaja, 
      abrirCaja, 
      cerrarCaja, 
      agregarMovimientoCaja 
    }}>
      {children}
    </CajaCtx.Provider>
  );
}