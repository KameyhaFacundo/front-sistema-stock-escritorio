import { describe, it, expect } from 'vitest';
import { mapProducto } from '../services/productosService';

describe('mapProducto', () => {
  it('mapea un producto simple completo', () => {
    const raw = {
      id: 1,
      producto: 'Remera',
      codigo: 'REM-001',
      categoria: { categoria: 'Indumentaria', id: 1 },
      id_categoria: 1,
      estado: true,
      stock_disponible: 15,
      stock: 15,
      stock_total: 20,
      stock_minimo: 5,
      id_proveedor: 2,
      proveedor: { persona: 'Proveedor SA' },
      precio: '2500.00',
      costo: '1500.00',
      fecha_vencimiento: null,
      es_combo: false,
      unidad_medida: 'unidad',
      imagen_url: '/img/remera.jpg',
      componentes: [],
      tiene_variantes: false,
      id_grupo_talle: null,
      grupo_talle: null,
      id_talle: null,
      talle: null,
      variantes: [],
    };

    const result = mapProducto(raw);

    expect(result.id).toBe(1);
    expect(result.nombre).toBe('Remera');
    expect(result.codigo).toBe('REM-001');
    expect(result.categoria).toBe('Indumentaria');
    expect(result.activo).toBe(true);
    expect(result.stock).toBe(15);
    expect(result.alerta).toBe(5);
    expect(result.precioFinal).toBe(2500);
    expect(result.costo).toBe(1500);
    expect(result.proveedor).toBe('Proveedor SA');
    expect(result.esCombo).toBe(false);
    expect(result.imagenUrl).toBe('/img/remera.jpg');
  });

  it('genera código por defecto si no viene', () => {
    const result = mapProducto({ id: 42, producto: 'Test' });
    expect(result.codigo).toBe('PROD-42');
  });

  it('valores por defecto para campos ausentes', () => {
    const result = mapProducto({ id: 99, producto: 'X' });
    expect(result.categoria).toBe('Sin categoría');
    expect(result.stock).toBe(0);
    expect(result.alerta).toBe(5);
    expect(result.precioFinal).toBe(0);
    expect(result.costo).toBe(0);
    expect(result.activo).toBe(true);
    expect(result.proveedor).toBeNull();
    expect(result.fechaVencimiento).toBeNull();
    expect(result.unidadMedida).toBe('unidad');
    expect(result.imagenUrl).toBeNull();
  });

  it('parsea precios como float', () => {
    const result = mapProducto({ id: 1, producto: 'X', precio: '3499.99', costo: '2000.50' });
    expect(result.precioFinal).toBe(3499.99);
    expect(result.costo).toBe(2000.5);
  });

  it('mapea componentes de combo', () => {
    const raw = {
      id: 1,
      producto: 'Combo',
      es_combo: true,
      componentes: [
        { id_producto: 2, cantidad: 1, producto: { producto: 'Item A', codigo: 'A-1', costo: '100.00', precio: '150.00' } },
        { id_producto: 3, cantidad: 2, producto: { producto: 'Item B', codigo: 'B-2', costo: '50.00', precio: '80.00' } },
      ],
    };
    const result = mapProducto(raw);
    expect(result.esCombo).toBe(true);
    expect(result.componentes).toHaveLength(2);
    expect(result.componentes[0]).toEqual({ id_producto: 2, cantidad: 1, nombre: 'Item A', codigo: 'A-1', costo: 100, precioFinal: 150 });
  });

  it('mapea variantes de talle', () => {
    const raw = {
      id: 1,
      producto: 'Remera',
      tiene_variantes: true,
      id_grupo_talle: 1,
      grupo_talle: { nombre: 'Talles' },
      variantes: [
        { id: 10, codigo: 'REM-S', id_talle: 1, talle: 'S', orden_talle: 1, cantidad_curva: '20', stock: 5, stock_minimo: 2 },
      ],
    };
    const result = mapProducto(raw);
    expect(result.tieneVariantes).toBe(true);
    expect(result.variantes).toHaveLength(1);
    expect(result.variantes[0]).toEqual({
      id: 10, codigo: 'REM-S', codigoBarras: '', idTalle: 1, talle: 'S', ordenTalle: 1,
      cantidadCurva: '20', stock: 5, alerta: 2,
    });
  });

  it('el estado por defecto es true', () => {
    expect(mapProducto({ id: 1, producto: 'X', estado: false }).activo).toBe(false);
  });

  it('stock_disponible tiene prioridad sobre stock', () => {
    const result = mapProducto({ id: 1, producto: 'X', stock_disponible: 8, stock: 12, stock_total: 15 });
    expect(result.stock).toBe(8);
    expect(result.stockPropio).toBe(12);
    expect(result.stockTotal).toBe(15);
  });
});
