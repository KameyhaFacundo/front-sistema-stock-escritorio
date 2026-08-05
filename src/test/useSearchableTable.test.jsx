import { describe, it, expect } from 'vitest';
import useSearchableTable from '../hooks/useSearchableTable';
import { renderHook, act } from '@testing-library/react';

describe('useSearchableTable', () => {
  const items = [
    { id: 1, nombre: 'Laptop',   stock: 5,  precio: 1000 },
    { id: 2, nombre: 'Mouse',    stock: 20, precio: 25 },
    { id: 3, nombre: 'Teclado',  stock: 15, precio: 50 },
    { id: 4, nombre: 'Monitor',  stock: 3,  precio: 300 },
  ];

  it('devuelve todos los items sin filtro', () => {
    const { result } = renderHook(() => useSearchableTable(items));
    expect(result.current.filtered).toHaveLength(4);
    expect(result.current.paged).toHaveLength(4);
  });

  it('filtra por campo de búsqueda', () => {
    const { result } = renderHook(() =>
      useSearchableTable(items, { searchFields: ['nombre'] })
    );
    act(() => result.current.setSearch('lap'));
    expect(result.current.filtered).toHaveLength(1);
    expect(result.current.filtered[0].nombre).toBe('Laptop');
  });

  it('pagina correctamente', () => {
    const { result } = renderHook(() =>
      useSearchableTable(items, { defaultPageSize: 2 })
    );
    expect(result.current.paged).toHaveLength(2);
    expect(result.current.totalPages).toBe(2);
    act(() => result.current.setPagina(2));
    expect(result.current.paged).toHaveLength(2);
  });

  it('ordena ascendentemente', () => {
    const { result } = renderHook(() => useSearchableTable(items));
    act(() => result.current.toggleSort('precio'));
    expect(result.current.paged[0].precio).toBe(25);
    expect(result.current.paged[3].precio).toBe(1000);
  });

  it('ordena descendentemente', () => {
    const { result } = renderHook(() => useSearchableTable(items));
    act(() => result.current.toggleSort('precio'));
    act(() => result.current.toggleSort('precio'));
    expect(result.current.paged[0].precio).toBe(1000);
  });
});
