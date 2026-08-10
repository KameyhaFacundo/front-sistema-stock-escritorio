import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  Box, Typography, TextField, Button, InputAdornment, IconButton,
  Dialog, DialogContent, Autocomplete, Select, MenuItem, FormControl, Chip, Collapse, Tooltip,
  Table, TableHead, TableBody, TableRow, TableCell,
} from '@mui/material';
import SearchIcon       from '@mui/icons-material/Search';
import FilterListIcon   from '@mui/icons-material/FilterList';
import AddIcon          from '@mui/icons-material/Add';
import CloseIcon        from '@mui/icons-material/Close';
import AutoAwesomeIcon  from '@mui/icons-material/AutoAwesome';
import CheckroomIcon    from '@mui/icons-material/Checkroom';
import CameraAltIcon    from '@mui/icons-material/CameraAlt';
import CalculateIcon    from '@mui/icons-material/Calculate';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ReceiptLongIcon  from '@mui/icons-material/ReceiptLong';
import OpenInNewIcon    from '@mui/icons-material/OpenInNew';
import BlockIcon        from '@mui/icons-material/Block';
import VisibilityIcon   from '@mui/icons-material/Visibility';
import EditIcon         from '@mui/icons-material/Edit';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import TableChartIcon   from '@mui/icons-material/TableChart';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import BarcodeScanner   from '../../components/shared/BarcodeScanner';
import ConfirmDialog    from '../../components/shared/ConfirmDialog';

import {
  BG, CARD, BORDER, INK, INK2, MUTED, P, P_HOVER, HOVER, TABLE_HEADER, DROPDOWN, INPUT,
  fieldSx, selectSx as selectFieldSx,
  SUCCESS_BG, SUCCESS_BORDER, SUCCESS_LIGHT,
  ERROR, ERROR_BG, ERROR_BORDER, WARNING, modalPaperSx,
} from '../../theme/tokens';
import { useToast }   from '../../context/ToastContext';
import { useAuth }    from '../../auth/AuthContextBase';
import useHasPermiso  from '../../hooks/useHasPermiso';
import { useProductos } from '../../context/ProductosContextBase';
import { productosService } from '../../services/productosService';
import useBusquedaProductos from '../../hooks/useBusquedaProductos';
import { fmtMoney, fmtDate, toLocalDateStr } from '../../utils/format';
import { exportarExcel } from '../../utils/excelExport';
import { PRIMARY_COLOR, COMPANY_NAME } from '../../config/brand';
import { pendientesViejas as calcularPendientesViejas } from '../../utils/comprasPendientes';
import DataTable      from '../../components/shared/DataTable';
import TablePagination from '../../components/shared/TablePagination';
import AyudaButton     from '../../components/shared/AyudaButton';
import CampoPrecio     from '../../components/shared/CampoPrecio';
import { registerTour } from '../../utils/tour';
import { useIsMobile } from '../../utils/responsive';
import { esFraccionable, abrevUnidad, UNIDAD_LABEL } from '../../utils/unidadMedida';
import { comprasService }    from '../../services/comprasService';
import { proveedoresService } from '../../services/proveedoresService';
import { categoriasService } from '../../services/categoriasService';
import iaService             from '../../services/iaService';
import usePlan                from '../../hooks/usePlan';
import EscanearModal from './EscanearModal';
import ImportarExcelModal from './ImportarExcelModal';
import { ModalNuevoProveedor } from '../Proveedores/Proveedores';
import { NuevoProducto } from '../Productos/Productos';

const ESTADOS = ['pendiente', 'confirmada', 'cancelada'];
const ESTADO_COLORS = {
  confirmada: { bg: SUCCESS_BG, fg: SUCCESS_LIGHT, border: SUCCESS_BORDER },
  pendiente:  { bg: '#f59e0b22', fg: '#fbbf24', border: '#f59e0b44' },
  cancelada:  { bg: ERROR_BG, fg: ERROR, border: ERROR_BORDER },
};
const METODO_LABELS = { efectivo: 'Efectivo', tarjeta: 'Tarjeta', transferencia: 'Transferencia', cuenta_corriente: 'Cuenta Corriente' };

function FieldLabel({ children, required }) {
  return (
    <Typography component="label" sx={{ color: INK2, fontSize: 13, fontWeight: 500, mb: 0.75 }}>
      {children}{required && <Box component="span" sx={{ color: P }}> *</Box>}
    </Typography>
  );
}

// Aviso de que este producto tiene OTROS proveedores — configurados en la
// ficha del producto (principal/alternativos, con costo propio si se
// cargó) y/o de compras anteriores — se muestra antes de confirmar la
// compra, para decidir si conviene más comprarlo en otro lado (ver
// sugerirCostoDeHistorial en ModalNuevaCompra).
function ComparativaProveedoresChip({ comparativa }) {
  if (!comparativa?.length) return null;
  return (
    <Tooltip title={
      <Box sx={{ py: 0.25 }}>
        <Typography sx={{ fontSize: 12, fontWeight: 700, mb: 0.5 }}>Otros proveedores de este producto:</Typography>
        {comparativa.map(c => (
          <Typography key={c.idProveedor} sx={{ fontSize: 12 }}>
            {c.proveedorNombre}: {c.precioCompra != null ? fmtMoney(c.precioCompra) : 'sin costo cargado'}
          </Typography>
        ))}
      </Box>
    }>
      <IconButton size="small" sx={{ color: WARNING, p: '2px', mb: '2px', '&:hover': { bgcolor: `${WARNING}18` } }}>
        <CompareArrowsIcon sx={{ fontSize: 14 }} />
      </IconButton>
    </Tooltip>
  );
}

