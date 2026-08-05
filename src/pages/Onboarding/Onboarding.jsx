import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, TextField, Tooltip, IconButton } from '@mui/material';
import { keyframes } from '@mui/system';
import CheckIcon                 from '@mui/icons-material/Check';
import ArrowForwardIcon          from '@mui/icons-material/ArrowForward';
import WbSunnyOutlinedIcon       from '@mui/icons-material/WbSunnyOutlined';
import DarkModeOutlinedIcon      from '@mui/icons-material/DarkModeOutlined';
import StorefrontIcon            from '@mui/icons-material/Storefront';
import ShoppingBasketIcon        from '@mui/icons-material/ShoppingBasket';
import CheckroomIcon             from '@mui/icons-material/Checkroom';
import BuildIcon                 from '@mui/icons-material/Build';
import RestaurantIcon            from '@mui/icons-material/Restaurant';
import LocalPharmacyIcon         from '@mui/icons-material/LocalPharmacy';
import LaptopIcon                from '@mui/icons-material/Laptop';
import PetsIcon                  from '@mui/icons-material/Pets';
import SpaIcon                   from '@mui/icons-material/Spa';
import DiamondIcon               from '@mui/icons-material/Diamond';
import MiscellaneousServicesIcon from '@mui/icons-material/MiscellaneousServices';
import MoreHorizIcon             from '@mui/icons-material/MoreHoriz';
import { APP_NAME, PRIMARY_COLOR, PRIMARY_HOVER } from '../../config/brand';
import { BG, CARD, BORDER, INK, INK2, MUTED, INPUT, HOVER } from '../../theme/tokens';
import { useAppTheme } from '../../theme/useAppTheme';
import useLogo from '../../hooks/useLogo';

/* Autofill fix con hex reales según modo */
const getAutofillFix = (mode) => {
  // Slate/Navy dark mode
  const bg   = mode === 'dark' ? '#1e293b' : '#f8fafc';
  const text = mode === 'dark' ? '#f1f5f9' : '#0f172a';
  // Original dark mode — comentado: bg '#201f1f' / text '#f0edec'
  return `
    input:-webkit-autofill,
    input:-webkit-autofill:hover,
    input:-webkit-autofill:focus {
      -webkit-box-shadow: 0 0 0 1000px ${bg} inset !important;
      -webkit-text-fill-color: ${text} !important;
      caret-color: ${text};
      transition: background-color 9999s ease-in-out 0s;
    }
  `;
};

const getDotPattern = (mode) =>
  mode === 'dark'
    ? 'radial-gradient(circle, #ffffff0a 1px, transparent 1px)'
    : 'radial-gradient(circle, #c8cce830 1px, transparent 1px)';

const fadeUp = keyframes`from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}`;
const fadeIn = keyframes`from{opacity:0}to{opacity:1}`;

/* ── Pasos del wizard ── */
const STEPS = [
  { id: 1, label: 'Tu nombre',          hint: 'Personaliza tu cuenta' },
  { id: 2, label: 'Tu negocio',         hint: 'Nombre para tickets y reportes' },
  { id: 3, label: 'Tipo de comercio',   hint: 'Configuramos para tu rubro' },
  { id: 4, label: 'Sistema actual',     hint: '¿Venís de otra solución?' },
  { id: 5, label: 'Facturación',        hint: 'ARCA / ex AFIP' },
];

const TIPOS = [
  { id: 'almacen',   label: 'Almacén',       Icon: ShoppingBasketIcon, disponible: true },
  { id: 'kiosco',    label: 'Kiosco',         Icon: StorefrontIcon,     disponible: true },
  { id: 'indument',  label: 'Indumentaria',   Icon: CheckroomIcon,      disponible: true },
  { id: 'ferret',    label: 'Ferretería',     Icon: BuildIcon,          disponible: true },
  { id: 'gastro',    label: 'Gastronomía',    Icon: RestaurantIcon     },
  { id: 'farmacia',  label: 'Farmacia',       Icon: LocalPharmacyIcon  },
  { id: 'electro',   label: 'Electrónica',    Icon: LaptopIcon         },
  { id: 'petshop',   label: 'Petshop',        Icon: PetsIcon           },
  { id: 'belleza',   label: 'Belleza',        Icon: SpaIcon            },
  { id: 'acces',     label: 'Accesorios',     Icon: DiamondIcon        },
  { id: 'servicios', label: 'Servicios',      Icon: MiscellaneousServicesIcon },
  { id: 'otro',      label: 'Otro',           Icon: MoreHorizIcon      },
];

