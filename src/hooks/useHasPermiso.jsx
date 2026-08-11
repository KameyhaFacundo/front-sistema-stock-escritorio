import { useAuth } from '../auth/AuthContextBase';

// Atajos legibles → códigos reales de permiso (deben existir en PermisoSeeder.php
// y coincidir con lo que exige cada ruta del backend, ver routes/api.php).
export const PERMISOS_MAP = {
  verDashboard: 'view-dashboard',
  verDashboardCompleto: 'view-dashboard-completo',
  verPOS: 'create-ventas',
  verProductos: 'list-productos',
  verMovimientos: 'list-movimientos',
  verVentas: 'list-ventas',
  verCompras: 'list-compras',
  verPresupuestos: 'list-presupuestos',
  gestionarPresupuestos: 'create-presupuestos',
  verProveedores: 'list-proveedores',
  verClientes: 'list-clientes',
  verUsuarios: 'list-usuarios',
  verCaja: 'list-caja',
  verHistorialCaja: 'list-historial-caja',
  verMontosCaja: 'ver-montos-caja',
  gestionarProductos: 'update-productos',
  gestionarVentas: 'create-ventas',
  gestionarCompras: 'create-compras',
  gestionarCaja: 'create-caja',
  gestionarMovimientos: 'create-movimientos',
  gestionarUsuarios: 'update-usuarios',
  aplicarDescuento: 'aplicar-descuento-ventas',
  anularVenta: 'anular-ventas',
  devolverVenta: 'devolver-ventas',
  anularCompra: 'change-status-compras',
  devolverCompra: 'devolver-compras',
  verFiltrosFechas: 'ver-filtros-fechas',
  verConfiguracion: 'view-configuracion',
  verEtiquetas: 'view-etiquetas',
  verCarritosVaciados: 'list-carritos-vaciados',
  // Antes solo se usaban permisos "list"/"create" para decidir si mostrar
  // toda una sección — el lápiz/tacho de cada fila (editar/eliminar un
  // registro puntual) se mostraba siempre, sin importar el permiso real.
  // El backend igual los rechazaba (403), pero el botón quedaba ahí
  // invitando a tocarlo. Estos completan esa granularidad fila-por-fila.
  crearProducto: 'create-productos',
  eliminarProducto: 'delete-productos',
  crearCategoria: 'create-categorias',
  actualizarCategoria: 'update-categorias',
  eliminarCategoria: 'delete-categorias',
  crearProveedor: 'create-proveedores',
  actualizarProveedor: 'update-proveedores',
  eliminarProveedor: 'delete-proveedores',
  crearCliente: 'create-clientes',
  actualizarCliente: 'update-clientes',
  actualizarVenta: 'update-ventas',
  eliminarCliente: 'delete-clientes',
  crearUsuario: 'create-usuarios',
  eliminarUsuario: 'delete-usuarios',
  asignarPermisos: 'assign-permisos',
  actualizarCompra: 'update-compras',
};

// Destino post-login / fallback de "acceso denegado" — antes /dashboard
// estaba hardcodeado en Login.jsx, OAuthCallback.jsx y PrivateRoute.jsx
// asumiendo que CUALQUIER rol logueado tiene esa página habilitada. Con el
// rol "usuario" (vendedor/cajero) sin view-dashboard, esa asunción rompía:
// apenas iniciaba sesión, PrivateRoute lo mandaba de nuevo a "/" (landing
// pública) en vez de adentro de la app. Esta lista prueba, en orden, la
// primera pantalla a la que el rol SÍ tiene acceso — "/" queda como último
// recurso (caso raro: un rol sin ninguna de estas).
const RUTAS_LANDING = [
  ['verDashboard', '/dashboard'],
  ['verPOS', '/pos'],
  ['verCompras', '/compras'],
  ['verClientes', '/clientes'],
  ['verProveedores', '/proveedores'],
  ['verCaja', '/caja'],
  ['verProductos', '/productos'],
  ['verMovimientos', '/movimientos'],
  ['verPresupuestos', '/presupuestos'],
];

// tienePermiso: la misma firma que checkPermisos(permiso) — se le puede pasar
// el checkPermisos de este hook (usuario ya logueado, permisos en contexto)
// o una función armada a mano contra el array crudo de códigos que devuelve
// el login (los permisos recién llegados todavía no están en el contexto en
// el mismo render en que se decide a dónde navegar).
export function primeraRutaDisponible(tienePermiso) {
  for (const [permiso, ruta] of RUTAS_LANDING) {
    if (tienePermiso(permiso)) return ruta;
  }
  return '/';
}

export default function useHasPermiso() {
  const { myPermisos, user } = useAuth();

  const checkPermisos = (permiso) => {
    if (!permiso) return true; // items sin permiso asociado (ej. Dashboard) son siempre visibles
    if (!user || !myPermisos) return false;
    // OJO: is_super_admin NO debe bypasear esto — el backend solo lo usa para las
    // rutas de /super-admin (checkSuperAdmin), nunca para las rutas normales de la
    // empresa. Si bypaseamos acá, el sidebar muestra ítems que el backend igual bloquea.
    const key = typeof permiso === 'string' ? (PERMISOS_MAP[permiso] || permiso) : permiso;
    return myPermisos.includes(key);
  };

  const tieneAlguno = (...permisos) => permisos.some((p) => checkPermisos(p));

  return { checkPermisos, tieneAlguno };
}
