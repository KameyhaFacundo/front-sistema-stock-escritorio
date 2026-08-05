import { useContext, useEffect, useRef } from 'react';
import { AuthContext } from '../auth/AuthContextBase';
import { useToast } from '../context/ToastContext';
import { DEMO_MODE } from '../auth/demoMode';
import { http } from '../api/client';

export const AxiosInterceptor = () => {
  const { logout } = useContext(AuthContext);
  const toast         = useToast();
  const logoutRef     = useRef(logout);
  const toastRef      = useRef(toast);
  const pendingLogout = useRef(false);

  useEffect(() => { logoutRef.current = logout; }, [logout]);
  useEffect(() => { toastRef.current  = toast;  }, [toast]);

  useEffect(() => {
    const updateHeader = (request) => {
      const tokenLocal = localStorage.getItem('token');

      // Sin token → no agregar Authorization (evita enviar "Bearer null")
      if (!tokenLocal) return request;

      let authToken = tokenLocal;
      try {
        const parsed = JSON.parse(tokenLocal);
        authToken = parsed.access_token || tokenLocal;
      } catch {
        authToken = tokenLocal;
      }

      request.headers = {
        ...request.headers,
        Authorization: `Bearer ${authToken}`,
        Accept: 'application/json',
        'Content-Type': request.headers['Content-Type'] || 'application/json',
      };
      return request;
    };

    const reqId = http.interceptors.request.use((request) => {
      const url = request.url ?? '';
      if (url.includes('signin') || url.includes('login') || url.includes('register') || url.includes('forgot-password') || url.includes('reset-password')) return request;
      return updateHeader(request);
    });

    const resId = http.interceptors.response.use(
      (response) => response,
      (error) => {
        if (DEMO_MODE) return Promise.reject(error);

        if (!error.response) {
          toastRef.current?.('Sin conexión con el servidor', 'error');
          return Promise.reject(error);
        }

        const { status } = error.response;
        const url = error.config?.url ?? '';

        if (status === 401) {
          // Login, register y logout se dejan pasar para que su propio catch maneje el error
          if (url.includes('logout') || url.includes('login') || url.includes('register')) return Promise.reject(error);

          // Deduplicación: si ya hay un logout en curso, no disparar otro
          if (!pendingLogout.current) {
            pendingLogout.current = true;
            logoutRef.current().finally(() => { pendingLogout.current = false; });
          }

          // Promesa colgante: ningún catch de componente se ejecuta → sin toast de "token invalido"
          return new Promise(() => {});
        }

        return Promise.reject(error);
      }
    );

    return () => {
      http.interceptors.request.eject(reqId);
      http.interceptors.response.eject(resId);
    };
  }, []);

  return null;
};
