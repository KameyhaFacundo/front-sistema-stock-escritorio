import { useAuth } from '../auth/AuthContextBase';

// Atajos legibles → códigos reales de permiso (deben existir en PermisoSeeder.php
// y coincidir con lo que exige cada ruta del backend, ver routes/api.php).
const PERMISOS_MAP = {
  verDashboard: 'view-dashboard',
  verPOS: 'create-ventas',
  verProductos: 'list-productos',
  verMovimientos: 'list-movimientos',
  verVentas: 'list-ventas',
  verCompras: 'list-compras',
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
};

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
