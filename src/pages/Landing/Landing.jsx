import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useInView, animate } from 'framer-motion';
import {
  Box, Typography, Button, TextField, Accordion, AccordionSummary,
  AccordionDetails, Switch, IconButton, Tooltip,
} from '@mui/material';
import { keyframes } from '@mui/system';
import InventoryIcon        from '@mui/icons-material/Inventory';
import ExpandMoreIcon       from '@mui/icons-material/ExpandMore';
import CheckIcon            from '@mui/icons-material/Check';
import CloseIcon            from '@mui/icons-material/Close';
import WhatsAppIcon         from '@mui/icons-material/WhatsApp';
import WbSunnyOutlinedIcon  from '@mui/icons-material/WbSunnyOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LoginIcon            from '@mui/icons-material/Login';
import LocalOfferIcon      from '@mui/icons-material/LocalOffer';
import PrintIcon            from '@mui/icons-material/Print';
import QrCode2Icon          from '@mui/icons-material/QrCode2';
import DragIndicatorIcon    from '@mui/icons-material/DragIndicator';
import QrCodeScannerIcon    from '@mui/icons-material/QrCodeScanner';
import BarChartIcon         from '@mui/icons-material/BarChart';
import GroupIcon            from '@mui/icons-material/Group';
import PointOfSaleIcon      from '@mui/icons-material/PointOfSale';
import TrendingUpIcon       from '@mui/icons-material/TrendingUp';
import { APP_NAME } from '../../config/brand';
import { PLANES as PLANS } from '../../config/planes';
import useLogo from '../../hooks/useLogo';
import { BG, CARD, BORDER, INK, INK2, MUTED, P, INPUT, HOVER } from '../../theme/tokens';
import { useAppTheme } from '../../theme/useAppTheme';
import TiltCard from '../../components/shared/TiltCard';

/* ── Animaciones CSS (solo para hero y ticker) ── */
const fadeUp    = keyframes`from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}`;
const pulse     = keyframes`0%,100%{transform:scale(1)}50%{transform:scale(1.04)}`;
const floatY    = keyframes`0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}`;
const slideLeft = keyframes`0%{transform:translateX(0)}100%{transform:translateX(-50%)}`;
const wordIn    = keyframes`from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}`;
const wordOut   = keyframes`from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(-10px)}`;

/* ══════════════════════════════════════
   ScrollReveal — anima al entrar al viewport (framer-motion: física de
   resorte real, no una curva CSS fija) — misma firma que antes, así que
   ningún lugar donde se usa necesita cambiar.
   direction: 'up' | 'down' | 'left' | 'right' | 'scale'
   delay: segundos
════════════════════════════════════════ */
const REVEAL_OFFSET = {
  up:    { y: 36 },
  down:  { y: -36 },
  left:  { x: -44 },
  right: { x: 44 },
  scale: { scale: 0.92 },
};

function ScrollReveal({ children, direction = 'up', delay = 0, sx = {} }) {
  const offset = REVEAL_OFFSET[direction] ?? REVEAL_OFFSET.up;

  return (
    <motion.div
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ type: 'spring', stiffness: 90, damping: 16, delay }}
    >
      <Box sx={sx}>{children}</Box>
    </motion.div>
  );
}

/* Contador que cuenta hasta el número al entrar en pantalla — se usa en las
   estadísticas del hero (ej: "100+" cuenta 0→100 y le pega el "+" fijo). */
function AnimatedStat({ value, label }) {
  const match = String(value).match(/^(\d+)(.*)$/);
  const target = match ? parseInt(match[1], 10) : null;
  const suffix = match ? match[2] : '';
  const [display, setDisplay] = useState(target === null ? value : '0' + suffix);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  useEffect(() => {
    if (!inView || target === null) return;
    const controls = animate(0, target, {
      duration: 1.1, ease: [0.16, 1, 0.3, 1],
      onUpdate: v => setDisplay(Math.round(v) + suffix),
    });
    return () => controls.stop();
  }, [inView, target, suffix]);

  return (
    <Box ref={ref}>
      <Typography sx={{ color:INK, fontWeight:800, fontSize:{ xs:18, sm:20 }, letterSpacing:'-0.02em' }}>{display}</Typography>
      <Typography sx={{ color:MUTED, fontSize:{ xs:11, sm:12 } }}>{label}</Typography>
    </Box>
  );
}

/* ── Datos ── */
const PALABRAS = ['punto de venta','inventarios','facturación ARCA','reportes','clientes y fiados','caja diaria'];

const TICKER = ['POS con código de barras','Stock en tiempo real','Cuentas corrientes','Facturación ARCA','Reportes automáticos','Soporte por WhatsApp','Funciones con IA','Cierre de caja','Clientes y fiados','Múltiples usuarios','Exportación CSV','App desde el celular','Etiquetas de precio'];

const PASOS = [
  { num:'01', title:'Creá tu cuenta gratis',   desc:'En menos de 2 minutos. Sin tarjeta de crédito ni instalaciones. Solo tu email y listo.', color: P },
  { num:'02', title:'Cargá tus productos',      desc:'Con el escáner del celular o manualmente. También podés importar desde Excel.', color:'#10b981' },
  { num:'03', title:'Empezá a vender',          desc:'El sistema actualiza el stock, registra la venta y genera el ticket automáticamente.', color:'#f59e0b' },
];

const FEATURES = [
  {
    id:'pos', tag:'Punto de venta', Icon: PointOfSaleIcon, mockup:'pos', flip: false,
    title:'Vendé más rápido que nunca',
    desc:'Escaneá el código de barras con el celular o la lectora y el producto aparece al instante. Calculá el vuelto, cobrá con cualquier medio de pago y emitís el ticket en segundos.',
    items:['Escaneo con cámara del celular o lectora','Múltiples medios de pago (efectivo, tarjeta, QR)','Vuelto automático','Impresión de tickets 58mm y 80mm'],
  },
  {
    id:'stock', tag:'Inventario', Icon: InventoryIcon, mockup:'stock', flip: true,
    title:'Tu stock siempre al día, sin contar',
    desc:'Cada venta descuenta el inventario automáticamente. Configurá alertas de reposición y recibí aviso cuando un producto está por agotarse.',
    items:['Actualización automática con cada venta','Alertas de stock mínimo','Historial de movimientos por producto','Categorías y variantes'],
  },
  {
    id:'reportes', tag:'Reportes', Icon: BarChartIcon, mockup:'reportes', flip: false,
    title:'Sabés cuánto ganás sin abrir Excel',
    desc:'Cuánto vendiste hoy, esta semana, este mes. Qué productos se mueven más. Cuánto queda en caja. Todo en números claros.',
    items:['Ventas por día, semana y mes','Productos más vendidos','Ganancia neta vs. costo','Exportación a CSV'],
  },
  {
    id:'clientes', tag:'Clientes', Icon: GroupIcon, mockup:'clientes', flip: true,
    title:'Fiados y cuentas corrientes sin cuadernos',
    desc:'Registrá deudas, pagos parciales y saldos por cliente. Sabés quién te debe, cuánto y desde cuándo.',
    items:['Cuentas corrientes por cliente','Cobros parciales y en cuotas','Historial de compras por cliente','Alertas de deuda pendiente'],
  },
];

// Datos de ejemplo (ilustrativos, no una promesa de resultados) para la
// sección "En vivo" — mismo criterio que el resto de los mockups de la
// página, que ya muestran números de muestra, no afirmaciones de marketing.
const REPORTES_EJEMPLO = {
  ventas: {
    semana: { valor:'$284.500', cambio:'+18%', sub:'Total de la semana', bars:[45,62,50,78,58,95,72], labels:['L','M','M','J','V','S','D'] },
    mes:    { valor:'$1.120.400', cambio:'+12%', sub:'Total del mes', bars:[55,70,60,85,68,90,75,95,80,65,88,72], labels:['1','','','','','','','','','','','12'] },
  },
  productos: {
    semana: { valor:'312 uds', cambio:'+9%', sub:'Unidades vendidas', bars:[30,55,40,68,48,85,62], labels:['L','M','M','J','V','S','D'] },
    mes:    { valor:'1.284 uds', cambio:'+14%', sub:'Unidades vendidas', bars:[45,60,50,75,58,80,65,88,70,60,82,68], labels:['1','','','','','','','','','','','12'] },
  },
};

function ReportesToggle({ options, value, onChange }) {
  return (
    <Box sx={{ display:'flex', gap:0.5, bgcolor:HOVER, borderRadius:'10px', p:0.5 }}>
      {options.map(([id, label]) => (
        <Box key={id} onClick={() => onChange(id)} sx={{
          px:2, py:0.9, borderRadius:'8px', cursor:'pointer', transition:'background-color .2s',
          bgcolor: value===id ? CARD : 'transparent',
          boxShadow: value===id ? '0 1px 4px rgba(0,0,0,0.10)' : 'none',
        }}>
          <Typography sx={{ color: value===id ? INK : MUTED, fontSize:13, fontWeight:600, whiteSpace:'nowrap' }}>{label}</Typography>
        </Box>
      ))}
    </Box>
  );
}

