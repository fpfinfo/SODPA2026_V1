// ============================================================================
// ProcessCard - Card de processo individual SODPA
// Exibe informações resumidas de diária ou passagem
// ============================================================================

import React from 'react';
import { 
  Calendar, 
  Plane, 
  User, 
  Clock, 
  AlertTriangle,
  ChevronRight,
  UserPlus
} from 'lucide-react';
import { ProcessoSODPA } from '../../types';

interface ProcessCardProps {
  processo: ProcessoSODPA;
  onOpen?: () => void;
  onAssignToMe?: () => void;
  onAssign?: () => void;
  showAssignActions?: boolean;
  compact?: boolean;
}

// Status badge colors
const getStatusStyle = (status: string): string => {
  switch (status) {
    case 'SOLICITADA':
    case 'PENDENTE_ANALISE':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'EM_ANALISE':
    case 'COTACAO':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'APROVADA':
    case 'EMITIDA':
      return 'bg-green-50 text-green-700 border-green-200';
    case 'PAGA':
    case 'UTILIZADA':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'AGUARDANDO_SEFIN':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'DEVOLVIDA':
    case 'CANCELADA':
      return 'bg-red-50 text-red-700 border-red-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

// Priority badge
const getPriorityStyle = (prioridade: string): string => {
  switch (prioridade) {
    case 'URGENTE':
      return 'bg-red-100 text-red-800';
    case 'ALTA':
      return 'bg-orange-100 text-orange-800';
    case 'NORMAL':
      return 'bg-gray-100 text-gray-600';
    case 'BAIXA':
      return 'bg-slate-100 text-slate-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

// Format currency
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Format date
const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('pt-BR');
};

// Time ago helper
const timeAgo = (dateStr?: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) return `${diffDays}d atrás`;
  if (diffHours > 0) return `${diffHours}h atrás`;
  return 'agora';
};

export function ProcessCard({
  processo,
  onOpen,
  onAssignToMe,
  onAssign,
  showAssignActions = false,
  compact = false
}: ProcessCardProps) {
  const isDiaria = processo.tipo === 'DIARIA';
  const Icon = isDiaria ? Calendar : Plane;
  const iconBg = isDiaria ? 'bg-blue-50' : 'bg-purple-50';
  const iconColor = isDiaria ? 'text-blue-600' : 'text-purple-600';

  if (compact) {
    return (
      <div 
        className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg hover:shadow-sm transition-all cursor-pointer group"
        onClick={onOpen}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 ${iconBg} rounded-lg`}>
            <Icon className={`h-4 w-4 ${iconColor}`} />
          </div>
          <div>
            <div className="font-medium text-sm text-gray-900 line-clamp-1">
              {processo.solicitanteNome}
            </div>
            <div className="text-xs text-gray-500">
              {processo.protocoloNUP || processo.id.slice(0, 8)} • {processo.tipo}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">
            {formatCurrency(processo.valorTotal)}
          </span>
          <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl hover:shadow-md transition-all overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-50">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 ${iconBg} rounded-xl`}>
              <Icon className={`h-5 w-5 ${iconColor}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">
                  {processo.solicitanteNome}
                </span>
                {processo.prioridade === 'URGENTE' && (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                )}
              </div>
              <div className="text-sm text-gray-500">
                {processo.solicitanteCargo || 'Servidor TJPA'}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusStyle(processo.status)}`}>
              {processo.status.replace(/_/g, ' ')}
            </span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityStyle(processo.prioridade)}`}>
              {processo.prioridade}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Protocolo</span>
          <span className="font-mono text-gray-900">
            {processo.protocoloNUP || processo.id.slice(0, 12)}
          </span>
        </div>

        {isDiaria && processo.destino && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Destino</span>
            <span className="text-gray-900">{processo.destino}</span>
          </div>
        )}

        {isDiaria && processo.dataInicio && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Período</span>
            <span className="text-gray-900">
              {formatDate(processo.dataInicio)} - {formatDate(processo.dataFim)}
            </span>
          </div>
        )}

        {!isDiaria && processo.tipoPassagem && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Tipo</span>
            <span className="text-gray-900">{processo.tipoPassagem}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-50">
          <span className="text-gray-500">Valor</span>
          <span className="text-lg font-bold text-gray-900">
            {formatCurrency(processo.valorTotal)}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50/50 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Clock className="h-3.5 w-3.5" />
            <span>{timeAgo(processo.createdAt)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            {showAssignActions && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); onAssignToMe?.(); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <User className="h-3.5 w-3.5" />
                  Para mim
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onAssign?.(); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Atribuir
                </button>
              </>
            )}
            <button
              onClick={onOpen}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:border-gray-300 rounded-lg transition-colors"
            >
              Abrir
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProcessCard;
