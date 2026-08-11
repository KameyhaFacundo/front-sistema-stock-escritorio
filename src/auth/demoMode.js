export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

export const DEMO_TOKEN = import.meta.env.VITE_DEMO_TOKEN || 'demo-mode-token'

// Códigos que cubren todo lo que el sidebar/useHasPermiso puede pedir (ver PERMISOS_MAP
// en useHasPermiso.jsx). El demo simula un usuario con el rol "Administrador" completo.
const DEMO_PERMISOS_CODIGOS = [
  'view-dashboard', 'view-dashboard-completo', 'create-ventas', 'list-productos', 'list-ventas',
  'list-compras', 'list-proveedores', 'list-clientes', 'list-usuarios',
  'list-presupuestos', 'view-presupuestos', 'create-presupuestos', 'update-presupuestos', 'delete-presupuestos',
  'list-movimientos', 'list-caja', 'list-historial-caja', 'ver-montos-caja',
  'update-productos', 'update-usuarios',
  'create-compras', 'create-caja', 'create-movimientos',
  'aplicar-descuento-ventas', 'anular-ventas', 'devolver-ventas', 'update-ventas',
  'change-status-compras', 'devolver-compras', 'update-compras',
  'view-configuracion', 'update-configuracion',
  'view-etiquetas', 'print-etiquetas',
  'list-carritos-vaciados',
  'ver-filtros-fechas',
  // Fila-por-fila: crear/editar/eliminar de cada entidad (ver useHasPermiso.jsx)
  'create-productos', 'delete-productos',
  'create-categorias', 'update-categorias', 'delete-categorias',
  'create-proveedores', 'update-proveedores', 'delete-proveedores',
  'create-clientes', 'update-clientes', 'delete-clientes',
  'create-usuarios', 'delete-usuarios', 'assign-permisos',
];

export const DEMO_USER = {
  nro_usu: 1,
  des_usu: 'Usuario Demo',
  email: import.meta.env.VITE_DEMO_EMAIL || 'demo@minegocio.com',
  empresa_id: 1,
  // arca:true — sin esto tieneFacturacion (usePlan.js) da false en modo demo
  // pese a que el plan 'pro' sí incluye facturación, y se esconden el botón
  // "Facturar ARCA" y la sección de Facturas del sidebar.
  empresa: { id: 1, nombre: import.meta.env.VITE_COMPANY_NAME || 'Mi Negocio', plan: 'pro', arca: true },
  rol: { nombre: 'Administrador', permisos: DEMO_PERMISOS_CODIGOS.map(codigo => ({ codigo })) },
  permisos: [],
}
