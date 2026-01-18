import React from 'react';
import { Inbox, UserCog, ShieldCheck, CheckSquare } from 'lucide-react';
import { SOSFUStats } from '../../hooks/useSOSFUProcesses';

interface DashboardCardsPanelProps {
  sosfuStats: SOSFUStats;
  onInboxClick: () => void;
  onMyTasksClick: () => void;
  onAwaitingSignClick: () => void;
  onFinanceClick: () => void;
}

export const DashboardCardsPanel: React.FC<DashboardCardsPanelProps> = ({
  sosfuStats,
  onInboxClick,
  onMyTasksClick,
  onAwaitingSignClick,
  onFinanceClick
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {/* 📥 NOVOS RECEBIDOS (SOL + PC) */}
      <div 
        onClick={onInboxClick} 
        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"
      >
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 group-hover:w-2 transition-all"></div>
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
            <Inbox size={20}/>
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">Caixa de Entrada</span>
        </div>
        <div>
          <h3 className="text-3xl font-black text-slate-800 mb-1">{sosfuStats.inbox.total}</h3>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide group-hover:text-blue-600">Novos Recebidos</p>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              <span className="text-[10px] font-bold text-slate-400">{sosfuStats.inbox.solicitacoes} Sol.</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
              <span className="text-[10px] font-bold text-slate-400">{sosfuStats.inbox.prestacoes} PC</span>
            </div>
          </div>
        </div>
      </div>

      {/* 👤 MINHA MESA */}
      <div 
        onClick={onMyTasksClick} 
        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group hover:border-purple-400 hover:shadow-md transition-all cursor-pointer"
      >
        <div className="absolute top-0 left-0 w-1 h-full bg-purple-500 group-hover:w-2 transition-all"></div>
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition-transform">
            <UserCog size={20}/>
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">Minha Mesa</span>
        </div>
        <div>
          <h3 className="text-3xl font-black text-slate-800 mb-1">{sosfuStats.myTasks}</h3>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide group-hover:text-purple-600">Atribuídos a Mim</p>
          <p className="text-[10px] text-slate-400 mt-1">Sua fila de trabalho</p>
        </div>
      </div>

      {/* 📤 AGUARDANDO ASSINATURA */}
      <div 
        onClick={onAwaitingSignClick} 
        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group hover:border-amber-400 hover:shadow-md transition-all cursor-pointer"
      >
        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 group-hover:w-2 transition-all"></div>
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform">
            <ShieldCheck size={20}/>
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">Fluxo SEFIN</span>
        </div>
        <div>
          <h3 className="text-3xl font-black text-slate-800 mb-1">{sosfuStats.awaitingSignature}</h3>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide group-hover:text-amber-600">Aguard. Assinatura</p>
          <div className="flex items-center gap-1.5 mt-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
            <span className="text-[10px] font-bold text-slate-400">{sosfuStats.solicitacoesAnalysis} em Análise Técnica</span>
          </div>
        </div>
      </div>

      {/* ✅ AGUARDANDO PRESTAÇÃO DE CONTAS */}
      <div 
        onClick={onFinanceClick} 
        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer"
      >
        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 group-hover:w-2 transition-all"></div>
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
            <CheckSquare size={20}/>
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">Execuções</span>
        </div>
        <div>
          <h3 className="text-3xl font-black text-slate-800 mb-1">{sosfuStats.awaitingPC}</h3>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide group-hover:text-emerald-600">Aguard. PC</p>
          <div className="flex items-center gap-1.5 mt-2">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
            <span className="text-[10px] font-bold text-slate-400">{sosfuStats.prestacoesAudit} em Auditoria Sentinela</span>
          </div>
        </div>
      </div>
    </div>
  );
};