// Visor del ticket adjunto en un modal in-app — antes era un <a target="_blank">
// que en el empaquetado de escritorio abre el navegador del sistema en vez de
// mostrarlo (setWindowOpenHandler de Electron externaliza cualquier http(s)://).
function ModalVerComprobante({ open, onClose, url }) {
  if (!url) return null;
  const esPdf = /\.pdf(\?|$)/i.test(url);
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: modalPaperSx }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 2, borderBottom: `1px solid ${BORDER}` }}>
        <Typography sx={{ color: INK, fontWeight: 700, fontSize: 16 }}>Ticket del proveedor</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title="Abrir en el navegador">
            <IconButton size="small" component="a" href={url} target="_blank" rel="noopener noreferrer"
              sx={{ color: MUTED, '&:hover': { color: P } }}>
              <OpenInNewIcon sx={{ fontSize: 17 }} />
            </IconButton>
          </Tooltip>
          <IconButton size="small" onClick={onClose} sx={{ color: MUTED, '&:hover': { color: INK } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
      <Box sx={{ bgcolor: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {esPdf
          ? <Box component="iframe" src={url} sx={{ width: '100%', height: '75vh', border: 'none' }} />
          : <Box component="img" src={url} alt="Ticket del proveedor" sx={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain' }} />
        }
      </Box>
    </Dialog>
  );
}

// Autocomplete de una línea de compra — busca contra el backend (no un array
// local con todo el catálogo cargado en memoria) y expande productos con
// variantes en una opción por talle, igual que hacía productosComprables
// antes. El "__crear__" pseudo-resultado deja crear un producto nuevo desde
// acá mismo cuando no existe todavía en el catálogo.
function AutocompleteLineaProducto({ productoData, error, sx, autoFocus, onSeleccionar, onCrear, onEnterKeyDown, registrarInputRef }) {
  const [query, setQuery] = useState(productoData?.nombre || '');
  const { resultados } = useBusquedaProductos(query, { perPage: 20 });

  const disponibles = useMemo(() => resultados
    .filter(p => !p.esCombo)
    .flatMap(p => p.tieneVariantes
      ? p.variantes.map(v => ({ ...p, id: v.id, nombre: `${p.nombre} — Talle ${v.talle}`, codigo: v.codigo, codigoBarras: v.codigoBarras, talle: v.talle, tieneVariantes: false }))
      : [p]),
  [resultados]);

  return (
    <Autocomplete
      options={disponibles}
      value={productoData ?? null}
      getOptionLabel={(opt) => opt.nombre || ''}
      isOptionEqualToValue={(opt, val) => opt.id === val?.id}
      inputValue={query}
      onInputChange={(_, v) => setQuery(v)}
      filterOptions={(options, { inputValue }) => {
        const q = inputValue.trim().toLowerCase();
        if (!q) return options;
        const f = [...options];
        if (!options.find(o => o.nombre.toLowerCase() === q)) f.push({ id: '__crear__', nombre: inputValue, _crear: true });
        return f;
      }}
      onChange={(_, val) => {
        if (!val) { onSeleccionar(null); setQuery(''); return; }
        if (val._crear) { onCrear(val.nombre); return; }
        onSeleccionar(val);
        setQuery(val.nombre);
      }}
      renderOption={(props, opt) => <li {...props} key={props.key}>{opt._crear ? <Typography sx={{ color: P, fontWeight: 600, fontSize: 13 }}>+ Crear {opt.nombre}</Typography> : <Box><Typography sx={{ fontSize: 13, color: INK }}>{opt.nombre}</Typography>{opt.codigo && <Typography sx={{ fontSize: 11, color: MUTED }}>{opt.codigo}</Typography>}</Box>}</li>}
      renderInput={(params) => (
        <TextField {...params} autoFocus={autoFocus}
          inputRef={registrarInputRef ? (el => { params.inputRef?.(el); registrarInputRef(el); }) : params.inputRef}
          onKeyDown={onEnterKeyDown ? (e => onEnterKeyDown(e, query)) : params.inputProps?.onKeyDown}
          placeholder="Buscar producto..." error={error}
          sx={{ ...fieldSx, '& .MuiInputBase-root': { bgcolor: 'transparent', '& .MuiInputBase-input': { py: '7px', px: '10px', fontSize: 13, color: INK, '&::placeholder': { color: MUTED, opacity: 0.6 } } }, ...sx }} />
      )}
      slotProps={{ paper: { sx: { bgcolor: DROPDOWN, border: `1px solid ${BORDER}`, '& .MuiAutocomplete-option': { color: INK, '&:hover, &[aria-selected=true]': { bgcolor: HOVER } } } } }}
      noOptionsText={<Typography sx={{ color: MUTED, fontSize: 12 }}>Sin resultados</Typography>}
      sx={{ width: '100%' }}
    />
  );
}

function ModalNuevaCompra({ open, onClose, onCreate, onUpdate, proveedores, initialData, editId, crearProducto }) {
  const toast = useToast();
  const isMobile = useIsMobile();
  const { tieneIA } = usePlan();
  const { user } = useAuth();
  // "Comprar por curva" es específico de indumentaria (compra por talles) —
  // antes se mostraba/ocultaba mirando si ALGÚN producto del array local
  // tenía variantes; con el catálogo completo ya no cargado en memoria, el
  // rubro de la empresa es la señal correcta (el modal igual maneja el caso
  // de cero productos con talles, mostrando su propio estado vacío).
  const esIndumentaria = user?.empresa?.tipo === 'indument';
  const empty = { id_proveedor: '', lineas: [{ id_producto: '', cantidad: 1, precio_compra: '', precio_venta: '', margen: 10, fecha_vencimiento: '' }], fecha: toLocalDateStr(), estado: 'pendiente', metodo_pago: 'efectivo' };
  // La mayoría de las compras son a los mismos 2-3 proveedores de siempre —
  // arrancar con el último usado en vez de vacío ahorra un paso en el caso
  // común. Se actualiza al registrar una compra nueva (ver handleRegistrar).
  const ULTIMO_PROVEEDOR_KEY = 'kamex_ultimo_proveedor_compra';
  const emptyConProveedorRecordado = () => ({ ...empty, id_proveedor: localStorage.getItem(ULTIMO_PROVEEDOR_KEY) || '' });
  const [form,         setForm]         = useState(emptyConProveedorRecordado);
  const [errors,       setErrors]       = useState({});
  const [saving,       setSaving]       = useState(false);
  const [categorias,   setCategorias]   = useState([]);
  const [nuevoProd,       setNuevoProd]       = useState({ active: false, idx: null, nombre: '' });
  // Ticket del proveedor — si ya existe la compra (edición) se sube al toque;
  // si es alta nueva, se guarda el archivo acá y se sube recién después de
  // crear la compra (todavía no hay id contra el cual subirlo).
  const [comprobanteUrl,       setComprobanteUrl]       = useState(null);
  const [comprobanteFile,      setComprobanteFile]      = useState(null);
  const [subiendoComprobante,  setSubiendoComprobante]  = useState(false);
  const [verTicketOpen,   setVerTicketOpen]   = useState(false);
  const [sugiriendoIdx,   setSugiriendoIdx]   = useState(null);
  const [scannerLineaIdx, setScannerLineaIdx] = useState(null);
  const [modalCurva,      setModalCurva]      = useState(false);
  // "Cargar por monto total" — para productos fraccionables (kg/metro/litro)
  // comprados en bulto: tipeás lo que pagaste en total y la cantidad de la
  // línea, y calcula el costo por unidad solo (evita la división a mano).
  const [calcularLineaIdx, setCalcularLineaIdx] = useState(null);
  const [calcularTotal,    setCalcularTotal]    = useState('');
  // Si el producto de esta línea se le compró antes a OTROS proveedores
  // (no el elegido para esta compra), se guarda acá esa comparación —
  // así se ve antes de confirmar si conviene más comprarlo a otro lado.
  // idx -> [{ idProveedor, proveedorNombre, precioCompra }] ordenado de
  // más barato a más caro, ver sugerirCostoDeHistorial().
  const [comparativas, setComparativas] = useState({});
  const cantRefs = useRef({});
  const autoRefs = useRef({});
  const proveedorRef = useRef(null);
  // Casi ningún producto de ferretería tiene vencimiento — mostrar esa fecha
  // siempre en cada línea es ruido para el caso común. Arranca oculta detrás
  // de un ícono; se muestra sola si la línea ya trae una fecha cargada (ej.
  // al editar una compra existente que sí tenía vencimiento).
  const [vencAbiertos, setVencAbiertos] = useState(() => new Set());
  const vencVisible = (idx, l) => vencAbiertos.has(idx) || !!l.fecha_vencimiento;
  const toggleVenc = (idx) => setVencAbiertos(prev => {
    const next = new Set(prev);
    next.has(idx) ? next.delete(idx) : next.add(idx);
    return next;
  });
  // Si ya hay proveedor (recordado o de una edición/escaneo), no tiene
  // sentido pedirlo nuevo — el siguiente paso lógico es cargar productos.
  // Si no, el proveedor es obligatorio y es lo primero que hay que elegir.
  const enfocarAlAbrir = () => {
    if (form.id_proveedor) autoRefs.current[0]?.focus();
    else proveedorRef.current?.focus();
  };
  // Solo ferretería puede tener productos en kg/metro/litro — para el resto
  // unidadMedida siempre es 'unidad' y esto no cambia el mínimo de 1 de hoy.
  // Cada línea guarda el producto completo elegido (productoData) en vez de
  // resolverlo por id contra un array local — el catálogo entero ya no vive
  // en memoria, así que el id solo no alcanza para saber su unidad/nombre.
  const unidadDeLinea = (l) => l.productoData?.unidadMedida || 'unidad';

  // Proveedores YA CONFIGURADOS en el producto (principal + alternativos, ver
  // ProveedoresAlternativosEditor en Productos.jsx) — a diferencia del
  // historial de abajo, estos sirven aunque nunca se le haya comprado antes
  // a ese proveedor puntual (es justo el caso de un alternativo recién cargado).
  const proveedoresConfigurados = (producto, idProveedorActual) => {
    const lista = [];
    if (producto.id_proveedor && producto.id_proveedor !== idProveedorActual && producto.proveedor) {
      lista.push({ idProveedor: producto.id_proveedor, proveedorNombre: `${producto.proveedor} (principal)`, precioCompra: producto.costo > 0 ? producto.costo : null });
    }
    for (const pa of producto.proveedoresAlternativos || []) {
      if (pa.id === idProveedorActual) continue;
      lista.push({ idProveedor: pa.id, proveedorNombre: pa.nombre, precioCompra: pa.costo });
    }
    return lista;
  };

  // Si ya se le compró este producto antes a ESTE proveedor, sugiere el
  // último precio pagado en vez de que el usuario tenga que retipearlo cada
  // vez — común en ferreterías, que restockean seguido a los mismos
  // proveedores de siempre. No bloquea la selección: el costo del producto
  // ya se aplicó al toque (ver onSeleccionar), esto solo lo refina un
  // instante después si hay una compra previa a ese proveedor puntual.
  const sugerirCostoDeHistorial = async (idx, producto, idProveedorActual) => {
    const idProducto = producto.id;
    // Los configurados se muestran de una, sin esperar la consulta de
    // historial (que puede no traer nada si son proveedores recién cargados).
    const configurados = proveedoresConfigurados(producto, idProveedorActual);
    setComparativas(prev => {
      const n = { ...prev };
      if (configurados.length) n[idx] = configurados; else delete n[idx];
      return n;
    });
    try {
      const historial = await productosService.getHistorialCompras(idProducto);
      if (!historial.length) return;
      const sugerido = (idProveedorActual && historial.find(h => h.idProveedor === idProveedorActual)) || null;
      if (sugerido) {
        setForm(f => {
          const ls = [...f.lineas];
          // Si mientras tardó la consulta el usuario ya cambió o borró el
          // producto de esta línea, no le pisamos lo que haya ahora.
          if (ls[idx]?.id_producto !== idProducto) return f;
          const margen = Number(ls[idx].margen) || 0;
          ls[idx] = {
            ...ls[idx],
            precio_compra: String(sugerido.precioCompra),
            precio_venta: String(Math.round(sugerido.precioCompra * (1 + margen / 100) * 100) / 100),
          };
          return { ...f, lineas: ls };
        });
      }

      // Este mismo producto, comprado antes a OTROS proveedores — el precio
      // más reciente de cada uno (el historial ya viene ordenado del más
      // nuevo al más viejo, ver ProductosController::historialCompras). Se
      // suma a los ya configurados (sin repetir proveedor).
      const vistos = new Set(configurados.map(c => c.idProveedor));
      const otros = [...configurados];
      for (const h of historial) {
        if (!h.idProveedor || h.idProveedor === idProveedorActual || vistos.has(h.idProveedor)) continue;
        vistos.add(h.idProveedor);
        otros.push({ idProveedor: h.idProveedor, proveedorNombre: h.proveedorNombre, precioCompra: h.precioCompra });
      }
      if (otros.length) {
        otros.sort((a, b) => (a.precioCompra ?? Infinity) - (b.precioCompra ?? Infinity));
        setComparativas(prev => ({ ...prev, [idx]: otros }));
      }
    } catch { /* sin historial o sin conexión — se queda con los proveedores configurados */ }
  };

  const setPrecioCompraLinea = (idx, valor) => {
    setForm(f => {
      const ls = [...f.lineas];
      const p = Number(ls[idx].margen) || 0;
      ls[idx] = { ...ls[idx], precio_compra: valor, precio_venta: valor ? String(Math.round(Number(valor) * (1 + p / 100) * 100) / 100) : '' };
      return { ...f, lineas: ls };
    });
  };

  const handleConfirmarCalculo = () => {
    const idx = calcularLineaIdx;
    const total = parseFloat(calcularTotal.replace(',', '.'));
    const cantidad = Number(form.lineas[idx]?.cantidad) || 0;
    if (idx == null || !total || !cantidad) { setCalcularLineaIdx(null); return; }
    setPrecioCompraLinea(idx, String(Math.round((total / cantidad) * 100) / 100));
    setCalcularLineaIdx(null);
    setCalcularTotal('');
  };

  /* ── Proveedor modal ── */
  const [proveedoresLocales, setProveedoresLocales] = useState([]);
  const [openNuevoProv,  setOpenNuevoProv]  = useState(false);
  const todosProveedores = [...proveedores, ...proveedoresLocales];

  const handleProveedorCreado = (nuevo) => {
    setProveedoresLocales(prev => [...prev, nuevo]);
    setForm(f => ({ ...f, id_proveedor: nuevo.id }));
  };

  useEffect(() => {
    if (open) categoriasService.getAll().then(setCategorias).catch(() => toast('No se pudieron cargar las categorías', 'error'));
  }, [open]);

  // Pre-llena el formulario cuando vienen datos del escaner IA o edición
  useEffect(() => {
    if (initialData && open) {
      const lineasBase = initialData.lineas?.length
        ? initialData.lineas.map(l => {
            const costo = Number(l.precio_compra) || 0;
            const venta = Number(l.precio_venta)  || 0;
            const margen = costo && venta ? Math.round(((venta / costo) - 1) * 1000) / 10 : 10;
            return {
              id_producto:       l.id_producto,
              productoData:      null,
              cantidad:          l.cantidad,
              precio_compra:     l.precio_compra || '',
              precio_venta:      l.precio_venta  || '',
              fecha_vencimiento: l.fecha_vencimiento || '',
              margen,
            };
          })
        : empty.lineas;
      setForm({ ...empty, ...initialData, lineas: lineasBase });
      setComprobanteUrl(initialData.comprobanteUrl || null);
      setComprobanteFile(null);

      // Hidrata cada línea con el producto completo (nombre/costo/precio/
      // unidad) — initialData solo trae el id_producto (EscanearModal e
      // ImportarExcelModal no cargan el objeto completo, y una compra en
      // edición tampoco trae costo/precio de referencia para el Autocomplete).
      const idsUnicos = [...new Set(lineasBase.map(l => l.id_producto).filter(Boolean))];
      if (idsUnicos.length) {
        Promise.all(idsUnicos.map(id => productosService.getById(id).catch(() => null))).then(resueltos => {
          const porId = new Map(resueltos.filter(Boolean).map(p => [p.id, p]));
          setForm(f => ({ ...f, lineas: f.lineas.map(l => (l.id_producto && porId.has(l.id_producto)) ? { ...l, productoData: porId.get(l.id_producto) } : l) }));
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, open]);

  const handleArchivoComprobante = async (file) => {
    if (!file) return;
    if (editId) {
      setSubiendoComprobante(true);
      try {
        const updated = await comprasService.subirComprobante(editId, file);
        setComprobanteUrl(updated.comprobanteUrl);
        onUpdate?.(updated);
        toast('Ticket adjuntado', 'success');
      } catch {
        toast('No se pudo subir el ticket', 'error');
      } finally {
        setSubiendoComprobante(false);
      }
    } else {
      setComprobanteFile(file);
    }
  };

  const handleEliminarComprobante = async () => {
    if (editId && comprobanteUrl) {
      setSubiendoComprobante(true);
      try {
        const updated = await comprasService.eliminarComprobante(editId);
        setComprobanteUrl(null);
        onUpdate?.(updated);
      } catch {
        toast('No se pudo quitar el ticket', 'error');
      } finally {
        setSubiendoComprobante(false);
      }
    } else {
      setComprobanteFile(null);
    }
  };

  const setField = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target?.value ?? e }));
    setErrors(prev => { const next = { ...prev }; delete next[k]; return next; });
  };

  const setLinea = (idx, k, v) => {
    setForm(f => {
      const lineas = [...f.lineas];
      lineas[idx] = { ...lineas[idx], [k]: v };
      return { ...f, lineas };
    });
  };

  const addLineaAndFocus = () => {
    setForm(f => ({ ...f, lineas: [...f.lineas, { id_producto: '', cantidad: 1, precio_compra: '', precio_venta: '', margen: 10, fecha_vencimiento: '' }] }));
    const nextIdx = form.lineas.length;
    setTimeout(() => autoRefs.current[nextIdx]?.focus(), 50);
  };
  const addLinea    = () => addLineaAndFocus();
  const removeLinea = (idx) => setForm(f => ({ ...f, lineas: f.lineas.filter((_, i) => i !== idx) }));

  const ultimaLineaTieneProd = form.lineas.length > 0 && !!form.lineas[form.lineas.length - 1].id_producto;

  const subtotal = form.lineas.reduce((s, l) => s + (Number(l.cantidad) * (Number(l.precio_compra) || 0)), 0);

  const validate = () => {
    const errs = {};
    if (!form.id_proveedor) errs.id_proveedor = 'El proveedor es requerido';
    // Las líneas sin producto se ignoran al confirmar (no bloquean la compra),
    // solo se valida el precio de las que sí tienen producto cargado.
    const lineasConProducto = form.lineas.filter(l => l.id_producto);
    if (lineasConProducto.length === 0) errs.lineas = 'Agregá al menos un producto';
    form.lineas.forEach((l, i) => {
      if (l.id_producto && !l.precio_compra) errs[`linea_${i}_precio`] = 'Requerido';
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegistrar = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        id_proveedor: form.id_proveedor,
        fecha:        form.fecha,
        estado:       form.estado,
        metodo_pago:  form.metodo_pago,
        lineas:       form.lineas.filter(l => l.id_producto).map(l => ({
          id_producto:       l.id_producto,
          cantidad:          Number(l.cantidad),
          precio_compra:     Number(l.precio_compra),
          ...(l.precio_venta ? { precio_venta: Number(l.precio_venta) } : {}),
          ...(l.fecha_vencimiento ? { fecha_vencimiento: l.fecha_vencimiento } : {}),
        })),
      };
      if (editId) {
        const updated = await comprasService.update(editId, payload);
        onUpdate?.(updated);
        toast('Compra actualizada correctamente', 'success');
      } else {
        let nueva = await comprasService.create(payload);
        if (comprobanteFile) {
          try {
            nueva = await comprasService.subirComprobante(nueva.id, comprobanteFile);
          } catch {
            toast('Compra creada, pero no se pudo subir el ticket', 'error');
          }
        }
        onCreate?.(nueva);
        toast('Compra registrada correctamente', 'success');
      }
      if (form.id_proveedor) localStorage.setItem(ULTIMO_PROVEEDOR_KEY, form.id_proveedor);
      setForm(emptyConProveedorRecordado());
      setErrors({});
      setVencAbiertos(new Set());
      setComprobanteUrl(null);
      setComprobanteFile(null);
      setComparativas({});
      onClose();
    } catch (e) {
      toast(e.response?.data?.message || 'Error al procesar la compra', 'error');
    } finally {
      setSaving(false);
    }
  };

  const resetNuevoProd = () => { setNuevoProd({ active: false, idx: null, nombre: '' }); };
  const handleClose = () => { setForm(emptyConProveedorRecordado()); setErrors({}); resetNuevoProd(); setComprobanteUrl(null); setComprobanteFile(null); setVencAbiertos(new Set()); setComparativas({}); onClose(); };

  // Agrega una línea por cada talle elegido en "Comprar por curva" — aprovecha
  // la última línea si está vacía en vez de dejarla suelta, mismo criterio
  // que ya usa el resto del formulario al completar una línea a mano.
  const agregarLineasDeCurva = (nuevasLineas) => {
    setForm(f => {
      const ultima = f.lineas[f.lineas.length - 1];
      const base = f.lineas.length > 0 && ultima && !ultima.id_producto ? f.lineas.slice(0, -1) : f.lineas;
      return { ...f, lineas: [...base, ...nuevasLineas] };
    });
    setModalCurva(false);
  };

  const totalUnidades = form.lineas.reduce((s, l) => s + Number(l.cantidad || 0), 0);
  const proveedorSeleccionado = todosProveedores.find(p => p.id === form.id_proveedor);

  // Tabla HTML normal (Table/TableRow/TableCell) — el navegador alinea las
  // columnas solo, sin cálculos manuales de ancho.
  const numberFieldSx = {
    width: 90,
    '& .MuiOutlinedInput-root': { bgcolor: 'transparent', '& fieldset': { borderColor: BORDER }, '&:hover fieldset': { borderColor: 'var(--border-hover)' }, '&.Mui-focused fieldset': { borderColor: P, borderWidth: 1 } },
    '& .MuiInputBase-input': { py: '7px', fontSize: 13, color: INK, textAlign: 'right' },
  };
  const thSx = { color: MUTED, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', bgcolor: TABLE_HEADER, borderBottom: `1px solid ${BORDER}`, py: 1.1, px: 1 };
  const tdSx = { borderBottom: `1px solid ${BORDER}`, py: 0.75, px: 1 };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xl" fullWidth
      disableEnforceFocus TransitionProps={{ onEntered: enfocarAlAbrir }}
      PaperProps={{ sx: isMobile ? modalPaperSx : {
        // Desktop necesita el ancho xl y una altura acotada con scroll interno
        // por la tabla de productos — en mobile el maxWidth no cambia nada
        // visualmente (la pantalla ya es angosta), así que se usa el mismo
        // modalPaperSx liso que Nuevo Producto/Combo, sin altura forzada.
        ...modalPaperSx, borderRadius: '16px', overflow: 'hidden',
        maxHeight: '92vh', display: 'flex', flexDirection: 'column',
      } }}>

      {/* ── Header (fijo) ── */}
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        px: { xs: 2, sm: 4 }, py: { xs: 1.5, sm: 2.5 }, bgcolor: CARD,
        borderBottom: `1px solid ${BORDER}`,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
          <Box sx={{
            width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 }, borderRadius: '12px', flexShrink: 0,
            bgcolor: `${P}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AddIcon sx={{ color: P, fontSize: { xs: 17, sm: 20 } }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ color: INK, fontWeight: 700, fontSize: { xs: 15, sm: 17 } }}>{editId ? 'Editar Compra' : 'Nueva Compra'}</Typography>
            {/* El texto instructivo genérico no entra en mobile, pero el nombre
                del proveedor ya elegido sí es información útil — se mantiene. */}
            <Typography sx={{
              color: MUTED, fontSize: { xs: 11.5, sm: 13 }, mt: 0.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              display: !proveedorSeleccionado ? { xs: 'none', sm: 'block' } : 'block',
            }}>
              {proveedorSeleccionado ? proveedorSeleccionado.nombre : editId ? 'Modificá los datos de la compra.' : 'Cargá los productos, proveedor y precios.'}
            </Typography>
          </Box>
        </Box>
        <IconButton data-tour="compras-modal-cerrar" size="small" onClick={handleClose}
          sx={{ color: MUTED, bgcolor: HOVER, borderRadius: '8px', flexShrink: 0, '&:hover': { color: INK, bgcolor: `${MUTED}20` } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* ── Contenido (scrollea) ── */}
      <DialogContent sx={{ px: { xs: 1.75, sm: 3 }, pt: { xs: 1.75, sm: 2.5 }, pb: { xs: 1.75, sm: 2.5 }, flex: { xs: 'none', sm: 1 }, overflowY: { xs: 'visible', sm: 'auto' } }}>
        {/* Datos generales */}
        <Typography sx={{ color: MUTED, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', mb: 1.25 }}>
          Datos generales
        </Typography>
        <Box sx={{
          display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1.4fr 1fr 1fr 1fr' }, gap: { xs: 1.25, sm: 2 }, mb: { xs: 2, sm: 3 },
          p: { xs: 1.25, sm: 2 }, border: `1px solid ${BORDER}`, borderRadius: '12px', bgcolor: `${TABLE_HEADER}80`,
        }}>
          <Box data-tour="compras-modal-proveedor">
            <FieldLabel required>Proveedor</FieldLabel>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <FormControl fullWidth error={!!errors.id_proveedor}>
                <Select value={form.id_proveedor} onChange={setField('id_proveedor')} displayEmpty sx={selectFieldSx}
                  inputRef={proveedorRef}
                  MenuProps={{ PaperProps: { sx: { bgcolor: DROPDOWN, border: `1px solid ${BORDER}`, color: INK, maxHeight: 260 } } }}
                  renderValue={(v) => todosProveedores.find(p => p.id === v)?.nombre || <Box sx={{ color: MUTED, fontSize: 14 }}>Seleccionar proveedor</Box>}>
                  {todosProveedores.map(p => (
                    <MenuItem key={p.id} value={p.id} sx={{ fontSize: 14, '&:hover': { bgcolor: HOVER } }}>{p.nombre}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Tooltip title="Nuevo proveedor">
                <IconButton size="small" onClick={() => setOpenNuevoProv(true)}
                  sx={{ border: `1px solid ${BORDER}`, borderRadius: '8px', color: MUTED, flexShrink: 0, bgcolor: CARD, '&:hover': { color: P, borderColor: P } }}>
                  <AddIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            </Box>
            {errors.id_proveedor && <Typography sx={{ color: ERROR, fontSize: 12, mt: 0.5 }}>{errors.id_proveedor}</Typography>}
          </Box>
          <Box>
            <FieldLabel>Fecha</FieldLabel>
            <TextField fullWidth type="date" value={form.fecha} onChange={setField('fecha')} InputLabelProps={{ shrink: true }}
              sx={{ ...fieldSx, '& .MuiOutlinedInput-root': { ...fieldSx['& .MuiOutlinedInput-root'], bgcolor: CARD } }} />
          </Box>
          <Box>
            <FieldLabel>Método de pago</FieldLabel>
            <FormControl fullWidth>
              <Select value={form.metodo_pago} onChange={setField('metodo_pago')} sx={{ ...selectFieldSx, bgcolor: CARD, borderRadius: '10px' }}
                MenuProps={{ PaperProps: { sx: { bgcolor: DROPDOWN, border: `1px solid ${BORDER}`, color: INK } } }}>
                {[['efectivo','Efectivo'],['tarjeta','Tarjeta'],['transferencia','Transferencia'],['cuenta_corriente','Cuenta Corriente']].map(([v, l]) => (
                  <MenuItem key={v} value={v} sx={{ fontSize: 14, '&:hover': { bgcolor: HOVER } }}>{l}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box data-tour="compras-modal-estado">
            <FieldLabel>Estado</FieldLabel>
            <FormControl fullWidth>
              <Select value={form.estado} onChange={setField('estado')} sx={{ ...selectFieldSx, bgcolor: CARD, borderRadius: '10px' }}
                MenuProps={{ PaperProps: { sx: { bgcolor: DROPDOWN, border: `1px solid ${BORDER}`, color: INK } } }}>
                {ESTADOS.map(e => (
                  <MenuItem key={e} value={e} sx={{ fontSize: 14, textTransform: 'capitalize', '&:hover': { bgcolor: HOVER } }}>
                    {e.charAt(0).toUpperCase() + e.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Ticket del proveedor — opcional, se puede subir ahora o más tarde
            desde el detalle de la compra si todavía no lo tenés a mano. */}
        <Box sx={{ mb: 2.5 }}>
          <FieldLabel>Ticket del proveedor (opcional)</FieldLabel>
          {comprobanteUrl || comprobanteFile ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: `1px solid ${BORDER}`, borderRadius: '10px', px: 1.5, py: 1, bgcolor: CARD }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                <ReceiptLongIcon sx={{ fontSize: 18, color: P, flexShrink: 0 }} />
                {comprobanteUrl ? (
                  <Typography onClick={() => setVerTicketOpen(true)}
                    sx={{ color: P, fontSize: 13, fontWeight: 600, cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', '&:hover': { textDecoration: 'underline' } }}>
                    Ver ticket adjunto
                  </Typography>
                ) : (
                  <Typography sx={{ color: INK2, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{comprobanteFile.name}</Typography>
                )}
              </Box>
              <IconButton size="small" onClick={handleEliminarComprobante} disabled={subiendoComprobante}
                sx={{ color: MUTED, flexShrink: 0, '&:hover': { color: ERROR, bgcolor: ERROR_BG } }}>
                <CloseIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          ) : (
            <Button component="label" fullWidth disabled={subiendoComprobante}
              sx={{ py: 1.25, border: `1.5px dashed ${BORDER}`, borderRadius: '10px', color: INK2, textTransform: 'none', fontWeight: 600, fontSize: 13, '&:hover': { bgcolor: HOVER, borderColor: P } }}>
              {subiendoComprobante ? 'Subiendo...' : 'Adjuntar foto o PDF del ticket'}
              <input type="file" hidden accept=".png,.jpg,.jpeg,.webp,.pdf" onChange={e => handleArchivoComprobante(e.target.files?.[0])} />
            </Button>
          )}
        </Box>

        {/* Líneas de compra */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.25 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ color: MUTED, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Productos
            </Typography>
            <Chip label={form.lineas.filter(l => l.id_producto).length} size="small"
              sx={{ height: 18, minWidth: 18, fontSize: 11, fontWeight: 700, bgcolor: `${P}18`, color: P, '& .MuiChip-label': { px: '6px' } }} />
            {errors.lineas && <Typography sx={{ color: ERROR, fontSize: 12, fontWeight: 600 }}>{errors.lineas}</Typography>}
          </Box>
          <Box sx={{ display: 'flex', gap: 0.75 }}>
            <Button size="small" onClick={() => setForm(f => ({ ...f, lineas: [{ id_producto: '', cantidad: 1, precio_compra: '', precio_venta: '', margen: 10, fecha_vencimiento: '' }] }))}
              sx={{ color: MUTED, textTransform: 'none', fontWeight: 600, fontSize: 12, borderRadius: '7px', minWidth: 0, px: 1.25, '&:hover': { color: ERROR, bgcolor: ERROR_BG } }}>
              Vaciar
            </Button>
            {esIndumentaria && (
              <Button data-tour="compras-modal-curva" size="small" startIcon={<CheckroomIcon sx={{ fontSize: 15 }} />} onClick={() => setModalCurva(true)}
                sx={{ color: P, textTransform: 'none', fontWeight: 600, fontSize: 12, borderRadius: '7px', minWidth: 0, px: 1.25, '&:hover': { bgcolor: `${P}12` } }}>
                Comprar por curva
              </Button>
            )}
            <Button size="small" startIcon={<AddIcon sx={{ fontSize: 15 }} />} onClick={addLinea}
              disabled={!ultimaLineaTieneProd}
              sx={{ color: P, textTransform: 'none', fontWeight: 600, fontSize: 12, borderRadius: '7px', minWidth: 0, px: 1.25, '&:hover': { bgcolor: `${P}12` }, '&.Mui-disabled': { color: MUTED, opacity: 0.5 } }}>
              Agregar
            </Button>
          </Box>
        </Box>

        {/* En mobile una tabla de 8 columnas no entra en pantalla por más
            overflow:auto que tenga — cada línea se scrollearía sola de
            costado, imposible de cargar con el pulgar. Se arma como tarjeta
            apilada en su lugar, reusando los mismos handlers de la tabla. */}
        {isMobile ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
            {form.lineas.length === 0 && (
              <Box sx={{ border: `1px solid ${BORDER}`, borderRadius: '10px', py: 5, textAlign: 'center' }}>
                <Typography sx={{ color: MUTED, fontSize: 13 }}>Agrega productos a la compra</Typography>
              </Box>
            )}
            {form.lineas.map((l, idx) => (
              <Box key={idx} data-tour={idx === 0 ? 'compras-modal-lineas' : undefined}
                sx={{ border: `1px solid ${BORDER}`, borderRadius: '10px', p: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{
                    width: 20, height: 20, borderRadius: '6px', flexShrink: 0,
                    bgcolor: `${P}16`, border: `1px solid ${P}25`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Typography sx={{ color: P, fontSize: 10.5, fontWeight: 700 }}>{idx + 1}</Typography>
                  </Box>
                  <AutocompleteLineaProducto
                    productoData={l.productoData}
                    error={!!errors[`linea_${idx}_prod`]}
                    sx={{ flex: 1, minWidth: 0 }}
                    onSeleccionar={(val) => {
                      if (!val) { setForm(f => { const ls = [...f.lineas]; ls[idx] = { ...ls[idx], id_producto: '', productoData: null, precio_compra: '', precio_venta: '', margen: 10 }; return { ...f, lineas: ls }; }); setComparativas(prev => { const n = { ...prev }; delete n[idx]; return n; }); return; }
                      setForm(f => { const ls = [...f.lineas]; ls[idx] = { ...ls[idx], id_producto: val.id, productoData: val, precio_compra: val.costo > 0 ? String(val.costo) : ls[idx].precio_compra, precio_venta: String(val.precioFinal ?? val.precio ?? '') }; return { ...f, lineas: ls }; });
                      setErrors(prev => { const n = { ...prev }; delete n[`linea_${idx}_prod`]; return n; });
                      sugerirCostoDeHistorial(idx, val, form.id_proveedor);
                    }}
                    onCrear={(nombre) => setNuevoProd({ active: true, idx, nombre })}
                  />
                  <Tooltip title="Escanear"><IconButton size="small" onClick={() => setScannerLineaIdx(idx)} sx={{ color: MUTED, flexShrink: 0, '&:hover': { color: P }, p: '4px' }}><CameraAltIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                  <Tooltip title="Quitar"><IconButton size="small" onClick={() => removeLinea(idx)} disabled={form.lineas.length === 1} sx={{ color: MUTED, flexShrink: 0, '&:hover': { color: ERROR, bgcolor: ERROR_BG }, borderRadius: '6px', p: '4px' }}><CloseIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                  <Box>
                    <FieldLabel>Cantidad</FieldLabel>
                    <TextField fullWidth type="number" placeholder="1" value={l.cantidad}
                      onChange={e => setLinea(idx, 'cantidad', esFraccionable(unidadDeLinea(l)) ? Math.max(0.01, Number(e.target.value) || 0.01) : Math.max(1, Number(e.target.value) || 1))}
                      onWheel={e => e.target.blur()}
                      inputProps={esFraccionable(unidadDeLinea(l)) ? { step: '0.01' } : undefined}
                      InputProps={esFraccionable(unidadDeLinea(l)) ? { endAdornment: <InputAdornment position="end">{abrevUnidad(unidadDeLinea(l))}</InputAdornment> } : undefined}
                      sx={{ ...numberFieldSx, width: '100%' }} />
                  </Box>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <FieldLabel>Costo</FieldLabel>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ComparativaProveedoresChip comparativa={comparativas[idx]} />
                        {esFraccionable(unidadDeLinea(l)) && (
                          <Tooltip title="Cargar por monto total pagado">
                            <IconButton size="small" onClick={() => { setCalcularLineaIdx(idx); setCalcularTotal(''); }}
                              sx={{ color: MUTED, p: '2px', mb: '2px', '&:hover': { color: P } }}>
                              <CalculateIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </Box>
                    <CampoPrecio fullWidth placeholder="0" value={l.precio_compra} onChange={e => setPrecioCompraLinea(idx, e.target.value)} error={!!errors[`linea_${idx}_precio`]}
                      onKeyDown={e => { if (e.key === 'Enter' && l.id_producto) { e.preventDefault(); addLineaAndFocus(); } }}
                      sx={{ ...numberFieldSx, width: '100%' }} />
                  </Box>
                  <Box>
                    <FieldLabel>Margen %</FieldLabel>
                    <TextField fullWidth type="number" placeholder="%" value={l.margen} onChange={e => { const p = e.target.value; setForm(f => { const ls = [...f.lineas]; const c = Number(ls[idx].precio_compra); const v = c ? String(Math.round(c * (1 + (Number(p) || 0) / 100) * 100) / 100) : ls[idx].precio_venta; ls[idx] = { ...ls[idx], margen: p, precio_venta: v }; return { ...f, lineas: ls }; }); }} sx={{ ...numberFieldSx, width: '100%' }} />
                  </Box>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <FieldLabel>Venta</FieldLabel>
                      {tieneIA && (
                        <Tooltip title="Sugerir precio de venta con IA">
                          <span>
                            <IconButton size="small" disabled={sugiriendoIdx === idx} onClick={async () => { const n = l.productoData?.nombre || ''; const c = Number(l.precio_compra) || 0; if (!c || !n) return; setSugiriendoIdx(idx); try { const s = await iaService.sugerirPrecio(n, c); if (s) setForm(f => { const ls = [...f.lineas]; const bc = Number(ls[idx].precio_compra); ls[idx] = { ...ls[idx], precio_venta: String(s), margen: bc ? String(Math.round(((s / bc) - 1) * 1000) / 10) : '10' }; return { ...f, lineas: ls }; }); } catch { /* noop */ } finally { setSugiriendoIdx(null); } }} sx={{ color: P, p: '2px', mb: 0.5, '&:hover': { bgcolor: `${P}14` }, borderRadius: '6px' }}><AutoAwesomeIcon sx={{ fontSize: 13 }} /></IconButton>
                          </span>
                        </Tooltip>
                      )}
                    </Box>
                    <TextField fullWidth type="number" placeholder="0" value={l.precio_venta} onChange={e => { const v = e.target.value; setForm(f => { const ls = [...f.lineas]; const c = Number(ls[idx].precio_compra); const m = c && v ? String(Math.round(((Number(v) / c) - 1) * 1000) / 10) : ls[idx].margen; ls[idx] = { ...ls[idx], precio_venta: v, margen: m }; return { ...f, lineas: ls }; }); }} sx={{ ...numberFieldSx, width: '100%' }} />
                  </Box>
                </Box>

                <Box>
                  <FieldLabel>Vencimiento</FieldLabel>
                  {vencVisible(idx, l) ? (
                    <TextField fullWidth type="date" value={l.fecha_vencimiento || ''} onChange={e => setLinea(idx, 'fecha_vencimiento', e.target.value)} InputLabelProps={{ shrink: true }}
                      sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'transparent', '& fieldset': { borderColor: BORDER }, '&:hover fieldset': { borderColor: 'var(--border-hover)' }, '&.Mui-focused fieldset': { borderColor: P, borderWidth: 1 } }, '& .MuiInputBase-input': { py: '9px', px: '10px', fontSize: 13, color: INK, '&::-webkit-calendar-picker-indicator': { opacity: 0.6, cursor: 'pointer' } } }} />
                  ) : (
                    <Button size="small" startIcon={<CalendarMonthIcon sx={{ fontSize: 15 }} />} onClick={() => toggleVenc(idx)}
                      sx={{ color: MUTED, textTransform: 'none', fontSize: 12.5, border: `1px solid ${BORDER}`, borderRadius: '8px', py: '8px', '&:hover': { color: P, borderColor: P, bgcolor: `${P}08` } }}>
                      Agregar fecha
                    </Button>
                  )}
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 0.5, borderTop: `1px solid ${BORDER}` }}>
                  <Typography sx={{ color: MUTED, fontSize: 11.5, mr: 1, alignSelf: 'center' }}>Subtotal</Typography>
                  <Typography sx={{ color: INK, fontWeight: 700, fontSize: 14 }}>
                    {fmtMoney((Number(l.cantidad) || 0) * (Number(l.precio_compra) || 0))}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        ) : (
        <Box sx={{ border: `1px solid ${BORDER}`, borderRadius: '10px', overflow: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={thSx} />
                <TableCell sx={thSx} align="center">Producto</TableCell>
                <TableCell sx={thSx} />
                <TableCell sx={thSx} align="center">Cant.</TableCell>
                <TableCell sx={thSx} align="center">Costo</TableCell>
                <TableCell sx={thSx} align="center">Margen</TableCell>
                <TableCell sx={thSx} />
                <TableCell sx={thSx} align="center">Venta</TableCell>
                <TableCell sx={thSx} align="center">Vence</TableCell>
                <TableCell sx={thSx} align="center">Subtotal</TableCell>
                <TableCell sx={thSx} />
              </TableRow>
            </TableHead>
            <TableBody>
              {form.lineas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} sx={{ border: 'none', py: 6, textAlign: 'center' }}>
                    <Typography sx={{ color: MUTED, fontSize: 13 }}>Agrega productos a la compra</Typography>
                  </TableCell>
                </TableRow>
              )}

              {form.lineas.map((l, idx) => {
                const isLast = idx === form.lineas.length - 1;
                const rowTdSx = isLast ? { ...tdSx, borderBottom: 'none' } : tdSx;
                return (
                  <TableRow key={idx} data-tour={idx === 0 ? 'compras-modal-lineas' : undefined}
                    sx={{ '&:hover': { bgcolor: HOVER } }}>
                    <TableCell sx={rowTdSx} align="center">
                      <Box sx={{
                        width: 20, height: 20, borderRadius: '6px', flexShrink: 0, mx: 'auto',
                        bgcolor: `${P}16`, border: `1px solid ${P}25`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Typography sx={{ color: P, fontSize: 10.5, fontWeight: 700 }}>{idx + 1}</Typography>
                      </Box>
                    </TableCell>

                    <TableCell sx={{ ...rowTdSx, minWidth: 200 }}>
                      <AutocompleteLineaProducto
                        productoData={l.productoData}
                        error={!!errors[`linea_${idx}_prod`]}
                        registrarInputRef={el => { autoRefs.current[idx] = el; }}
                        onSeleccionar={(val) => {
                          if (!val) { setForm(f => { const ls = [...f.lineas]; ls[idx] = { ...ls[idx], id_producto: '', productoData: null, precio_compra: '', precio_venta: '', margen: 10 }; return { ...f, lineas: ls }; }); setComparativas(prev => { const n = { ...prev }; delete n[idx]; return n; }); return; }
                          setForm(f => { const ls = [...f.lineas]; ls[idx] = { ...ls[idx], id_producto: val.id, productoData: val, precio_compra: val.costo > 0 ? String(val.costo) : ls[idx].precio_compra, precio_venta: String(val.precioFinal ?? val.precio ?? '') }; return { ...f, lineas: ls }; });
                          setErrors(prev => { const n = { ...prev }; delete n[`linea_${idx}_prod`]; return n; });
                          sugerirCostoDeHistorial(idx, val, form.id_proveedor);
                        }}
                        onCrear={(nombre) => setNuevoProd({ active: true, idx, nombre })}
                        onEnterKeyDown={async (e, query) => {
                          if (e.key !== 'Enter') return;
                          // Enter con el producto ya elegido pasa a Cantidad de esa
                          // misma línea (no a la línea siguiente) — recién el Enter
                          // en Cantidad agrega una línea nueva y vuelve al buscador.
                          const irACantidad = () => setTimeout(() => { cantRefs.current[idx]?.focus(); cantRefs.current[idx]?.select(); }, 50);
                          if (l.id_producto) { e.preventDefault(); irACantidad(); return; }
                          const val = query.trim();
                          if (!val) return;
                          // Match exacto contra el backend, no un array local — se
                          // pide un puñado de candidatos por el texto tipeado.
                          try {
                            const candidatos = await productosService.getAll({ search: val, per_page: 5 });
                            const exacto = candidatos.find(p => p.nombre.toLowerCase() === val.toLowerCase());
                            if (exacto) {
                              e.preventDefault();
                              setForm(f => { const ls = [...f.lineas]; ls[idx] = { ...ls[idx], id_producto: exacto.id, productoData: exacto, precio_compra: exacto.costo > 0 ? String(exacto.costo) : ls[idx].precio_compra, precio_venta: String(exacto.precioFinal ?? exacto.precio ?? '') }; return { ...f, lineas: ls }; });
                              setErrors(prev => { const n = { ...prev }; delete n[`linea_${idx}_prod`]; return n; });
                              sugerirCostoDeHistorial(idx, exacto, form.id_proveedor);
                              irACantidad();
                            }
                          } catch { /* sin match — deja que el usuario elija del desplegable */ }
                        }}
                      />
                    </TableCell>

                    <TableCell sx={rowTdSx} align="center">
                      <Tooltip title="Escanear"><IconButton size="small" onClick={() => setScannerLineaIdx(idx)} sx={{ color: MUTED, '&:hover': { color: P }, p: '4px' }}><CameraAltIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                    </TableCell>

                    <TableCell sx={rowTdSx} align="center">
                      <TextField type="number" placeholder="1" value={l.cantidad}
                        inputRef={el => cantRefs.current[idx] = el}
                        onKeyDown={e => { if (e.key === 'Enter' && l.id_producto) { e.preventDefault(); addLineaAndFocus(); } }}
                        onChange={e => setLinea(idx, 'cantidad', Math.max(1, Number(e.target.value) || 1))}
                        onWheel={e => e.target.blur()}
                        InputProps={esFraccionable(unidadDeLinea(l)) ? { endAdornment: <InputAdornment position="end">{abrevUnidad(unidadDeLinea(l))}</InputAdornment> } : undefined}
                        sx={{ ...numberFieldSx, width: esFraccionable(unidadDeLinea(l)) ? 96 : 76, '& .MuiInputBase-input': { ...numberFieldSx['& .MuiInputBase-input'], textAlign: 'center' } }} />
                    </TableCell>

                    <TableCell sx={rowTdSx} align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, justifyContent: 'center' }}>
                        <CampoPrecio placeholder="0" value={l.precio_compra} onChange={e => setPrecioCompraLinea(idx, e.target.value)} error={!!errors[`linea_${idx}_precio`]}
                          onKeyDown={e => { if (e.key === 'Enter' && l.id_producto) { e.preventDefault(); addLineaAndFocus(); } }}
                          InputProps={esFraccionable(unidadDeLinea(l)) ? { endAdornment: (
                            <Tooltip title="Cargar por monto total pagado">
                              <IconButton size="small" onClick={() => { setCalcularLineaIdx(idx); setCalcularTotal(''); }} sx={{ color: MUTED, p: '2px', '&:hover': { color: P } }}>
                                <CalculateIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Tooltip>
                          ) } : undefined}
                          sx={numberFieldSx} />
                        <ComparativaProveedoresChip comparativa={comparativas[idx]} />
                      </Box>
                    </TableCell>

                    <TableCell sx={rowTdSx} align="center">
                      <TextField type="number" placeholder="%" value={l.margen} onChange={e => { const p = e.target.value; setForm(f => { const ls = [...f.lineas]; const c = Number(ls[idx].precio_compra); const v = c ? String(Math.round(c * (1 + (Number(p) || 0) / 100) * 100) / 100) : ls[idx].precio_venta; ls[idx] = { ...ls[idx], margen: p, precio_venta: v }; return { ...f, lineas: ls }; }); }} sx={{ ...numberFieldSx, width: 84 }} />
                    </TableCell>

                    <TableCell sx={rowTdSx} align="center">
                      {tieneIA && (
                        <Tooltip title="Sugerir precio de venta con IA">
                          <span>
                            <IconButton size="small" disabled={sugiriendoIdx === idx} onClick={async () => { const n = l.productoData?.nombre || ''; const c = Number(l.precio_compra) || 0; if (!c || !n) return; setSugiriendoIdx(idx); try { const s = await iaService.sugerirPrecio(n, c); if (s) setForm(f => { const ls = [...f.lineas]; const bc = Number(ls[idx].precio_compra); ls[idx] = { ...ls[idx], precio_venta: String(s), margen: bc ? String(Math.round(((s / bc) - 1) * 1000) / 10) : '10' }; return { ...f, lineas: ls }; }); } catch { /* noop */ } finally { setSugiriendoIdx(null); } }} sx={{ color: P, p: '4px', '&:hover': { bgcolor: `${P}14` }, borderRadius: '6px' }}><AutoAwesomeIcon sx={{ fontSize: 15 }} /></IconButton>
                          </span>
                        </Tooltip>
                      )}
                    </TableCell>

                    <TableCell sx={rowTdSx} align="center">
                      <TextField type="number" placeholder="0" value={l.precio_venta} onChange={e => { const v = e.target.value; setForm(f => { const ls = [...f.lineas]; const c = Number(ls[idx].precio_compra); const m = c && v ? String(Math.round(((Number(v) / c) - 1) * 1000) / 10) : ls[idx].margen; ls[idx] = { ...ls[idx], precio_venta: v, margen: m }; return { ...f, lineas: ls }; }); }} sx={numberFieldSx} />
                    </TableCell>

                    <TableCell sx={rowTdSx} align="center">
                      {vencVisible(idx, l) ? (
                        <TextField type="date" value={l.fecha_vencimiento || ''} onChange={e => setLinea(idx, 'fecha_vencimiento', e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 130, '& .MuiOutlinedInput-root': { bgcolor: 'transparent', '& fieldset': { borderColor: BORDER }, '&:hover fieldset': { borderColor: 'var(--border-hover)' }, '&.Mui-focused fieldset': { borderColor: P, borderWidth: 1 } }, '& .MuiInputBase-input': { py: '7px', px: '8px', fontSize: 12.5, color: INK, '&::-webkit-calendar-picker-indicator': { opacity: 0.6, cursor: 'pointer' } } }} />
                      ) : (
                        <Tooltip title="Agregar fecha de vencimiento">
                          <IconButton size="small" onClick={() => toggleVenc(idx)} sx={{ color: MUTED, '&:hover': { color: P }, p: '4px' }}>
                            <CalendarMonthIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>

                    {/* Subtotal de la línea */}
                    <TableCell sx={rowTdSx} align="center">
                      <Typography sx={{ color: INK, fontWeight: 700, fontSize: 13.5, whiteSpace: 'nowrap' }}>
                        {fmtMoney((Number(l.cantidad) || 0) * (Number(l.precio_compra) || 0))}
                      </Typography>
                    </TableCell>

                    <TableCell sx={rowTdSx} align="center">
                      <Tooltip title="Quitar"><IconButton size="small" onClick={() => removeLinea(idx)} disabled={form.lineas.length === 1} sx={{ color: MUTED, '&:hover': { color: ERROR, bgcolor: ERROR_BG }, borderRadius: '6px', p: '4px' }}><CloseIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
        )}
      </DialogContent>

      {/* Modal Nuevo Producto — el mismo que usa la página Productos, para no
          duplicar la lógica de precios/IVA/stock inicial en un mini-form aparte.
          Mismo diseño y tamaño que el modal de Combo. */}
      <Dialog open={nuevoProd.active} onClose={resetNuevoProd} maxWidth="sm" fullWidth
        PaperProps={{ sx: modalPaperSx }}>
        {nuevoProd.active && (
          <NuevoProducto
            onVolver={resetNuevoProd}
            categorias={categorias}
            setCategorias={setCategorias}
            proveedores={todosProveedores}
            setProveedores={setProveedoresLocales}
            initialNombre={nuevoProd.nombre}
            onCrear={crearProducto}
            onCreado={(nuevo) => setLinea(nuevoProd.idx, 'id_producto', nuevo.id)}
          />
        )}
      </Dialog>

      {/* ── Footer (fijo) ── */}
      <Box sx={{
        flexShrink: 0, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' },
        justifyContent: 'space-between', gap: 1.5,
        px: { xs: 1.5, sm: 3 }, py: { xs: 1.5, sm: 2 }, bgcolor: TABLE_HEADER, borderTop: `1px solid ${BORDER}`,
      }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ color: MUTED, fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap' }}>
            {form.lineas.filter(l => l.id_producto).length} producto{form.lineas.filter(l => l.id_producto).length !== 1 ? 's' : ''} · {totalUnidades} unidad{totalUnidades !== 1 ? 'es' : ''}
          </Typography>
          <Typography sx={{ color: INK, fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>{fmtMoney(subtotal)}</Typography>
        </Box>
        {/* En mobile "Registrar Compra" ocupa el ancho disponible — es la
            acción principal del modal, no puede quedar apretada contra
            "Cancelar" ni cortada contra el borde de la pantalla. */}
        <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
          <Button onClick={handleClose}
            sx={{ color: INK2, textTransform: 'none', fontWeight: 600, fontSize: 13, borderRadius: '8px', px: 2.5, flexShrink: 0, '&:hover': { bgcolor: HOVER } }}>
            Cancelar
          </Button>
          <Button data-tour="compras-modal-registrar" variant="contained" onClick={handleRegistrar} disabled={saving}
            sx={{ bgcolor: P, textTransform: 'none', fontWeight: 700, fontSize: 13, borderRadius: '8px', px: 3, flex: { xs: 1, sm: '0 0 auto' }, boxShadow: 'none', '&:hover': { bgcolor: P, filter: 'brightness(0.92)', boxShadow: 'none' }, '&.Mui-disabled': { bgcolor: P, opacity: 0.35, color: '#fff' } }}>
            {saving ? 'Guardando...' : editId ? 'Guardar Cambios' : 'Registrar Compra'}
          </Button>
        </Box>
      </Box>

      <BarcodeScanner
        open={scannerLineaIdx !== null}
        onClose={() => setScannerLineaIdx(null)}
        onScan={async (code) => {
          const idx = scannerLineaIdx;
          try {
            let prod = (await productosService.getAll({ codigo_exacto: code }))[0];
            if (!prod) {
              const candidatos = await productosService.getAll({ search: code, per_page: 5 });
              prod = candidatos.find(p => p.nombre.toLowerCase() === code.toLowerCase());
            }
            if (prod) {
              setForm(f => {
                const lineas = [...f.lineas];
                lineas[idx] = { ...lineas[idx], id_producto: prod.id, productoData: prod, precio_venta: String(prod.precioFinal ?? '') };
                return { ...f, lineas };
              });
              toast(`${prod.nombre} seleccionado`, 'success');
            } else {
              toast(`Sin producto con código: ${code}`, 'error');
            }
          } catch {
            toast(`Sin producto con código: ${code}`, 'error');
          }
          setScannerLineaIdx(null);
        }}
      />
      <ModalNuevoProveedor open={openNuevoProv} onClose={() => setOpenNuevoProv(false)} onCrear={handleProveedorCreado} />

      <ModalCompraPorCurva
        open={modalCurva}
        onClose={() => setModalCurva(false)}
        onAgregarLineas={agregarLineasDeCurva}
      />

      <ModalVerComprobante open={verTicketOpen} onClose={() => setVerTicketOpen(false)} url={comprobanteUrl} />

      {/* Cargar por monto total — para no tener que dividir a mano cuando
          compraste un bulto (ej. 100m de manguera a $12.000, o una bolsa de
          tornillos vendida por kg) y el ticket del proveedor solo te da el
          total pagado, no el costo por unidad. */}
      <Dialog open={calcularLineaIdx !== null} onClose={() => setCalcularLineaIdx(null)} maxWidth="xs" fullWidth
        PaperProps={{ sx: modalPaperSx }}>
        <DialogContent sx={{ p: 3 }}>
          <Typography sx={{ color: INK, fontWeight: 700, fontSize: 16, mb: 0.5 }}>Cargar por monto total</Typography>
          <Typography sx={{ color: MUTED, fontSize: 13, mb: 2 }}>
            Ingresá lo que pagaste en total por esta línea — calculamos el costo por {calcularLineaIdx != null ? abrevUnidad(unidadDeLinea(form.lineas[calcularLineaIdx])) : 'unidad'} solo.
          </Typography>
          <TextField fullWidth autoFocus type="number" placeholder="0" value={calcularTotal}
            onChange={e => setCalcularTotal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleConfirmarCalculo(); }}
            InputProps={{ startAdornment: <InputAdornment position="start" sx={{ color: MUTED }}>$</InputAdornment> }}
            sx={{ ...numberFieldSx, mb: 1 }} />
          {calcularLineaIdx != null && parseFloat(calcularTotal) > 0 && Number(form.lineas[calcularLineaIdx]?.cantidad) > 0 && (
            <Typography sx={{ color: P, fontSize: 13, fontWeight: 600, mb: 2 }}>
              = {fmtMoney(Math.round((parseFloat(calcularTotal) / Number(form.lineas[calcularLineaIdx].cantidad)) * 100) / 100)} por {abrevUnidad(unidadDeLinea(form.lineas[calcularLineaIdx]))}
            </Typography>
          )}
          <Box sx={{ display: 'flex', gap: 1.5, mt: 2 }}>
            <Button fullWidth onClick={() => setCalcularLineaIdx(null)}
              sx={{ color: INK2, border: `1px solid ${BORDER}`, textTransform: 'none', fontWeight: 600, borderRadius: '8px', py: 1.1, '&:hover': { bgcolor: HOVER } }}>
              Cancelar
            </Button>
            <Button fullWidth variant="contained" onClick={handleConfirmarCalculo}
              sx={{ bgcolor: P, textTransform: 'none', fontWeight: 700, borderRadius: '8px', py: 1.1, '&:hover': { bgcolor: P_HOVER } }}>
              Calcular
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

/* ── Modal: comprar por curva (proporción fija de talles por bulto) ── */
function ModalCompraPorCurva({ open, onClose, onAgregarLineas }) {
  const toast = useToast();
  const [productoId, setProductoId] = useState('');
  const [numCurvas, setNumCurvas] = useState('1');
  const [cantidades, setCantidades] = useState({});
  // El dropdown necesita ver TODOS los productos con talles, no un top-N de
  // una búsqueda — mismo criterio que ModalActualizarPrecios: se pide sin
  // paginar, en dos pasadas (la primera solo para saber el total).
  const [productosConVariantes, setProductosConVariantes] = useState([]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const primera = await productosService.getAllPaginado({ tiene_variantes: true, estado: true, per_page: 1 });
        const total = primera.total || 0;
        if (total === 0) { setProductosConVariantes([]); return; }
        const completo = await productosService.getAllPaginado({ tiene_variantes: true, estado: true, per_page: total });
        setProductosConVariantes(completo.items);
      } catch {
        setProductosConVariantes([]);
      }
    })();
  }, [open]);

  const producto = productosConVariantes.find(p => p.id === productoId) || null;

  useEffect(() => {
    if (open) { setProductoId(''); setNumCurvas('1'); setCantidades({}); }
  }, [open]);

  // Al elegir producto o cambiar cuántas curvas, recalcula las cantidades
  // sugeridas desde cantidad_curva de cada talle — sigue siendo editable
  // a mano después (un talle sin cantidad_curva configurada arranca en 0).
  useEffect(() => {
    if (!producto) { setCantidades({}); return; }
    const n = Number(numCurvas) || 0;
    const defaults = {};
    producto.variantes.forEach(v => {
      defaults[v.id] = v.cantidadCurva ? String(v.cantidadCurva * n) : '';
    });
    setCantidades(defaults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productoId, numCurvas]);

  if (!open) return null;

  const totalUnidades = Object.values(cantidades).reduce((s, c) => s + (Number(c) || 0), 0);

  const handleConfirmar = () => {
    if (!producto) { toast('Elegí un producto', 'error'); return; }
    const nuevasLineas = producto.variantes
      .filter(v => (Number(cantidades[v.id]) || 0) > 0)
      .map(v => ({
        id_producto: v.id,
        productoData: { ...producto, id: v.id, nombre: `${producto.nombre} — Talle ${v.talle}`, codigo: v.codigo, talle: v.talle, tieneVariantes: false },
        cantidad: Number(cantidades[v.id]),
        precio_compra: producto.costo > 0 ? String(producto.costo) : '',
        precio_venta: String(producto.precioFinal ?? producto.precio ?? ''),
        margen: 10,
        fecha_vencimiento: '',
      }));
    if (nuevasLineas.length === 0) { toast('Ingresá alguna cantidad', 'error'); return; }
    onAgregarLineas(nuevasLineas);
    toast(`${nuevasLineas.length} talle${nuevasLineas.length !== 1 ? 's' : ''} agregado${nuevasLineas.length !== 1 ? 's' : ''} a la compra`, 'success');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: modalPaperSx }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: { xs: 1.5, sm: 3 }, py: { xs: 1.75, sm: 2.5 }, borderBottom: `1px solid ${BORDER}`, bgcolor: TABLE_HEADER }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: `${P}18`, border: `1px solid ${P}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CheckroomIcon sx={{ color: P, fontSize: 20 }} />
          </Box>
          <Typography sx={{ color: INK, fontWeight: 700, fontSize: 16 }}>Comprar por curva</Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: MUTED, '&:hover': { color: INK } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 1.75, sm: 2.5 } }}>
        {productosConVariantes.length === 0 ? (
          <Typography sx={{ color: MUTED, fontSize: 13, textAlign: 'center', py: 3 }}>
            No tenés productos con variantes por talle todavía.
          </Typography>
        ) : (
          <>
            <FieldLabel>Producto</FieldLabel>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <Select value={productoId} onChange={e => setProductoId(e.target.value)} displayEmpty sx={selectFieldSx}
                MenuProps={{ PaperProps: { sx: { bgcolor: DROPDOWN, border: `1px solid ${BORDER}`, color: INK } } }}
                renderValue={(v) => v ? (productosConVariantes.find(p => p.id === v)?.nombre) : <Box sx={{ color: MUTED }}>Elegir producto</Box>}>
                {productosConVariantes.map(p => (
                  <MenuItem key={p.id} value={p.id} sx={{ '&:hover': { bgcolor: HOVER } }}>{p.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {producto && (
              <>
                <FieldLabel>Cuántas curvas</FieldLabel>
                <TextField fullWidth type="number" value={numCurvas} onChange={e => setNumCurvas(e.target.value)}
                  inputProps={{ min: 0 }} sx={{ ...fieldSx, mb: 2 }} />

                <Typography sx={{ color: MUTED, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', mb: 1 }}>
                  Cantidad por talle
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                  {[...producto.variantes].sort((a, b) => (a.ordenTalle ?? 0) - (b.ordenTalle ?? 0)).map(v => (
                    <Box key={v.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ color: INK, fontSize: 13.5, fontWeight: 600 }}>Talle {v.talle}</Typography>
                        <Typography sx={{ color: MUTED, fontSize: 11 }}>
                          {v.cantidadCurva ? `${v.cantidadCurva} por curva` : 'Sin cantidad de curva configurada'}
                        </Typography>
                      </Box>
                      <TextField type="number" size="small" placeholder="0" value={cantidades[v.id] ?? ''}
                        onChange={e => setCantidades(c => ({ ...c, [v.id]: e.target.value }))}
                        inputProps={{ min: 0 }} sx={{ width: 84, '& input': { textAlign: 'center' } }} />
                    </Box>
                  ))}
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2.5, py: 1.5, borderRadius: '10px', bgcolor: `${P}0c`, border: `1px solid ${P}18`, mb: 2.5 }}>
                  <Typography sx={{ color: INK, fontSize: 13.5, fontWeight: 700 }}>Total de unidades</Typography>
                  <Typography sx={{ color: P, fontSize: 16, fontWeight: 800 }}>{totalUnidades}</Typography>
                </Box>

                <Button fullWidth variant="contained" disabled={totalUnidades <= 0} onClick={handleConfirmar}
                  sx={{ bgcolor: P, textTransform: 'none', fontWeight: 700, borderRadius: '8px', py: 1.1, '&:hover': { bgcolor: P_HOVER }, '&.Mui-disabled': { opacity: 0.4, color: '#fff', bgcolor: P } }}>
                  Agregar a la compra
                </Button>
              </>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DetalleCompraItem({ label, value }) {
  return (
    <Box>
      <Typography sx={{ color: MUTED, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.5 }}>{label}</Typography>
      {typeof value === 'string' || typeof value === 'number'
        ? <Typography sx={{ color: INK, fontSize: 14, fontWeight: 600 }}>{value}</Typography>
        : value}
    </Box>
  );
}

function ModalDetalleCompra({ open, onClose, compra, puedeDevolver, onAbrirDevolucion, onComprobanteActualizado }) {
  const toast = useToast();
  const isMobile = useIsMobile();
  const [pagina, setPagina] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [subiendoComprobante, setSubiendoComprobante] = useState(false);
  const [verTicketOpen, setVerTicketOpen] = useState(false);
  if (!compra) return null;

  const handleArchivoComprobante = async (file) => {
    if (!file) return;
    setSubiendoComprobante(true);
    try {
      const updated = await comprasService.subirComprobante(compra.id, file);
      onComprobanteActualizado?.(updated);
      toast('Ticket adjuntado', 'success');
    } catch {
      toast('No se pudo subir el ticket', 'error');
    } finally {
      setSubiendoComprobante(false);
    }
  };

  const handleEliminarComprobante = async () => {
    setSubiendoComprobante(true);
    try {
      const updated = await comprasService.eliminarComprobante(compra.id);
      onComprobanteActualizado?.(updated);
    } catch {
      toast('No se pudo quitar el ticket', 'error');
    } finally {
      setSubiendoComprobante(false);
    }
  };
  const ec = ESTADO_COLORS[compra.estado] || ESTADO_COLORS['pendiente'];
  const lineas = compra.lineas || [];
  const totalPages = Math.max(1, Math.ceil(lineas.length / pageSize));
  const paginadas = lineas.slice((pagina - 1) * pageSize, pagina * pageSize);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      PaperProps={{ sx: { ...modalPaperSx, borderRadius: isMobile ? '12px' : '14px' } }}>

      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: { xs: 1.5, sm: 3 }, pt: { xs: 1.75, sm: 3 }, pb: 0,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75, minWidth: 0 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: '12px', bgcolor: `${P}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ReceiptLongIcon sx={{ color: P, fontSize: 20 }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ color: INK, fontWeight: 700, fontSize: 17 }} noWrap>Compra a {compra.proveedor}</Typography>
            <Typography sx={{ color: MUTED, fontSize: 13, mt: 0.25 }}>{fmtDate(compra.fecha)} · #{compra.id}</Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose}
          sx={{ color: MUTED, bgcolor: HOVER, borderRadius: '8px', flexShrink: 0, '&:hover': { color: INK, bgcolor: `${MUTED}20` } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent sx={{ px: { xs: 1.5, sm: 3 }, pt: { xs: 1.5, sm: 2 }, pb: { xs: 1.75, sm: 3 } }}>
        <Box sx={{
          display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(5, 1fr)' }, gap: 2,
          mb: 2.5, p: 2, bgcolor: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px',
        }}>
          <DetalleCompraItem label="Proveedor" value={compra.proveedor} />
          <DetalleCompraItem label="Fecha" value={fmtDate(compra.fecha)} />
          <DetalleCompraItem label="Método de pago" value={METODO_LABELS[compra.metodo_pago] || compra.metodo_pago} />
          <DetalleCompraItem label="Estado" value={
            <Chip label={compra.estado.charAt(0).toUpperCase() + compra.estado.slice(1)} size="small"
              sx={{ bgcolor: ec.bg, color: ec.fg, fontWeight: 600, fontSize: 12, borderRadius: '6px', border: `1px solid ${ec.border}` }} />
          } />
          <DetalleCompraItem label="Total" value={
            <Typography sx={{ color: INK, fontSize: 16, fontWeight: 800 }}>{fmtMoney(compra.total)}</Typography>
          } />
          <DetalleCompraItem label="Ticket del proveedor" value={
            compra.comprobanteUrl ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography onClick={() => setVerTicketOpen(true)}
                  sx={{ color: P, fontSize: 14, fontWeight: 600, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                  Ver ticket
                </Typography>
                <IconButton size="small" onClick={handleEliminarComprobante} disabled={subiendoComprobante}
                  sx={{ color: MUTED, p: 0.25, '&:hover': { color: ERROR } }}>
                  <CloseIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Box>
            ) : (
              <Button component="label" size="small" disabled={subiendoComprobante}
                sx={{ color: P, textTransform: 'none', fontWeight: 600, fontSize: 13, p: 0, minWidth: 0, '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' } }}>
                {subiendoComprobante ? 'Subiendo...' : 'Adjuntar ticket'}
                <input type="file" hidden accept=".png,.jpg,.jpeg,.webp,.pdf" onChange={e => handleArchivoComprobante(e.target.files?.[0])} />
              </Button>
            )
          } />
          {compra.estado === 'cancelada' && compra.anuladoPor && (
            <DetalleCompraItem label="Anulado por" value={
              <Typography sx={{ color: ERROR, fontSize: 14, fontWeight: 600 }}>
                {compra.anuladoPor}{compra.fechaAnulacion ? ` · ${fmtDate(compra.fechaAnulacion)}` : ''}
              </Typography>
            } />
          )}
        </Box>

        <Typography sx={{ color: INK2, fontSize: 13, fontWeight: 600, mb: 1.5 }}>
          Productos <Box component="span" sx={{ color: MUTED, fontWeight: 400 }}>({lineas.length})</Box>
        </Typography>
        {lineas.length === 0 ? (
          <Box sx={{ border: `1px solid ${BORDER}`, borderRadius: '10px' }}>
            <Typography sx={{ color: MUTED, fontSize: 13, p: 2 }}>Sin detalle de productos</Typography>
          </Box>
        ) : isMobile ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {paginadas.map((l, i) => (
              <Box key={i} sx={{ bgcolor: HOVER, border: `1px solid ${BORDER}`, borderRadius: '10px', p: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.75 }}>
                  <Typography sx={{ color: INK, fontSize: 13.5, fontWeight: 600, flex: 1, minWidth: 0 }}>{l.nombre}</Typography>
                  <Typography sx={{ color: INK, fontSize: 14, fontWeight: 700, flexShrink: 0, ml: 1 }}>{fmtMoney(l.subtotal)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 0.5 }}>
                  <Typography sx={{ color: MUTED, fontSize: 12 }}>Cantidad: <Box component="span" sx={{ color: INK2, fontWeight: 600 }}>{l.cantidad}{esFraccionable(l.unidadMedida) ? ` ${abrevUnidad(l.unidadMedida)}` : ''}</Box></Typography>
                  <Typography sx={{ color: MUTED, fontSize: 12 }}>Costo: <Box component="span" sx={{ color: INK2, fontWeight: 600 }}>{fmtMoney(l.precio_compra)}</Box></Typography>
                  <Typography sx={{ color: MUTED, fontSize: 12 }}>Precio venta: <Box component="span" sx={{ color: INK2, fontWeight: 600 }}>{l.precio_venta != null ? fmtMoney(l.precio_venta) : '—'}</Box></Typography>
                </Box>
              </Box>
            ))}
            {lineas.length > pageSize && (
              <TablePagination pagina={pagina} totalPages={totalPages} pageSize={pageSize} totalItems={lineas.length} label="productos"
                onPageChange={setPagina} onPageSizeChange={(s) => { setPageSize(s); setPagina(1); }} />
            )}
          </Box>
        ) : (
          <Box sx={{ border: `1px solid ${BORDER}`, borderRadius: '10px', overflow: 'hidden' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', px: 2, py: 1, bgcolor: TABLE_HEADER, borderBottom: `1px solid ${BORDER}` }}>
              {[['Producto', 'left'], ['Cant.', 'center'], ['Costo', 'right'], ['Precio venta', 'right'], ['Subtotal', 'right']].map(([h, align]) => (
                <Typography key={h} sx={{ color: MUTED, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: align }}>{h}</Typography>
              ))}
            </Box>
            {paginadas.map((l, i) => (
              <Box key={i} sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', px: 2, py: 1.25, borderBottom: `1px solid ${BORDER}`, '&:last-child': { borderBottom: 'none' }, '&:hover': { bgcolor: HOVER } }}>
                <Typography sx={{ color: INK, fontSize: 13 }} noWrap>{l.nombre}</Typography>
                <Typography sx={{ color: INK2, fontSize: 13, textAlign: 'center' }}>{l.cantidad}{esFraccionable(l.unidadMedida) ? ` ${abrevUnidad(l.unidadMedida)}` : ''}</Typography>
                <Typography sx={{ color: INK2, fontSize: 13, textAlign: 'right' }}>{fmtMoney(l.precio_compra)}</Typography>
                <Typography sx={{ color: INK2, fontSize: 13, textAlign: 'right' }}>{l.precio_venta != null ? fmtMoney(l.precio_venta) : '—'}</Typography>
                <Typography sx={{ color: INK, fontSize: 13, fontWeight: 600, textAlign: 'right' }}>{fmtMoney(l.subtotal)}</Typography>
              </Box>
            ))}
            {lineas.length > pageSize && (
              <TablePagination pagina={pagina} totalPages={totalPages} pageSize={pageSize} totalItems={lineas.length} label="productos"
                onPageChange={setPagina} onPageSizeChange={(s) => { setPageSize(s); setPagina(1); }} />
            )}
          </Box>
        )}

        {compra.estado === 'confirmada' && puedeDevolver && lineas.some(l => (l.disponibleDevolver ?? l.cantidad) > 0) && (
          <Button fullWidth startIcon={<AssignmentReturnIcon sx={{ fontSize: 17 }} />} onClick={onAbrirDevolucion}
            sx={{ mt: 2.5, color: P, borderColor: `${P}55`, textTransform: 'none', fontWeight: 600, fontSize: 13.5, borderRadius: '8px', py: 1, border: `1px solid ${P}55`, '&:hover': { bgcolor: `${P}12` } }}>
            Devolver mercadería
          </Button>
        )}
      </DialogContent>
      <ModalVerComprobante open={verTicketOpen} onClose={() => setVerTicketOpen(false)} url={compra.comprobanteUrl} />
    </Dialog>
  );
}

/* ── Modal: devolución parcial de mercadería a un proveedor ── */
function ModalDevolucionCompra({ open, onClose, compra, onDevuelto }) {
  const toast = useToast();
  const [cantidades, setCantidades] = useState({});
  const [motivo, setMotivo] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) { setCantidades({}); setMotivo(''); }
  }, [open, compra?.id]);

  if (!compra) return null;

  const lineasDevolvibles = (compra.lineas || []).filter(l => (l.disponibleDevolver ?? l.cantidad) > 0);

  const totalADevolver = lineasDevolvibles.reduce((s, l) => {
    const cant = Math.min(Number(cantidades[l.id]) || 0, l.disponibleDevolver ?? l.cantidad);
    return s + cant * l.precio_compra;
  }, 0);

  const handleConfirmar = async () => {
    const lineas = lineasDevolvibles
      .map(l => ({ idLineaCompra: l.id, cantidad: Math.min(Number(cantidades[l.id]) || 0, l.disponibleDevolver ?? l.cantidad) }))
      .filter(l => l.cantidad > 0);
    if (lineas.length === 0) { toast('Ingresá una cantidad a devolver', 'error'); return; }

    setSaving(true);
    try {
      const { message } = await comprasService.crearDevolucion(compra.id, { lineas, motivo: motivo.trim() });
      const compraActualizada = await comprasService.getById(compra.id);
      onDevuelto?.(compraActualizada);
      toast(message || 'Devolución registrada', 'success');
      onClose();
    } catch (e) {
      toast(e.response?.data?.message || 'No se pudo registrar la devolución', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: modalPaperSx }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: { xs: 1.5, sm: 3 }, py: { xs: 1.75, sm: 2.5 }, borderBottom: `1px solid ${BORDER}`, bgcolor: TABLE_HEADER }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: `${P}18`, border: `1px solid ${P}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AssignmentReturnIcon sx={{ color: P, fontSize: 20 }} />
          </Box>
          <Typography sx={{ color: INK, fontWeight: 700, fontSize: 16 }}>Devolver mercadería</Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: MUTED, '&:hover': { color: INK } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 1.75, sm: 2.5 }, maxHeight: '70vh', overflowY: 'auto' }}>
        {lineasDevolvibles.length === 0 ? (
          <Typography sx={{ color: MUTED, fontSize: 13, textAlign: 'center', py: 3 }}>
            No queda nada de esta compra disponible para devolver.
          </Typography>
        ) : (
          <>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2.5 }}>
              {lineasDevolvibles.map(l => (
                <Box key={l.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, border: `1px solid ${BORDER}`, borderRadius: '10px', p: 1.5 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ color: INK, fontSize: 13.5, fontWeight: 600 }} noWrap>{l.nombre}</Typography>
                    <Typography sx={{ color: MUTED, fontSize: 11.5 }}>
                      {fmtMoney(l.precio_compra)} c/u · disponible: {l.disponibleDevolver ?? l.cantidad} de {l.cantidad}{esFraccionable(l.unidadMedida) ? ` ${abrevUnidad(l.unidadMedida)}` : ''}
                    </Typography>
                  </Box>
                  <TextField type="number" size="small" placeholder="0" value={cantidades[l.id] ?? ''}
                    onChange={e => {
                      const raw = e.target.value;
                      const max = l.disponibleDevolver ?? l.cantidad;
                      const clamped = raw === '' ? '' : String(Math.max(0, Math.min(Number(raw) || 0, max)));
                      setCantidades(c => ({ ...c, [l.id]: clamped }));
                    }}
                    inputProps={{ min: 0, max: l.disponibleDevolver ?? l.cantidad, step: '0.01' }}
                    sx={{ width: 84, '& input': { textAlign: 'center' } }} />
                </Box>
              ))}
            </Box>

            <TextField fullWidth placeholder="Motivo (opcional)" value={motivo} onChange={e => setMotivo(e.target.value)} sx={{ mb: 2.5 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2.5, py: 1.75, borderRadius: '10px', bgcolor: `${P}0c`, border: `1px solid ${P}18`, mb: 2.5 }}>
              <Typography sx={{ color: INK, fontSize: 14, fontWeight: 700 }}>Total a devolver</Typography>
              <Typography sx={{ color: P, fontSize: 18, fontWeight: 800 }}>{fmtMoney(totalADevolver)}</Typography>
            </Box>

            <Button fullWidth variant="contained" disabled={saving || totalADevolver <= 0} onClick={handleConfirmar}
              sx={{ bgcolor: P, textTransform: 'none', fontWeight: 700, borderRadius: '8px', py: 1.25, '&:hover': { bgcolor: P, filter: 'brightness(0.92)' }, '&.Mui-disabled': { opacity: 0.4, color: '#fff', bgcolor: P } }}>
              {saving ? 'Registrando...' : 'Confirmar devolución'}
            </Button>
          </>
        )}
      </Box>
    </Dialog>
  );
}

const COLUMNS = [
  {
    key: 'proveedor', header: 'Proveedor', flex: true, sortable: true,
    render: (c) => <Typography sx={{ color: INK, fontSize: 14, fontWeight: 600 }} noWrap>{c.proveedor}</Typography>,
  },
  {
    key: 'fecha', header: 'Fecha', flex: true, sortable: true,
    render: (c) => <Typography sx={{ color: INK2, fontSize: 14 }}>{fmtDate(c.fecha)}</Typography>,
  },
  {
    key: 'total', header: 'Total', flex: true, sortable: true,
    render: (c) => <Typography sx={{ color: INK, fontSize: 14, fontWeight: 600 }}>{fmtMoney(c.total)}</Typography>,
  },
  {
    key: 'estado', header: 'Estado', flex: true,
    render: (c) => {
      const ec = ESTADO_COLORS[c.estado] || ESTADO_COLORS['pendiente'];
      return <Chip label={c.estado.charAt(0).toUpperCase() + c.estado.slice(1)} size="small" sx={{ bgcolor: ec.bg, color: ec.fg, fontWeight: 600, fontSize: 12, borderRadius: '6px', border: `1px solid ${ec.border}` }} />;
    },
  },
];

export default function Compras() {
  const toast = useToast();
  const { user } = useAuth();
  const { checkPermisos } = useHasPermiso();
  const puedeAnular = checkPermisos('anularCompra');
  const puedeDevolver = checkPermisos('devolverCompra');
  const puedeFiltrarFechas = checkPermisos('verFiltrosFechas');
  const hoy = toLocalDateStr();
  const { tieneIA } = usePlan();
  const { recargarProductos, crearProducto } = useProductos();
  const [compras,    setCompras]    = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [sortCol,    setSortCol]    = useState('fecha');
  const [sortDir,    setSortDir]    = useState('desc');
  const [openModal,    setOpenModal]    = useState(false);
  const [openScan,     setOpenScan]     = useState(false);
  const [openImportExcel, setOpenImportExcel] = useState(false);
  const [scanData,     setScanData]     = useState(null);
  const [showFilters,  setShowFilters]  = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroDesde,  setFiltroDesde]  = useState('');
  const [filtroHasta,  setFiltroHasta]  = useState('');
  // Sin el permiso ver-filtros-fechas, el filtro queda forzado al día de hoy.
  const effDesde = puedeFiltrarFechas ? filtroDesde : hoy;
  const effHasta = puedeFiltrarFechas ? filtroHasta : hoy;
  const [pagina,       setPagina]       = useState(1);
  const [pageSize,     setPageSize]     = useState(10);
  const [compraVer,    setCompraVer]    = useState(null);
  const [compraEditar, setCompraEditar] = useState(null);
  const [compraAAnular, setCompraAAnular] = useState(null);
  const [anulando,      setAnulando]      = useState(false);
  const [modalDevolucion, setModalDevolucion] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [c, p] = await Promise.all([comprasService.getAll(), proveedoresService.getAll()]);
      setCompras(c);
      setProveedores(p);
    } catch { toast('Error al cargar las compras', 'error'); } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    registerTour('/compras', [
      { element: '[data-tour="compras-escanear"]', title: 'Escanear factura', description: 'Sacale una foto a la factura del proveedor y la IA completa los productos y montos automáticamente.' },
      { element: '[data-tour="compras-buscar"]', title: 'Buscar y filtrar', description: 'Buscá por proveedor, estado o fecha, y usá Filtros para acotar por estado (pendiente, confirmada, cancelada) o por un rango de fechas Desde/Hasta.' },
      { element: '[data-tour="compras-tabla"]', title: 'Historial de compras', description: 'Acá ves todas las compras registradas.' },
      { element: '[data-tour="compras-acciones"]', title: 'Acciones de la fila', description: 'Ojo: detalle de la compra. Lápiz: editar productos, precios o estado. Verde: exportar a Excel. Rojo: exportar a PDF con el resumen de la compra.' },
      { element: '[data-tour="compras-nueva"]', title: 'Nueva compra', description: 'Vamos a ver cómo se carga una compra nueva. Hacé clic en "Siguiente".', click: true, clickDelay: 300 },
      { element: '[data-tour="compras-modal-proveedor"]', title: 'Proveedor', description: 'Elegí a quién le compraste. Es el único dato obligatorio además de los productos.' },
      { element: '[data-tour="compras-modal-lineas"]', title: 'Productos de la compra', description: 'Buscá el producto por nombre o código. Si todavía no existe, escribí el nombre y elegí "+ Crear" para darlo de alta sin salir de acá. Cargá cantidad, costo y precio de venta — el margen se calcula solo (y también podés pedirle una sugerencia a la IA con el ícono de la estrella).' },
      { element: '[data-tour="compras-modal-curva"]', optional: true, title: 'Comprar por curva', description: 'Si el producto tiene talles, cargá varias líneas de una sola vez según la curva del proveedor (ej. 1-2-3-3-2-1) en lugar de agregarlas a mano.' },
      { element: '[data-tour="compras-modal-estado"]', title: 'Estado de la compra', description: '"Confirmada" suma el stock al instante. "Pendiente" no toca el stock hasta que la confirmes. "Cancelada" no afecta nada.' },
      { element: '[data-tour="compras-modal-registrar"]', title: 'Registrar', description: 'Guardá la compra con todos los datos cargados.' },
      { element: '[data-tour="compras-modal-cerrar"]', title: 'Listo', description: 'Cerramos el formulario y volvemos al listado de compras.', click: true, clickDelay: 200 },
    ]);
  }, []);

  const toggleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
    setPagina(1);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = [...compras];
    if (q) list = list.filter(c => (c.proveedor || '').toLowerCase().includes(q) || c.estado.includes(q) || c.fecha.includes(q));
    if (filtroEstado) list = list.filter(c => c.estado === filtroEstado);
    if (effDesde) list = list.filter(c => c.fecha >= effDesde);
    if (effHasta) list = list.filter(c => c.fecha <= effHasta);
    list.sort((a, b) => {
      const va = sortCol === 'total' ? a.total : sortCol === 'fecha' ? a.fecha : (a.proveedor || '').toLowerCase();
      const vb = sortCol === 'total' ? b.total : sortCol === 'fecha' ? b.fecha : (b.proveedor || '').toLowerCase();
      return sortDir === 'asc' ? (va < vb ? -1 : va > vb ? 1 : 0) : (va > vb ? -1 : va < vb ? 1 : 0);
    });
    return list;
  }, [compras, search, filtroEstado, effDesde, effHasta, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged      = filtered.slice((pagina - 1) * pageSize, pagina * pageSize);

  const pendientesViejas = useMemo(() => calcularPendientesViejas(compras), [compras]);

  const handleCrear = (nueva) => { setCompras(cs => [nueva, ...cs]); setPagina(1); recargarProductos(); };

  const handleActualizar = (updated) => {
    setCompras(cs => cs.map(c => c.id === updated.id ? updated : c));
    recargarProductos();
  };

  const handleVerDetalle = async (c) => {
    try {
      const full = await comprasService.getById(c.id);
      setCompraVer(full);
    } catch { toast('Error al cargar detalle', 'error'); }
  };

  const handleEditar = async (c) => {
    // Una compra confirmada ya sumó stock y (si fue en efectivo) movió caja —
    // permitir editarla reabre la ventana de "revertir viejo + aplicar nuevo"
    // sin poder saber si ese stock ya se vendió entre medio.
    if (c.estado === 'confirmada') {
      toast('Esta compra ya está confirmada y no se puede editar.', 'error');
      return;
    }
    try {
      const full = await comprasService.getById(c.id);
      setCompraEditar(full);
      setScanData(null);
      setOpenModal(true);
    } catch { toast('Error al cargar la compra', 'error'); }
  };

  // Anular = pasar una compra confirmada a "cancelada" sin reabrir la edición
  // de líneas: el backend revierte el stock que había sumado y, si el pago
  // fue en efectivo, devuelve el monto a la caja (ComprasController::changeStatus).
  const handleAnular = async () => {
    if (!compraAAnular) return;
    setAnulando(true);
    try {
      const updated = await comprasService.changeStatus(compraAAnular.id, 'cancelada');
      handleActualizar(updated);
      toast('Compra anulada. Se revirtió el stock y la caja correspondiente.', 'success');
    } catch (e) {
      toast(e.response?.data?.message || 'Error al anular la compra', 'error');
    } finally {
      setAnulando(false);
      setCompraAAnular(null);
    }
  };

  const handleScanConfirm = (data) => {
    setScanData(data);
    setOpenModal(true);
  };

  /* ── Helpers y constantes para PDF ── */
  function hexToRgb(hex) {
    const clean = hex.replace('#', '');
    return [parseInt(clean.slice(0, 2), 16), parseInt(clean.slice(2, 4), 16), parseInt(clean.slice(4, 6), 16)];
  }
  const PDF_PRIMARY = hexToRgb(PRIMARY_COLOR);
  const PDF_INK     = [30, 32, 40];
  const PDF_MUTED   = [110, 116, 130];
  const PDF_ESTADO  = {
    confirmada: { fill: [34, 197, 94],  label: 'Confirmada' },
    pendiente:  { fill: [245, 158, 11], label: 'Pendiente'  },
    cancelada:  { fill: [239, 68, 68],  label: 'Cancelada'  },
  };

  const exportarCompraExcel = async (c) => {
    const full = await comprasService.getById(c.id);
    await exportarExcel({
      filename: `compra-${c.proveedor || c.id}-${c.fecha}.xlsx`,
      sheetName: 'Compra',
      title: `Compra a ${c.proveedor}`,
      subtitle: `${c.fecha} · Total: ${fmtMoney(full.total)} · Estado: ${full.estado}`,
      columns: [
        { header: 'Producto', width: 32 },
        { header: 'Cant.',    width: 10, align: 'center' },
        { header: 'Unidad',   width: 12 },
        { header: 'Costo unit.', width: 16, numFmt: '$#,##0.00', align: 'right' },
        { header: 'Subtotal', width: 16, numFmt: '$#,##0.00', align: 'right' },
      ],
      rows: full.lineas.map(l => [l.nombre, l.cantidad, UNIDAD_LABEL[l.unidadMedida] || UNIDAD_LABEL.unidad, l.precio_compra, l.subtotal]),
    });
  };

  const exportarCompraPDF = async (c) => {
    const full = await comprasService.getById(c.id);
    // autoTable también diferido — antes quedaba estático arriba mientras
    // jsPDF ya se cargaba de una, así que la mitad del ahorro se perdía igual.
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'), import('jspdf-autotable'),
    ]);
    const doc   = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    const hoy   = new Date().toLocaleDateString('es-AR');
    const estado = PDF_ESTADO[full.estado] || PDF_ESTADO.pendiente;

    /* ── Banda de color ── */
    doc.setFillColor(...PDF_PRIMARY);
    doc.rect(0, 0, pageW, 30, 'F');
    doc.setFontSize(17);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(user?.empresa?.nombre || COMPANY_NAME, 14, 17);
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('Comprobante de compra', 14, 25);

    doc.setFontSize(9);
    doc.text(`Emitido: ${hoy}`, pageW - 14, 17, { align: 'right' });
    doc.text(`Compra N° ${c.id}`, pageW - 14, 25, { align: 'right' });

    /* ── Datos del proveedor ── */
    let y = 42;
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...PDF_INK);
    doc.text(`Proveedor: ${c.proveedor}`, 14, y);
    doc.setFontSize(9.5);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(...PDF_MUTED);
    y += 7;
    doc.text(`${c.fecha} · Metodo: ${full.metodo_pago?.replace('_', ' ') || '-'}`, 14, y);

    /* Pill de estado */
    const pillLabel = estado.label;
    const pillW = doc.getTextWidth(pillLabel) + 8;
    doc.setFillColor(...estado.fill);
    doc.roundedRect(pageW - 14 - pillW, y - 5, pillW, 6.5, 1.5, 1.5, 'F');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text(pillLabel, pageW - 14 - pillW / 2, y - 0.7, { align: 'center' });

    y += 6;

    /* ── Tabla de productos ── */
    autoTable(doc, {
      startY: y,
      head: [[
        { content: 'Producto' },
        { content: 'Cant.',       styles: { halign: 'center' } },
        { content: 'Costo unit.', styles: { halign: 'right' } },
        { content: 'Subtotal',    styles: { halign: 'right' } },
      ]],
      body: full.lineas.map(l => [
        l.nombre,
        { content: `${l.cantidad}${esFraccionable(l.unidadMedida) ? ` ${abrevUnidad(l.unidadMedida)}` : ''}`, styles: { halign: 'center' } },
        { content: fmtMoney(l.precio_compra),  styles: { halign: 'right' } },
        { content: fmtMoney(l.subtotal),       styles: { halign: 'right' } },
      ]),
      foot: [[
        { content: 'TOTAL COMPRA', colSpan: 3, styles: { halign: 'right' } },
        { content: fmtMoney(full.total),       styles: { halign: 'right' } },
      ]],
      styles:       { fontSize: 9, textColor: PDF_INK },
      headStyles:   { fillColor: PDF_PRIMARY, textColor: 255, fontSize: 9, fontStyle: 'bold' },
      footStyles:   { fillColor: [245, 246, 250], textColor: PDF_INK, fontStyle: 'bold', fontSize: 9.5 },
      columnStyles: {
        1: { cellWidth: 18 },
        2: { cellWidth: 32 },
        3: { cellWidth: 32 },
      },
      margin: { left: 14, right: 14 },
    });

    doc.save(`compra-${c.proveedor || c.id}-${c.fecha}.pdf`);
  };

  return (
    <Box sx={{ width: '100%', height: '100%', overflowY: 'auto', overflowX: 'hidden', bgcolor: BG, p: { xs: 2, md: 3 } }}>

      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1.5 }}>
        <Box>
          <Typography sx={{ color: INK, fontWeight: 700, fontSize: { xs: 22, md: 28 }, letterSpacing: '-0.02em', lineHeight: 1.2 }}>Compras</Typography>
          <Typography sx={{ color: MUTED, fontSize: 14, mt: 0.25 }}>{compras.length} compras registradas</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {tieneIA && (
            <Tooltip title="Escanear factura">
              <Button data-tour="compras-escanear" startIcon={<AutoAwesomeIcon sx={{ fontSize: 15 }} />} onClick={() => setOpenScan(true)}
                sx={{ color: P, borderColor: `${P}50`, border: '1px solid', textTransform: 'none', fontSize: 13, fontWeight: 600, px: { xs: 1.25, sm: 2 }, minWidth: 0, '& .MuiButton-startIcon': { mr: { xs: 0, sm: 1 } }, borderRadius: '8px', '&:hover': { bgcolor: `${P}10`, borderColor: P } }}>
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Escanear factura</Box>
              </Button>
            </Tooltip>
          )}
          <Tooltip title="Importar desde Excel">
            <Button startIcon={<TableChartIcon sx={{ fontSize: 15 }} />} onClick={() => setOpenImportExcel(true)}
              sx={{ color: INK2, borderColor: BORDER, border: '1px solid', textTransform: 'none', fontSize: 13, fontWeight: 600, px: { xs: 1.25, sm: 2 }, minWidth: 0, '& .MuiButton-startIcon': { mr: { xs: 0, sm: 1 } }, borderRadius: '8px', '&:hover': { bgcolor: HOVER, borderColor: 'var(--border-hover)' } }}>
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Importar Excel</Box>
            </Button>
          </Tooltip>
          <Tooltip title="Nueva Compra">
            <Button data-tour="compras-nueva" variant="contained" startIcon={<AddIcon />} onClick={() => { setScanData(null); setOpenModal(true); }}
              sx={{ bgcolor: P, textTransform: 'none', fontSize: 13, fontWeight: 600, px: { xs: 1.25, sm: 2.5 }, minWidth: 0, '& .MuiButton-startIcon': { mr: { xs: 0, sm: 1 } }, borderRadius: '8px', '&:hover': { bgcolor: P_HOVER } }}>
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Nueva Compra</Box>
            </Button>
          </Tooltip>
          <AyudaButton />
        </Box>
      </Box>

      {pendientesViejas.length > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, px: 2, py: 1.5, bgcolor: `${WARNING}18`, border: `1px solid ${WARNING}44`, borderRadius: '10px' }}>
          <Typography sx={{ fontSize: 18, lineHeight: 1 }}>⚠️</Typography>
          <Box>
            <Typography sx={{ color: WARNING, fontWeight: 700, fontSize: 13 }}>
              {pendientesViejas.length === 1
                ? '1 compra pendiente sin confirmar hace más de 7 días'
                : `${pendientesViejas.length} compras pendientes sin confirmar hace más de 7 días`}
            </Typography>
            <Typography sx={{ color: MUTED, fontSize: 12 }}>
              Revisalas y confirmá o cancelá según corresponda.
            </Typography>
          </Box>
          <Button size="small" onClick={() => { setFiltroEstado('pendiente'); setShowFilters(true); setPagina(1); }}
            sx={{ ml: 'auto', color: WARNING, borderColor: `${WARNING}66`, border: '1px solid', textTransform: 'none', fontWeight: 600, fontSize: 12, borderRadius: '8px', px: 1.5, flexShrink: 0, '&:hover': { bgcolor: `${WARNING}18` } }}>
            Ver pendientes
          </Button>
        </Box>
      )}

      <Box data-tour="compras-buscar" sx={{ display: 'flex', gap: 1.5, mb: showFilters ? 1 : 2.5 }}>
        <TextField fullWidth placeholder="Buscar por proveedor, estado o fecha..."
          value={search} onChange={e => { setSearch(e.target.value); setPagina(1); }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: MUTED }} /></InputAdornment> }}
          sx={{ ...fieldSx, '& .MuiInputBase-input': { py: '13px', px: '14px' } }}
        />
        <Button variant="outlined" startIcon={<FilterListIcon />}
          onClick={() => setShowFilters(v => !v)}
          sx={{ color: showFilters ? P : INK2, borderColor: showFilters ? P : BORDER, textTransform: 'none', fontWeight: 600, borderRadius: '10px', px: 2.5, whiteSpace: 'nowrap', '&:hover': { borderColor: 'var(--border-hover)', bgcolor: HOVER } }}>
          Filtros{(filtroEstado || filtroDesde || filtroHasta) ? ' •' : ''}
        </Button>
      </Box>

      <Collapse in={showFilters}>
        <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5, flexWrap: 'wrap', p: 2, bgcolor: CARD, border: `1px solid ${BORDER}`, borderRadius: '10px' }}>
          <FormControl sx={{ minWidth: 160 }}>
            <Select value={filtroEstado} onChange={e => { setFiltroEstado(e.target.value); setPagina(1); }} displayEmpty
              sx={{ bgcolor: INPUT, color: INK, fontSize: 13, borderRadius: '8px', '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border-hover)' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: P, borderWidth: 1 }, '& .MuiSvgIcon-root': { color: MUTED }, '& .MuiSelect-select': { py: '9px', px: '12px' } }}
              MenuProps={{ PaperProps: { sx: { bgcolor: DROPDOWN, border: `1px solid ${BORDER}`, color: INK } } }}>
              <MenuItem value="">Todos los estados</MenuItem>
              {ESTADOS.map(e => (
                <MenuItem key={e} value={e} sx={{ fontSize: 13, textTransform: 'capitalize', '&:hover': { bgcolor: HOVER } }}>
                  {e.charAt(0).toUpperCase() + e.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField type="date" size="small" label="Desde" InputLabelProps={{ shrink: true }}
            value={effDesde} inputProps={{ max: filtroHasta || undefined }}
            onChange={e => { setFiltroDesde(e.target.value); setPagina(1); }}
            disabled={!puedeFiltrarFechas}
            sx={{ ...fieldSx, '& .MuiInputBase-input': { py: '9px', px: '12px' } }} />
          <TextField type="date" size="small" label="Hasta" InputLabelProps={{ shrink: true }}
            value={effHasta} inputProps={{ min: filtroDesde || undefined }}
            onChange={e => { setFiltroHasta(e.target.value); setPagina(1); }}
            disabled={!puedeFiltrarFechas}
            sx={{ ...fieldSx, '& .MuiInputBase-input': { py: '9px', px: '12px' } }} />
          {(filtroEstado || filtroDesde || filtroHasta) && (
            <Button onClick={() => { setFiltroEstado(''); setFiltroDesde(''); setFiltroHasta(''); setPagina(1); }}
              sx={{ fontSize: 13, textTransform: 'none', color: MUTED, '&:hover': { color: INK, bgcolor: HOVER }, borderRadius: '8px' }}>
              Limpiar
            </Button>
          )}
        </Box>
      </Collapse>

      <Box data-tour="compras-tabla" sx={{ bgcolor: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', overflow: 'hidden' }}>
        <Box sx={{ px: 3, py: 2.5, borderBottom: `1px solid ${BORDER}` }}>
          <Typography sx={{ color: INK, fontWeight: 700, fontSize: 16 }}>Historial de Compras</Typography>
          <Typography sx={{ color: MUTED, fontSize: 13, mt: 0.25 }}>{compras.length} compras registradas</Typography>
        </Box>

        {!loading && paged.length === 0 ? (
          <Box sx={{ py: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
            <Typography sx={{ fontSize: 40 }}>🛒</Typography>
            <Typography sx={{ color: INK, fontWeight: 700, fontSize: 16 }}>No hay compras</Typography>
            <Typography sx={{ color: MUTED, fontSize: 14 }}>Aún no has registrado ninguna compra.</Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenModal(true)}
              sx={{ bgcolor: P, textTransform: 'none', fontWeight: 600, borderRadius: '8px', mt: 0.5, '&:hover': { bgcolor: P_HOVER } }}>
              Registrar primer compra
            </Button>
          </Box>
        ) : (
          <>
            <DataTable
              columns={COLUMNS}
              rows={paged}
              loading={loading}
              sort={{ col: sortCol, dir: sortDir, onChange: toggleSort }}
              actions={{
                onView: handleVerDetalle,
                onEdit: handleEditar,
                extra: (c) => (
                  <>
                    {c.estado === 'confirmada' && puedeAnular && (
                      <Tooltip title="Anular compra">
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); setCompraAAnular(c); }}
                          sx={{ color: MUTED, '&:hover': { color: ERROR, bgcolor: ERROR_BG }, borderRadius: '6px', p: '4px' }}>
                          <BlockIcon sx={{ fontSize: 15 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Excel">
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); exportarCompraExcel(c); }}
                        sx={{ color: MUTED, '&:hover': { color: '#22c55e' }, borderRadius: '6px', p: '4px' }}>
                        <FileDownloadIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="PDF">
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); exportarCompraPDF(c); }}
                        sx={{ color: MUTED, '&:hover': { color: ERROR }, borderRadius: '6px', p: '4px' }}>
                        <PictureAsPdfIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                    </Tooltip>
                  </>
                ),
              }}
              actionsTourId="compras-acciones"
              emptyMessage="Sin compras"
              mobileCard={(c) => {
                const ec = ESTADO_COLORS[c.estado] || ESTADO_COLORS['pendiente'];
                return (
                  <Box sx={{ bgcolor: HOVER, border: `1px solid ${BORDER}`, borderRadius: '10px', p: 2 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 0.75 }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ color: INK, fontWeight: 600, fontSize: 14 }}>{c.proveedor}</Typography>
                        <Typography sx={{ color: MUTED, fontSize: 12 }}>{fmtDate(c.fecha)}</Typography>
                      </Box>
                      <Typography sx={{ color: INK, fontWeight: 700, fontSize: 15, flexShrink: 0 }}>{fmtMoney(c.total)}</Typography>
                    </Box>
                    <Chip label={c.estado.charAt(0).toUpperCase() + c.estado.slice(1)} size="small" sx={{ bgcolor: ec.bg, color: ec.fg, fontWeight: 600, fontSize: 12, borderRadius: '6px', border: `1px solid ${ec.border}` }} />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, mt: 1, pt: 1, borderTop: `1px solid ${BORDER}` }}>
                      <Tooltip title="Ver detalle">
                        <IconButton size="small" onClick={() => handleVerDetalle(c)} sx={{ color: MUTED, '&:hover': { color: P, bgcolor: `${P}18` }, borderRadius: '6px' }}>
                          <VisibilityIcon sx={{ fontSize: 17 }} />
                        </IconButton>
                      </Tooltip>
                      {c.estado === 'confirmada' && puedeAnular && (
                        <Tooltip title="Anular compra">
                          <IconButton size="small" onClick={() => setCompraAAnular(c)} sx={{ color: MUTED, '&:hover': { color: ERROR, bgcolor: ERROR_BG }, borderRadius: '6px' }}>
                            <BlockIcon sx={{ fontSize: 17 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                      <IconButton size="small" onClick={() => handleEditar(c)} sx={{ color: MUTED, '&:hover': { color: P, bgcolor: HOVER }, borderRadius: '6px' }}>
                        <EditIcon sx={{ fontSize: 17 }} />
                      </IconButton>
                      <Tooltip title="Excel">
                        <IconButton size="small" onClick={() => exportarCompraExcel(c)} sx={{ color: MUTED, '&:hover': { color: '#22c55e' }, borderRadius: '6px' }}>
                          <FileDownloadIcon sx={{ fontSize: 17 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="PDF">
                        <IconButton size="small" onClick={() => exportarCompraPDF(c)} sx={{ color: MUTED, '&:hover': { color: ERROR }, borderRadius: '6px' }}>
                          <PictureAsPdfIcon sx={{ fontSize: 17 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                );
              }}
            />
            {!loading && (
              <TablePagination pagina={pagina} totalPages={totalPages} pageSize={pageSize} totalItems={filtered.length} label="compras" onPageChange={setPagina} onPageSizeChange={(s) => { setPageSize(s); setPagina(1); }} />
            )}
          </>
        )}
      </Box>

      <ModalNuevaCompra
        open={openModal}
        onClose={() => { setOpenModal(false); setScanData(null); setCompraEditar(null); }}
        onCreate={handleCrear}
        onUpdate={handleActualizar}
        proveedores={proveedores}
        initialData={compraEditar ?? scanData}
        editId={compraEditar?.id}
        crearProducto={crearProducto}
      />

      <ModalDetalleCompra
        key={compraVer?.id}
        open={!!compraVer}
        onClose={() => setCompraVer(null)}
        compra={compraVer}
        puedeDevolver={puedeDevolver}
        onAbrirDevolucion={() => setModalDevolucion(true)}
        onComprobanteActualizado={updated => { setCompraVer(updated); handleActualizar(updated); }}
      />

      <ModalDevolucionCompra
        open={modalDevolucion}
        onClose={() => setModalDevolucion(false)}
        compra={compraVer}
        onDevuelto={(compraActualizada) => {
          handleActualizar(compraActualizada);
          setCompraVer(compraActualizada);
        }}
      />

      <EscanearModal
        open={openScan}
        onClose={() => setOpenScan(false)}
        onConfirm={handleScanConfirm}
        proveedores={proveedores}
      />

      <ImportarExcelModal
        open={openImportExcel}
        onClose={() => setOpenImportExcel(false)}
        onConfirm={handleScanConfirm}
        proveedores={proveedores}
      />

      <ConfirmDialog
        open={!!compraAAnular}
        onClose={() => !anulando && setCompraAAnular(null)}
        onConfirm={handleAnular}
        title="¿Anular esta compra?"
        message={`Se va a revertir el stock que sumó esta compra${compraAAnular?.metodo_pago === 'efectivo' ? ' y devolver el monto a la caja' : ''}. Esta acción no se puede deshacer.`}
        confirmLabel="Anular compra"
      />
    </Box>
  );
}
