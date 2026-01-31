import React, { useState, useEffect } from 'react';
import { 
  Plane, Calendar, CheckCircle, Clock, AlertTriangle, FileText, ChevronRight, 
  MapPin, Briefcase, Search, Loader2, Bell, ChevronDown, User, Upload, PlusCircle, List
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useToast } from './ui/ToastProvider';
import PortalNewRequest from './PortalNewRequest';
import { AccountabilityModal } from './Portal/AccountabilityModal';

// Status Badge Component
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    'RASCUNHO': { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Rascunho' },
    'EM_ANALISE': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Em Análise' },
    'EM_ANALISE_SODPA': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Em Análise SODPA' },
    'EM_ANALISE_AJSEFIN': { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Em Análise AJSEFIN' },
    'EM_ANALISE_SGP': { bg: 'bg-teal-100', text: 'text-teal-700', label: 'Em Análise SGP' },
    'EM_ANALISE_PRESIDENCIA': { bg: 'bg-rose-100', text: 'text-rose-700', label: 'Em Análise Presidência' },
    'APROVADO': { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Aprovado' },
    'PENDENTE_PRESTACAO': { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Aguardando Prest. Contas' },
    'PRESTACAO_CONTAS': { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Em Análise PC' },
    'CONCLUIDO': { bg: 'bg-green-100', text: 'text-green-700', label: 'Concluído' },
    'REJEITADO': { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejeitado' },
    'CANCELADO': { bg: 'bg-slate-200', text: 'text-slate-500', label: 'Cancelado' },
  };
  
  const config = statusConfig[status] || statusConfig['EM_ANALISE'];
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};

// Type Badge Component
const TypeBadge: React.FC<{ type: string }> = ({ type }) => {
  const isPassagem = type?.toLowerCase().includes('passagem');
  const isDiaria = type?.toLowerCase().includes('diaria') || type?.toLowerCase().includes('diária');
  
  if (isPassagem) {
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-100 text-purple-700">
        Passagem
      </span>
    );
  }
  if (isDiaria) {
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-700">
        Diária
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-600">
      {type || 'Solicitação'}
    </span>
  );
};

interface ServidorPortalProps {
  onProfileUpdate?: () => void;
}

export const ServidorPortal: React.FC<ServidorPortalProps> = ({ onProfileUpdate }) => {
  const [activeTab, setActiveTab] = useState<'processos' | 'nova'>('processos');
  const [solicitacoes, setSolicitacoes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isMagistrado, setIsMagistrado] = useState(false);
  const [accountabilityModalOpen, setAccountabilityModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const { showToast } = useToast();
  
  // Fetch current user and their requests
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        // Get user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*, servidores_tj(*)')
          .eq('id', user.id)
          .single();
        
        setCurrentUser(profile);
        setIsMagistrado(profile?.servidores_tj?.is_magistrado === true || profile?.cargo?.toLowerCase().includes('desembargador'));
        
        // Fetch user's requests from diarias table
        const { data: requests, error } = await supabase
          .from('diarias')
          .select('*')
          .eq('solicitante_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setSolicitacoes(requests || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        showToast({ type: 'error', title: 'Erro ao carregar solicitações' });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Stats
  const stats = {
    emAndamento: solicitacoes.filter(s => !['CONCLUIDO', 'REJEITADO', 'CANCELADO', 'APROVADO', 'PRESTACAO_CONTAS'].includes(s.status)).length,
    aprovadas: solicitacoes.filter(s => s.status === 'APROVADO' || s.status === 'CONCLUIDO').length,
    pendentes: solicitacoes.filter(s => s.status === 'APROVADO').length,
  };
  
  // Filter requests
  const filteredSolicitacoes = solicitacoes.filter(s => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      s.nup?.toLowerCase().includes(search) ||
      s.motivo?.toLowerCase().includes(search) ||
      s.destino?.toLowerCase().includes(search)
    );
  });

  const handleOpenAccountability = (request: any) => {
    setSelectedRequest(request);
    setAccountabilityModalOpen(true);
  };

  const handleSubmitAccountability = async (requestId: string, files: File[], report: string) => {
    try {
      // Update status in database
      const { error } = await supabase
        .from('diarias')
        .update({ status: 'PRESTACAO_CONTAS', observacoes: report })
        .eq('id', requestId);
      
      if (error) throw error;
      
      // Update local state
      setSolicitacoes(prev => prev.map(req => 
        req.id === requestId 
        ? { ...req, status: 'PRESTACAO_CONTAS' } 
        : req
      ));
      
      showToast({ type: 'success', title: 'Prestação de contas enviada com sucesso!' });
    } catch (err) {
      console.error('Error submitting accountability:', err);
      showToast({ type: 'error', title: 'Erro ao enviar prestação de contas' });
    }
  };
  
  // Handle new request submission
  const handleNewRequestSubmit = async (formData: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showToast({ type: 'error', title: 'Usuário não autenticado' });
        return;
      }
      
      // Generate NUP
      const year = new Date().getFullYear();
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const prefix = formData.tipo === 'PASSAGEM' ? 'TJPA-EXT' : 'TJPA-DIA';
      const nup = `${prefix}-${year}-${randomNum}`;
      
      const { error } = await supabase
        .from('diarias')
        .insert({
          solicitante_id: user.id,
          nup,
          destino: formData.destino,
          motivo: formData.descricao,
          data_inicio: formData.dataInicio,
          data_fim: formData.dataFim,
          valor_total: formData.valor || 0,
          status: 'EM_ANALISE',
          observacoes: formData.observacoes,
          prioridade: 'NORMAL',
        });
      
      if (error) throw error;
      
      showToast({ type: 'success', title: 'Solicitação enviada com sucesso!' });
      setActiveTab('processos');
      
      // Refresh data
      const { data: requests } = await supabase
        .from('diarias')
        .select('*')
        .eq('solicitante_id', user.id)
        .order('created_at', { ascending: false });
      
      setSolicitacoes(requests || []);
    } catch (error) {
      console.error('Error submitting request:', error);
      showToast({ type: 'error', title: 'Erro ao enviar solicitação' });
    }
  };
  
  const portalTitle = isMagistrado ? 'Portal do Magistrado' : 'Portal do Servidor';
  
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Modern Header with Gradient and Glassmorphism effects */}
      <header className="relative bg-gradient-to-br from-indigo-900 via-blue-900 to-indigo-800 text-white shadow-xl overflow-hidden">
        
        {/* Decorative background blobs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-purple-500 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 right-0 w-64 h-64 bg-blue-400 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex justify-between items-center z-10">
          
          {/* Logo / Brand Area */}
          <div className="flex items-center gap-5">
             <div className="w-14 h-14 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center shadow-inner group transition-transform hover:scale-105">
                {isMagistrado ? <Briefcase size={28} className="text-white drop-shadow-md" /> : <User size={28} className="text-white drop-shadow-md" />}
             </div>
             <div className="flex flex-col">
               <h1 className="text-2xl font-bold leading-none tracking-tight text-white drop-shadow-sm">{portalTitle}</h1>
               <span className="text-xs text-indigo-200 font-medium tracking-widest uppercase mt-1.5 opacity-90">Tribunal de Justiça do Estado do Pará</span>
             </div>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-6">
             
             {/* Notifications */}
             <button className="relative p-2 text-indigo-200 hover:text-white transition-colors hover:bg-white/10 rounded-full">
                <Bell size={22} />
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-400 border-2 border-indigo-900 rounded-full"></span>
             </button>

             <div className="h-10 w-px bg-white/10 mx-2"></div>

             {/* Profile Info */}
             <div className="flex items-center gap-4 group cursor-pointer p-2 rounded-xl hover:bg-white/5 transition-all">
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-white leading-tight">{currentUser?.nome || 'Carregando...'}</p>
                    <div className="flex items-center justify-end gap-1 mt-0.5">
                        <span className="text-[10px] bg-indigo-500/30 border border-indigo-400/30 px-1.5 rounded text-indigo-100 font-medium">
                            MAT. {currentUser?.matricula || '---'}
                        </span>
                    </div>
                </div>
                <div className="relative">
                    <img 
                        src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop'} 
                        alt="User" 
                        className="w-11 h-11 rounded-full border-2 border-indigo-300 shadow-md object-cover"
                    />
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-indigo-900 rounded-full"></div>
                </div>
                <ChevronDown size={16} className="text-indigo-300" />
             </div>
          </div>
        </div>
      </header>

      {/* Modern Sub-navigation (Sticky) */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <nav className="flex space-x-1">
             <button 
                onClick={() => setActiveTab('processos')}
                className={`px-6 py-4 text-sm font-bold flex items-center gap-2.5 transition-all relative ${
                  activeTab === 'processos' 
                    ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' 
                    : 'text-gray-500 hover:text-indigo-500 hover:bg-gray-50'
                }`}
             >
                <List size={18} className={activeTab === 'processos' ? 'text-indigo-600' : 'text-gray-400'} />
                Meus Processos
             </button>
             <button 
                onClick={() => setActiveTab('nova')}
                className={`px-6 py-4 text-sm font-bold flex items-center gap-2.5 transition-all relative ${
                  activeTab === 'nova' 
                    ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' 
                    : 'text-gray-500 hover:text-indigo-500 hover:bg-gray-50'
                }`}
             >
                <PlusCircle size={18} className={activeTab === 'nova' ? 'text-indigo-600' : 'text-gray-400'} />
                Nova Solicitação
             </button>
           </nav>
         </div>
      </div>
      
      {/* Content */}
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {activeTab === 'processos' ? (
          <div className="space-y-8 animate-fade-in">
            
            {/* Welcome Section */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                      {isMagistrado ? 'Olá, Excelência.' : `Olá, ${currentUser?.nome?.split(' ')[0] || 'Servidor'}.`}
                    </h2>
                    <p className="text-gray-500">Acompanhe suas solicitações e mantenha suas prestações de contas em dia.</p>
                </div>
                <button 
                    onClick={() => setActiveTab('nova')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all hover:-translate-y-1"
                >
                    Nova Solicitação
                </button>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                  <Clock size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.emAndamento}</p>
                  <p className="text-sm text-gray-500 font-medium">Processos em Andamento</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-green-50 text-green-600 rounded-full">
                  <CheckCircle size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.aprovadas}</p>
                  <p className="text-sm text-gray-500 font-medium">Solicitações Aprovadas</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-orange-50 text-orange-600 rounded-full">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendentes}</p>
                  <p className="text-sm text-gray-500 font-medium">Aguardando Prest. Contas</p>
                </div>
              </div>
            </div>
            
            {/* Requests List */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FileText size={20} className="text-indigo-600" />
                Minhas Solicitações Recentes
              </h3>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Search */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="relative w-64">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar por NUP, destino..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                {isLoading ? (
                  <div className="p-12 flex items-center justify-center">
                    <Loader2 size={32} className="animate-spin text-indigo-500" />
                  </div>
                ) : filteredSolicitacoes.length === 0 ? (
                  <div className="p-12 text-center">
                    <Plane size={48} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500 font-medium">Nenhuma solicitação encontrada</p>
                    <button
                      onClick={() => setActiveTab('nova')}
                      className="mt-4 text-indigo-600 font-bold text-sm hover:underline"
                    >
                      Criar primeira solicitação
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredSolicitacoes.map(req => (
                      <div key={req.id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <TypeBadge type="DIARIA" />
                              <span className="text-sm font-bold text-gray-900">{req.nup}</span>
                            </div>
                            <p className="text-gray-700 font-medium">{req.motivo}</p>
                            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                              <MapPin size={12} />
                              Destino: {req.destino || 'N/A'} • Data: {new Date(req.data_inicio || req.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>

                          <div className="flex flex-col md:items-end gap-2 min-w-[150px]">
                            <StatusBadge status={req.status} />

                            {/* Accountability Button */}
                            {req.status === 'APROVADO' && (
                              <button 
                                onClick={() => handleOpenAccountability(req)}
                                className="flex items-center justify-center gap-1 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 px-3 py-1.5 rounded-lg transition-colors w-full"
                              >
                                <Upload size={12} />
                                Prestar Contas
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in">
            <PortalNewRequest 
              onBack={() => setActiveTab('processos')}
              onSubmit={handleNewRequestSubmit}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 mt-auto">
         <div className="max-w-7xl mx-auto px-4 flex flex-col items-center justify-center gap-2">
            <div className="text-sm font-medium text-gray-500">
                &copy; {new Date().getFullYear()} Tribunal de Justiça do Estado do Pará
            </div>
            <p className="text-xs text-gray-400">Sistema de Gestão de Diárias e Passagens - Módulo do Servidor v2.0</p>
         </div>
      </footer>

      {/* Accountability Modal */}
      <AccountabilityModal 
        isOpen={accountabilityModalOpen}
        onClose={() => setAccountabilityModalOpen(false)}
        request={selectedRequest}
        onSubmit={handleSubmitAccountability}
      />
    </div>
  );
};

export default ServidorPortal;
