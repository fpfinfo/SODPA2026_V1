import React, { useState } from 'react';
import { DashboardSOSFU } from './components/DashboardSOSFU';
import { SupridoDashboard } from './components/Suprido/SupridoDashboard';
import { GestorDashboard } from './components/Gestor/GestorDashboard';
import { SefinDashboard } from './components/SefinDashboard';
import { AjsefinDashboard } from './components/AjsefinDashboard';
import { SgpDashboard } from './components/SgpDashboard';
import { LoginPage } from './components/LoginPage';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { ToastProvider } from './components/ui/ToastProvider';
import { AppRole, Process } from './types';
import { User, LogOut, ChevronDown, Bell, UserCircle, Settings as SettingsIcon, Loader2 } from 'lucide-react';
import { supabase } from './lib/supabaseClient';
import { NotificationBell } from './components/NotificationBell';
import { AlertBanner } from './components/AlertBanner';

const BRASAO_TJPA_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/217479058_brasao-tjpa.png';

// Main App Content (shown when authenticated)
const AppContent: React.FC = () => {
  const { user, signOut } = useAuth();
  const [activeRole, setActiveRole] = useState<AppRole>(AppRole.SUPRIDO);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [supridoViewOverride, setSupridoViewOverride] = useState<string | null>(null);
  const [sosfuForceSettings, setSosfuForceSettings] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [previousActiveRole, setPreviousActiveRole] = useState<AppRole | null>(null); // Stores role before profile navigation
  // Shared processes state for cross-module integration (e.g., SOSFU -> SEFIN)
  const [sharedProcesses, setSharedProcesses] = useState<Process[]>([]);

  const fetchUser = async () => {
    try {
      const currentUserId = user?.id;
      const userEmail = user?.email;

      // PRIORITY 1: Fetch from servidores_tj by authenticated user's email
      let servidorData = null;
      if (userEmail) {
        const { data: servidor, error } = await supabase
          .from('servidores_tj')
          .select('*')
          .ilike('email', userEmail)
          .eq('ativo', true)
          .maybeSingle();
        
        if (!error && servidor) {
          servidorData = servidor;
        }
      }
      
      // PRIORITY 2: Fetch from profiles by user ID (if exists)
      let profileData = null;
      if (currentUserId) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUserId)
          .maybeSingle();
        
        if (!error && profile) {
          profileData = profile;
        }
      }
      
      // Build merged profile prioritizing servidores_tj data (since it's authoritative)
      if (servidorData || profileData) {
        const mergedProfile = {
          // Start with profile data if exists
          ...(profileData || {}),
          // Override with servidores_tj data (authoritative source for employee info)
          id: currentUserId || profileData?.id,
          nome: servidorData?.nome || profileData?.nome || 'Usuário',
          email: servidorData?.email || userEmail || profileData?.email,
          cpf: servidorData?.cpf || profileData?.cpf,
          matricula: servidorData?.matricula || profileData?.matricula,
          cargo: servidorData?.cargo || profileData?.cargo,
          lotacao: servidorData?.lotacao || profileData?.lotacao,
          avatar_url: servidorData?.avatar_url || profileData?.avatar_url,
          telefone: servidorData?.telefone || profileData?.telefone,
          banco: servidorData?.banco || profileData?.banco,
          agencia: servidorData?.agencia || profileData?.agencia,
          conta_corrente: servidorData?.conta_corrente || profileData?.conta_corrente,
          gestor_nome: servidorData?.gestor_nome || profileData?.gestor_nome,
          gestor_email: servidorData?.gestor_email || profileData?.gestor_email,
          role: profileData?.role || servidorData?.role || 'SUPRIDO',
          // Track the source for debugging
          _source: servidorData ? 'servidores_tj' : 'profiles',
        };
        setUserProfile(mergedProfile);
        
        // Set activeRole based on user's role from database
        const dbRole = (profileData?.role || servidorData?.role)?.toUpperCase() as AppRole;
        if (dbRole && Object.values(AppRole).includes(dbRole)) {
          setActiveRole(dbRole);
        }
      } else {
        // No data found in either table - show minimal profile with auth data
        console.warn('No profile data found for:', userEmail);
        setUserProfile({
          id: currentUserId,
          email: userEmail,
          nome: userEmail?.split('@')[0] || 'Usuário',
          _source: 'auth_only'
        });
      }
    } catch (e) {
      console.error('Header fetch error:', e);
    }
  };

  React.useEffect(() => {
    fetchUser();
  }, [user]);

  const handleAvatarClick = () => {
    // Save current role before switching to profile view
    if (activeRole !== AppRole.SUPRIDO) {
      setPreviousActiveRole(activeRole);
    }
    // Switch to SUPRIDO module and show profile from any module
    setActiveRole(AppRole.SUPRIDO);
    setSupridoViewOverride('PROFILE');
    setShowUserMenu(false);
  };

  // Check if user is currently viewing the SOSFU module (not just if their role is SOSFU)
  const isInSosfuModule = ![AppRole.SUPRIDO, AppRole.GESTOR, AppRole.SEFIN, AppRole.AJSEFIN, AppRole.SGP].includes(activeRole);

  const handlePreferences = () => {
    // Se estiver no módulo SUPRIDO, abre as preferências/perfil
    if (activeRole === AppRole.SUPRIDO) {
      setSupridoViewOverride('PROFILE');
    }
    // Se estiver no módulo SOSFU (qualquer membro da equipe), abre as configurações do sistema
    if (isInSosfuModule) {
      setSosfuForceSettings(true);
    }
    setShowUserMenu(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col overflow-hidden">
      {/* Global Header */}
      <nav className="bg-white border-b border-slate-200 h-16 flex items-center px-8 sticky top-0 z-[100] shadow-sm">
        <div className="flex items-center gap-4">
          <img 
            src={BRASAO_TJPA_URL} 
            className="w-12 h-12 object-contain cursor-pointer hover:scale-105 transition-transform"
            onClick={() => {
              // If we came from another module, restore it
              if (previousActiveRole && previousActiveRole !== AppRole.SUPRIDO) {
                setActiveRole(previousActiveRole);
                setPreviousActiveRole(null);
              }
              setSupridoViewOverride('DASHBOARD');
            }}
            alt="Brasão TJPA"
          />
          <div>
            <span className="font-extrabold text-lg tracking-tight text-slate-800">SCS <span className="text-blue-600">TJPA</span></span>
            <div className="flex items-center gap-1.5 -mt-1">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sistema de Concessão de Suprimentos</span>
            </div>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-6">
          {/* Role Switcher - Only for test user (teste@tjpa.jus.br) */}
          {user?.email === 'teste@tjpa.jus.br' && (
          <div className="relative">
            <button 
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <User size={14} />
              Perfil: {activeRole}
              <ChevronDown size={14} />
            </button>
            
            {showRoleMenu && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-2xl py-2 z-[110] animate-in fade-in slide-in-from-top-2">
                 <p className="px-4 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mudar Visão</p>
                 {Object.values(AppRole).map(role => (
                   <button 
                    key={role}
                    onClick={() => { setActiveRole(role); setShowRoleMenu(false); setSupridoViewOverride(null); }}
                    className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-slate-50 ${activeRole === role ? 'text-blue-600 bg-blue-50' : 'text-slate-600'}`}
                   >
                     Módulo {role}
                   </button>
                 ))}
              </div>
            )}
          </div>
          )}

          <div className="h-8 w-px bg-slate-200"></div>

          <div className="h-8 w-px bg-slate-200"></div>

          <NotificationBell />

          {/* User Account Menu */}
          <div className="relative">
            <div 
              className="flex items-center gap-3 pl-2 group cursor-pointer"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="text-right hidden md:block">
                <p className="text-xs font-bold text-slate-800 leading-none">{userProfile?.nome || 'Carregando...'}</p>
                <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-tighter">Mat. {userProfile?.matricula || '...'}</p>
              </div>
              <img src={userProfile?.avatar_url ? `${userProfile.avatar_url}?t=${Date.now()}` : `https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile?.nome || 'User'}`} className="w-10 h-10 rounded-xl border-2 border-slate-100 group-hover:border-blue-400 transition-all shadow-sm bg-blue-50" alt="Avatar" />
            </div>

            {showUserMenu && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-2xl py-2 z-[110] animate-in fade-in slide-in-from-top-2 overflow-hidden">
                <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-100 mb-1">
                  <p className="text-xs font-bold text-slate-800">Minha Conta</p>
                  <p className="text-[10px] text-slate-400 truncate">{userProfile?.email || 'suprido@tjpa.jus.br'}</p>
                </div>
                <button 
                  onClick={handleAvatarClick}
                  className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all flex items-center gap-3"
                >
                  <UserCircle size={16} /> Meus Dados Cadastrais
                </button>
                <button 
                  onClick={handlePreferences}
                  className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-3"
                >
                  <SettingsIcon size={16} /> {isInSosfuModule ? 'Configurações do Sistema' : 'Preferências'}
                </button>
                <div className="h-px bg-slate-100 my-1"></div>
                <button 
                  onClick={() => signOut()}
                  className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 transition-all flex items-center gap-3"
                >
                  <LogOut size={16} /> Sair do Sistema
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden flex flex-col">
        <AlertBanner />
        <div className="flex-1 overflow-auto">
        {activeRole === AppRole.SUPRIDO && (
          <SupridoDashboard 
            forceView={supridoViewOverride} 
            onInternalViewChange={() => setSupridoViewOverride(null)} 
            onProfileUpdate={fetchUser}
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
          <GestorDashboard />
        )}
        {activeRole === AppRole.SOSFU && (
          <DashboardSOSFU 
            forceTab={sosfuForceSettings ? 'SETTINGS' : null} 
            onInternalTabChange={() => setSosfuForceSettings(false)}
            onProcessesChange={setSharedProcesses}
          />
        )}
        {activeRole === AppRole.SEFIN && (
          <SefinDashboard processes={sharedProcesses} />
        )}
        {activeRole === AppRole.AJSEFIN && (
          <AjsefinDashboard />
        )}
        {activeRole === AppRole.SGP && (
          <SgpDashboard />
        )}
        </div>
      </main>
    </div>
  );
};

// Main App wrapper with authentication
const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <AuthenticatedApp />
      </AuthProvider>
    </ToastProvider>
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
  return <AppContent />;
};

export default App;