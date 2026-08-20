import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Box, Typography, TextField, Button, IconButton, Paper,
  CircularProgress, InputBase, useTheme, useMediaQuery,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PrintIcon from '@mui/icons-material/Print';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import SearchIcon from '@mui/icons-material/Search';
import LocalPrintshopIcon from '@mui/icons-material/LocalPrintshop';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import EtiquetaPreview from '../../components/Etiquetas/EtiquetaPreview';
import EditorPlantilla from '../../components/Etiquetas/EditorPlantilla';
import BarcodeScanner from '../../components/shared/BarcodeScanner';
import { productosService } from '../../services/productosService';
import { CAMPOS_DEFAULT } from '../../components/Etiquetas/etiquetasConstants';
import { BG, CARD, BORDER, INK, INK2, MUTED, P, P_HOVER, HOVER } from '../../theme/tokens';
import { useToast } from '../../context/ToastContext';
import { registerTour } from '../../utils/tour';
import AyudaButton from '../../components/shared/AyudaButton';

import './Etiquetas.css';

const CM      = 37.8;
const PAGE_W  = 21   * CM;
const PAGE_H  = 29.7 * CM;
const MARG    = 1    * CM;
const PRINT_W = 19   * CM;
const PRINT_H = 27.7 * CM;
const GAP     = 8;

const chunk = (arr, n) => { const o = []; for (let i = 0; i < arr.length; i += n) o.push(arr.slice(i, i + n)); return o; };
const lsGet = (key, fallback) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } };
const lsSet = (key, val)      => { try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* localStorage lleno o deshabilitado (modo privado) — ignorar */ } };

function PanelHeader({ step, title, subtitle, right }) {
  return (
    <Box sx={{ flexShrink: 0 }}>
      <Box sx={{ height: 3, background: `linear-gradient(90deg, ${P} 0%, ${P}80 65%, transparent 100%)` }} />
      <Box sx={{ px: { xs: 1.5, sm: 2 }, py: { xs: 1.1, sm: 1.4 }, borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 1.4 }}>
        <Box sx={{
          width: { xs: 26, sm: 28 }, height: { xs: 26, sm: 28 }, borderRadius: '50%', flexShrink: 0,
          background: `linear-gradient(135deg, ${P} 0%, ${P_HOVER} 100%)`,
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: { xs: '0.68rem', sm: '0.73rem' }, fontWeight: 800,
          boxShadow: `0 2px 8px ${P}59`,
        }}>
          {step}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800, fontSize: { xs: '0.82rem', sm: '0.9rem' }, lineHeight: 1.2, color: INK }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography sx={{ fontSize: { xs: '0.66rem', sm: '0.72rem' }, color: INK2, lineHeight: 1.3, mt: 0.15, display: 'block' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {right}
      </Box>
    </Box>
  );
}

function PaginaA4({ items, config, scale, numero, total }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
      {total > 1 && (
        <Box sx={{ display: 'inline-flex', alignItems: 'center', bgcolor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, px: 1.6, py: 0.4 }}>
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.68rem', fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase' }}>
            Página {numero} de {total}
          </Typography>
        </Box>
      )}
      <Box sx={{ position: 'relative', width: PAGE_W * scale, height: PAGE_H * scale, flexShrink: 0 }}>
        <Box sx={{
          position: 'absolute', top: 0, left: 0,
          width: PAGE_W, height: PAGE_H,
          bgcolor: '#fff',
          boxShadow: '0 4px 6px rgba(0,0,0,0.07), 0 12px 64px rgba(0,0,0,0.65), 0 0 0 1px rgba(0,0,0,0.05)',
          borderRadius: '2px',
          transformOrigin: 'top left',
          transform: `scale(${scale})`,
          p: `${MARG}px`,
          display: 'flex', flexWrap: 'wrap', alignContent: 'flex-start',
          gap: `${GAP}px`,
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}>
          {items.map((item, i) => <EtiquetaPreview key={i} item={item} config={config} />)}
        </Box>
      </Box>
    </Box>
  );
}

