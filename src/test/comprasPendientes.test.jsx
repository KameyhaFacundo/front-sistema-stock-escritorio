import { describe, it, expect } from 'vitest';
import { pendientesViejas } from '../utils/comprasPendientes';

const HOY = new Date('2026-06-15T12:00:00');

describe('pendientesViejas', () => {
  it('una compra pendiente de hace 10 días entra en el aviso', () => {
    const compras = [{ estado: 'pendiente', fecha: '2026-06-05' }];
    expect(pendientesViejas(compras, HOY)).toHaveLength(1);
  });

  it('una compra pendiente de hace 3 días NO entra (todavía no pasó la semana)', () => {
    const compras = [{ estado: 'pendiente', fecha: '2026-06-12' }];
    expect(pendientesViejas(compras, HOY)).toHaveLength(0);
  });

  it('una compra confirmada vieja no cuenta, aunque tenga la misma fecha', () => {
    const compras = [{ estado: 'confirmada', fecha: '2026-06-01' }];
    expect(pendientesViejas(compras, HOY)).toHaveLength(0);
  });

  it('una compra cancelada vieja no cuenta', () => {
    const compras = [{ estado: 'cancelada', fecha: '2026-06-01' }];
    expect(pendientesViejas(compras, HOY)).toHaveLength(0);
  });

  it('lista vacía no rompe', () => {
    expect(pendientesViejas([], HOY)).toEqual([]);
  });
});
