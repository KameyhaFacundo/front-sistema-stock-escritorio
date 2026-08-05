import { useState, useLayoutEffect, useMemo } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeCtx } from './useAppTheme';
import { PRIMARY_COLOR } from '../config/brand';

// ── CSS variable sets ──────────────────────────────────────────────────────

// ── Dark theme — Slate/Navy ──────────────────────────────────────────────────
const DARK = {
  '--bg':           '#0f172a',
  '--card':         '#1e293b',
  '--border':       '#334155',
  '--border-hover': '#475569',
  '--ink':          '#f1f5f9',
  '--ink2':         '#b0bdd0',
  '--muted':        '#64748b',
  '--input':        '#1e293b',
  '--hover':        '#334155',
  '--active-bg':    '#1e3a5f',
  '--table-header': '#172033',
  '--dropdown':     '#1e293b',
  '--modal':        '#0f172a',
};

// ── Dark theme — Original (negro casi puro) ──────────────────────────────────
// const DARK = {
//   '--bg':           '#111010',
//   '--card':         '#1c1b1b',
//   '--border':       '#2c2b2b',
//   '--border-hover': '#3d3b3b',
//   '--ink':          '#f0edec',
//   '--ink2':         '#a09a99',
//   '--muted':        '#706969',
//   '--input':        '#201f1f',
//   '--hover':        '#252323',
//   '--active-bg':    '#0d2820',
//   '--table-header': '#161414',
//   '--dropdown':     '#201f1f',
//   '--modal':        '#111010',
// };

const LIGHT = {
  '--bg':           '#f4f6fa',
  '--card':         '#ffffff',
  '--border':       '#e2e8f0',
  '--border-hover': '#b8c4d8',
  '--ink':          '#0f172a',
  '--ink2':         '#475569',
  '--muted':        '#94a3b8',
  '--input':        '#f8fafc',
  '--hover':        '#f1f5f9',
  '--active-bg':    '#eef2ff',
  '--table-header': '#f8fafc',
  '--dropdown':     '#ffffff',
  '--modal':        '#ffffff',
};

// ── Helpers ────────────────────────────────────────────────────────────────

function applyVars(m) {
  const vars = m === 'dark' ? DARK : LIGHT;
  Object.entries(vars).forEach(([k, v]) =>
    document.documentElement.style.setProperty(k, v)
  );
  document.documentElement.style.setProperty('--p', PRIMARY_COLOR);
}

// ── Provider ───────────────────────────────────────────────────────────────

export function ThemeContextProvider({ children }) {
  const [mode, setMode] = useState(
    () => localStorage.getItem('theme') || 'light'
  );

  useLayoutEffect(() => {
    applyVars(mode);
    localStorage.setItem('theme', mode);
  }, [mode]);

  const toggle = () => setMode(m => (m === 'dark' ? 'light' : 'dark'));

  const muiTheme = useMemo(() => createTheme({
    palette: {
      mode,
      background: {
        // Slate/Navy dark mode
        default: mode === 'dark' ? '#0f172a' : '#f4f6fa',
        paper:   mode === 'dark' ? '#1e293b' : '#ffffff',
        // Original dark mode — comentado: '#111010' / '#1c1b1b'
      },
      primary: { main: PRIMARY_COLOR },
    },
  }), [mode]);

  return (
    <ThemeCtx.Provider value={{ mode, toggle }}>
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeCtx.Provider>
  );
}
