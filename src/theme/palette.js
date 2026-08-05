// ── Semantic colour palette ─────────────────────────────────────────────────
// Import from here (not from tokens) when you need a specific semantic colour
// like SUCCESS or ERROR.  tokens.js re-exports P so existing code keeps
// working without changes.

import { PRIMARY_COLOR, PRIMARY_HOVER } from '../config/brand';

// Brand accent — configurable per deployment via VITE_PRIMARY_COLOR
export const P       = PRIMARY_COLOR;
export const P_HOVER = PRIMARY_HOVER;

// ── Semantic colours ────────────────────────────────────────────────────────
export const SUCCESS        = '#22c55e';
export const SUCCESS_HOVER  = '#16a34a';
export const SUCCESS_BG     = 'rgba(34,197,94,0.12)';
export const SUCCESS_BORDER = 'rgba(34,197,94,0.25)';
export const SUCCESS_LIGHT  = '#4ade80';

export const ERROR        = '#ef4444';
export const ERROR_BG     = 'rgba(239,68,68,0.1)';
export const ERROR_BORDER = 'rgba(239,68,68,0.3)';
export const ERROR_DARK   = '#dc2626';

export const WARNING    = '#f59e0b';
export const WARNING_BG = 'rgba(245,158,11,0.15)';

export const INFO   = '#3b82f6';
export const MONEY  = '#22c55e';
export const PURPLE = '#8b5cf6';
export const ORANGE = '#f97316';

// ── Payment method colours ──────────────────────────────────────────────────
export const METHOD_COLORS = {
  efectivo:      SUCCESS,
  tarjeta:       P,
  transferencia: PURPLE,
  qr:            ORANGE,
};

// ── Role chip colours ───────────────────────────────────────────────────────
export const ROL_COLORS = {
  admin:    { bg: `${P}20`,          fg: P,       border: `${P}40`           },
  vendedor: { bg: `${SUCCESS}1e`,    fg: SUCCESS, border: `${SUCCESS}40`     },
  default:  { bg: `${WARNING}1e`,    fg: WARNING, border: `${WARNING}40`     },
};
