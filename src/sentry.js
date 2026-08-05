import { init } from '@sentry/react';

// Vacío por default: sin DSN no manda nada, no rompe nada en local ni en un
// deploy que todavía no lo configuró. Completar con VITE_SENTRY_DSN en las
// variables de entorno de producción (mismo proyecto de sentry.io que el
// backend, o uno aparte — ver SENTRY_LARAVEL_DSN en back-sistema-stock).
// Importado dinámicamente desde main.jsx solo cuando hay DSN configurado —
// no repetir ese chequeo acá cambia el comportamiento si en el futuro algo
// más importa este módulo directamente.
const dsn = import.meta.env.VITE_SENTRY_DSN;

if (dsn) {
  init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
  });
}
