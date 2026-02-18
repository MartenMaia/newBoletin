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

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<ToastState>({
    open: false,
    message: '',
    severity: 'info',
  });

  const show = React.useCallback((message: string, severity: ToastSeverity = 'info') => {
    setState({ open: true, message, severity });
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <Snackbar
        open={state.open}
        autoHideDuration={3000}
        onClose={() => setState((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setState((s) => ({ ...s, open: false }))}
          severity={state.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
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
