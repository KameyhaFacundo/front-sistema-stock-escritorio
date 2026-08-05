import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Typography, TextField, Button, InputAdornment,
  Chip, Tooltip, IconButton,
} from '@mui/material';
import SearchIcon       from '@mui/icons-material/Search';
import PaymentIcon      from '@mui/icons-material/Payment';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import { BG, CARD, BORDER, INK, INK2, MUTED, P, P_HOVER, INPUT, HOVER,
         SUCCESS, SUCCESS_BG, SUCCESS_BORDER, SUCCESS_LIGHT,
         ERROR, ERROR_BG, ERROR_BORDER } from '../../theme/tokens';
import { fmtMoney, fmtDate } from '../../utils/format';
import DataTable       from '../../components/shared/DataTable';
import PaymentModal   from '../../components/shared/PaymentModal';
import { deudasService } from '../../services/deudasService';

const ESTADO_COLORS = {
  pendiente: { bg: ERROR_BG, fg: ERROR, border: ERROR_BORDER, label: 'Pendiente' },
  parcial:   { bg: '#f59e0b22', fg: '#fbbf24', border: '#f59e0b44', label: 'Parcial'   },
  pagado:    { bg: SUCCESS_BG, fg: SUCCESS_LIGHT, border: SUCCESS_BORDER, label: 'Pagado'    },
};

const COLUMNS = [
  {
    key: 'proveedor', header: 'Proveedor / Fecha', flex: true,
    render: (d) => (
      <Box>
        <Typography sx={{ color: INK, fontSize: 14, fontWeight: 600 }}>{d.proveedor}</Typography>
        <Typography sx={{ color: MUTED, fontSize: 12 }}>{fmtDate(d.fecha)}</Typography>
      </Box>
    ),
  },
  { key: 'total',  header: 'Total',  flex: true, render: (d) => <Typography sx={{ color: INK,     fontSize: 14, fontWeight: 600 }}>{fmtMoney(d.total)}</Typography>  },
  { key: 'pagado', header: 'Pagado', flex: true, render: (d) => <Typography sx={{ color: SUCCESS, fontSize: 14 }}>{fmtMoney(d.pagado)}</Typography> },
  { key: 'saldo',  header: 'Saldo',  flex: true, render: (d) => <Typography sx={{ color: ERROR,   fontSize: 14, fontWeight: 700 }}>{fmtMoney(d.saldo)}</Typography>  },
  {
    key: 'estado_deuda', header: 'Estado', flex: true,
    render: (d) => {
      const ec = ESTADO_COLORS[d.estado_deuda] || ESTADO_COLORS.pendiente;
      return <Chip label={ec.label} size="small" sx={{ bgcolor: ec.bg, color: ec.fg, fontWeight: 600, fontSize: 12, borderRadius: '6px', border: `1px solid ${ec.border}`, width: 'fit-content' }} />;
    },
  },
];

