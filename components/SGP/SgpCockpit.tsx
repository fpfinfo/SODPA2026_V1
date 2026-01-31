import React, { useState } from 'react';
import { Users, AlertOctagon, CheckCircle2, Search, FileSearch, UserCheck, CreditCard, ExternalLink, UserPlus, X, Loader2 } from 'lucide-react';
import StatCard from './StatCard';
import SgpAnalysisModal from './SgpAnalysisModal';
import { SgpTeamPanel } from './SgpTeamPanel';
import { useSgpProcesses, SgpProcess } from '../../hooks/useSgpProcesses';
import { useToast } from '../ui/ToastProvider';

export const SgpCockpit: React.FC = () => {
  const { showToast } = useToast();
  const {
    processes,
    pendingValidation,
    analysts,
    stats,
    isLoading,
    currentUserEmail,
    assignToAnalyst,
    validateProcess,
    issueGlosa,
    returnToSOSFU,
    refresh
  } = useSgpProcesses();

  const [selectedRequest, setSelectedRequest] = useState<SgpProcess | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assigningRequestId, setAssigningRequestId] = useState<string | null>(null);

  // SGP Queue
  const sgpQueue = pendingValidation;

  // Map analysts to team format
  const teamWithStats = analysts.map(a => ({
    id: a.id,
    name: a.name,
    email: a.email,
    cargo: a.cargo,
    avatarUrl: a.avatarUrl,
    activeProcesses: a.activeProcesses,
    capacity: Math.min(100, a.activeProcesses * 20)
  }));

  // Handlers
  const handleOpenAnalysis = (req: SgpProcess) => {
    setSelectedRequest(req);
    setIsModalOpen(true);
  };

  const handleValidate = async (requestId: string) => {
    try {
      await validateProcess(requestId);
      showToast({ type: 'success', title: 'Servidor validado!', message: 'Processo encaminhado para SOSFU.' });
      setIsModalOpen(false);
    } catch (err) {
      showToast({ type: 'error', title: 'Erro ao validar', message: (err as Error).message });
    }
  };

  const handleReject = async (requestId: string, reason: string) => {
    try {
      await returnToSOSFU(requestId, reason);
      showToast({ type: 'info', title: 'Processo devolvido', message: 'Servidor irregular - devolvido para SOSFU.' });
      setIsModalOpen(false);
    } catch (err) {
      showToast({ type: 'error', title: 'Erro ao devolver', message: (err as Error).message });
    }
  };

  // Assignment
  const openAssignModal = (requestId: string) => {
    setAssigningRequestId(requestId);
    setIsAssignModalOpen(true);
  };

  const handleAssignTo = async (analystId: string) => {
    if (assigningRequestId) {
      try {
        await assignToAnalyst(assigningRequestId, analystId);
        showToast({ type: 'success', title: 'Processo atribuído!' });
        setIsAssignModalOpen(false);
        setAssigningRequestId(null);
      } catch (err) {
        showToast({ type: 'error', title: 'Erro ao atribuir', message: (err as Error).message });
      }
    }
  };

  const getAnalystName = (analystId?: string) => {
    if (!analystId) return null;
    const analyst = analysts.find(a => a.id === analystId);
    return analyst?.name?.split(' ').slice(0, 2).join(' ') || null;
  };

  const getStatusBadge = (erpStatus?: string) => {
    switch (erpStatus) {
      case 'IRREGULAR':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-100 text-[10px] font-bold uppercase animate-pulse">
            <AlertOctagon size={10} /> Irregular
          </span>
        );
      case 'GLOSA':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-100 text-[10px] font-bold uppercase">
            <CreditCard size={10} /> Glosa
          </span>
        );
      case 'REGULAR':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-100 text-[10px] font-bold uppercase">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Regular
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-50 text-gray-600 border border-gray-200 text-[10px] font-bold uppercase">
            <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div> Pendente
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={48} className="animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8">
      
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs font-bold uppercase border border-indigo-200">
                Gestão de Pessoas (SGP)
              </span>
              <span className="text-gray-400 text-xs font-medium"> &gt; Validação de Deslocamento</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Análise de Elegibilidade</h2>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar Matrícula..." 
                className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-64"
              />
            </div>
            <button className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 shadow-sm flex items-center gap-2">
              <ExternalLink size={18} />
              Consultar Ficha Funcional
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Aguardando Validação"
            subtitle="Fila de Entrada"
            count={stats.pendingValidation}
            icon={Users}
            colorClass="border-l-indigo-500"
            iconBgClass="bg-indigo-50"
            iconColorClass="text-indigo-600"
            footer={<span className="text-indigo-600 font-bold text-xs">Novos Pedidos</span>}
          />
          
          <StatCard 
            title="Conflitos Detectados"
            subtitle="Férias / Licenças"
            count={stats.glosaIssued}
            icon={AlertOctagon}
            colorClass="border-l-red-500"
            iconBgClass="bg-red-50"
            iconColorClass="text-red-600"
            footer={<span className="text-red-600 font-bold text-xs animate-pulse">Atenção Necessária</span>}
          />

          <StatCard 
            title="Validados"
            subtitle="Aprovados"
            count={stats.validated}
            icon={UserCheck} 
            colorClass="border-l-green-500"
            iconBgClass="bg-green-50"
            iconColorClass="text-green-600"
            footer={<span className="text-green-600 font-medium text-xs">Integrado ao MentorRH</span>}
          />

          <StatCard 
            title="Glosas Emitidas"
            subtitle="Valor Total"
            count={stats.glosaIssued}
            icon={CreditCard}
            colorClass="border-l-yellow-500"
            iconBgClass="bg-yellow-50"
            iconColorClass="text-yellow-600"
            footer={
              <span className="text-gray-600 text-xs font-bold">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalGlosaValue)}
              </span>
            }
          />
        </div>

        {/* Team Panel */}
        <SgpTeamPanel 
          team={teamWithStats}
          currentUserEmail={currentUserEmail}
          onAssignTo={handleAssignTo}
        />

        {/* Queue Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <FileSearch size={18} className="text-slate-600" /> Fila de Análise Funcional
            </h3>
            <span className="text-xs font-medium text-gray-500 bg-white px-3 py-1 rounded border border-gray-200">
              {sgpQueue.length} Pendentes
            </span>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_0.8fr_auto] gap-4 px-6 py-3 bg-white border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider items-center">
            <div>Servidor / Matrícula</div>
            <div>Data Solicitação</div>
            <div>Status no ERP</div>
            <div>Solicitação</div>
            <div>Responsável</div>
            <div className="text-right">Ação</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-50">
            {sgpQueue.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <CheckCircle2 size={48} className="mx-auto text-gray-200 mb-4" />
                <p>Nenhuma pendência de validação funcional.</p>
              </div>
            ) : (
              sgpQueue.map(req => (
                <div key={req.id} className="grid grid-cols-[1.5fr_1fr_1fr_1fr_0.8fr_auto] gap-4 px-6 py-4 items-center hover:bg-slate-50 transition-colors">
                  
                  <div>
                    <div className="font-bold text-gray-800 text-sm">{req.requesterName}</div>
                    <div className="text-xs text-gray-500 font-medium">Mat. {req.requesterMatricula || 'N/A'}</div>
                  </div>

                  <div>
                    <div className="font-medium text-gray-700 text-sm flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      {new Date(req.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>

                  <div>
                    {getStatusBadge(req.erpStatus)}
                  </div>

                  <div className="text-sm text-gray-600 truncate pr-4">
                    {req.description}
                  </div>

                  <div>
                    {req.assignedTo ? (
                      <button
                        onClick={() => openAssignModal(req.id)}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
                      >
                        {getAnalystName(req.assignedTo)}
                      </button>
                    ) : (
                      <button
                        onClick={() => openAssignModal(req.id)}
                        className="text-xs font-medium text-gray-400 hover:text-indigo-600 flex items-center gap-1"
                      >
                        <UserPlus size={12} /> Atribuir
                      </button>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <button 
                      onClick={() => handleOpenAnalysis(req)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-bold transition-colors border border-indigo-100"
                    >
                      <FileSearch size={14} />
                      Validar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Analysis Modal */}
      <SgpAnalysisModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        request={selectedRequest}
        onConfirm={handleValidate}
        onReject={handleReject}
      />

      {/* Assignment Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900 bg-opacity-50 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">Atribuir Documento</h3>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-sm text-gray-500 mb-4">Selecione o analista responsável:</p>
              {analysts.map(analyst => (
                <button
                  key={analyst.id}
                  onClick={() => handleAssignTo(analyst.id)}
                  className="w-full flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all text-left"
                >
                  <img src={analyst.avatarUrl} alt={analyst.name} className="w-12 h-12 rounded-full object-cover border-2 border-gray-100" />
                  <div>
                    <p className="font-bold text-gray-800">{analyst.name}</p>
                    <p className="text-xs text-gray-500">{analyst.cargo}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SgpCockpit;
