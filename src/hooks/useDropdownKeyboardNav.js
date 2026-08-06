import { useEffect, useRef, useState } from 'react';

// Navegación con flecha arriba/abajo + Enter para los buscadores con lista
// flotante de resultados (producto/cliente) — mismo comportamiento en todos
// los buscadores de la app, sin duplicar la lógica en cada pantalla.
// El resaltado arranca en el primer resultado y se reinicia cada vez que
// cambia el conjunto de resultados (comparando ids, no la referencia del
// array — la mayoría de las pantallas recalculan `items` en cada render).
// `highlightedRef` va en el elemento resaltado (solo en ese, condicionalmente)
// para que el scroll lo siga automáticamente al navegar con las flechas.
export default function useDropdownKeyboardNav(items, onSelect) {
  const idsKey = items.map(i => i.id).join('|');
  const [highlightIdx, setHighlightIdx] = useState(items.length ? 0 : -1);
  const highlightedRef = useRef(null);

  useEffect(() => {
    setHighlightIdx(items.length ? 0 : -1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  useEffect(() => {
    highlightedRef.current?.scrollIntoView({ block: 'nearest' });
  }, [highlightIdx]);

  const onKeyDown = (e) => {
    if (!items.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx(i => (i + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx(i => (i - 1 + items.length) % items.length);
    } else if (e.key === 'Enter') {
      if (highlightIdx < 0 || highlightIdx >= items.length) return;
      e.preventDefault();
      onSelect(items[highlightIdx]);
    }
  };

  return { highlightIdx, onKeyDown, highlightedRef };
}
