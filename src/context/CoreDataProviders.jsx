import { ProductosProvider } from './ProductosContext';
import { VentasProvider } from './VentasContext';
import { useApp } from './AppContextBase';

function handleError(msg, err) { console.error(msg, err); }

export default function CoreDataProviders({ children }) {
  const { recargarResumenFiados } = useApp();

  return (
    <ProductosProvider onError={handleError}>
      <VentasProvider onError={handleError} onRecargarFiados={recargarResumenFiados}>
        {children}
      </VentasProvider>
    </ProductosProvider>
  );
}