/* ── Página principal ── */
export default function Deudas() {
  const [deudas,     setDeudas]     = useState([]);
  const [totalDeuda, setTotalDeuda] = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [deudaPagar, setDeudaPagar] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const { deudas: d, totalDeuda: t } = await deudasService.getAll();
      setDeudas(d);
      setTotalDeuda(t);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const filtradas = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? deudas.filter(d => d.proveedor.toLowerCase().includes(q)) : deudas;
  }, [deudas, search]);

  const handlePagado = (actualizada) => {
    setDeudas(prev => actualizada.estado_deuda === 'pagado'
      ? prev.filter(d => d.id !== actualizada.id)
      : prev.map(d => d.id === actualizada.id ? actualizada : d)
    );
  };

  const expandDeuda = (d) => {
    const pct = d.total > 0 ? Math.round((d.pagado / d.total) * 100) : 0;
    return (
      <Box sx={{ bgcolor: HOVER, px: 3, py: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Box sx={{ flex: 1, height: 6, bgcolor: BORDER, borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ height: '100%', width: `${pct}%`, bgcolor: pct === 100 ? SUCCESS : P, borderRadius: 3, transition: 'width 0.3s' }} />
          </Box>
          <Typography sx={{ color: MUTED, fontSize: 12, flexShrink: 0 }}>{pct}% pagado</Typography>
        </Box>
        {d.pagos.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ color: MUTED, fontSize: 12, fontWeight: 600, mb: 1, letterSpacing: '0.04em' }}>PAGOS REALIZADOS</Typography>
            {d.pagos.map(p => (
              <Box key={p.id} sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 1, py: 0.75, borderBottom: `1px solid ${BORDER}` }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ color: INK2, fontSize: 13 }}>{fmtDate(p.fecha)} — {p.metodo_pago}</Typography>
                  {p.nota && <Typography sx={{ color: MUTED, fontSize: 12 }}>{p.nota}</Typography>}
                </Box>
                <Typography sx={{ color: SUCCESS, fontSize: 14, fontWeight: 700, flexShrink: 0 }}>{fmtMoney(p.monto)}</Typography>
              </Box>
            ))}
          </Box>
        )}
        {d.estado_deuda !== 'pagado' && (
          <Button variant="contained" startIcon={<PaymentIcon />} size="small"
            onClick={() => setDeudaPagar(d)}
            sx={{ bgcolor: P, textTransform: 'none', fontWeight: 600, borderRadius: '8px', '&:hover': { bgcolor: P_HOVER } }}>
            Registrar pago
          </Button>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ width: '100%', height: '100%', overflowY: 'auto', overflowX: 'hidden', bgcolor: BG, p: { xs: 2, md: 3 } }}>

      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1.5 }}>
        <Box>
          <Typography sx={{ color: INK, fontWeight: 700, fontSize: { xs: 22, md: 28 }, letterSpacing: '-0.02em', lineHeight: 1.2 }}>Deudas a Proveedores</Typography>
          <Typography sx={{ color: MUTED, fontSize: 14, mt: 0.25 }}>{deudas.length} compras en cuenta corriente</Typography>
        </Box>
        {totalDeuda > 0 && (
          <Box sx={{ bgcolor: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '10px', px: 2.5, py: 1.5, textAlign: 'right' }}>
            <Typography sx={{ color: MUTED, fontSize: 12, fontWeight: 600 }}>DEUDA TOTAL</Typography>
            <Typography sx={{ color: ERROR, fontWeight: 800, fontSize: 22 }}>{fmtMoney(totalDeuda)}</Typography>
          </Box>
        )}
      </Box>

      <TextField fullWidth placeholder="Buscar por proveedor..."
        value={search} onChange={e => setSearch(e.target.value)}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: MUTED }} /></InputAdornment> }}
        sx={{
          mb: 2.5,
          '& .MuiOutlinedInput-root': { bgcolor: INPUT, color: INK, fontSize: 14, borderRadius: '10px', '& fieldset': { borderColor: BORDER }, '&:hover fieldset': { borderColor: 'var(--border-hover)' }, '&.Mui-focused fieldset': { borderColor: P, borderWidth: 1 } },
          '& .MuiInputBase-input': { py: '13px', px: '14px' },
          '& .MuiInputBase-input::placeholder': { color: MUTED, opacity: 1 },
        }}
      />

      <Box sx={{ bgcolor: CARD, border: `1px solid ${BORDER}`, borderRadius: '12px', overflow: 'hidden' }}>
        <Box sx={{ px: 3, py: 2.5, borderBottom: `1px solid ${BORDER}` }}>
          <Typography sx={{ color: INK, fontWeight: 700, fontSize: 16 }}>Compras pendientes de pago</Typography>
          <Typography sx={{ color: MUTED, fontSize: 13, mt: 0.25 }}>{filtradas.length} compras con deuda</Typography>
        </Box>

        {!loading && filtradas.length === 0 ? (
          <Box sx={{ py: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
            <WarningAmberIcon sx={{ fontSize: 48, color: MUTED }} />
            <Typography sx={{ color: INK, fontWeight: 700, fontSize: 16 }}>Sin deudas pendientes</Typography>
            <Typography sx={{ color: MUTED, fontSize: 14 }}>Todas las compras están saldadas.</Typography>
          </Box>
        ) : (
          <DataTable
            columns={COLUMNS}
            rows={filtradas}
            loading={loading}
            expand={expandDeuda}
            actions={{
              extra: (d) => d.estado_deuda !== 'pagado' ? (
                <Tooltip title="Registrar pago">
                  <IconButton size="small" onClick={() => setDeudaPagar(d)}
                    sx={{ color: P, '&:hover': { color: P, bgcolor: `${P}18` }, borderRadius: '6px' }}>
                    <PaymentIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              ) : null,
            }}
            emptyMessage="Sin deudas"
            mobileCard={(d) => {
              const ec = ESTADO_COLORS[d.estado_deuda] || ESTADO_COLORS.pendiente;
              return (
                <Box sx={{ bgcolor: HOVER, border: `1px solid ${BORDER}`, borderRadius: '10px', p: 2 }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 1, mb: 0.75 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ color: INK, fontWeight: 600, fontSize: 14 }}>{d.proveedor}</Typography>
                      <Typography sx={{ color: MUTED, fontSize: 12 }}>{fmtDate(d.fecha)}</Typography>
                    </Box>
                    <Chip label={ec.label} size="small" sx={{ bgcolor: ec.bg, color: ec.fg, fontWeight: 600, fontSize: 12, borderRadius: '6px', border: `1px solid ${ec.border}`, flexShrink: 0 }} />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                    <Box><Typography sx={{ color: MUTED, fontSize: 11 }}>Total</Typography><Typography sx={{ color: INK, fontWeight: 600, fontSize: 13 }}>{fmtMoney(d.total)}</Typography></Box>
                    <Box><Typography sx={{ color: MUTED, fontSize: 11 }}>Pagado</Typography><Typography sx={{ color: SUCCESS, fontWeight: 600, fontSize: 13 }}>{fmtMoney(d.pagado)}</Typography></Box>
                    <Box><Typography sx={{ color: MUTED, fontSize: 11 }}>Saldo</Typography><Typography sx={{ color: ERROR, fontWeight: 700, fontSize: 14 }}>{fmtMoney(d.saldo)}</Typography></Box>
                  </Box>
                  {d.estado_deuda !== 'pagado' && (
                    <Button size="small" variant="outlined" onClick={() => setDeudaPagar(d)}
                      sx={{ color: P, borderColor: P, textTransform: 'none', fontSize: 12, borderRadius: '7px', '&:hover': { bgcolor: P + '15' } }}>
                      Registrar pago
                    </Button>
                  )}
                </Box>
              );
            }}
          />
        )}
      </Box>

      <PaymentModal
        open={!!deudaPagar} onClose={() => setDeudaPagar(null)}
        deuda={deudaPagar}
        type="pago"
        title="Registrar Pago"
        subtitle={deudaPagar?.proveedor}
        serviceFn={(id, payload) => deudasService.pagar(id, payload)}
        onSuccess={handlePagado}
        confirmLabel="Registrar Pago"
      />
    </Box>
  );
}
