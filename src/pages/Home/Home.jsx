import { useState, useRef, useEffect, useMemo, useContext, Suspense } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../auth/AuthContextBase';
import {
  Box, Typography, TextField, Button, InputAdornment,
  IconButton, Divider, Chip, Tooltip, Autocomplete,
  Dialog, DialogContent, DialogTitle, DialogActions, Switch, Tabs, Tab, Popover,
} from '@mui/material';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '../../utils/responsive';
import { abrevUnidad, esFraccionable as esUnidadFraccionable } from '../../utils/unidadMedida';
import { guardarIntentoActivo, leerIntentoActivo, limpiarIntentoActivo } from '../../utils/posIntentoActivo';
import { guardarCarritoDraft, leerCarritoDraft } from '../../utils/carritoDraft';
import SearchIcon            from '@mui/icons-material/Search';
import AttachMoneyIcon       from '@mui/icons-material/AttachMoney';
import AddIcon               from '@mui/icons-material/Add';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import PersonOutlineIcon     from '@mui/icons-material/PersonOutline';
import DeleteOutlineIcon     from '@mui/icons-material/DeleteOutline';
import AddCircleOutlineIcon  from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import CreditCardIcon        from '@mui/icons-material/CreditCard';
import PhoneIphoneIcon       from '@mui/icons-material/PhoneIphone';
import QrCodeIcon            from '@mui/icons-material/QrCode';
import LocalAtmIcon          from '@mui/icons-material/LocalAtm';
import CloseIcon             from '@mui/icons-material/Close';
import CheckCircleIcon       from '@mui/icons-material/CheckCircle';
import PrintIcon             from '@mui/icons-material/Print';
import WhatsAppIcon          from '@mui/icons-material/WhatsApp';
import CancelIcon            from '@mui/icons-material/Cancel';
import PointOfSaleIcon       from '@mui/icons-material/PointOfSale';
import CameraAltIcon        from '@mui/icons-material/CameraAlt';
import ShoppingBagIcon      from '@mui/icons-material/ShoppingBag';
import ReplayIcon           from '@mui/icons-material/Replay';
import KeyboardIcon         from '@mui/icons-material/Keyboard';
import CalculateIcon        from '@mui/icons-material/Calculate';

import lazyWithRetry from '../../utils/lazyWithRetry';
const BarcodeScanner = lazyWithRetry(() => import('../../components/shared/BarcodeScanner'));
import { clientesService } from '../../services/clientesService';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import AyudaButton from '../../components/shared/AyudaButton';
import CampoPrecio from '../../components/shared/CampoPrecio';
import { imprimirTicket } from '../../utils/imprimirTicket';
import { BG, CARD, BORDER, INK, INK2, MUTED, P as PRIMARY, P_HOVER, INPUT, HOVER, DROPDOWN, MODAL, modalPaperSx,
         SUCCESS, SUCCESS_BG, SUCCESS_BORDER, ERROR, ERROR_BG, ERROR_BORDER, MONEY, PURPLE, ORANGE, GOLD } from '../../theme/tokens';
import { APP_NAME, POINT_HABILITADO } from '../../config/brand';
import useHasPermiso from '../../hooks/useHasPermiso';
import usePlan from '../../hooks/usePlan';
import { registerTour } from '../../utils/tour';
import { useVentas } from '../../context/VentasContextBase';
import { useCaja } from '../../context/CajaContextBase';
import { useToast } from '../../context/ToastContext';
import { fmtMoney, fmtDate, toLocalDateStr } from '../../utils/format';
import { productosService } from '../../services/productosService';
import useBusquedaProductos from '../../hooks/useBusquedaProductos';
import useDropdownKeyboardNav from '../../hooks/useDropdownKeyboardNav';
import { emitirFactura, mapFactura } from '../../services/arcaService';
import { useFactura } from '../../hooks/queries/useFacturasQueries';
import { carritosVaciadosService } from '../../services/carritosVaciadosService';
import { mercadopagoService } from '../../services/mercadopagoService';
import QRCode from 'qrcode';
import ReceiptIcon    from '@mui/icons-material/Receipt';
import HandshakeIcon  from '@mui/icons-material/Handshake';


// Fuera del componente — las funciones impuras no se analizan como render
function generarTicketId() {
  return `${Date.now().toString(36)}-${Math.floor(Math.random() * 9999)}`.toUpperCase();
}

// Adapta el resultado de productosService.getAll()/mapProducto() a la forma
// "liviana" que usa el carrito/búsqueda del POS — antes lo armaba un useMemo
// sobre TODO el catálogo cargado en memoria (PRODUCTOS_POS); ahora cada
// resultado de búsqueda/escaneo pasa por acá, uno por uno, según llega del
// backend (ver useBusquedaProductos y los onScan/handleSearchKeyDown más abajo).
function aProductoPos(p) {
  return {
    id: p.id, codigo: p.codigo, codigoBarras: p.codigoBarras, nombre: p.nombre,
    categoria: p.categoria, stock: p.stock, precio: p.precioFinal,
    unidadMedida: p.unidadMedida,
    // Última modificación de precio/costo — si nunca se tocó desde que se
    // creó, se muestra la fecha de creación en su lugar (ver el buscador
    // del POS, resaltado en rojo al lado del stock).
    ultimaModificacion: p.ultimaModificacionPrecio || p.fechaCreacion || null,
    // Solo indumentaria tiene esto — un producto con variantes no se agrega
    // directo al carrito, primero hay que elegir el talle (ver intentarAgregar).
    tieneVariantes: p.tieneVariantes,
    variantes: (p.variantes ?? []).map(v => ({
      id: v.id, codigo: v.codigo, codigoBarras: v.codigoBarras, talle: v.talle, ordenTalle: v.ordenTalle,
      stock: v.stock, precio: p.precioFinal, categoria: p.categoria, unidadMedida: p.unidadMedida,
    })),
  };
}

// Los ítems "manual-*" (monto libre, sin producto real) van sin id_producto
// pero con su nombre — antes se filtraban antes de mandar la venta y quedaba
// registrada por menos de lo que en realidad se cobró (el total del ticket
// sí los suma). Mismo mapeo que VentasContext.jsx::registrarVenta.
function cartALineas(cart) {
  return cart.map(i => String(i.id).startsWith('manual-')
    ? { nombre: i.nombre, precio_venta: i.precio, cantidad: i.cantidad }
    : { id_producto: i.id, precio_venta: i.precio, cantidad: i.cantidad });
}

// Sugiere hasta 3 montos redondos por encima del total (billetes típicos) para
// no tener que escribir el monto recibido a mano en cada venta en efectivo.
function sugerirMontosRapidos(total) {
  if (!(total > 0)) return [];
  const redondeos = [500, 1000, 2000, 5000, 10000];
  const candidatos = new Set();
  redondeos.forEach(r => {
    const candidato = Math.ceil(total / r) * r;
    if (candidato > total) candidatos.add(candidato);
  });
  return Array.from(candidatos).sort((a, b) => a - b).slice(0, 3);
}

const METODO_LABELS = {
  efectivo: 'Efectivo', tarjeta: 'Tarjeta', transferencia: 'Transferencia', qr: 'QR', fiado: 'Fiado',
};

const inputSx = {
  '& .MuiOutlinedInput-root': {
    bgcolor: INPUT, color: INK, fontSize: 14,
    '& fieldset': { borderColor: BORDER },
    '&:hover fieldset': { borderColor: 'var(--border-hover)' },
    '&.Mui-focused fieldset': { borderColor: PRIMARY, borderWidth: 1 },
  },
  '& .MuiInputBase-input': { py: '13px' },
  '& .MuiInputBase-input::placeholder': { color: MUTED, opacity: 1 },
  '& input[type=number]': { MozAppearance: 'textfield' },
  '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
    WebkitAppearance: 'none', margin: 0,
  },
};

const outlinedBtn = {
  color: INK2, borderColor: BORDER, fontSize: 14, textTransform: 'none',
  '&:hover': { borderColor: 'var(--border-hover)', bgcolor: HOVER, color: INK },
};

// ── Sonido de feedback al agregar/rechazar un producto ──────────────────
function playBeep(tipo = 'ok') {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = tipo === 'ok' ? 880 : 220;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + (tipo === 'ok' ? 0.08 : 0.16));
    osc.onended = () => ctx.close();
  } catch { /* el sonido es un extra, nunca debe romper el flujo de venta */ }
}

function enviarWhatsApp(data) {
  const texto = [
    `*${APP_NAME} - Ticket ${data.ticketId}*`,
    `Fecha: ${data.fecha} ${data.hora}`,
    `Cliente: ${data.cliente || 'Consumidor Final'}`,
    '',
    '*Productos:*',
    ...(data.items || []).map(i => `- ${i.nombre} x${i.cantidad}: ${fmtMoney(i.precio * i.cantidad)}`),
    '',
    `*TOTAL: ${fmtMoney(data.total)}*`,
    data.vuelto > 0 ? `\nVuelto: ${fmtMoney(data.vuelto)}` : '',
    '\nGracias por su compra!',
  ].filter(Boolean).join('\n');
  window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
}

/* ──────────────────────────────────────────────
   MODAL: Elegir talle (solo indumentaria) — grilla con cantidad por talle
   en vez de forzar "elegí uno solo", para poder cargar varios talles
   distintos de un mismo producto en una sola pasada.
────────────────────────────────────────────── */
function ModalSeleccionTalle({ producto, onClose, onAgregar }) {
  const [cantidades, setCantidades] = useState({});

  const setCantidad = (varianteId, valor, max) => {
    const n = Math.max(0, Math.min(Number(valor) || 0, max));
    setCantidades(prev => ({ ...prev, [varianteId]: n }));
  };

  const confirmar = () => {
    const elegidos = producto.variantes
      .map(v => ({ variante: v, cantidad: cantidades[v.id] || 0 }))
      .filter(x => x.cantidad > 0);
    if (elegidos.length === 0) return;
    elegidos.forEach(({ variante, cantidad }) => {
      onAgregar(variante, cantidad, `${producto.nombre} (${variante.talle})`);
    });
    onClose();
  };

  const talles = [...producto.variantes].sort((a, b) => (a.ordenTalle ?? 0) - (b.ordenTalle ?? 0));
  const hayElegidos = Object.values(cantidades).some(c => c > 0);

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: modalPaperSx }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 16, color: INK }} noWrap>{producto.nombre}</Typography>
          <Typography sx={{ color: MUTED, fontSize: 12.5 }}>Elegí talle y cantidad</Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: MUTED, flexShrink: 0 }}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 0 }}>
        {talles.length === 0 ? (
          <Typography sx={{ color: MUTED, fontSize: 13, py: 2, textAlign: 'center' }}>Este producto no tiene talles cargados.</Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {talles.map(v => (
              <Box key={v.id} sx={{
                display: 'flex', alignItems: 'center', gap: 1.5, p: 1.25,
                border: `1px solid ${BORDER}`, borderRadius: '8px',
                opacity: v.stock > 0 ? 1 : 0.55,
              }}>
                <Typography sx={{ flex: 1, color: INK, fontWeight: 600, fontSize: 14 }}>Talle {v.talle}</Typography>
                <Typography sx={{ color: v.stock > 0 ? MUTED : ERROR, fontSize: 12, flexShrink: 0 }}>
                  {v.stock > 0 ? `${v.stock} disp.` : 'Sin stock'}
                </Typography>
                <TextField type="number" size="small" placeholder="0" disabled={v.stock <= 0}
                  value={cantidades[v.id] || ''}
                  onChange={e => setCantidad(v.id, e.target.value, v.stock)}
                  onKeyDown={e => { if (e.key === 'Enter') confirmar(); }}
                  inputProps={{ min: 0, max: v.stock, style: { width: 44, textAlign: 'center' } }}
                  sx={{ flexShrink: 0 }} />
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: { xs: 1.5, sm: 3 }, pb: { xs: 1.75, sm: 2.5 } }}>
        <Button onClick={onClose} sx={{ color: INK2, textTransform: 'none', fontWeight: 600 }}>Cancelar</Button>
        <Button variant="contained" onClick={confirmar} disabled={!hayElegidos}
          sx={{ bgcolor: PRIMARY, textTransform: 'none', fontWeight: 700, borderRadius: '8px', '&:hover': { bgcolor: P_HOVER } }}>
          Agregar al carrito
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Input de cantidad de una línea del carrito — antes era un <input type="number">
// controlado directo por item.cantidad: si lo seleccionabas y borrabas para
// tipear un valor nuevo, el string vacío no parseaba a número, el estado no
// cambiaba, y React volvía a pintar el último valor válido en cada tecla — no
// dejaba borrar. Este buffer de texto local desacopla lo que se ve mientras
// se tipea de cuándo se confirma un número válido (mismo criterio que
// CampoPrecio para el precio unitario).
function CampoCantidadCarrito({ item, onCommit, style, registrarRef, onEnter }) {
  const fraccionable = esUnidadFraccionable(item.unidadMedida);
  const inputRef = useRef(null);
  const [texto, setTexto] = useState(String(item.cantidad));

  useEffect(() => {
    if (document.activeElement !== inputRef.current) setTexto(String(item.cantidad));
  }, [item.cantidad]);

  const handleChange = (e) => {
    const raw = e.target.value;
    setTexto(raw);
    const n = fraccionable ? parseFloat(raw.replace(',', '.')) : parseInt(raw, 10);
    if (!isNaN(n)) onCommit(raw);
  };

  return (
    <Box component="input" ref={el => { inputRef.current = el; registrarRef?.(el); }} type="text" inputMode="decimal"
      value={texto} onChange={handleChange}
      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onEnter?.(); } }}
      onBlur={() => setTexto(String(item.cantidad))}
      style={style} />
  );
}

