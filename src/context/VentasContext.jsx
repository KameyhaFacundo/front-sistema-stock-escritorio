import { useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useVentas as useVentasQuery, useCrearVenta, VENTAS_KEYS } from '../hooks/queries/useVentasQueries';
import { MOVIMIENTOS_KEYS } from '../hooks/queries/useMovimientosQueries';
import { ventasService } from '../services/ventasService';
import { PRODUCTOS_KEYS } from '../hooks/queries/useProductosQueries';
import { CAJA_KEYS } from '../hooks/queries/useCajaQueries';
import { DEMO_MODE } from '../auth/demoMode';
import { toLocalDateStr, nowHora } from '../utils/format';
import { VentasCtx } from './VentasContextBase';
import { PAGE_SIZES } from '../constants';

export function VentasProvider({ children, onError, onRecargarFiados }) {
  const queryClient = useQueryClient();
  const { data: ventas = [], isLoading, isError, error, refetch } = useVentasQuery({ per_page: PAGE_SIZES.VENTAS });
  const crearVentaMutation = useCrearVenta();

  useEffect(() => {
    if (isError) onError?.('No se pudieron cargar las ventas', error);
  }, [isError, error, onError]);

  const recargarVentas = useCallback(() => {
    refetch();
  }, [refetch]);

  const registrarVenta = useCallback(async (ventaLocal) => {
    const payload = {
      numero_ticket: ventaLocal.numero || ventaLocal.ticketId,
      fecha: (ventaLocal.fecha || toLocalDateStr()).slice(0, 10),
      hora: ventaLocal.hora || nowHora(),
      metodo_pago: ventaLocal.metodo,
      estado: 'confirmada',
      id_cliente: ventaLocal.id_cliente ?? null,
      // Los ítems "manual-*" (monto libre, sin producto real) van sin id_producto
      // pero con su nombre — antes se filtraban acá y la venta quedaba registrada
      // por menos de lo que en realidad se cobró (el total del ticket sí los suma).
      lineas: (ventaLocal.items || []).map(i => String(i.id).startsWith('manual-')
        ? { nombre: i.nombre, precio_venta: i.precio, cantidad: i.cantidad }
        : { id_producto: i.id, precio_venta: i.precio, cantidad: i.cantidad }),
      // OJO: si se agrega algo nuevo a la venta desde el POS, verificar que
      // también se mande acá — este payload es lo único que el backend ve
      // (ajuste se perdía en el camino y el backend cobraba precio de lista
      // completo, ignorando el descuento que el cajero aplicó en pantalla).
      ajuste: ventaLocal.ajuste ?? null,
      puntos_canjeados: ventaLocal.puntosCanjeados || undefined,
    };

    if (DEMO_MODE) {
      return { ...payload, id: Date.now() };
    }

    try {
      const saved = await crearVentaMutation.mutateAsync(payload);

      // El propio backend ya crea el movimiento de stock de cada línea dentro de
      // la misma transacción de la venta (VentaCreacionService::crear) — acá solo
      // hay que invalidar los caches para que el resto de la UI se actualice.
      //
      // Productos se refetchea activo — el stock nuevo hace falta ya mismo en
      // la grilla del POS. Caja y Movimientos, en cambio, se marcan solo como
      // "obsoletos" (refetchType: 'none', sin forzar el pedido ahora): el
      // servidor PHP embebido (`php artisan serve`) es de un solo hilo, así
      // que forzar 3 refetch simultáneos en cada venta los hace competir por
      // el mismo hilo y se siente como que "la venta tarda". CajaContext está
      // montado en toda la app (por eso igual se actualiza solo, apenas se
      // vuelva a mirar) y Movimientos no se ve en la pantalla del POS.
      queryClient.invalidateQueries({ queryKey: PRODUCTOS_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: CAJA_KEYS.turnoActivo(), refetchType: 'none' });
      queryClient.invalidateQueries({ queryKey: MOVIMIENTOS_KEYS.lists(), refetchType: 'none' });
      if (ventaLocal.metodo === 'fiado') onRecargarFiados?.();

      return saved;
    } catch (e) {
      onError?.('No se pudo registrar la venta', e);
      throw e;
    }
  }, [crearVentaMutation, onError, queryClient, onRecargarFiados]);

  // Venta ya creada por el backend (webhook de Point) — el movimiento de stock
  // también lo crea el backend (VentaCreacionService::crear), acá solo hay que
  // invalidar los caches para que el resto de la UI se actualice.
  const confirmarVentaPoint = useCallback(async (idVenta) => {
    const saved = await ventasService.getById(idVenta);

    queryClient.invalidateQueries({ queryKey: PRODUCTOS_KEYS.lists() });
    queryClient.invalidateQueries({ queryKey: CAJA_KEYS.turnoActivo() });
    queryClient.invalidateQueries({ queryKey: VENTAS_KEYS.lists() });
    queryClient.invalidateQueries({ queryKey: MOVIMIENTOS_KEYS.lists() });

    return saved;
  }, [queryClient]);

  return (
    <VentasCtx.Provider value={{ ventas, isLoading, recargarVentas, registrarVenta, confirmarVentaPoint }}>
      {children}
    </VentasCtx.Provider>
  );
}