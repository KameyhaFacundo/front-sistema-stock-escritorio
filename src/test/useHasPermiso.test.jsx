import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const mockPermisos = ['view-dashboard', 'create-ventas', 'list-productos'];


const mockUseAuth = (overrides = {}) => ({
  myPermisos: mockPermisos,
  user: { is_super_admin: false, ...overrides.user },
  ...overrides,
});

describe('useHasPermiso', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('is_super_admin NO bypasea los permisos normales de la empresa (solo aplica a /super-admin)', async () => {
    vi.doMock('../auth/AuthContextBase', () => ({
      useAuth: () => mockUseAuth({ user: { is_super_admin: true } }),
    }));
    const { default: useHasPermiso } = await import('../hooks/useHasPermiso');
    const { result } = renderHook(() => useHasPermiso());
    expect(result.current.checkPermisos('list-compras')).toBe(false);
  });

  it('un usuario normal solo tiene los permisos que le devolvió el backend', async () => {
    vi.doMock('../auth/AuthContextBase', () => ({
      useAuth: () => mockUseAuth(),
    }));
    const { default: useHasPermiso } = await import('../hooks/useHasPermiso');
    const { result } = renderHook(() => useHasPermiso());
    expect(result.current.checkPermisos('verProductos')).toBe(true);
    expect(result.current.checkPermisos('list-compras')).toBe(false);
  });

  it('un item sin permiso asociado siempre es visible', async () => {
    vi.doMock('../auth/AuthContextBase', () => ({
      useAuth: () => mockUseAuth(),
    }));
    const { default: useHasPermiso } = await import('../hooks/useHasPermiso');
    const { result } = renderHook(() => useHasPermiso());
    expect(result.current.checkPermisos(undefined)).toBe(true);
  });

  it('sin usuario o sin permisos cargados, cualquier permiso con código se niega', async () => {
    vi.doMock('../auth/AuthContextBase', () => ({
      useAuth: () => ({ myPermisos: null, user: null }),
    }));
    const { default: useHasPermiso } = await import('../hooks/useHasPermiso');
    const { result } = renderHook(() => useHasPermiso());
    expect(result.current.checkPermisos('verProductos')).toBe(false);
  });

  it('acepta un código de permiso crudo que no está en el mapa de atajos', async () => {
    vi.doMock('../auth/AuthContextBase', () => ({
      useAuth: () => mockUseAuth(),
    }));
    const { default: useHasPermiso } = await import('../hooks/useHasPermiso');
    const { result } = renderHook(() => useHasPermiso());
    expect(result.current.checkPermisos('list-productos')).toBe(true);
    expect(result.current.checkPermisos('list-usuarios')).toBe(false);
  });

  it('los códigos dedicados de Caja y Movimientos se distinguen de los de Ventas/Compras', async () => {
    vi.doMock('../auth/AuthContextBase', () => ({
      useAuth: () => mockUseAuth({
        myPermisos: ['list-caja', 'list-historial-caja', 'create-movimientos'],
      }),
    }));
    const { default: useHasPermiso } = await import('../hooks/useHasPermiso');
    const { result } = renderHook(() => useHasPermiso());
    expect(result.current.checkPermisos('verCaja')).toBe(true);
    expect(result.current.checkPermisos('verHistorialCaja')).toBe(true);
    expect(result.current.checkPermisos('gestionarMovimientos')).toBe(true);
    // No deben confundirse con permisos de ventas/compras aunque compartan el prefijo create-/list-
    expect(result.current.checkPermisos('gestionarVentas')).toBe(false);
    expect(result.current.checkPermisos('verMovimientos')).toBe(false);
    expect(result.current.checkPermisos('gestionarCaja')).toBe(false);
  });

  it('tieneAlguno es true si al menos uno de los permisos pedidos está presente', async () => {
    vi.doMock('../auth/AuthContextBase', () => ({
      useAuth: () => mockUseAuth(),
    }));
    const { default: useHasPermiso } = await import('../hooks/useHasPermiso');
    const { result } = renderHook(() => useHasPermiso());
    expect(result.current.tieneAlguno('verUsuarios', 'verProductos')).toBe(true);
    expect(result.current.tieneAlguno('verUsuarios', 'verCompras')).toBe(false);
  });
});
