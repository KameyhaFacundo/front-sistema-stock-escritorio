import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL; // e.g. http://localhost:8000/api/

// Instancia propia (no el axios global) — así los interceptors de auth
// registrados en Axios.interceptor.jsx sólo se aplican a llamadas a nuestra
// propia API, y nunca se cuelan (con el Bearer token del usuario) en una
// llamada a un servicio de terceros que use axios directamente.
export const http = axios.create();

// Thin wrapper over `http` so all request/response interceptors registered
// in AxiosInterceptor.jsx apply automatically.
const api = {
  get:    (url, config)       => http.get(`${BASE}${url}`, config),
  post:   (url, data, config) => http.post(`${BASE}${url}`, data, config),
  put:    (url, data, config) => http.put(`${BASE}${url}`, data, config),
  patch:  (url, data, config) => http.patch(`${BASE}${url}`, data, config),
  delete: (url, config)       => http.delete(`${BASE}${url}`, config),
};

export default api;
