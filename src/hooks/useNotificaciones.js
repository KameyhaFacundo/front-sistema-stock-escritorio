import { useEffect } from 'react';
import { APP_NAME } from '../config/brand';

/**
 * Activa notificaciones del navegador para alertas de stock bajo y trial.
 * Se llama una sola vez al montar el layout.
 */
export default function useNotificaciones(alertas, user) {
  useEffect(() => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'denied') return;

    const pedir = () => {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    };
    pedir();

    if (Notification.permission !== 'granted') return;

    // Alerta de stock bajo
    if (alertas?.stockBajo?.length > 0) {
      const ultima = localStorage.getItem('ultima_notif_stock');
      const ahora  = Date.now();
      if (!ultima || ahora - Number(ultima) > 30 * 60 * 1000) {
        new Notification(`${APP_NAME} - Stock bajo`, {
          body: `${alertas.stockBajo.length} producto${alertas.stockBajo.length !== 1 ? 's' : ''} con stock bajo`,
          icon: '/img/kamex_icon.png',
          tag: 'stock-bajo',
        });
        localStorage.setItem('ultima_notif_stock', String(ahora));
      }
    }

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
  }, [alertas?.stockBajo?.length, user?.empresa?.trial_ends_at, user?.empresa?.plan]);
}
