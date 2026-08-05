import { useState, useCallback } from 'react';
import { HexColorPicker, HexColorInput } from 'react-colorful';
import { Box, Typography, Popover, Button } from '@mui/material';

const SWATCHES = [
  ['#000000','#434343','#666666','#999999','#b7b7b7','#cccccc','#d9d9d9','#ffffff'],
  ['#ff0000','#ff9900','#ffff00','#00ff00','#00ffff','#4a86e8','#0000ff','#9900ff'],
  ['#e53935','#f4511e','#fb8c00','#fdd835','#7cb342','#039be5','#3949ab','#8e24aa'],
  ['#b71c1c','#bf360c','#e65100','#f9a825','#558b2f','#01579b','#1a237e','#4a148c'],
  ['#ffcdd2','#ffe0b2','#fff9c4','#dcedc8','#b2ebf2','#bbdefb','#c5cae9','#e1bee7'],
];

export default function ColorPickerPopover({ label, value, onChange, allowNull = false }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const safeValue = value || '#ffffff';

  const handleChange = useCallback((color) => { onChange(color); }, [onChange]);

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.2 }}>
        {label && <Typography sx={{ fontSize: '0.58rem', color: 'var(--muted)', lineHeight: 1 }}>{label}</Typography>}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
          <Box onClick={e => setAnchorEl(e.currentTarget)}
            sx={{
              width: 28, height: 22, borderRadius: 1, cursor: 'pointer',
              border: '1.5px solid var(--border)',
              bgcolor: value || 'transparent',
              backgroundImage: !value
                ? 'linear-gradient(45deg,#ccc 25%,transparent 25%),linear-gradient(-45deg,#ccc 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ccc 75%),linear-gradient(-45deg,transparent 75%,#ccc 75%)'
                : 'none',
              backgroundSize: !value ? '7px 7px' : 'auto',
              backgroundPosition: !value ? '0 0,0 3.5px,3.5px -3.5px,-3.5px 0' : 'auto',
              '&:hover': { borderColor: 'var(--primary)' },
              transition: 'border-color 0.15s',
            }}
          />
          {allowNull && value && (
            <Box onClick={() => onChange(null)}
              sx={{ fontSize: '0.65rem', color: '#e57373', cursor: 'pointer', fontWeight: 700, lineHeight: 1, '&:hover': { color: '#e53935' } }}>
              ✕
            </Box>
          )}
        </Box>
      </Box>

      <Popover open={open} anchorEl={anchorEl} onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{
          sx: { p: 1.5, borderRadius: 2, boxShadow: '0 8px 32px rgba(0,0,0,0.18)', width: 230 },
          onClick: e => e.stopPropagation(),
        }}>
        <Box sx={{ '& .react-colorful': { width: '100% !important', height: '160px !important' },
                   '& .react-colorful__saturation': { borderRadius: '6px 6px 0 0' },
                   '& .react-colorful__hue': { borderRadius: '4px', height: '12px', mt: 1 },
                   '& .react-colorful__pointer': { width: 16, height: 16 } }}>
          <HexColorPicker color={safeValue} onChange={handleChange} style={{ width: '100%' }} />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1, border: '1px solid var(--border)', borderRadius: 1, px: 1, py: 0.4, bgcolor: 'var(--input)' }}>
          <Typography sx={{ fontSize: '0.75rem', color: 'var(--muted)', fontFamily: 'monospace', fontWeight: 700 }}>#</Typography>
          <HexColorInput color={safeValue} onChange={handleChange}
            style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.82rem', fontFamily: 'monospace', background: 'transparent', color: 'var(--ink)' }} />
          <Box sx={{ width: 20, height: 20, borderRadius: 0.5, bgcolor: safeValue, border: '1px solid var(--border)', flexShrink: 0 }} />
        </Box>

        <Box sx={{ mt: 1.2, display: 'flex', flexDirection: 'column', gap: 0.4 }}>
          {SWATCHES.map((row, ri) => (
            <Box key={ri} sx={{ display: 'flex', gap: 0.4 }}>
              {row.map(color => (
                <Box key={color} onClick={() => { onChange(color); setAnchorEl(null); }}
                  title={color}
                  sx={{
                    flex: 1, height: 16, borderRadius: 0.5, cursor: 'pointer',
                    bgcolor: color,
                    border: safeValue?.toLowerCase() === color.toLowerCase() ? '2px solid var(--primary)' : '1px solid rgba(0,0,0,0.12)',
                    '&:hover': { transform: 'scale(1.25)', zIndex: 2, borderColor: 'var(--primary)' },
                    transition: 'transform 0.1s',
                  }} />
              ))}
            </Box>
          ))}
        </Box>

        {allowNull && (
          <Button size="small" variant="outlined" fullWidth
            onClick={() => { onChange(null); setAnchorEl(null); }}
            sx={{ mt: 1, fontSize: '0.72rem', borderRadius: 1, color: 'var(--muted)', borderColor: 'var(--border)', '&:hover': { borderColor: '#e53935', color: '#e53935' } }}>
            Sin color de fondo
          </Button>
        )}
      </Popover>
    </>
  );
}
