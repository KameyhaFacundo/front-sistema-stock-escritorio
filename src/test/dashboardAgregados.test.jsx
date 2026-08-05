import { describe, it, expect } from 'vitest';
import { metodoMasUsado } from '../utils/dashboardAgregados';

const LABELS = { efectivo: 'Efectivo', tarjeta: 'Tarjeta', qr: 'QR' };

describe('metodoMasUsado', () => {
  it('sin ventas, devuelve el estado vacío', () => {
    expect(metodoMasUsado([], LABELS, 0)).toEqual({ nombre: '—', pct: '' });
  });

  it('elige el método con más ventas', () => {
    const ventas = [{ metodo: 'efectivo' }, { metodo: 'efectivo' }, { metodo: 'tarjeta' }];
    const { nombre } = metodoMasUsado(ventas, LABELS, 3);
    expect(nombre).toBe('Efectivo');
  });

  it('calcula el porcentaje redondeado sobre el total de ventas', () => {
    const ventas = [{ metodo: 'efectivo' }, { metodo: 'efectivo' }, { metodo: 'tarjeta' }];
    const { pct } = metodoMasUsado(ventas, LABELS, 3);
    expect(pct).toBe('67% de las ventas');
  });

  it('un método sin label conocido cae a su código crudo', () => {
    const ventas = [{ metodo: 'transferencia' }];
    const { nombre } = metodoMasUsado(ventas, LABELS, 1);
    expect(nombre).toBe('transferencia');
  });

  it('una venta sin método cae en "Otro"', () => {
    const ventas = [{ metodo: null }];
    const { nombre } = metodoMasUsado(ventas, LABELS, 1);
    expect(nombre).toBe('Otro');
  });
});
