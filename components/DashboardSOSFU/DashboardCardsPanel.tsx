import React from 'react';
import { Inbox, UserCog, ShieldCheck, CheckSquare, FileSearch, Database } from 'lucide-react';
import { SOSFUStats } from '../../hooks/useSOSFUProcesses';
import { Skeleton } from '../ui/Skeleton';
import { MotionWrapper } from '../ui/MotionWrapper';

export type CardMode = 'CONCESSION' | 'PC';

interface DashboardCardsPanelProps {
  sosfuStats: SOSFUStats;
  mode?: CardMode; // Dynamic mode for labels
  isLoading?: boolean;
  onInboxClick: () => void;
  onMyTasksClick: () => void;
  onAwaitingSignClick: () => void;
  onFinanceClick: () => void;
}

export const DashboardCardsPanel: React.FC<DashboardCardsPanelProps> = ({
  sosfuStats,
  mode = 'CONCESSION',
  isLoading = false,
  onInboxClick,
  onMyTasksClick,
  onAwaitingSignClick,
  onFinanceClick
}) => {
  // Dynamic labels based on mode
  const labels = {
    card3Tag: mode === 'PC' ? 'Análise' : 'Fluxo SEFIN',
    card3Title: mode === 'PC' ? 'Em Análise' : 'Aguard. Assinatura',
    card3Sub1: mode === 'PC' ? 'Em auditoria' : 'Aguardando',
    card3Sub2: mode === 'PC' ? 'Aprovados' : 'Assinados',
    card4Tag: mode === 'PC' ? 'Baixa SIAFE' : 'Execuções',
    card4Title: mode === 'PC' ? 'Aguard. Baixa' : 'Aguard. PC',
    card4Sub: mode === 'PC' ? 'em processamento SIAFE' : 'em Auditoria Sentinela',
  };

  const card3Icon = mode === 'PC' ? FileSearch : ShieldCheck;
  const card4Icon = mode === 'PC' ? Database : CheckSquare;
  const Card3Icon = card3Icon;
  const Card4Icon = card4Icon;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {/* 📥 CAIXA DE ENTRADA */}
      {/* 📥 CAIXA DE ENTRADA */}
      <MotionWrapper 
        delay={0.1}
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
          {isLoading ? <Skeleton className="h-8 w-16 mb-1" /> : <h3 className="text-3xl font-black text-slate-800 mb-1">{sosfuStats.inbox.total}</h3>}
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide group-hover:text-blue-600">Novos Recebidos</p>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              {isLoading ? <Skeleton className="h-3 w-12" /> : <span className="text-[10px] font-bold text-slate-400">{sosfuStats.inbox.solicitacoes} Sol.</span>}
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
              {isLoading ? <Skeleton className="h-3 w-12" /> : <span className="text-[10px] font-bold text-slate-400">{sosfuStats.inbox.prestacoes} PC</span>}
            </div>
          </div>
        </div>
      </MotionWrapper>

      {/* 👤 MINHA MESA */}
      {/* 👤 MINHA MESA */}
      <MotionWrapper 
        delay={0.2}
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
          {isLoading ? <Skeleton className="h-8 w-16 mb-1" /> : <h3 className="text-3xl font-black text-slate-800 mb-1">{sosfuStats.myTasks}</h3>}
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide group-hover:text-purple-600">Atribuídos a Mim</p>
          <p className="text-[10px] text-slate-400 mt-1">Sua fila de trabalho</p>
        </div>
      </MotionWrapper>

      {/* 📤 CARD 3: FLUXO SEFIN / EM ANÁLISE (Dynamic) */}
      {/* 📤 CARD 3: FLUXO SEFIN / EM ANÁLISE (Dynamic) */}
      <MotionWrapper 
        delay={0.3}
        onClick={onAwaitingSignClick} 
        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group hover:border-amber-400 hover:shadow-md transition-all cursor-pointer"
      >
        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 group-hover:w-2 transition-all"></div>
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform">
            <Card3Icon size={20}/>
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">{labels.card3Tag}</span>
        </div>
        <div>
          {isLoading ? <Skeleton className="h-8 w-16 mb-1" /> : <h3 className="text-3xl font-black text-slate-800 mb-1">{sosfuStats.awaitingSignature + (sosfuStats.signed || 0)}</h3>}
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide group-hover:text-amber-600">{labels.card3Title}</p>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
              {isLoading ? <Skeleton className="h-3 w-12" /> : <span className="text-[10px] font-bold text-slate-400">{sosfuStats.awaitingSignature} {labels.card3Sub1}</span>}
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              {isLoading ? <Skeleton className="h-3 w-12" /> : <span className="text-[10px] font-bold text-slate-400">{sosfuStats.signed || 0} {labels.card3Sub2}</span>}
            </div>
          </div>
        </div>
      </MotionWrapper>

      {/* ✅ CARD 4: AGUARD. PC / AGUARD. BAIXA (Dynamic) */}
      {/* ✅ CARD 4: AGUARD. PC / AGUARD. BAIXA (Dynamic) */}
      <MotionWrapper 
        delay={0.4}
        onClick={onFinanceClick} 
        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer"
      >
        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 group-hover:w-2 transition-all"></div>
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
            <Card4Icon size={20}/>
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">{labels.card4Tag}</span>
        </div>
        <div>
          {isLoading ? <Skeleton className="h-8 w-16 mb-1" /> : <h3 className="text-3xl font-black text-slate-800 mb-1">{sosfuStats.awaitingPC}</h3>}
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide group-hover:text-emerald-600">{labels.card4Title}</p>
          <div className="flex items-center gap-1.5 mt-2">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
            {isLoading ? <Skeleton className="h-3 w-12" /> : <span className="text-[10px] font-bold text-slate-400">{sosfuStats.prestacoesAudit} {labels.card4Sub}</span>}
          </div>
        </div>
      </MotionWrapper>
    </div>
  );
};

