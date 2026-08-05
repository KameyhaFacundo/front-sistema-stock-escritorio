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
        </div>
      ))}
    </div>
  );
}

export default EtiquetaPreview;