/* ── Panel "En vivo": toggles de métrica/período + gráfico que se anima ── */
/* ── Mockup Etiquetas ── */
function MockupEtiquetas() {
  const labelBg = '#ffffff';
  const labels = [
    { code:'CAM-001', talle:'M',  name:'Camisa Oxford',   price:'$9.500' },
    { code:'CAM-002', talle:'L',  name:'Camisa Oxford',   price:'$9.500' },
    { code:'CAM-003', talle:'XL', name:'Camisa Oxford',   price:'$9.500' },
  ];
  const [printed, setPrinted] = useState(0);
  useEffect(() => {
    let timer;
    const tick = (current) => {
      const next  = current >= labels.length ? 0 : current + 1;
      const delay = current >= labels.length ? 1600 : 700;
      timer = setTimeout(() => { setPrinted(next); tick(next); }, delay);
    };
    tick(0);
    return () => clearTimeout(timer);
  }, [labels.length]);

  return (
    <Box sx={{ bgcolor:CARD, border:`1px solid ${BORDER}`, borderRadius:'20px', p:3, boxShadow:'0 24px 72px rgba(0,0,0,0.14)' }}>
      <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', mb:1.5 }}>
        <Typography sx={{ color:INK, fontWeight:700, fontSize:14 }}>Etiquetas</Typography>
        <Box sx={{ px:1.5, py:0.4, bgcolor:`${P}15`, borderRadius:'6px' }}>
          <Typography sx={{ color:P, fontSize:12, fontWeight:700 }}>Imprimir</Typography>
        </Box>
      </Box>

      {/* Barra de progreso de impresión */}
      <Box sx={{ height:3, bgcolor:BORDER, borderRadius:'2px', overflow:'hidden', mb:2 }}>
        <motion.div
          animate={{ width:`${(printed / labels.length) * 100}%` }}
          transition={{ duration: printed === 0 ? 0.25 : 0.55, ease:[0.16,1,0.3,1] }}
          style={{ height:'100%', background:P, borderRadius:2 }}
        />
      </Box>

      {/* Preview de hoja A4 con etiquetas */}
      <Box sx={{
        bgcolor:'#1e2a35', borderRadius:'12px', p:1.5,
        backgroundImage:'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
        backgroundSize:'14px 14px',
      }}>
        <Box sx={{ display:'flex', flexWrap:'wrap', gap:0.5, justifyContent:'center' }}>
          {labels.map((l, i) => {
            const done = i < printed;
            return (
              <motion.div key={i}
                animate={{ opacity: done ? 1 : 0.4, filter: done ? 'grayscale(0)' : 'grayscale(1)' }}
                transition={{ duration:0.5, ease:'easeOut' }}
                style={{ borderRadius:4 }}
              >
                <Box sx={{
                  width:100, bgcolor:labelBg, borderRadius:'4px', p:0.6,
                  border: `1px solid ${done ? '#cbd5e1' : '#475569'}`,
                  boxShadow: done ? '0 2px 6px rgba(0,0,0,0.15)' : 'none',
                }}>
                  <Box sx={{ display:'flex', justifyContent:'space-between', mb:0.1 }}>
                    <Typography sx={{ fontSize:5, color:'#94a3b8', fontFamily:'monospace' }}>#{l.code}</Typography>
                    <Typography sx={{ fontSize:6, fontWeight:700, color:'#4f46e5' }}>{l.talle}</Typography>
                  </Box>
                  <Typography sx={{ fontSize:6, fontWeight:700, color:'#0f172a', textAlign:'center', mb:0.2 }}>
                    {l.name}
                  </Typography>
                  <Typography sx={{ fontSize:9, fontWeight:800, color:'#0f172a', textAlign:'center' }}>
                    {l.price}
                  </Typography>
                </Box>
              </motion.div>
            );
          })}
        </Box>
      </Box>

      {/* Estado: cuántas etiquetas ya se imprimieron */}
      <Box sx={{ display:'flex', alignItems:'center', justifyContent:'center', gap:0.75, mt:1.5 }}>
        <Typography sx={{ color:MUTED, fontSize:11, fontWeight:600 }}>
          {printed >= labels.length ? `${labels.length}/${labels.length} listas` : `Imprimiendo ${printed}/${labels.length}…`}
        </Typography>
      </Box>
    </Box>
  );
}

