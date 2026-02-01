import React, { useState, useEffect, useMemo } from 'react';
import { 
  PlusCircle, 
  FileText, 
  Clock, 
  ChevronRight, 
  CheckCircle2, 
  ArrowLeft, 
  Upload,
  Home,
  List,
  Gavel
} from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../ui/ToastProvider';
import { useSupridoProcesses, SupridoProcess } from '../../hooks/useSupridoProcesses';
import { useSODPAMyRequests, useSODPAStats, SODPARequest } from '../../hooks/useSODPARequests';
import NewRequestWizard from './NewRequestWizard';
import AccountabilityModal from './AccountabilityModal';
import { RequestDetailPage } from '../SODPA/RequestDetailPage';

// View Types for state-based navigation
type SupridoView = 'dashboard' | 'nova-solicitacao' | 'minhas-solicitacoes' | 'prestacao-contas' | 'detalhes-solicitacao';

interface SupridoDashboardProps {
  forceView: string | null;
  onInternalViewChange: () => void;
  onProfileUpdate?: () => void;
  onRestoreModule?: () => void;
}

// Theme configuration based on user type (simplified after header removal)
const getMagistrateTheme = (isMagistrate: boolean) => isMagistrate 
  ? {
      activeTab: 'border-amber-600 text-amber-700',
      hoverTab: 'hover:text-amber-600',
      primaryButton: 'from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 shadow-amber-200',
      iconBg: 'bg-amber-100 text-amber-600',
      greeting: 'Olá, Excelência.',
    }
  : {
      activeTab: 'border-indigo-600 text-indigo-600',
      hoverTab: 'hover:text-indigo-600',
      primaryButton: 'from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-200',
      iconBg: 'bg-indigo-100 text-indigo-600',
      greeting: 'Olá, Servidor.',
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
  const { user } = useAuth();
  const { showToast } = useToast();
  const { data: processos = [], isLoading, refetch } = useSupridoProcesses();
  
  // SODPA requests (new table)
  const { data: sodpaRequests = [], isLoading: isLoadingSodpa, refetch: refetchSodpa } = useSODPAMyRequests();
  const { data: sodpaStats } = useSODPAStats();
  
  // State-based navigation (no react-router needed)
  const [currentView, setCurrentView] = useState<SupridoView>('dashboard');
  const [selectedProcess, setSelectedProcess] = useState<SupridoProcess | null>(null);
  const [showAccountabilityModal, setShowAccountabilityModal] = useState(false);
  const [userProfile, setUserProfile] = useState<{ nome?: string; matricula?: string; cargo?: string } | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<SODPARequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

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

  // Computed stats - combine legacy and SODPA
  const stats = useMemo(() => {
    // Legacy stats from processos
    const legacyPending = processos.filter(p => 
      ['RASCUNHO', 'AGUARDANDO_ATESTO', 'ENVIADO_GESTOR'].includes(p.status)
    ).length;
    const legacyApproved = processos.filter(p => 
      ['APROVADO', 'CREDITADO', 'CONCLUIDO'].includes(p.status)
    ).length;
    const legacyPendingPC = processos.filter(p => 
      p.status === 'CREDITADO' || p.status === 'AGUARDANDO_PRESTACAO_CONTAS'
    ).length;
    
    // SODPA stats
    const sodpaPending = sodpaStats?.pending || 0;
    const sodpaApproved = sodpaStats?.approved || 0;
    const sodpaPendingPC = sodpaStats?.pendingPC || 0;
    const sodpaTotal = sodpaStats?.total || 0;
    
    return { 
      pending: legacyPending + sodpaPending, 
      approved: legacyApproved + sodpaApproved, 
      pendingPC: legacyPendingPC + sodpaPendingPC, 
      total: processos.length + sodpaTotal 
    };
  }, [processos, sodpaStats]);

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
        
        {(isLoading || isLoadingSodpa) ? (
          <div className="flex items-center justify-center py-8">
            <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${isMagistrate ? 'border-amber-600' : 'border-indigo-600'}`}></div>
          </div>
        ) : (processos.length === 0 && sodpaRequests.length === 0) ? (
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
            {/* SODPA Requests (new) - clickable for details */}
            {sodpaRequests.slice(0, 5).map((req) => (
              <div 
                key={req.id}
                onClick={() => {
                  setSelectedRequest(req);
                  setCurrentView('detalhes-solicitacao');
                }}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    req.status === 'APROVADO' ? 'bg-emerald-100 text-emerald-600' :
                    req.status === 'ENVIADO' ? 'bg-blue-100 text-blue-600' :
                    'bg-amber-100 text-amber-600'
                  }`}>
                    <FileText size={18} />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{req.tipo === 'DIARIA' ? 'Diárias' : 'Passagem'} - {req.destino}</p>
                    <p className="text-sm text-slate-500">{req.origem} → {req.destino} • {req.dias} dia{req.dias > 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      req.status === 'APROVADO' ? 'bg-emerald-100 text-emerald-700' :
                      req.status === 'ENVIADO' ? 'bg-blue-100 text-blue-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {req.status?.replace(/_/g, ' ')}
                    </span>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(req.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                </div>
              </div>
            ))}
            
            {/* Legacy processes */}
            {processos.slice(0, Math.max(0, 5 - sodpaRequests.length)).map((processo) => (
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
                    R$ {(processo.val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                  <p className="text-sm text-slate-500">{processo.status} • {processo.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-slate-800">
                    R$ {(processo.val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
              refetchSodpa();
              navigateTo('dashboard');
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
          <p className="text-xs text-gray-400">Sistema de Gestão de Diárias e Passagens - v2.0</p>
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
            showToast({ title: 'Sucesso', message: 'Prestação de contas enviada!', type: 'success' });
          }}
        />
      )}

      {/* Request Detail Modal */}
      {/* Request Detail Page (Replaces Modal) */}
      {currentView === 'detalhes-solicitacao' && selectedRequest && (
        <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
          <RequestDetailPage
            request={{
              id: selectedRequest.id,
              tipo: selectedRequest.tipo,
              status: selectedRequest.status,
              nup: selectedRequest.nup,
              solicitante_nome: selectedRequest.solicitante_nome,
              solicitante_email: selectedRequest.solicitante_email,
              solicitante_cpf: selectedRequest.solicitante_cpf,
              solicitante_matricula: selectedRequest.solicitante_matricula,
              solicitante_cargo: selectedRequest.solicitante_cargo,
              solicitante_lotacao: selectedRequest.solicitante_lotacao,
              solicitante_municipio: selectedRequest.solicitante_municipio,
              solicitante_telefone: selectedRequest.solicitante_telefone,
              gestor_nome: selectedRequest.gestor_nome,
              gestor_email: selectedRequest.gestor_email,
              banco: selectedRequest.banco,
              agencia: selectedRequest.agencia,
              conta_corrente: selectedRequest.conta_corrente,
              tipo_destino: selectedRequest.tipo_destino,
              origem: selectedRequest.origem,
              destino: selectedRequest.destino,
              data_inicio: selectedRequest.data_inicio,
              data_fim: selectedRequest.data_fim,
              dias: selectedRequest.dias,
              motivo: selectedRequest.motivo,
              valor_total: selectedRequest.valor_total,
              assinatura_digital: selectedRequest.assinatura_digital,
              data_assinatura: selectedRequest.data_assinatura,
              destino_atual: selectedRequest.destino_atual,
              created_at: selectedRequest.created_at,
            }}
            onBack={() => {
              setCurrentView('dashboard');
              setSelectedRequest(null);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default SupridoDashboard;