import { useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useProductos as useProductosQuery,
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

export function ProductosProvider({ children, onError }) {
  const queryClient = useQueryClient();
  const { data: productos = [], isLoading, isError, error, refetch } = useProductosQuery();
  const crearProductoMutation = useCrearProducto();
  const actualizarProductoMutation = useActualizarProducto();
  const eliminarProductoMutation = useEliminarProducto();
  const crearMovimientoMutation = useCrearMovimiento();

  useEffect(() => {
    if (isError) onError?.('No se pudieron cargar los productos', error);
  }, [isError, error, onError]);

  const recargarProductos = useCallback(() => {
    refetch();
  }, [refetch]);

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
      productos,
      isLoading,
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