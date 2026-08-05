import { useState, memo } from 'react';
import {
  Box, Typography, TextField, Button, IconButton,
  Dialog, DialogContent, InputAdornment,
} from '@mui/material';
import CloseIcon        from '@mui/icons-material/Close';
import PaymentsIcon     from '@mui/icons-material/Payments';
import LocalAtmIcon     from '@mui/icons-material/LocalAtm';
import CreditCardIcon   from '@mui/icons-material/CreditCard';
import PhoneIphoneIcon  from '@mui/icons-material/PhoneIphone';
import QrCodeIcon        from '@mui/icons-material/QrCode';
import EventIcon        from '@mui/icons-material/Event';
import NotesIcon        from '@mui/icons-material/Notes';
import AttachMoneyIcon  from '@mui/icons-material/AttachMoney';
import {
  BORDER, INK, INK2, MUTED, P,
  INPUT, HOVER, CARD,
  SUCCESS, SUCCESS_BG, SUCCESS_BORDER,
  ERROR, ERROR_BG,
  WARNING, modalPaperSx,
} from '../../theme/tokens';
import { useToast } from '../../context/ToastContext';
import { fmtMoney, toLocalDateStr } from '../../utils/format';

const PAYMENT_OPTIONS = [
  { key: 'efectivo',      label: 'Efectivo',      Icon: LocalAtmIcon,    note: 'Suma al arqueo',       color: SUCCESS,   bg: SUCCESS_BG  },
  { key: 'transferencia', label: 'Transferencia', Icon: PhoneIphoneIcon, note: 'No afecta caja',        color: P,         bg: `${P}14`   },
  { key: 'tarjeta',       label: 'Tarjeta',       Icon: CreditCardIcon,  note: 'No afecta caja',        color: WARNING,   bg: `${WARNING}14` },
  { key: 'qr',            label: 'QR / Billetera',Icon: QrCodeIcon,      note: 'No afecta caja',        color: '#a78bfa', bg: '#a78bfa18'    },
];

const labelSx = { color: MUTED, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.75 };

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    bgcolor: INPUT, color: INK, fontSize: 14, borderRadius: '10px',
    '& fieldset': { borderColor: BORDER },
    '&:hover fieldset': { borderColor: 'var(--border-hover)' },
    '&.Mui-focused fieldset': { borderColor: P, borderWidth: 1.5 },
  },
  '& .MuiInputBase-input': { py: '13px', px: '16px' },
  '& .MuiInputBase-input::placeholder': { color: MUTED, opacity: 1 },
};