function Home() {
  const { user } = useContext(AuthContext);
  const { registrarVenta, confirmarVentaPoint } = useVentas();
  const { caja } = useCaja();
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const { checkPermisos } = useHasPermiso();
  const { tieneFacturacion } = usePlan();
  const puedeAplicarDescuento = checkPermisos('aplicarDescuento');
  const isMobile = useIsMobile();
  const [mobileTab, setMobileTab] = useState(0);
  const [atajosAnchor, setAtajosAnchor] = useState(null);

  // ── Clientes desde API ─────────────────────────────────────────────
  const [clientesOpts, setClientesOpts] = useState([]);
  useEffect(() => {
    clientesService.getAll()
      .then(cs => setClientesOpts(cs))
      .catch(() => toast('No se pudieron cargar los clientes', 'error'));
  }, []);

  // ── Tour guiado de "Ayuda" (ver src/utils/tour.js) ──────────────────
  useEffect(() => {
    registerTour('/pos', [
      {
        element: '[data-tour="pos-buscar"]',
        title: 'Buscar productos',
        description: 'Escribi el nombre o codigo de barras (F1 para buscar). Con Enter agregas el producto. Con F3 escaneas un codigo de barras.',
      },
      {
        element: '[data-tour="pos-carrito"]',
        title: 'Carrito',
        description: 'Los productos que vas agregando aparecen acá. Podés editar la cantidad o el precio de cada línea directamente, o sacarlos con el ícono de tacho.',
        // En mobile "Cliente/Pago/Descuento/Confirmar" viven en la pestaña
        // "Venta" — sin esto el tour se queda apuntando a un elemento que no
        // está en el DOM (driver.js lo resuelve como un punto fantasma).
        ...(isMobile ? { beforeNext: '[data-tour="pos-tab-venta"]' } : {}),
      },
      {
        element: '[data-tour="pos-cliente"]',
        title: 'Cliente',
        description: 'Buscá un cliente existente o escribí uno nuevo para crearlo al toque. Si no elegís ninguno, la venta queda a nombre de "Consumidor Final".',
        ...(isMobile ? { beforePrev: '[data-tour="pos-tab-buscar"]' } : {}),
      },
      {
        element: '[data-tour="pos-pago"]',
        title: 'Métodos de pago',
        description: 'Elegí cómo paga el cliente. Point y QR cobran de verdad con Mercado Pago; los demás son solo un registro manual. Activá "Varios" para combinar más de un método en la misma venta.',
      },
      {
        element: '[data-tour="pos-descuento"]',
        title: 'Descuento',
        description: 'Aplicá un descuento o recargo en % o en $ sobre el total de la venta.',
      },
      {
        element: '[data-tour="pos-confirmar"]',
        title: 'Confirmar venta',
        description: 'Cierra la venta con todo lo cargado. Atajo: F2 o Enter en la columna derecha.',
      },
      {
        element: '[data-tour="pos-atajos"]',
        title: 'Atajos de teclado',
        description: 'Lista completa de atajos: F1 buscar, Enter agregar, F2 cobrar, F3 escanear, Esc cerrar ventanas. Vende sin tocar el mouse.',
      },
    ]);
  }, [isMobile]);

  const resetNuevoCliente = () => setNuevoCliente({ active: false, nombre: '', cuit: '', telefono: '' });

  const handleCrearCliente = async () => {
    if (!nuevoCliente.nombre.trim()) return;
    setCreandoCliente(true);
    try {
      const creado = await clientesService.create({
        persona: nuevoCliente.nombre.trim(),
        cuit: nuevoCliente.cuit.trim() || null,
        telefono: nuevoCliente.telefono.trim() || null,
      });
      setClientesOpts(prev => [...prev, creado]);
      setClienteId(creado.id);
      resetNuevoCliente();
      toast('Cliente creado correctamente', 'success');
    } catch (e) {
      toast(e.response?.data?.message || 'No se pudo crear el cliente', 'error');
    } finally {
      setCreandoCliente(false);
    }
  };

  // ── Cart & search ──────────────────────────────────────────────────
  const [search, setSearch]   = useState('');
  const [clienteId, setClienteId] = useState(null);
  const clienteNombre = clientesOpts.find(c => c.id === clienteId)?.nombre || 'Consumidor Final';
  const clienteCondicionIva = clientesOpts.find(c => c.id === clienteId)?.condicionIva || '';
  const [nuevoCliente, setNuevoCliente] = useState({ active: false, nombre: '', cuit: '', telefono: '' });
  const [creandoCliente, setCreandoCliente] = useState(false);
  const [cart, setCart]       = useState(() => leerCarritoDraft());
  useEffect(() => { guardarCarritoDraft(cart); }, [cart]);
  // Si el carrito viene de un presupuesto, se manda junto con la venta al
  // confirmar (ver handleConfirmarVenta) para que el backend lo marque como
  // convertido — se limpia solo al cobrar o al vaciar el carrito a mano.
  const [presupuestoIdCargado, setPresupuestoIdCargado] = useState(null);

  // Presupuestos.jsx manda acá con state.presupuestoParaCargar al tocar
  // "Convertir en venta" — arma el carrito con las líneas cotizadas (mismo
  // precio, no el actual) y precarga el cliente, para que el cajero vea y
  // confirme la venta desde el POS en vez de crearla directo por API.
  // Se limpia el state de navegación al toque para que un F5 no lo repita.
  useEffect(() => {
    const datos = location.state?.presupuestoParaCargar;
    if (!datos) return;
    navigate(location.pathname, { replace: true, state: null });

    (async () => {
      const lineas = datos.lineas || [];
      const productos = await Promise.all(lineas.map(l => productosService.getById(l.id_producto).catch(() => null)));
      const nuevoCart = [];
      let saltados = 0;
      lineas.forEach((l, i) => {
        const p = productos[i];
        if (!p || p.stock === 0) { saltados++; return; }
        nuevoCart.push({
          id: p.id, codigo: p.codigo, nombre: p.nombre, categoria: p.categoria,
          stock: p.stock, precio: l.precio_venta, cantidad: Math.min(l.cantidad, p.stock),
          unidadMedida: p.unidadMedida || 'unidad',
        });
      });
      setCart(nuevoCart);
      setPresupuestoIdCargado(datos.id);
      if (datos.id_cliente) setClienteId(datos.id_cliente);
      toast(saltados > 0
        ? `Presupuesto #${datos.id} cargado — ${saltados} producto${saltados > 1 ? 's' : ''} sin stock se omitieron`
        : `Presupuesto #${datos.id} cargado en el carrito`, saltados > 0 ? 'info' : 'success');
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const searchRef = useRef(null);
  // Foco de la cantidad de cada línea del carrito, por id de producto — al
  // agregar uno (click, Enter o escáner, todos pasan por addProductToCart)
  // el foco salta directo ahí para tipear la cantidad sin tocar el mouse;
  // Enter en ese campo lo devuelve al buscador para seguir cargando.
  const cantidadRefs = useRef({});
  const ejecutarConfirmarVentaRef = useRef(null);

  // ── Ajuste (descuento / recargo) ───────────────────────────────────
  const [ajuste, setAjuste] = useState({ activo: false, tipo: 'descuento', calculo: 'porcentaje', valor: '' });
  const clearAjuste = () => setAjuste({ activo: false, tipo: 'descuento', calculo: 'porcentaje', valor: '' });

  // ── Puntos del cliente seleccionado ────────────────────────────────
  const puntosActivo = Boolean(user?.empresa?.puntos_activo);
  const valorPunto = Number(user?.empresa?.puntos_valor_pesos) || 0;
  const [puntosCliente, setPuntosCliente] = useState(0);
  const [puntosCanjear, setPuntosCanjear] = useState('');

  useEffect(() => {
    let active = true;
    setPuntosCanjear('');
    if (!puntosActivo || !clienteId) { setPuntosCliente(0); return; }
    clientesService.getPuntos(clienteId)
      .then(({ saldo }) => { if (active) setPuntosCliente(saldo); })
      .catch(() => { if (active) { toast('No se pudieron cargar los puntos del cliente', 'error'); setPuntosCliente(0); } });
    // Si el cajero cambia de cliente rápido, una respuesta vieja que llega
    // tarde no debe pisar el saldo del cliente que quedó seleccionado ahora.
    return () => { active = false; };
  }, [clienteId, puntosActivo]);

  // ── Dialog states ──────────────────────────────────────────────────
  const [openScanner,  setOpenScanner]  = useState(false);
  const [openPrecio,   setOpenPrecio]   = useState(false);
  const [openMonto,    setOpenMonto]    = useState(false);
  const [openVentaOk,  setOpenVentaOk]  = useState(false);
  const [openVaciarCarrito, setOpenVaciarCarrito] = useState(false);

  // ── Modal: Agregar Monto ───────────────────────────────────────────
  const [montoNombre, setMontoNombre] = useState('Varios');
  const [montoValor,  setMontoValor]  = useState('');

  // ── Modal: Consultar Precio ────────────────────────────────────────
  const [precioSearch, setPrecioSearch] = useState('');

  // ── Modal: Pago ────────────────────────────────────────────────────
  const [metodoPago,     setMetodoPago]     = useState('efectivo');
  const [variosPagos,    setVariosPagos]    = useState(false);
  const [pagosAplicados, setPagosAplicados] = useState([]);
  const [montoActual,      setMontoActual]      = useState('');
  const [efectivoRecibido, setEfectivoRecibido] = useState('');
  const [ticketId,         setTicketId]         = useState('');
  const [lastTotal,      setLastTotal]      = useState(0);
  const [procesando,    setProcesando]    = useState(false);
  const [lastVentaData, setLastVentaData] = useState(null);
  const [ultimaVenta,   setUltimaVenta]   = useState(null);
  const [scanFeedback,  setScanFeedback]  = useState(null);
  const [productoParaTalles, setProductoParaTalles] = useState(null);
  const [facturando,    setFacturando]    = useState(false);
  const [facturaData,   setFacturaData]   = useState(null);
  // Cuando la factura queda "pendiente" (ver EmitirFacturaJob en el
  // backend, corte de internet a mitad de facturar) se sigue el resultado
  // acá — refetchInterval se apaga solo apenas deja de estar pendiente.
  const [facturaPendienteId, setFacturaPendienteId] = useState(null);
  const { data: facturaResuelta } = useFactura(facturaPendienteId, {
    enabled: !!facturaPendienteId,
    refetchInterval: (query) => query.state.data?.estado === 'pendiente' ? 3000 : false,
  });

  // ── Cobro con Mercado Pago Point / QR ────────────────────────────────
  const [mpConectado,    setMpConectado]    = useState(false);
  const [mpDeviceId,     setMpDeviceId]     = useState('');
  const [pointEstado,    setPointEstado]    = useState('idle'); // idle | esperando
  const [pointIntentoId, setPointIntentoId] = useState(null);
  const [qrEstado,       setQrEstado]       = useState('idle'); // idle | esperando
  const [qrIntentoId,    setQrIntentoId]    = useState(null);
  const [qrImagenUrl,    setQrImagenUrl]    = useState('');
  const [autoImprimir,   setAutoImprimir]   = useState(false);
  const [montoIntentoActivo, setMontoIntentoActivo] = useState(null);

  useEffect(() => {
    mercadopagoService.getEstado()
      .then(({ conectado, pointDeviceId }) => { setMpConectado(conectado); setMpDeviceId(pointDeviceId || ''); })
      .catch(() => toast('No se pudo verificar el estado de Mercado Pago', 'error'));
  }, []);

  // ── Recuperar un cobro Point/QR que quedó pendiente si se recargó la página ──
  useEffect(() => {
    const pendiente = leerIntentoActivo();
    if (!pendiente) return;
    setMontoIntentoActivo(pendiente.monto ?? null);
    if (pendiente.tipo === 'point') {
      setPointIntentoId(pendiente.id);
      setPointEstado('esperando');
    } else if (pendiente.tipo === 'qr') {
      setQrIntentoId(pendiente.id);
      setQrImagenUrl(pendiente.qrImagenUrl || '');
      setQrEstado('esperando');
    }
  }, []);

  // Se resolvió una factura que estaba pendiente (ARCA ya respondió, en un
  // sentido o el otro) — se actualiza el comprobante para reimprimir con el
  // CAE real, se avisa, y se corta el polling.
  useEffect(() => {
    if (!facturaResuelta || facturaResuelta.estado === 'pendiente') return;
    setFacturaData(facturaResuelta);
    if (facturaResuelta.estado === 'emitida') {
      toast(`Factura ${facturaResuelta.numeroCompleto} confirmada por ARCA`, 'success');
    } else {
      toast(`No se pudo emitir la factura: ${facturaResuelta.errorMensaje || 'error desconocido'}`, 'error');
    }
    setFacturaPendienteId(null);
  }, [facturaResuelta, toast]);

  const cartTieneManual = cart.some(i => String(i.id).startsWith('manual-'));
  // Point deshabilitado temporalmente a pedido, vía VITE_POINT_HABILITADO en
  // .env (default false) — sacado del selector de métodos de pago y de
  // Configuración → Cobros. QR no se ve afectado, sigue funcionando igual.
  const pointDisponible = POINT_HABILITADO && mpConectado && !!mpDeviceId && !ajuste.activo && !cartTieneManual;
  const qrDisponible    = mpConectado && !ajuste.activo && !cartTieneManual;

  const handleEmitirFactura = async () => {
    if (!lastVentaData) return;
    setFacturando(true);
    try {
      const res = await emitirFactura({
        id_venta: lastVentaData.idVentaReal ?? null,
        total: lastVentaData.total,
        cliente_nombre: lastVentaData.cliente,
        items: (lastVentaData.items || []).map(i => ({ precio: i.precio, cantidad: i.cantidad })),
      });
      if (res.success) {
        // qr_url viene null en modo prueba (CAE ficticio) — ahí no hay nada que
        // escanear, imprimirTicket lo maneja solo (ver utils/imprimirTicket.js).
        const factura = mapFactura(res.data);
        setFacturaData(factura);
        setAutoImprimir(true);
        if (res.pendiente) {
          // Sin internet o ARCA no respondió: se imprime igual (con la
          // leyenda de "pendiente"), y se seguirá el resultado solo hasta
          // que el Job del backend la termine de emitir.
          toast('Sin conexión con ARCA — la factura se va a confirmar sola cuando vuelva la conexión.', 'warning');
          setFacturaPendienteId(factura.id);
        }
      } else {
        toast(res.errores?.[0] || 'Error al emitir factura', 'error');
      }
    } catch (e) {
      if (e.response?.status === 403) {
        toast(e.response.data?.message || 'No se pudo emitir la factura', 'error');
      } else {
        toast('Error al conectar con ARCA', 'error');
      }
    } finally {
      setFacturando(false);
    }
  };

  // ── Computed totals ────────────────────────────────────────────────
  const subtotal   = cart.reduce((a, i) => a + i.precio * i.cantidad, 0);
  const totalQty   = cart.reduce((a, i) => a + i.cantidad, 0);
  const montoAjuste = ajuste.activo
    ? ajuste.calculo === 'porcentaje'
      ? subtotal * (Number(ajuste.valor) / 100)
      : Number(ajuste.valor)
    : 0;
  const totalConAjuste = ajuste.activo
    ? ajuste.tipo === 'descuento' ? subtotal - montoAjuste : subtotal + montoAjuste
    : subtotal;
  const puntosCanjearNum = Math.min(Number(puntosCanjear) || 0, puntosCliente);
  const descuentoPuntos = puntosCanjearNum * valorPunto;
  const total = Math.max(0, totalConAjuste - descuentoPuntos);
  const efectivoNum = !variosPagos && metodoPago === 'efectivo' ? (Number(efectivoRecibido) || 0) : 0;
  const vuelto      = efectivoNum > 0 ? efectivoNum - total : 0;

  // ── Auto-limpiar feedback de scan ────────────────────────────────
  useEffect(() => {
    if (!scanFeedback) return;
    const t = setTimeout(() => setScanFeedback(null), 1800);
    return () => clearTimeout(t);
  }, [scanFeedback]);

  // ── Keyboard shortcuts ─────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'F1') { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === 'F2' && cart.length > 0 && caja.abierta) {
        e.preventDefault();
        ejecutarConfirmarVentaRef.current?.();
      }
      if (e.key === 'F3') { e.preventDefault(); setOpenScanner(true); }
      if (e.key === 'Escape') {
        setOpenMonto(false); setOpenPrecio(false); setOpenScanner(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [cart.length, caja.abierta]);

  // ── Cart operations ────────────────────────────────────────────────
  // Solo ferretería puede tener productos en kg/metro/litro — para todo el
  // resto unidadMedida es siempre 'unidad' (o ni viene) y esto no cambia nada.
  const esFraccionable = (item) => esUnidadFraccionable(item.unidadMedida);
  const stepPara = (item) => esFraccionable(item) ? 0.1 : 1;
  const round2 = (n) => Math.round(n * 100) / 100;

  const addQty = (id) => setCart(c => c.map(i => {
    if (i.id !== id) return i;
    const max = i.stock ?? Infinity;
    const next = round2(i.cantidad + stepPara(i));
    return next <= max ? { ...i, cantidad: next } : i;
  }));

  const removeQty = (id) => setCart(c => c.map(i => i.id === id ? { ...i, cantidad: round2(i.cantidad - stepPara(i)) } : i).filter(i => i.cantidad > 0));
  const removeItem  = (id) => setCart(c => c.filter(i => i.id !== id));
  const updatePrecio = (id, precio) => {
    const n = parseFloat(String(precio).replace(',', '.'));
    if (!isNaN(n) && n >= 0) setCart(c => c.map(i => i.id === id ? { ...i, precio: n } : i));
  };
  const updateCantidad = (id, valor) => {
    setCart(c => c.map(i => {
      if (i.id !== id) return i;
      const fraccionable = esFraccionable(i);
      const n = fraccionable ? parseFloat(String(valor).replace(',', '.')) : parseInt(valor, 10);
      if (isNaN(n)) return i;
      const max = i.stock ?? Infinity;
      const minimo = fraccionable ? 0.01 : 1;
      return { ...i, cantidad: Math.max(minimo, Math.min(n, max)) };
    }));
  };

  // Cargar la cantidad a partir de lo que el cliente quiere gastar (típico en
  // nafta: "dame $500 de nafta") en vez de que el cajero calcule los litros/kg
  // a mano — solo tiene sentido para productos fraccionables (kg/metro/litro).
  const [montoCalcularId, setMontoCalcularId] = useState(null);
  const [montoCalcularValor, setMontoCalcularValor] = useState('');
  const itemCalculando = cart.find(i => i.id === montoCalcularId) || null;
  const handleCalcularCantidadPorMonto = () => {
    const monto = parseFloat(String(montoCalcularValor).replace(',', '.'));
    if (!itemCalculando || isNaN(monto) || monto <= 0 || !itemCalculando.precio) return;
    updateCantidad(itemCalculando.id, round2(monto / itemCalculando.precio));
    setMontoCalcularId(null); setMontoCalcularValor('');
  };

  const addProductToCart = (product) => {
    if (product.stock === 0) { playBeep('error'); toast(`Sin stock: ${product.nombre}`, 'error'); return; }
    setCart(c => {
      const existing = c.find(item => item.id === product.id);
      if (existing) {
        const max = product.stock ?? Infinity;
        const next = round2(existing.cantidad + stepPara(existing));
        if (next > max) return c;
        return c.map(item => item.id === product.id ? { ...item, cantidad: next } : item);
      }
      return [...c, { id: product.id, codigo: product.codigo, nombre: product.nombre, categoria: product.categoria, stock: product.stock ?? Infinity, precio: product.precio, cantidad: 1, unidadMedida: product.unidadMedida || 'unidad' }];
    });
    playBeep('ok');
    setScanFeedback(product.nombre);
    setSearch('');
    // Foco a la cantidad de esta línea — el setTimeout espera al re-render
    // del carrito (la línea puede ser nueva, todavía no existe el input).
    setTimeout(() => {
      const el = cantidadRefs.current[product.id];
      if (el) { el.focus(); el.select(); }
    }, 50);
  };

  // Agrega una variante puntual (ya elegida en el picker de talle) con una
  // cantidad específica, en vez de siempre arrancar en 1 como addProductToCart.
  const agregarVarianteConCantidad = (variante, cantidad, nombreCompleto) => {
    if (cantidad <= 0) return;
    setCart(c => {
      const existing = c.find(item => item.id === variante.id);
      const max = variante.stock ?? Infinity;
      if (existing) {
        const next = round2(Math.min(existing.cantidad + cantidad, max));
        return c.map(item => item.id === variante.id ? { ...item, cantidad: next } : item);
      }
      return [...c, { id: variante.id, codigo: variante.codigo, nombre: nombreCompleto, categoria: variante.categoria, stock: max, precio: variante.precio, cantidad: Math.min(cantidad, max), unidadMedida: variante.unidadMedida || 'unidad' }];
    });
    playBeep('ok');
  };

  // Punto único de entrada para "agregar este producto al carrito" desde
  // cualquiera de los 3 lugares (click en resultado, Enter, escáner) — si
  // tiene variantes por talle, abre el picker en vez de agregar directo
  // (todas las variantes comparten nombre, así que agregar "el producto" a
  // secas sería agregar un talle arbitrario).
  const intentarAgregar = (product) => {
    if (product.tieneVariantes) {
      if (!product.variantes || product.variantes.length === 0) {
        toast(`"${product.nombre}" no tiene talles cargados todavía`, 'error');
        return;
      }
      setProductoParaTalles(product);
      setSearch('');
      return;
    }
    addProductToCart(product);
  };

  // Cada producto se re-busca por id contra el backend (no contra un array
  // local capado) — así el precio/stock que trae es el actual, y funciona
  // sin importar si el producto quedaría "afuera" de una lista corta.
  const handleRepetirVenta = async () => {
    if (!ultimaVenta) return;
    let agregados = 0;
    const noManuales = ultimaVenta.items.filter(item => !String(item.id).startsWith('manual-'));
    const encontrados = await Promise.all(noManuales.map(item =>
      productosService.getById(item.id).then(aProductoPos).catch(() => null)
    ));

    ultimaVenta.items.forEach(item => {
      if (String(item.id).startsWith('manual-')) {
        setCart(c => [...c, { ...item, id: `manual-${Date.now()}-${Math.random()}` }]);
        agregados++;
        return;
      }
      const idx = noManuales.indexOf(item);
      const producto = encontrados[idx];
      if (!producto || producto.stock === 0) return;
      agregados++;
      setCart(c => {
        const max = producto.stock ?? Infinity;
        const existing = c.find(i => i.id === producto.id);
        if (existing) {
          return c.map(i => i.id === producto.id ? { ...i, cantidad: Math.min(i.cantidad + item.cantidad, max) } : i);
        }
        return [...c, { id: producto.id, codigo: producto.codigo, nombre: producto.nombre, categoria: producto.categoria, stock: max, precio: producto.precio, cantidad: Math.min(item.cantidad, max), unidadMedida: producto.unidadMedida || 'unidad' }];
      });
    });
    if (agregados === 0) toast('Ninguno de esos productos está disponible actualmente', 'error');
    else if (agregados < ultimaVenta.items.length) toast('Se repitieron los productos disponibles de la última venta', 'info');
    else toast('Se repitió la última venta', 'success');
  };

  // Búsqueda contra el backend (search.trim() debounced), no contra un
  // array local — con miles de productos, un array cargado una sola vez
  // nunca tiene todo el catálogo (ver useBusquedaProductos).
  const { resultados: resultadosSearch } = useBusquedaProductos(search, { perPage: 20 });
  const filteredProducts = useMemo(() => resultadosSearch.map(aProductoPos), [resultadosSearch]);

  const { resultados: resultadosPrecio } = useBusquedaProductos(precioSearch, { perPage: 20 });
  const precioResults = useMemo(() => resultadosPrecio.map(aProductoPos), [resultadosPrecio]);

  // Flecha arriba/abajo navega los resultados, Enter agrega el resaltado
  // (arranca en el primero) — si todavía no hay resultados (típico de un
  // lector de código de barras, que tipea más rápido que el debounce),
  // Enter cae al fallback contra el backend de abajo.
  const { highlightIdx: searchHighlightIdx, onKeyDown: handleDropdownNav, highlightedRef: highlightedItemRef } = useDropdownKeyboardNav(filteredProducts, intentarAgregar);

  const handleSearchKeyDown = async (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { handleDropdownNav(e); return; }
    if (e.key !== 'Enter') return;
    if (filteredProducts.length) { handleDropdownNav(e); return; }
    const q = search.trim();
    if (!q) return;
    const qLower = q.toLowerCase();
    // El debounce de la búsqueda puede no haber traído resultados todavía
    // (típico de un lector de código de barras, que tipea rápido y termina
    // con Enter) — resuelve directo contra el backend por código exacto en
    // vez de esperar. codigo_exacto ya chequea código Y código de barras.
    try {
      const porCodigo = await productosService.getAll({ codigo_exacto: q });
      if (porCodigo.length) { intentarAgregar(aProductoPos(porCodigo[0])); return; }
    } catch { /* sigue al fallback por nombre */ }
    try {
      const porNombre = await productosService.getAll({ search: q, per_page: 5 });
      const exacto = porNombre.find(p => p.nombre.toLowerCase() === qLower);
      if (exacto) intentarAgregar(aProductoPos(exacto));
    } catch { /* no se encontró nada, no hacemos más */ }
  };

  // ── Handlers ───────────────────────────────────────────────────────
  const handleAgregarMonto = () => {
    const monto = parseFloat(montoValor.replace(',', '.'));
    if (!montoNombre.trim() || isNaN(monto) || monto <= 0) return;
    setCart(c => [...c, {
      id: `manual-${Date.now()}`, codigo: 'MANUAL',
      nombre: montoNombre.trim(), categoria: 'Manual',
      stock: Infinity, precio: monto, cantidad: 1,
    }]);
    setMontoNombre('Varios'); setMontoValor(''); setOpenMonto(false);
  };

  // Control de auditoría — antes de vaciar, se manda una foto de qué había
  // cargado (para poder revisar después si hay un patrón de cargar productos
  // y vaciar el carrito en vez de cobrarlos, ver Configuración → Auditoría).
  const handleVaciarCarrito = () => {
    carritosVaciadosService.registrar({
      items: cart.map(i => ({ nombre: i.nombre, codigo: i.codigo || null, cantidad: i.cantidad, precio: i.precio })),
      total: subtotal,
    }).catch(() => { /* no debe bloquear al cajero por un problema de red */ });
    setCart([]);
    setPresupuestoIdCargado(null);
  };

  const handleConfirmarVenta = async () => {
    // Se congelan acá, antes del await — si el campo de efectivo cambiara
    // mientras se espera la respuesta del servidor (ver bug del scroll del
    // mouse en inputs numéricos, ya corregido más abajo), el ticket final
    // no debe verse afectado por ese cambio posterior.
    const ventaTotal      = total;
    const ventaEfectivoNum = efectivoNum;
    const ventaVuelto      = vuelto;
    const ventaPuntosCanjeados = puntosCanjearNum;
    const id    = generarTicketId();
    const ahora = new Date();
    const metodo = variosPagos ? (pagosAplicados[0]?.metodo || 'efectivo') : metodoPago;

    setProcesando(true);
    try {
      const ventaGuardada = await registrarVenta({
        id: ahora.getTime(),
        ticketId: id,
        // ahora.toISOString() da la fecha en UTC, no local — en Argentina
        // (UTC-3) cualquier venta hecha entre las 21:00 y medianoche queda
        // fechada "mañana" y desaparece de los reportes de "hoy" hasta que
        // el calendario alcanza esa fecha. toLocalDateStr() usa el calendario
        // local, igual que "hora" (más abajo) ya lo hacía.
        fecha: toLocalDateStr(ahora),
        hora:  ahora.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }),
        metodo,
        cliente: clienteNombre,
        id_cliente: clienteId,
        id_presupuesto: presupuestoIdCargado,
        items: cart.map(i => ({
          id: i.id, codigo: i.codigo, nombre: i.nombre,
          precio: i.precio, cantidad: i.cantidad, categoria: i.categoria,
        })),
        total: ventaTotal,
        subtotal,
        ajuste: ajuste.activo ? { ...ajuste } : null,
        puntosCanjeados: ventaPuntosCanjeados,
        pagos: variosPagos ? pagosAplicados : [{ metodo, monto: ventaTotal }],
      });

      // El código interno (id, ej. "MSGL50HT-6790") sigue viajando al backend
      // como numero_ticket para relacionar el movimiento de stock — pero de
      // cara al usuario (toast, modal "venta realizada", ticket impreso) se
      // muestra el id real de la venta, mucho más legible que el timestamp.
      const numeroVisible = ventaGuardada?.id ?? id;
      toast(`Venta #${numeroVisible} registrada por ${fmtMoney(ventaTotal)}`, 'success');
      setLastTotal(ventaTotal);
      setTicketId(numeroVisible);
      setPuntosCanjear('');
      setFacturaData(null); // venta nueva — la factura de la venta anterior no le pertenece
      setLastVentaData({
        ticketId: numeroVisible,
        // id real de la venta en el backend — sin esto, emitirFactura() no
        // podía vincular la factura a la venta (siempre mandaba id_venta: null).
        idVentaReal: ventaGuardada?.id ?? null,
        fecha: ahora.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        hora:  ahora.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }),
        items: cart.map(i => ({ nombre: i.nombre, precio: i.precio, cantidad: i.cantidad, unidadMedida: i.unidadMedida })),
        subtotal,
        ajuste: ajuste.activo ? { tipo: ajuste.tipo, calculo: ajuste.calculo, valor: ajuste.valor, monto: montoAjuste } : null,
        total: ventaTotal,
        metodo,
        pagos: variosPagos ? [...pagosAplicados] : null,
        cliente: clienteNombre,
        clienteCondicionIva,
        efectivoRecibido: ventaEfectivoNum > 0 ? ventaEfectivoNum : null,
        vuelto: ventaEfectivoNum > 0 && ventaVuelto > 0 ? ventaVuelto : null,
        vendedor: user?.des_usu || null,
      });
      setUltimaVenta({
        items: cart.map(i => ({
          id: i.id, codigo: i.codigo, nombre: i.nombre,
          precio: i.precio, cantidad: i.cantidad, categoria: i.categoria,
        })),
      });
      setCart([]);
      setPresupuestoIdCargado(null);
      clearAjuste();
      setPagosAplicados([]);
      setMontoActual('');
      setEfectivoRecibido('');
      setClienteId(null);
      setOpenVentaOk(true);
    } catch (e) {
      toast(e.response?.data?.message || e.response?.data?.error || 'Error al registrar la venta', 'error');
    } finally {
      setProcesando(false);
    }
  };

  const handleCerrarVentaOk = () => {
    setOpenVentaOk(false);
    // Foco directo al buscador para arrancar la próxima venta sin tocar el mouse
    setTimeout(() => searchRef.current?.focus(), 0);
  };

  const handleAgregarPagoSplit = () => {
    const m = Number(montoActual) || (total - pagosAplicados.reduce((a, p) => a + p.monto, 0));
    if (m > 0) { setPagosAplicados(prev => [...prev, { metodo: metodoPago, monto: m }]); setMontoActual(''); }
  };

  const handleConfirmarVentaPoint = async () => {
    setProcesando(true);
    try {
      const ahora = new Date();
      const intentoId = await mercadopagoService.crearIntento({
        numero_ticket: generarTicketId(),
        id_cliente: clienteId,
        fecha: toLocalDateStr(ahora), // fecha local, no UTC — ver comentario en handleConfirmarVenta
        hora: ahora.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }),
        lineas: cartALineas(cart),
      });
      setPointIntentoId(intentoId);
      setPointEstado('esperando');
      setMontoIntentoActivo(total);
      guardarIntentoActivo({ tipo: 'point', id: intentoId, monto: total });
    } catch (e) {
      toast(e.response?.data?.message || 'No se pudo iniciar el cobro con Point', 'error');
    } finally {
      setProcesando(false);
    }
  };

  const handleCancelarPoint = async () => {
    if (pointIntentoId) {
      try { await mercadopagoService.cancelarIntento(pointIntentoId); } catch { /* noop */ }
    }
    setPointEstado('idle');
    setPointIntentoId(null);
    setMontoIntentoActivo(null);
    limpiarIntentoActivo();
  };

  const handleConfirmarVentaQr = async () => {
    setProcesando(true);
    try {
      const ahora = new Date();
      const { intentoId, qrData } = await mercadopagoService.crearIntentoQr({
        numero_ticket: generarTicketId(),
        id_cliente: clienteId,
        fecha: toLocalDateStr(ahora), // fecha local, no UTC — ver comentario en handleConfirmarVenta
        hora: ahora.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }),
        lineas: cartALineas(cart),
      });
      const imagenUrl = qrData ? await QRCode.toDataURL(qrData, { margin: 1, width: 260 }) : '';
      setQrImagenUrl(imagenUrl);
      setQrIntentoId(intentoId);
      setQrEstado('esperando');
      setMontoIntentoActivo(total);
      guardarIntentoActivo({ tipo: 'qr', id: intentoId, monto: total, qrImagenUrl: imagenUrl });
    } catch (e) {
      toast(e.response?.data?.message || 'No se pudo generar el QR', 'error');
    } finally {
      setProcesando(false);
    }
  };

  const handleCancelarQr = async () => {
    if (qrIntentoId) {
      try { await mercadopagoService.cancelarIntento(qrIntentoId); } catch { /* noop */ }
    }
    setQrEstado('idle');
    setQrIntentoId(null);
    setQrImagenUrl('');
    setMontoIntentoActivo(null);
    limpiarIntentoActivo();
  };

  const confirmarVentaDisabled = procesando || (variosPagos && pagosAplicados.reduce((a, p) => a + p.monto, 0) < total * 0.99);

  const ejecutarConfirmarVenta = () => {
    if (confirmarVentaDisabled) return;
    if (!variosPagos && metodoPago === 'point') handleConfirmarVentaPoint();
    else if (!variosPagos && metodoPago === 'qr' && qrDisponible) handleConfirmarVentaQr();
    else handleConfirmarVenta();
  };
  // Ref siempre actualizada para que el atajo F3 (registrado más arriba, antes de
  // que esta función exista) llame siempre a la versión más reciente.
  useEffect(() => { ejecutarConfirmarVentaRef.current = ejecutarConfirmarVenta; });

  // ── Polling del cobro con Point o QR ─────────────────────────────────
  const intentoActivo = pointEstado === 'esperando' ? pointIntentoId : qrEstado === 'esperando' ? qrIntentoId : null;

  useEffect(() => {
    if (!intentoActivo) return;

    const interval = setInterval(async () => {
      try {
        const { estado, idVenta } = await mercadopagoService.getEstadoIntento(intentoActivo);
        if (estado === 'pendiente') return;

        clearInterval(interval);
        setPointEstado('idle');
        setPointIntentoId(null);
        setQrEstado('idle');
        setQrIntentoId(null);
        setQrImagenUrl('');
        setMontoIntentoActivo(null);
        limpiarIntentoActivo();

        if (estado === 'aprobado') {
          const saved = await confirmarVentaPoint(idVenta);
          const fechaObj = saved.fecha ? new Date(`${saved.fecha}T00:00:00`) : new Date();

          toast(`Venta #${saved.id} registrada por ${fmtMoney(saved.total)}`, 'success');
          playBeep('ok');
          setLastTotal(saved.total);
          setTicketId(saved.id);
          setFacturaData(null); // venta nueva — la factura de la venta anterior no le pertenece
          setLastVentaData({
            ticketId: saved.id,
            idVentaReal: saved.id ?? null,
            fecha: fechaObj.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            hora: saved.hora,
            items: saved.items.map(i => ({ nombre: i.nombre, precio: i.precio, cantidad: i.cantidad })),
            subtotal: saved.total,
            ajuste: null,
            total: saved.total,
            metodo: saved.metodo,
            pagos: null,
            cliente: saved.cliente,
            clienteCondicionIva,
            efectivoRecibido: null,
            vuelto: null,
            vendedor: saved.usuario || user?.des_usu || null,
          });
          setUltimaVenta({
            items: saved.items.map(i => ({
              id: i.idProducto, codigo: '', nombre: i.nombre,
              precio: i.precio, cantidad: i.cantidad, categoria: i.categoria,
            })),
          });
          setCart([]);
          clearAjuste();
          setClienteId(null);
          setAutoImprimir(true);
      setOpenVentaOk(true);
      playBeep('ok');
        } else if (estado === 'cancelado') {
          toast('El cobro fue cancelado', 'info');
        } else {
          toast('El pago fue rechazado', 'error');
        }
      } catch {
        // Silencioso — se reintenta en el próximo tick
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [intentoActivo, confirmarVentaPoint, toast]);

  // ── Auto-imprimir apenas se confirma un cobro con Point, o al facturar ARCA ──
  useEffect(() => {
    if (autoImprimir && openVentaOk && lastVentaData) {
      imprimirTicket(lastVentaData, user?.empresa, facturaData)
        .catch((e) => toast(e.message || 'No se pudo abrir la impresión del ticket', 'error'));
      setAutoImprimir(false);
    }
  }, [autoImprimir, openVentaOk, lastVentaData, facturaData, user?.empresa, toast]);

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', bgcolor: BG }}>

      {/* Header */}
      <Box sx={{ px: 3, py: 1.25, borderBottom: `1px solid ${BORDER}`, flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
        {/* Gradiente de acento */}
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${PRIMARY}, ${MONEY}, ${ORANGE})` }} />
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box sx={{ width: 34, height: 34, borderRadius: '10px', bgcolor: `${PRIMARY}18`, border: `1px solid ${PRIMARY}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PointOfSaleIcon sx={{ color: PRIMARY, fontSize: 19 }} />
            </Box>
            <Typography sx={{ color: INK, fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em' }}>
              Punto de Venta
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Atajos de teclado">
              <Button
                data-tour="pos-atajos"
                startIcon={<KeyboardIcon sx={{ fontSize: 18 }} />}
                onClick={(e) => setAtajosAnchor(e.currentTarget)}
                sx={{
                  display: { xs: 'none', md: 'inline-flex' },
                  color: INK2, textTransform: 'none', fontWeight: 600, fontSize: 13,
                  border: `1px solid ${BORDER}`, borderRadius: '8px', px: 1.5, py: 0.75,
                  '&:hover': { bgcolor: HOVER, color: INK, borderColor: 'var(--border-hover)' },
                }}>
                Atajos
              </Button>
            </Tooltip>
            <AyudaButton />
          </Box>

          <Popover
            open={Boolean(atajosAnchor)}
            anchorEl={atajosAnchor}
            onClose={() => setAtajosAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{ sx: { bgcolor: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', mt: 1 } }}>
            <Box sx={{ p: 2.5, minWidth: 260 }}>
              <Typography sx={{ color: INK, fontWeight: 700, fontSize: 14, mb: 1.5 }}>
                Atajos de teclado
              </Typography>
              {[
                ['F1', 'Ir al buscador de productos'],
                ['Enter', 'Agregar el producto encontrado'],
                ['F2', 'Cobrar / confirmar venta'],
                ['F3', 'Escanear codigo de barras'],
                ['Esc', 'Cerrar cualquier ventana'],
              ].map(([key, desc], i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.75 }}>
                  <Box sx={{
                    minWidth: 40, px: 1, py: 0.4, textAlign: 'center', flexShrink: 0,
                    bgcolor: HOVER, border: `1px solid ${BORDER}`, borderRadius: '6px',
                  }}>
                    <Typography sx={{ color: PRIMARY, fontSize: 11.5, fontFamily: 'monospace', fontWeight: 700 }}>{key}</Typography>
                  </Box>
                  <Typography sx={{ color: INK2, fontSize: 13 }}>{desc}</Typography>
                </Box>
              ))}
            </Box>
          </Popover>
        </Box>
      </Box>


      {/* Body */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden', p: { xs: 0, md: 3 }, gap: { xs: 0, md: 3 }, flexDirection: { xs: 'column', md: 'row' } }}>

        {/* Mobile tabs */}
        {isMobile && (
          <Box sx={{ flexShrink: 0, borderBottom: `1px solid ${BORDER}`, bgcolor: CARD }}>
            <Tabs value={mobileTab} onChange={(_, v) => setMobileTab(v)}
              sx={{ minHeight: 44, '& .MuiTabs-indicator': { bgcolor: PRIMARY }, '& .MuiTab-root': { textTransform: 'none', color: MUTED, minHeight: 44, fontSize: 14, fontWeight: 500 }, '& .Mui-selected': { color: PRIMARY, fontWeight: 700 } }}>
              <Tab data-tour="pos-tab-buscar" label={cart.length > 0 ? `Buscar (${cart.length})` : 'Buscar'} />
              <Tab data-tour="pos-tab-venta" label="Venta" />
            </Tabs>
          </Box>
        )}

        {/* Columna izquierda */}
        {(!isMobile || mobileTab === 0) && (
        <Box sx={{ flex: 2, minWidth: 0, display: 'flex', flexDirection: 'column', gap: { xs: 1.5, md: 3 }, overflow: 'hidden', p: { xs: 2, md: 0 } }}>

          {/* Buscar Producto */}
          <Box data-tour="pos-buscar" sx={{ bgcolor: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', p: { xs: 1.5, md: 2.5 }, flexShrink: 0 }}>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <TextField
                fullWidth
                inputRef={searchRef}
                autoFocus
                placeholder="Buscar por nombre o código de barras..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                sx={inputSx}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: MUTED, fontSize: 18 }} /></InputAdornment> }}
              />
              <Tooltip title="Escanear código de barras (F1)">
                <IconButton onClick={() => setOpenScanner(true)}
                  sx={{ bgcolor: `${PRIMARY}12`, border: `1px solid ${PRIMARY}30`, borderRadius: '10px', px: 1.5, color: PRIMARY, flexShrink: 0, '&:hover': { bgcolor: `${PRIMARY}20`, borderColor: PRIMARY } }}>
                  <CameraAltIcon sx={{ fontSize: 22 }} />
                </IconButton>
              </Tooltip>
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="outlined" startIcon={<AttachMoneyIcon />} onClick={() => setOpenPrecio(true)}
                sx={{ ...outlinedBtn, flex: 1, whiteSpace: 'nowrap', py: 0.6, borderRadius: '8px', fontSize: 13 }}>
                Consultar Precio
              </Button>
              <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setOpenMonto(true)}
                sx={{ ...outlinedBtn, flex: 1, whiteSpace: 'nowrap', py: 0.6, borderRadius: '8px', fontSize: 13 }}>
                Agregar Monto
              </Button>
            </Box>

            {scanFeedback && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Box sx={{
                  mt: 1.5, display: 'flex', alignItems: 'center', gap: 1,
                  px: 2, py: 1, bgcolor: SUCCESS_BG,
                  border: `1px solid ${SUCCESS_BORDER}`, borderRadius: '8px',
                }}>
                  <CheckCircleIcon sx={{ color: SUCCESS, fontSize: 16 }} />
                  <Typography sx={{ color: SUCCESS, fontSize: 13, fontWeight: 600 }}>
                    Agregado: {scanFeedback}
                  </Typography>
                </Box>
              </motion.div>
            )}

            {search.trim() !== '' && (
              <Box sx={{ mt: 1.5, maxHeight: 320, overflowY: 'auto' }}>
                {filteredProducts.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4, bgcolor: HOVER, borderRadius: '12px' }}>
                    <ShoppingBagIcon sx={{ color: MUTED, fontSize: 36, mb: 1 }} />
                    <Typography sx={{ color: MUTED, fontSize: 13 }}>No se encontró ningún producto.</Typography>
                  </Box>
                ) : (
                  <AnimatePresence>
                    {filteredProducts.map((product, idx) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03, duration: 0.2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Box
                          ref={idx === searchHighlightIdx ? highlightedItemRef : undefined}
                          onClick={() => intentarAgregar(product)}
                          sx={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            p: 1.5, mb: 0.75,
                            borderRadius: '10px',
                            cursor: product.stock === 0 ? 'not-allowed' : 'pointer',
                            bgcolor: idx === searchHighlightIdx ? `${PRIMARY}22` : HOVER,
                            border: '1px solid', borderColor: idx === searchHighlightIdx ? PRIMARY : 'transparent',
                            boxShadow: idx === searchHighlightIdx ? `0 0 0 1px ${PRIMARY}55` : 'none',
                            opacity: product.stock === 0 ? 0.45 : 1,
                            transition: 'all 0.15s',
                            '&:hover': { bgcolor: `${PRIMARY}0c`, borderColor: product.stock === 0 ? 'transparent' : `${PRIMARY}30`, transform: 'translateX(2px)' },
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }}>
                            <Box sx={{
                              width: 36, height: 36, borderRadius: '8px',
                              bgcolor: `${PRIMARY}14`, border: `1px solid ${PRIMARY}22`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              flexShrink: 0,
                            }}>
                              <ShoppingBagIcon sx={{ fontSize: 16, color: PRIMARY }} />
                            </Box>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography sx={{ color: INK, fontWeight: 600, fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {product.nombre}
                              </Typography>
                              <Typography sx={{ color: MUTED, fontSize: 11 }}>{product.categoria}</Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5, flexShrink: 0, ml: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Chip label={product.stock === 0 ? 'Sin stock' : `Stock: ${product.stock}`} size="small"
                                sx={{
                                  fontSize: 10, height: 20, fontWeight: 600,
                                  bgcolor: product.stock === 0 ? ERROR_BG : `${MONEY}18`,
                                  color: product.stock === 0 ? ERROR : MONEY,
                                  border: `1px solid ${product.stock === 0 ? ERROR_BORDER : `${MONEY}30`}`,
                                  '& .MuiChip-label': { px: 1 },
                                }}
                              />
                              <Typography sx={{ color: INK, fontWeight: 700, fontSize: 15, minWidth: 70, textAlign: 'right' }}>
                                {fmtMoney(product.precio)}
                              </Typography>
                            </Box>
                            {product.ultimaModificacion && (
                              <Typography sx={{ color: ERROR, fontSize: 10.5, fontWeight: 700 }}>
                                {fmtDate(product.ultimaModificacion)}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </Box>
            )}
          </Box>

          {/* Carrito */}
          <Box data-tour="pos-carrito" sx={{ flex: 1, bgcolor: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Box sx={{ px: 3, py: 2.5, borderBottom: cart.length > 0 ? `1px solid ${BORDER}` : 'none', flexShrink: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ShoppingCartOutlinedIcon sx={{ color: PRIMARY, fontSize: 18 }} />
                  <Typography sx={{ color: INK, fontWeight: 700, fontSize: 16 }}>Carrito</Typography>
                </Box>
                {cart.length > 0 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label={`${totalQty} ítem${totalQty !== 1 ? 's' : ''}`} size="small"
                      sx={{ bgcolor: `${PRIMARY}16`, color: PRIMARY, fontSize: 11.5, fontWeight: 700, border: `1px solid ${PRIMARY}30` }} />
                    <Tooltip title="Vaciar carrito">
                      <IconButton size="small" onClick={() => setOpenVaciarCarrito(true)}
                        sx={{ color: MUTED, p: '4px', '&:hover': { color: ERROR, bgcolor: ERROR_BG }, borderRadius: '6px' }}>
                        <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
              </Box>
              {cart.length === 0 && <Typography sx={{ color: MUTED, fontSize: 13, mt: 0.5 }}>El carrito está vacío</Typography>}
            </Box>

            {cart.length === 0 ? (
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1.5, px: 3 }}>
                <Box sx={{ width: 64, height: 64, borderRadius: '16px', bgcolor: `${PRIMARY}0c`, border: `1px dashed ${PRIMARY}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
                  <ShoppingCartOutlinedIcon sx={{ fontSize: 30, color: PRIMARY, opacity: 0.5 }} />
                </Box>
                <Typography sx={{ color: INK2, fontWeight: 600, fontSize: 15 }}>Carrito vacío</Typography>
                <Typography sx={{ color: MUTED, fontSize: 13, textAlign: 'center' }}>Buscá un producto o escaneá un código de barras</Typography>
                <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, mt: 0.5 }}>
                  {[['F1', 'Buscar'], ['F3', 'Escanear'], ['Enter', 'Agregar']].map(([key, label]) => (
                    <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: HOVER, border: `1px solid ${BORDER}`, borderRadius: '6px', px: 1.5, py: 0.75 }}>
                      <Typography sx={{ color: PRIMARY, fontSize: 11, fontFamily: 'monospace', fontWeight: 700 }}>{key}</Typography>
                      <Typography sx={{ color: MUTED, fontSize: 11 }}>{label}</Typography>
                    </Box>
                  ))}
                </Box>
                {ultimaVenta && (
                  <Button startIcon={<ReplayIcon sx={{ fontSize: 18 }} />} onClick={handleRepetirVenta}
                    sx={{ mt: 1, color: PRIMARY, textTransform: 'none', fontWeight: 600, fontSize: 13, '&:hover': { bgcolor: `${PRIMARY}12` } }}>
                    Repetir última venta
                  </Button>
                )}
              </Box>
            ) : (
              <Box sx={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                {/* Encabezado de columnas — no aplica en mobile, ahí cada ítem
                    es una tarjeta de 2 líneas, no una fila de columnas */}
                {!isMobile && (
                  <Box sx={{
                    display: 'grid', gridTemplateColumns: '28px 90px 1fr 90px 120px 60px 84px 32px', gap: 1, alignItems: 'center',
                    px: 2.5, py: 0.75, flexShrink: 0,
                  }}>
                    <Box />
                    <Typography sx={{ color: MUTED, fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Código</Typography>
                    <Typography sx={{ color: MUTED, fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Producto</Typography>
                    <Typography sx={{ color: MUTED, fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>Precio</Typography>
                    <Typography sx={{ color: MUTED, fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>Cantidad</Typography>
                    <Typography sx={{ color: MUTED, fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>Stock</Typography>
                    <Typography sx={{ color: MUTED, fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>Subtotal</Typography>
                    <Box />
                  </Box>
                )}

                <Box sx={{ px: 2.5, pt: 1.5, pb: 1.5 }}>
                <AnimatePresence>
                  {cart.map((item, idx) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginBottom: 8 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {isMobile ? (
                        /* Mobile: tarjeta de 2 líneas — el nombre necesita todo
                           el ancho para leerse, no entra al lado de precio/
                           cantidad/subtotal como en la fila de escritorio. */
                        <Box sx={{
                          bgcolor: idx % 2 === 0 ? HOVER : 'transparent',
                          borderRadius: '10px', p: 1.5, border: `1px solid ${BORDER}`,
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                            <Box sx={{
                              width: 20, height: 20, borderRadius: '6px', flexShrink: 0,
                              bgcolor: `${PRIMARY}16`, border: `1px solid ${PRIMARY}25`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <Typography sx={{ color: PRIMARY, fontSize: 10.5, fontWeight: 700 }}>{idx + 1}</Typography>
                            </Box>
                            <Typography sx={{ color: INK, fontSize: 13.5, fontWeight: 600, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.nombre}
                            </Typography>
                            {String(item.id).startsWith('manual-') && (
                              <Chip label="Manual" size="small"
                                sx={{ height: 17, fontSize: 9.5, fontWeight: 700, bgcolor: `${ORANGE}18`, color: ORANGE, border: `1px solid ${ORANGE}30`, flexShrink: 0, '& .MuiChip-label': { px: 0.75 } }} />
                            )}
                            <IconButton size="small" onClick={() => removeItem(item.id)}
                              sx={{ color: MUTED, p: '4px', flexShrink: 0, '&:hover': { color: ERROR, bgcolor: ERROR_BG }, borderRadius: '6px' }}>
                              <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                              <Typography sx={{ color: MUTED, fontSize: 12 }}>$</Typography>
                              <Box component="input" type="number" value={item.precio}
                                onChange={e => updatePrecio(item.id, e.target.value)}
                                onWheel={e => e.target.blur()}
                                style={{
                                  width: 52, background: 'none', border: 'none', outline: 'none',
                                  color: 'var(--ink2)', fontSize: 12.5, fontFamily: 'inherit',
                                  borderBottom: '1px dashed var(--border)', padding: '0 2px', textAlign: 'left',
                                }} />
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                              <IconButton size="small" onClick={() => removeQty(item.id)}
                                sx={{ color: MUTED, p: '4px', '&:hover': { color: INK, bgcolor: HOVER }, borderRadius: '6px' }}>
                                <RemoveCircleOutlineIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                              <CampoCantidadCarrito item={item} onCommit={valor => updateCantidad(item.id, valor)}
                                registrarRef={el => { cantidadRefs.current[item.id] = el; }}
                                onEnter={() => searchRef.current?.focus()}
                                style={{
                                  width: 42, background: 'none', border: 'none', outline: 'none',
                                  color: 'var(--ink)', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', textAlign: 'center',
                                }} />
                              {esFraccionable(item) && (
                                <Typography sx={{ color: MUTED, fontSize: 11 }}>{abrevUnidad(item.unidadMedida)}</Typography>
                              )}
                              <IconButton size="small" onClick={() => addQty(item.id)}
                                sx={{ color: PRIMARY, p: '4px', '&:hover': { bgcolor: `${PRIMARY}16` }, borderRadius: '6px' }}>
                                <AddCircleOutlineIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                              {esFraccionable(item) && (
                                <Tooltip title="Cargar por monto ($)">
                                  <IconButton size="small" onClick={() => { setMontoCalcularId(item.id); setMontoCalcularValor(''); }}
                                    sx={{ color: MUTED, p: '4px', '&:hover': { color: PRIMARY, bgcolor: `${PRIMARY}16` }, borderRadius: '6px' }}>
                                    <CalculateIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>
                            <Typography sx={{ color: INK, fontSize: 14, fontWeight: 700 }}>
                              {fmtMoney(item.precio * item.cantidad)}
                            </Typography>
                          </Box>
                        </Box>
                      ) : (
                      <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: '28px 90px 1fr 90px 120px 60px 84px 32px',
                        gap: 1, alignItems: 'center',
                        bgcolor: idx % 2 === 0 ? HOVER : 'transparent',
                        borderRadius: '10px', p: 1,
                        border: `1px solid transparent`,
                        '&:hover': { borderColor: BORDER },
                        transition: 'all 0.15s',
                      }}>
                        {/* N° item */}
                        <Box sx={{
                          width: 24, height: 24, borderRadius: '6px',
                          bgcolor: `${PRIMARY}16`, border: `1px solid ${PRIMARY}25`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <Typography sx={{ color: PRIMARY, fontSize: 11, fontWeight: 700 }}>{idx + 1}</Typography>
                        </Box>

                        {/* Código */}
                        <Typography sx={{ color: MUTED, fontSize: 12, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.codigo || '—'}
                        </Typography>

                        {/* Producto */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
                          <Typography sx={{ color: INK, fontSize: 13.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.nombre}
                          </Typography>
                          {String(item.id).startsWith('manual-') && (
                            <Tooltip title="Monto libre: no descuenta stock de ningún producto">
                              <Chip label="Manual" size="small"
                                sx={{ height: 17, fontSize: 9.5, fontWeight: 700, bgcolor: `${ORANGE}18`, color: ORANGE, border: `1px solid ${ORANGE}30`, flexShrink: 0, '& .MuiChip-label': { px: 0.75 } }} />
                            </Tooltip>
                          )}
                        </Box>

                        {/* Precio unitario */}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.25 }}>
                          <Typography sx={{ color: MUTED, fontSize: 12 }}>$</Typography>
                          <Box
                            component="input"
                            type="number"
                            value={item.precio}
                            onChange={e => updatePrecio(item.id, e.target.value)}
                            onWheel={e => e.target.blur()}
                            style={{
                              width: 56, background: 'none', border: 'none', outline: 'none',
                              color: 'var(--ink2)', fontSize: 12.5, fontFamily: 'inherit',
                              borderBottom: '1px dashed var(--border)',
                              padding: '0 2px', textAlign: 'left',
                            }}
                          />
                        </Box>

                        {/* Cantidad — alineado a la izquierda (no centrado) y con el input
                            a ancho fijo, para que el botón "-" y el número arranquen
                            siempre en el mismo lugar entre filas — antes, centrar el
                            grupo entero hacía que la fila se corriera según si el
                            producto tenía o no la unidad/calculadora extra al final. */}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 0.25 }}>
                          <IconButton size="small" onClick={() => removeQty(item.id)}
                            sx={{ color: MUTED, p: '4px', '&:hover': { color: INK, bgcolor: HOVER }, borderRadius: '6px' }}>
                            <RemoveCircleOutlineIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                          <CampoCantidadCarrito item={item} onCommit={valor => updateCantidad(item.id, valor)}
                            registrarRef={el => { cantidadRefs.current[item.id] = el; }}
                            onEnter={() => searchRef.current?.focus()}
                            style={{
                              width: 32, background: 'none', border: 'none', outline: 'none',
                              color: 'var(--ink)', fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
                              textAlign: 'center',
                            }}
                          />
                          <IconButton size="small" onClick={() => addQty(item.id)}
                            sx={{ color: PRIMARY, p: '4px', '&:hover': { bgcolor: `${PRIMARY}16` }, borderRadius: '6px' }}>
                            <AddCircleOutlineIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                          {esFraccionable(item) && (
                            <Typography sx={{ color: MUTED, fontSize: 11, flexShrink: 0 }}>{abrevUnidad(item.unidadMedida)}</Typography>
                          )}
                          {esFraccionable(item) && (
                            <Tooltip title="Cargar por monto ($)">
                              <IconButton size="small" onClick={() => { setMontoCalcularId(item.id); setMontoCalcularValor(''); }}
                                sx={{ color: MUTED, p: '4px', '&:hover': { color: PRIMARY, bgcolor: `${PRIMARY}16` }, borderRadius: '6px' }}>
                                <CalculateIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>

                        {/* Stock disponible */}
                        <Tooltip title={isFinite(item.stock) ? `Stock disponible: ${item.stock}` : 'Sin control de stock'}>
                          <Typography sx={{
                            fontSize: 12.5, fontWeight: 600, textAlign: 'center',
                            color: !isFinite(item.stock) ? MUTED : item.cantidad >= item.stock ? ERROR : INK2,
                          }}>
                            {isFinite(item.stock) ? item.stock : '—'}
                          </Typography>
                        </Tooltip>

                        {/* Subtotal */}
                        <Typography sx={{ color: INK, fontSize: 14, fontWeight: 700, textAlign: 'right' }}>
                          {fmtMoney(item.precio * item.cantidad)}
                        </Typography>

                        {/* Delete */}
                        <Tooltip title="Quitar">
                          <IconButton size="small" onClick={() => removeItem(item.id)}
                            sx={{ color: MUTED, p: '4px', justifySelf: 'center', '&:hover': { color: ERROR, bgcolor: ERROR_BG }, borderRadius: '6px' }}>
                            <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
        )}

        {/* Columna derecha — checkout completo, siempre visible */}
        {(!isMobile || mobileTab === 1) && (
        <Box sx={{ flex: 1, minWidth: { xs: 0, md: 380 }, maxWidth: { md: 420 }, display: 'flex', flexDirection: 'column', gap: { xs: 1.5, md: 1.25 }, overflowY: 'auto', p: { xs: 2, md: 0 }, pb: { md: 1.5 } }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); ejecutarConfirmarVenta(); }
          }}>

          {/* Cliente */}
          <Box data-tour="pos-cliente" sx={{ bgcolor: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', p: 1.75, flexShrink: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
              <Box sx={{ width: 28, height: 28, borderRadius: '8px', bgcolor: `${PRIMARY}14`, border: `1px solid ${PRIMARY}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PersonOutlineIcon sx={{ color: PRIMARY, fontSize: 15 }} />
              </Box>
              <Box>
                <Typography sx={{ color: INK, fontWeight: 700, fontSize: 13.5 }}>Cliente</Typography>
                <Typography sx={{ color: MUTED, fontSize: 11 }}>Seleccioná para la venta</Typography>
              </Box>
            </Box>
            {!nuevoCliente.active ? (
              <Autocomplete
                size="small"
                options={clientesOpts}
                value={clientesOpts.find(c => c.id === clienteId) ?? null}
                getOptionLabel={(opt) => opt.nombre || ''}
                isOptionEqualToValue={(opt, val) => opt.id === val?.id}
                filterOptions={(options, { inputValue }) => {
                  const q = inputValue.trim().toLowerCase();
                  const filtered = q ? options.filter(o => o.nombre.toLowerCase().includes(q)) : options;
                  if (q && !options.find(o => o.nombre.toLowerCase() === q)) {
                    filtered.push({ id: '__crear__', nombre: inputValue, _crear: true });
                  }
                  return filtered;
                }}
                onChange={(_, val) => {
                  if (!val) { setClienteId(null); return; }
                  if (val._crear) { setNuevoCliente({ active: true, nombre: val.nombre, cuit: '', telefono: '' }); return; }
                  setClienteId(val.id);
                }}
                renderOption={(props, opt) => {
                  const { key, ...rest } = props;
                  return (
                    <li key={key} {...rest}>
                      {opt._crear
                        ? <Typography sx={{ color: PRIMARY, fontWeight: 600, fontSize: 13 }}>+ Crear cliente &quot;{opt.nombre}&quot;</Typography>
                        : <Typography sx={{ fontSize: 13, color: INK }}>{opt.nombre}</Typography>}
                    </li>
                  );
                }}
                renderInput={(params) => (
                  <TextField {...params} placeholder="Consumidor Final (buscar o crear cliente...)"
                    sx={{
                      ...inputSx,
                      '& .MuiInputBase-root': { py: 0, pr: '9px !important' },
                      '& .MuiInputBase-input': { py: '10px !important', px: '4px', fontSize: 13 },
                    }} />
                )}
                slotProps={{
                  paper: { sx: { bgcolor: DROPDOWN, border: `1px solid ${BORDER}`, borderRadius: '10px', '& .MuiAutocomplete-option': { color: INK, '&:hover, &[aria-selected="true"]': { bgcolor: HOVER } } } },
                }}
                noOptionsText={<Typography sx={{ color: MUTED, fontSize: 13 }}>Sin resultados</Typography>}
              />
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <TextField fullWidth size="small" placeholder="Nombre o razón social" value={nuevoCliente.nombre}
                  onChange={e => setNuevoCliente(nc => ({ ...nc, nombre: e.target.value }))}
                  sx={{ ...inputSx, '& .MuiInputBase-input': { py: '10px', fontSize: 13 } }} />
                <TextField fullWidth size="small" placeholder="CUIT / DNI (opcional)" value={nuevoCliente.cuit}
                  onChange={e => setNuevoCliente(nc => ({ ...nc, cuit: e.target.value }))}
                  sx={{ ...inputSx, '& .MuiInputBase-input': { py: '10px', fontSize: 13 } }} />
                <TextField fullWidth size="small" placeholder="Teléfono (opcional)" value={nuevoCliente.telefono}
                  onChange={e => setNuevoCliente(nc => ({ ...nc, telefono: e.target.value }))}
                  sx={{ ...inputSx, '& .MuiInputBase-input': { py: '10px', fontSize: 13 } }} />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button fullWidth size="small" onClick={resetNuevoCliente}
                    sx={{ ...outlinedBtn, borderRadius: '8px', py: 0.75 }} variant="outlined">
                    Cancelar
                  </Button>
                  <Button fullWidth size="small" variant="contained" onClick={handleCrearCliente}
                    disabled={creandoCliente || !nuevoCliente.nombre.trim()}
                    sx={{ bgcolor: PRIMARY, borderRadius: '8px', py: 0.75, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: P_HOVER } }}>
                    {creandoCliente ? 'Creando...' : 'Crear cliente'}
                  </Button>
                </Box>
              </Box>
            )}
          </Box>

          {/* Métodos de Pago */}
          <Box data-tour="pos-pago" sx={{ bgcolor: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', p: 1.75, display: 'flex', flexDirection: 'column', gap: 1.25, flexShrink: 0 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography sx={{ color: INK, fontWeight: 700, fontSize: 14 }}>Métodos de Pago</Typography>
                <Typography sx={{ color: MUTED, fontSize: 11.5 }}>Seleccioná cómo paga el cliente</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Switch checked={variosPagos} onChange={(_, v) => { setVariosPagos(v); setPagosAplicados([]); if (v && (metodoPago === 'point' || metodoPago === 'qr')) setMetodoPago('efectivo'); }} size="small"
                  sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: PRIMARY }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: PRIMARY } }} />
                <Typography sx={{ color: INK, fontSize: 12.5, fontWeight: 500 }}>Varios</Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5 }}>
              {[
                { key: 'efectivo',      label: 'Efectivo',       Icon: LocalAtmIcon,    color: MONEY },
                {
                  key: 'tarjeta', label: 'Tarjeta', Icon: CreditCardIcon, color: GOLD,
                  badge: 'manual', badgeColor: MUTED,
                  nota: 'Registro manual: no verifica el cobro con el banco.',
                },
                {
                  key: 'transferencia', label: 'Transferencia', Icon: PhoneIphoneIcon, color: PURPLE,
                  badge: 'manual', badgeColor: MUTED,
                  nota: 'Registro manual: no verifica que la transferencia haya llegado.',
                },
                {
                  key: 'qr', label: 'QR', Icon: QrCodeIcon, color: ORANGE,
                  badge: qrDisponible ? 'con MP' : null,
                  disponible: true,
                },
                {
                  key: 'fiado', label: 'Fiado', Icon: HandshakeIcon, color: P_HOVER,
                  disponible: clienteId !== null,
                  motivo: 'Elegí un cliente para vender a cuenta corriente',
                },
                // Point deshabilitado temporalmente a pedido — sacado del todo del
                // selector (no solo deshabilitado) para no confundir. Se controla
                // con VITE_POINT_HABILITADO (ver src/config/brand.js o .env); para
                // reactivarlo, poner esa variable en "true" en el .env de este build.
                ...(POINT_HABILITADO ? [{
                  key: 'point', label: 'Point', Icon: PointOfSaleIcon, color: GOLD,
                  disponible: pointDisponible,
                  motivo: !mpConectado ? 'Conectá tu cuenta de Mercado Pago en Configuración → Cobros'
                    : !mpDeviceId ? 'Elegí un dispositivo Point en Configuración → Cobros'
                    : ajuste.activo ? 'Point no soporta descuentos/recargos todavía'
                    : cartTieneManual ? 'Point no soporta montos manuales todavía'
                    : '',
                }] : []),
              ].map(opt => {
                const disponible = opt.disponible !== false;
                const isActive = metodoPago === opt.key;
                const activeBg = `${opt.color}26`;

                const boton = (
                  <Button key={opt.key} fullWidth disabled={!disponible}
                    onClick={() => {
                      setMetodoPago(opt.key);
                      // El cobro real (Point / QR con MP) no admite combinarse con otros pagos
                      if (opt.key === 'point' || (opt.key === 'qr' && qrDisponible)) { setVariosPagos(false); setPagosAplicados([]); }
                    }}
                    sx={{
                      py: 0.875, flexDirection: 'column', gap: 0.375, textTransform: 'none', borderRadius: '10px',
                      border: `1px solid ${isActive ? opt.color + '60' : BORDER}`,
                      bgcolor: isActive ? activeBg : 'transparent',
                      color: isActive ? INK : INK2,
                      '&:hover': { bgcolor: activeBg, borderColor: opt.color + '60' },
                      '&.Mui-disabled': { color: MUTED, borderColor: BORDER, opacity: 0.55 },
                    }}>
                    <Box sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: disponible ? opt.color : MUTED, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <opt.Icon sx={{ fontSize: 16, color: '#fff' }} />
                    </Box>
                    <Typography sx={{ fontWeight: isActive ? 700 : 500, fontSize: 11.5 }}>{opt.label}</Typography>
                    {opt.badge && (
                      <Typography sx={{ color: opt.badgeColor || SUCCESS, fontSize: 9, fontWeight: 700, mt: -0.5 }}>{opt.badge}</Typography>
                    )}
                  </Button>
                );

                const tooltipTitle = !disponible ? (opt.motivo || '') : (opt.nota || '');
                return tooltipTitle ? (
                  <Tooltip key={opt.key} title={tooltipTitle}>
                    <span>{boton}</span>
                  </Tooltip>
                ) : boton;
              })}
            </Box>

            <Box sx={{ bgcolor: HOVER, border: `1px solid ${BORDER}`, borderRadius: '10px', p: 1.25 }}>
              <Typography sx={{ color: INK, fontWeight: 600, fontSize: 12.5, mb: 0.75 }}>
                Monto para {METODO_LABELS[metodoPago]}
              </Typography>

              {variosPagos ? (
                <>
                  {pagosAplicados.map((p, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
                      <Typography sx={{ color: INK2, fontSize: 13 }}>{METODO_LABELS[p.metodo]}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography sx={{ color: INK, fontWeight: 600, fontSize: 13 }}>{fmtMoney(p.monto)}</Typography>
                        <IconButton size="small" onClick={() => setPagosAplicados(prev => prev.filter((_, idx) => idx !== i))}
                          sx={{ color: MUTED, p: 0.25, '&:hover': { color: ERROR, bgcolor: ERROR_BG } }}>
                          <CloseIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Box>
                    </Box>
                  ))}
                  {pagosAplicados.length > 0 && <Divider sx={{ borderColor: BORDER, my: 1 }} />}
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <TextField size="small" fullWidth
                      placeholder={`Máx: ${fmtMoney(total - pagosAplicados.reduce((a, p) => a + p.monto, 0))}`}
                      value={montoActual} onChange={e => setMontoActual(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key !== 'Enter') return;
                        e.preventDefault();
                        e.stopPropagation();
                        handleAgregarPagoSplit();
                      }}
                      InputProps={{ startAdornment: <InputAdornment position="start" sx={{ color: MUTED }}>$</InputAdornment> }}
                      sx={{ '& .MuiOutlinedInput-root': { bgcolor: MODAL, color: INK, '& fieldset': { borderColor: BORDER }, '&.Mui-focused fieldset': { borderColor: PRIMARY } }, '& .MuiInputBase-input::placeholder': { color: MUTED, opacity: 1 } }}
                    />
                    <Button variant="contained" onClick={handleAgregarPagoSplit}
                      sx={{ bgcolor: PRIMARY, textTransform: 'none', fontWeight: 600, borderRadius: '8px', whiteSpace: 'nowrap', px: 2, '&:hover': { bgcolor: P_HOVER } }}>
                      Agregar
                    </Button>
                  </Box>
                </>
              ) : metodoPago === 'efectivo' ? (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography sx={{ color: MUTED, fontSize: 12.5, flexShrink: 0 }}>Recibido:</Typography>
                    <CampoPrecio size="small" fullWidth
                      disabled={procesando}
                      placeholder={String(total)}
                      value={efectivoRecibido}
                      onChange={e => setEfectivoRecibido(e.target.value)}
                      InputProps={{ startAdornment: <InputAdornment position="start" sx={{ color: MUTED }}>$</InputAdornment> }}
                      sx={{ '& .MuiOutlinedInput-root': { bgcolor: MODAL, color: INK, '& fieldset': { borderColor: BORDER }, '&.Mui-focused fieldset': { borderColor: PRIMARY } }, '& .MuiInputBase-input::placeholder': { color: MUTED, opacity: 1 } }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: efectivoNum > 0 ? 1.25 : 0.25 }}>
                    <Chip label={`Exacto (${fmtMoney(total)})`} size="small" clickable
                      onClick={() => setEfectivoRecibido(String(total))}
                      sx={{ bgcolor: `${SUCCESS}18`, color: SUCCESS, fontWeight: 600, fontSize: 11.5, border: `1px solid ${SUCCESS_BORDER}`, '&:hover': { bgcolor: `${SUCCESS}28` } }} />
                    {sugerirMontosRapidos(total).map(monto => (
                      <Chip key={monto} label={fmtMoney(monto)} size="small" clickable
                        onClick={() => setEfectivoRecibido(String(monto))}
                        sx={{ bgcolor: CARD, color: INK2, fontWeight: 600, fontSize: 11.5, border: `1px solid ${BORDER}`, '&:hover': { bgcolor: `${PRIMARY}18`, color: PRIMARY, borderColor: `${PRIMARY}40` } }} />
                    ))}
                  </Box>
                  {efectivoNum > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1.5, py: 1, borderRadius: '8px', bgcolor: vuelto >= 0 ? SUCCESS_BG : ERROR_BG, border: `1px solid ${vuelto >= 0 ? SUCCESS_BORDER : ERROR_BORDER}` }}>
                      <Typography sx={{ color: vuelto >= 0 ? SUCCESS : ERROR, fontSize: 13, fontWeight: 600 }}>
                        {vuelto >= 0 ? 'Vuelto:' : 'Falta:'}
                      </Typography>
                      <Typography sx={{ color: vuelto >= 0 ? SUCCESS : ERROR, fontSize: 17, fontWeight: 800 }}>
                        {fmtMoney(Math.abs(vuelto))}
                      </Typography>
                    </Box>
                  )}
                </>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ color: MUTED, fontSize: 12.5 }}>Total a cobrar: {fmtMoney(total)}</Typography>
                  <Chip label="Listo" size="small" sx={{ bgcolor: SUCCESS_BG, color: SUCCESS, fontWeight: 600 }} />
                </Box>
              )}
            </Box>
          </Box>

          {/* Descuento */}
          {puedeAplicarDescuento && (() => {
            const hayDescuento = Number(ajuste.valor) > 0;
            return (
              <Box data-tour="pos-descuento" sx={{ bgcolor: hayDescuento ? SUCCESS_BG : CARD, border: `1px solid ${hayDescuento ? SUCCESS_BORDER : BORDER}`, borderRadius: '12px', p: 1.5, flexShrink: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography sx={{ color: hayDescuento ? SUCCESS : INK2, fontSize: 13, fontWeight: 700 }}>Descuento</Typography>
                  {hayDescuento && (
                    <IconButton size="small" onClick={clearAjuste} sx={{ color: MUTED, p: 0.25, '&:hover': { color: INK } }}>
                      <CloseIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  )}
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField size="small" type="number" fullWidth placeholder="0"
                    value={ajuste.valor}
                    onChange={e => {
                      const valor = e.target.value;
                      setAjuste(a => ({ ...a, valor, tipo: 'descuento', activo: Number(valor) > 0 }));
                    }}
                    onWheel={e => e.target.blur()}
                    InputProps={{ endAdornment: <InputAdornment position="end" sx={{ color: MUTED }}>{ajuste.calculo === 'porcentaje' ? '%' : '$'}</InputAdornment> }}
                    sx={{ '& .MuiOutlinedInput-root': { bgcolor: MODAL, color: INK, '& fieldset': { borderColor: BORDER }, '&.Mui-focused fieldset': { borderColor: SUCCESS } } }}
                  />
                  <Box sx={{ display: 'flex', border: `1px solid ${BORDER}`, borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                    {[['porcentaje', '%'], ['monto', '$']].map(([key, label]) => (
                      <Button key={key} onClick={() => setAjuste(a => ({ ...a, calculo: key }))}
                        sx={{
                          minWidth: 36, px: 1.25, borderRadius: 0, textTransform: 'none', fontSize: 13, fontWeight: 700,
                          bgcolor: ajuste.calculo === key ? SUCCESS : 'transparent',
                          color: ajuste.calculo === key ? '#fff' : INK2,
                          '&:hover': { bgcolor: ajuste.calculo === key ? SUCCESS : HOVER },
                        }}>
                        {label}
                      </Button>
                    ))}
                  </Box>
                </Box>
              </Box>
            );
          })()}

          {/* Canje de puntos */}
          {puntosActivo && clienteId && puntosCliente > 0 && (
            <Box sx={{ bgcolor: puntosCanjearNum > 0 ? `${PRIMARY}14` : CARD, border: `1px solid ${puntosCanjearNum > 0 ? PRIMARY : BORDER}`, borderRadius: '12px', p: 1.5, flexShrink: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ color: puntosCanjearNum > 0 ? PRIMARY : INK2, fontSize: 13, fontWeight: 700 }}>
                  {clienteNombre} tiene {puntosCliente} puntos ({fmtMoney(puntosCliente * valorPunto)})
                </Typography>
                {puntosCanjearNum > 0 && (
                  <IconButton size="small" onClick={() => setPuntosCanjear('')} sx={{ color: MUTED, p: 0.25, '&:hover': { color: INK } }}>
                    <CloseIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField size="small" type="number" fullWidth placeholder="Puntos a canjear"
                  value={puntosCanjear}
                  onChange={e => setPuntosCanjear(e.target.value)}
                  onWheel={e => e.target.blur()}
                  inputProps={{ min: 0, max: puntosCliente }}
                  sx={{ '& .MuiOutlinedInput-root': { bgcolor: MODAL, color: INK, '& fieldset': { borderColor: BORDER }, '&.Mui-focused fieldset': { borderColor: PRIMARY } } }}
                />
                <Button onClick={() => setPuntosCanjear(String(puntosCliente))}
                  sx={{ color: PRIMARY, textTransform: 'none', fontWeight: 700, fontSize: 13, border: `1px solid ${PRIMARY}55`, borderRadius: '8px', whiteSpace: 'nowrap', px: 1.5 }}>
                  Usar todos
                </Button>
              </Box>
            </Box>
          )}

          {/* Resumen */}
          <Box sx={{ bgcolor: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', p: 1.75, flexShrink: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ReceiptIcon sx={{ color: PRIMARY, fontSize: 16 }} />
                <Typography sx={{ color: INK, fontWeight: 700, fontSize: 13.5 }}>Resumen</Typography>
              </Box>
              <Chip label={`${totalQty} items`} size="small"
                sx={{ bgcolor: HOVER, color: INK2, fontSize: 11, fontWeight: 600, border: `1px solid ${BORDER}` }} />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography sx={{ color: MUTED, fontSize: 13.5 }}>Subtotal</Typography>
              <Typography sx={{ color: INK, fontSize: 13.5, fontWeight: 500 }}>{fmtMoney(subtotal)}</Typography>
            </Box>

            {ajuste.activo && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ color: ajuste.tipo === 'descuento' ? SUCCESS : ERROR, fontSize: 13.5 }}>
                  {ajuste.tipo === 'descuento' ? 'Descuento' : 'Recargo'}
                </Typography>
                <Typography sx={{ color: ajuste.tipo === 'descuento' ? SUCCESS : ERROR, fontSize: 13.5, fontWeight: 700 }}>
                  {ajuste.tipo === 'descuento' ? '-' : '+'}{fmtMoney(montoAjuste)}
                </Typography>
              </Box>
            )}

            {puntosCanjearNum > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ color: PRIMARY, fontSize: 13.5 }}>{puntosCanjearNum} puntos canjeados</Typography>
                <Typography sx={{ color: PRIMARY, fontSize: 13.5, fontWeight: 700 }}>-{fmtMoney(descuentoPuntos)}</Typography>
              </Box>
            )}

            <Divider sx={{ borderColor: BORDER, my: 1 }} />
            <Box sx={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              px: 1.75, py: 1.1, borderRadius: '10px',
              bgcolor: `${PRIMARY}0c`, border: `1px solid ${PRIMARY}18`,
            }}>
              <Typography sx={{ color: INK, fontSize: 15, fontWeight: 700 }}>Total</Typography>
              <Typography sx={{ color: PRIMARY, fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>
                {fmtMoney(total)}
              </Typography>
            </Box>
          </Box>

          {/* Confirmar */}
          <Box sx={{ flexShrink: 0 }}>
            {!caja.abierta && (
              <Typography component={Link} to="/caja"
                sx={{ display: 'block', color: ORANGE, fontSize: 12, fontWeight: 600, textAlign: 'center', mb: 0.75, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                Abrí la caja antes de vender →
              </Typography>
            )}
            <Tooltip title={cart.length > 0 && caja.abierta ? 'Confirmar (Enter)' : ''}>
              <motion.div whileTap={{ scale: 0.98 }} whileHover={{ scale: 1.01 }}>
                <Button
                  data-tour="pos-confirmar"
                  variant="contained" fullWidth
                  startIcon={<PointOfSaleIcon />}
                  disabled={cart.length === 0 || !caja.abierta || confirmarVentaDisabled}
                  onClick={ejecutarConfirmarVenta}
                  sx={{
                    py: 1.25, fontSize: 15, fontWeight: 700,
                    textTransform: 'none', borderRadius: '12px',
                    background: `linear-gradient(135deg, ${PRIMARY}, ${P_HOVER})`,
                    boxShadow: cart.length > 0 && caja.abierta ? `0 4px 24px ${PRIMARY}45` : 'none',
                    '&:hover': { boxShadow: `0 6px 32px ${PRIMARY}60` },
                    '&.Mui-disabled': { background: `linear-gradient(135deg, ${PRIMARY}80, ${P_HOVER}80)`, color: '#fff', opacity: 0.5 },
                  }}
                >
                  {!variosPagos && metodoPago === 'point' ? 'Cobrar con Point' : (!variosPagos && metodoPago === 'qr' && qrDisponible) ? 'Generar QR' : 'Confirmar Venta'}
                </Button>
              </motion.div>
            </Tooltip>
          </Box>
        </Box>
        )}
      </Box>

      {/* ── Modal: Consultar Precio ── */}
      <Dialog open={openPrecio} onClose={() => setOpenPrecio(false)}
        PaperProps={{ sx: { ...modalPaperSx, minWidth: { xs: 'auto', sm: 460 } } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: { xs: 1.5, sm: 3 }, py: { xs: 1.5, sm: 2 }, color: INK, fontWeight: 700, fontSize: 18 }}>
          Consultar Precio
          <IconButton onClick={() => setOpenPrecio(false)} sx={{ color: MUTED, p: 0.5 }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ px: { xs: 1.5, sm: 3 }, pb: { xs: 1.75, sm: 3 }, pt: 0 }}>
          <Typography sx={{ color: MUTED, fontSize: 13.5, mb: 2.5 }}>
            Buscá un producto para ver su precio y stock disponible
          </Typography>
          <TextField fullWidth variant="outlined" placeholder="Nombre o código de barras..."
            value={precioSearch} onChange={e => setPrecioSearch(e.target.value)} autoFocus
            sx={{ ...inputSx, mb: 2 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: MUTED }} /></InputAdornment> }} />
          <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
            {precioResults.length === 0 && precioSearch.trim() !== '' && (
              <Typography sx={{ color: MUTED, fontSize: 13, textAlign: 'center', py: 3 }}>Sin resultados</Typography>
            )}
            {precioResults.length === 0 && precioSearch.trim() === '' && (
              <Typography sx={{ color: MUTED, fontSize: 13, textAlign: 'center', py: 3 }}>Escribí para buscar</Typography>
            )}
            {precioResults.map(p => (
              <Box key={p.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderRadius: '10px', mb: 1, bgcolor: HOVER }}>
                <Box>
                  <Typography sx={{ color: INK, fontWeight: 600, fontSize: 14 }}>{p.nombre}</Typography>
                  <Typography sx={{ color: INK2, fontSize: 12 }}>{p.codigo} · {p.categoria}</Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography sx={{ color: INK, fontWeight: 700, fontSize: 16 }}>{fmtMoney(p.precio)}</Typography>
                  <Typography sx={{ color: p.stock === 0 ? ERROR : SUCCESS, fontSize: 12 }}>
                    {p.stock === 0 ? 'Sin stock' : `${p.stock} en stock`}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </DialogContent>
      </Dialog>

      {/* ── Modal: Agregar Monto ── */}
      <Dialog open={openMonto} onClose={() => setOpenMonto(false)}
        PaperProps={{ sx: { ...modalPaperSx, minWidth: { xs: 'auto', sm: 420 } } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: { xs: 1.5, sm: 3 }, py: { xs: 1.5, sm: 2 }, color: INK, fontWeight: 700, fontSize: 18 }}>
          Agregar monto al carrito
          <IconButton onClick={() => setOpenMonto(false)} sx={{ color: MUTED, p: 0.5 }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ px: { xs: 1.5, sm: 3 }, pb: { xs: 1.75, sm: 3 }, pt: 0 }}>
          <Typography sx={{ color: MUTED, fontSize: 13.5, mb: 3 }}>
            Cargá rápidamente un ítem con monto variable.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
            <Box>
              <Typography sx={{ color: INK2, fontSize: 13, fontWeight: 500, mb: 0.75 }}>Descripción</Typography>
              <TextField fullWidth placeholder="Ej: Servicio, flete, etc." value={montoNombre}
                onChange={e => setMontoNombre(e.target.value)} sx={inputSx} autoFocus />
            </Box>
            <Box>
              <Typography sx={{ color: INK2, fontSize: 13, fontWeight: 500, mb: 0.75 }}>Monto</Typography>
              <TextField fullWidth placeholder="0.00" value={montoValor}
                onChange={e => setMontoValor(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAgregarMonto()}
                sx={inputSx}
                InputProps={{ startAdornment: <InputAdornment position="start" sx={{ color: MUTED }}>$</InputAdornment> }} />
            </Box>
          </Box>
          <DialogActions sx={{ px: 0, pb: 0, justifyContent: 'flex-end', gap: 1.5 }}>
            <Button onClick={() => setOpenMonto(false)} sx={{ ...outlinedBtn, border: `1px solid ${BORDER}`, px: 2.5, py: 1.25, borderRadius: '8px' }}>
              Cancelar
            </Button>
            <Button onClick={handleAgregarMonto} variant="contained"
              disabled={!montoNombre.trim() || !montoValor || Number(montoValor) <= 0}
              sx={{ bgcolor: PRIMARY, textTransform: 'none', px: 3, py: 1.25, borderRadius: '8px', '&:hover': { bgcolor: P_HOVER }, '&.Mui-disabled': { bgcolor: PRIMARY, opacity: 0.4, color: '#fff' } }}>
              Agregar al carrito
            </Button>
          </DialogActions>
        </DialogContent>
      </Dialog>

      {/* ── Modal: Cargar cantidad por monto (ej. "$500 de nafta") ── */}
      <Dialog open={!!montoCalcularId} onClose={() => setMontoCalcularId(null)}
        PaperProps={{ sx: { ...modalPaperSx, minWidth: { xs: 'auto', sm: 380 } } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: { xs: 1.5, sm: 3 }, py: { xs: 1.5, sm: 2 }, color: INK, fontWeight: 700, fontSize: 18 }}>
          Cargar por monto
          <IconButton onClick={() => setMontoCalcularId(null)} sx={{ color: MUTED, p: 0.5 }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ px: { xs: 1.5, sm: 3 }, pb: { xs: 1.75, sm: 3 }, pt: 0 }}>
          <Typography sx={{ color: MUTED, fontSize: 13.5, mb: 3 }}>
            Ingresá cuánto quiere gastar el cliente en &quot;{itemCalculando?.nombre}&quot; y calculamos solo la cantidad en {itemCalculando ? abrevUnidad(itemCalculando.unidadMedida) : ''}.
          </Typography>
          <Box sx={{ mb: 3 }}>
            <Typography sx={{ color: INK2, fontSize: 13, fontWeight: 500, mb: 0.75 }}>Monto</Typography>
            <TextField fullWidth placeholder="0.00" value={montoCalcularValor} autoFocus
              onChange={e => setMontoCalcularValor(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCalcularCantidadPorMonto()}
              sx={inputSx}
              InputProps={{ startAdornment: <InputAdornment position="start" sx={{ color: MUTED }}>$</InputAdornment> }} />
            {itemCalculando && !isNaN(parseFloat(String(montoCalcularValor).replace(',', '.'))) && itemCalculando.precio > 0 && (
              <Typography sx={{ color: MUTED, fontSize: 12.5, mt: 1 }}>
                = {round2(parseFloat(String(montoCalcularValor).replace(',', '.')) / itemCalculando.precio)} {abrevUnidad(itemCalculando.unidadMedida)}
              </Typography>
            )}
          </Box>
          <DialogActions sx={{ px: 0, pb: 0, justifyContent: 'flex-end', gap: 1.5 }}>
            <Button onClick={() => setMontoCalcularId(null)} sx={{ ...outlinedBtn, border: `1px solid ${BORDER}`, px: 2.5, py: 1.25, borderRadius: '8px' }}>
              Cancelar
            </Button>
            <Button onClick={handleCalcularCantidadPorMonto} variant="contained"
              disabled={!montoCalcularValor || Number(montoCalcularValor) <= 0}
              sx={{ bgcolor: PRIMARY, textTransform: 'none', px: 3, py: 1.25, borderRadius: '8px', '&:hover': { bgcolor: P_HOVER }, '&.Mui-disabled': { bgcolor: PRIMARY, opacity: 0.4, color: '#fff' } }}>
              Calcular
            </Button>
          </DialogActions>
        </DialogContent>
      </Dialog>

      {/* ── Modal: Cobrando con Point ── */}
      <Dialog open={pointEstado === 'esperando'} disableEscapeKeyDown onClose={() => {}} maxWidth="xs" fullWidth
        PaperProps={{ sx: { bgcolor: CARD, backgroundImage: 'none', border: `1px solid ${BORDER}`, borderRadius: '16px' } }}>
        <Box sx={{ px: { xs: 1.75, sm: 3 }, py: { xs: 2.25, sm: 4 }, textAlign: 'center' }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2.5 }}>
            <Box sx={{
              width: 64, height: 64, borderRadius: '50%', bgcolor: 'rgba(212,160,23,0.15)',
              border: '1px solid rgba(212,160,23,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <PointOfSaleIcon sx={{ color: GOLD, fontSize: 30 }} />
            </Box>
          </Box>
          <Typography sx={{ color: INK, fontWeight: 700, fontSize: 17, mb: 0.75 }}>
            Acercá o insertá la tarjeta
          </Typography>
          <Typography sx={{ color: MUTED, fontSize: 13.5, mb: 3 }}>
            Cobrando {fmtMoney(montoIntentoActivo ?? total)} en el lector Point...
          </Typography>
          <Button fullWidth variant="outlined" startIcon={<CancelIcon />} onClick={handleCancelarPoint}
            sx={{ color: INK2, borderColor: BORDER, textTransform: 'none', fontWeight: 600, fontSize: 14, borderRadius: '8px', py: 1.25, '&:hover': { borderColor: 'var(--border-hover)', bgcolor: HOVER } }}>
            Cancelar cobro
          </Button>
        </Box>
      </Dialog>

      {/* ── Modal: Cobrando con QR ── */}
      <Dialog open={qrEstado === 'esperando'} disableEscapeKeyDown onClose={() => {}} maxWidth="xs" fullWidth
        PaperProps={{ sx: { bgcolor: CARD, backgroundImage: 'none', border: `1px solid ${BORDER}`, borderRadius: '16px' } }}>
        <Box sx={{ px: { xs: 1.75, sm: 3 }, py: { xs: 2.25, sm: 4 }, textAlign: 'center' }}>
          <Typography sx={{ color: INK, fontWeight: 700, fontSize: 17, mb: 0.75 }}>
            Escaneá el código con la app de Mercado Pago
          </Typography>
          <Typography sx={{ color: MUTED, fontSize: 13.5, mb: 2.5 }}>
            Cobrando {fmtMoney(montoIntentoActivo ?? total)}
          </Typography>
          {qrImagenUrl && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2.5 }}>
              <Box sx={{ p: 1.5, bgcolor: '#fff', borderRadius: '12px', border: `1px solid ${BORDER}` }}>
                <img src={qrImagenUrl} alt="Código QR para cobrar" width={220} height={220} />
              </Box>
            </Box>
          )}
          <Button fullWidth variant="outlined" startIcon={<CancelIcon />} onClick={handleCancelarQr}
            sx={{ color: INK2, borderColor: BORDER, textTransform: 'none', fontWeight: 600, fontSize: 14, borderRadius: '8px', py: 1.25, '&:hover': { borderColor: 'var(--border-hover)', bgcolor: HOVER } }}>
            Cancelar cobro
          </Button>
        </Box>
      </Dialog>

      {/* ── Modal: Venta Procesada ── */}
      <Dialog open={openVentaOk} onClose={handleCerrarVentaOk} maxWidth="xs" fullWidth
        PaperProps={{ sx: { bgcolor: CARD, backgroundImage: 'none', border: `1px solid ${BORDER}`, borderRadius: '16px', m: { xs: 1.5, sm: 3 } } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: { xs: 2, sm: 3 }, pt: 2.5, pb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircleIcon sx={{ color: SUCCESS, fontSize: 22 }} />
            <Typography sx={{ color: INK, fontWeight: 700, fontSize: { xs: 16, sm: 18 } }}>Venta Procesada</Typography>
          </Box>
          <IconButton size="small" onClick={handleCerrarVentaOk} sx={{ color: MUTED, '&:hover': { color: INK } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box sx={{ px: { xs: 2, sm: 3 }, pb: 3 }}>
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}>
            <Box sx={{ bgcolor: SUCCESS_BG, border: `1px solid ${SUCCESS_BORDER}`, borderRadius: '12px', p: { xs: 2, sm: 2.5 }, mb: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75, mb: 0.5 }}>
                <CheckCircleIcon sx={{ color: SUCCESS, fontSize: 18 }} />
                <Typography sx={{ color: SUCCESS, fontWeight: 700, fontSize: 16 }}>¡Venta exitosa!</Typography>
              </Box>
              <Typography sx={{ color: SUCCESS, fontSize: 12.5, textAlign: 'center', mb: 2, opacity: 0.85, wordBreak: 'break-all' }}>
                Ticket #{ticketId}
              </Typography>
              <Divider sx={{ borderColor: SUCCESS_BORDER, mb: 1.5 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Typography sx={{ color: SUCCESS, fontWeight: 600, fontSize: 14 }}>Total</Typography>
                <Typography sx={{ color: SUCCESS, fontWeight: 800, fontSize: { xs: 20, sm: 22 } }}>{fmtMoney(lastTotal)}</Typography>
              </Box>
              {lastVentaData?.vuelto > 0 && (
                <>
                  <Divider sx={{ borderColor: SUCCESS_BORDER, my: 1.25 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography sx={{ color: SUCCESS, fontWeight: 600, fontSize: 14 }}>Vuelto</Typography>
                    <Typography sx={{ color: SUCCESS, fontWeight: 700, fontSize: 16 }}>{fmtMoney(lastVentaData.vuelto)}</Typography>
                  </Box>
                </>
              )}
            </Box>
          </motion.div>

          <Typography sx={{ color: MUTED, fontSize: 12, textAlign: 'center', mb: 2 }}>
            La facturación fiscal está desactivada para esta venta
          </Typography>

          {/* Acción principal — imprimir el ticket detallado. No cierra el modal:
              después de imprimir puede que quieras volver a imprimir, descargar
              el PDF o mandarlo por WhatsApp sin perder de vista la venta. */}
          <Button fullWidth variant="contained" startIcon={<PrintIcon />}
            onClick={() => imprimirTicket(lastVentaData, user?.empresa, facturaData)
              .catch((e) => toast(e.message || 'No se pudo abrir la impresión del ticket', 'error'))}
            sx={{ bgcolor: PRIMARY, textTransform: 'none', fontWeight: 700, fontSize: 14.5, borderRadius: '8px', py: 1.5, mb: 1.25, boxShadow: `0 2px 12px ${PRIMARY}35`, '&:hover': { bgcolor: P_HOVER } }}>
            Imprimir Ticket
          </Button>

          {/* Acciones secundarias sobre esta venta */}
          {lastVentaData?.cliente && lastVentaData.cliente !== 'Consumidor Final' && (
            <Button fullWidth variant="text" startIcon={<WhatsAppIcon sx={{ fontSize: 18 }} />}
              onClick={() => enviarWhatsApp(lastVentaData)}
              sx={{ color: '#25d366', textTransform: 'none', fontWeight: 600, fontSize: 13.5, borderRadius: '8px', py: 1, '&:hover': { bgcolor: '#25d36615' } }}>
              Enviar por WhatsApp
            </Button>
          )}
          {tieneFacturacion && (
            <Button fullWidth variant="text" startIcon={<ReceiptIcon sx={{ fontSize: 18 }} />}
              onClick={handleEmitirFactura} disabled={facturando || facturaData?.estado === 'pendiente'}
              sx={{ color: ORANGE, textTransform: 'none', fontWeight: 600, fontSize: 13.5, borderRadius: '8px', py: 1, mb: 1, '&:hover': { bgcolor: `${ORANGE}15` } }}>
              {facturando ? 'Emitiendo factura...'
                : facturaData?.estado === 'pendiente' ? 'Esperando confirmación de ARCA...'
                : 'Facturar ARCA'}
            </Button>
          )}
          <Button fullWidth variant="outlined" startIcon={<CancelIcon />} onClick={handleCerrarVentaOk}
            sx={{ mt: 1.25, color: INK2, borderColor: BORDER, textTransform: 'none', fontWeight: 600, fontSize: 13.5, borderRadius: '8px', py: 1.1, '&:hover': { borderColor: 'var(--border-hover)', bgcolor: HOVER } }}>
            Finalizar
          </Button>
        </Box>
      </Dialog>

      {/* Elegir talle (solo indumentaria) */}
      {productoParaTalles && (
        <ModalSeleccionTalle
          producto={productoParaTalles}
          onClose={() => setProductoParaTalles(null)}
          onAgregar={agregarVarianteConCantidad}
        />
      )}

      {/* Escáner de código de barras */}
      {openScanner && (
        <Suspense fallback={null}>
          <BarcodeScanner
            open={openScanner}
            onClose={() => setOpenScanner(false)}
            onScan={async (code) => {
              try {
                const porCodigo = await productosService.getAll({ codigo_exacto: code });
                if (porCodigo.length) { intentarAgregar(aProductoPos(porCodigo[0])); return; }
                const porNombre = await productosService.getAll({ search: code, per_page: 5 });
                const exacto = porNombre.find(p => p.nombre.toLowerCase() === code.toLowerCase());
                if (exacto) { intentarAgregar(aProductoPos(exacto)); return; }
              } catch { /* cae al mensaje de "no encontrado" de abajo */ }
              playBeep('error');
              toast('No se encontró ningún producto con ese código', 'error');
              setSearch(code);
            }}
          />
        </Suspense>
      )}

      <ConfirmDialog
        open={openVaciarCarrito}
        onClose={() => setOpenVaciarCarrito(false)}
        onConfirm={handleVaciarCarrito}
        title="¿Vaciar el carrito?"
        message="Se van a quitar todos los productos agregados a esta venta. Esta acción no se puede deshacer."
        confirmLabel="Vaciar carrito"
      />
    </Box>
  );
}

export default Home;
