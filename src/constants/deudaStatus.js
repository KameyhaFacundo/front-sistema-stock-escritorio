import { ERROR_BG, ERROR, ERROR_BORDER, SUCCESS_BG, SUCCESS_BORDER } from '../theme/tokens';

const SUCCESS_LIGHT = '#4ade80';

const DEUDA_COLORS = {
  pendiente: { bg: ERROR_BG, fg: ERROR, border: ERROR_BORDER, label: 'Pendiente' },
  parcial:   { bg: '#f59e0b22', fg: '#fbbf24', border: '#f59e0b44', label: 'Parcial' },
  pagado:    { bg: SUCCESS_BG, fg: SUCCESS_LIGHT, border: SUCCESS_BORDER, label: 'Pagado' },
};

export default DEUDA_COLORS;
