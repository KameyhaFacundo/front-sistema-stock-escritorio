import { APP_NAME, LOGO_URL_DARK } from '../../config/brand';

// Mismo look que el splash estático de index.html — se usa en cualquier
// punto de espera antes de que la app real esté lista (Suspense de rutas en
// App.jsx, chequeo de sesión en PrivateRoute) para que nunca se vea una
// pantalla en blanco/sin marca entre medio, aunque sea por un instante.
export default function AppLoading() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
      height: '100dvh', background: '#2B2118', color: '#C7B7A3',
      fontFamily: 'Geist, ui-sans-serif, system-ui, sans-serif', fontSize: 14,
    }}>
      <img src={LOGO_URL_DARK} alt={APP_NAME} style={{ height: 48, width: 'auto' }} />
      Cargando...
    </div>
  );
}
