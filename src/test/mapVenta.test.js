import { describe, it, expect } from 'vitest';
import { mapVenta } from '../services/ventasService';

describe('mapVenta', () => {
  it('mapea una venta simple', () => {
    const raw = {
      id: 1,
      numero_ticket: 'VTA-001',
      fecha: '2026-06-15T14:30:00',
      hora: '14:30',
      monto_total: '3500.00',
      metodo_pago: 'efectivo',
      estado: 'confirmada',
      id_cliente: null,
      cliente: null,
      usuario: { des_usu: 'Juan' },
      lineas: [],
      pagos: [],
      devoluciones: [],
    };

    const result = mapVenta(raw);

    expect(result.id).toBe(1);
    expect(result.ticketId).toBe('VTA-001');
    expect(result.fecha).toBe('2026-06-15');
    expect(result.hora).toBe('14:30');
    expect(result.total).toBe(3500);
    expect(result.metodo).toBe('efectivo');
    expect(result.estado).toBe('confirmada');
    expect(result.cliente).toBe('Consumidor Final');
    expect(result.id_cliente).toBeNull();
    expect(result.usuario).toBe('Juan');
  });

  it('genera ticketId por defecto si no viene numero_ticket', () => {
    const result = mapVenta({ id: 42 });
    expect(result.ticketId).toBe('VTA-42');
  });

  it('mapea líneas de venta con precio y subtotal', () => {
    const raw = {
      id: 1,
      lineas: [
        {
          id_linea: 1,
          id_producto: 10,
          producto: { producto: 'Zapatillas', categoria: { categoria: 'Calzado' }, costo: '2000', unidad_medida: 'unidad' },
          cantidad: 2,
          precio_venta: '3500.00',
        },
        {
          id_linea: 2,
          id_producto: null,
          nombre: 'Gift card',
          cantidad: 1,
          precio_venta: '1000.00',
        },
      ],
      devoluciones: [],
    };

    const result = mapVenta(raw);

    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toMatchObject({
      id: 1,
      idProducto: 10,
      nombre: 'Zapatillas',
      categoria: 'Calzado',
      cantidad: 2,
      precio: 3500,
      costo: 2000,
      subtotal: 7000,
      cantidadDevuelta: 0,
      disponibleDevolver: 2,
    });

    // Línea sin producto (monto libre)
    expect(result.items[1]).toMatchObject({
      id: 2,
      idProducto: null,
      nombre: 'Gift card',
      cantidad: 1,
      precio: 1000,
      subtotal: 1000,
    });
  });

  it('calcula cantidadDevuelta y disponibleDevolver correctamente', () => {
    const raw = {
      id: 1,
      lineas: [
        { id_linea: 1, id_producto: 10, producto: { producto: 'X' }, cantidad: 5, precio_venta: '100' },
      ],
      devoluciones: [
        { lineas: [{ id_linea_venta: 1, cantidad: '2' }] },
        { lineas: [{ id_linea_venta: 1, cantidad: '1' }] },
      ],
    };

    const result = mapVenta(raw);
    expect(result.items[0].cantidadDevuelta).toBe(3);
    expect(result.items[0].disponibleDevolver).toBe(2);
  });

  it('construye pagos desde el array o desde metodo/monto', () => {
    const conPagos = mapVenta({
      id: 1,
      monto_total: '3000',
      metodo_pago: 'efectivo',
      pagos: [
        { metodo: 'efectivo', monto: '2000' },
        { metodo: 'tarjeta', monto: '1000' },
      ],
    });
    expect(conPagos.pagos).toEqual([
      { metodo: 'efectivo', monto: 2000 },
      { metodo: 'tarjeta', monto: 1000 },
    ]);

    const sinPagos = mapVenta({ id: 1, monto_total: '1500', metodo_pago: 'transferencia' });
    expect(sinPagos.pagos).toEqual([{ metodo: 'transferencia', monto: 1500 }]);
  });

  it('factura es null si no viene', () => {
    expect(mapVenta({ id: 1 }).factura).toBeNull();
  });

  it('mapea datos de factura cuando existe', () => {
    const result = mapVenta({
      id: 1,
      factura: {
        id: 5,
        numero_completo: '0001-00000001',
        tipo_comprobante: 'FACTURA A',
        cae: '12345678901234',
        total: '3500.00',
        estado: 'emitida',
      },
    });

    expect(result.factura).toEqual({
      id: 5,
      numeroCompleto: '0001-00000001',
      tipoComprobante: 'FACTURA A',
      cae: '12345678901234',
      total: 3500,
      estado: 'emitida',
    });
  });
});
