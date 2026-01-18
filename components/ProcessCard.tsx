import React, { useState, useRef, useEffect, memo } from 'react';
import { Process, ProcessType } from '../types';
import { CURRENT_USER_ID } from '../constants';
import { Clock, FileText, UserPlus, FileCheck, Send, MoreHorizontal, UserCheck, Calculator, AlertCircle, ArrowDown, ArrowUp, Minus, ShieldCheck, AlertTriangle, Shield, ShieldAlert } from 'lucide-react';

interface ProcessCardProps {
  process: Process;
  compact?: boolean;
  onAction?: (action: string, id: string) => void;
  onClick?: () => void;
  currentWorkload?: number;
  onPriorityChange?: (id: string, priority: 'NORMAL' | 'HIGH' | 'CRITICAL') => void;
  teamMembers?: { id: string; nome: string; avatar_url: string | null }[];
}

const ProcessCardComponent: React.FC<ProcessCardProps> = ({ process, onAction, onClick, currentWorkload, onPriorityChange, teamMembers = [] }) => {
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowPriorityMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isConcession = process.type === ProcessType.CONCESSION;
  const isReturned = process.status === 'DEVOLVIDO';
  const borderColor = isReturned ? 'border-l-red-500' : (isConcession ? 'border-l-blue-500' : 'border-l-amber-500');
  const badgeColor = isConcession ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700';
  
  const assignedStaff = teamMembers.find(s => s.id === process.assignedToId) || (process.assignedToId ? { id: process.assignedToId, nome: 'Desconhecido', avatar_url: null } : null);
  const slaDate = new Date(process.slaDeadline || process.createdAt);
  const now = new Date();
  const isSlaCritical = slaDate < now || (slaDate.getTime() - now.getTime()) < (2 * 24 * 60 * 60 * 1000);

  const workloadCount = currentWorkload !== undefined ? currentWorkload : 0;
  const isAssignedToMe = process.assignedToId === CURRENT_USER_ID;

  const canAnalyze = process.status !== 'Arquivado' && process.status !== 'Concedido' && process.status !== 'Aprovado com Ressalvas';

  // Priority Config
  const priorities = {
    NORMAL: { label: 'Baixa', color: 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200', icon: ArrowDown },
    HIGH: { label: 'Média', color: 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100', icon: Minus },
    CRITICAL: { label: 'Alta', color: 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100', icon: ArrowUp }
  };

  const currentPrio = priorities[process.priority] || priorities.NORMAL;
  const isAccountability = process.type === ProcessType.ACCOUNTABILITY;

  // Sentinela Badge Logic
  const getSentinelaBadge = () => {
      if (!isAccountability || !process.sentinelaRisk) return null;
      
      const config = {
          LOW: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: ShieldCheck, label: 'Sentinela OK' },
          MEDIUM: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Shield, label: 'Alerta IA' },
          CRITICAL: { bg: 'bg-red-100', text: 'text-red-700', icon: ShieldAlert, label: 'Risco Alto' },
          PENDING: { bg: 'bg-slate-100', text: 'text-slate-500', icon: Shield, label: 'Não Auditado' },
      };

      const c = config[process.sentinelaRisk];
      return (
          <button 
            onClick={(e) => { e.stopPropagation(); onAction && onAction('sentinela', process.id); }}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] uppercase font-black tracking-wide ${c.bg} ${c.text} border-transparent hover:brightness-95 transition-all`}
            title="Clique para ver auditoria detalhada"
          >
              <c.icon size={10} strokeWidth={2.5}/> {c.label}
          </button>
      );
  };

  const handlePrioritySelect = (prio: 'NORMAL' | 'HIGH' | 'CRITICAL') => {
    if (onPriorityChange) {
        onPriorityChange(process.id, prio);
    }
    setShowPriorityMenu(false);
  };

  return (
    <div 
      className={`bg-white rounded-2xl shadow-sm border border-slate-200 border-l-[6px] ${borderColor} p-4 mb-3 hover:shadow-md transition-all cursor-pointer group relative`}
      draggable="true"
      onDragStart={(e) => {
        e.dataTransfer.setData('processId', process.id);
      }}
      onClick={onClick}
    >
      {/* Red highlight bar for returned processes */}
      {isReturned && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-red-500 rounded-t-2xl animate-pulse" />
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
                <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-lg ${badgeColor}`}>
                    {isConcession ? 'Solicitação' : 'Prestação'}
                </span>
                
                {getSentinelaBadge()}
                
                {/* Interactive Priority Badge */}
                <div className="relative" ref={menuRef}>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setShowPriorityMenu(!showPriorityMenu); }}
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-lg border flex items-center gap-1 transition-colors ${currentPrio.color}`}
                        title="Alterar Prioridade"
                    >
                        <currentPrio.icon size={10} strokeWidth={3} />
                        {currentPrio.label}
                    </button>

                    {showPriorityMenu && (
                        <div className="absolute top-full left-0 mt-1 w-28 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
                            {(Object.keys(priorities) as Array<keyof typeof priorities>).map((key) => {
                                const p = priorities[key];
                                return (
                                    <button
                                        key={key}
                                        onClick={(e) => { e.stopPropagation(); handlePrioritySelect(key); }}
                                        className={`px-3 py-2 text-left text-[10px] font-bold uppercase flex items-center gap-2 hover:bg-slate-50 transition-colors ${process.priority === key ? 'bg-slate-50 text-slate-800' : 'text-slate-500'}`}
                                    >
                                        <p.icon size={10} className={key === 'CRITICAL' ? 'text-red-500' : key === 'HIGH' ? 'text-amber-500' : 'text-slate-400'} />
                                        {p.label}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {isReturned && (
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700 flex items-center gap-0.5 animate-pulse">
                        <AlertTriangle size={8} /> DEVOLVIDO
                    </span>
                )}
                {process.requiresTaxReview && (
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 flex items-center gap-0.5">
                        <Calculator size={8} /> Tributário
                    </span>
                )}
            </div>
            <h4 className="font-bold text-sm text-slate-800 leading-snug line-clamp-2 pr-4">{process.interestedParty || 'Interessado não identificado'}</h4>
            <p className="text-[10px] text-slate-400 font-mono tracking-wide">{process.protocolNumber}</p>
        </div>
        <div className="text-right shrink-0">
             <span className="block font-black text-sm text-slate-700">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(process.value)}
             </span>
        </div>
      </div>

      {/* SLA & Assignee */}
      <div className="flex justify-between items-end mt-3 pt-3 border-t border-slate-50">
        <div className="flex items-center gap-1.5 text-xs bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
          <Clock size={12} className={isSlaCritical ? 'text-red-500' : 'text-slate-400'} />
          <span className={`font-bold ${isSlaCritical ? 'text-red-600' : 'text-slate-500'}`}>
            {slaDate.toLocaleDateString('pt-BR')}
          </span>
        </div>

        <div className="flex items-center">
            {assignedStaff ? (
                <div className="flex items-center gap-2 bg-slate-50 pl-1 pr-2 py-0.5 rounded-full border border-slate-100">
                    <img 
                        src={assignedStaff.avatar_url || 'https://www.gravatar.com/avatar?d=mp'} 
                        alt={assignedStaff.nome} 
                        className="w-5 h-5 rounded-full border border-white shadow-sm object-cover"
                    />
                    <span className="text-[10px] font-bold text-slate-600 truncate max-w-[60px]">{assignedStaff.nome.split(' ')[0]}</span>
                </div>
            ) : (
                <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-300" title="Não atribuído">
                    <UserPlus size={12} />
                </div>
            )}
        </div>
      </div>

      {/* Direct Action Button - Enhances UX by making analysis entry point obvious */}
      {canAnalyze && (
        <button 
            onClick={(e) => { e.stopPropagation(); onAction && onAction('analyze', process.id); }}
            className="w-full mt-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 uppercase tracking-wide hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors flex items-center justify-center gap-1.5 animate-in fade-in"
        >
            <ShieldCheck size={12} className={process.status === 'PENDENTE SOSFU' ? 'animate-pulse text-blue-500' : ''} /> 
            Realizar Análise Técnica
        </button>
      )}

      {/* Quick Actions (Visible on Hover) */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-2 group-hover:translate-x-0 bg-white shadow-xl rounded-xl border border-slate-100 flex flex-col p-1 z-20 gap-1" onClick={(e) => e.stopPropagation()}>
        {!isAssignedToMe && (
            <button 
                onClick={() => onAction && onAction('take_ownership', process.id)}
                className="p-2 hover:bg-slate-50 text-slate-500 hover:text-blue-600 rounded-lg transition-colors relative group/btn" 
                title="Assumir (Eu)"
            >
                <UserCheck size={16} />
            </button>
        )}
        {isAccountability && (
            <button 
                onClick={() => onAction && onAction('sentinela', process.id)}
                className="p-2 hover:bg-slate-50 text-slate-500 hover:text-indigo-600 rounded-lg transition-colors" 
                title="Auditoria Sentinela"
            >
                <ShieldCheck size={16} />
            </button>
        )}
        <button 
            onClick={() => onAction && onAction('assume', process.id)}
            className="p-2 hover:bg-slate-50 text-slate-500 hover:text-purple-600 rounded-lg transition-colors" 
            title="Delegar a Equipe"
        >
            <UserPlus size={16} />
        </button>
        {isConcession && (
            <button 
                onClick={() => onAction && onAction('generate_doc', process.id)}
                className="p-2 hover:bg-slate-50 text-slate-500 hover:text-amber-600 rounded-lg transition-colors" 
                title="Gerar Portaria"
            >
                <FileText size={16} />
            </button>
        )}
         <button 
            onClick={() => onAction && onAction('forward', process.id)}
            className="p-2 hover:bg-slate-50 text-slate-500 hover:text-emerald-600 rounded-lg transition-colors" 
            title={isConcession ? "Enviar p/ Empenho" : "Concluir Auditoria"}
        >
            {isConcession ? <Send size={16} /> : <FileCheck size={16} />}
        </button>
      </div>
    </div>
  );
};

// Memoized export - prevents re-renders when parent updates but props unchanged
export const ProcessCard = memo(ProcessCardComponent, (prevProps, nextProps) => {
  // Custom comparison for shallow equality of critical props
  return (
    prevProps.process.id === nextProps.process.id &&
    prevProps.process.status === nextProps.process.status &&
    prevProps.process.priority === nextProps.process.priority &&
    prevProps.process.assignedToId === nextProps.process.assignedToId &&
    prevProps.currentWorkload === nextProps.currentWorkload
  );
});