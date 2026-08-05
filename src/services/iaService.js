import api from '../api/client';

/**
 * Sugiere un precio de venta basado en el costo y nombre del producto usando IA.
 */
export async function sugerirPrecio(nombre, costo, categoria = null) {
  const { data } = await api.post('ia/sugerencias', {
    accion: 'precio',
    nombre,
    costo,
    categoria,
  });
  return data.data?.precio_sugerido ?? null;
}

/**
 * Sugiere una categoría basada en el nombre del producto.
 */
export async function sugerirCategoria(nombre) {
  const { data } = await api.post('ia/sugerencias', {
    accion: 'categoria',
    nombre,
  });
  return data.data?.categoria_sugerida ?? null;
}

const iaService = { sugerirPrecio, sugerirCategoria };
export default iaService;
