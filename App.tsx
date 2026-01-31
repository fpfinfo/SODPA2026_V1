
import React, { useState, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { LoginPage } from './components/LoginPage';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { ToastProvider } from './components/ui/ToastProvider';
import { AppRole, Process } from './types';
import { Loader2 } from 'lucide-react';
import { AlertBanner } from './components/ui/AlertBanner';
import { useUserProfile } from './hooks/useUserProfile';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { AppNavbar } from './components/Layout/AppNavbar';
import { CommandPalette } from './components/CommandPalette';

// Lazy load heavy dashboard components for better initial load performance
const DashboardSOSFU = React.lazy(() => import('./components/DashboardSOSFU').then(m => ({ default: m.DashboardSOSFU })));
const SupridoDashboard = React.lazy(() => import('./components/Suprido/SupridoDashboard').then(m => ({ default: m.SupridoDashboard })));
const GestorCockpit = React.lazy(() => import('./components/Gestor/GestorCockpit').then(m => ({ default: m.GestorCockpit })));
const SefinCockpit = React.lazy(() => import('./components/SEFIN/SefinCockpit').then(m => ({ default: m.SefinCockpit })));
const AjsefinDashboard = React.lazy(() => import('./components/AjsefinDashboard').then(m => ({ default: m.AjsefinDashboard })));
const DashboardSODPA = React.lazy(() => import('./components/DashboardSODPA').then(m => ({ default: m.DashboardSODPA })));
const SgpDashboard = React.lazy(() => import('./components/SgpDashboard').then(m => ({ default: m.SgpDashboard })));
const ProcessDetailsPage = React.lazy(() => import('./components/ProcessDetails/UniversalProcessDetailsPage').then(m => ({ default: m.ProcessDetailsPage })));

// React Query client configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute (increased from 30s)
      gcTime: 10 * 60 * 1000, // 10 minutes cache retention
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

const BRASAO_TJPA_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/217479058_brasao-tjpa.png';

// Main App Content (shown when authenticated)
const AppContent: React.FC = () => {
  const { user, signOut } = useAuth();
  const [activeRole, setActiveRole] = useState<AppRole>(AppRole.SUPRIDO);
  const [supridoViewOverride, setSupridoViewOverride] = useState<string | null>(null);
  const [sosfuForceSettings, setSosfuForceSettings] = useState(false);
  const [previousActiveRole, setPreviousActiveRole] = useState<AppRole | null>(null); // Stores role before profile navigation
  // Shared processes state for cross-module integration (e.g., SOSFU -> SEFIN)
  const [sharedProcesses, setSharedProcesses] = useState<Process[]>([]);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  
  // Process details page navigation state
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);
  const [returnToRole, setReturnToRole] = useState<AppRole | null>(null);

  // Custom Hook for Profile Data
  const { userProfile, refetchUser, initialRole } = useUserProfile(user);

  // Sync initial role from hook
  React.useEffect(() => {
    if (initialRole) {
       const path = window.location.pathname;
       const search = window.location.search;
       
       console.log('[App] Initial Role from hook:', initialRole, '| Path:', path, '| Search:', search);
       
       // Só força SUPRIDO se o role do usuário for SUPRIDO ou se for uma ação específica de confirmação
       const isSupridoAction = search.includes('action=confirm') || search.includes('action=pc_correction');
       const shouldForceSuprido = path.includes('/suprido') && (initialRole === AppRole.SUPRIDO || isSupridoAction);
       
       if (shouldForceSuprido && initialRole === AppRole.SUPRIDO) {
          console.log('[App] Forcing SUPRIDO due to URL path/search for SUPRIDO user');
          setActiveRole(AppRole.SUPRIDO);
       } else {
          // Respeitar o role do banco de dados
          console.log('[App] Setting active role to:', initialRole);
          setActiveRole(initialRole);
          // Limpar a URL se o usuário não é SUPRIDO
          if (path.includes('/suprido') && initialRole !== AppRole.SUPRIDO) {
            window.history.replaceState({}, '', '/');
          }
       }
    }
  }, [initialRole]);

  const handleAvatarClick = () => {
    // Save current role before switching to profile view
    if (activeRole !== AppRole.SUPRIDO) {
      setPreviousActiveRole(activeRole);
    }
    // Switch to SUPRIDO module and show profile from any module
    setActiveRole(AppRole.SUPRIDO);
    setSupridoViewOverride('PROFILE');
  };

  // Check if user is currently viewing the SOSFU module (not just if their role is SOSFU)
  const isInSosfuModule = ![AppRole.SUPRIDO, AppRole.GESTOR, AppRole.SEFIN, AppRole.AJSEFIN, AppRole.SGP, AppRole.SODPA].includes(activeRole);

  const handlePreferences = () => {
    // Se estiver no módulo SUPRIDO, abre as preferências/perfil
    if (activeRole === AppRole.SUPRIDO) {
      setSupridoViewOverride('PROFILE');
    }
    // Se estiver no módulo SOSFU (qualquer membro da equipe), abre as configurações do sistema
    if (isInSosfuModule) {
      setSosfuForceSettings(true);
    }
  };

  const handleNavigateHome = () => {
    // If viewing process details, close it first
    if (selectedProcessId) {
      setSelectedProcessId(null);
      return;
    }
    // If we came from another module, restore it
    if (previousActiveRole && previousActiveRole !== AppRole.SUPRIDO) {
       setActiveRole(previousActiveRole);
       setPreviousActiveRole(null);
    }
    setSupridoViewOverride('DASHBOARD');
  };

  // Process details navigation handlers
  const handleOpenProcess = (processId: string) => {
    setReturnToRole(activeRole);
    setSelectedProcessId(processId);
  };

  const handleCloseProcess = () => {
    setSelectedProcessId(null);
    if (returnToRole) {
      setActiveRole(returnToRole);
      setReturnToRole(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col overflow-hidden">
      {/* Global Header */}
      <AppNavbar
        userProfile={userProfile}
        currentUserEmail={user?.email}
        activeRole={activeRole}
        setActiveRole={(role) => {
            setActiveRole(role);
            setSupridoViewOverride(null);
        }}
        onSignOut={signOut}
        onNavigateHome={handleNavigateHome}
        onProfileClick={handleAvatarClick}
        onPreferencesClick={handlePreferences}
        isInSosfuModule={isInSosfuModule}
        brasaoUrl={BRASAO_TJPA_URL}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden flex flex-col">
        <AlertBanner />
        <Suspense fallback={
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 size={40} className="animate-spin text-blue-500 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Carregando módulo...</p>
            </div>
          </div>
        }>
        {/* Process Details Page - Full Screen Navigation */}
        {selectedProcessId ? (
          <ProcessDetailsPage
            processId={selectedProcessId}
            onClose={handleCloseProcess}
            viewerRole={returnToRole === AppRole.SOSFU ? 'SOSFU' : 
                        returnToRole === AppRole.GESTOR ? 'GESTOR' : 
                        returnToRole === AppRole.SEFIN ? 'SEFIN' :
                        returnToRole === AppRole.SEFIN ? 'SEFIN' :
                        returnToRole === AppRole.AJSEFIN ? 'AJSEFIN' : 
                        returnToRole === AppRole.SODPA ? 'SODPA' : 
                        returnToRole === AppRole.SUPRIDO ? 'SUPRIDO' : 'SOSFU'}
          />
        ) : (
        <>
        {activeRole === AppRole.SUPRIDO && (
          <SupridoDashboard 
            forceView={supridoViewOverride} 
            onInternalViewChange={() => setSupridoViewOverride(null)} 
            onProfileUpdate={refetchUser}
            onRestoreModule={() => {
              // Restore previous module if user came from another module
              if (previousActiveRole && previousActiveRole !== AppRole.SUPRIDO) {
                setActiveRole(previousActiveRole);
                setPreviousActiveRole(null);
              }
            }}
          />
        )}
        {activeRole === AppRole.GESTOR && (
          <GestorCockpit />
        )}
        {activeRole === AppRole.SOSFU && (
          <DashboardSOSFU 
            forceTab={sosfuForceSettings ? 'SETTINGS' : null} 
            onInternalTabChange={() => setSosfuForceSettings(false)}
            onProcessesChange={setSharedProcesses}
            onOpenProcess={handleOpenProcess}
          />
        )}
        {activeRole === AppRole.SEFIN && (
          <SefinCockpit />
        )}
        {activeRole === AppRole.AJSEFIN && (
          <AjsefinDashboard />
        )}
        {activeRole === AppRole.SODPA && (
          <DashboardSODPA />
        )}
        {activeRole === AppRole.SGP && (
          <SgpDashboard />
        )}
        </>
        )}
        </Suspense>
      </main>

      <CommandPalette 
        open={isCommandOpen} 
        onOpenChange={setIsCommandOpen}
        onNavigate={(role) => {
            setActiveRole(role);
            setSupridoViewOverride(null);
        }}
        onSignOut={signOut}
        onProfile={handleAvatarClick}
        onPreferences={handlePreferences}
      />
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