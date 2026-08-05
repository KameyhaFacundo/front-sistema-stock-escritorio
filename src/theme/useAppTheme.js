import { createContext, useContext } from 'react';

export const ThemeCtx = createContext({
  mode: 'light',
  toggle: () => {},
});

export const useAppTheme = () => useContext(ThemeCtx);
