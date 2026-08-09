import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useCrearProducto,
  useActualizarProducto,
  useEliminarProducto,
  PRODUCTOS_KEYS,
} from '../hooks/queries/useProductosQueries';
import { useCrearMovimiento } from '../hooks/queries/useMovimientosQueries';
import { DEMO_MODE } from '../auth/demoMode';
import { ProductosCtx } from './ProductosContextBase';
import { productosService } from '../services/productosService';
import { toLocalDateStr, nowHora } from '../utils/format';

// Ya no carga el catálogo entero acá (era un array de hasta 500 productos en
// memoria, ver el bug de "aparece 500 productos si hay 6000") — cada pantalla
// pide lo que necesita contra el backend (useProductosPaginado, useBusquedaProductos).
// Este contexto solo expone las mutaciones, que ninguna pantalla necesita
// resolver por sí misma.
export function ProductosProvider({ children, onError }) {
  const queryClient = useQueryClient();
  const crearProductoMutation = useCrearProducto();
  const actualizarProductoMutation = useActualizarProducto();
  const eliminarProductoMutation = useEliminarProducto();
  const crearMovimientoMutation = useCrearMovimiento();

  // Reemplaza al refetch() de una única query {} — invalida CUALQUIER
  // combinación de params cacheada (la tabla de Productos, los buscadores del
  // POS, etc.), no solo una lista fija que ya no se pide de entrada acá.
  const recargarProductos = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: PRODUCTOS_KEYS.lists() });
  }, [queryClient]);

  const crearProducto = useCallback(async (data) => {
    if (DEMO_MODE) {
      const nuevo = { ...data, id: Date.now(), activo: true, stock: data.stock || 0, alerta: data.alerta || 5 };
      return nuevo;
    }
    return crearProductoMutation.mutateAsync(data);
  }, [crearProductoMutation]);

  const eliminarProducto = useCallback(async (id) => {
    if (DEMO_MODE) return;
    return eliminarProductoMutation.mutateAsync(id);
  }, [eliminarProductoMutation]);

  const actualizarProducto = useCallback(async (id, cambios) => {
    if (DEMO_MODE) return { id, ...cambios };
    return actualizarProductoMutation.mutateAsync({ id, data: cambios });
  }, [actualizarProductoMutation]);

  const ajustarStock = useCallback(async (producto, cantidad, nota = '') => {
    if (DEMO_MODE) return;

    // El backend ajusta el stock atómicamente al crear un movimiento tipo 'ajuste'
    // (ver MovimientosController::store) — no hay que tocar el stock desde acá también.
    try {
      await crearMovimientoMutation.mutateAsync({
        id_producto: producto.id,
        producto: producto.nombre,
        codigo: producto.codigo || '',
        tipo: 'ajuste',
        subTipo: nota.trim() || 'Ajuste manual',
        // El backend exige esto (no subTipo) para las bajas — ver
        // MovimientosController::store(). subTipo se queda con el fallback
        // genérico solo para categorizar en listados/reportes.
        nota: nota.trim(),
        cantidad,
        fecha: toLocalDateStr(),
        hora: nowHora(),
      });
      queryClient.invalidateQueries({ queryKey: PRODUCTOS_KEYS.lists() });
    } catch (e) {
      onError?.('No se pudo ajustar el stock', e);
      throw e;
    }
  }, [crearMovimientoMutation, onError, queryClient]);

  const subirImagenProducto = useCallback(async (id, file) => {
    if (DEMO_MODE) return null;
    const actualizado = await productosService.subirImagen(id, file);
    queryClient.invalidateQueries({ queryKey: PRODUCTOS_KEYS.lists() });
    return actualizado;
  }, [queryClient]);

  const eliminarImagenProducto = useCallback(async (id) => {
    if (DEMO_MODE) return null;
    const actualizado = await productosService.eliminarImagen(id);
    queryClient.invalidateQueries({ queryKey: PRODUCTOS_KEYS.lists() });
    return actualizado;
  }, [queryClient]);

  const generarImagenIaProducto = useCallback(async (id) => {
    if (DEMO_MODE) return null;
    const actualizado = await productosService.generarImagenIa(id);
    queryClient.invalidateQueries({ queryKey: PRODUCTOS_KEYS.lists() });
    return actualizado;
  }, [queryClient]);

  const generarImagenComboIaProducto = useCallback(async (id) => {
    if (DEMO_MODE) return null;
    const actualizado = await productosService.generarImagenComboIa(id);
    queryClient.invalidateQueries({ queryKey: PRODUCTOS_KEYS.lists() });
    return actualizado;
  }, [queryClient]);

  return (
    <ProductosCtx.Provider value={{
      recargarProductos,
      crearProducto,
      eliminarProducto,
      actualizarProducto,
      ajustarStock,
      subirImagenProducto,
      eliminarImagenProducto,
      generarImagenIaProducto,
      generarImagenComboIaProducto,
    }}>
      {children}
    </ProductosCtx.Provider>
  );
}