import { describe, it, expect } from 'vitest';
import { getVencimientoBadge } from '../utils/vencimiento';

const HOY = new Date(2026, 5, 15); // 15/06/2026, hora local — evita el bug de parseo UTC

describe('getVencimientoBadge', () => {
  it('sin fecha, no muestra badge', () => {
    expect(getVencimientoBadge(null, HOY)).toEqual([null, null]);
    expect(getVencimientoBadge('', HOY)).toEqual([null, null]);
  });

  it('fecha pasada: Vencido', () => {
    const [label, color] = getVencimientoBadge('2026-06-10', HOY);
    expect(label).toBe('Vencido');
    expect(color).toBe('#ef4444');
  });

  it('vence hoy: 0 días, no negativo', () => {
    const [label] = getVencimientoBadge('2026-06-15', HOY);
    expect(label).toBe('Vence en 0d');
  });

  it('vence dentro de 7 días: naranja fuerte', () => {
    const [label, color] = getVencimientoBadge('2026-06-20', HOY);
    expect(label).toBe('Vence en 5d');
    expect(color).toBe('#f97316');
  });

  it('vence entre 8 y 30 días: amarillo', () => {
    const [label, color] = getVencimientoBadge('2026-07-10', HOY);
    expect(label).toBe('Vence en 25d');
    expect(color).toBe('#f59e0b');
  });

  it('vence en más de 30 días: sin badge', () => {
    expect(getVencimientoBadge('2026-12-01', HOY)).toEqual([null, null]);
  });

  it('no se corre un día por interpretar la fecha como UTC', () => {
    // Antes de este fix, `new Date('2026-06-16')` se interpretaba como UTC y en
    // husos horarios negativos (América) caía como el 15 a la noche local,
    // haciendo que un producto que vence mañana pareciera vencer hoy.
    const [label] = getVencimientoBadge('2026-06-16', HOY);
    expect(label).toBe('Vence en 1d');
  });
});
