import { createContext, useContext } from 'react';

export const VentasCtx = createContext(null);

export const useVentas = () => useContext(VentasCtx);
