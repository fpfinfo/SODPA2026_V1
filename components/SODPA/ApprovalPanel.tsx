// ============================================================================
// ApprovalPanel - Painel de aprovação para módulos SEFIN, SGP, Presidência
// Recebe processos tramitados e permite aprovar ou devolver
// ============================================================================

import React, { useState } from 'react';
import {
  Inbox,
  Calendar,
  Plane,
  RefreshCw,
  CheckCircle,
  XCircle,
  MapPin,
  Clock,
  ChevronRight,
  AlertTriangle,
  ThumbsUp,
  RotateCcw,
  Search
} from 'lucide-react';
import { useModuleInbox, TramitadoProcess } from '../../hooks/useModuleInbox';
import { RequestDetailModal } from './RequestDetailModal';

interface ApprovalPanelProps {
  moduleName: 'SEFIN' | 'SGP' | 'PRESIDENCIA';
  moduleLabel: string;
  moduleColor: string; // e.g., 'blue', 'emerald', 'purple'
}

// Format date helper
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

export function ApprovalPanel({ moduleName, moduleLabel, moduleColor }: ApprovalPanelProps) {
  const {
    processos,
    loading,
    error,
    total,
    totalDiarias,
    totalPassagens,
    filter,
    setFilter,
    aprovar,
    devolver,
    refetch
  } = useModuleInbox(moduleName);

  const [searchTerm, setSearchTerm] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState<TramitadoProcess | null>(null);
  const [showDevolverModal, setShowDevolverModal] = useState(false);
  const [devolverMotivo, setDevolverMotivo] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const filteredProcessos = processos.filter(p => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      p.solicitanteNome.toLowerCase().includes(search) ||
      p.nup?.toLowerCase().includes(search) ||
      p.destino.toLowerCase().includes(search)
    );
  });

  const handleAprovar = async (processo: TramitadoProcess) => {
    setActionLoading(true);
    const success = await aprovar(processo.id, `Aprovado pelo módulo ${moduleLabel}`);
    setActionLoading(false);
    if (success) {
      refetch();
    }
  };

  const handleDevolver = async () => {
    if (!selectedProcess || !devolverMotivo.trim()) return;
    
    setActionLoading(true);
    const success = await devolver(selectedProcess.id, devolverMotivo);
    setActionLoading(false);
    
    if (success) {
      setShowDevolverModal(false);
      setSelectedProcess(null);
      setDevolverMotivo('');
      refetch();
    }
  };

  const openDevolverModal = (processo: TramitadoProcess) => {
    setSelectedProcess(processo);
    setShowDevolverModal(true);
  };

  const getColorClasses = (variant: 'bg' | 'text' | 'border') => {
    const colors: Record<string, Record<string, string>> = {
      blue: { bg: 'bg-blue-600', text: 'text-blue-600', border: 'border-blue-200' },
      emerald: { bg: 'bg-emerald-600', text: 'text-emerald-600', border: 'border-emerald-200' },
      purple: { bg: 'bg-purple-600', text: 'text-purple-600', border: 'border-purple-200' }
    };
    return colors[moduleColor]?.[variant] || colors.blue[variant];
  };

  const getModalRequest = (p: TramitadoProcess | null) => {
    if (!p) return null;
    return {
      id: p.id,
      tipo: p.tipo,
      status: p.status,
      nup: p.nup,
      solicitante_nome: p.solicitanteNome,
      solicitante_email: p.solicitanteEmail,
      solicitante_cargo: p.solicitanteCargo,
      solicitante_lotacao: p.solicitanteLotacao,
      tipo_destino: p.tipoDestino,
      origem: p.origem,
      destino: p.destino,
      data_inicio: p.dataInicio,
      data_fim: p.dataFim,
      dias: p.dias,
      motivo: p.motivo,
      valor_total: p.valorTotal,
      destino_atual: p.destinoAtual,
      created_at: p.createdAt,
    };
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 ${getColorClasses('bg')} rounded-xl shadow-lg`}>
            <Inbox className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Solicitações para Autorização</h2>
            <p className="text-sm text-gray-500">
              {total} {total === 1 ? 'processo aguardando' : 'processos aguardando'} análise
            </p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          disabled={loading}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RefreshCw className={`h-5 w-5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-xl border border-gray-100">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, protocolo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              filter === 'ALL' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Todos ({total})
          </button>
          <button
            onClick={() => setFilter('DIARIA')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              filter === 'DIARIA' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            Diárias ({totalDiarias})
          </button>
          <button
            onClick={() => setFilter('PASSAGEM')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              filter === 'PASSAGEM' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Plane className="h-3.5 w-3.5" />
            Passagens ({totalPassagens})
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      )}

      {/* Empty */}
      {!loading && filteredProcessos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-gray-100">
          <div className="p-4 bg-gray-100 rounded-full mb-4">
            <CheckCircle className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhuma solicitação pendente</h3>
          <p className="text-gray-500 text-sm">Todas as solicitações foram processadas</p>
        </div>
      )}

      {/* Process List */}
      {!loading && filteredProcessos.length > 0 && (
        <div className="space-y-3">
          {filteredProcessos.map((processo) => {
            const isDiaria = processo.tipo === 'DIARIA';
            const Icon = isDiaria ? Calendar : Plane;
            
            return (
              <div 
                key={processo.id}
                className="bg-white border border-gray-100 rounded-xl hover:shadow-md transition-all overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${isDiaria ? 'bg-blue-50' : 'bg-purple-50'}`}>
                        <Icon className={`h-5 w-5 ${isDiaria ? 'text-blue-600' : 'text-purple-600'}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{processo.solicitanteNome}</span>
                        </div>
                        <div className="text-sm text-gray-500">{processo.solicitanteCargo || 'Servidor TJPA'}</div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                      Aguardando Autorização
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin size={14} className="text-gray-400" />
                      <span>{processo.origem}</span>
                      <ChevronRight size={14} className="text-gray-300" />
                      <span className="font-medium text-gray-900">{processo.destino}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar size={14} className="text-gray-400" />
                      <span>{formatDate(processo.dataInicio)} - {formatDate(processo.dataFim)}</span>
                    </div>
                  </div>
                </div>

                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Tramitado {timeAgo(processo.createdAt)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openDevolverModal(processo)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <RotateCcw size={14} />
                      Devolver
                    </button>
                    <button
                      onClick={() => handleAprovar(processo)}
                      disabled={actionLoading}
                      className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white ${getColorClasses('bg')} hover:opacity-90 rounded-lg transition-colors shadow-sm`}
                    >
                      <ThumbsUp size={14} />
                      Autorizar
                    </button>
                    <button
                      onClick={() => {
                        setSelectedProcess(processo);
                        setShowDetailModal(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:border-gray-300 rounded-lg transition-colors"
                    >
                      Ver Detalhes
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      <RequestDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedProcess(null);
        }}
        request={getModalRequest(selectedProcess)}
        showActions={false}
      />

      {/* Devolver Modal */}
      {showDevolverModal && selectedProcess && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <RotateCcw className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Devolver Processo</h3>
                  <p className="text-sm text-gray-500">{selectedProcess.solicitanteNome}</p>
                </div>
              </div>
            </div>

            <div className="p-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo da Devolução *
              </label>
              <textarea
                value={devolverMotivo}
                onChange={(e) => setDevolverMotivo(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Informe o motivo da devolução..."
              />
            </div>

            <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDevolverModal(false);
                  setSelectedProcess(null);
                  setDevolverMotivo('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleDevolver}
                disabled={actionLoading || !devolverMotivo.trim()}
                className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50"
              >
                Devolver para SODPA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ApprovalPanel;
