import { useEffect, useRef } from 'react';
import { APP_NAME } from '../config/brand';
import { playAlertSound } from '../utils/alertSound';

/**
 * Activa notificaciones del navegador para alertas de stock bajo y trial.
 * Se llama una sola vez al montar el layout.
 */
export default function useNotificaciones(alertas, user) {
  // Snapshot {id: stock} del último stockBajo visto — dispara sonido +
  // notificación de escritorio cada vez que un producto ENTRA a la lista o
  // baja todavía más de stock (ej: tenía 3, vendieron 2, quedó en 1 — eso
  // tiene que avisar aunque el producto ya estuviera en la lista de antes).
  // Antes esto se disparaba con alertas.total, pero ese número solo cuenta
  // CATEGORÍAS con al menos un ítem (queda pegado en 1 apenas hay UN
  // producto con stock bajo) — no vuelve a avisar aunque ese mismo producto
  // se siga vendiendo. Comparar contra el último stock visto por producto sí
  // detecta cada caída real. No avisa en el primer render (stock bajo que ya
  // existía al abrir la app no hace falta anunciarlo).
  const prevStockRef = useRef(null);
  useEffect(() => {
    const stockBajo = alertas?.stockBajo;
    if (!stockBajo) return;
    const prev = prevStockRef.current;
    if (prev) {
      const empeoro = stockBajo.some(p => !prev.has(p.id) || p.stock < prev.get(p.id));
      if (empeoro) {
        playAlertSound();
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`${APP_NAME} - Stock bajo`, {
            body: `${stockBajo.length} producto${stockBajo.length !== 1 ? 's' : ''} con stock bajo`,
            icon: '/img/kamex_icon.png',
            tag: 'stock-bajo',
          });
        }
      }
    }
    prevStockRef.current = new Map(stockBajo.map(p => [p.id, p.stock]));
  }, [alertas?.stockBajo]);

  // Beep (sin notificación de escritorio) cuando aparece una deuda a
  // proveedores, un fiado de cliente o se corta la conexión a Drive —
  // categorías sin cantidad para comparar como el stock, así que alcanza con
  // detectar que pasaron de "no había" a "hay".
  const prevOtrasRef = useRef(null);
  useEffect(() => {
    const otras = (alertas?.deudasProveedores?.length > 0 ? 1 : 0)
      + (alertas?.fiadosClientes?.length > 0 ? 1 : 0)
      + (alertas?.backupSinDrive ? 1 : 0);
    if (prevOtrasRef.current !== null && otras > prevOtrasRef.current) {
      playAlertSound();
    }
    prevOtrasRef.current = otras;
  }, [alertas?.deudasProveedores?.length, alertas?.fiadosClientes?.length, alertas?.backupSinDrive]);

  useEffect(() => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'denied') return;

    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    if (Notification.permission !== 'granted') return;

    // Alerta de trial por vencer
    const ends = user?.empresa?.trial_ends_at;
    if (ends && user?.empresa?.plan === 'free') {
      const dias = Math.ceil((new Date(ends) - Date.now()) / (1000 * 60 * 60 * 24));
      if (dias > 0 && dias <= 3) {
        const ultima = localStorage.getItem('ultima_notif_trial');
        const ahora  = Date.now();
        if (!ultima || ahora - Number(ultima) > 24 * 60 * 60 * 1000) {
          new Notification(`${APP_NAME} - Prueba por vencer`, {
            body: `Tu prueba gratis vence en ${dias} día${dias !== 1 ? 's' : ''}. Actualizá tu plan.`,
            icon: '/img/kamex_icon.png',
            tag: 'trial-vencido',
          });
          localStorage.setItem('ultima_notif_trial', String(ahora));
        }
      }
    }
  }, [user?.empresa?.trial_ends_at, user?.empresa?.plan]);
}
