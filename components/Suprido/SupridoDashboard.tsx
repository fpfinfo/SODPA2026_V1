import React, { useState, useEffect, useMemo } from 'react';
import { 
  PlusCircle, 
  FileText, 
  Clock, 
  ChevronRight, 
  CheckCircle2, 
  Wallet, 
  ArrowLeft, 
  AlertTriangle,
  Upload,
  Calendar,
  User,
  Bell,
  ChevronDown,
  LogOut,
  Home,
  List,
  Gavel
} from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../ui/ToastProvider';
import { useSupridoProcesses, SupridoProcess } from '../../hooks/useSupridoProcesses';
import NewRequestWizard from './NewRequestWizard';
import AccountabilityModal from './AccountabilityModal';

// View Types for state-based navigation
type SupridoView = 'dashboard' | 'nova-solicitacao' | 'minhas-solicitacoes' | 'prestacao-contas';

interface SupridoDashboardProps {
  forceView: string | null;
  onInternalViewChange: () => void;
  onProfileUpdate?: () => void;
  onRestoreModule?: () => void;
}

// Theme configuration based on user type
const getMagistrateTheme = (isMagistrate: boolean) => isMagistrate 
  ? {
      headerGradient: 'from-slate-900 via-slate-800 to-amber-900',
      accentColor: 'text-amber-400',
      activeTab: 'border-amber-600 text-amber-700',
      hoverTab: 'hover:text-amber-600',
      primaryButton: 'from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 shadow-amber-200',
      badge: 'bg-amber-500/20 border-amber-400/30 text-amber-200',
      iconBg: 'bg-amber-100 text-amber-600',
      blobColor1: 'bg-amber-600',
      blobColor2: 'bg-slate-600',
      avatarBorder: 'border-amber-400',
      greeting: 'Olá, Excelência.',
      portalTitle: 'Portal do Magistrado'
    }
  : {
      headerGradient: 'from-indigo-700 via-indigo-800 to-purple-900',
      accentColor: 'text-indigo-200',
      activeTab: 'border-indigo-600 text-indigo-600',
      hoverTab: 'hover:text-indigo-600',
      primaryButton: 'from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-200',
      badge: 'bg-indigo-500/30 border-indigo-400/30 text-indigo-100',
      iconBg: 'bg-indigo-100 text-indigo-600',
      blobColor1: 'bg-purple-500',
      blobColor2: 'bg-blue-400',
      avatarBorder: 'border-indigo-300',
      greeting: 'Olá, Servidor.',
      portalTitle: 'Portal do Servidor'
    };

