import React, { useMemo, useState } from 'react';
import { Landmark, TrendingUp, AlertTriangle, PenTool, Search, CheckSquare, Eye, Wallet, PieChart, UserPlus, X } from 'lucide-react';
import StatCard from './StatCard';
import SefinAuthorizationModal from './SefinAuthorizationModal';
import { SefinTeamPanel } from './SefinTeamPanel';
import { MOCK_SEFIN_REQUESTS, SEFIN_ORDENADORES, SefinRequest, SefinOrdenador } from './types';

export const SefinCockpit: React.FC = () => {
  const [requests, setRequests] = useState<SefinRequest[]>(MOCK_SEFIN_REQUESTS);
  const [ordenadores, setOrdenadores] = useState<SefinOrdenador[]>(SEFIN_ORDENADORES);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeRequest, setActiveRequest] = useState<SefinRequest | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assigningRequestId, setAssigningRequestId] = useState<string | null>(null);

  // Mock current user (would come from auth context in production)
  const currentUserEmail = 'ordenador01@tjpa.jus.br';

  // Filter logic: Show items waiting for SEFIN signature
  const pendingSignatures = useMemo(() => {
    return requests.filter(r => r.status === 'AGUARDANDO_ASSINATURA_SEFIN');
  }, [requests]);

  // Mock Budget Logic
  const budgetStats = useMemo(() => {
      const initialBudget = 2500000;
      const authorizedTodayCount = requests.filter(r => r.status === 'APROVADO' && r.expenseAuthorizedBy).length;
      const authorizedTodayValue = requests
        .filter(r => r.status === 'APROVADO' && r.expenseAuthorizedBy)
        .reduce((acc, curr) => acc + (curr.value || 0), 0);
      
      const retainedCount = requests.filter(r => r.status === 'REJEITADO').length;

      return {
          waiting: pendingSignatures.length,
          balance: initialBudget - authorizedTodayValue,
          authorizedTodayCount,
          authorizedTodayValue,
          retainedCount
      };
  }, [requests, pendingSignatures]);

  // Update ordenadores stats based on assigned requests
  const ordenadoresWithStats = useMemo(() => {
    return ordenadores.map(ord => {
      const assignedRequests = requests.filter(r => r.assignedTo === ord.id && r.status === 'AGUARDANDO_ASSINATURA_SEFIN');
      return {
        ...ord,
        activeProcesses: assignedRequests.length,
        capacity: Math.min(100, assignedRequests.length * 20)
      };
    });
  }, [ordenadores, requests]);

  // Selection Handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.checked) {
          setSelectedIds(pendingSignatures.map(r => r.id));
      } else {
          setSelectedIds([]);
      }
  };

  const handleSelectOne = (id: string) => {
      if (selectedIds.includes(id)) {
          setSelectedIds(prev => prev.filter(item => item !== id));
      } else {
          setSelectedIds(prev => [...prev, id]);
      }
  };

  // Action Handlers
  const handleOpenModal = (req: SefinRequest) => {
      setActiveRequest(req);
      setIsModalOpen(true);
  };

  const handleAuthorize = (requestId: string) => {
      const currentOrdenador = ordenadores.find(o => o.email === currentUserEmail);
      setRequests(prev => prev.map(r => 
          r.id === requestId 
          ? { ...r, status: 'APROVADO', expenseAuthorizedBy: currentOrdenador?.name || 'Ordenador SEFIN' } 
          : r
      ));
  };

  const handleBatchAuthorize = () => {
      if (confirm(`Confirma a assinatura em lote de ${selectedIds.length} processos?`)) {
        const currentOrdenador = ordenadores.find(o => o.email === currentUserEmail);
        setRequests(prev => prev.map(r => 
            selectedIds.includes(r.id)
            ? { ...r, status: 'APROVADO', expenseAuthorizedBy: currentOrdenador?.name || 'Ordenador SEFIN' }
            : r
        ));
        setSelectedIds([]);
      }
  };

  const handleReject = (requestId: string) => {
      setRequests(prev => prev.map(r => 
        r.id === requestId 
        ? { ...r, status: 'REJEITADO', description: r.description + " [Devolvido p/ AJSEFIN]" } 
        : r
      ));
  };

  // Assignment Handlers
  const openAssignModal = (requestId: string) => {
    setAssigningRequestId(requestId);
    setIsAssignModalOpen(true);
  };

  const handleAssignTo = (ordenadorId: string) => {
    if (assigningRequestId) {
      setRequests(prev => prev.map(r => 
        r.id === assigningRequestId 
        ? { ...r, assignedTo: ordenadorId } 
        : r
      ));
      setIsAssignModalOpen(false);
      setAssigningRequestId(null);
    }
  };

  const handleBatchAssign = (ordenadorId: string) => {
    if (selectedIds.length > 0) {
      setRequests(prev => prev.map(r => 
        selectedIds.includes(r.id)
        ? { ...r, assignedTo: ordenadorId }
        : r
      ));
      setSelectedIds([]);
    }
  };

  const getOrdenadorName = (ordenadorId?: string) => {
    if (!ordenadorId) return null;
    const ord = ordenadores.find(o => o.id === ordenadorId);
    return ord?.name?.split(' ').slice(0, 2).join(' ') || null;
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8">
      
        {/* Executive Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
              <div className="flex items-center gap-2 mb-1">
                  <span className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded text-xs font-bold uppercase border border-slate-700">
                      Gabinete SEFIN
                  </span>
                  <span className="text-gray-400 text-xs font-medium"> &gt; Ordenação de Despesa</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Painel do Ordenador</h2>
          </div>
          <div className="flex gap-3">
              <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                      type="text" 
                      placeholder="Buscar PCD..." 
                      className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none w-64"
                  />
              </div>
              <button 
                  onClick={handleBatchAuthorize}
                  disabled={selectedIds.length === 0}
                  className="px-6 py-2.5 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 shadow-lg shadow-green-200 flex items-center gap-2 disabled:opacity-50 disabled:shadow-none transition-all"
              >
                  <PenTool size={18} />
                  Assinar Lote ({selectedIds.length})
              </button>
          </div>
        </div>

        {/* Financial KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="cursor-pointer">
              <StatCard 
                  title="Aguardando Assinatura"
                  subtitle="Fluxo de Saída"
                  count={budgetStats.waiting}
                  icon={PenTool}
                  colorClass="border-l-orange-500"
                  iconBgClass="bg-orange-50"
                  iconColorClass="text-orange-600"
                  footer={<span className="text-orange-600 font-bold text-xs flex items-center gap-1"><AlertTriangle size={12}/> Prioridade Alta</span>}
              />
          </div>
          
          <div className="cursor-pointer">
              <StatCard 
                  title="Saldo da Dotação"
                  subtitle="Disponível"
                  count={0}
                  icon={Wallet}
                  colorClass="border-l-green-500"
                  iconBgClass="bg-green-50"
                  iconColorClass="text-green-600"
                  footer={
                      <div className="w-full">
                          <div className="text-2xl font-bold text-green-700 -mt-8 mb-1">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(budgetStats.balance)}
                          </div>
                          <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-green-500 h-full w-[70%]"></div>
                          </div>
                      </div>
                  }
              />
          </div>

          <div className="cursor-pointer">
              <StatCard 
                  title="Autorizados Hoje"
                  subtitle={`${budgetStats.authorizedTodayCount} Processos`}
                  count={0}
                  icon={TrendingUp} 
                  colorClass="border-l-blue-500"
                  iconBgClass="bg-blue-50"
                  iconColorClass="text-blue-600"
                  footer={
                      <div className="text-xl font-bold text-blue-700 -mt-8">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(budgetStats.authorizedTodayValue)}
                      </div>
                  }
              />
          </div>

          <div className="cursor-pointer">
              <StatCard 
                  title="Retidos / Devolvidos"
                  subtitle="Controle Interno"
                  count={budgetStats.retainedCount}
                  icon={PieChart}
                  colorClass="border-l-red-500"
                  iconBgClass="bg-red-50"
                  iconColorClass="text-red-600"
                  footer={<span className="text-gray-400 text-xs">Necessitam ajuste</span>}
              />
          </div>
        </div>

        {/* Team Panel */}
        <SefinTeamPanel 
          ordenadores={ordenadoresWithStats}
          currentUserEmail={currentUserEmail}
          onAssignTo={handleBatchAssign}
        />

        {/* Signature Queue Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <CheckSquare size={18} className="text-slate-600" /> Fila de Autorização
              </h3>
              <div className="flex items-center gap-3">
                {selectedIds.length > 0 && (
                  <div className="flex gap-2">
                    {ordenadores.map(ord => (
                      <button
                        key={ord.id}
                        onClick={() => handleBatchAssign(ord.id)}
                        className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded flex items-center gap-1"
                      >
                        <UserPlus size={12} />
                        Atribuir a {ord.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                )}
                <span className="text-xs font-medium text-gray-500 bg-white px-3 py-1 rounded border border-gray-200">
                    {pendingSignatures.length} Pendentes
                </span>
              </div>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-[auto_1.2fr_1.2fr_1fr_0.8fr_1fr_auto] gap-4 px-6 py-3 bg-white border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider items-center">
              <div className="w-5">
                  <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      onChange={handleSelectAll}
                      checked={pendingSignatures.length > 0 && selectedIds.length === pendingSignatures.length}
                  />
              </div>
              <div>Processo / Beneficiário</div>
              <div>Rota / Objeto</div>
              <div>Parecer</div>
              <div>Responsável</div>
              <div className="text-right pr-4">Valor Total</div>
              <div className="text-right">Ações</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-50">
              {pendingSignatures.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">
                      <CheckSquare size={48} className="mx-auto text-gray-200 mb-4" />
                      <p>Nenhum processo aguardando assinatura.</p>
                  </div>
              ) : (
                  pendingSignatures.map(req => (
                      <div key={req.id} className={`grid grid-cols-[auto_1.2fr_1.2fr_1fr_0.8fr_1fr_auto] gap-4 px-6 py-4 items-center hover:bg-slate-50 transition-colors ${selectedIds.includes(req.id) ? 'bg-green-50/30' : ''}`}>
                          <div className="w-5">
                              <input 
                                  type="checkbox" 
                                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                                  checked={selectedIds.includes(req.id)}
                                  onChange={() => handleSelectOne(req.id)}
                              />
                          </div>
                          
                          <div>
                              <div className="font-bold text-gray-800 text-sm">{req.protocol}</div>
                              <div className="text-xs text-gray-500 font-medium">{req.requesterName}</div>
                          </div>

                          <div>
                              <div className="font-medium text-gray-700 text-sm">{req.destination || 'Deslocamento Interno'}</div>
                              <div className="text-xs text-gray-400 truncate max-w-[180px]">{req.description}</div>
                          </div>

                          <div>
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-100 text-[10px] font-bold uppercase">
                                  <Landmark size={12} /> Minuta Anexa
                              </span>
                          </div>

                          <div>
                              {req.assignedTo ? (
                                <button
                                  onClick={() => openAssignModal(req.id)}
                                  className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                                >
                                  {getOrdenadorName(req.assignedTo)}
                                </button>
                              ) : (
                                <button
                                  onClick={() => openAssignModal(req.id)}
                                  className="text-xs font-medium text-gray-400 hover:text-blue-600 flex items-center gap-1"
                                >
                                  <UserPlus size={12} /> Atribuir
                                </button>
                              )}
                          </div>

                          <div className="text-right pr-4">
                              <div className="font-mono font-bold text-gray-900">
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(req.value || 0)}
                              </div>
                          </div>

                          <div className="flex justify-end gap-2">
                              <button 
                                  onClick={() => handleOpenModal(req)}
                                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                                  title="Visualizar Minuta"
                              >
                                  <Eye size={18} />
                              </button>
                              <button 
                                  onClick={() => {
                                      if(confirm('Confirmar assinatura individual?')) handleAuthorize(req.id);
                                  }}
                                  className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" 
                                  title="Assinar Rápido"
                              >
                                  <PenTool size={18} />
                              </button>
                          </div>
                      </div>
                  ))
              )}
          </div>
        </div>
      </div>

      {/* Authorization Modal */}
      <SefinAuthorizationModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        request={activeRequest}
        onConfirm={handleAuthorize}
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
              <p className="text-sm text-gray-500 mb-4">Selecione o ordenador responsável:</p>
              {ordenadores.map(ord => (
                <button
                  key={ord.id}
                  onClick={() => handleAssignTo(ord.id)}
                  className="w-full flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all text-left"
                >
                  <img src={ord.avatarUrl} alt={ord.name} className="w-12 h-12 rounded-full object-cover border-2 border-gray-100" />
                  <div>
                    <p className="font-bold text-gray-800">{ord.name}</p>
                    <p className="text-xs text-gray-500">{ord.cargo}</p>
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

export default SefinCockpit;
