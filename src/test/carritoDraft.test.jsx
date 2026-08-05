import { describe, it, expect, beforeEach } from 'vitest';
import { guardarCarritoDraft, leerCarritoDraft } from '../utils/carritoDraft';

const ITEM = { id: 1, nombre: 'Coca-Cola', precio: 110, cantidad: 2 };

describe('carritoDraft (borrador del carrito del POS)', () => {
  beforeEach(() => localStorage.clear());

  it('guarda y recupera un carrito con items', () => {
    guardarCarritoDraft([ITEM]);
    expect(leerCarritoDraft()).toEqual([ITEM]);
  });

  it('un carrito vacío no deja nada guardado', () => {
    guardarCarritoDraft([ITEM]);
    guardarCarritoDraft([]);
    expect(leerCarritoDraft()).toEqual([]);
  });

  it('sin nada guardado, devuelve carrito vacío', () => {
    expect(leerCarritoDraft()).toEqual([]);
  });

  it('descarta un borrador de más de 2 horas', () => {
    const haceRato = Date.now() - 3 * 60 * 60 * 1000;
    localStorage.setItem('pos_carrito_borrador', JSON.stringify({ cart: [ITEM], ts: haceRato }));
    expect(leerCarritoDraft()).toEqual([]);
  });

  it('ignora un valor corrupto en localStorage', () => {
    localStorage.setItem('pos_carrito_borrador', '{no es json');
    expect(leerCarritoDraft()).toEqual([]);
  });
});
