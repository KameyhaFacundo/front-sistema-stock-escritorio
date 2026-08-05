import React, { useRef } from 'react';
import { CAMPOS_DEFAULT, CAMPO_LABELS, CAMPO_EJEMPLO } from './etiquetasConstants';
import ColorPickerPopover from './ColorPickerPopover';
import { Rnd } from 'react-rnd';
import { Box, Typography, Slider, IconButton, Tooltip } from '@mui/material';
import FormatBoldIcon          from '@mui/icons-material/FormatBold';
import FormatAlignLeftIcon     from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon   from '@mui/icons-material/FormatAlignCenter';
import FormatAlignRightIcon    from '@mui/icons-material/FormatAlignRight';
import VisibilityOffIcon       from '@mui/icons-material/VisibilityOff';
import VisibilityIcon          from '@mui/icons-material/Visibility';
import RestartAltIcon          from '@mui/icons-material/RestartAlt';
import { P } from '../../theme/tokens';

const CM = 37.8;

const ALIGNS = [
  ['left',   'Izquierda', FormatAlignLeftIcon  ],
  ['center', 'Centro',    FormatAlignCenterIcon],
  ['right',  'Derecha',   FormatAlignRightIcon ],
];

export default function EditorVisual({ campos, anchoCm, altoCm, fondo, borde, onChange }) {
  const [selected, setSelected] = React.useState(null);
  const canvasRef = useRef(null);
  const [canvasW, setCanvasW] = React.useState(370);

  React.useEffect(() => {
    if (!canvasRef.current) return;
    const ro = new ResizeObserver(e => setCanvasW(Math.floor(e[0].contentRect.width)));
    ro.observe(canvasRef.current);
    return () => ro.disconnect();
  }, []);

  const dimW   = anchoCm || 4;
  const dimH   = altoCm  || 2.5;
  const ratio  = dimH / dimW;
  const canvasH = Math.round(canvasW * ratio);
  const scaleX = canvasW / (dimW * CM);

  const toCanvasX = (pct) => pct * canvasW;
  const toCanvasY = (pct) => pct * canvasH;
  const toPctX    = (px)  => Math.min(1, Math.max(0, px / canvasW));
  const toPctY    = (py)  => Math.min(1, Math.max(0, py / canvasH));

  const update = (key, changes) =>
    onChange(campos.map(c => c.key === key ? { ...c, ...changes } : c));

  const sel = selected ? campos.find(c => c.key === selected) : null;

  return (
    <Box sx={{ px: 2, pt: 1.5, pb: 1.5 }}>
      <Typography sx={{ fontSize: '0.68rem', color: 'var(--muted)', mb: 1, textAlign: 'center' }}>
        Arrastrá los bloques · Redimensioná desde las esquinas · Clic para editar
      </Typography>

      <Box ref={canvasRef} onClick={() => setSelected(null)}
        sx={{
          position: 'relative', width: '100%', height: canvasH,
          bgcolor: fondo || '#ffffff',
          border: '1.5px solid', borderColor: borde ? '#bdbdbd' : '#e0e0e0',
          borderRadius: 1, overflow: 'hidden', userSelect: 'none',
          boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
        }}>
        {campos.map(campo => {
          if (!campo.visible) return null;
          const isSelected = selected === campo.key;
          const x  = toCanvasX(campo.x);
          const y  = toCanvasY(campo.y);
          const w  = toCanvasX(campo.w);
          const h  = toCanvasY(campo.h);
          const fs = (campo.fontSize || 9) * scaleX;

          return (
            <Rnd key={campo.key}
              position={{ x, y }} size={{ width: w, height: h }}
              minWidth={24} minHeight={10} bounds="parent"
              onDragStop={(e, d) => {
                // En touch, un simple tap dispara igual onDragStart/onDragStop
                // (con desplazamiento ~0) y el onClick de más abajo no siempre
                // llega a disparar — por eso si no hubo arrastre real, lo
                // tratamos como un tap para seleccionar el campo.
                const moved = Math.abs(d.x - x) > 3 || Math.abs(d.y - y) > 3;
                if (moved) update(campo.key, { x: toPctX(d.x), y: toPctY(d.y) });
                else setSelected(campo.key);
              }}
              onResizeStop={(e, dir, ref, delta, pos) =>
                update(campo.key, { x: toPctX(pos.x), y: toPctY(pos.y), w: toPctX(ref.offsetWidth), h: toPctY(ref.offsetHeight) })}
              style={{ zIndex: isSelected ? 10 : 1, boxSizing: 'border-box' }}
              onClick={(e) => { e.stopPropagation(); setSelected(campo.key); }}>
              <Box sx={{
                width: '100%', height: '100%', boxSizing: 'border-box',
                bgcolor: campo.bgColor || (isSelected ? `${P}18` : 'rgba(0,0,0,0.03)'),
                border: '1.5px solid', borderRadius: '2px',
                borderColor: isSelected ? P : 'rgba(0,0,0,0.18)',
                display: 'flex', alignItems: 'center', overflow: 'hidden',
                cursor: 'move', px: '2px',
                justifyContent: campo.align === 'center' ? 'center' : campo.align === 'right' ? 'flex-end' : 'flex-start',
              }}>
                <Typography component="span" sx={{
                  fontSize: fs, fontWeight: campo.bold ? 700 : 400,
                  color: campo.color || '#212121',
                  textAlign: campo.align || 'left', lineHeight: 1.15,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%',
                }}>
                  {CAMPO_EJEMPLO[campo.key]}
                </Typography>
              </Box>
            </Rnd>
          );
        })}
      </Box>

      {sel ? (
        <Box sx={{ mt: 1.5, p: 1.5, bgcolor: `${P}14`, borderRadius: 1.5, border: `1.5px solid ${P}40` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: P, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {CAMPO_LABELS[sel.key]}
            </Typography>
            <Tooltip title="Ocultar campo">
              <IconButton size="small" onClick={() => { update(sel.key, { visible: false }); setSelected(null); }}
                sx={{ p: '3px', color: '#e53935', '&:hover': { bgcolor: '#ffebee' }, border: '1px solid #ffcdd2', borderRadius: 1 }}>
                <VisibilityOffIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
          </Box>

          <Box sx={{ mb: 1 }}>
            <Typography sx={{ fontSize: '0.62rem', color: 'var(--muted)', mb: 0.2 }}>
              Tamaño texto: {sel.fontSize}px
            </Typography>
            <Slider size="small" min={5} max={28} value={sel.fontSize || 9}
              onChange={(_, v) => update(sel.key, { fontSize: v })}
              sx={{ color: P, py: 0.5 }} />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
            <Tooltip title="Negrita">
              <IconButton size="small" onClick={() => update(sel.key, { bold: !sel.bold })}
                sx={{ bgcolor: sel.bold ? P : '#fff', color: sel.bold ? '#fff' : '#757575', border: '1px solid', borderColor: sel.bold ? P : '#c5cae9', borderRadius: 1, p: '4px' }}>
                <FormatBoldIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>
            {ALIGNS.map(([a, label, Icon]) => (
              <Tooltip key={a} title={label}>
                <IconButton size="small" onClick={() => update(sel.key, { align: a })}
                  sx={{ bgcolor: sel.align === a ? P : '#fff', color: sel.align === a ? '#fff' : '#757575', border: '1px solid', borderColor: sel.align === a ? P : '#c5cae9', borderRadius: 1, p: '4px' }}>
                  <Icon sx={{ fontSize: 15 }} />
                </IconButton>
              </Tooltip>
            ))}
            <Box sx={{ width: '1px', height: 24, bgcolor: '#c5cae9', mx: 0.3 }} />
            <ColorPickerPopover label="Texto" value={sel.color || '#212121'} onChange={v => update(sel.key, { color: v || '#212121' })} allowNull={false} />
            <ColorPickerPopover label="Fondo" value={sel.bgColor || null} onChange={v => update(sel.key, { bgColor: v })} allowNull={true} />
          </Box>
        </Box>
      ) : (
        <Box sx={{ mt: 1.5, px: 1, py: 1, bgcolor: 'var(--hover)', borderRadius: 1, border: '1px dashed var(--border)', textAlign: 'center' }}>
          <Typography sx={{ fontSize: '0.68rem', color: 'var(--muted)' }}>
            Hacé clic en un bloque para editar sus propiedades
          </Typography>
        </Box>
      )}

      <Box sx={{ mt: 1.2, display: 'flex', alignItems: 'center', gap: 0.6, flexWrap: 'wrap' }}>
        {campos.filter(c => !c.visible).map(campo => (
          <Tooltip key={campo.key} title="Mostrar en la etiqueta">
            <Box onClick={() => { update(campo.key, { visible: true }); setSelected(campo.key); }}
              sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, px: 1, py: 0.4, border: '1px dashed var(--border)', borderRadius: 1, cursor: 'pointer', bgcolor: 'var(--input)', '&:hover': { bgcolor: `${P}14`, borderColor: P } }}>
              <VisibilityIcon sx={{ fontSize: 11, color: P }} />
              <Typography sx={{ fontSize: '0.68rem', color: P }}>+ {CAMPO_LABELS[campo.key]}</Typography>
            </Box>
          </Tooltip>
        ))}
        <Box sx={{ flex: 1 }} />
        <Tooltip title="Restaurar diseño por defecto">
          <IconButton size="small" onClick={() => { onChange(CAMPOS_DEFAULT); setSelected(null); }}
            sx={{ p: '4px', color: 'var(--muted)', '&:hover': { color: P, bgcolor: `${P}14` }, border: '1px solid var(--border)', borderRadius: 1 }}>
            <RestartAltIcon sx={{ fontSize: 15 }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}
