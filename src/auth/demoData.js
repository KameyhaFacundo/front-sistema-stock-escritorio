// ═══════════════════════════════════════════════════════════════════════════
// DATOS DEMO —  Activar con VITE_DEMO_MODE=true  en  .env
// ═══════════════════════════════════════════════════════════════════════════

import { toLocalDateStr } from '../utils/format';

const hoy = new Date();
function fecha(diasAtras = 0, mesOffset = 0) {
  const d = new Date(hoy);
  d.setDate(d.getDate() - diasAtras);
  d.setMonth(d.getMonth() + mesOffset);
  return toLocalDateStr(d);
}
function hora(min = 0, max = 59) {
  const h = 7 + Math.floor(Math.random() * 15); // 7 a 22 hs
  const m = min + Math.floor(Math.random() * (max - min));
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// ─── DATOS BASE (productos, categorías) ────────────────────────────────────
const CATS = [
  { id: 1, categoria: 'Bebidas',   cColor: '#6366f1' },
  { id: 2, categoria: 'Lácteos',   cColor: '#f59e0b' },
  { id: 3, categoria: 'Panadería', cColor: '#10b981' },
  { id: 4, categoria: 'Limpieza',  cColor: '#ef4444' },
  { id: 5, categoria: 'Golosinas', cColor: '#8b5cf6' },
  { id: 6, categoria: 'Almacén',   cColor: '#06b6d4' },
];

const PROVEEDORES = [
  { id: 1, persona: 'Distribuidora La Ideal' },
  { id: 2, persona: 'Mayorista El Puente'   },
  { id: 3, persona: 'Importadora Sur SRL'    },
];

function prod(id, nombre, catIdx, precio, stock, alerta, extra = {}) {
  const cat = CATS[catIdx];
  return {
    id, nombre, codigo: `PROD-${String(id).padStart(4, '0')}`,
    categoria: cat.categoria, cColor: cat.cColor, id_categoria: cat.id,
    activo: true, stock, alerta, precioFinal: precio, costo: Math.round(precio * 0.6),
    proveedor: PROVEEDORES[id % 3]?.persona || 'Sin proveedor',
    id_proveedor: PROVEEDORES[id % 3]?.id || null,
    fechaVencimiento: extra.fechaVencimiento || null,
  };
}

export const DEMO_PRODUCTOS = [
  prod(1,  'Coca-Cola 1.5L',     0, 2800,  45, 10),
  prod(2,  'Sprite 2L',          0, 2600,  32, 8),
  prod(3,  'Agua Mineral 500ml', 0, 1200,  120, 20),
  prod(4,  'Leche Entera 1L',    1, 1500,  14, 8, { fechaVencimiento: fecha(-1, 0) }),
  prod(5,  'Yogurt Frutilla',    1, 1100,  22, 10, { fechaVencimiento: fecha(-5) }),
  prod(6,  'Queso Cremoso',      1, 4800,  5, 3),
  prod(7,  'Pan Francés',        2, 2200,  3, 5, { fechaVencimiento: fecha(0) }),
  prod(8,  'Medialunas x6',      2, 1800,  12, 6, { fechaVencimiento: fecha(-2) }),
  prod(9,  'Facturas surtidas',  2, 2400,  8, 4),
  prod(10, 'Lavandina 1L',       3, 1600,  25, 10),
  prod(11, 'Detergente 750ml',   3, 2100,  18, 8),
  prod(12, 'Desodorante Amb.',   3, 3200,  6, 4),
  prod(13, 'Alfajor chocolate',  4, 950,   40, 15),
  prod(14, 'Chupetín surtido',   4, 350,   80, 20),
  prod(15, 'Galletitas dulces',  4, 1200,  20, 10, { fechaVencimiento: fecha(-3) }),
  prod(16, 'Arroz 1kg',          5, 1900,  30, 10),
  prod(17, 'Fideos Spaghetti',   5, 1400,  45, 12),
  prod(18, 'Aceite Girasol 1.5L',5, 3500,  16, 6),
  prod(19, 'Harina 0000 1kg',    5, 1100,  35, 10),
  prod(20, 'Azúcar 1kg',         5, 1800,  28, 8),
  prod(21, 'Cerveza Lata 473ml', 0, 1800,  4, 8),
  prod(22, 'Jabón Líquido 750ml',3, 2800,  2, 5),
  prod(23, 'Dulce de Leche 400g',5, 2500,  10, 6, { fechaVencimiento: fecha(0, 1) }),
  prod(24, 'Mermelada Frutilla', 5, 1900,  7, 5),
];

// ─── VENTAS DEMO ───────────────────────────────────────────────────────────
const CLIENTES = [
  null, null, null, null, null, null, null, 'Carlos López', 'María García',
  'Juan Pérez', null, 'Ana Martínez', null, null, 'Pedro Suárez',
];
const METODOS = ['efectivo', 'efectivo', 'efectivo', 'tarjeta', 'efectivo', 'transferencia', 'efectivo', 'qr', 'efectivo', 'fiado'];

function ventaDemo(id, diasAtras, productoIds, cantidades) {
  const items = productoIds.map((pid, i) => {
    const p = DEMO_PRODUCTOS.find(x => x.id === pid) || DEMO_PRODUCTOS[0];
    return { nombre: p.nombre, precio: p.precioFinal, cantidad: cantidades[i] || 1, categoria: p.categoria };
  });
  const total = items.reduce((s, i) => s + i.precio * i.cantidad, 0);
  const metodo = METODOS[id % METODOS.length];
  const cliente = CLIENTES[id % CLIENTES.length];
  return {
    id: 1000 + id,
    numero: `TKT-${String(1000 + id).slice(-5)}`,
    fecha: fecha(diasAtras),
    hora:  hora(),
    cliente: cliente || 'Consumidor Final',
    total,
    metodo,
    items,
    estado: 'confirmada',
  };
}

// Genera ventas con patrones realistas
function generarVentasDemo() {
  const ventas = [];
  let id = 0;
  for (let dia = 30; dia >= 0; dia--) {
    const nDia = dia === 0 ? 18 : dia === 1 ? 3 : 5 + Math.floor(Math.random() * 12); // 5-17, más hoy
    for (let v = 0; v < nDia && id < 500; v++) {
      const nItems = 1 + Math.floor(Math.random() * 4);
      const productosIds = [];
      const cantidades = [];
      for (let i = 0; i < nItems; i++) {
        productosIds.push(1 + Math.floor(Math.random() * DEMO_PRODUCTOS.length));
        cantidades.push(1 + Math.floor(Math.random() * 3));
      }
      ventas.push(ventaDemo(id, dia, productosIds, cantidades));
      id++;
    }
  }
  return ventas;
}

export const DEMO_VENTAS = generarVentasDemo();

// ─── CAJA DEMO ─────────────────────────────────────────────────────────────
export const DEMO_CAJA = {
  abierta: true,
  montoInicial: 50000,
  horaApertura: `${toLocalDateStr(hoy)} 07:00`,
  movimientosDetalle: [
    { tipo: 'ingreso', monto: 15000, motivo: 'Ventas efectivo' },
    { tipo: 'ingreso', monto: 25000, motivo: 'Ventas varios' },
    { tipo: 'egreso',  monto: 8000,  motivo: 'Pago proveedor' },
    { tipo: 'ingreso', monto: 12000, motivo: 'Ventas efectivo' },
  ],
  ventasEfectivo: 52000,
  efectivoActual: 44000,
};

// ─── MOVIMIENTOS DEMO ──────────────────────────────────────────────────────
export const DEMO_MOVIMIENTOS = [
  { id: 1,  id_producto: 6, producto: 'Queso Cremoso',    codigo: 'PROD-0006', tipo: 'venta',  subTipo: 'Ticket #TKT-0185', cantidad: -2,  fecha: fecha(0), hora: hora() },
  { id: 2,  id_producto: 1, producto: 'Coca-Cola 1.5L',   codigo: 'PROD-0001', tipo: 'venta',  subTipo: 'Ticket #TKT-0184', cantidad: -3,  fecha: fecha(0), hora: hora() },
  { id: 3,  id_producto: 13,producto: 'Alfajor chocolate', codigo: 'PROD-0013', tipo: 'venta',  subTipo: 'Ticket #TKT-0183', cantidad: -5,  fecha: fecha(1), hora: hora() },
  { id: 4,  id_producto: 4, producto: 'Leche Entera 1L',  codigo: 'PROD-0004', tipo: 'venta',  subTipo: 'Ticket #TKT-0182', cantidad: -1,  fecha: fecha(1), hora: hora() },
  { id: 5,  id_producto: 18,producto: 'Aceite Girasol 1.5L',codigo:'PROD-0018', tipo: 'venta', subTipo: 'Ticket #TKT-0181', cantidad: -2, fecha: fecha(2), hora: hora() },
  { id: 6,  id_producto: 7, producto: 'Pan Francés',      codigo: 'PROD-0007', tipo: 'venta',  subTipo: 'Ticket #TKT-0180', cantidad: -4,  fecha: fecha(2), hora: hora() },
  { id: 7,  id_producto: 3, producto: 'Agua Mineral 500ml',codigo:'PROD-0003', tipo: 'compra', subTipo: 'Reposición',           cantidad: 50,  fecha: fecha(3), hora: hora() },
  { id: 8,  id_producto: 16,producto: 'Arroz 1kg',        codigo: 'PROD-0016', tipo: 'compra', subTipo: 'Reposición',           cantidad: 20,  fecha: fecha(4), hora: hora() },
  { id: 9,  id_producto: 22,producto: 'Jabón Líquido 750ml',codigo:'PROD-0022', tipo: 'ajuste', subTipo: 'Rotura de envase',    cantidad: -1,  fecha: fecha(3), hora: hora() },
  { id: 10, id_producto: 10,producto: 'Lavandina 1L',     codigo: 'PROD-0010', tipo: 'ajuste', subTipo: 'Ajuste inventario',    cantidad: 5,   fecha: fecha(5), hora: hora() },
];

// ─── RESÚMENES DEUDAS / FIADOS (vacíos por defecto) ────────────────────────
export const DEMO_DEUDAS = [];
export const DEMO_FIADOS = [];