export default function Etiquetas() {
  const [searchText, setSearchText]       = useState('');
  const [resultados, setResultados]       = useState([]);
  const [buscando, setBuscando]           = useState(false);

  const [cola, setCola]                   = useState(() => lsGet('etq_cola', []));
  const [etiquetasCache, setEtiquetasCache] = useState(() => lsGet('etq_cache', {}));

  const [itemsEtiqueta, setItemsEtiqueta] = useState([]);
  const [plantillaActiva, setPlantillaActiva] = useState({
    config: { campos: CAMPOS_DEFAULT, anchoCm: 4, altoCm: 2.5, fondo: '#ffffff', borde: true },
  });
  const [panelW, setPanelW] = useState(600);
  const debounceRef  = useRef(null);
  const searchIdRef  = useRef(0);
  const scanIdRef    = useRef(0);
  const previewRef   = useRef(null);
  const toast        = useToast();
  const [openScanner, setOpenScanner] = useState(false);
  const theme        = useTheme();
  // 'md' (900px) es el corte que usa el resto de la app, pero acá no alcanza:
  // los paneles 1 y 2 son de ancho fijo (420px cada uno, ver Paper más abajo)
  // y no achican — con sidebar (268px) + ambos paneles + gaps, hace falta
  // más de 1500px de ancho real para que al panel 3 (Vista previa, flex:1,
  // sin ancho fijo) le quede lugar razonable. Por debajo de eso se achicaba
  // a una tira angosta con el texto partido letra por letra (se veía roto),
  // en vez de caer al layout con stepper de abajo que ya existía para mobile.
  const isNarrow     = useMediaQuery(theme.breakpoints.down(1500));
  const [mobileStep, setMobileStep] = useState(1);
  const [printReady, setPrintReady] = useState(false);

  useEffect(() => { lsSet('etq_cola',  cola);  }, [cola]);
  useEffect(() => { lsSet('etq_cache', etiquetasCache); }, [etiquetasCache]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      localStorage.removeItem('etq_cola');
      localStorage.removeItem('etq_cache');
    };
  }, []);

  useEffect(() => {
    if (!previewRef.current) return;
    const ro = new ResizeObserver(e => setPanelW(e[0].contentRect.width));
    ro.observe(previewRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    registerTour('/etiquetas', [
      { element: '[data-tour="etq-buscar"]',    title: 'Buscar productos',         description: 'Escribí un código o nombre para encontrar productos. Presioná Enter o hacé click en "Agregar" para sumarlos a la cola.' },
      { element: '[data-tour="etq-escanear"]',  title: 'Escanear código de barras', description: 'También podés usar la cámara para escanear un código de barras y agregar el producto automáticamente.' },
      {
        element: '[data-tour="etq-cola"]',      title: 'Cola de impresión',        description: 'Acá se acumulan los productos a imprimir. Podés ajustar la cantidad de copias de cada uno o eliminarlos.',
        // En mobile "Plantilla" y "Vista previa" viven detrás de un stepper que
        // oculta los paneles con display:none — sin esto el tour resalta un
        // elemento invisible (0x0) en vez del panel real.
        ...(isNarrow ? { beforeNext: '[data-tour="etq-step-2"]' } : {}),
      },
      {
        element: '[data-tour="etq-plantilla"]', title: 'Configurar plantilla',     description: 'Personalizá el diseño: tamaño en cm, colores, bordes y la posición de cada campo arrastrándolo en el editor visual.',
        ...(isNarrow ? { beforePrev: '[data-tour="etq-step-1"]', beforeNext: '[data-tour="etq-step-3"]' } : {}),
      },
      {
        element: '[data-tour="etq-preview"]',   title: 'Vista previa de impresión', description: 'Así se verán las etiquetas en la hoja A4. Las páginas se calculan automáticamente según el tamaño de etiqueta.',
        ...(isNarrow ? { beforePrev: '[data-tour="etq-step-2"]' } : {}),
      },
      { element: '[data-tour="etq-imprimir"]',  title: 'Imprimir',                 description: 'Cuando esté todo listo, hacé click acá para imprimir todas las etiquetas.' },
    ]);
  }, [isNarrow]);

  useEffect(() => {
    const items = [];
    cola.forEach(lt => {
      const info = etiquetasCache[lt.id];
      if (info) for (let i = 0; i < lt.copias; i++) items.push(info);
    });
    setItemsEtiqueta(items);
  }, [cola, etiquetasCache]);

  const cfg    = plantillaActiva?.config || {};
  const lw     = cfg.anchoCm || 4;
  const lh     = cfg.altoCm  || 2.5;
  const perRow  = Math.max(1, Math.floor((PRINT_W + GAP) / (lw * CM + GAP)));
  const perCol  = Math.max(1, Math.floor((PRINT_H + GAP) / (lh * CM + GAP)));
  const perPage = perRow * perCol;
  const pages   = itemsEtiqueta.length > 0 ? chunk(itemsEtiqueta, perPage) : [];
  const scale   = Math.min(1, (panelW - 48) / PAGE_W);
  const total   = cola.reduce((a, t) => a + t.copias, 0);

  const handleSearch = (val) => {
    setSearchText(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim()) { setResultados([]); return; }
    const id = ++searchIdRef.current;
    debounceRef.current = setTimeout(async () => {
      setBuscando(true);
      try {
        const data = await productosService.getAll({ search: val.trim(), per_page: 50 });
        if (id !== searchIdRef.current) return;
        setResultados(data);
      } catch { if (id === searchIdRef.current) setResultados([]); }
      finally { if (id === searchIdRef.current) setBuscando(false); }
    }, 300);
  };

  const agregarProducto = async (prod) => {
    const info = {
      id:      prod.id,
      nombre:  prod.nombre,
      codigo:  prod.codigo || `PROD-${prod.id}`,
      codigoBarras: prod.codigoBarras || '',
      precio:  prod.precioFinal || 0,
      talle:   prod.talle || '',
    };
    setCola(prev => {
      const existe = prev.find(t => t.id === prod.id);
      if (existe) return prev.map(t => t.id === prod.id ? { ...t, copias: t.copias + 1 } : t);
      return [...prev, { id: prod.id, copias: 1 }];
    });
    setEtiquetasCache(prev => ({ ...prev, [prod.id]: info }));
  };

  const quitarProducto = (id) => setCola(p => p.filter(t => t.id !== id));
  const cambiarCopias  = (id, val) => {
    const n = Math.max(1, Number(val) || 1);
    setCola(p => p.map(t => t.id === id ? { ...t, copias: n } : t));
  };

  const prevTitleRef = useRef('');

  const handlePrint = () => {
    prevTitleRef.current = document.title;
    document.title = '';
    setPrintReady(true);
  };

  // window.print() no puede llamarse en el mismo tick que setPrintReady(true)
  // — React todavía no montó el portal de las etiquetas (createPortal más
  // abajo), así que el diálogo de impresión se abría con la página en blanco
  // (PDF vacío al "Guardar como PDF"). Se espera al efecto (ya corre después
  // del commit) y encima a un frame pintado, para asegurar que el navegador
  // ya renderizó el contenido antes de abrir el diálogo.
  useEffect(() => {
    if (!printReady) return;
    const afterPrint = () => {
      document.title = prevTitleRef.current;
      setPrintReady(false);
      window.removeEventListener('afterprint', afterPrint);
    };
    window.addEventListener('afterprint', afterPrint);
    const id = requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
    return () => cancelAnimationFrame(id);
  }, [printReady]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: BG }}>
      <Box sx={{
        position: 'relative', flexShrink: 0, bgcolor: BG,
        px: { xs: 1.5, sm: 3 }, pt: { xs: 1.5, sm: 2 }, pb: { xs: 1, sm: 1.4 },
        display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 },
      }}>
        {/* Gradiente de acento — mismo detalle que el header del resto de las páginas */}
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${P} 0%, ${P}80 65%, transparent 100%)` }} />
        <Box sx={{
          width: { xs: 34, sm: 40 }, height: { xs: 34, sm: 40 }, borderRadius: 2.5,
          bgcolor: `${P}16`,
          border: `1px solid ${P}25`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <LocalPrintshopIcon sx={{ color: P, fontSize: { xs: 18, sm: 22 } }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800, fontSize: { xs: '0.86rem', sm: '1.05rem' }, color: INK, lineHeight: 1.15, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Impresión de Etiquetas
          </Typography>
          <Typography sx={{ display: { xs: 'none', sm: 'block' }, fontSize: '0.75rem', color: MUTED, mt: 0.25 }}>
            Seleccioná productos · Configurá la plantilla · Imprimí
          </Typography>
        </Box>

        {total > 0 && (
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 1.2, mr: 1 }}>
            {[
              { val: cola.length,       label: 'productos' },
              { val: total,             label: 'etiquetas' },
              { val: pages.length,      label: `página${pages.length !== 1 ? 's' : ''}` },
            ].map(({ val, label }) => (
              <Box key={label} sx={{
                textAlign: 'center',
                bgcolor: HOVER,
                border: `1px solid ${BORDER}`,
                borderRadius: 1.5, px: 1.4, py: 0.5,
              }}>
                <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: INK, lineHeight: 1 }}>{val}</Typography>
                <Typography sx={{ fontSize: '0.62rem', color: MUTED, letterSpacing: 0.2 }}>{label}</Typography>
              </Box>
            ))}
          </Box>
        )}

        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
          <AyudaButton />
        </Box>

        <Button
          data-tour="etq-imprimir"
          variant="contained" startIcon={<PrintIcon />}
          onClick={handlePrint} disabled={total === 0}
          sx={{
            bgcolor: P, color: '#fff',
            '&:hover': { bgcolor: P_HOVER },
            fontWeight: 700, borderRadius: 2, minWidth: 0, px: { xs: 1.4, sm: 2.5 },
            boxShadow: total > 0 ? `0 2px 16px ${P}40` : 'none',
            transition: 'all 0.2s',
          }}
        >
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Imprimir</Box>
          {total > 0 && <Box component="span" sx={{ ml: { xs: 0, sm: 0.4 } }}>{`(${total})`}</Box>}
        </Button>
      </Box>

      {isNarrow && (
        <Box sx={{
          flexShrink: 0, display: 'flex', gap: 0.7, px: 1.2, py: 0.9,
          borderBottom: `1px solid ${BORDER}`, bgcolor: CARD,
        }}>
          {[
            { n: 1, label: 'Buscar' },
            { n: 2, label: 'Plantilla' },
            { n: 3, label: 'Vista previa' },
          ].map(({ n, label }) => (
            <Box key={n} data-tour={`etq-step-${n}`} onClick={() => setMobileStep(n)}
              sx={{
                flex: 1, textAlign: 'center', py: 0.7, borderRadius: 1.5,
                fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                bgcolor: mobileStep === n ? P : HOVER,
                color: mobileStep === n ? '#fff' : MUTED,
                border: `1px solid ${mobileStep === n ? P : BORDER}`,
                transition: 'all 0.15s',
              }}>
              {n}. {label}
            </Box>
          ))}
        </Box>
      )}

      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: isNarrow ? 'column' : 'row', overflow: 'hidden', p: { xs: 1, sm: 1.5 }, gap: 1.5 }}>

        {/* PASO 1: Buscar productos */}
        <Paper elevation={0} sx={{
          width: isNarrow ? '100%' : 420,
          flex: isNarrow ? 1 : '0 0 auto',
          display: isNarrow ? (mobileStep === 1 ? 'flex' : 'none') : 'flex',
          flexDirection: 'column',
          borderRadius: 2.5, overflow: 'hidden', border: `1px solid ${BORDER}`,
          boxShadow: `0 2px 16px ${P}12`, bgcolor: CARD,
        }}>
          <PanelHeader step="1" title="Buscar productos" subtitle="Click o Enter en un producto para agregarlo" />

          <Box data-tour="etq-buscar" sx={{ px: 1.5, py: 1.2, borderBottom: `1px solid ${BORDER}`, bgcolor: BG }}>
            <TextField size="small" fullWidth placeholder="Código o descripción..."
              value={searchText} onChange={e => handleSearch(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.isComposing && searchText.trim()) {
                  e.preventDefault();
                  if (resultados.length > 0) {
                    agregarProducto(resultados[0]);
                  } else {
                    toast('No se encontraron productos para agregar', 'info');
                  }
                }
              }}
              InputProps={{
                startAdornment: <SearchIcon sx={{ fontSize: 17, color: MUTED, mr: 0.5 }} />,
                endAdornment: (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {buscando && <CircularProgress size={14} sx={{ color: P }} />}
                    <IconButton data-tour="etq-escanear" size="small" onClick={() => setOpenScanner(true)} sx={{ p: 0.3, borderRadius: 1, color: MUTED, '&:hover': { color: P } }}>
                      <CameraAltIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Box>
                ),
              }} />
          </Box>

          <Box sx={{ flex: 1, overflow: 'auto', px: 1.2, py: 1 }}>
            {!searchText && (
              <Box sx={{ textAlign: 'center', mt: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: `${P}14`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <SearchIcon sx={{ fontSize: 28, color: P }} />
                </Box>
                <Typography sx={{ color: MUTED, fontSize: '0.82rem', fontWeight: 500 }}>Escribí para buscar</Typography>
              </Box>
            )}
            {searchText && !buscando && resultados.length === 0 && (
              <Box sx={{ textAlign: 'center', mt: 5 }}>
                <Typography sx={{ color: MUTED, fontStyle: 'italic', fontSize: '0.82rem' }}>Sin resultados</Typography>
              </Box>
            )}

            {resultados.map(prod => (
              <Box key={prod.id} onClick={() => agregarProducto(prod)}
                sx={{
                  mb: 0.6, px: 1.4, py: 0.9, borderRadius: 1.5, cursor: 'pointer',
                  border: `1px solid ${BORDER}`, bgcolor: CARD,
                  display: 'flex', alignItems: 'center',
                  borderLeft: `3px solid ${P}40`,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  transition: 'all 0.18s',
                  '&:hover': { bgcolor: HOVER, borderColor: P, borderLeftColor: P, boxShadow: `0 3px 14px ${P}20`, transform: 'translateX(1px)' },
                }}>
                <Box sx={{ flex: 1, overflow: 'hidden' }}>
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', bgcolor: `${P}14`, px: 0.7, py: 0.1, borderRadius: 0.8, mb: 0.3 }}>
                    <Typography sx={{ fontSize: '0.59rem', color: P, fontFamily: 'monospace', fontWeight: 700, lineHeight: 1.5 }}>
                      {prod.codigo}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: INK, display: 'block' }}>
                    {prod.nombre}
                  </Typography>
                </Box>
                <Box sx={{ bgcolor: P, color: '#fff', px: 1.2, py: 0.4, borderRadius: 1, fontSize: '0.7rem', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
                  Agregar
                </Box>
              </Box>
            ))}
          </Box>

          {/* Cola de impresión */}
          <Box data-tour="etq-cola" sx={{ borderTop: `1px solid ${BORDER}`, bgcolor: HOVER }}>
            <Box sx={{ px: 2, pt: 1.2, pb: 0.8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                <AddShoppingCartIcon sx={{ fontSize: 14, color: P }} />
                <Typography sx={{ fontWeight: 700, color: P, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  Cola de impresión
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {total > 0 && (
                  <>
                    <IconButton size="small" onClick={() => { setCola([]); setEtiquetasCache({}); }} sx={{ p: '2px', color: MUTED, '&:hover': { color: '#e53935' } }}>
                      <DeleteIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                    <Box sx={{ bgcolor: P, color: '#fff', px: 1.3, py: 0.2, borderRadius: 10, fontSize: '0.67rem', fontWeight: 700, boxShadow: `0 2px 8px ${P}4d` }}>
                      {total} etiqueta{total !== 1 ? 's' : ''}
                    </Box>
                  </>
                )}
              </Box>
            </Box>

            {cola.length === 0 ? (
              <Typography sx={{ display: 'block', px: 2, pb: 1.5, color: MUTED, fontStyle: 'italic', fontSize: '0.77rem' }}>
                Sin productos seleccionados
              </Typography>
            ) : (
              <Box sx={{ maxHeight: 200, overflow: 'auto', px: 1.5, pb: 1.5, display: 'flex', flexDirection: 'column', gap: 0.4 }}>
                {cola.map(item => {
                  const info = etiquetasCache[item.id];
                  return (
                    <Box key={item.id} sx={{
                      display: 'flex', alignItems: 'center', gap: 0.5,
                      px: 1, py: 0.6, borderRadius: 1.5,
                      bgcolor: CARD, border: `1px solid ${BORDER}`,
                      borderLeft: `3px solid ${P}60`,
                      '&:hover': { borderLeftColor: P, boxShadow: `0 2px 8px ${P}1a` },
                    }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.73rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: INK }}>
                          {info?.nombre || `Producto #${item.id}`}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', border: `1px solid ${BORDER}`, borderRadius: 1, bgcolor: HOVER, flexShrink: 0 }}>
                        <IconButton size="small" onClick={() => cambiarCopias(item.id, item.copias - 1)} sx={{ borderRadius: 0, p: '2px', color: P }}>
                          <RemoveIcon sx={{ fontSize: 11 }} />
                        </IconButton>
                        <InputBase type="number" inputProps={{ min: 1, style: { textAlign: 'center', padding: 0 } }}
                          value={item.copias} onChange={(e) => cambiarCopias(item.id, e.target.value)}
                          sx={{ width: 26, mx: 0.3, fontWeight: 700, fontSize: '0.75rem', color: P }} />
                        <IconButton size="small" onClick={() => cambiarCopias(item.id, item.copias + 1)} sx={{ borderRadius: 0, p: '2px', color: P }}>
                          <AddIcon sx={{ fontSize: 11 }} />
                        </IconButton>
                      </Box>
                      <IconButton size="small" onClick={() => quitarProducto(item.id)} sx={{ p: '2px', color: MUTED, '&:hover': { color: '#e53935' }, flexShrink: 0 }}>
                        <DeleteIcon sx={{ fontSize: 13 }} />
                      </IconButton>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        </Paper>

        {/* PASO 2: Plantilla */}
        <Paper data-tour="etq-plantilla" elevation={0} sx={{
          width: isNarrow ? '100%' : 420,
          flex: isNarrow ? 1 : '0 0 auto',
          minHeight: 0,
          display: isNarrow ? (mobileStep === 2 ? 'flex' : 'none') : 'flex',
          flexDirection: 'column',
          borderRadius: 2.5, overflow: 'hidden', border: `1px solid ${BORDER}`,
          boxShadow: `0 2px 16px ${P}12`, bgcolor: CARD,
        }}>
          <PanelHeader step="2" title="Configurar plantilla" subtitle="Personalizá el diseño de cada etiqueta" />
          <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* key: en mobile este panel arranca oculto (display:none) hasta
                tocar la pestaña "2. Plantilla" — el canvas mide su ancho con
                ResizeObserver y los bloques arrastrables (react-rnd) se
                posicionan según esa medida. Sin forzar un remount fresco al
                entrar a la pestaña, algunos bloques quedan con la medida
                vieja (0 o incorrecta) de cuando el panel todavía no se veía. */}
            <EditorPlantilla key={isNarrow ? mobileStep : 'desktop'}
              plantillaActiva={plantillaActiva} onPlantillaChange={setPlantillaActiva} />
          </Box>
        </Paper>

        {/* PASO 3: Vista previa */}
        <Paper data-tour="etq-preview" elevation={0} sx={{
          flex: 1,
          display: isNarrow ? (mobileStep === 3 ? 'flex' : 'none') : 'flex',
          flexDirection: 'column',
          borderRadius: 2.5, overflow: 'hidden', border: `1px solid ${BORDER}`,
          boxShadow: `0 2px 16px ${P}12`, bgcolor: CARD,
        }}>
          <PanelHeader
            step="3" title="Vista previa de impresión"
            subtitle={pages.length > 0 ? `${perRow}×${perCol} por hoja · ${total} total · ${pages.length} página${pages.length !== 1 ? 's' : ''}` : 'Agregá productos para ver el preview'}
          />

          <Box ref={previewRef} sx={{
            flex: 1, overflow: 'auto',
            bgcolor: '#1e2a35',
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.045) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            p: 3,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
          }}>
            {pages.length > 0 ? (
              pages.map((pageItems, pi) => (
                <PaginaA4 key={pi} items={pageItems} config={plantillaActiva} scale={scale} numero={pi + 1} total={pages.length} />
              ))
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, mt: 8 }}>
                <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LocalPrintshopIcon sx={{ fontSize: 42, color: 'rgba(255,255,255,0.22)' }} />
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography sx={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.9rem', fontWeight: 500 }}>
                    Sin etiquetas para mostrar
                  </Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.74rem', mt: 0.5 }}>
                    Buscá un producto y agregalo en el paso 1
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>

      <BarcodeScanner
        open={openScanner}
        onClose={() => setOpenScanner(false)}
        onScan={async (code) => {
          const id = ++scanIdRef.current;
          try {
            const data = await productosService.getAll({ search: code.trim(), per_page: 5 });
            if (id !== scanIdRef.current) return;
            if (data && data.length > 0) {
              agregarProducto(data[0]);
              toast(`Producto escaneado: ${data[0].nombre}`, 'success');
            } else {
              toast(`No se encontró producto con código: ${code}`, 'error');
            }
          } catch {
            if (id === scanIdRef.current) toast('Error al buscar el producto escaneado', 'error');
          }
        }}
      />

      {printReady && createPortal(
        <div className="etiquetas-print-area">
          {pages.map((pageItems, pi) => (
            <div key={pi} className="print-page">
              {pageItems.map((item, i) => <EtiquetaPreview key={`${item.id}-${i}`} item={item} config={plantillaActiva} />)}
            </div>
          ))}
        </div>,
        document.body
      )}
    </Box>
  );
}
