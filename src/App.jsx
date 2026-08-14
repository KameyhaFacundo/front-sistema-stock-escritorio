import { Suspense, useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import './App.css'
import { router } from './routes'
import { AxiosInterceptor } from './interceptors/Axios.interceptor'
import useTokenExpirationCheck from './hooks/useTokenExpirationCheck'
import ErrorBoundary from './components/shared/ErrorBoundary'
import Loading from './components/shared/AppLoading'

function App() {
  useTokenExpirationCheck()

  // La barrita indicadora de MUI Tabs (Dashboard, Caja, Configuración, POS
  // mobile) mide el ancho/posición de cada pestaña UNA vez al montar — si en
  // ese momento la tipografía bold de Figtree todavía no terminó de cargar
  // (@font-face, ver index.css), mide contra la fuente de reemplazo más
  // angosta y nunca vuelve a recalcular sola, quedando desalineada para
  // siempre en esa sesión. document.fonts.ready + un resize sintético fuerza
  // a MUI a remedirla ya con la fuente real puesta.
  useEffect(() => {
    document.fonts?.ready?.then(() => window.dispatchEvent(new Event('resize')));
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.key === 'Enter') {
        const dialogs = document.querySelectorAll('.MuiDialog-root[role="dialog"]');
        if (!dialogs.length) return;
        const lastDialog = dialogs[dialogs.length - 1];
        const confirmBtn = lastDialog.querySelector('.MuiButton-containedPrimary, [data-tour="compras-modal-registrar"], [data-tour="mov-modal-registrar"]');
        if (confirmBtn && !confirmBtn.hasAttribute('disabled')) confirmBtn.click();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <ErrorBoundary>
      <AxiosInterceptor />
      <Suspense fallback={<Loading />}>
        <RouterProvider router={router} />
      </Suspense>
    </ErrorBoundary>
  )
}

export default App
