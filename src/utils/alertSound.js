// Beep corto con Web Audio API en vez de un archivo .mp3/.wav — así no hay
// que empaquetar (ni licenciar) un asset de audio para algo tan chico.
let ctx;

// Nombre del evento DOM que dispara este archivo cada vez que suena el beep
// — la campanita del sidebar lo escucha para animarse (un "push") en el
// mismo momento que suena, sin que Sidebar.jsx tenga que conocer nada de
// useNotificaciones.js ni al revés.
export const ALERT_SOUND_EVENT = 'kamex:alert-sound';

export function playAlertSound() {
  window.dispatchEvent(new Event(ALERT_SOUND_EVENT));
  try {
    ctx ??= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;
    // Dos tonos cortos ascendentes (880Hz -> 1108Hz, un intervalo de 3ª
    // menor) — se distingue de una notificación de error sin sonar agresivo.
    [880, 1108].forEach((freq, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = now + i * 0.11;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.18, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.24);
    });
  } catch {
    // Web Audio no disponible/bloqueado — la alerta se sigue viendo en la
    // campanita igual, el sonido es solo un plus.
  }
}
