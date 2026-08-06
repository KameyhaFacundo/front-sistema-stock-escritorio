import { useEffect, useState } from 'react';

// window.electronAPI solo existe en la app de escritorio empaquetada (ver
// escritorio-launcher/electron/preload.js) — en `pnpm dev`, demo mode, o el
// acceso por navegador de una segunda PC, queda undefined y esto no hace nada.
export default function useAppUpdateStatus() {
  const [updateDisponible, setUpdateDisponible] = useState(false);

  useEffect(() => {
    if (!window.electronAPI?.onUpdateListo) return;
    window.electronAPI.onUpdateListo(() => setUpdateDisponible(true));
  }, []);

  return updateDisponible;
}
