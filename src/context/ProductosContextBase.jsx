import { createContext, useContext } from 'react';

export const ProductosCtx = createContext(null);

export const useProductos = () => useContext(ProductosCtx);
