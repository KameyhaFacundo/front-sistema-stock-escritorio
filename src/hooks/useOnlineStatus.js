import { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;
const PING_INTERVAL_MS = 20000;

/**
 * navigator.onLine solo dice si el dispositivo tiene una interfaz de red
 * activa — un wifi conectado pero sin salida a internet real (o con el
 * backend caído) sigue reportando "online". Por eso, además del evento
 * nativo, hacemos un ping liviano y periódico a la propia API para
 * confirmar que el servidor realmente responde.
 */
export default function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    let cancelado = false;

    const chequearBackend = async () => {
      try {
        await axios.get(`${API_URL}health`, { timeout: 5000 });
        if (!cancelado) setOnline(true);
      } catch {
        if (!cancelado) setOnline(false);
      }
    };

    const handleOnline = () => chequearBackend();
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    chequearBackend();
    const interval = setInterval(chequearBackend, PING_INTERVAL_MS);

    return () => {
      cancelado = true;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return online;
}
