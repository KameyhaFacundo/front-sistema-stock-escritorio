import { useState, useLayoutEffect, useMemo } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeCtx } from './useAppTheme';
import { PRIMARY_COLOR } from '../config/brand';

// ── CSS variable sets ──────────────────────────────────────────────────────

// ── Dark theme — Marrón cálido (paleta pedida a medida, ver conversación:
// bg-page/bg-surface/border/text-primary/text-secondary/accent) ───────────
const DARK_ACCENT = '#F5883A';
const DARK = {
  '--bg':           '#1A1714',
  '--card':         '#211D19',
  '--border':       '#2E2823',
  '--border-hover': '#40372E',
  '--ink':          '#F2EDE7',
  '--ink2':         '#A89E93',
  '--muted':        '#6B6259',
  '--input':        '#231F1A',
  '--hover':        '#282320',
  '--active-bg':    '#3A2416',
  '--table-header': '#17130F',
  '--dropdown':     '#231F1A',
  '--modal':        '#1A1714',
};

const LIGHT_ACCENT = '#B5622C';
const LIGHT = {
  '--bg':           '#F7F4EF',
  '--card':         '#FFFFFF',
  '--border':       '#E8E1D8',
  '--border-hover': '#D6C9B8',
  '--ink':          '#2A2521',
  '--ink2':         '#6B5F54',
  '--muted':        '#948879',
  '--input':        '#FAF7F2',
  '--hover':        '#F1ECE4',
  '--active-bg':    '#F5E6D8',
  '--table-header': '#F2EDE6',
  '--dropdown':     '#FFFFFF',
  '--modal':        '#FFFFFF',
};

// ── Helpers ────────────────────────────────────────────────────────────────

function applyVars(m) {
  const vars = m === 'dark' ? DARK : LIGHT;
  Object.entries(vars).forEach(([k, v]) =>
    document.documentElement.style.setProperty(k, v)
  );
  // --p (a diferencia de la constante P de palette.js, fija por build vía
  // VITE_PRIMARY_COLOR) sí cambia con el modo — lo consumen unos pocos
  // lugares que no pueden importar JS (tour.css, el toast de SweetAlert2,
  // los links de las páginas legales).
  document.documentElement.style.setProperty('--p', m === 'dark' ? DARK_ACCENT : LIGHT_ACCENT);
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
        default: mode === 'dark' ? DARK['--bg'] : LIGHT['--bg'],
        paper:   mode === 'dark' ? DARK['--card'] : LIGHT['--card'],
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
