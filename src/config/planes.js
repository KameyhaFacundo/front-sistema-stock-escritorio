// Fuente única de precios/features de los planes — la usan tanto Planes.jsx
// (la página de precios) como Landing.jsx (la landing pública). Antes cada
// una tenía su propio array duplicado y quedaban desincronizadas cada vez
// que se cambiaba un precio o una feature en una sola de las dos.
//
// Mismas reglas de negocio que back-sistema-stock/config/planes.php — ver
// ese archivo para qué función on/off habilita cada plan.
import { P } from '../theme/tokens';

// Bono único de facturas gratis al activar cada plan por primera vez — no se
// renueva mes a mes. Mismos valores que back-sistema-stock/config/planes.php
// 'facturas_gratis_bono'. Declarado antes de PLANES para poder referenciarlo
// en las features de cada plan sin duplicar los números a mano.
export const FACTURAS_GRATIS_BONO = { esencial: 100, pro: 200, ia: 400 };

export const PLANES = [
  {
    id: 'esencial',
    nombre: 'Plan Esencial',
    desc: 'Para comercios que arrancan',
    precioBase: null,
    precioMes: 35000,
    precioAnual: 28000,
    badge: null,
    badgeColor: null,
    highlight: false,
    features: [
      'Punto de venta con código de barras',
      'Usalo desde la computadora o el celular, sin instalar nada',
      'Gestión de stock y reposición',
      'Reportes de ventas diarios',
      'Clientes y cuentas corrientes',
      'Compras y proveedores',
      `Facturación ARCA (costo adicional) — ${FACTURAS_GRATIS_BONO.esencial} facturas gratis de regalo`,
      '1 sucursal',
      'Hasta 3.500 productos',
      'Hasta 2 usuarios',
    ],
  },
  {
    id: 'pro',
    nombre: 'Plan Pro',
    desc: 'El más completo',
    precioBase: null,
    precioMes: 47000,
    precioAnual: 37600,
    badge: 'Más elegido',
    badgeColor: P,
    highlight: true,
    features: [
      'Todo el Plan Esencial +',
      `Facturación ARCA (costo adicional) — ${FACTURAS_GRATIS_BONO.pro} facturas gratis de regalo`,
      'Permisos granulares por usuario',
      'Catálogo online con fotos de producto',
      'Impresión de etiquetas de precio',
      'Soporte prioritario',
      'Exportación avanzada de reportes',
      'Hasta 2 sucursales',
      'Hasta 10.000 productos',
      'Hasta 5 usuarios',
    ],
  },
  {
    id: 'ia',
    nombre: 'Plan IA',
    desc: 'Con inteligencia artificial',
    precioBase: null,
    precioMes: 60000,
    precioAnual: 48000,
    badge: 'Nuevo',
    badgeColor: '#10b981',
    highlight: false,
    features: [
      'Todo el Plan Pro +',
      `Facturación ARCA (costo adicional) — ${FACTURAS_GRATIS_BONO.ia} facturas gratis de regalo`,
      'Escaneo de facturas con IA (carga productos y montos solo)',
      'Sugerencia de categoría y precio de venta con IA',
      'Fotos de producto generadas o compuestas con IA',
      'Asistente de IA',
      'Sucursales ilimitadas',
      'Productos ilimitados',
      'Usuarios ilimitados',
    ],
  },
];

// Packs prepagos de facturación electrónica — add-on independiente del plan,
// pago único sin vencimiento (se consumen de a uno por factura emitida).
// Mismos valores que back-sistema-stock/config/planes.php 'packs_facturacion'.
export const PACKS_FACTURACION = [
  { id: '500',  cantidad: 500,  precio: 10000 },
  { id: '1000', cantidad: 1000, precio: 20000 },
  { id: '2000', cantidad: 2000, precio: 40000 },
];
