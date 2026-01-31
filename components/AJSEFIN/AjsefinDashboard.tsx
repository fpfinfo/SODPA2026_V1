import React, { useMemo, useState } from 'react';
import { Scale, FilePenLine, CheckCircle2, RefreshCcw, Plus, Filter, Users } from 'lucide-react';
import StatCard from './StatCard';
import TeamMemberRow from './TeamMemberRow';
import LegalAnalysisModal from './LegalAnalysisModal';
import { AJSEFIN_TEAM, MOCK_AJSEFIN_REQUESTS, AjsefinRequest } from './types';

export const AjsefinDashboard: React.FC = () => {
  const [requests, setRequests] = useState<AjsefinRequest[]>(MOCK_AJSEFIN_REQUESTS);
  const [selectedRequest, setSelectedRequest] = useState<AjsefinRequest | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // AJSEFIN Logic for KPIs
  const stats = useMemo(() => {
    // 1. Inbox for AJSEFIN
    const waiting = requests.filter(r => r.status === 'EM_ANALISE_AJSEFIN').length;
    // 2. Simulated "In Progress" (using a flag or just assigned to AJSEFIN team but not approved yet)
    const inProgress = requests.filter(r => r.status === 'EM_ANALISE_AJSEFIN' && r.assignedTo?.startsWith('aj')).length;
    // 3. Ready for SEFIN Signature (Passed AJSEFIN stage)
    const ready = requests.filter(r => r.status === 'AGUARDANDO_ASSINATURA_SEFIN').length;
    // 4. Adjustments (Returned) - Simulation
    const adjustments = requests.filter(r => r.status === 'REJEITADO' && r.assignedTo?.startsWith('aj')).length;

    return { waiting, inProgress, ready, adjustments };
  }, [requests]);

  const handleOpenEditor = (req: AjsefinRequest) => {
      setSelectedRequest(req);
      setIsEditorOpen(true);
  };

  const handleFinishOpinion = (requestId: string, opinion: string) => {
      setRequests(prev => prev.map(req => 
        req.id === requestId 
        ? { 
            ...req, 
            status: 'AGUARDANDO_ASSINATURA_SEFIN', 
            legalOpinion: opinion,
            legalOpinionAuthor: 'Dr. Simulador' 
          }
        : req
      ));
      setIsEditorOpen(false);
  };

  // Only show requests relevant to AJSEFIN in the list
  const ajsefinRequests = requests.filter(r => r.status === 'EM_ANALISE_AJSEFIN' || r.status === 'AGUARDANDO_ASSINATURA_SEFIN');

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8">
      
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
              <div className="flex items-center gap-2 mb-1">
                  <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-bold uppercase border border-slate-200">
                      Mesa Jurídica AJSEFIN
                  </span>
                  <span className="text-gray-400 text-xs font-medium"> &gt; Visão Geral</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Controle de Legalidade</h2>
          </div>
          <div className="flex gap-2">
              <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2 shadow-sm">
                  <Filter size={16} /> Filtros
              </button>
              <button className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-900 shadow-md flex items-center gap-2">
                  <Plus size={18} /> Nova Minuta Avulsa
              </button>
          </div>
        </div>

        {/* KPI Cards - Specific for Legal Flow */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div onClick={() => {}} className="cursor-pointer">
              <StatCard 
                  title="Aguardando Parecer"
                  subtitle="Caixa de Entrada"
                  count={stats.waiting}
                  icon={Scale}
                  colorClass="border-l-blue-500"
                  iconBgClass="bg-blue-50"
                  iconColorClass="text-blue-600"
                  footer={<span className="text-blue-600 font-medium text-xs">Novas solicitações</span>}
              />
          </div>
          
          <div onClick={() => {}} className="cursor-pointer">
              <StatCard 
                  title="Em Redação"
                  subtitle="Minutas em Andamento"
                  count={stats.inProgress}
                  icon={FilePenLine}
                  colorClass="border-l-amber-500"
                  iconBgClass="bg-amber-50"
                  iconColorClass="text-amber-600"
                  footer={<span className="text-gray-400 text-xs">Distribuídos à equipe</span>}
              />
          </div>

          <div onClick={() => {}} className="cursor-pointer">
              <StatCard 
                  title="Prontos p/ Assinatura"
                  subtitle="Enviados à SEFIN"
                  count={stats.ready}
                  icon={CheckCircle2} 
                  colorClass="border-l-green-500"
                  iconBgClass="bg-green-50"
                  iconColorClass="text-green-600"
                  footer={<span className="text-green-600 font-medium text-xs">Aguardando Ordenador</span>}
              />
          </div>

          <div onClick={() => {}} className="cursor-pointer">
              <StatCard 
                  title="Ajustes Solicitados"
                  subtitle="Devoluções"
                  count={stats.adjustments}
                  icon={RefreshCcw}
                  colorClass="border-l-red-500"
                  iconBgClass="bg-red-50"
                  iconColorClass="text-red-600"
                  footer={<span className="text-red-600 font-medium text-xs">Prioridade Alta</span>}
              />
          </div>
        </div>

        {/* Main Layout Grid - Optimized for better spacing (7/5 split) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            
            {/* Main List: Requests needing action */}
            <div className="xl:col-span-7">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                          <h3 className="font-bold text-gray-800 flex items-center gap-2">
                              <Scale size={18} className="text-slate-600" /> Processos na Fila
                          </h3>
                      </div>
                      <div className="divide-y divide-gray-100">
                          {ajsefinRequests.length === 0 ? (
                              <div className="p-8 text-center text-gray-500">Nenhum processo pendente.</div>
                          ) : (
                              ajsefinRequests.map(req => (
                                  <div key={req.id} className="p-5 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                                      <div className="flex items-start gap-4">
                                          <div className={`mt-1 p-2 rounded-lg ${req.status === 'AGUARDANDO_ASSINATURA_SEFIN' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                              <FilePenLine size={20} />
                                          </div>
                                          <div>
                                              <div className="flex items-center gap-2">
                                                  <span className="font-bold text-gray-900">{req.protocol}</span>
                                                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium border border-gray-200">{req.type}</span>
                                              </div>
                                              <p className="text-sm text-gray-600 mt-1 line-clamp-1">{req.description}</p>
                                              <div className="flex gap-4 mt-2 text-xs text-gray-400">
                                                  <span>{req.requesterName}</span>
                                                  <span>•</span>
                                                  <span>{req.destination}</span>
                                              </div>
                                          </div>
                                      </div>
                                      <div>
                                          {req.status === 'EM_ANALISE_AJSEFIN' ? (
                                              <button 
                                                  onClick={() => handleOpenEditor(req)}
                                                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded shadow-sm transition-colors opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transform duration-200"
                                              >
                                                  Redigir Minuta
                                              </button>
                                          ) : (
                                              <span className="text-xs font-bold text-green-600 px-3 py-1 bg-green-50 rounded-full border border-green-100">
                                                  Enviado SEFIN
                                              </span>
                                          )}
                                      </div>
                                  </div>
                              ))
                          )}
                      </div>
                </div>
            </div>

            {/* Team Management Sidebar - Now wider and using compact rows */}
            <div className="xl:col-span-5">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-24">
                  <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                          <Users size={18} className="text-gray-500" />
                          <h3 className="font-bold text-gray-800 text-sm uppercase">Carga da Equipe</h3>
                      </div>
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          {AJSEFIN_TEAM.reduce((acc, curr) => acc + curr.activeProcesses, 0)} Ativos
                      </span>
                  </div>
                  <div>
                      {AJSEFIN_TEAM.map(member => (
                          <TeamMemberRow key={member.id} member={member} compact={true} />
                      ))}
                  </div>
                  <div className="p-4 bg-gray-50 border-t border-gray-200 text-center">
                      <button className="text-xs font-bold text-blue-600 hover:text-blue-800">Gerenciar Escala &rarr;</button>
                  </div>
                </div>
            </div>

        </div>
      </div>

      <LegalAnalysisModal 
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        request={selectedRequest}
        onConfirm={handleFinishOpinion}
      />
    </div>
  );
};

export default AjsefinDashboard;
