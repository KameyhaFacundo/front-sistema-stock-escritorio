import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

const CM = 37.8;

const getValue = (campo, item) => {
  switch (campo.key) {
    case 'codigo': return `#${item.codigo || ''}`;
    case 'talle':  return item.talle || '';
    case 'nombre': return item.nombre || '';
    case 'precio': return `$${Number(item.precio || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
    default:       return '';
  }
};

// CODE128 (no solo EAN-13/numérico) para que también funcione con un código
// escaneado de fábrica, que puede traer letras — ver generarCodigoInterno()
// en Productos.jsx para el caso de un código generado por el sistema.
function CampoBarcode({ codigo, color }) {
  const svgRef = useRef(null);
  const sinCodigo = !codigo;

  useEffect(() => {
    if (sinCodigo || !svgRef.current) return;
    try {
      JsBarcode(svgRef.current, codigo, {
        format: 'CODE128', displayValue: false, margin: 0, height: 40, lineColor: color || '#000000',
      });
      // JsBarcode dibuja con un ancho/alto fijo en px — se lo pasa a un
      // viewBox y se sacan los atributos fijos para que el SVG escale con
      // el tamaño real del campo (el que el usuario le da en el editor).
      const svg = svgRef.current;
      const w = svg.getAttribute('width');
      const h = svg.getAttribute('height');
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      svg.removeAttribute('width');
      svg.removeAttribute('height');
    } catch {
      // Código con algún caracter que CODE128 no puede codificar — no debería
      // pasar en la práctica, pero no tiene que romper el resto de la etiqueta.
    }
  }, [codigo, color, sinCodigo]);

  if (sinCodigo) {
    return <span style={{ fontSize: 9, color: '#94a3b8' }}>Sin código</span>;
  }
  return <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />;
}

function EtiquetaPreview({ item, config }) {
  if (!config || !item) return null;

  const c      = config.config || config;
  const campos = c.campos || [];
  const fondo  = c.fondo  || '#ffffff';
  const borde  = c.borde  !== false;
  const lw     = (c.anchoCm || 4) * CM;
  const lh     = (c.altoCm  || 2.5) * CM;

  return (
    <div className="etiqueta-item" style={{
      width: lw, height: lh, backgroundColor: fondo,
      border: borde ? '1.5px solid #bdbdbd' : 'none',
      borderRadius: borde ? 5 : 0,
      overflow: 'hidden', boxSizing: 'border-box',
      position: 'relative', flexShrink: 0, display: 'block',
      pageBreakInside: 'avoid', breakInside: 'avoid',
    }}>
      {campos.filter(c => c.visible).map(campo => (
        <div key={campo.key} style={{
          position: 'absolute',
          left: campo.x * lw, top: campo.y * lh,
          width: campo.w * lw, height: campo.h * lh,
          backgroundColor: campo.bgColor || 'transparent',
          display: 'flex', alignItems: 'center',
          justifyContent: campo.align === 'center' ? 'center' : campo.align === 'right' ? 'flex-end' : 'flex-start',
          padding: '0 2px', boxSizing: 'border-box', overflow: 'hidden',
        }}>
          {campo.key === 'barcode' ? (
            <CampoBarcode codigo={item.codigoBarras} color={campo.color} />
          ) : (
            <span style={{
              fontSize: campo.fontSize || 9, fontWeight: campo.bold ? 700 : 400,
              color: campo.color || '#212121', textAlign: campo.align || 'left',
              lineHeight: 1.2, overflow: 'hidden',
              display: campo.key === 'nombre' ? '-webkit-box' : 'block',
              WebkitLineClamp: campo.key === 'nombre' ? 3 : undefined,
              WebkitBoxOrient: campo.key === 'nombre' ? 'vertical' : undefined,
              maxHeight: campo.key === 'nombre' ? `${(campo.fontSize || 10) * 1.2 * 3}px` : undefined,
              whiteSpace: campo.key === 'nombre' ? 'normal' : 'nowrap',
              width: '100%',
            }}>
              {getValue(campo, item)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export default EtiquetaPreview;
