import React from 'react';
import { Alert, Snackbar } from '@mui/material';

type ToastSeverity = 'success' | 'info' | 'warning' | 'error';

interface ToastState {
  open: boolean;
  message: string;
  severity: ToastSeverity;
}

interface ToastApi {
  show: (message: string, severity?: ToastSeverity) => void;
}

const ToastContext = React.createContext<ToastApi | undefined>(undefined);

export function ToastProvider(props: { children: React.ReactNode }) {
  const [state, setState] = React.useState<ToastState>({ open: false, message: '', severity: 'info' });

  const show = React.useCallback(function (message: string, severity: ToastSeverity) {
    setState({ open: true, message: message, severity: severity });
  }, []);

  function handleClose() {
    setState(function (s) {
      return { open: false, message: s.message, severity: s.severity };
    });
  }

  return (
    <ToastContext.Provider
      value={{
        show: function (message: string, severity?: ToastSeverity) {
          show(message, severity || 'info');
        },
      }}
    >
      {props.children}
      <Snackbar open={state.open} autoHideDuration={3000} onClose={handleClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={handleClose} severity={state.severity} variant="filled" sx={{ width: '100%' }}>
          {state.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
