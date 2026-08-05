import { useAuth } from '../auth/AuthContextBase';

// Build local de un solo comercio, sin planes pagos: todas las funciones
// están siempre disponibles y sin límite de sucursales. Se mantiene la forma
// del hook (mismos campos que antes) para no tener que tocar cada componente
// que ya la consume (ConfigModal, Sidebar, etc.) — solo cambia que ya no hay
// nada que gatear.
export default function usePlan() {
  const { user } = useAuth();

  // "arca" es el sí/no de facturación electrónica que se elige en el
  // onboarding ("¿Necesitás facturar?") y se puede prender/apagar después
  // desde Configuración → Facturación (ver ConfigModal.jsx) — esto sigue
  // siendo una preferencia real del negocio, no un límite de plan.
  const facturacionActivada = !!user?.empresa?.arca;

  return {
    plan: 'local',
    tieneCatalogo: true,
    // IA (Gemini) desactivada por ahora a pedido — las rutas del backend
    // también están comentadas (ver routes/api.php). Volver a `true` alcanza
    // para reactivar toda la UI: cada botón/chip de IA ya chequea este flag.
    tieneIA: false,
    tieneCobros: true,
    tieneFacturacion: facturacionActivada,
    planTieneFacturacion: true,
    facturacionActivada,
    tieneEtiquetas: true,
    sucursalesMax: null,
  };
}
