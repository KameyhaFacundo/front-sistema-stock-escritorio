import api from '../api/client';
import { DEMO_MODE, DEMO_TOKEN, DEMO_USER } from './demoMode';

const DEMO_EXPIRES = 60 * 60 * 24 * 365;

export const loginApi = async (email, password) => {
  if (DEMO_MODE) {
    return {
      success: true,
      access_token: DEMO_TOKEN,
      token_type: 'bearer',
      expires_in: DEMO_EXPIRES,
      user: { ...DEMO_USER, email: email || DEMO_USER.email },
    };
  }
  const response = await api.post('login', { email, password });
  return response.data;
};

export const verificar2faApi = async (pendingToken, codigo) => {
  const response = await api.post('login/2fa', { pending_token: pendingToken, codigo });
  return response.data;
};

export const forgotPasswordApi = async (email) => {
  try {
    const response = await api.post('forgot-password', { email });
    return response.data;
  } catch (e) {
    const msg = e.response?.data?.message || e.response?.data?.error || 'Error al enviar la solicitud';
    throw new Error(msg);
  }
};

export const resetPasswordApi = async (email, token, password, passwordConfirmation) => {
  try {
    const response = await api.post('reset-password', {
      email, token, password, password_confirmation: passwordConfirmation,
    });
    return response.data;
  } catch (e) {
    const msg = e.response?.data?.message || e.response?.data?.error || 'Error al restablecer la contraseña';
    throw new Error(msg);
  }
};

export const getMeApi = async () => {
  const response = await api.get('me');
  return response.data;
};

export const logoutApi = async () => {
  if (!DEMO_MODE) {
    try {
      await api.post('logout');
    } catch {
      // El logout local debe seguir aunque el back no responda (token ya vencido, sin conexión, etc.)
    }
  }
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  localStorage.removeItem('expires_at');
  localStorage.removeItem('permisos');
  localStorage.removeItem('empresa_nombre');
};
