import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/query-persist-client-core';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './auth/AuthContext';
import { ThemeContextProvider } from './theme/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { queryClient } from './queryClient';

const STORAGE_KEY = 'KAMEX_QUERY_CACHE';

const localStoragePersister = {
  persistClient: async (client) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(client));
    } catch { /* storage full, ignorar */ }
  },
  restoreClient: async () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : undefined;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return undefined;
    }
  },
  removeClient: async () => {
    localStorage.removeItem(STORAGE_KEY);
  },
};

persistQueryClient({
  queryClient,
  persister: localStoragePersister,
  maxAge: 1000 * 60 * 60 * 24,
  buster: import.meta.env.VITE_APP_VERSION || '1.0.0',
});

if (import.meta.env.VITE_SENTRY_DSN) {
  import('./sentry');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeContextProvider>
        <AuthProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AuthProvider>
      </ThemeContextProvider>
    </QueryClientProvider>
  </StrictMode>
);
