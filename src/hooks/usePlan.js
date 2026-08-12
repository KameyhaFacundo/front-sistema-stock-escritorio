import { useAuth } from '../auth/AuthContextBase';

// Mismas reglas que back-sistema-stock/config/planes.php — mantené ambos en
// sync si cambian. El backend es la fuente de verdad (siempre re-valida ahí);
// esto es solo para no mostrar botones/opciones que el usuario no puede usar.
const SUCURSALES_MAX = { free: 1, esencial: 1, pro: 2, ia: null };
const FEATURES = {
  free:     { catalogo: false, ia: false, cobros: false, facturacion: false, etiquetas: false },
  esencial: { catalogo: false, ia: false, cobros: false, facturacion: true,  etiquetas: false },
  pro:      { catalogo: true,  ia: false, cobros: true,  facturacion: true,  etiquetas: true },
  ia:       { catalogo: true,  ia: true,  cobros: true,  facturacion: true,  etiquetas: true },
};

export default function usePlan() {
  const { user } = useAuth();
  const plan = user?.empresa?.plan || 'free';
  const features = FEATURES[plan] ?? FEATURES.free;

  // "arca" es el sí/no de facturación electrónica que se elige en el
  // onboarding ("¿Necesitás facturar?") y se puede prender/apagar después
  // desde Configuración → Facturación (ver ConfigModal.jsx) — un negocio
  // puede tener plan con facturación disponible y aun así no querer usarla.
  const facturacionActivada = !!user?.empresa?.arca;

  return {
    plan,
    tieneCatalogo: !!features.catalogo,
    tieneIA: !!features.ia,
    tieneCobros: !!features.cobros,
    // Efectivo: el plan tiene que incluirla Y el negocio tiene que haberla
    // activado — para el gate de plan solo (upsell de "actualizá tu plan",
    // sin mezclarlo con la preferencia propia del negocio) usar planTieneFacturacion.
    tieneFacturacion: !!features.facturacion && facturacionActivada,
    planTieneFacturacion: !!features.facturacion,
    facturacionActivada,
    tieneEtiquetas: !!features.etiquetas,
    sucursalesMax: plan in SUCURSALES_MAX ? SUCURSALES_MAX[plan] : SUCURSALES_MAX.free,
  };
}
