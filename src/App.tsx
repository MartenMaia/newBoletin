import { AuthProvider } from './app/auth';
import { AppRouter } from './app/router';
import { ToastProvider } from './app/toast';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppRouter />
      </ToastProvider>
    </AuthProvider>
  );
}
