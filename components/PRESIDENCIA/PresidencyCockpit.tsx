import React, { useState } from 'react';
import { Globe, Clock, Plane, TrendingUp, Map, CheckSquare, FileCheck, Calendar, Gavel, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';
import StatCard from './StatCard';
import PresidencyBriefingModal from './PresidencyBriefingModal';
import RepresentationMapModal from './RepresentationMapModal';
import { usePresidencyProcesses, PresidencyProcess } from '../../hooks/usePresidencyProcesses';
import { useToast } from '../ui/ToastProvider';

export const PresidencyCockpit: React.FC = () => {
  const { showToast } = useToast();
  const {
    pendingList,
    activeTravelers,
    stats,
    isLoading,
    authorizeProcess,
    rejectProcess,
    refresh
  } = usePresidencyProcesses();

  const [selectedRequest, setSelectedRequest] = useState<PresidencyProcess | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);

  const handleOpenBriefing = (req: PresidencyProcess) => {
    setSelectedRequest(req);
    setIsModalOpen(true);
  };

  const handleAuthorize = async (requestId: string) => {
    try {
      await authorizeProcess(requestId);
      showToast({ type: 'success', title: 'Autorizado!', message: 'Deslocamento aprovado pela Presidência.' });
      setIsModalOpen(false);
    } catch (err) {
      showToast({ type: 'error', title: 'Erro', message: (err as Error).message });
    }
  };

  const handleReject = async (requestId: string, reason: string) => {
    try {
      await rejectProcess(requestId, reason);
      showToast({ type: 'info', title: 'Indeferido', message: 'Solicitação devolvida à SODPA.' });
      setIsModalOpen(false);
    } catch (err) {
      showToast({ type: 'error', title: 'Erro', message: (err as Error).message });
    }
  };

  const getDaysUntilTravel = (deadline?: string) => {
    if (!deadline) return null;
    const today = new Date();
    const travelDate = new Date(deadline);
    const diffDays = Math.ceil((travelDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={48} className="animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8">
      
        {/* Executive Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-gradient-to-r from-slate-900 to-slate-800 text-amber-400 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest border border-slate-700 shadow-md">
                <Gavel size={12} className="inline mr-1" />
                Gabinete da Presidência
              </span>
              <span className="text-gray-400 text-xs font-medium uppercase tracking-wide"> &gt; Autorização de Deslocamentos</span>
            </div>
            <h2 className="text-3xl font-serif font-bold text-slate-800">Visão Estratégica</h2>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setIsMapOpen(true)}
              className="px-5 py-3 bg-white border border-gray-300 text-slate-700 rounded-xl text-sm font-bold hover:bg-gray-50 flex items-center gap-2 shadow-sm transition-all hover:-translate-y-0.5"
            >
              <Map size={18} className="text-blue-600" />
              Mapa de Representação
              {stats.riskyLocations > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full animate-pulse">
                  {stats.riskyLocations}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Strategic KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Aguardando Deliberação"
            subtitle="Viagens externas pendentes"
            count={stats.pending}
            icon={FileCheck}
            colorClass="border-l-amber-500"
            iconBgClass="bg-amber-50"
            iconColorClass="text-amber-600"
          />
          
          <StatCard 
            title="Em Trânsito Agora"
            subtitle="Magistrados/Servidores fora"
            count={stats.inTransit}
            icon={Globe}
            colorClass="border-l-blue-500"
            iconBgClass="bg-blue-50"
            iconColorClass="text-blue-600"
            onClick={() => setIsMapOpen(true)}
            footer={stats.riskyLocations > 0 && (
              <span className="text-xs font-bold text-red-600 animate-pulse flex items-center gap-1">
                <AlertTriangle size={12} /> {stats.riskyLocations} alerta
              </span>
            )}
          />

          <StatCard 
            title="Urgência (48h)"
            subtitle="Requerem atenção imediata"
            count={stats.urgent}
            icon={Clock}
            colorClass="border-l-red-500"
            iconBgClass="bg-red-50"
            iconColorClass="text-red-600"
          />

          <StatCard 
            title="Gasto Mensal Externo"
            subtitle="Acumulado Interestadual"
            count={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(stats.monthlyCost) as string}
            icon={TrendingUp}
            colorClass="border-l-slate-500"
            iconBgClass="bg-slate-100"
            iconColorClass="text-slate-600"
          />
        </div>

        {/* The "Agenda" List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-white flex justify-between items-center">
            <div>
              <h3 className="text-lg font-serif font-bold text-slate-800 flex items-center gap-2">
                Agenda de Deslocamentos Pendentes
              </h3>
              <p className="text-sm text-gray-500">Solicitações que aguardam sua assinatura digital.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold bg-amber-100 text-amber-800 px-3 py-1 rounded-full border border-amber-200">
                {pendingList.length} Itens
              </span>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {pendingList.length === 0 ? (
              <div className="p-16 text-center">
                <CheckSquare size={64} className="mx-auto text-gray-200 mb-6" />
                <h4 className="text-xl font-bold text-gray-400">Tudo em dia, Excelência.</h4>
                <p className="text-gray-400">Nenhuma solicitação pendente de deliberação.</p>
              </div>
            ) : (
              pendingList.map(req => {
                const daysUntil = getDaysUntilTravel(req.deadline);
                const isUrgent = daysUntil !== null && daysUntil <= 3;
                
                return (
                  <div 
                    key={req.id} 
                    className={`p-6 hover:bg-slate-50 transition-colors flex flex-col lg:flex-row items-start lg:items-center gap-6 group ${isUrgent ? 'bg-red-50/30' : ''}`}
                  >
                    {/* 1. Who (Avatar) */}
                    <div className="flex items-center gap-4 min-w-[250px]">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 font-serif font-bold text-xl border-2 border-white shadow-lg">
                        {req.requesterName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-base">{req.requesterName}</h4>
                        <p className="text-xs text-amber-600 uppercase font-bold tracking-wide">Magistrado</p>
                      </div>
                    </div>

                    {/* 2. Where & Why (The Core) */}
                    <div className="flex-1 border-l-2 border-gray-100 pl-6">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Plane size={14} className="text-amber-500" />
                        <span className="font-bold text-slate-800">{req.destination || 'Destino'}</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-sm text-gray-600 flex items-center gap-1">
                          <Calendar size={12} />
                          {req.deadline ? new Date(req.deadline).toLocaleDateString('pt-BR') : 'Data N/D'}
                        </span>
                        {isUrgent && (
                          <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full border border-red-200 animate-pulse">
                            URGENTE - {daysUntil}d
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600 text-sm leading-relaxed line-clamp-2 italic">
                        "{req.description}"
                      </p>
                    </div>

                    {/* 3. Status & Action */}
                    <div className="flex items-center gap-4 min-w-[220px] justify-end">
                      <div className="text-right mr-4">
                        <span className="block text-xs font-bold text-gray-400 uppercase">Valor Est.</span>
                        <span className="font-mono font-bold text-slate-800 text-lg">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(req.value || 0)}
                        </span>
                      </div>
                      
                      <button 
                        onClick={() => handleOpenBriefing(req)}
                        className="bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-slate-200 transition-all transform hover:-translate-y-0.5 whitespace-nowrap flex items-center gap-2"
                      >
                        Analisar
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <PresidencyBriefingModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        request={selectedRequest}
        onConfirm={handleAuthorize}
        onReject={handleReject}
      />

      <RepresentationMapModal 
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
      />
    </div>
  );
};

export default PresidencyCockpit;
