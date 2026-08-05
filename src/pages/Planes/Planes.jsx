import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Box, Typography, Button, Chip, Switch, CircularProgress } from '@mui/material';
import { keyframes } from '@mui/system';
import ArrowBackIcon  from '@mui/icons-material/ArrowBack';
import CheckIcon      from '@mui/icons-material/Check';
import { BG, CARD, BORDER, INK, INK2, MUTED, P, HOVER } from '../../theme/tokens';
import { APP_NAME }  from '../../config/brand';
import useLogo from '../../hooks/useLogo';
import { AuthContext } from '../../auth/AuthContextBase';
import { crearPagoApi } from '../../services/suscripcionApi';
import { PLANES } from '../../config/planes';

const floatBlob = keyframes`0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-16px,20px) scale(1.06)}`;

function fmtPrecio(n) {
  return n.toLocaleString('es-AR');
}

export default function Planes() {
  const navigate = useNavigate();
  const { token, user } = useContext(AuthContext);
  const planActual = user?.empresa?.plan;
  const logoSrc = useLogo();
  const [anual, setAnual] = useState(true);
  const [loading, setLoading] = useState(null); // plan id que está cargando
  const [error, setError] = useState(null);

  const elegirPlan = async (planId) => {
    if (!token) { navigate('/signin'); return; }
    setError(null);
    setLoading(planId);
    try {
      const ciclo = anual ? 'anual' : 'mensual';
      const data  = await crearPagoApi(planId, ciclo);
      if (data.success && data.init_point) {
        // eslint-disable-next-line react-hooks/immutability -- corre solo al elegir un plan, nunca durante el render
        window.location.href = data.init_point;
      } else {
        setError('No se pudo iniciar el pago. Intentá de nuevo.');
      }
    } catch {
      setError('Error al conectar con el servidor. Intentá de nuevo.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', bgcolor: BG, position: 'relative', overflow: 'hidden' }}>

      {/* Glow de fondo — mismo lenguaje visual que Login/Landing, sutil en los dos temas */}
      <Box sx={{ position: 'absolute', top: -160, left: '20%', width: 460, height: 460, borderRadius: '50%', background: `radial-gradient(closest-side, ${P}22, transparent)`, filter: 'blur(80px)', animation: `${floatBlob} 16s ease-in-out infinite`, pointerEvents: 'none' }} />
      <Box sx={{ position: 'absolute', bottom: -180, right: '15%', width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(closest-side, #8b5cf622, transparent)', filter: 'blur(80px)', animation: `${floatBlob} 20s ease-in-out infinite 3s`, pointerEvents: 'none' }} />

      {/* Top bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: { xs: 2, md: 4 }, py: 2, borderBottom: `1px solid ${BORDER}`, bgcolor: CARD, flexShrink: 0, position: 'relative' }}>
        <Box component="img" src={logoSrc} alt={APP_NAME}
          sx={{ height: 36, width: 'auto', display: 'block' }} />
        <Button startIcon={<ArrowBackIcon sx={{ fontSize: 15 }} />} onClick={() => navigate(token ? '/dashboard' : '/')}
          sx={{ color: INK2, textTransform: 'none', fontSize: 13, fontWeight: 600, border: `1px solid ${BORDER}`, borderRadius: '8px', px: 2, py: 0.75, '&:hover': { bgcolor: HOVER, color: INK } }}>
          {token ? 'Volver al panel' : 'Volver al inicio'}
        </Button>
      </Box>

      {/* Content — centrado verticalmente */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflowY: 'auto', px: 2, py: { xs: 4, md: 6 }, position: 'relative' }}>

      {/* Header */}
      <Box component={motion.div} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        sx={{ textAlign: 'center', pb: { xs: 4, md: 6 } }}>
        <Typography sx={{ color: P, fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', mb: 1.5 }}>
          PLANES Y PRECIOS
        </Typography>
        <Typography sx={{ color: INK, fontWeight: 800, fontSize: { xs: 28, md: 42 }, letterSpacing: '-0.025em', lineHeight: 1.15, mb: 1.5 }}>
          Elegí el plan ideal para tu negocio
        </Typography>
        <Typography sx={{ color: MUTED, fontSize: 14 }}>
          Sin costos ocultos. Podés cambiar de plan en cualquier momento.
        </Typography>

        {/* Toggle Mensual / Anual */}
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5, mt: 4, px: 2.5, py: 1, bgcolor: CARD, border: `1px solid ${BORDER}`, borderRadius: '100px' }}>
          <Typography sx={{ color: anual ? MUTED : INK, fontSize: 14, fontWeight: anual ? 400 : 600, cursor: 'pointer' }} onClick={() => setAnual(false)}>
            Mensual
          </Typography>
          <Switch
            checked={anual}
            onChange={(_, v) => setAnual(v)}
            size="small"
            sx={{
              '& .MuiSwitch-switchBase.Mui-checked': { color: P },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: P },
            }}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ color: anual ? INK : MUTED, fontSize: 14, fontWeight: anual ? 600 : 400, cursor: 'pointer' }} onClick={() => setAnual(true)}>
              Anual
            </Typography>
            <Chip label="-20%" size="small" sx={{ bgcolor: `${P}20`, color: P, fontWeight: 700, fontSize: 11, height: 20, border: `1px solid ${P}40` }} />
          </Box>
        </Box>
      </Box>

      {/* Cards */}
      <Box sx={{ display:'grid', gridTemplateColumns:{ xs:'1fr', md:'repeat(3, 1fr)' }, gap:2, alignItems:'center', maxWidth:1100, width:'100%' }}>
        {PLANES.map((plan, i) => {
          const precio = anual ? plan.precioAnual : plan.precioMes;
          const precioTachado = plan.precioBase;
          const esPlanActual = plan.id === planActual;

          return (
            <motion.div key={plan.id}
              initial={{ opacity:0, y:28 }}
              animate={{ opacity:1, y:0 }}
              transition={{ duration:0.5, delay:0.1 + i * 0.08, ease:[0.16,1,0.3,1] }}
              whileHover={{ y:-8 }}
              style={{ height:'100%' }}
            >
            <Box sx={{
              position:'relative',
              bgcolor: plan.highlight ? P : CARD,
              border:`1px solid ${plan.highlight ? P : BORDER}`,
              borderRadius:'20px', p:3.5,
              height:'100%',
              display:'flex', flexDirection:'column',
              transform: plan.highlight ? { md:'scale(1.04)' } : 'none',
              boxShadow: plan.highlight ? `0 20px 60px ${P}30` : 'none',
            }}>
              {esPlanActual ? (
                <Box sx={{ position:'absolute', top:16, right:16, px:1.25, py:0.4,
                  bgcolor: plan.highlight ? '#ffffff25' : '#10b98120',
                  borderRadius:'6px' }}>
                  <Typography sx={{ color: plan.highlight ? '#fff' : '#10b981', fontSize:11, fontWeight:700 }}>
                    Tu plan actual
                  </Typography>
                </Box>
              ) : plan.badge && (
                <Box sx={{ position:'absolute', top:16, right:16, px:1.25, py:0.4,
                  bgcolor: plan.highlight ? '#ffffff25' : `${plan.badgeColor}20`,
                  borderRadius:'6px' }}>
                  <Typography sx={{ color: plan.highlight ? '#fff' : plan.badgeColor, fontSize:11, fontWeight:700 }}>
                    {plan.badge}
                  </Typography>
                </Box>
              )}
              <Typography sx={{ color: plan.highlight ? '#ffffffb0' : MUTED, fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', mb:1 }}>{plan.desc}</Typography>
              <Typography sx={{ color: plan.highlight ? '#fff' : INK, fontWeight:900, fontSize:22, mb:0.5 }}>{plan.nombre}</Typography>
              <Box sx={{ mb:0.5 }}>
                {precioTachado && (
                  <Typography sx={{ color: plan.highlight ? '#ffffff60' : MUTED, fontSize:13, textDecoration:'line-through', mb:0.25 }}>
                    ${fmtPrecio(precioTachado)}
                  </Typography>
                )}
                <Box sx={{ display:'flex', alignItems:'flex-start', gap:0.5 }}>
                  <Typography sx={{ color: plan.highlight ? '#ffffffb0' : MUTED, fontSize:16, mt:0.75 }}>$</Typography>
                  <Typography component={motion.p} key={precio}
                    initial={{ opacity:0, y: anual ? 10 : -10 }} animate={{ opacity:1, y:0 }}
                    transition={{ duration:0.25, ease:[0.16,1,0.3,1] }}
                    sx={{ color: plan.highlight ? '#fff' : INK, fontWeight:900, fontSize:44, letterSpacing:'-0.03em', lineHeight:1, m:0 }}>
                    {fmtPrecio(precio)}
                  </Typography>
                </Box>
                <Typography sx={{ color: plan.highlight ? '#ffffff70' : MUTED, fontSize:12, mt:0.5 }}>
                  por mes · {anual ? `$${fmtPrecio(precio * 12)} / año` : 'facturado mensualmente'}
                </Typography>
              </Box>

              {/* Features */}
              <Box sx={{ flex:1, display:'flex', flexDirection:'column', gap:1, mb:3, mt:1 }}>
                {plan.features.map((f) => (
                  <Box key={f} sx={{ display:'flex', gap:1.25, alignItems:'flex-start' }}>
                    <CheckIcon sx={{ color: plan.highlight ? '#ffffffa0' : P, fontSize:15, mt:'2px', flexShrink:0 }} />
                    <Typography sx={{ color: plan.highlight ? '#ffffffd0' : INK2, fontSize:13.5, lineHeight:1.4 }}>{f}</Typography>
                  </Box>
                ))}
              </Box>

              {/* CTA */}
              {esPlanActual ? (
                <Button fullWidth variant="outlined" disabled
                  sx={{
                    color: plan.highlight ? '#ffffffa0' : '#10b981',
                    borderColor: plan.highlight ? '#ffffff50' : '#10b98150',
                    textTransform:'none', fontWeight:700, fontSize:14, py:1.4, borderRadius:'10px',
                    '&.Mui-disabled': { color: plan.highlight ? '#ffffffa0' : '#10b981', borderColor: plan.highlight ? '#ffffff50' : '#10b98150' },
                  }}
                >
                  Tu plan actual
                </Button>
              ) : (
                <Button
                  fullWidth
                  variant="contained"
                  disabled={loading !== null}
                  onClick={() => elegirPlan(plan.id)}
                  sx={{
                    bgcolor: plan.highlight ? '#fff' : `${P}15`,
                    color: P,
                    border: plan.highlight ? 'none' : `1px solid ${P}30`,
                    textTransform:'none', fontWeight:700, fontSize:14, py:1.4, borderRadius:'10px',
                    '&:hover':{ bgcolor: plan.highlight ? '#f0f0f0' : `${P}25` },
                    '&.Mui-disabled':{ bgcolor: plan.highlight ? `${P}50` : `${P}10`, color: plan.highlight ? '#fff' : `${P}50` },
                  }}
                >
                  {loading === plan.id
                    ? <CircularProgress size={18} sx={{ color: plan.highlight ? P : P }} />
                    : <>Activar {plan.nombre} →</>
                  }
                </Button>
              )}
              {!planActual || planActual === 'free' ? (
                <Typography sx={{ color: plan.highlight ? '#ffffff60' : MUTED, fontSize:12, textAlign:'center', mt:1 }}>
                  Probar gratis 7 días
                </Typography>
              ) : null}
            </Box>
            </motion.div>
          );
        })}
      </Box>

      {error && (
        <Typography sx={{ color: '#ef4444', fontSize: 13, textAlign: 'center', mt: 2 }}>
          {error}
        </Typography>
      )}

      <Typography sx={{ color: MUTED, fontSize: 12, textAlign: 'center', mt: 2 }}>
        Los cambios se aplican una vez que Mercado Pago confirma el pago.
      </Typography>
      </Box>
    </Box>
  );
}
