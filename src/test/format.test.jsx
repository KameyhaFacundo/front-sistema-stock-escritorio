import { describe, it, expect } from 'vitest';
import { fmtMoney, fmtDate, fmtTime, fmtDayLabel, fmtInputDate } from '../utils/format';

describe('fmtMoney', () => {
  it('formatea con separador de miles y 2 decimales, estilo es-AR', () => {
    expect(fmtMoney(1234.5)).toBe('$ 1.234,50');
  });

  it('formatea cero y negativos', () => {
    expect(fmtMoney(0)).toBe('$ 0,00');
    expect(fmtMoney(-500)).toBe('$ -500,00');
  });
});

describe('fmtDate — no debe correr un día para atrás por UTC/local', () => {
  it('una fecha "pura" (YYYY-MM-DD) muestra el mismo día, no el anterior', () => {
    // Este es exactamente el bug que corrigió el commit de "pricing/date fixes":
    // `new Date('2026-06-04')` se interpreta en UTC y en Argentina (UTC-3) cae
    // como 3 de junio a las 21:00 local, mostrando un día equivocado.
    expect(fmtDate('2026-06-04')).toBe('04/06/2026');
  });

  it('respeta un timestamp completo (con hora) tal cual viene', () => {
    expect(fmtDate('2026-06-04T23:30:00-03:00')).toBe('04/06/2026');
  });

  it('devuelve string vacío si no hay fecha', () => {
    expect(fmtDate(null)).toBe('');
    expect(fmtDate(undefined)).toBe('');
    expect(fmtDate('')).toBe('');
  });
});

describe('fmtTime', () => {
  it('formatea hora:minuto de un timestamp ISO', () => {
    const t = fmtTime('2026-06-04T14:05:00Z');
    expect(t).toMatch(/\d{1,2}:\d{2}/);
  });

  it('devuelve string vacío si no hay valor', () => {
    expect(fmtTime(null)).toBe('');
  });
});

describe('fmtDayLabel', () => {
  it('capitaliza cada palabra del día largo en español', () => {
    const label = fmtDayLabel('2026-06-04');
    expect(label).toMatch(/^[A-ZÁÉÍÓÚ]/);
    expect(label).not.toMatch(/\bde\b/); // "de" quedó capitalizado como "De"
    expect(label).toContain('De');
  });

  it('devuelve string vacío ante una fecha inválida', () => {
    expect(fmtDayLabel('no-es-una-fecha')).toBe('');
  });
});

describe('fmtInputDate', () => {
  it('convierte un objeto Date a formato YYYY-MM-DD en hora LOCAL, no UTC', () => {
    // 23:30 hora local — con la versión vieja (toISOString().split('T')[0]),
    // en cualquier huso con offset negativo (ej. Argentina, UTC-3) esto se
    // convertía a UTC y caía al día siguiente. Sin pasar por UTC, siempre
    // tiene que devolver el mismo día calendario con el que se construyó.
    const d = new Date(2026, 5, 4, 23, 30);
    expect(fmtInputDate(d)).toBe('2026-06-04');
  });

  it('una fecha "YYYY-MM-DD" ya formateada se devuelve tal cual, sin pasar por Date', () => {
    expect(fmtInputDate('2026-06-04')).toBe('2026-06-04');
  });

  it('devuelve string vacío si no hay valor', () => {
    expect(fmtInputDate(null)).toBe('');
    expect(fmtInputDate(undefined)).toBe('');
  });
});
