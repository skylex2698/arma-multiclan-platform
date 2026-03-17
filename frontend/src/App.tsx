import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from './router';
import { useAuthStore } from './store/authStore';
import { useTheme } from './hooks/useTheme';
import { authService } from './services/authService';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const theme = useTheme((state) => state.theme);

  // Inicializar tema
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let cancelled = false;

    const refreshAuth = async () => {
      try {
        const response = await authService.getMe();

        if (!cancelled) {
          setAuth(response.user);
        }
      } catch {
        if (!cancelled) {
          clearAuth();
        }
      }
    };

    void refreshAuth();

    return () => {
      cancelled = true;
    };
  }, [clearAuth, isAuthenticated, setAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

export default App;
