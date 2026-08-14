import { APP_NAME, LOGO_URL } from '../../config/brand';

// Mismo look que el splash estático de index.html — se usa en cualquier
// punto de espera antes de que la app real esté lista (Suspense de rutas en
// App.jsx, chequeo de sesión en PrivateRoute, cambio de página dentro de
// DefaultLayout) para que nunca se vea una pantalla en blanco/sin marca
// entre medio, aunque sea por un instante. Colores fijos (no CSS vars del
// tema) a propósito: esto puede pintarse ANTES de que ThemeContext aplique
// las vars sobre :root — clavado a los colores del preset "organic" claro,
// que es el modo por default.
export default function AppLoading({ fullScreen = true }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
      height: fullScreen ? '100dvh' : '100%', width: '100%',
      background: '#ffffff', color: '#6e6455',
      fontFamily: 'Figtree, ui-sans-serif, system-ui, sans-serif', fontSize: 14,
    }}>
      <img src={LOGO_URL} alt={APP_NAME} style={{ height: 48, width: 'auto' }} />
      Cargando...
    </div>
  );
}