function ReportesEnVivo() {
  const [metric, setMetric]   = useState('ventas');
  const [periodo, setPeriodo] = useState('semana');
  const data = REPORTES_EJEMPLO[metric][periodo];

  return (
    <Box sx={{ bgcolor:CARD, borderTop:`1px solid ${BORDER}`, borderBottom:`1px solid ${BORDER}`, py:{ xs:8, md:12 } }}>
      <Box sx={{ maxWidth:1200, mx:'auto', px:{ xs:2, md:5 } }}>
        <ScrollReveal direction="up">
          <Box sx={{ textAlign:'center', mb:{ xs:5, md:7 } }}>
            <Typography sx={{ color:P, fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', mb:1.5 }}>En vivo</Typography>
            <Typography sx={{ color:INK, fontWeight:900, fontSize:{ xs:28, md:44 }, letterSpacing:'-0.03em', lineHeight:1.1, mb:2 }}>
              Mirá tu negocio,<br />en tiempo real.
            </Typography>
            <Typography sx={{ color:MUTED, fontSize:15, maxWidth:440, mx:'auto' }}>
              Así se ve tu panel de reportes. Ejemplo con datos de muestra — probalo con los tuyos.
            </Typography>
          </Box>
        </ScrollReveal>

        <ScrollReveal direction="scale" delay={0.1}>
          <TiltCard sx={{
            bgcolor:BG, border:`1px solid ${BORDER}`, borderRadius:'24px', p:{ xs:3, md:5 },
            maxWidth:760, mx:'auto', boxShadow:'0 24px 72px rgba(0,0,0,0.12)',
          }}>
            <Box sx={{ display:'flex', flexWrap:'wrap', gap:1.5, justifyContent:'space-between', mb:4 }}>
              <ReportesToggle value={metric} onChange={setMetric} options={[['ventas','Ventas'],['productos','Productos']]} />
              <ReportesToggle value={periodo} onChange={setPeriodo} options={[['semana','Esta semana'],['mes','Este mes']]} />
            </Box>

            <motion.div key={`${metric}-${periodo}`} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.35 }}>
              <Box sx={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', mb:3 }}>
                <Box>
                  <Typography sx={{ color:MUTED, fontSize:12 }}>{data.sub}</Typography>
                  <Typography sx={{ color:INK, fontWeight:900, fontSize:{ xs:32, md:40 }, letterSpacing:'-0.02em' }}>{data.valor}</Typography>
                </Box>
                <Box sx={{ display:'flex', alignItems:'center', gap:0.5, px:1.5, py:0.6, bgcolor:'#10b98115', borderRadius:'8px' }}>
                  <TrendingUpIcon sx={{ color:'#10b981', fontSize:16 }} />
                  <Typography sx={{ color:'#10b981', fontSize:13, fontWeight:700 }}>{data.cambio}</Typography>
                </Box>
              </Box>
              <Box sx={{ display:'flex', gap:1, alignItems:'flex-end', height:120, mb:1 }}>
                {data.bars.map((h, i) => (
                  <motion.div key={i}
                    initial={{ height:0 }} animate={{ height:`${h}%` }}
                    transition={{ delay: i * 0.035, duration:0.5, ease:[0.16,1,0.3,1] }}
                    style={{ flex:1, background: i === data.bars.length - 2 ? P : `${P}30`, borderRadius:'6px 6px 0 0' }}
                  />
                ))}
              </Box>
              <Box sx={{ display:'flex', gap:1 }}>
                {data.labels.map((l, i) => (
                  <Typography key={i} sx={{ flex:1, textAlign:'center', color:MUTED, fontSize:10 }}>{l}</Typography>
                ))}
              </Box>
            </motion.div>
          </TiltCard>
        </ScrollReveal>
      </Box>
    </Box>
  );
}

const TESTIMONIALS = [
  { name:'Emilio R.',  role:'Kiosco · Tucumán',              text:'"Muy buen POS. Lo uso todos los días y me ahorra un montón de tiempo. Antes anotaba todo a mano y siempre me perdía algo."' },
  { name:'Mariana G.', role:'Almacén · Santiago del Estero',  text:'"Lo mejor que me pasó este año. El stock se actualiza solo y ya no tengo que contar todo a mano los domingos."' },
  { name:'Pablo M.',   role:'Indumentaria · Tucumán',         text:'"En 20 minutos ya estaba vendiendo. Los reportes me ayudan a saber qué talle conviene tener más en stock."' },
];

// Precios/features de los planes: src/config/planes.js (PLANS) — compartido
// con Planes.jsx, no duplicar acá de nuevo.

const COMPARISON = [
  { f:'Registrá una venta en segundos',    ours:true,  excel:false, comp:false },
  { f:'Stock actualizado automáticamente', ours:true,  excel:false, comp:false },
  { f:'Cuentas corrientes y fiados',       ours:true,  excel:false, comp:false },
  { f:'Soporte humano por WhatsApp',       ours:true,  excel:false, comp:false },
  { f:'Funciona desde el celular',         ours:true,  excel:false, comp:true  },
  { f:'Reportes sin Excel',                ours:true,  excel:false, comp:false },
  { f:'Fácil desde el primer día',         ours:true,  excel:true,  comp:false },
  { f:'Funciones con IA',                  ours:true,  excel:false, comp:false },
];

const FAQS = [
  { q:'¿Necesito instalar algo?',           a:'No. Funciona 100% desde el navegador. Empezás desde tu celular, tablet o computadora en menos de 5 minutos.' },
  { q:'¿Qué pasa si no tengo internet?',   a:'El sistema requiere conexión para sincronizar. Las operaciones se guardan localmente y se sincronizan al reconectarse.' },
  { q:'¿Puedo cambiar de plan?',           a:'Sí, en cualquier momento. Los cambios se aplican al inicio del próximo período, sin cargos ocultos.' },
  { q:'¿Cómo manejo múltiples empleados?', a:'Cada plan incluye usuarios adicionales con roles y permisos personalizados.' },
  { q:'¿Funciona con mi impresora?',       a:'Compatible con la mayoría de impresoras térmicas de 58mm y 80mm vía navegador.' },
  { q:'¿Puedo cancelar cuando quiera?',    a:'Por supuesto. Sin contratos ni penalidades. Cancelás cuando quieras.' },
];

const fmt = n => n.toLocaleString('es-AR');

/* ── Mockups ── */
function MockupPOS() {
  return (
    <Box sx={{ bgcolor: CARD, border:`1px solid ${BORDER}`, borderRadius:'20px', p:3, boxShadow:'0 24px 72px rgba(0,0,0,0.14)' }}>
      <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', mb:2.5 }}>
        <Typography sx={{ color:INK, fontWeight:700, fontSize:14 }}>Nueva venta</Typography>
        <Box sx={{ px:1.5, py:0.4, bgcolor:`${P}15`, borderRadius:'6px' }}>
          <Typography sx={{ color:P, fontSize:12, fontWeight:700 }}>+ Producto</Typography>
        </Box>
      </Box>
      {[['Coca-Cola 500ml','x2','$1.800'],['Galletitas Oreo','x1','$1.200'],['Agua mineral','x3','$900']].map(([n,q,p]) => (
        <Box key={n} sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', py:1.25, borderBottom:`1px solid ${BORDER}` }}>
          <Box sx={{ display:'flex', alignItems:'center', gap:1.5 }}>
            <Box sx={{ width:32, height:32, bgcolor:HOVER, borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <QrCodeScannerIcon sx={{ fontSize:15, color:MUTED }} />
            </Box>
            <Box>
              <Typography sx={{ color:INK, fontSize:13, fontWeight:500 }}>{n}</Typography>
              <Typography sx={{ color:MUTED, fontSize:11 }}>{q}</Typography>
            </Box>
          </Box>
          <Typography sx={{ color:INK2, fontSize:13 }}>{p}</Typography>
        </Box>
      ))}
      <Box sx={{ mt:2.5, bgcolor:BG, borderRadius:'12px', p:2, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <Box>
          <Typography sx={{ color:MUTED, fontSize:12 }}>Total</Typography>
          <Typography sx={{ color:INK, fontWeight:900, fontSize:26, letterSpacing:'-0.02em' }}>$5.700</Typography>
        </Box>
        <Box sx={{ bgcolor:P, px:2.5, py:1.25, borderRadius:'10px' }}>
          <Typography sx={{ color:'#fff', fontWeight:700, fontSize:13 }}>Cobrar →</Typography>
        </Box>
      </Box>
    </Box>
  );
}

function MockupStock() {
  const items = [
    { name:'Coca-Cola 500ml', stock:142, min:50,  ok:true  },
    { name:'Galletitas Oreo',  stock:8,   min:20,  ok:false },
    { name:'Agua mineral 1L',  stock:67,  min:30,  ok:true  },
    { name:'Chips Lays',       stock:3,   min:15,  ok:false },
  ];
  return (
    <Box sx={{ bgcolor:CARD, border:`1px solid ${BORDER}`, borderRadius:'20px', p:3, boxShadow:'0 24px 72px rgba(0,0,0,0.14)' }}>
      <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', mb:2.5 }}>
        <Typography sx={{ color:INK, fontWeight:700, fontSize:14 }}>Inventario</Typography>
        <Box sx={{ px:1.5, py:0.4, bgcolor:'#f59e0b15', borderRadius:'6px', border:'1px solid #f59e0b30' }}>
          <Typography sx={{ color:'#f59e0b', fontSize:12, fontWeight:700 }}>2 alertas</Typography>
        </Box>
      </Box>
      {items.map(item => (
        <Box key={item.name} sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', py:1.25, borderBottom:`1px solid ${BORDER}` }}>
          <Box sx={{ display:'flex', alignItems:'center', gap:1.5, flex:1 }}>
            <Box sx={{ width:8, height:8, borderRadius:'50%', bgcolor:item.ok ? '#10b981' : '#f59e0b', flexShrink:0 }} />
            <Typography sx={{ color:INK, fontSize:13 }}>{item.name}</Typography>
          </Box>
          <Box sx={{ display:'flex', alignItems:'center', gap:2 }}>
            <Box sx={{ width:80, height:5, bgcolor:HOVER, borderRadius:'3px', overflow:'hidden' }}>
              <Box sx={{ height:'100%', width:`${Math.min((item.stock/(item.min*4))*100,100)}%`, bgcolor:item.ok ? '#10b981' : '#f59e0b', borderRadius:'3px' }} />
            </Box>
            <Typography sx={{ color:item.ok ? INK2 : '#f59e0b', fontWeight:700, fontSize:13, minWidth:24, textAlign:'right' }}>{item.stock}</Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
}

function MockupReportes() {
  const bars = [45,62,50,78,58,95,72];
  const dias  = ['L','M','M','J','V','S','D'];
  return (
    <Box sx={{ bgcolor:CARD, border:`1px solid ${BORDER}`, borderRadius:'20px', p:3, boxShadow:'0 24px 72px rgba(0,0,0,0.14)' }}>
      <Box sx={{ display:'flex', justifyContent:'space-between', mb:2.5 }}>
        <Box>
          <Typography sx={{ color:MUTED, fontSize:12 }}>Ventas esta semana</Typography>
          <Typography sx={{ color:INK, fontWeight:900, fontSize:26, letterSpacing:'-0.02em' }}>$284.500</Typography>
        </Box>
        <Box sx={{ display:'flex', alignItems:'center', gap:0.5, px:1.5, py:0.6, bgcolor:'#10b98115', borderRadius:'8px', height:'fit-content' }}>
          <TrendingUpIcon sx={{ color:'#10b981', fontSize:15 }} />
          <Typography sx={{ color:'#10b981', fontSize:12, fontWeight:700 }}>+18%</Typography>
        </Box>
      </Box>
      <Box sx={{ display:'flex', gap:0.75, alignItems:'flex-end', height:80, mb:1 }}>
        {bars.map((h,i) => (
          <Box key={i} sx={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:0.5 }}>
            <Box sx={{ width:'100%', bgcolor: i===5 ? P : `${P}30`, borderRadius:'4px 4px 0 0', height:`${h}%` }} />
            <Typography sx={{ color:MUTED, fontSize:10 }}>{dias[i]}</Typography>
          </Box>
        ))}
      </Box>
      <Box sx={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:1.5, mt:2 }}>
        {[['Ticket promedio','$1.890'],['Productos vendidos','312 uds']].map(([l,v]) => (
          <Box key={l} sx={{ bgcolor:BG, border:`1px solid ${BORDER}`, borderRadius:'10px', p:1.5 }}>
            <Typography sx={{ color:MUTED, fontSize:11, mb:0.25 }}>{l}</Typography>
            <Typography sx={{ color:INK, fontWeight:700, fontSize:15 }}>{v}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function MockupClientes() {
  const lista = [
    { name:'Juan García',   deuda:8500,  dias:3 },
    { name:'María López',   deuda:14200, dias:7 },
    { name:'Carlos Romero', deuda:2800,  dias:1 },
  ];
  return (
    <Box sx={{ bgcolor:CARD, border:`1px solid ${BORDER}`, borderRadius:'20px', p:3, boxShadow:'0 24px 72px rgba(0,0,0,0.14)' }}>
      <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', mb:2.5 }}>
        <Typography sx={{ color:INK, fontWeight:700, fontSize:14 }}>Cuentas corrientes</Typography>
        <Typography sx={{ color:'#ef4444', fontWeight:700, fontSize:13 }}>$25.500 total</Typography>
      </Box>
      {lista.map(c => (
        <Box key={c.name} sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', py:1.5, borderBottom:`1px solid ${BORDER}` }}>
          <Box sx={{ display:'flex', alignItems:'center', gap:1.5 }}>
            <Box sx={{ width:36, height:36, bgcolor:`${P}18`, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Typography sx={{ color:P, fontWeight:700, fontSize:13 }}>{c.name[0]}</Typography>
            </Box>
            <Box>
              <Typography sx={{ color:INK, fontSize:13, fontWeight:600 }}>{c.name}</Typography>
              <Typography sx={{ color:MUTED, fontSize:11 }}>Hace {c.dias} {c.dias===1?'día':'días'}</Typography>
            </Box>
          </Box>
          <Box sx={{ textAlign:'right' }}>
            <Typography sx={{ color:'#ef4444', fontWeight:700, fontSize:14 }}>-${c.deuda.toLocaleString('es-AR')}</Typography>
            <Box sx={{ px:1, py:0.2, bgcolor:'#ef444415', borderRadius:'4px', mt:0.25 }}>
              <Typography sx={{ color:'#ef4444', fontSize:10, fontWeight:600 }}>Pendiente</Typography>
            </Box>
          </Box>
        </Box>
      ))}
    </Box>
  );
}

const MOCKUPS = { pos: MockupPOS, stock: MockupStock, reportes: MockupReportes, clientes: MockupClientes };

/* ════════════════════════════════════
   LANDING PRINCIPAL
════════════════════════════════════ */
export default function Landing() {
  const navigate = useNavigate();
  const { mode, toggle } = useAppTheme();
  const logoSrc = useLogo();
  const [anual, setAnual]           = useState(true);
  const [expanded, setExpanded]     = useState(null);
  const [wordIdx, setWordIdx]       = useState(0);
  const [wordVisible, setWordVisible] = useState(true);
  const [email, setEmail]           = useState('');
  const [activeFeat, setActiveFeat] = useState(0);

  const scrollTo = id => document.getElementById(id)?.scrollIntoView({ behavior:'smooth' });

  useEffect(() => {
    const interval = setInterval(() => {
      setWordVisible(false);
      setTimeout(() => { setWordIdx(i => (i+1) % PALABRAS.length); setWordVisible(true); }, 280);
    }, 2600);
    return () => clearInterval(interval);
  }, []);

  // Avance automático del carrusel de funcionalidades — se reinicia solo
  // cada vez que activeFeat cambia, sea por el timer o por un click manual.
  useEffect(() => {
    const t = setTimeout(() => setActiveFeat(i => (i + 1) % FEATURES.length), 6000);
    return () => clearTimeout(t);
  }, [activeFeat]);

  return (
    <Box sx={{ bgcolor:BG, minHeight:'100vh', overflowX:'hidden', pt:'60px', position:'relative' }}>

      {/* Degradados de fondo animados, solo detrás del hero */}
      <motion.div
        style={{
          position:'absolute', top:-160, right:'-12%', width:680, height:680, borderRadius:'50%',
          background:`radial-gradient(closest-side, ${P}55, transparent)`, filter:'blur(80px)',
          pointerEvents:'none', zIndex:0,
        }}
        animate={{ y:[0,40,0], x:[0,-32,0], scale:[1,1.08,1] }}
        transition={{ duration:11, repeat:Infinity, ease:'easeInOut' }}
      />
      <motion.div
        style={{
          position:'absolute', top:160, left:'-14%', width:560, height:560, borderRadius:'50%',
          background:'radial-gradient(closest-side, #10b98150, transparent)', filter:'blur(80px)',
          pointerEvents:'none', zIndex:0,
        }}
        animate={{ y:[0,-34,0], x:[0,28,0], scale:[1,1.1,1] }}
        transition={{ duration:14, repeat:Infinity, ease:'easeInOut', delay:1 }}
      />
      <motion.div
        style={{
          position:'absolute', top:340, left:'38%', width:420, height:420, borderRadius:'50%',
          background:'radial-gradient(closest-side, #f59e0b40, transparent)', filter:'blur(80px)',
          pointerEvents:'none', zIndex:0,
        }}
        animate={{ y:[0,26,0], x:[0,-18,0], scale:[1,1.06,1] }}
        transition={{ duration:17, repeat:Infinity, ease:'easeInOut', delay:2 }}
      />

      {/* ══════════ NAVBAR ══════════ */}
      <Box component="nav" sx={{ position:'fixed', top:0, left:0, right:0, zIndex:200, borderBottom:`1px solid ${BORDER}`, backdropFilter:'blur(20px)', bgcolor:`${BG}ec` }}>
        <Box sx={{ maxWidth:1200, mx:'auto', px:{ xs:2, md:5 }, height:60, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <Box component="img" src={logoSrc} alt={APP_NAME}
            sx={{ height:44, width:'auto', display:'block' }} />

          <Box sx={{ display:{ xs:'none', md:'flex' }, alignItems:'center', gap:0.5 }}>
            {[['Funcionalidades','funcionalidades'],['Cómo funciona','como-funciona'],['Precios','precios'],['FAQ','faq']].map(([l,id]) => (
              <Button key={id} onClick={() => scrollTo(id)}
                sx={{ color:MUTED, textTransform:'none', fontSize:14, fontWeight:500, borderRadius:'8px', px:1.75, '&:hover':{ color:INK, bgcolor:HOVER } }}>
                {l}
              </Button>
            ))}
          </Box>

          <Box sx={{ display:'flex', alignItems:'center', gap:{ xs:0.5, sm:1 } }}>
            <Tooltip title={mode==='dark' ? 'Modo claro' : 'Modo oscuro'}>
              <IconButton size="small" onClick={toggle}
                sx={{ color:MUTED, borderRadius:'8px', p:'7px', '&:hover':{ color:INK, bgcolor:HOVER } }}>
                {mode==='dark' ? <WbSunnyOutlinedIcon sx={{ fontSize:17 }} /> : <DarkModeOutlinedIcon sx={{ fontSize:17 }} />}
              </IconButton>
            </Tooltip>
            {/* Mobile: solo "Iniciar sesión", como pill oscuro con ícono */}
            <Button onClick={() => navigate('/signin')} startIcon={<LoginIcon sx={{ fontSize:16 }} />}
              sx={{ display:{ xs:'inline-flex', sm:'none' }, bgcolor:INK, color:BG, textTransform:'none', fontSize:13, fontWeight:700, px:2, py:0.9, borderRadius:'100px', boxShadow:'none', whiteSpace:'nowrap', '&:hover':{ bgcolor:INK2 } }}>
              Iniciar sesión
            </Button>

            {/* Desktop: link simple + CTA aparte */}
            <Button onClick={() => navigate('/signin')}
              sx={{ display:{ xs:'none', sm:'inline-flex' }, color:INK2, textTransform:'none', fontSize:13, fontWeight:600, px:1.5, py:0.75, minWidth:'auto', '&:hover':{ color:INK } }}>
              Iniciar sesión
            </Button>
            <Button onClick={() => navigate('/onboarding')} variant="contained"
              sx={{ display:{ xs:'none', sm:'inline-flex' }, bgcolor:INK, color:BG, textTransform:'none', fontSize:13, fontWeight:700, px:2.25, py:0.8, borderRadius:'8px', boxShadow:'none', whiteSpace:'nowrap', '&:hover':{ bgcolor:INK2 } }}>
              Empezar gratis
            </Button>
          </Box>
        </Box>
      </Box>

      {/* ══════════ HERO ══════════ */}
      <Box sx={{ position:'relative', zIndex:1, maxWidth:1200, mx:'auto', px:{ xs:3, md:5 }, pt:{ xs:8, md:14 }, pb:{ xs:6, md:10 }, display:'flex', alignItems:'center', gap:{ xs:6, md:8 }, flexDirection:{ xs:'column', md:'row' } }}>

        <Box sx={{ flex:1, animation:`${fadeUp} 0.6s ease` }}>
          <Box sx={{ display:'inline-flex', alignItems:'center', gap:0.75, border:`1px solid ${BORDER}`, borderRadius:'100px', px:1.75, py:0.6, mb:3 }}>
            <Box sx={{ width:7, height:7, borderRadius:'50%', bgcolor:'#10b981', animation:`${pulse} 2s ease-in-out infinite` }} />
            <Typography sx={{ color:MUTED, fontSize:12, fontWeight:600 }}>Sistema POS para comercios argentinos</Typography>
          </Box>

          <Typography sx={{ color:INK, fontWeight:900, fontSize:{ xs:32, sm:50, md:62 }, lineHeight:1.05, letterSpacing:'-0.04em', mb:2.5 }}>
            Sistema de<br />
            <Box component="span" sx={{
              color:P, display:'inline-block',
              animation: wordVisible
                ? `${wordIn} 0.28s cubic-bezier(0.16,1,0.3,1) forwards`
                : `${wordOut} 0.22s ease forwards`,
              minWidth:{ md:380 },
              maxWidth:'100%',
            }}>
              {PALABRAS[wordIdx]}
            </Box>
            <br />para tu negocio.
          </Typography>

          <Typography sx={{ color:MUTED, fontSize:{ xs:15, md:17 }, lineHeight:1.7, mb:4, maxWidth:460 }}>
            Para kioscos, almacenes, indumentarias y más. Empezás en 5 minutos, sin instalaciones.
          </Typography>

          {/* Email CTA — directo al registro */}
          <Box sx={{ display:'flex', gap:1, mb:2, maxWidth:460 }}>
            <TextField
              fullWidth
              type="email"
              placeholder="Tu correo electrónico"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && email.includes('@')) navigate('/signin', { state: { onboarding: { email: email.trim() }, view: 'register' } }); }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: INPUT, borderRadius:'10px',
                  '& fieldset': { borderColor: BORDER },
                  '&:hover fieldset': { borderColor: 'var(--border-hover)' },
                  '&.Mui-focused fieldset': { borderColor: P, borderWidth:1 },
                },
                '& .MuiInputBase-input': { color: INK, fontSize:15, py:'12px', px:'14px', '&::placeholder':{ color:MUTED, opacity:1 } },
              }}
            />
            <motion.div whileHover={{ scale: 1.045 }} whileTap={{ scale: 0.96 }}>
              <Button
                onClick={() => { if (email.includes('@')) navigate('/signin', { state: { onboarding: { email: email.trim() }, view: 'register' } }); }}
                variant="contained"
                sx={{ bgcolor:P, color:'#fff', textTransform:'none', fontWeight:700, fontSize:15, px:3, borderRadius:'10px', boxShadow:`0 0 0 3px ${P}30`, whiteSpace:'nowrap', '&:hover':{ bgcolor:'#0891b2' } }}>
                Empezar gratis
              </Button>
            </motion.div>
          </Box>

          <Box sx={{ display:'flex', gap:1.5, flexWrap:'wrap' }}>
            <Button onClick={() => navigate('/onboarding')} variant="outlined"
              sx={{ color:INK2, borderColor:BORDER, textTransform:'none', fontWeight:600, fontSize:13, px:2, py:0.8, borderRadius:'10px', '&:hover':{ bgcolor:HOVER, borderColor:'var(--border-hover)' } }}>
              Configurar después →
            </Button>
            <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
              <Typography sx={{ color:MUTED, fontSize:12 }}>Sin tarjeta · 7 días gratis</Typography>
            </Box>
          </Box>

          <Box sx={{ display:'flex', alignItems:'center', justifyContent:{ xs:'center', md:'flex-start' }, textAlign:{ xs:'center', md:'left' }, gap:{ xs:3, sm:3 }, mt:4, flexWrap:'wrap', width:{ xs:'100%', md:'auto' } }}>
            {[['100+','Comercios activos'],['7 días','Prueba gratis'],['5 min','Para empezar']].map(([v,l]) => (
              <AnimatedStat key={l} value={v} label={l} />
            ))}
          </Box>
        </Box>

        <Box sx={{ flex:'0 0 auto', width:{ xs:'100%', md:420 }, animation:`${fadeUp} 0.7s 0.15s both ease` }}>
          <TiltCard sx={{ bgcolor:CARD, border:`1px solid ${BORDER}`, borderRadius:'20px', p:2.5, boxShadow:`0 32px 80px rgba(0,0,0,0.18)` }}>
            <Box sx={{ display:'flex', alignItems:'center', gap:1.5, mb:2.5 }}>
              {['#ff5f57','#febc2e','#28c840'].map(c => <Box key={c} sx={{ width:10, height:10, borderRadius:'50%', bgcolor:c }} />)}
              <Box sx={{ flex:1, height:22, bgcolor:HOVER, borderRadius:'6px' }} />
            </Box>
            <Box sx={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:1.5, mb:2 }}>
              {[['Ventas hoy','$284.500',P],['Ticket prom.','$1.890',INK2],['Stock bajo','3 items','#f59e0b'],['Clientes activos','42','#10b981']].map(([l,v,c]) => (
                <Box key={l} sx={{ bgcolor:BG, border:`1px solid ${BORDER}`, borderRadius:'10px', p:1.5 }}>
                  <Typography sx={{ color:MUTED, fontSize:11 }}>{l}</Typography>
                  <Typography sx={{ color:c, fontWeight:800, fontSize:16, mt:0.25 }}>{v}</Typography>
                </Box>
              ))}
            </Box>
            <Box sx={{ bgcolor:BG, border:`1px solid ${BORDER}`, borderRadius:'10px', p:1.5 }}>
              <Typography sx={{ color:MUTED, fontSize:11, mb:1 }}>Ventas de la semana</Typography>
              <Box sx={{ display:'flex', gap:0.75, alignItems:'flex-end', height:44 }}>
                {[40,65,50,80,55,90,70].map((h,i) => (
                  <motion.div key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ delay: 0.6 + i * 0.08, duration: 0.6, ease: [0.16,1,0.3,1] }}
                    style={{ flex:1, background:P, borderRadius:'3px 3px 0 0', opacity: i===5 ? 1 : 0.3 }}
                  />
                ))}
              </Box>
            </Box>
          </TiltCard>
        </Box>
      </Box>

      {/* ══════════ TICKER ══════════ */}
      <Box sx={{ borderTop:`1px solid ${BORDER}`, borderBottom:`1px solid ${BORDER}`, py:1.75, overflow:'hidden', bgcolor:CARD }}>
        <Box sx={{ display:'flex', animation:`${slideLeft} 28s linear infinite`, width:'max-content' }}>
          {[...TICKER,...TICKER].map((t,i) => (
            <Box key={i} sx={{ display:'flex', alignItems:'center', gap:2.5, px:3, flexShrink:0 }}>
              <Box sx={{ width:4, height:4, borderRadius:'50%', bgcolor:P }} />
              <Typography sx={{ color:MUTED, fontSize:13, fontWeight:500, whiteSpace:'nowrap' }}>{t}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ══════════ CÓMO FUNCIONA ══════════ */}
      <Box id="como-funciona" sx={{ bgcolor:CARD, borderBottom:`1px solid ${BORDER}`, py:{ xs:8, md:12 } }}>
        <Box sx={{ maxWidth:1200, mx:'auto', px:{ xs:2, md:5 } }}>

          <ScrollReveal direction="up">
            <Box sx={{ textAlign:'center', mb:{ xs:6, md:9 } }}>
              <Typography sx={{ color:P, fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', mb:1.5 }}>Tres pasos</Typography>
              <Typography sx={{ color:INK, fontWeight:900, fontSize:{ xs:28, md:44 }, letterSpacing:'-0.03em', lineHeight:1.1 }}>
                De cero a vender<br />en minutos.
              </Typography>
            </Box>
          </ScrollReveal>

          <Box sx={{ display:'grid', gridTemplateColumns:{ xs:'1fr', md:'repeat(3, 1fr)' }, gap:{ xs:3, md:4 }, position:'relative' }}>
            <Box sx={{ display:{ xs:'none', md:'block' }, position:'absolute', top:28, left:'16%', right:'16%', height:'1px', bgcolor:BORDER, zIndex:0 }} />
            {PASOS.map((paso, i) => (
              <ScrollReveal key={i} direction="up" delay={i * 0.12}>
                <Box sx={{ display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', position:'relative', zIndex:1 }}>
                  <Box sx={{ width:56, height:56, borderRadius:'50%', bgcolor:paso.color, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:18, mb:2.5, boxShadow:`0 0 0 8px ${paso.color}20` }}>
                    {paso.num}
                  </Box>
                  <Typography sx={{ color:INK, fontWeight:800, fontSize:18, mb:1 }}>{paso.title}</Typography>
                  <Typography sx={{ color:MUTED, fontSize:14, lineHeight:1.7, maxWidth:280 }}>{paso.desc}</Typography>
                </Box>
              </ScrollReveal>
            ))}
          </Box>

          <ScrollReveal direction="up" delay={0.2}>
            <Box sx={{ textAlign:'center', mt:{ xs:6, md:8 } }}>
              <Button onClick={() => navigate('/onboarding')} variant="contained"
                sx={{ bgcolor:P, color:'#fff', textTransform:'none', fontWeight:700, fontSize:15, px:4, py:1.5, borderRadius:'10px', boxShadow:`0 0 0 3px ${P}25`, '&:hover':{ bgcolor:'#0891b2' } }}>
                Empezar ahora — es gratis →
              </Button>
            </Box>
          </ScrollReveal>
        </Box>
      </Box>

      {/* ══════════ FUNCIONALIDADES — carrusel interactivo ══════════ */}
      <Box id="funcionalidades" sx={{ maxWidth:1200, mx:'auto', px:{ xs:2, md:5 }, py:{ xs:8, md:12 } }}>

        <ScrollReveal direction="up">
          <Box sx={{ textAlign:'center', mb:{ xs:5, md:7 } }}>
            <Typography sx={{ color:P, fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', mb:1.5 }}>Funcionalidades</Typography>
            <Typography sx={{ color:INK, fontWeight:900, fontSize:{ xs:28, md:44 }, letterSpacing:'-0.03em', lineHeight:1.1 }}>
              Todo lo que necesitás,<br />en un solo lugar.
            </Typography>
          </Box>
        </ScrollReveal>

        {/* Tabs de navegación */}
        <ScrollReveal direction="up" delay={0.1}>
          <Box sx={{ display:'flex', gap:1, justifyContent:'center', flexWrap:'wrap', mb:{ xs:5, md:7 } }}>
            {FEATURES.map((feat, i) => (
              <motion.div key={feat.id} whileTap={{ scale:0.95 }} whileHover={{ scale:1.03 }}>
                <Box onClick={() => setActiveFeat(i)} sx={{
                  display:'flex', alignItems:'center', gap:1, px:2, py:1.1, borderRadius:'100px', cursor:'pointer',
                  bgcolor: activeFeat===i ? P : CARD, border:`1px solid ${activeFeat===i ? P : BORDER}`,
                  transition:'background-color .2s, border-color .2s',
                }}>
                  <feat.Icon sx={{ fontSize:16, color: activeFeat===i ? '#fff' : MUTED }} />
                  <Typography sx={{ color: activeFeat===i ? '#fff' : INK2, fontSize:13.5, fontWeight:600, whiteSpace:'nowrap' }}>{feat.tag}</Typography>
                </Box>
              </motion.div>
            ))}
          </Box>
        </ScrollReveal>

        {/* Panel activo, con transición al cambiar */}
        <AnimatePresence mode="wait">
          {(() => {
            const feat = FEATURES[activeFeat];
            const MockupComp = MOCKUPS[feat.mockup];
            return (
              <motion.div
                key={feat.id}
                initial={{ opacity:0, x:36 }}
                animate={{ opacity:1, x:0 }}
                exit={{ opacity:0, x:-36 }}
                transition={{ duration:0.45, ease:[0.16,1,0.3,1] }}
              >
                <Box sx={{
                  display:'flex', flexDirection:{ xs:'column', md: feat.flip ? 'row-reverse' : 'row' },
                  alignItems:'center', gap:{ xs:4, md:8 },
                }}>
                  {/* Texto */}
                  <Box sx={{ flex:1 }}>
                    <Typography sx={{ color:INK, fontWeight:900, fontSize:{ xs:26, md:38 }, letterSpacing:'-0.03em', lineHeight:1.1, mb:2 }}>
                      {feat.title}
                    </Typography>
                    <Typography sx={{ color:MUTED, fontSize:15, lineHeight:1.75, mb:3.5, maxWidth:480 }}>
                      {feat.desc}
                    </Typography>
                    <Box sx={{ display:'flex', flexDirection:'column', gap:1.25 }}>
                      {feat.items.map(item => (
                        <Box key={item} sx={{ display:'flex', alignItems:'flex-start', gap:1.25 }}>
                          <Box sx={{ width:20, height:20, bgcolor:`${P}18`, border:`1px solid ${P}30`, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, mt:'1px' }}>
                            <CheckIcon sx={{ color:P, fontSize:12 }} />
                          </Box>
                          <Typography sx={{ color:INK2, fontSize:14, lineHeight:1.5 }}>{item}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>

                  {/* Mockup */}
                  <Box sx={{ flex:'0 0 auto', width:{ xs:'100%', md:440 } }}>
                    <TiltCard>
                      <MockupComp />
                    </TiltCard>
                  </Box>
                </Box>
              </motion.div>
            );
          })()}
        </AnimatePresence>

        {/* Puntos de navegación */}
        <Box sx={{ display:'flex', justifyContent:'center', gap:1, mt:{ xs:5, md:7 } }}>
          {FEATURES.map((_, i) => (
            <Box key={i} onClick={() => setActiveFeat(i)} sx={{
              width: activeFeat===i ? 26 : 8, height:8, borderRadius:'4px',
              bgcolor: activeFeat===i ? P : BORDER, cursor:'pointer', transition:'all .3s',
            }} />
          ))}
        </Box>
      </Box>

      {/* ══════════ EN VIVO (toggle Ventas/Productos, Semana/Mes) ══════════ */}
      <ReportesEnVivo />

      {/* ══════════ ETIQUETAS ══════════ */}
      <Box id="etiquetas" sx={{ maxWidth:1200, mx:'auto', px:{ xs:2, md:5 }, py:{ xs:8, md:14 } }}>

        <Box sx={{
          display:'flex', flexDirection:{ xs:'column', md:'row' },
          alignItems:'center', gap:{ xs:4, md:10 },
        }}>
          <Box sx={{ flex:1 }}>
            <ScrollReveal direction="up">
              <Typography sx={{ color:P, fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', mb:1.5 }}>
                Etiquetas de precio
              </Typography>
              <Typography sx={{ color:INK, fontWeight:900, fontSize:{ xs:28, md:42 }, letterSpacing:'-0.03em', lineHeight:1.1, mb:2 }}>
                Imprimí etiquetas<br />en segundos.
              </Typography>
              <Typography sx={{ color:MUTED, fontSize:15, lineHeight:1.7, mb:3.5, maxWidth:460 }}>
                Diseñá la plantilla a tu medida, escaneá el código de barras con la cámara y
                mandá a imprimir etiquetas de precio profesionales en hoja A4.
              </Typography>
            </ScrollReveal>

            <Box sx={{ display:'flex', flexDirection:'column', gap:1.5 }}>
              {[
                { icon:<DragIndicatorIcon sx={{ fontSize:16 }} />, text:'Arrastrá y redimensioná cada campo en el editor visual para armar la plantilla exacta que necesitás.' },
                { icon:<QrCode2Icon sx={{ fontSize:16 }} />, text:'Escaneá el código de barras con la cámara y el producto se agrega solo a la cola de impresión.' },
                { icon:<PrintIcon sx={{ fontSize:16 }} />, text:'Las etiquetas se organizan automáticamente en hoja A4 — solo hacé clic en imprimir.' },
                { icon:<LocalOfferIcon sx={{ fontSize:16 }} />, text:'Agregá talle, color de fondo, bordes y más. Guardá tus plantillas para reutilizarlas.' },
              ].map((item, i) => (
                <ScrollReveal key={i} direction="up" delay={i * 0.08}>
                  <Box sx={{ display:'flex', alignItems:'flex-start', gap:1.5 }}>
                    <Box sx={{ width:32, height:32, bgcolor:`${P}14`, border:`1px solid ${P}25`, borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, mt:'2px' }}>
                      <Box sx={{ color:P }}>{item.icon}</Box>
                    </Box>
                    <Typography sx={{ color:INK2, fontSize:14, lineHeight:1.6, flex:1 }}>{item.text}</Typography>
                  </Box>
                </ScrollReveal>
              ))}
            </Box>
          </Box>

          <Box sx={{ flex:'0 0 auto', width:{ xs:'100%', md:420 } }}>
            <ScrollReveal direction="scale" delay={0.15}>
              <TiltCard>
                <MockupEtiquetas />
              </TiltCard>
            </ScrollReveal>
          </Box>
        </Box>
      </Box>

      {/* ══════════ TESTIMONIALS ══════════ */}
      <Box sx={{ bgcolor:CARD, borderTop:`1px solid ${BORDER}`, borderBottom:`1px solid ${BORDER}`, py:{ xs:8, md:12 } }}>
        <Box sx={{ maxWidth:1200, mx:'auto', px:{ xs:2, md:5 } }}>

          <ScrollReveal direction="up">
            <Typography sx={{ color:MUTED, fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', mb:1.5 }}>Clientes reales</Typography>
            <Typography sx={{ color:INK, fontWeight:900, fontSize:{ xs:28, md:44 }, letterSpacing:'-0.03em', mb:8 }}>
              Lo que dicen los que lo usan.
            </Typography>
          </ScrollReveal>

          <Box sx={{ display:'grid', gridTemplateColumns:{ xs:'1fr', md:'repeat(3, 1fr)' }, gap:3 }}>
            {TESTIMONIALS.map((t, i) => (
              <ScrollReveal key={i} direction="up" delay={i * 0.1}>
                <Box sx={{ borderLeft:`3px solid ${i===1 ? P : BORDER}`, pl:3, py:0.5 }}>
                  <Typography sx={{ color:INK, fontSize:{ xs:15, md:16 }, lineHeight:1.7, mb:2.5, fontStyle:'italic' }}>{t.text}</Typography>
                  <Typography sx={{ color:INK, fontWeight:700, fontSize:14 }}>{t.name}</Typography>
                  <Typography sx={{ color:MUTED, fontSize:13 }}>{t.role}</Typography>
                </Box>
              </ScrollReveal>
            ))}
          </Box>
        </Box>
      </Box>

      {/* ══════════ PRECIOS ══════════ */}
      <Box id="precios" sx={{ maxWidth:1200, mx:'auto', px:{ xs:2, md:5 }, py:{ xs:8, md:14 } }}>

        <ScrollReveal direction="up">
          <Box sx={{ display:'flex', flexDirection:{ xs:'column', sm:'row' }, alignItems:{ sm:'flex-end' }, justifyContent:'space-between', gap:3, mb:8 }}>
            <Box>
              <Typography sx={{ color:INK, fontWeight:900, fontSize:{ xs:30, md:46 }, letterSpacing:'-0.03em' }}>Precios que tienen sentido.</Typography>
              <Typography sx={{ color:MUTED, fontSize:15, mt:1 }}>Sin costos ocultos. Cambiás de plan cuando quieras.</Typography>
            </Box>
            <Box sx={{ display:'inline-flex', alignItems:'center', gap:1.25, bgcolor:CARD, border:`1px solid ${BORDER}`, borderRadius:'100px', px:2, py:0.75, flexShrink:0 }}>
              <Typography onClick={() => setAnual(false)} sx={{ color:anual?MUTED:INK, fontSize:13, fontWeight:anual?400:700, cursor:'pointer' }}>Mensual</Typography>
              <Switch checked={anual} onChange={(_,v) => setAnual(v)} size="small"
                sx={{ '& .MuiSwitch-switchBase.Mui-checked':{ color:P }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track':{ bgcolor:P } }} />
              <Typography onClick={() => setAnual(true)} sx={{ color:anual?INK:MUTED, fontSize:13, fontWeight:anual?700:400, cursor:'pointer' }}>Anual</Typography>
              {anual && <Box sx={{ px:1, py:0.25, bgcolor:`${P}18`, borderRadius:'4px' }}><Typography sx={{ color:P, fontSize:11, fontWeight:700 }}>−20%</Typography></Box>}
            </Box>
          </Box>
        </ScrollReveal>

        <Box sx={{ display:'grid', gridTemplateColumns:{ xs:'1fr', md:'repeat(3, 1fr)' }, gap:2, alignItems:'center' }}>
          {PLANS.map((plan, i) => {
            const precio = anual ? plan.precioAnual : plan.precioMes;
            return (
              <ScrollReveal key={plan.id} direction={plan.highlight ? 'scale' : 'up'} delay={i * 0.1}>
                <motion.div whileHover={{ y: -8 }} transition={{ type:'spring', stiffness:300, damping:20 }}>
                <Box sx={{
                  position:'relative',
                  bgcolor: plan.highlight ? P : CARD,
                  border:`1px solid ${plan.highlight ? P : BORDER}`,
                  borderRadius:'20px', p:3.5,
                  display:'flex', flexDirection:'column',
                  transform: plan.highlight ? { md:'scale(1.04)' } : 'none',
                  boxShadow: plan.highlight ? `0 20px 60px ${P}30` : 'none',
                }}>
                  {plan.badge && (
                    <Box sx={{ position:'absolute', top:16, right:16, px:1.25, py:0.4, bgcolor: plan.highlight ? '#ffffff25' : '#10b98120', borderRadius:'6px' }}>
                      <Typography sx={{ color: plan.highlight ? '#fff' : '#10b981', fontSize:11, fontWeight:700 }}>{plan.badge}</Typography>
                    </Box>
                  )}
                  <Typography sx={{ color: plan.highlight ? '#ffffffb0' : MUTED, fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', mb:1 }}>{plan.desc}</Typography>
                  <Typography sx={{ color: plan.highlight ? '#fff' : INK, fontWeight:900, fontSize:22, mb:0.5 }}>{plan.nombre}</Typography>
                  <Box sx={{ display:'flex', alignItems:'flex-start', gap:0.5, mb:0.5 }}>
                    <Typography sx={{ color: plan.highlight ? '#ffffffb0' : MUTED, fontSize:16, mt:0.75 }}>$</Typography>
                    <Typography sx={{ color: plan.highlight ? '#fff' : INK, fontWeight:900, fontSize:44, letterSpacing:'-0.03em', lineHeight:1 }}>{fmt(precio)}</Typography>
                  </Box>
                  <Typography sx={{ color: plan.highlight ? '#ffffff70' : MUTED, fontSize:12, mb:3 }}>
                    por mes · {anual ? `$${fmt(precio*12)} / año` : 'facturado mensualmente'}
                  </Typography>
                  <Button onClick={() => navigate('/onboarding')} fullWidth
                    sx={{ bgcolor: plan.highlight ? '#fff' : `${P}15`, color:P, textTransform:'none', fontWeight:700, fontSize:14, py:1.4, borderRadius:'10px', border: plan.highlight ? 'none' : `1px solid ${P}30`, mb:3, '&:hover':{ bgcolor: plan.highlight ? '#f0f0f0' : `${P}25` } }}>
                    Empezar con {plan.nombre} →
                  </Button>
                  <Box sx={{ display:'flex', flexDirection:'column', gap:1 }}>
                    {plan.features.map(f => (
                      <Box key={f} sx={{ display:'flex', gap:1.25, alignItems:'flex-start' }}>
                        <CheckIcon sx={{ color: plan.highlight ? '#ffffffa0' : P, fontSize:15, mt:'2px', flexShrink:0 }} />
                        <Typography sx={{ color: plan.highlight ? '#ffffffd0' : INK2, fontSize:13.5, lineHeight:1.4 }}>{f}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
                </motion.div>
              </ScrollReveal>
            );
          })}
        </Box>

        {/* Tabla comparativa */}
        <ScrollReveal direction="up" delay={0.1}>
          <Box sx={{ mt:10 }}>
            <Typography sx={{ color:INK, fontWeight:800, fontSize:{ xs:24, md:34 }, letterSpacing:'-0.02em', mb:1 }}>¿Por qué elegirnos?</Typography>
            <Typography sx={{ color:MUTED, fontSize:14, mb:5 }}>Comparación honesta con las alternativas.</Typography>
            {/* Mobile: checklist de confianza + detalle expandible, sin grillas apretadas */}
            <Box sx={{ display:{ xs:'block', md:'none' } }}>
              <Box sx={{ bgcolor:CARD, border:`1px solid ${BORDER}`, borderRadius:'16px', p:2.5, mb:1.5 }}>
                <Typography sx={{ color:P, fontSize:11.5, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.06em', mb:1.75 }}>
                  Todo esto lo tenés con {APP_NAME}
                </Typography>
                <Box sx={{ display:'flex', flexDirection:'column' }}>
                  {COMPARISON.map((row,i) => (
                    <Box key={i} sx={{ display:'flex', alignItems:'center', gap:1.25, py:1.1, borderTop: i>0 ? `1px solid ${BORDER}` : 'none' }}>
                      <Box sx={{ width:20, height:20, borderRadius:'50%', bgcolor:`${P}15`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <CheckIcon sx={{ color:P, fontSize:13 }} />
                      </Box>
                      <Typography sx={{ color:INK2, fontSize:13.5, lineHeight:1.35 }}>{row.f}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              <Accordion disableGutters elevation={0}
                sx={{ bgcolor:'transparent', border:'none', '&:before':{ display:'none' } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color:MUTED, fontSize:20 }} />} sx={{ px:0.5, py:0 }}>
                  <Typography sx={{ color:MUTED, fontSize:13, fontWeight:600 }}>Ver comparación con Excel y otros sistemas</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px:0, pt:1 }}>
                  <Box sx={{ bgcolor:CARD, border:`1px solid ${BORDER}`, borderRadius:'14px', overflow:'hidden' }}>
                    <Box sx={{ display:'grid', gridTemplateColumns:'1fr repeat(3, 60px)', bgcolor:HOVER, borderBottom:`1px solid ${BORDER}` }}>
                      <Box sx={{ px:1.75, py:1.25 }} />
                      {[[APP_NAME,true],['Excel',false],['Otro',false]].map(([l,h]) => (
                        <Box key={l} sx={{ py:1.25, textAlign:'center' }}>
                          <Typography sx={{ color: h ? P : MUTED, fontSize:10.5, fontWeight:700 }}>{l}</Typography>
                        </Box>
                      ))}
                    </Box>
                    {COMPARISON.map((row,i) => (
                      <Box key={i} sx={{ display:'grid', gridTemplateColumns:'1fr repeat(3, 60px)', borderTop: i>0 ? `1px solid ${BORDER}` : 'none' }}>
                        <Box sx={{ px:1.75, py:1.1, display:'flex', alignItems:'center' }}>
                          <Typography sx={{ color:INK2, fontSize:12 }}>{row.f}</Typography>
                        </Box>
                        {[row.ours,row.excel,row.comp].map((v,j) => (
                          <Box key={j} sx={{ py:1.1, display:'flex', justifyContent:'center', alignItems:'center' }}>
                            {v ? <CheckIcon sx={{ color: j===0 ? P : '#10b981', fontSize:15 }} /> : <CloseIcon sx={{ color:MUTED, fontSize:15 }} />}
                          </Box>
                        ))}
                      </Box>
                    ))}
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Box>

            {/* Desktop: tabla completa */}
            <Box sx={{ display:{ xs:'none', md:'block' }, overflowX:'auto' }}>
              <Box sx={{ minWidth:520, bgcolor:CARD, border:`1px solid ${BORDER}`, borderRadius:'16px', overflow:'hidden' }}>
                <Box sx={{ display:'grid', gridTemplateColumns:'repeat(4, minmax(0, 1fr))', bgcolor:HOVER, borderBottom:`1px solid ${BORDER}` }}>
                  <Box sx={{ px:3, py:2 }}><Typography sx={{ color:MUTED, fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em' }}>Característica</Typography></Box>
                  {[[APP_NAME,true],['Excel',false],['Competidor',false]].map(([l,h]) => (
                    <Box key={l} sx={{ py:2, textAlign:'center', bgcolor: h ? `${P}10` : 'transparent', borderLeft:`1px solid ${BORDER}` }}>
                      <Typography sx={{ color: h ? P : MUTED, fontSize:13, fontWeight:700 }}>{l}</Typography>
                    </Box>
                  ))}
                </Box>
                {COMPARISON.map((row,i) => (
                  <Box key={i} sx={{ display:'grid', gridTemplateColumns:'repeat(4, minmax(0, 1fr))', borderBottom: i < COMPARISON.length-1 ? `1px solid ${BORDER}` : 'none', '&:hover':{ bgcolor:HOVER } }}>
                    <Box sx={{ px:3, py:1.5 }}><Typography sx={{ color:INK2, fontSize:13.5 }}>{row.f}</Typography></Box>
                    {[row.ours,row.excel,row.comp].map((v,j) => (
                      <Box key={j} sx={{ py:1.5, display:'flex', justifyContent:'center', alignItems:'center', borderLeft:`1px solid ${BORDER}`, bgcolor: j===0 ? `${P}06` : 'transparent' }}>
                        {v ? <CheckIcon sx={{ color: j===0 ? P : '#10b981', fontSize:17 }} /> : <CloseIcon sx={{ color:MUTED, fontSize:17 }} />}
                      </Box>
                    ))}
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </ScrollReveal>
      </Box>

      {/* ══════════ FAQ ══════════ */}
      <Box id="faq" sx={{ bgcolor:CARD, borderTop:`1px solid ${BORDER}`, py:{ xs:8, md:12 } }}>
        <Box sx={{ maxWidth:720, mx:'auto', px:{ xs:2, md:5 } }}>

          <ScrollReveal direction="up">
            <Typography sx={{ color:INK, fontWeight:900, fontSize:{ xs:28, md:40 }, letterSpacing:'-0.03em', mb:2 }}>Preguntas frecuentes.</Typography>
            <Typography sx={{ color:MUTED, fontSize:15, mb:7 }}>¿No encontrás lo que buscás? Escribinos por WhatsApp.</Typography>
          </ScrollReveal>

          {FAQS.map((faq, i) => (
            <ScrollReveal key={i} direction="up" delay={i * 0.05}>
              <Accordion expanded={expanded===i} onChange={() => setExpanded(expanded===i ? null : i)}
                disableGutters elevation={0}
                sx={{ bgcolor:'transparent', border:'none', borderBottom:`1px solid ${BORDER}`, '&:before':{ display:'none' } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color:MUTED, fontSize:20 }} />} sx={{ px:0, py:0.5 }}>
                  <Typography sx={{ color:INK, fontWeight:600, fontSize:{ xs:14, md:15 } }}>{faq.q}</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px:0, pb:2.5 }}>
                  <Typography sx={{ color:MUTED, fontSize:14, lineHeight:1.7 }}>{faq.a}</Typography>
                </AccordionDetails>
              </Accordion>
            </ScrollReveal>
          ))}
        </Box>
      </Box>

      {/* ══════════ FINAL CTA ══════════ */}
      <Box sx={{ maxWidth:1200, mx:'auto', px:{ xs:2, md:5 }, py:{ xs:8, md:14 } }}>
        <ScrollReveal direction="scale">
          <Box sx={{
            position:'relative', overflow:'hidden', borderRadius:'28px',
            background:`linear-gradient(135deg, ${P} 0%, #4a5cf0 55%, #322f8c 100%)`,
            px:{ xs:4, md:8 }, py:{ xs:7, md:9 },
            boxShadow:`0 32px 80px -24px ${P}80`,
          }}>
            {/* Glow blobs + textura de fondo */}
            <Box sx={{ position:'absolute', top:-140, right:-90, width:360, height:360, borderRadius:'50%', background:'radial-gradient(closest-side, #ffffff30, transparent)', filter:'blur(70px)', pointerEvents:'none' }} />
            <Box sx={{ position:'absolute', bottom:-110, left:-70, width:300, height:300, borderRadius:'50%', background:'radial-gradient(closest-side, #22d3ee35, transparent)', filter:'blur(70px)', pointerEvents:'none' }} />
            <Box sx={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(circle, #ffffff16 1px, transparent 1px)', backgroundSize:'24px 24px', pointerEvents:'none' }} />

            <Box sx={{ position:'relative', display:'flex', flexDirection:{ xs:'column', md:'row' }, alignItems:{ xs:'flex-start', md:'center' }, justifyContent:'space-between', gap:4 }}>
              <Box>
                <Box sx={{ display:'inline-flex', alignItems:'center', gap:0.75, bgcolor:'rgba(255,255,255,0.14)', border:'1px solid rgba(255,255,255,0.25)', borderRadius:'100px', px:1.5, py:0.5, mb:2.25 }}>
                  <Box sx={{ width:6, height:6, borderRadius:'50%', bgcolor:'#4ade80', animation:`${pulse} 2s ease-in-out infinite` }} />
                  <Typography sx={{ color:'#fff', fontSize:11.5, fontWeight:700 }}>Empezá en menos de 5 minutos</Typography>
                </Box>
                <Typography sx={{ color:'#fff', fontWeight:900, fontSize:{ xs:28, md:44 }, letterSpacing:'-0.03em', lineHeight:1.1, mb:2.25 }}>
                  Tu comercio ordenado.<br />Desde hoy.
                </Typography>
                <Box sx={{ display:'flex', flexWrap:'wrap', gap:2 }}>
                  {['Sin tarjeta','7 días gratis','Cancelás cuando querés'].map(t => (
                    <Box key={t} sx={{ display:'flex', alignItems:'center', gap:0.6 }}>
                      <CheckIcon sx={{ color:'#fff', fontSize:15, opacity:0.85 }} />
                      <Typography sx={{ color:'#ffffffc5', fontSize:13.5 }}>{t}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box sx={{ display:'flex', flexDirection:'column', alignItems:{ xs:'flex-start', md:'flex-end' }, gap:1.5, flexShrink:0 }}>
                <motion.div whileHover={{ scale: 1.045 }} whileTap={{ scale: 0.96 }}>
                  <Button onClick={() => navigate('/onboarding')} variant="contained"
                    sx={{ bgcolor:'#fff', color:P, textTransform:'none', fontWeight:800, fontSize:15.5, px:4.5, py:1.7, borderRadius:'12px', boxShadow:'0 10px 28px rgba(0,0,0,0.22)', whiteSpace:'nowrap', '&:hover':{ bgcolor:'#f0f0ff' } }}>
                    Empezar gratis →
                  </Button>
                </motion.div>
                <Button onClick={() => navigate('/signin')} sx={{ color:'#ffffff90', textTransform:'none', fontSize:13, fontWeight:500, '&:hover':{ color:'#fff' } }}>
                  Ya tengo cuenta → Iniciar sesión
                </Button>
              </Box>
            </Box>
          </Box>
        </ScrollReveal>
      </Box>

      {/* ══════════ FOOTER ══════════ */}
      <Box sx={{ bgcolor:CARD, borderTop:`1px solid ${BORDER}`, py:{ xs:4.5, md:3.5 }, px:{ xs:2.5, md:5 } }}>
        <Box sx={{ maxWidth:1200, mx:'auto' }}>

          {/* Mobile */}
          <Box sx={{ display:{ xs:'flex', md:'none' }, flexDirection:'column', alignItems:'center', gap:2.5 }}>
            <Box component="img" src={logoSrc} alt={APP_NAME} sx={{ height:32, width:'auto', display:'block' }} />
            <Box sx={{ display:'flex', gap:3, flexWrap:'wrap', justifyContent:'center' }}>
              {[['Funcionalidades','funcionalidades'],['Precios','precios'],['FAQ','faq']].map(([l,id]) => (
                <Typography key={id} onClick={() => scrollTo(id)} sx={{ color:INK2, fontSize:13.5, fontWeight:600, cursor:'pointer', '&:hover':{ color:INK } }}>{l}</Typography>
              ))}
            </Box>
            <Box sx={{ width:'100%', maxWidth:220, borderTop:`1px solid ${BORDER}` }} />
            <Box sx={{ display:'flex', flexDirection:'column', alignItems:'center', gap:1 }}>
              <Box sx={{ display:'flex', alignItems:'center', gap:2 }}>
                <Typography onClick={() => navigate('/privacidad')} sx={{ color:MUTED, fontSize:12, cursor:'pointer', '&:hover':{ color:INK2 } }}>Privacidad</Typography>
                <Typography onClick={() => navigate('/terminos')} sx={{ color:MUTED, fontSize:12, cursor:'pointer', '&:hover':{ color:INK2 } }}>Términos</Typography>
              </Box>
              <Typography sx={{ color:MUTED, fontSize:11.5, textAlign:'center' }}>© {new Date().getFullYear()} {APP_NAME} · Todos los derechos reservados</Typography>
            </Box>
          </Box>

          {/* Desktop */}
          <Box sx={{ display:{ xs:'none', md:'flex' }, justifyContent:'space-between', alignItems:'center', gap:2.5 }}>
            <Box component="img" src={logoSrc} alt={APP_NAME} sx={{ height:32, width:'auto', display:'block' }} />
            <Box sx={{ display:'flex', gap:3 }}>
              {[['Funcionalidades','funcionalidades'],['Precios','precios'],['FAQ','faq']].map(([l,id]) => (
                <Typography key={id} onClick={() => scrollTo(id)} sx={{ color:MUTED, fontSize:13, cursor:'pointer', '&:hover':{ color:INK2 } }}>{l}</Typography>
              ))}
            </Box>
            <Box sx={{ display:'flex', alignItems:'center', gap:2 }}>
              <Typography onClick={() => navigate('/privacidad')} sx={{ color:MUTED, fontSize:12, cursor:'pointer', '&:hover':{ color:INK2 } }}>Privacidad</Typography>
              <Typography onClick={() => navigate('/terminos')} sx={{ color:MUTED, fontSize:12, cursor:'pointer', '&:hover':{ color:INK2 } }}>Términos</Typography>
              <Typography sx={{ color:MUTED, fontSize:12 }}>© {new Date().getFullYear()} {APP_NAME}</Typography>
            </Box>
          </Box>

        </Box>
      </Box>

      {/* WhatsApp */}
      <Box component="a" href={`https://wa.me/5493815069332?text=${encodeURIComponent(`¡Hola! Me interesa conocer más sobre ${APP_NAME} para mi negocio.`)}`} target="_blank" rel="noopener noreferrer"
        sx={{ position:'fixed', bottom:{ xs:20, md:24 }, right:{ xs:16, md:24 }, zIndex:999, width:{ xs:46, md:52 }, height:{ xs:46, md:52 }, borderRadius:'50%', bgcolor:'#25d366', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 20px rgba(37,211,102,0.35)', textDecoration:'none', '&:hover':{ transform:'scale(1.1)' }, transition:'transform 0.2s', animation:`${floatY} 3s ease-in-out infinite` }}>
        <WhatsAppIcon sx={{ fontSize:26 }} />
      </Box>

    </Box>
  );
}
