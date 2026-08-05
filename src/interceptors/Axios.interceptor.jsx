import { useContext, useEffect, useRef, useState } from 'react';
import { Box, Typography, Dialog, Button } from '@mui/material';
import { AuthContext } from '../auth/AuthContextBase';
import { useToast } from '../context/ToastContext';
import { DEMO_MODE } from '../auth/demoMode';
import { CARD, INK, MUTED, P, P_HOVER, modalPaperSx } from '../theme/tokens';
import { http } from '../api/client';

export const AxiosInterceptor = () => {
  const { logout } = useContext(AuthContext);
  const toast         = useToast();
  const logoutRef     = useRef(logout);
  const toastRef      = useRef(toast);
  const pendingLogout = useRef(false);
  const [trialExpired, setTrialExpired] = useState(false);

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

        const { status, data } = error.response;
        const url = error.config?.url ?? '';

        if (status === 403 && data?.trial_expired) {
          // En /planes el usuario ya está donde tiene que estar para elegir un
          // plan — no lo tapamos con el modal aunque otras cargas de fondo
          // (dashboard, caja, productos) sigan devolviendo el mismo 403.
          if (!window.location.pathname.startsWith('/planes')) {
            setTrialExpired(true);
          }
          return Promise.reject(error);
        }

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

  if (!trialExpired) return null;

  return (
    <Dialog open disableEscapeKeyDown onClose={() => {}} maxWidth="xs" fullWidth PaperProps={{ sx: modalPaperSx }}>
      <Box sx={{ p: { xs: 1.75, sm: 3 }, textAlign: 'center' }}>
        <Typography sx={{ color: INK, fontWeight: 700, fontSize: 19, mb: 1 }}>
          Tu período de prueba terminó
        </Typography>
        <Typography sx={{ color: MUTED, fontSize: 14, mb: 3 }}>
          Elegí un plan para seguir usando el sistema. Tus datos siguen guardados y van a estar disponibles apenas actives un plan.
        </Typography>
        <Button fullWidth variant="contained"
          onClick={() => { window.location.href = '/planes'; }}
          sx={{ bgcolor: P, textTransform: 'none', fontWeight: 700, fontSize: 14, py: 1.25, borderRadius: '8px', mb: 1.5, '&:hover': { bgcolor: P_HOVER } }}>
          Ver planes
        </Button>
        <Button fullWidth onClick={() => logoutRef.current()}
          sx={{ color: MUTED, textTransform: 'none', fontWeight: 600, fontSize: 13, '&:hover': { bgcolor: CARD, color: INK } }}>
          Cerrar sesión
        </Button>
      </Box>
    </Dialog>
  );
};
