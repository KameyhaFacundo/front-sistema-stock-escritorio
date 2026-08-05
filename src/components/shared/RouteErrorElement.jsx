import { useRouteError } from 'react-router-dom';
import ErrorScreen from './ErrorScreen';
import { isChunkLoadError, reloadOnceForChunkError } from '../../utils/chunkError';

// createBrowserRouter atrapa los errores de render (incluida la falla de
// import() de un chunk lazy) dentro de su propio árbol de rutas, antes de
// que puedan llegar al <ErrorBoundary> de React que envuelve <RouterProvider>
// en App.jsx — sin un errorElement acá, React Router muestra su pantalla
// genérica de "Unexpected Application Error" en vez de la nuestra.
export default function RouteErrorElement() {
  const error = useRouteError();

  if (isChunkLoadError(error) && reloadOnceForChunkError()) {
    return null;
  }

  return <ErrorScreen onReset={() => { window.location.href = '/dashboard'; }} />;
}
