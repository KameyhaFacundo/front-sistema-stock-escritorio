import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;
const PING_INTERVAL_MS = 20000;
// El servidor local (php artisan serve) es de un solo hilo — un import
// grande o cualquier otra tarea pesada lo puede dejar sin margen para
// contestar ESTE ping puntual a tiempo, sin que el servidor esté caído de
// verdad. Recién a la segunda falla seguida (40s reales sin respuesta) se
// avisa — así un bache de un ping no dispara el cartel de "sin conexión"
// y asusta al usuario con algo que no tiene que ver con internet.
const FALLOS_SEGUIDOS_PARA_OFFLINE = 2;

/**
 * navigator.onLine solo dice si el dispositivo tiene una interfaz de red
 * activa — un wifi conectado pero sin salida a internet real (o con el
 * backend caído) sigue reportando "online". Por eso, además del evento
 * nativo, hacemos un ping liviano y periódico a la propia API para
 * confirmar que el servidor realmente responde.
 */
export default function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  const fallosSeguidos = useRef(0);

  useEffect(() => {
    let cancelado = false;

    const chequearBackend = async () => {
      try {
        await axios.get(`${API_URL}health`, { timeout: 5000 });
        if (cancelado) return;
        fallosSeguidos.current = 0;
        setOnline(true);
      } catch {
        if (cancelado) return;
        fallosSeguidos.current += 1;
        if (fallosSeguidos.current >= FALLOS_SEGUIDOS_PARA_OFFLINE) setOnline(false);
      }
    };

    // El evento nativo "offline" también puede ser un falso positivo acá
    // (sin interfaz de red pero el backend local igual responde, porque
    // localhost no necesita salida real a internet) — se verifica con un
    // ping real en vez de creerle directo al navegador.
    const handleOnline = () => chequearBackend();
    const handleOffline = () => chequearBackend();

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