// Quick stats card component
const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  onClick?: () => void;
}> = ({ icon, label, value, color, onClick }) => (
  <div 
    className={`bg-white rounded-xl p-4 shadow-sm border border-slate-100 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
    onClick={onClick}
  >
    <div className="flex items-center gap-3">
      <div className={`p-2.5 rounded-lg ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  </div>
);

export const SupridoDashboard: React.FC<SupridoDashboardProps> = ({ 
  forceView, 
  onInternalViewChange,
  onProfileUpdate,
  onRestoreModule
}) => {
  const { user, signOut } = useAuth();
  const { showToast } = useToast();
  const { data: processos = [], isLoading, refetch } = useSupridoProcesses();
  
  // State-based navigation (no react-router needed)
  const [currentView, setCurrentView] = useState<SupridoView>('dashboard');
  const [selectedProcess, setSelectedProcess] = useState<SupridoProcess | null>(null);
  const [showAccountabilityModal, setShowAccountabilityModal] = useState(false);
  const [userProfile, setUserProfile] = useState<{ nome?: string; matricula?: string; cargo?: string } | null>(null);

  // Fetch user profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from('profiles')
        .select('nome, matricula, cargo')
        .eq('id', user.id)
        .single();
      if (data) setUserProfile(data);
    };
    fetchProfile();
  }, [user?.id]);

  // Detect if user is a magistrate (by cargo or email pattern)
  const isMagistrate = useMemo(() => {
    const cargo = userProfile?.cargo?.toLowerCase() || '';
    const email = user?.email?.toLowerCase() || '';
    return cargo.includes('juiz') || 
           cargo.includes('desembargador') || 
           email.startsWith('juiz') || 
           email.startsWith('desembargador');
  }, [userProfile?.cargo, user?.email]);

  const theme = getMagistrateTheme(isMagistrate);

  // Handle forced view from App.tsx
  useEffect(() => {
    if (forceView) {
      if (forceView === 'nova-solicitacao') {
        setCurrentView('nova-solicitacao');
      }
      onInternalViewChange();
    }
  }, [forceView, onInternalViewChange]);

  // Computed stats
  const stats = useMemo(() => {
    const pending = processos.filter(p => 
      ['RASCUNHO', 'AGUARDANDO_ATESTO', 'ENVIADO_GESTOR'].includes(p.status)
    ).length;
    const approved = processos.filter(p => 
      ['APROVADO', 'CREDITADO', 'CONCLUIDO'].includes(p.status)
    ).length;
    const pendingPC = processos.filter(p => 
      p.status === 'CREDITADO' || p.status === 'AGUARDANDO_PRESTACAO_CONTAS'
    ).length;
    
    return { pending, approved, pendingPC, total: processos.length };
  }, [processos]);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      showToast('Erro ao sair');
    }
  };

  const navigateTo = (view: SupridoView) => {
    setCurrentView(view);
    setSelectedProcess(null);
  };

  const handleOpenAccountability = (processo: SupridoProcess) => {
    setSelectedProcess(processo);
    setShowAccountabilityModal(true);
  };

  // Render Dashboard View
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">{theme.greeting}</h2>
            <p className="text-gray-500">Acompanhe suas solicitações e mantenha suas prestações de contas em dia.</p>
          </div>
          <button
            onClick={() => navigateTo('nova-solicitacao')}
            className={`bg-gradient-to-r ${theme.primaryButton} text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all hover:-translate-y-1`}
          >
            Nova Solicitação
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Clock size={20} className={isMagistrate ? 'text-slate-600' : 'text-amber-600'} />}
          label="Pendentes"
          value={stats.pending}
          color={isMagistrate ? 'bg-slate-100' : 'bg-amber-50'}
        />
        <StatCard
          icon={<CheckCircle2 size={20} className="text-emerald-600" />}
          label="Aprovados"
          value={stats.approved}
          color="bg-emerald-50"
        />
        <StatCard
          icon={<Upload size={20} className={isMagistrate ? 'text-amber-600' : 'text-indigo-600'} />}
          label="Aguard. Prestação"
          value={stats.pendingPC}
          color={isMagistrate ? 'bg-amber-50' : 'bg-indigo-50'}
          onClick={() => navigateTo('prestacao-contas')}
        />
        <StatCard
          icon={<FileText size={20} className="text-slate-600" />}
          label="Total"
          value={stats.total}
          color="bg-slate-100"
        />
      </div>

      {/* Recent Requests */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <FileText size={20} className={isMagistrate ? 'text-amber-600' : 'text-indigo-600'} />
            Minhas Solicitações Recentes
          </h3>
          <button 
            onClick={() => navigateTo('minhas-solicitacoes')}
            className={`${isMagistrate ? 'text-amber-600 hover:text-amber-800' : 'text-indigo-600 hover:text-indigo-800'} text-sm font-medium flex items-center gap-1`}
          >
            Ver todas <ChevronRight size={16} />
          </button>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${isMagistrate ? 'border-amber-600' : 'border-indigo-600'}`}></div>
          </div>
        ) : processos.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <FileText size={48} className="mx-auto mb-2 text-slate-300" />
            <p>Nenhuma solicitação encontrada</p>
            <button 
              onClick={() => navigateTo('nova-solicitacao')}
              className={`mt-4 ${isMagistrate ? 'text-amber-600' : 'text-indigo-600'} hover:underline`}
            >
              Criar primeira solicitação
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {processos.slice(0, 5).map((processo) => (
              <div 
                key={processo.id}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                onClick={() => handleOpenAccountability(processo)}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    processo.status === 'APROVADO' ? 'bg-emerald-100 text-emerald-600' :
                    processo.status === 'CREDITADO' ? (isMagistrate ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600') :
                    'bg-amber-100 text-amber-600'
                  }`}>
                    <FileText size={18} />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{processo.nup || 'Sem NUP'}</p>
                    <p className="text-sm text-slate-500">{processo.status}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-800">
                    R$ {(processo.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    processo.status === 'APROVADO' ? 'bg-emerald-100 text-emerald-700' :
                    processo.status === 'CREDITADO' ? (isMagistrate ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700') :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {processo.status?.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Render Minhas Solicitações View
  const renderMinhasSolicitacoes = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={() => navigateTo('dashboard')}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-slate-800">Minhas Solicitações</h1>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className={`animate-spin rounded-full h-10 w-10 border-b-2 ${isMagistrate ? 'border-amber-600' : 'border-indigo-600'}`}></div>
        </div>
      ) : processos.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
          <FileText size={64} className="mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500">Nenhuma solicitação encontrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {processos.map((processo) => (
            <div 
              key={processo.id}
              className="bg-white p-4 rounded-xl border border-slate-100 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleOpenAccountability(processo)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">{processo.nup || 'Sem NUP'}</p>
                  <p className="text-sm text-slate-500">{processo.status} • {new Date(processo.data_solicitacao || Date.now()).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-slate-800">
                    R$ {(processo.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    processo.status === 'APROVADO' ? 'bg-emerald-100 text-emerald-700' :
                    processo.status === 'CREDITADO' ? (isMagistrate ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700') :
                    processo.status === 'REJEITADO' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {processo.status?.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Main render with Portal Layout
  return (
    <div className={`min-h-screen bg-gradient-to-br ${isMagistrate ? 'from-slate-100 to-amber-50' : 'from-slate-50 to-indigo-50'}`}>
      {/* Header with Dynamic Theme */}
      <header className={`relative bg-gradient-to-r ${theme.headerGradient} text-white shadow-xl overflow-hidden`}>
        {/* Decorative background blobs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
          <div className={`absolute -top-24 -left-24 w-96 h-96 rounded-full blur-3xl ${theme.blobColor1}`}></div>
          <div className={`absolute top-1/2 right-0 w-64 h-64 rounded-full blur-3xl ${theme.blobColor2}`}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center">
                {isMagistrate ? (
                  <Gavel size={28} className="text-amber-200" />
                ) : (
                  <Wallet size={28} className="text-white" />
                )}
              </div>
              <div>
                <h1 className="text-lg font-bold">{theme.portalTitle}</h1>
                <p className={`text-xs ${theme.accentColor}`}>Tribunal de Justiça do Estado do Pará</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button className={`relative p-2 ${theme.accentColor} hover:text-white hover:bg-white/10 rounded-full transition-colors`}>
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-400 border-2 border-slate-900 rounded-full"></span>
              </button>

              <div className="h-8 w-px bg-white/20"></div>

              {/* Profile Info */}
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium">{userProfile?.nome || user?.email}</p>
                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    {isMagistrate && (
                      <span className={`text-[10px] px-1.5 rounded font-medium border ${theme.badge} flex items-center gap-1`}>
                        <Gavel size={10} /> MAGISTRATURA
                      </span>
                    )}
                    <span className={`text-[10px] px-1.5 rounded font-medium border ${theme.badge}`}>
                      MAT. {userProfile?.matricula || '---'}
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <div className={`w-10 h-10 rounded-full ${theme.avatarBorder} border-2 bg-white/20 flex items-center justify-center`}>
                    <User size={20} className="text-white" />
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-slate-900 rounded-full"></div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="ml-2 flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-red-500/20 rounded-lg transition-all text-sm font-medium"
                title="Sair"
              >
                <LogOut size={18} />
                <span className="hidden md:inline">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            <button
              onClick={() => navigateTo('dashboard')}
              className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
                currentView === 'dashboard' 
                  ? theme.activeTab 
                  : `border-transparent text-slate-600 ${theme.hoverTab}`
              }`}
            >
              <Home size={16} />
              Início
            </button>
            <button
              onClick={() => navigateTo('nova-solicitacao')}
              className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
                currentView === 'nova-solicitacao' 
                  ? theme.activeTab 
                  : `border-transparent text-slate-600 ${theme.hoverTab}`
              }`}
            >
              <PlusCircle size={16} />
              Nova Solicitação
            </button>
            <button
              onClick={() => navigateTo('minhas-solicitacoes')}
              className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
                currentView === 'minhas-solicitacoes' 
                  ? theme.activeTab 
                  : `border-transparent text-slate-600 ${theme.hoverTab}`
              }`}
            >
              <List size={16} />
              Minhas Solicitações
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'dashboard' && renderDashboard()}
        {currentView === 'nova-solicitacao' && (
          <NewRequestWizard 
            onComplete={() => {
              refetch();
              navigateTo('dashboard');
              showToast('Solicitação criada com sucesso!');
            }}
            onCancel={() => navigateTo('dashboard')}
          />
        )}
        {currentView === 'minhas-solicitacoes' && renderMinhasSolicitacoes()}
        {currentView === 'prestacao-contas' && renderMinhasSolicitacoes()}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center justify-center gap-2">
          <div className="text-sm font-medium text-gray-500">
            &copy; {new Date().getFullYear()} Tribunal de Justiça do Estado do Pará
          </div>
          <p className="text-xs text-gray-400">Sistema de Gestão de Diárias e Passagens - {theme.portalTitle} v2.0</p>
        </div>
      </footer>

      {/* Accountability Modal */}
      {showAccountabilityModal && selectedProcess && (
        <AccountabilityModal
          isOpen={showAccountabilityModal}
          processo={selectedProcess}
          onClose={() => {
            setShowAccountabilityModal(false);
            setSelectedProcess(null);
          }}
          onSuccess={() => {
            refetch();
            setShowAccountabilityModal(false);
            setSelectedProcess(null);
            showToast('Prestação de contas enviada!');
          }}
        />
      )}
    </div>
  );
};

export default SupridoDashboard;