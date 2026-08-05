import { createContext, useContext } from 'react';

export const CajaCtx = createContext(null);

export const useCaja = () => useContext(CajaCtx);
