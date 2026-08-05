import { useQuery } from '@tanstack/react-query';
import { getFacturas, getFactura } from '../../services/arcaService';

export const FACTURAS_KEYS = {
  all: ['facturas'],
  lists: () => [...FACTURAS_KEYS.all, 'list'],
  list: (params) => [...FACTURAS_KEYS.lists(), params],
  details: () => [...FACTURAS_KEYS.all, 'detail'],
  detail: (id) => [...FACTURAS_KEYS.details(), id],
};

export function useFacturas(params = {}, options = {}) {
  return useQuery({
    queryKey: FACTURAS_KEYS.list(params),
    queryFn: () => getFacturas(params),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 15,
    ...options,
  });
}

export function useFactura(id, options = {}) {
  return useQuery({
    queryKey: FACTURAS_KEYS.detail(id),
    queryFn: () => getFactura(id),
    enabled: !!id,
    ...options,
  });
}
