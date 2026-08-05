import { memo } from 'react';
import { Dialog, Box, Typography, Button, IconButton } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CloseIcon from '@mui/icons-material/Close';
import { INK, INK2, MUTED, HOVER, ERROR, ERROR_BG, ERROR_BORDER, ERROR_DARK, TABLE_HEADER, modalPaperSx } from '../../theme/tokens';

const ConfirmDialog = memo(function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = '¿Eliminar este registro?',
  message = 'Esta acción no se puede deshacer.',
  confirmLabel = 'Eliminar',
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: modalPaperSx }}
    >
      <Box sx={{ p: { xs: 1.75, sm: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: TABLE_HEADER, mx: { xs: -1.75, sm: -3 }, mt: { xs: -1.75, sm: -3 }, px: { xs: 1.75, sm: 3 }, pt: { xs: 1.75, sm: 3 }, pb: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 36, height: 36, borderRadius: '8px',
              bgcolor: ERROR_BG, border: `1px solid ${ERROR_BORDER}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <WarningAmberIcon sx={{ color: ERROR, fontSize: 20 }} />
            </Box>
            <Typography sx={{ color: INK, fontWeight: 700, fontSize: 17 }}>{title}</Typography>
          </Box>
          <IconButton size="small" onClick={onClose} sx={{ color: MUTED, '&:hover': { color: INK } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Typography sx={{ color: INK2, fontSize: 14, mb: 3, lineHeight: 1.6 }}>
          {message}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
          <Button
            onClick={onClose}
            sx={{ color: INK2, textTransform: 'none', fontWeight: 600, px: 3, py: 1, borderRadius: '8px', '&:hover': { bgcolor: HOVER } }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={() => { onConfirm(); onClose(); }}
            sx={{ bgcolor: ERROR, textTransform: 'none', fontWeight: 600, px: 3, py: 1, borderRadius: '8px', '&:hover': { bgcolor: ERROR_DARK } }}
          >
            {confirmLabel}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
});

export default ConfirmDialog;