/* Estilos del input grande (usa CSS vars del tema) */
const bigInputSx = {
  mb: 4,
  '& .MuiOutlinedInput-root': {
    bgcolor: INPUT,
    borderRadius: '12px',
    '& fieldset': { borderColor: BORDER },
    '&:hover fieldset': { borderColor: 'var(--border-hover)' },
    '&.Mui-focused fieldset': { borderColor: PRIMARY_COLOR, borderWidth: '1.5px' },
  },
  '& .MuiInputBase-input': {
    color: INK,
    fontSize: { xs: 20, sm: 26 },
    fontWeight: 600,
    py: '16px',
    px: '18px',
    '&::placeholder': { color: MUTED, opacity: 1 },
  },
};

/* ── Sidebar: ítem de paso ── */
function SidebarStep({ step, current }) {
  const done   = step.id < current;
  const active = step.id === current;
  return (
    <Box sx={{
      display: 'flex', alignItems: 'flex-start', gap: 1.5, py: 1.25, px: 1.25,
      borderRadius: '10px',
      bgcolor: active ? `${PRIMARY_COLOR}12` : 'transparent',
      transition: 'background 0.25s',
    }}>
      <Box sx={{
        width: 28, height: 28, borderRadius: '50%', flexShrink: 0, mt: '1px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        bgcolor:    done ? PRIMARY_COLOR : active ? PRIMARY_COLOR : 'transparent',
        border:     `2px solid ${done ? PRIMARY_COLOR : active ? PRIMARY_COLOR : 'var(--border-hover)'}`,
        transition: 'all 0.25s',
      }}>
        {done
          ? <CheckIcon sx={{ color: '#fff', fontSize: 14 }} />
          : <Typography sx={{ color: active ? '#fff' : MUTED, fontSize: 12, fontWeight: 700, lineHeight: 1 }}>{step.id}</Typography>
        }
      </Box>
      <Box>
        <Typography sx={{
          color:      active ? INK : done ? INK2 : MUTED,
          fontWeight: active ? 700 : 500,
          fontSize:   13.5, lineHeight: 1.3, transition: 'color 0.25s',
        }}>
          {step.label}
        </Typography>
        {active && (
          <Typography sx={{ color: MUTED, fontSize: 11.5, mt: 0.3, animation: `${fadeIn} 0.2s ease` }}>
            {step.hint}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

function StepBadge({ n }) {
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', bgcolor: `${PRIMARY_COLOR}14`, border: `1px solid ${PRIMARY_COLOR}28`, borderRadius: '20px', px: 1.5, py: '4px', mb: 2.5 }}>
      <Typography sx={{ color: PRIMARY_COLOR, fontSize: 12, fontWeight: 700 }}>Paso {n} de 5</Typography>
    </Box>
  );
}

function StepTitle({ children }) {
  return (
    <Typography sx={{ color: INK, fontWeight: 900, fontSize: { xs: 28, sm: 34, md: 38 }, letterSpacing: '-0.03em', lineHeight: 1.1, mb: 1 }}>
      {children}
    </Typography>
  );
}

function StepSub({ children }) {
  return (
    <Typography sx={{ color: MUTED, fontSize: { xs: 14, sm: 15 }, lineHeight: 1.65, mb: 3.5 }}>
      {children}
    </Typography>
  );
}

function NavRow({ onBack, onNext, disabled, nextLabel = 'Continuar', isFirst = false }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
      {!isFirst && (
        <Button onClick={onBack}
          sx={{ color: INK2, textTransform: 'none', fontWeight: 600, fontSize: 14,
            borderRadius: '10px', border: `1px solid ${BORDER}`, px: 2.5, py: '9px',
            '&:hover': { bgcolor: HOVER, borderColor: 'var(--border-hover)' } }}>
          ← Atrás
        </Button>
      )}
      <Button onClick={onNext} disabled={disabled}
        endIcon={<ArrowForwardIcon sx={{ fontSize: 17 }} />}
        sx={{ bgcolor: PRIMARY_COLOR, color: '#fff', textTransform: 'none', fontWeight: 700,
          fontSize: 15, px: 3, py: '10px', borderRadius: '10px',
          boxShadow: `0 2px 14px ${PRIMARY_COLOR}35`,
          '&:hover': { bgcolor: PRIMARY_HOVER, boxShadow: `0 4px 22px ${PRIMARY_COLOR}50` },
          '&.Mui-disabled': { bgcolor: PRIMARY_COLOR, opacity: 0.38, color: '#fff', boxShadow: 'none' } }}>
        {nextLabel}
      </Button>
    </Box>
  );
}

function ChoiceCard({ label, sub, selected, onClick }) {
  return (
    <Box onClick={onClick} sx={{
      flex: 1, p: { xs: 2, sm: 2.5 },
      bgcolor:      selected ? `${PRIMARY_COLOR}12` : CARD,
      border:       `1.5px solid ${selected ? PRIMARY_COLOR : BORDER}`,
      borderRadius: '14px',
      cursor: 'pointer', transition: 'all 0.18s',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2,
      '&:hover': { borderColor: PRIMARY_COLOR, bgcolor: `${PRIMARY_COLOR}08` },
    }}>
      <Box>
        <Typography sx={{ color: INK, fontWeight: 700, fontSize: { xs: 15, sm: 16 } }}>{label}</Typography>
        {sub && <Typography sx={{ color: MUTED, fontSize: 13, mt: 0.25 }}>{sub}</Typography>}
      </Box>
      <Box sx={{
        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
        border: `2px solid ${selected ? PRIMARY_COLOR : BORDER}`,
        bgcolor: selected ? PRIMARY_COLOR : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.18s',
      }}>
        {selected && <CheckIcon sx={{ color: '#fff', fontSize: 13 }} />}
      </Box>
    </Box>
  );
}

/* ── Botón de toggle tema ── */
function ThemeToggle({ mode, toggle }) {
  return (
    <Tooltip title={mode === 'dark' ? 'Modo claro' : 'Modo oscuro'}>
      <IconButton onClick={toggle} size="small"
        sx={{ color: MUTED, bgcolor: HOVER, borderRadius: '8px', p: '7px',
          '&:hover': { color: INK, bgcolor: BORDER } }}>
        {mode === 'dark'
          ? <WbSunnyOutlinedIcon sx={{ fontSize: 18 }} />
          : <DarkModeOutlinedIcon sx={{ fontSize: 18 }} />
        }
      </IconButton>
    </Tooltip>
  );
}

/* ══════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════ */
export default function Onboarding() {
  const navigate         = useNavigate();
  const { mode, toggle } = useAppTheme();
  const logoSrc = useLogo();
  const [step, setStep]  = useState(0);
  const [data, setData]  = useState({ nombre: '', negocio: '', tipo: '', pos: null, arca: null });
  const inputRef = useRef(null);

  useEffect(() => {
    if (step >= 1 && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [step]);

  const next     = ()           => setStep(s => s + 1);
  const back     = ()           => setStep(s => Math.max(0, s - 1));
  const autoNext = (field, val) => { setData(d => ({ ...d, [field]: val })); setTimeout(next, 220); };
  const finish   = ()           => navigate('/signin', { state: { onboarding: data, view: 'register' } });

  return (
    <>
      <style>{getAutofillFix(mode)}</style>
      <Box sx={{
        position: 'fixed', inset: 0,
        bgcolor: BG,
        display: 'flex',
        fontFamily: "'Geist', ui-sans-serif, system-ui, sans-serif",
        backgroundImage: getDotPattern(mode),
        backgroundSize: '28px 28px',
      }}>

        {/* ══ SIDEBAR — solo desktop, solo pasos 1+ ══ */}
        {step > 0 && (
          <Box sx={{
            width: 260, flexShrink: 0,
            bgcolor: HOVER,
            borderRight: `1px solid ${BORDER}`,
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            p: '28px 20px',
            animation: `${fadeIn} 0.35s ease`,
          }}>
            {/* Logo + toggle */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 5 }}>
              <Box component="img" src={logoSrc} alt={APP_NAME}
                sx={{ height: 46, width: 'auto', display: 'block' }} />
              <ThemeToggle mode={mode} toggle={toggle} />
            </Box>

            {/* Lista de pasos */}
            <Box sx={{ mb: 1.5, px: 1.25 }}>
              <Typography sx={{ color: MUTED, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase' }}>
                Configuración
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              {STEPS.map(s => <SidebarStep key={s.id} step={s} current={step} />)}
            </Box>

            <Button onClick={() => navigate('/signin')}
              sx={{ color: MUTED, textTransform: 'none', fontSize: 13, fontWeight: 500,
                justifyContent: 'flex-start', borderRadius: '8px', px: 1,
                '&:hover': { color: INK2, bgcolor: 'transparent' } }}>
              Ya tengo cuenta →
            </Button>
            <Button onClick={() => navigate('/')}
              sx={{ color: MUTED, textTransform: 'none', fontSize: 13, fontWeight: 500,
                justifyContent: 'flex-start', borderRadius: '8px', px: 1,
                '&:hover': { color: INK2, bgcolor: 'transparent' } }}>
              ← Volver al panel
            </Button>
          </Box>
        )}

        {/* ══ ÁREA PRINCIPAL ══ */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

          {/* Header mobile (pasos 1+) */}
          {step > 0 && (
            <Box sx={{
              display: { xs: 'flex', md: 'none' },
              alignItems: 'center', justifyContent: 'space-between',
              px: 3, py: 2,
              borderBottom: `1px solid ${BORDER}`,
              bgcolor: CARD,
            }}>
              <Box component="img" src={logoSrc} alt={APP_NAME}
                sx={{ height: 38, width: 'auto', display: 'block' }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ThemeToggle mode={mode} toggle={toggle} />
                <Typography sx={{ color: MUTED, fontSize: 13, fontWeight: 600 }}>
                  <Box component="span" sx={{ color: PRIMARY_COLOR }}>{step}</Box>/5
                </Typography>
              </Box>
            </Box>
          )}

          {/* Barra de progreso mobile */}
          {step > 0 && (
            <Box sx={{ display: { xs: 'flex', md: 'none' }, gap: '6px', px: 3, pt: 2.5, pb: 0.5 }}>
              {STEPS.map(s => (
                <Box key={s.id} sx={{ height: 3, flex: 1, borderRadius: 2, bgcolor: s.id <= step ? PRIMARY_COLOR : BORDER, transition: 'background 0.35s' }} />
              ))}
            </Box>
          )}

          {/* Contenido centrado */}
          <Box sx={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            px: { xs: 3, sm: 5, md: step === 3 ? 6 : 8 },
            py: { xs: 4, sm: 6 },
          }}>
            <Box sx={{ width: '100%', maxWidth: step === 3 ? 620 : 580 }}>

              {/* ─── PASO 0: Bienvenida ─── */}
              {step === 0 && (
                <Box key="welcome" sx={{ animation: `${fadeUp} 0.4s cubic-bezier(0.16,1,0.3,1)` }}>

                  {/* Top bar del paso 0 */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
                    <Box component="img" src={logoSrc} alt={APP_NAME}
                      sx={{ height: 52, width: 'auto', display: 'block' }} />
                    <ThemeToggle mode={mode} toggle={toggle} />
                  </Box>

                  <Typography sx={{ color: PRIMARY_COLOR, fontWeight: 700, fontSize: 13, mb: 2, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Configuración inicial
                  </Typography>
                  <Typography sx={{ color: INK, fontWeight: 900, fontSize: { xs: 32, sm: 44, md: 52 }, letterSpacing: '-0.035em', lineHeight: 1.05, mb: 1.5 }}>
                    Activemos tu<br />negocio en minutos
                  </Typography>
                  <Typography sx={{ color: MUTED, fontSize: { xs: 15, sm: 17 }, lineHeight: 1.7, mb: 5, maxWidth: 460 }}>
                    Te hacemos unas preguntas rápidas para configurar todo a tu medida. Tardás menos de 2 minutos.
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 5, maxWidth: 340 }}>
                    {STEPS.map(s => (
                      <Box key={s.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: 22, height: 22, borderRadius: '50%', bgcolor: `${PRIMARY_COLOR}15`, border: `1.5px solid ${PRIMARY_COLOR}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Typography sx={{ color: PRIMARY_COLOR, fontSize: 11, fontWeight: 800 }}>{s.id}</Typography>
                        </Box>
                        <Typography sx={{ color: INK2, fontSize: 13.5 }}>{s.label}</Typography>
                      </Box>
                    ))}
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                    <Button onClick={next} variant="contained"
                      endIcon={<ArrowForwardIcon sx={{ fontSize: 18 }} />}
                      sx={{ bgcolor: PRIMARY_COLOR, color: '#fff', textTransform: 'none', fontWeight: 700,
                        fontSize: 16, px: 4, py: 1.5, borderRadius: '12px',
                        boxShadow: `0 4px 24px ${PRIMARY_COLOR}40`,
                        '&:hover': { bgcolor: PRIMARY_HOVER, boxShadow: `0 6px 32px ${PRIMARY_COLOR}55` } }}>
                      Empezar configuración
                    </Button>
                    <Button onClick={() => navigate('/signin')}
                      sx={{ color: MUTED, textTransform: 'none', fontWeight: 500, fontSize: 14,
                        '&:hover': { color: INK2, bgcolor: 'transparent' } }}>
                      Ya tengo cuenta →
                    </Button>
                    <Button onClick={() => navigate('/')}
                      sx={{ color: MUTED, textTransform: 'none', fontWeight: 500, fontSize: 14,
                        '&:hover': { color: INK2, bgcolor: 'transparent' } }}>
                      ← Volver al panel
                    </Button>
                  </Box>
                  <Typography sx={{ color: MUTED, fontSize: 12.5, mt: 2.5 }}>
                    Sin tarjeta de crédito · 7 días de prueba gratis
                  </Typography>
                </Box>
              )}

              {/* ─── PASO 1: Tu nombre ─── */}
              {step === 1 && (
                <Box key="step1" sx={{ animation: `${fadeUp} 0.35s cubic-bezier(0.16,1,0.3,1)` }}>
                  <StepBadge n={1} />
                  <StepTitle>¿Cómo te llamás?</StepTitle>
                  <StepSub>Lo usamos para personalizar tu experiencia.</StepSub>
                  <TextField fullWidth placeholder="Tu nombre y apellido"
                    inputRef={inputRef}
                    value={data.nombre}
                    onChange={e => setData(d => ({ ...d, nombre: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter' && data.nombre.trim().length >= 2) next(); }}
                    sx={bigInputSx} />
                  <NavRow onNext={next} disabled={data.nombre.trim().length < 2} isFirst />
                </Box>
              )}

              {/* ─── PASO 2: Nombre del negocio ─── */}
              {step === 2 && (
                <Box key="step2" sx={{ animation: `${fadeUp} 0.35s cubic-bezier(0.16,1,0.3,1)` }}>
                  <StepBadge n={2} />
                  <StepTitle>¿Cómo se llama<br />tu negocio?</StepTitle>
                  <StepSub>Aparecerá en los tickets y reportes de ventas.</StepSub>
                  <TextField fullWidth placeholder="Nombre del comercio"
                    inputRef={inputRef}
                    value={data.negocio}
                    onChange={e => setData(d => ({ ...d, negocio: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter' && data.negocio.trim().length >= 2) next(); }}
                    sx={bigInputSx} />
                  <NavRow onBack={back} onNext={next} disabled={data.negocio.trim().length < 2} />
                </Box>
              )}

              {/* ─── PASO 3: Tipo de comercio ─── */}
              {step === 3 && (
                <Box key="step3" sx={{ animation: `${fadeUp} 0.35s cubic-bezier(0.16,1,0.3,1)` }}>
                  <StepBadge n={3} />
                  <StepTitle>¿Qué tipo de<br />comercio tenés?</StepTitle>
                  <StepSub>Configuramos las funciones específicas para tu rubro.</StepSub>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(3, 1fr)', sm: 'repeat(4, 1fr)' }, gap: { xs: 1.25, sm: 1.5 }, mb: 4 }}>
                    {TIPOS.map(({ id, label, Icon, disponible }) => (
                      <Box key={id} onClick={() => disponible && autoNext('tipo', id)}
                        sx={{
                          p: { xs: 1.5, sm: 2 }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75,
                          bgcolor:      data.tipo === id ? `${PRIMARY_COLOR}12` : CARD,
                          border:       `1.5px solid ${data.tipo === id ? PRIMARY_COLOR : BORDER}`,
                          borderRadius: '13px',
                          cursor:  disponible ? 'pointer' : 'not-allowed',
                          opacity: disponible ? 1 : 0.5,
                          transition: 'all 0.18s',
                          ...(disponible ? {
                            '&:hover': { borderColor: PRIMARY_COLOR, bgcolor: `${PRIMARY_COLOR}08`, transform: 'translateY(-2px)', boxShadow: `0 4px 16px ${PRIMARY_COLOR}15` },
                          } : {}),
                        }}>
                        <Icon sx={{ color: data.tipo === id ? PRIMARY_COLOR : MUTED, fontSize: { xs: 26, sm: 30 }, transition: 'color 0.18s' }} />
                        <Typography sx={{ color: data.tipo === id ? INK : INK2, fontSize: { xs: 11, sm: 12.5 }, fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>
                          {label}
                        </Typography>
                        {!disponible && (
                          <Typography sx={{
                            color: MUTED, fontSize: { xs: 7.5, sm: 8.5 }, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
                            bgcolor: HOVER, border: `1px solid ${BORDER}`, borderRadius: '5px', px: 0.6, py: '1px', lineHeight: 1.6,
                          }}>
                            Próximamente
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                  <NavRow onBack={back} onNext={next} disabled={!data.tipo} />
                </Box>
              )}

              {/* ─── PASO 4: Sistema actual ─── */}
              {step === 4 && (
                <Box key="step4" sx={{ animation: `${fadeUp} 0.35s cubic-bezier(0.16,1,0.3,1)` }}>
                  <StepBadge n={4} />
                  <StepTitle>¿Ya usás algún<br />sistema para vender?</StepTitle>
                  <StepSub>Para saber si necesitás migrar datos existentes al sistema.</StepSub>
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 4 }}>
                    <ChoiceCard label="Sí, uso algo" sub="Planillas u otro software" selected={data.pos === 'si'} onClick={() => autoNext('pos', 'si')} />
                    <ChoiceCard label="Arranco de cero" sub="Este será mi primer sistema" selected={data.pos === 'no'} onClick={() => autoNext('pos', 'no')} />
                  </Box>
                  <NavRow onBack={back} onNext={next} disabled={!data.pos} />
                </Box>
              )}

              {/* ─── PASO 5: Facturación ARCA ─── */}
              {step === 5 && (
                <Box key="step5" sx={{ animation: `${fadeUp} 0.35s cubic-bezier(0.16,1,0.3,1)` }}>
                  <StepBadge n={5} />
                  <StepTitle>¿Necesitás emitir<br />facturas electrónicas?</StepTitle>
                  <StepSub>Para ARCA (ex AFIP) — facturas A, B o C. Podés activarlo después también.</StepSub>
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 4 }}>
                    <ChoiceCard label="Sí, necesito facturar" sub="Facturas A, B o C para ARCA" selected={data.arca === 'si'} onClick={() => setData(d => ({ ...d, arca: 'si' }))} />
                    <ChoiceCard label="No por ahora" sub="Solo tickets o recibos simples" selected={data.arca === 'no'} onClick={() => setData(d => ({ ...d, arca: 'no' }))} />
                  </Box>
                  <NavRow onBack={back} onNext={finish} disabled={!data.arca} nextLabel="Crear mi cuenta gratis" />
                </Box>
              )}

            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
}
