import { memo } from 'react';
import { Box, Typography, IconButton, Select, MenuItem } from '@mui/material';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon   from '@mui/icons-material/NavigateNext';
import FirstPageIcon      from '@mui/icons-material/FirstPage';
import LastPageIcon       from '@mui/icons-material/LastPage';
import { BORDER, INK, INK2, MUTED, P, INPUT, HOVER, DROPDOWN } from '../../theme/tokens';

const PAGE_SIZES = [5, 10, 20, 50];

function getPages(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [];
  pages.push(1);
  if (current > 3) pages.push('...');
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
  if (current < total - 2) pages.push('...');
  pages.push(total);
  return pages;
}

const TablePagination = memo(function TablePagination({
  pagina,
  totalPages,
  pageSize,
  totalItems,
  label = 'registros',
  onPageChange,
  onPageSizeChange,
}) {
  const pages = getPages(pagina, totalPages);

  const navBtn = (disabled) => ({
    width: 32, height: 32, borderRadius: '8px',
    border: `1px solid ${BORDER}`,
    bgcolor: disabled ? 'transparent' : HOVER,
    color: disabled ? BORDER : INK2,
    '&:hover': { bgcolor: disabled ? 'transparent' : `${P}18`, borderColor: disabled ? BORDER : P, color: disabled ? BORDER : P },
    '&.Mui-disabled': { opacity: 1 },
  });

  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexWrap: 'wrap', gap: 1.5,
      px: 3, py: 2, borderTop: `1px solid ${BORDER}`,
    }}>

      {/* Izquierda: contador + selector */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography sx={{ color: MUTED, fontSize: 13 }}>Mostrar</Typography>
        <Select
          value={pageSize}
          onChange={(e) => onPageSizeChange(e.target.value)}
          size="small"
          sx={{
            color: INK, fontSize: 13, bgcolor: INPUT, borderRadius: '8px',
            '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border-hover)' },
            '& .MuiSelect-select': { py: '5px', px: '10px', pr: '28px !important' },
            '& .MuiSvgIcon-root': { color: MUTED, fontSize: 18 },
          }}
          MenuProps={{ PaperProps: { sx: { bgcolor: DROPDOWN, border: `1px solid ${BORDER}`, borderRadius: '8px', color: INK } } }}
        >
          {PAGE_SIZES.map((n) => (
            <MenuItem key={n} value={n} sx={{ fontSize: 13, '&:hover': { bgcolor: HOVER } }}>{n}</MenuItem>
          ))}
        </Select>
        <Typography sx={{ color: MUTED, fontSize: 13 }}>
          de <Box component="span" sx={{ color: INK, fontWeight: 600 }}>{totalItems}</Box> {label}
        </Typography>
      </Box>

      {/* Derecha: navegación */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <IconButton size="small" disabled={pagina === 1} onClick={() => onPageChange(1)} sx={navBtn(pagina === 1)}>
          <FirstPageIcon sx={{ fontSize: 16 }} />
        </IconButton>
        <IconButton size="small" disabled={pagina === 1} onClick={() => onPageChange(pagina - 1)} sx={navBtn(pagina === 1)}>
          <NavigateBeforeIcon sx={{ fontSize: 16 }} />
        </IconButton>

        {pages.map((p, i) =>
          p === '...'
            ? <Typography key={`ellipsis-${i}`} sx={{ color: MUTED, fontSize: 13, px: 0.5, lineHeight: 1, userSelect: 'none' }}>…</Typography>
            : <Box
                key={p}
                onClick={() => onPageChange(p)}
                sx={{
                  width: 32, height: 32, borderRadius: '8px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: pagina === p ? 700 : 400, cursor: 'pointer',
                  border: `1px solid ${pagina === p ? P : BORDER}`,
                  bgcolor: pagina === p ? `${P}20` : 'transparent',
                  color: pagina === p ? P : INK2,
                  transition: 'all 0.15s',
                  '&:hover': { bgcolor: `${P}18`, borderColor: P, color: P },
                }}
              >
                {p}
              </Box>
        )}

        <IconButton size="small" disabled={pagina === totalPages} onClick={() => onPageChange(pagina + 1)} sx={navBtn(pagina === totalPages)}>
          <NavigateNextIcon sx={{ fontSize: 16 }} />
        </IconButton>
        <IconButton size="small" disabled={pagina === totalPages} onClick={() => onPageChange(totalPages)} sx={navBtn(pagina === totalPages)}>
          <LastPageIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>
    </Box>
  );
});

export default TablePagination;
