import { useEffect, useRef, useState } from 'react';

// Mide el ancho real (en px) del elemento referenciado — a diferencia de
// useMediaQuery/breakpoints (que miran el viewport completo), esto reacciona
// al espacio que el contenedor tiene de verdad, sin importar sidebar
// colapsado/expandido, zoom de la página, etc. Pensado para tablas anchas
// que necesitan pasar a un layout de tarjetas cuando no entran, no solo en
// pantallas de celular (ver Productos.jsx).
export default function useContainerWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, width];
}
