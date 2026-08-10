import { useState, useCallback, startTransition, useMemo, useEffect } from 'react';
import { deudasService } from '../services/deudasService';
import { deudasClientesService } from '../services/deudasClientesService';
import { getDashboardStats } from '../services/dashboardService';
import { DEMO_MODE } from '../auth/demoMode';
import { DEMO_DEUDAS, DEMO_FIADOS } from '../auth/demoData';
import { CajaProvider } from './CajaContext';
import { AppCtx } from './AppContextBase';

const METODO_LABELS = { efectivo: 'Efectivo', tarjeta: 'Tarjeta', transferencia: 'Transferencia', qr: 'QR', fiado: 'Fiado' };

export function AppProvider({ children }) {
  const [loadingData, setLoadingData] = useState(true);
  const [resumenDeudas, setResumenDeudas] = useState([]);
  const [resumenFiados, setResumenFiados] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  // Si nunca conectó Google Drive, el único backup que tiene vive SOLO en
  // esta PC — si el equipo se rompe o se lo roban, se pierde todo. Se
  // chequea una vez al arrancar (window.electronAPI no existe en pnpm dev/
  // demo/acceso por navegador de otra caja, ahí queda en false y no molesta).
  const [driveConectado, setDriveConectado] = useState(true);

  const handleError = useCallback((msg, err) => {
    console.error(msg, err);
  }, []);

  const recargarResumenDeudas = useCallback(async () => {
    if (DEMO_MODE) { startTransition(() => setResumenDeudas(DEMO_DEUDAS)); return; }
    try {
      const data = await deudasService.resumen();
      startTransition(() => setResumenDeudas(Array.isArray(data) ? data : []));
    } catch (e) { handleError('No se pudo cargar el resumen de deudas', e); }
  }, [handleError]);

  const recargarResumenFiados = useCallback(async () => {
    if (DEMO_MODE) { startTransition(() => setResumenFiados(DEMO_FIADOS)); return; }
    try {
      const data = await deudasClientesService.resumen();
      startTransition(() => setResumenFiados(Array.isArray(data) ? data : []));
    } catch (e) { handleError('No se pudo cargar el resumen de fiados', e); }
  }, [handleError]);

  const recargarDashboardStats = useCallback(async () => {
    if (DEMO_MODE) return;
    try {
      const data = await getDashboardStats();
      startTransition(() => setDashboardStats(data));
    } catch (e) { handleError('No se pudieron cargar las estadísticas del dashboard', e); }
  }, [handleError]);

  useEffect(() => {
    Promise.all([
      recargarDashboardStats(), recargarResumenDeudas(), recargarResumenFiados(),
    ]).finally(() => startTransition(() => setLoadingData(false)));
  }, []);

  useEffect(() => {
    if (!window.electronAPI?.driveConectado) return;
    window.electronAPI.driveConectado()
      .then(ok => startTransition(() => setDriveConectado(ok)))
      .catch(() => {});
  }, []);

  const statsHoy = useMemo(() => {
    if (dashboardStats) {
      return {
        ingresos: dashboardStats.ingresosHoy ?? 0,
        totalVentas: dashboardStats.ventasHoy ?? 0,
        ticketPromedio: dashboardStats.ticketPromedio ?? 0,
      };
    }
    return { ingresos: 0, totalVentas: 0, ticketPromedio: 0 };
  }, [dashboardStats]);

  const alertas = useMemo(() => {
    const stockBajo = dashboardStats?.stockBajo ?? [];
    const deudasProv = resumenDeudas.filter(d => (d.saldo_pendiente ?? 0) > 0);
    const fiadosCli = resumenFiados.filter(f => (f.saldo_pendiente ?? 0) > 0);
    const backupSinDrive = !driveConectado;
    const total = (stockBajo.length > 0 ? 1 : 0) + (deudasProv.length > 0 ? 1 : 0) + (fiadosCli.length > 0 ? 1 : 0) + (backupSinDrive ? 1 : 0);
    return {
      stockBajo,
      deudasProveedores: deudasProv,
      totalDeudasProveedores: deudasProv.reduce((s, d) => s + (d.saldo_pendiente ?? 0), 0),
      fiadosClientes: fiadosCli,
      totalFiadosClientes: fiadosCli.reduce((s, f) => s + (f.saldo_pendiente ?? 0), 0),
      backupSinDrive,
      total,
    };
  }, [dashboardStats, resumenDeudas, resumenFiados, driveConectado]);

  const value = useMemo(() => ({
    loadingData, dashboardStats, statsHoy, alertas,
    resumenDeudas, resumenFiados,
    recargarResumenDeudas, recargarResumenFiados, recargarDashboardStats,
    METODO_LABELS,
  }), [loadingData, dashboardStats, statsHoy, alertas, resumenDeudas, resumenFiados, recargarResumenDeudas, recargarResumenFiados, recargarDashboardStats]);

  return (
    <CajaProvider onError={handleError}>
      <AppCtx.Provider value={value}>
        {children}
      </AppCtx.Provider>
    </CajaProvider>
  );
}
