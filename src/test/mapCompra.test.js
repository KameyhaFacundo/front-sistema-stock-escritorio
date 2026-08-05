import { describe, it, expect } from 'vitest';
import { mapCompra } from '../services/comprasService';

describe('mapCompra', () => {
  it('mapea una compra completa', () => {
    const raw = {
      id: 1,
      proveedor: { persona: 'Proveedor SA' },
      id_proveedor: 5,
      fecha: '2026-06-15',
      monto_total: '15000.00',
      estado: 'recibida',
      metodo_pago: 'transferencia',
      usuario: { des_usu: 'Admin' },
      usuario_anulacion: { des_usu: 'Super' },
      fecha_anulacion: '2026-06-16',
      lineas: [],
      devoluciones: [],
    };

    const result = mapCompra(raw);

    expect(result.id).toBe(1);
    expect(result.proveedor).toBe('Proveedor SA');
    expect(result.id_proveedor).toBe(5);
    expect(result.fecha).toBe('2026-06-15');
    expect(result.total).toBe(15000);
    expect(result.estado).toBe('recibida');
    expect(result.metodo_pago).toBe('transferencia');
    expect(result.usuario).toBe('Admin');
    expect(result.anuladoPor).toBe('Super');
    expect(result.fechaAnulacion).toBe('2026-06-16');
  });

  it('valores por defecto', () => {
    const result = mapCompra({ id: 1 });
    expect(result.proveedor).toBe('Sin proveedor');
    expect(result.fecha).toBe('');
    expect(result.total).toBe(0);
    expect(result.estado).toBe('pendiente');
    expect(result.metodo_pago).toBe('efectivo');
    expect(result.usuario).toBeNull();
    expect(result.anuladoPor).toBeNull();
    expect(result.fechaAnulacion).toBeNull();
  });

  it('mapea líneas de compra con precio de compra y venta', () => {
    const raw = {
      id: 1,
      lineas: [
        {
          id_linea: 1,
          id_producto: 10,
          producto: { producto: 'Zapatillas' },
          cantidad: 5,
          precio_compra: '2000.00',
          precio_venta: '3500.00',
        },
      ],
      devoluciones: [],
    };

    const result = mapCompra(raw);
    expect(result.lineas).toHaveLength(1);
    expect(result.lineas[0]).toMatchObject({
      id: 1,
      id_producto: 10,
      nombre: 'Zapatillas',
      cantidad: 5,
      precio_compra: 2000,
      precio_venta: 3500,
      subtotal: 10000,
      cantidadDevuelta: 0,
      disponibleDevolver: 5,
    });
  });

  it('calcula devoluciones parciales', () => {
    const raw = {
      id: 1,
      lineas: [
        { id_linea: 1, id_producto: 10, producto: { producto: 'X' }, cantidad: 10, precio_compra: '100' },
      ],
      devoluciones: [
        { lineas: [{ id_linea_compra: 1, cantidad: '3' }] },
      ],
    };

    const result = mapCompra(raw);
    expect(result.lineas[0].cantidadDevuelta).toBe(3);
    expect(result.lineas[0].disponibleDevolver).toBe(7);
  });

  it('precio_venta puede ser null (no seteado)', () => {
    const raw = {
      id: 1,
      lineas: [
        { id_linea: 1, id_producto: 10, producto: { producto: 'X' }, cantidad: 1, precio_compra: '500', precio_venta: null },
      ],
      devoluciones: [],
    };
    const result = mapCompra(raw);
    expect(result.lineas[0].precio_venta).toBeNull();
  });

  it('no revienta si proveedor o usuario son null', () => {
    const result = mapCompra({ id: 1, proveedor: null, usuario: null });
    expect(result.proveedor).toBe('Sin proveedor');
    expect(result.usuario).toBeNull();
  });
});
