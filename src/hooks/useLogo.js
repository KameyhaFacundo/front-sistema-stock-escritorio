import { useAppTheme } from '../theme/useAppTheme';
import { LOGO_URL, LOGO_URL_DARK } from '../config/brand';

// Devuelve la variante del logo que corresponde al tema activo.
export default function useLogo() {
  const { mode } = useAppTheme();
  return mode === 'dark' ? LOGO_URL_DARK : LOGO_URL;
}
