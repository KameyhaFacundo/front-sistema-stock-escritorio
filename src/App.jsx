import { Suspense, useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import './App.css'
import { router } from './routes'
import { AxiosInterceptor } from './interceptors/Axios.interceptor'
import useTokenExpirationCheck from './hooks/useTokenExpirationCheck'
import ErrorBoundary from './components/shared/ErrorBoundary'
import { APP_NAME, LOGO_URL_DARK } from './config/brand'

function Loading() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
      height: '100dvh', background: '#111010', color: '#a09a99',
      fontFamily: 'Geist, ui-sans-serif, system-ui, sans-serif', fontSize: 14,
    }}>
      <img src={LOGO_URL_DARK} alt={APP_NAME} style={{ height: 48, width: 'auto' }} />
      Cargando...
    </div>
  );
}

function App() {
  useTokenExpirationCheck()

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
