import { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert } from '@mui/material';

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState({ open: false, msg: '', severity: 'success' });

  const show = useCallback((msg, severity = 'success') => {
    setToast({ open: true, msg, severity });
  }, []);

  const handleClose = (_, reason) => {
    if (reason === 'clickaway') return;
    setToast(t => ({ ...t, open: false }));
  };

  return (
    <ToastCtx.Provider value={show}>
      {children}
      <Snackbar
        open={toast.open}
        autoHideDuration={2500}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleClose}
          severity={toast.severity}
          variant="filled"
          sx={{
            fontSize: 13, fontWeight: 500, py: '6px', borderRadius: '10px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
            '& .MuiAlert-message': { py: 0 },
            '& .MuiAlert-icon': { fontSize: 17, mr: 1, py: 0 },
            '& .MuiAlert-action': { pt: 0, pl: 1 },
          }}
        >
          {toast.msg}
        </Alert>
      </Snackbar>
    </ToastCtx.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(ToastCtx);
