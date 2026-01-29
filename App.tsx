
import React, { useState, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { LoginPage } from './components/LoginPage';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { ToastProvider } from './components/ui/ToastProvider';
import { AppRole } from './types';
import { Loader2 } from 'lucide-react';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

// Lazy load dashboard components
const DashboardSODPA = React.lazy(() => import('./components/DashboardSODPA').then(m => ({ default: m.DashboardSODPA })));

// React Query client configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

// Main App Content (shown when authenticated)
const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [activeRole] = useState<AppRole>(AppRole.SODPA);

  // Process details navigation handler
  const handleOpenProcess = (processId: string, tipo: 'DIARIA' | 'PASSAGEM') => {
    console.log('Opening process:', processId, tipo);
    // TODO: Implement process details navigation
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 size={40} className="animate-spin text-blue-500 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Carregando módulo SODPA...</p>
          </div>
        </div>
      }>
        {activeRole === AppRole.SODPA && (
          <DashboardSODPA 
            onOpenProcess={handleOpenProcess}
          />
        )}
        
        {activeRole === AppRole.SEFIN && (
          <div className="min-h-screen flex items-center justify-center">
            <p className="text-gray-500">Módulo SEFIN em desenvolvimento</p>
          </div>
        )}
        
        {activeRole === AppRole.SOLICITANTE && (
          <div className="min-h-screen flex items-center justify-center">
            <p className="text-gray-500">Módulo Solicitante em desenvolvimento</p>
          </div>
        )}
      </Suspense>
    </div>
  );
};

// Main App wrapper with authentication
const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <AuthenticatedApp />
        </AuthProvider>
      </ToastProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};

// Component that handles auth state
const AuthenticatedApp: React.FC = () => {
  const { user, loading } = useAuth();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user) {
    return <LoginPage />;
  }

  // Show main app content when authenticated
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
};

export default App;