const PaymentModal = memo(function PaymentModal({
  open, onClose,
  deuda,
  type = 'pago',
  title = 'Registrar Pago',
  subtitle = '',
  summaryLabels = { total: 'Total', paid: 'Pagado', pending: 'Saldo' },
  serviceFn,
  onSuccess,
  confirmLabel = 'Registrar Pago',
  confirmColor = P,
}) {
  const toast = useToast();
  const empty = { monto: '', fecha: toLocalDateStr(), metodo_pago: 'efectivo', nota: '' };
  const [form,   setForm]   = useState(empty);
  const [saving, setSaving] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.monto || Number(form.monto) <= 0) return;
    if (!serviceFn) { toast('Error: servicio no configurado', 'error'); return; }
    setSaving(true);
    try {
      const actualizada = await serviceFn(deuda.id, {
        monto:       Number(form.monto),
        fecha:       form.fecha,
        metodo_pago: form.metodo_pago,
        nota:        form.nota,
      });
      onSuccess?.(actualizada);
      toast(type === 'cobro' ? 'Cobro registrado correctamente' : 'Pago registrado correctamente', 'success');
      setForm(empty);
      onClose();
    } catch (e) {
      toast(e.response?.data?.message || `Error al registrar el ${type}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!deuda) return null;

  const saldo = Number(deuda.saldo) || 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { ...modalPaperSx, borderRadius: '16px', overflow: 'hidden' } }}>

      {/* ── Header ── */}
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: { xs: 1.5, sm: 4 }, pt: { xs: 1.75, sm: 3.5 }, pb: { xs: 1.5, sm: 2.5 },
        bgcolor: CARD,
        borderBottom: `1px solid ${BORDER}`,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75 }}>
          <Box sx={{
            width: 40, height: 40, borderRadius: '12px',
            bgcolor: type === 'cobro' ? `${SUCCESS}20` : `${confirmColor}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <PaymentsIcon sx={{ color: type === 'cobro' ? SUCCESS : confirmColor, fontSize: 20 }} />
          </Box>
          <Box>
            <Typography sx={{ color: INK, fontWeight: 700, fontSize: 17 }}>{title}</Typography>
            {subtitle && <Typography sx={{ color: MUTED, fontSize: 13, mt: 0.25 }}>{subtitle}</Typography>}
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose}
          sx={{ color: MUTED, bgcolor: HOVER, borderRadius: '8px', '&:hover': { color: INK, bgcolor: `${MUTED}20` } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent sx={{ px: { xs: 1.5, sm: 4 }, pt: { xs: 1.5, sm: 3 }, pb: { xs: 1.75, sm: 4 } }}>

        {/* ── Resumen deuda: cards individuales ── */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 1.5, mb: 3.5 }}>
          {[
            { label: summaryLabels.total,   value: fmtMoney(deuda.total),                          color: INK,              bg: CARD,          border: BORDER     },
            { label: summaryLabels.paid,    value: fmtMoney(deuda.pagado ?? deuda.cobrado ?? 0),    color: SUCCESS,          bg: SUCCESS_BG,    border: SUCCESS_BORDER },
            { label: summaryLabels.pending, value: fmtMoney(saldo),                                 color: saldo > 0 ? ERROR : SUCCESS, bg: saldo > 0 ? ERROR_BG : SUCCESS_BG, border: saldo > 0 ? '#fca5a520' : SUCCESS_BORDER },
          ].map(({ label, value, color, bg, border }) => (
            <Box key={label} sx={{
              textAlign: 'center', p: 2, borderRadius: '12px',
              bgcolor: bg, border: `1px solid ${border}`,
            }}>
              <Typography sx={{ color: MUTED, fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.5 }}>
                {label}
              </Typography>
              <Typography sx={{ color, fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em' }}>
                {value}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* ── Monto ── */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography sx={labelSx}>
              Monto a {type === 'cobro' ? 'cobrar' : 'pagar'}
            </Typography>
            {saldo > 0 && (
              <Button size="small" variant="text"
                onClick={() => setForm(f => ({ ...f, monto: saldo }))}
                sx={{
                  color: SUCCESS, textTransform: 'none', fontWeight: 700, fontSize: 12, px: 1.5, py: 0.5,
                  borderRadius: '6px', bgcolor: SUCCESS_BG, border: `1px solid ${SUCCESS_BORDER}`,
                  '&:hover': { bgcolor: SUCCESS_BG, filter: 'brightness(0.95)' },
                }}>
                Pagar todo ({fmtMoney(saldo)})
              </Button>
            )}
          </Box>
          <TextField fullWidth type="number" placeholder={`0.00`}
            value={form.monto} onChange={set('monto')} inputProps={{ min: 0.01, max: saldo }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AttachMoneyIcon sx={{ color: MUTED, fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
            sx={fieldSx} />
          {form.monto && Number(form.monto) > saldo && (
            <Typography sx={{ color: ERROR, fontSize: 12, mt: 0.75, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              El monto supera el saldo pendiente ({fmtMoney(saldo)})
            </Typography>
          )}
        </Box>

        {/* ── Fecha + Método ── */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1.2fr 2fr' }, gap: 3, mb: 3 }}>
          <Box>
            <Typography sx={labelSx}>Fecha</Typography>
            <TextField fullWidth type="date" value={form.fecha} onChange={set('fecha')}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EventIcon sx={{ color: MUTED, fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
              sx={fieldSx} />
          </Box>
          <Box>
            <Typography sx={labelSx}>Metodo de pago</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 1 }}>
              {PAYMENT_OPTIONS.map(({ key, label, Icon, note, color, bg }) => {
                const active = form.metodo_pago === key;
                return (
                  <Box key={key} onClick={() => setForm(f => ({ ...f, metodo_pago: key }))}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 1.25,
                      p: '11px 13px', borderRadius: '10px', cursor: 'pointer',
                      border: `2px solid ${active ? color : BORDER}`,
                      bgcolor: active ? bg : 'transparent',
                      transition: 'all 0.2s',
                      '&:hover': { borderColor: color, bgcolor: active ? bg : `${color}08` },
                    }}>
                    <Box sx={{
                      width: 34, height: 34, borderRadius: '8px',
                      bgcolor: active ? `${color}25` : `${color}10`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Icon sx={{ fontSize: 18, color: active ? color : MUTED }} />
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ color: active ? INK : INK2, fontWeight: 600, fontSize: 13, lineHeight: 1.2 }}>{label}</Typography>
                      <Typography sx={{ color: MUTED, fontSize: 10.5, whiteSpace: 'nowrap' }}>{note}</Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>

        {/* ── Nota ── */}
        <Box sx={{ mb: 4 }}>
          <Typography sx={labelSx}>Nota (opcional)</Typography>
          <TextField fullWidth placeholder={type === 'cobro' ? 'Ej: Abono semana 1' : 'Ej: Pago cuota 1/3'}
            value={form.nota} onChange={set('nota')}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <NotesIcon sx={{ color: MUTED, fontSize: 18 }} />
                </InputAdornment>
              ),
            }}
            sx={fieldSx} />
        </Box>

        {/* ── Actions ── */}
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button fullWidth onClick={onClose}
            sx={{
              color: INK2, textTransform: 'none', fontWeight: 600, fontSize: 14, py: 1.5,
              borderRadius: '12px', border: `1.5px solid ${BORDER}`,
              '&:hover': { bgcolor: HOVER, borderColor: 'var(--border-hover)' },
            }}>
            Cancelar
          </Button>
          <Button fullWidth variant="contained" onClick={handleSubmit}
            disabled={saving || !form.monto || Number(form.monto) > saldo || Number(form.monto) <= 0}
            sx={{
              bgcolor: confirmColor, textTransform: 'none', fontWeight: 700, fontSize: 14, py: 1.5,
              borderRadius: '12px', boxShadow: 'none',
              '&:hover': { bgcolor: confirmColor, filter: 'brightness(0.92)', boxShadow: 'none' },
              '&.Mui-disabled': { bgcolor: confirmColor, opacity: 0.35, color: '#fff' },
            }}>
            {saving ? 'Guardando...' : confirmLabel}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
});

export default PaymentModal;
