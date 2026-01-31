import React, { useEffect, useState } from 'react';
import { Inbox, UserCog, FileText, ShieldCheck, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { SOSFUStats } from '../../hooks/useSOSFUProcesses';
import { Skeleton } from '../ui/Skeleton';
import { MotionWrapper } from '../ui/MotionWrapper';

export type CardMode = 'CONCESSION' | 'PC';

// Trend indicator component
const TrendIndicator: React.FC<{ current: number; previous: number; invertColors?: boolean }> = ({ 
  current, previous, invertColors = false 
}) => {
  const delta = current - previous;
  if (delta === 0 || previous === 0) return null;
  
  const isPositive = delta > 0;
  // For some metrics, lower is better (e.g., pending items)
  const isGood = invertColors ? !isPositive : isPositive;
  
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${
      isGood ? 'text-emerald-600' : 'text-rose-500'
    }`}>
      {isPositive ? <TrendingUp size={10}/> : <TrendingDown size={10}/>}
      {isPositive ? '+' : ''}{delta}
    </span>
  );
};

interface DashboardCardsPanelProps {
  sosfuStats: SOSFUStats;
  mode?: CardMode;
  isLoading?: boolean;
  onInboxClick: () => void;
  onMyTasksSolicitacoesClick: () => void;
  onMyTasksPrestacoesClick: () => void;
  onAwaitingSignClick: () => void;
  // Legacy props for compatibility
  onMyTasksClick?: () => void;
  onFinanceClick?: () => void;
}

const STATS_STORAGE_KEY = 'sosfu_stats_snapshot';

export const DashboardCardsPanel: React.FC<DashboardCardsPanelProps> = ({
  sosfuStats,
  mode = 'CONCESSION',
  isLoading = false,
  onInboxClick,
  onMyTasksSolicitacoesClick,
  onMyTasksPrestacoesClick,
  onAwaitingSignClick,
  onMyTasksClick,
  onFinanceClick
}) => {
  const [prevStats, setPrevStats] = useState<SOSFUStats | null>(null);
  
  // Load previous stats from localStorage and save current
  useEffect(() => {
    if (isLoading) return;
    
    const stored = localStorage.getItem(STATS_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Only use if less than 24 hours old
        if (parsed.timestamp && Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          setPrevStats(parsed.stats);
        }
      } catch {}
    }
    
    // Save current stats for next comparison
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify({
      stats: sosfuStats,
      timestamp: Date.now()
    }));
  }, [sosfuStats, isLoading]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {/* 📥 CARD 1: CAIXA DE ENTRADA */}
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
          {isLoading ? <Skeleton className="h-8 w-16 mb-1" /> : <h3 className="text-3xl font-black text-slate-800 mb-1 flex items-center gap-2">{sosfuStats.inbox.total} {prevStats && <TrendIndicator current={sosfuStats.inbox.total} previous={prevStats.inbox.total} invertColors />}</h3>}
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

      {/* 📄 CARD 2: MINHA MESA DE SOLICITAÇÕES */}
      <MotionWrapper 
        delay={0.2}
        onClick={onMyTasksSolicitacoesClick || onMyTasksClick} 
        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group hover:border-purple-400 hover:shadow-md transition-all cursor-pointer"
      >
        <div className="absolute top-0 left-0 w-1 h-full bg-purple-500 group-hover:w-2 transition-all"></div>
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition-transform">
            <FileText size={20}/>
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">Minha Mesa</span>
        </div>
        <div>
          {isLoading ? <Skeleton className="h-8 w-16 mb-1" /> : <h3 className="text-3xl font-black text-slate-800 mb-1 flex items-center gap-2">{sosfuStats.myTasksSolicitacoes || 0} {prevStats && <TrendIndicator current={sosfuStats.myTasksSolicitacoes || 0} previous={prevStats.myTasksSolicitacoes || 0} />}</h3>}
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide group-hover:text-purple-600">Solicitações</p>
          <p className="text-[10px] text-slate-400 mt-1">Concessões atribuídas a mim</p>
        </div>
      </MotionWrapper>

      {/* 📋 CARD 3: MINHA MESA DE PRESTAÇÕES */}
      <MotionWrapper 
        delay={0.3}
        onClick={onMyTasksPrestacoesClick || onMyTasksClick} 
        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group hover:border-orange-400 hover:shadow-md transition-all cursor-pointer"
      >
        <div className="absolute top-0 left-0 w-1 h-full bg-orange-500 group-hover:w-2 transition-all"></div>
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-xl group-hover:scale-110 transition-transform">
            <UserCog size={20}/>
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">Minha Mesa</span>
        </div>
        <div>
          {isLoading ? <Skeleton className="h-8 w-16 mb-1" /> : <h3 className="text-3xl font-black text-slate-800 mb-1 flex items-center gap-2">{sosfuStats.myTasksPrestacoes || 0} {prevStats && <TrendIndicator current={sosfuStats.myTasksPrestacoes || 0} previous={prevStats.myTasksPrestacoes || 0} />}</h3>}
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide group-hover:text-orange-600">Prestações de Contas</p>
          <p className="text-[10px] text-slate-400 mt-1">PCs atribuídas a mim</p>
        </div>
      </MotionWrapper>

      {/* 📤 CARD 4: FLUXO SEFIN */}
      <MotionWrapper 
        delay={0.4}
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
          {isLoading ? <Skeleton className="h-8 w-16 mb-1" /> : <h3 className="text-3xl font-black text-slate-800 mb-1 flex items-center gap-2">{sosfuStats.awaitingSignature + (sosfuStats.signed || 0)} {prevStats && <TrendIndicator current={sosfuStats.awaitingSignature + (sosfuStats.signed || 0)} previous={(prevStats.awaitingSignature || 0) + (prevStats.signed || 0)} />}</h3>}
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide group-hover:text-amber-600">Aguard. Assinatura</p>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
              {isLoading ? <Skeleton className="h-3 w-12" /> : <span className="text-[10px] font-bold text-slate-400">{sosfuStats.awaitingSignature} Aguardando</span>}
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              {isLoading ? <Skeleton className="h-3 w-12" /> : <span className="text-[10px] font-bold text-slate-400">{sosfuStats.signed || 0} Assinados</span>}
            </div>
          </div>
        </div>
      </MotionWrapper>
    </div>
  );
};
