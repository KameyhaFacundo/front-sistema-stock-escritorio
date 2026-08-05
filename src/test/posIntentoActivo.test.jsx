import { describe, it, expect, beforeEach, vi } from 'vitest';
import { guardarIntentoActivo, leerIntentoActivo, limpiarIntentoActivo } from '../utils/posIntentoActivo';

describe('persistencia del intento de cobro Point/QR (sobrevive a un F5)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  it('guarda y recupera un intento reciente con su timestamp', () => {
    guardarIntentoActivo({ tipo: 'point', id: 'abc123', monto: 1500 });
    const leido = leerIntentoActivo();
    expect(leido).toMatchObject({ tipo: 'point', id: 'abc123', monto: 1500 });
    expect(typeof leido.ts).toBe('number');
  });

  it('devuelve null si no hay ningún intento guardado', () => {
    expect(leerIntentoActivo()).toBeNull();
  });

  it('descarta y borra un intento más viejo que 20 minutos', () => {
    const haceRato = Date.now() - 21 * 60 * 1000;
    localStorage.setItem('pos_intento_pendiente', JSON.stringify({ tipo: 'qr', id: 'viejo', ts: haceRato }));
    expect(leerIntentoActivo()).toBeNull();
    expect(localStorage.getItem('pos_intento_pendiente')).toBeNull();
  });

  it('conserva un intento de casi 20 minutos (todavía no vencido)', () => {
    const casiVencido = Date.now() - 19 * 60 * 1000;
    localStorage.setItem('pos_intento_pendiente', JSON.stringify({ tipo: 'qr', id: 'reciente', ts: casiVencido }));
    expect(leerIntentoActivo()).toMatchObject({ tipo: 'qr', id: 'reciente' });
  });

  it('limpiarIntentoActivo borra el intento guardado', () => {
    guardarIntentoActivo({ tipo: 'point', id: 'x' });
    limpiarIntentoActivo();
    expect(leerIntentoActivo()).toBeNull();
  });

  it('ignora un valor corrupto en localStorage en lugar de romper', () => {
    localStorage.setItem('pos_intento_pendiente', '{no es json válido');
    expect(leerIntentoActivo()).toBeNull();
  });
});
