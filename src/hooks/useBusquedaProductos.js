import { useState, useEffect, useRef } from 'react';
import { productosService } from '../services/productosService';
import { DEMO_MODE } from '../auth/demoMode';
import { DEMO_PRODUCTOS } from '../auth/demoData';

/**
 * Búsqueda de productos contra el backend, debounced — reemplaza el patrón
 * de "cargar los primeros 500 productos en memoria y filtrar del lado del
 * cliente" (ProductosContext) en cualquier buscador tipo autocomplete/
 * dropdown. Con un catálogo de miles de productos, ese array local nunca
 * tiene todo — esto pide exactamente lo que hace falta en cada tipeo.
 *
 * Mismo patrón que ya usaba Etiquetas.jsx a mano (debounce con setTimeout +
 * un id incremental para ignorar respuestas que llegan fuera de orden),
 * ahora reutilizable.
 */
export default function useBusquedaProductos(query, { perPage = 20, params = {}, enabled = true, delayMs = 300 } = {}) {
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const searchIdRef = useRef(0);
  // Los callers suelen pasar `params` como objeto literal en cada render —
  // serializar es más barato que forzar a memoizarlo en cada lugar que use
  // el hook, y sigue disparando el efecto solo cuando el CONTENIDO cambia.
  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    const q = (query || '').trim();
    if (!enabled || !q) {
      setResultados([]);
      setBuscando(false);
      return;
    }

    // Modo demo: no hay backend real corriendo — filtra el puñado de
    // productos de muestra en el cliente en vez de pegarle a la API.
    if (DEMO_MODE) {
      const ql = q.toLowerCase();
      setResultados(DEMO_PRODUCTOS.filter(p =>
        p.nombre.toLowerCase().includes(ql) || (p.codigo || '').toLowerCase().includes(ql)
      ).slice(0, perPage));
      setBuscando(false);
      return;
    }

    const id = ++searchIdRef.current;
    setBuscando(true);
    const timer = setTimeout(async () => {
      try {
        const data = await productosService.getAll({ search: q, per_page: perPage, ...JSON.parse(paramsKey) });
        if (id === searchIdRef.current) setResultados(data);
      } catch {
        if (id === searchIdRef.current) setResultados([]);
      } finally {
        if (id === searchIdRef.current) setBuscando(false);
      }
    }, delayMs);

    return () => clearTimeout(timer);
  }, [query, enabled, perPage, paramsKey, delayMs]);

  return { resultados, buscando };
}
