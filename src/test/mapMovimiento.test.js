import { describe, it, expect } from 'vitest';
import { mapMovimiento } from '../services/movimientosService';

describe('mapMovimiento', () => {
  it('mapea un movimiento completo del backend', () => {
    const raw = {
      id: 1,
      fecha: '2026-06-15',
      hora: '14:30',
      producto: 'Zapatillas',
      codigo: 'ZAP-001',
      tipo: 'salida',
      sub_tipo: 'venta',
      cantidad: '3.00',
      nota: 'Venta mostrador',
      usuario: { des_usu: 'Juan' },
      sucursal: { nombre: 'Central' },
    };

    const result = mapMovimiento(raw);

    expect(result).toEqual({
      id: 1,
      fecha: '2026-06-15',
      hora: '14:30',
      producto: 'Zapatillas',
      codigo: 'ZAP-001',
      tipo: 'salida',
      subTipo: 'venta',
      cantidad: 3,
      nota: 'Venta mostrador',
      usuario: 'Juan',
      sucursal: 'Central',
    });
  });

  it('convierte cantidad decimal string a Number', () => {
    expect(mapMovimiento({ cantidad: '2.50' }).cantidad).toBe(2.5);
    expect(mapMovimiento({ cantidad: '0' }).cantidad).toBe(0);
  });

  it('usa valores por defecto para campos ausentes', () => {
    const result = mapMovimiento({ id: 1, tipo: 'entrada' });
    expect(result.hora).toBe('');
    expect(result.codigo).toBe('');
    expect(result.subTipo).toBe('');
    expect(result.nota).toBe('');
    expect(result.cantidad).toBe(0);
    expect(result.usuario).toBeNull();
    expect(result.sucursal).toBeNull();
  });

  it('no revienta si usuario o sucursal son null', () => {
    const result = mapMovimiento({ id: 1, tipo: 'ajuste', usuario: null, sucursal: null });
    expect(result.usuario).toBeNull();
    expect(result.sucursal).toBeNull();
  });
});
