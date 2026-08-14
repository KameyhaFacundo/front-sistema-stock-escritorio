import { useState, useLayoutEffect, useMemo } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeCtx } from './useAppTheme';
import { PRIMARY_COLOR } from '../config/brand';

// ── Paletas guardadas ────────────────────────────────────────────────────
// Cada preset trae dark/light completos. Ninguno se borra al probar uno
// nuevo — así se puede volver atrás o comparar sin tener que reconstruir
// los valores de memoria. ACTIVE_PRESET más abajo decide cuál está en uso.
const THEME_PRESETS = {
  // Paleta original del sistema (antes de esta sesión) — azul/slate.
  slate: {
    accent: { light: '#5c6ef8', dark: '#5c6ef8' },
    dark: {
      '--bg': '#0f172a', '--bg-sidebar': '#0f172a', '--card': '#1e293b',
      '--border': '#334155', '--border-hover': '#475569',
      '--ink': '#f1f5f9', '--ink2': '#b0bdd0', '--muted': '#64748b',
      '--input': '#1e293b', '--hover': '#334155', '--active-bg': '#1e3a5f',
      '--accent-ink': '#f1f5f9',
      '--table-header': '#172033', '--dropdown': '#1e293b', '--modal': '#0f172a',
    },
    light: {
      '--bg': '#f4f6fa', '--bg-sidebar': '#f4f6fa', '--card': '#ffffff',
      '--border': '#e2e8f0', '--border-hover': '#b8c4d8',
      '--ink': '#0f172a', '--ink2': '#475569', '--muted': '#94a3b8',
      '--input': '#f8fafc', '--hover': '#f1f5f9', '--active-bg': '#eef2ff',
      '--accent-ink': '#0f172a',
      '--table-header': '#f8fafc', '--dropdown': '#ffffff', '--modal': '#ffffff',
    },
  },
  // Primera paleta cálida pedida — terracota/crema.
  terracota: {
    accent: { light: '#B5622C', dark: '#F5883A' },
    dark: {
      '--bg': '#1A1714', '--bg-sidebar': '#1A1714', '--card': '#211D19',
      '--border': '#2E2823', '--border-hover': '#40372E',
      '--ink': '#F2EDE7', '--ink2': '#A89E93', '--muted': '#6B6259',
      '--input': '#231F1A', '--hover': '#282320', '--active-bg': '#3A2416',
      '--accent-ink': '#F5883A',
      '--table-header': '#17130F', '--dropdown': '#231F1A', '--modal': '#1A1714',
    },
    light: {
      '--bg': '#F7F4EF', '--bg-sidebar': '#F7F4EF', '--card': '#FFFFFF',
      '--border': '#E8E1D8', '--border-hover': '#D6C9B8',
      '--ink': '#2A2521', '--ink2': '#6B5F54', '--muted': '#948879',
      '--input': '#FAF7F2', '--hover': '#F1ECE4', '--active-bg': '#F5E6D8',
      '--accent-ink': '#B5622C',
      '--table-header': '#F2EDE6', '--dropdown': '#FFFFFF', '--modal': '#FFFFFF',
    },
  },
  // Segunda paleta cálida pedida — "clay", con sidebar propio y semánticos
  // success/danger (guardados en SEMANTIC_PRESETS más abajo — todavía no
  // reemplazan SUCCESS/ERROR de palette.js, ver comentario ahí).
  clay: {
    accent: { light: '#B0653D', dark: '#E08A5B' },
    dark: {
      '--bg': '#2B2118', '--bg-sidebar': '#241B14', '--card': '#332720',
      '--border': '#473627', '--border-hover': '#5C4936',
      '--ink': '#F5EEE4', '--ink2': '#C7B7A3', '--muted': '#8F7D68',
      '--input': '#362A22', '--hover': '#3D2F26', '--active-bg': '#4A3626',
      '--accent-ink': '#FFC397',
      '--table-header': '#251C15', '--dropdown': '#332720', '--modal': '#2B2118',
    },
    light: {
      '--bg': '#F3EDE3', '--bg-sidebar': '#F8F4EC', '--card': '#FFFFFF',
      '--border': '#E5DBC9', '--border-hover': '#D4C2A0',
      '--ink': '#2B241D',
      // Pedido como #8B7F6E — casi el mismo tono que ya hubo que oscurecer
      // en "terracota" por bajo contraste (~3.8:1, por debajo del mínimo
      // AA 4.5:1). Ajustado con el mismo criterio, no lo dejé tal cual.
      '--ink2': '#6C6052', '--muted': '#A89C89',
      '--input': '#FAF6EF', '--hover': '#ECE4D5', '--active-bg': '#F0DFCE',
      '--accent-ink': '#8A4A22',
      '--table-header': '#EFE7D9', '--dropdown': '#FFFFFF', '--modal': '#FFFFFF',
    },
  },
  // Design handoff "Organic" (design_handoff_stock_manager) — crema/terracota,
  // radios grandes y sombras suaves en vez de bordes. Valores derivados de
  // organic-styles.css: --color-bg/--color-surface/--color-text/--color-accent
  // se usan tal cual; --border, --border-hover, --ink2 y --muted son mezclas
  // sólidas (no color-mix) de --color-text sobre el fondo correspondiente a
  // ~16/32/70/45%, para no romper los `${MUTED}20`/`${BG}ec` que concatenan
  // sufijo hex de alpha en todo el código (ver PaymentModal, Dashboard,
  // Presupuestos, Landing). --hover reproduce la regla del handoff
  // (color-mix(text 6%) sobre --color-surface, que es el fondo del sidebar
  // y las cards). --active-bg/--accent-ink pasan a ser el acento sólido y el
  // color de fondo propio del modo — el handoff pide "fondo accent, texto
  // bg" en el ítem de nav activo (ver Sidebar.jsx).
  organic: {
    accent: { light: '#c67139', dark: '#e08b52' },
    dark: {
      '--bg': '#1a1815', '--bg-sidebar': '#26231e', '--card': '#26231e',
      '--border': '#413e38', '--border-hover': '#605b53',
      '--ink': '#f5ead8', '--ink2': '#b3ab9e', '--muted': '#7d776d',
      '--input': '#26231e', '--hover': '#322f29', '--active-bg': '#e08b52',
      '--accent-ink': '#1a1815',
      '--table-header': '#2c2924', '--dropdown': '#26231e', '--modal': '#26231e',
      '--shadow-sm': '0 1px 2px rgba(0,0,0,0.45)',
      '--shadow-md': '0 3px 10px rgba(0,0,0,0.5)',
      '--shadow-lg': '0 12px 32px rgba(0,0,0,0.55)',
    },
    light: {
      '--bg': '#ffffff', '--bg-sidebar': '#fefcf8', '--card': '#fefcf8',
      '--border': '#ece3d2', '--border-hover': '#d8cdb8',
      '--ink': '#1a1817', '--ink2': '#3c3630', '--muted': '#6e6455',
      '--input': '#fefcf8', '--hover': '#fbf7ee', '--active-bg': '#c67139',
      '--accent-ink': '#fdfbf6',
      '--table-header': '#fdf9f2', '--dropdown': '#fefcf8', '--modal': '#fefcf8',
      '--shadow-sm': '0 1px 2px rgba(46,43,37,0.14)',
      '--shadow-md': '0 3px 10px rgba(46,43,37,0.16)',
      '--shadow-lg': '0 12px 32px rgba(46,43,37,0.22)',
    },
  },
};

