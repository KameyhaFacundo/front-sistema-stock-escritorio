import { describe, it, expect } from 'vitest';
import { agruparPorProducto } from '../utils/movimientosResumen';

describe('agruparPorProducto', () => {
  it('lista vacía da un resumen vacío', () => {
    expect(agruparPorProducto([])).toEqual([]);
  });

  it('separa entradas (cantidad positiva) de salidas (cantidad negativa) por producto', () => {
    const movimientos = [
      { codigo: 'A1', producto: 'Fideos', cantidad: 10 },
      { codigo: 'A1', producto: 'Fideos', cantidad: -3 },
      { codigo: 'A1', producto: 'Fideos', cantidad: 5 },
    ];
    const [resumen] = agruparPorProducto(movimientos);
    expect(resumen).toMatchObject({ codigo: 'A1', producto: 'Fideos', entradas: 15, salidas: -3 });
  });

  it('agrupa por código, no por nombre (evita romper si dos productos comparten nombre)', () => {
    const movimientos = [
      { codigo: 'A1', producto: 'Fideos', cantidad: 10 },
      { codigo: 'A2', producto: 'Fideos', cantidad: 4 },
    ];
    const resumen = agruparPorProducto(movimientos);
    expect(resumen).toHaveLength(2);
  });

  it('un producto sin movimientos de salida queda con salidas en 0', () => {
    const [resumen] = agruparPorProducto([{ codigo: 'B2', producto: 'Arroz', cantidad: 8 }]);
    expect(resumen.entradas).toBe(8);
    expect(resumen.salidas).toBe(0);
  });
});
