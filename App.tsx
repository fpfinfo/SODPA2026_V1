import React, { useState } from 'react';
import { DashboardSOSFU } from './components/DashboardSOSFU';
import { SupridoDashboard } from './components/Suprido/SupridoDashboard';
import { GestorDashboard } from './components/Gestor/GestorDashboard';
import { SeplanDashboard } from './components/SeplanDashboard';
import { AjsefinDashboard } from './components/AjsefinDashboard';
import { SgpDashboard } from './components/SgpDashboard';
import { LoginPage } from './components/LoginPage';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { ToastProvider } from './components/ui/ToastProvider';
import { AppRole, Process } from './types';
import { User, LogOut, ChevronDown, Bell, UserCircle, Settings as SettingsIcon, Loader2 } from 'lucide-react';
import { supabase } from './lib/supabaseClient';

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
  // Shared processes state for cross-module integration (e.g., SOSFU -> SEPLAN)
  const [sharedProcesses, setSharedProcesses] = useState<Process[]>([]);

  const fetchUser = async () => {
    try {
      const currentUserId = user?.id;
      const userEmail = user?.email;

      let query = supabase.from('profiles').select('*');
      if (currentUserId) {
          query = query.eq('id', currentUserId);
      } else {
           // Fallback for preview: fetch seed user
          query = query.eq('id', '00000000-0000-0000-0000-000000000000');
      }
      const { data: profiles } = await query;
      
      // Also fetch from servidores_tj by email for additional data
      let servidorData = null;
      if (userEmail) {
        const { data: servidores } = await supabase
          .from('servidores_tj')
          .select('*')
          .eq('email', userEmail)
          .eq('ativo', true)
          .limit(1);
        servidorData = servidores?.[0] || null;
      }
      
      if (profiles?.[0]) {
           // Merge data: profiles first, then overlay servidores_tj data where available
           const mergedProfile = {
             ...profiles[0],
             telefone: servidorData?.telefone || profiles[0].telefone,
             banco: servidorData?.banco || profiles[0].banco,
             agencia: servidorData?.agencia || profiles[0].agencia,
             conta_corrente: servidorData?.conta_corrente || profiles[0].conta_corrente,
             gestor_nome: servidorData?.gestor_nome || profiles[0].gestor_nome,
             gestor_email: servidorData?.gestor_email || profiles[0].gestor_email,
           };
           setUserProfile(mergedProfile);
           
           // Set activeRole based on user's role from database
           const dbRole = profiles[0].role?.toUpperCase() as AppRole;
           if (dbRole && Object.values(AppRole).includes(dbRole)) {
             setActiveRole(dbRole);
           }
      }
    } catch (e) {
      console.error('Header fetch error:', e);
    }
  };

  React.useEffect(() => {
    fetchUser();
  }, [user]);

  const handleAvatarClick = () => {
    // Switch to SUPRIDO module and show profile from any module
    setActiveRole(AppRole.SUPRIDO);
    setSupridoViewOverride('PROFILE');
    setShowUserMenu(false);
  };

  const handlePreferences = () => {
    // Se estiver no módulo SUPRIDO, abre as preferências/perfil
    if (activeRole === AppRole.SUPRIDO) {
      setSupridoViewOverride('PROFILE');
    }
    // Se estiver no módulo SOSFU, abre as configurações do sistema
    if (activeRole === AppRole.SOSFU) {
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
            onClick={() => setSupridoViewOverride('DASHBOARD')}
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

          <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
             <Bell size={20} />
             <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>

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
              <img src={userProfile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile?.nome || 'User'}`} className="w-10 h-10 rounded-xl border-2 border-slate-100 group-hover:border-blue-400 transition-all shadow-sm bg-blue-50" alt="Avatar" />
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
                  <SettingsIcon size={16} /> {activeRole === AppRole.SOSFU ? 'Configurações do Sistema' : 'Preferências'}
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
      <main className="flex-1 overflow-hidden">
        {activeRole === AppRole.SUPRIDO && (
          <SupridoDashboard 
            forceView={supridoViewOverride} 
            onInternalViewChange={() => setSupridoViewOverride(null)} 
            onProfileUpdate={fetchUser}
          />
        )}
        {activeRole === AppRole.GESTOR && (
          <GestorDashboard />
        )}
        {activeRole === AppRole.SEPLAN && (
          <SeplanDashboard processes={sharedProcesses} />
        )}
        {activeRole === AppRole.AJSEFIN && (
          <AjsefinDashboard />
        )}
        {activeRole === AppRole.SGP && (
          <SgpDashboard />
        )}
        {![AppRole.SUPRIDO, AppRole.GESTOR, AppRole.SEPLAN, AppRole.AJSEFIN, AppRole.SGP].includes(activeRole) && (
          <DashboardSOSFU 
            forceTab={sosfuForceSettings ? 'SETTINGS' : null}
            onInternalTabChange={() => setSosfuForceSettings(false)}
            onProcessesChange={setSharedProcesses}
          />
        )}
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