// success/success-bg/danger/danger-bg de "clay" quedan guardados acá para
// cuando se decida migrar SUCCESS/ERROR (palette.js) a ser reactivos por
// tema — hoy son constantes JS fijas, usadas con concatenación de alfa
// (${SUCCESS}18) en todo el código, así que no pueden ser CSS vars sin
// antes revisar cada uso una por una (mismo problema que ya existe con P).
// eslint-disable-next-line no-unused-vars
const SEMANTIC_PRESETS = {
  clay: {
    light: { success: '#6B7A4A', successBg: '#E7EADB', danger: '#B14A3A', dangerBg: '#F5DBD3' },
    dark:  { success: '#A3B37B', successBg: '#3A3F2C', danger: '#E28470', dangerBg: '#4A2E27' },
  },
};

// ── Preset activo ────────────────────────────────────────────────────────
// Para volver a "terracota" o "slate": cambiar esta línea nomás, ningún
// otro archivo depende del nombre del preset.
const ACTIVE_PRESET = 'organic';
const DARK  = THEME_PRESETS[ACTIVE_PRESET].dark;
const LIGHT = THEME_PRESETS[ACTIVE_PRESET].light;
const DARK_ACCENT  = THEME_PRESETS[ACTIVE_PRESET].accent.dark;
const LIGHT_ACCENT = THEME_PRESETS[ACTIVE_PRESET].accent.light;

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

  const muiTheme = useMemo(() => {
    const vars = mode === 'dark' ? DARK : LIGHT;
    return createTheme({
      palette: {
        mode,
        background: {
          default: vars['--bg'],
          paper:   vars['--card'],
        },
        primary: { main: PRIMARY_COLOR },
      },
      // Radio base "cómodo" del sistema Organic (--radius-md); los
      // componentes puntuales de abajo pisan esto donde el handoff pide
      // otra cosa (botones/chips/inputs → píldora, diálogos → 28px).
      shape: { borderRadius: 16 },
      typography: {
        fontFamily: '"Figtree", ui-sans-serif, system-ui, sans-serif',
        button: { textTransform: 'none', fontWeight: 700 },
      },
      components: {
        MuiButton: {
          styleOverrides: {
            root: { borderRadius: 999 },
          },
        },
        MuiPaper: {
          // MUI aplica un overlay translúcido por elevación en modo oscuro
          // que desentona con el --card sólido del sistema — se desactiva acá
          // una sola vez en vez de en cada Card/Menu/Dialog que lo use.
          styleOverrides: {
            root: { backgroundImage: 'none' },
          },
        },
        MuiChip: {
          styleOverrides: {
            root: { borderRadius: 999 },
          },
        },
        MuiOutlinedInput: {
          styleOverrides: {
            root: { borderRadius: 999 },
          },
        },
        MuiMenu: {
          styleOverrides: {
            paper: { borderRadius: 16, boxShadow: vars['--shadow-md'] },
          },
        },
        MuiPopover: {
          styleOverrides: {
            paper: { borderRadius: 16, boxShadow: vars['--shadow-md'] },
          },
        },
        MuiDialog: {
          styleOverrides: {
            paper: { borderRadius: 28, boxShadow: vars['--shadow-lg'] },
          },
        },
      },
    });
  }, [mode]);

  return (
    <ThemeCtx.Provider value={{ mode, toggle }}>
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeCtx.Provider>
  );
}
