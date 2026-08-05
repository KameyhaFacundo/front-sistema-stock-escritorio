// ── Design tokens ──────────────────────────────────────────────────────────
// Theme-aware values are CSS custom properties injected by ThemeContext on :root.
// Semantic colour constants live in palette.js and are re-exported here so
// existing `import { P } from '../../theme/tokens'` calls keep working.

export { P, P_HOVER, SUCCESS, SUCCESS_HOVER, SUCCESS_BG, SUCCESS_BORDER,
         ERROR, ERROR_BG, ERROR_BORDER, ERROR_DARK, WARNING, WARNING_BG,
         INFO, MONEY, PURPLE, ORANGE, SUCCESS_LIGHT, METHOD_COLORS, ROL_COLORS,
} from './palette';

// ── Theme-aware CSS variable tokens ────────────────────────────────────────
export const BG           = 'var(--bg)';
export const CARD         = 'var(--card)';
export const BORDER       = 'var(--border)';
export const INK          = 'var(--ink)';
export const INK2         = 'var(--ink2)';
export const MUTED        = 'var(--muted)';
export const INPUT        = 'var(--input)';
export const HOVER        = 'var(--hover)';
export const ACTIVE_BG    = 'var(--active-bg)';
export const TABLE_HEADER = 'var(--table-header)';
export const DROPDOWN     = 'var(--dropdown)';
export const MODAL        = 'var(--modal)';

// ── Reusable sx presets ─────────────────────────────────────────────────────
import { P } from './palette';

export const inputSx = {
  '& .MuiOutlinedInput-root': {
    bgcolor: INPUT, color: INK, fontSize: 14, borderRadius: '10px',
    '& fieldset': { borderColor: BORDER },
    '&:hover fieldset': { borderColor: 'var(--border-hover)' },
    '&.Mui-focused fieldset': { borderColor: P, borderWidth: 1 },
  },
  '& .MuiInputBase-input': { py: '13px', px: '14px' },
  '& .MuiInputBase-input::placeholder': { color: MUTED, opacity: 1 },
};

export const inputSmSx = {
  ...inputSx,
  '& .MuiInputBase-input': { py: '11px', px: '14px' },
};

export const selectSx = {
  bgcolor: INPUT, color: INK, fontSize: 14, borderRadius: '8px',
  '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border-hover)' },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: P, borderWidth: 1 },
  '& .MuiSvgIcon-root': { color: MUTED },
  '& .MuiSelect-select': { py: '11px', px: '14px' },
};

export const menuPaperSx = {
  bgcolor: DROPDOWN,
  border: `1px solid ${BORDER}`,
  borderRadius: '10px',
  color: INK,
};

export const switchSx = {
  '& .MuiSwitch-switchBase.Mui-checked': { color: P },
  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: P },
  '& .MuiSwitch-track': { bgcolor: BORDER },
};

export const modalPaperSx = {
  bgcolor: MODAL,
  backgroundImage: 'none',
  border: `1px solid ${BORDER}`,
  borderTop: `4px solid ${P}`,
  borderRadius: '16px',
  color: INK,
  overflow: 'auto',
  boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
};

export const modalHeaderSx = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  px: 3,
  py: 2.5,
  borderBottom: `1px solid ${BORDER}`,
  bgcolor: TABLE_HEADER,
};

// fieldSx: para inputs dentro de formularios/modales (8px radius, estados error)
export const fieldSx = {
  '& .MuiOutlinedInput-root': {
    bgcolor: INPUT, color: INK, fontSize: 14, borderRadius: '8px',
    '& fieldset': { borderColor: BORDER },
    '&:hover fieldset': { borderColor: 'var(--border-hover)' },
    '&.Mui-focused fieldset': { borderColor: P, borderWidth: 1 },
    '&.Mui-error fieldset': { borderColor: '#ef4444' },
    '&.Mui-error:hover fieldset': { borderColor: '#ef4444' },
  },
  '& .MuiInputBase-input': { py: '11px', px: '14px' },
  '& .MuiInputBase-input::placeholder': { color: MUTED, opacity: 1 },
  '& .MuiInputLabel-root': { color: MUTED },
  '& .MuiInputLabel-root.Mui-focused': { color: P },
  '& .MuiFormHelperText-root': { color: '#ef4444', mx: 0, mt: 0.5, fontSize: 12 },
};
