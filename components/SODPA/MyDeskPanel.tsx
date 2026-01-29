// ============================================================================
// MyDeskPanel - Painel "Minha Mesa" SODPA
// Processos atribuídos ao analista para execução de despesa
// ============================================================================

import React, { useState } from 'react';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  Send, 
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  Calendar,
  Plane,
  FileCheck,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import { useSODPAMyDesk, DeskTab } from '../../hooks/useSODPAMyDesk';
import { ProcessCard } from './ProcessCard';
import { ProcessoSODPA } from '../../types';

interface MyDeskPanelProps {
  onOpenProcess?: (processo: ProcessoSODPA) => void;
}

export function MyDeskPanel({ onOpenProcess }: MyDeskPanelProps) {
  const {
    processos,
    loading,
    error,
    emAnalise,
    aguardandoDocs,
    prontosSefin,
    retornoSefin,
    total,
    activeTab,
    setActiveTab,
    validateProcess,
    sendToSefin,
    requestCorrection,
    redistribute,
    executeExpense,
    refetch
  } = useSODPAMyDesk();

  const [selectedProcess, setSelectedProcess] = useState<ProcessoSODPA | null>(null);
  const [showActionModal, setShowActionModal] = useState<'validate' | 'correction' | 'execute' | null>(null);
  const [correctionReason, setCorrectionReason] = useState('');
  const [validationComments, setValidationComments] = useState('');

  // Tab configuration
  const tabs: { id: DeskTab; label: string; count: number; icon: React.FC<any>; color: string }[] = [
    { id: 'EM_ANALISE', label: 'Em Análise', count: emAnalise, icon: Clock, color: 'amber' },
    { id: 'AGUARDANDO_DOCS', label: 'Aguardando Docs', count: aguardandoDocs, icon: FileText, color: 'orange' },
    { id: 'PRONTOS_SEFIN', label: 'Prontos SEFIN', count: prontosSefin, icon: Send, color: 'blue' },
    { id: 'RETORNO_SEFIN', label: 'Retorno SEFIN', count: retornoSefin, icon: CheckCircle2, color: 'green' },
  ];

  const handleValidate = async (approved: boolean) => {
    if (!selectedProcess) return;
    const success = await validateProcess(
      selectedProcess.id, 
      selectedProcess.tipo, 
      approved, 
      validationComments
    );
    if (success) {
      setShowActionModal(null);
      setSelectedProcess(null);
      setValidationComments('');
    }
  };

  const handleSendToSefin = async (processo: ProcessoSODPA) => {
    const success = await sendToSefin(processo.id, processo.tipo);
    if (success) {
      // TODO: Show toast
    }
  };

  const handleRequestCorrection = async () => {
    if (!selectedProcess || !correctionReason.trim()) return;
    const success = await requestCorrection(
      selectedProcess.id,
      selectedProcess.tipo,
      correctionReason
    );
    if (success) {
      setShowActionModal(null);
      setSelectedProcess(null);
      setCorrectionReason('');
    }
  };

  const handleExecuteExpense = async () => {
    if (!selectedProcess) return;
    const success = await executeExpense(selectedProcess.id, selectedProcess.tipo);
    if (success) {
      setShowActionModal(null);
      setSelectedProcess(null);
    }
  };

  // Get action buttons based on process status
  const getProcessActions = (processo: ProcessoSODPA) => {
    const actions: React.ReactNode[] = [];
    
    if (['EM_ANALISE', 'COTACAO'].includes(processo.status)) {
      actions.push(
        <button
          key="validate"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedProcess(processo);
            setShowActionModal('validate');
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-600 hover:bg-green-50 rounded-lg transition-colors"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Validar
        </button>
      );
      actions.push(
        <button
          key="correction"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedProcess(processo);
            setShowActionModal('correction');
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Devolver
        </button>
      );
    }

    if (processo.status === 'APROVADA') {
      actions.push(
        <button
          key="sefin"
          onClick={(e) => {
            e.stopPropagation();
            handleSendToSefin(processo);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Send className="h-3.5 w-3.5" />
          Tramitar SEFIN
        </button>
      );
    }

    if (['ASSINADA', 'RETORNO_SEFIN'].includes(processo.status)) {
      actions.push(
        <button
          key="execute"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedProcess(processo);
            setShowActionModal('execute');
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
        >
          <FileCheck className="h-3.5 w-3.5" />
          Executar Despesa
        </button>
      );
    }

    return actions;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg shadow-amber-500/20">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Minha Mesa</h2>
            <p className="text-sm text-gray-500">
              {total} {total === 1 ? 'processo atribuído' : 'processos atribuídos'} a você
            </p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          disabled={loading}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Atualizar"
        >
          <RefreshCw className={`h-5 w-5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <tab.icon className={`h-4 w-4 ${
              activeTab === tab.id ? `text-${tab.color}-600` : ''
            }`} />
            {tab.label}
            <span className={`px-2 py-0.5 text-xs rounded-full ${
              activeTab === tab.id
                ? `bg-${tab.color}-100 text-${tab.color}-700`
                : 'bg-gray-200 text-gray-600'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-amber-500 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Carregando processos...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && processos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-gray-100">
          <div className="p-4 bg-gray-100 rounded-full mb-4">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            Nenhum processo nesta categoria
          </h3>
          <p className="text-gray-500 text-sm">
            {activeTab === 'EM_ANALISE' && 'Atribua processos da Caixa de Entrada'}
            {activeTab === 'AGUARDANDO_DOCS' && 'Nenhum processo aguardando documentação'}
            {activeTab === 'PRONTOS_SEFIN' && 'Valide processos para aparecerem aqui'}
            {activeTab === 'RETORNO_SEFIN' && 'Processos assinados pela SEFIN aparecerão aqui'}
          </p>
        </div>
      )}

      {/* Process List */}
      {!loading && processos.length > 0 && (
        <div className="space-y-4">
          {processos.map((processo) => (
            <div 
              key={processo.id}
              className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`p-3 rounded-xl ${
                  processo.tipo === 'DIARIA' ? 'bg-blue-50' : 'bg-purple-50'
                }`}>
                  {processo.tipo === 'DIARIA' 
                    ? <Calendar className="h-6 w-6 text-blue-600" />
                    : <Plane className="h-6 w-6 text-purple-600" />
                  }
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-900">{processo.solicitanteNome}</h4>
                      <p className="text-sm text-gray-500">
                        {processo.protocoloNUP || processo.id.slice(0, 12)} • {processo.tipo}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(processo.valorTotal)}
                      </div>
                      <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                        processo.status === 'EM_ANALISE' ? 'bg-amber-100 text-amber-700' :
                        processo.status === 'APROVADA' ? 'bg-green-100 text-green-700' :
                        processo.status === 'ASSINADA' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {processo.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  {processo.tipo === 'DIARIA' && processo.destino && (
                    <div className="mt-2 text-sm text-gray-600">
                      <span className="font-medium">Destino:</span> {processo.destino}
                      {processo.dataInicio && (
                        <span className="ml-4">
                          <span className="font-medium">Período:</span>{' '}
                          {new Date(processo.dataInicio).toLocaleDateString('pt-BR')}
                          {processo.dataFim && ` - ${new Date(processo.dataFim).toLocaleDateString('pt-BR')}`}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                    {getProcessActions(processo)}
                    <button
                      onClick={() => onOpenProcess?.(processo)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors ml-auto"
                    >
                      Ver Detalhes
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Validation Modal */}
      {showActionModal === 'validate' && selectedProcess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Validar Processo</h3>
              <p className="text-sm text-gray-500">{selectedProcess.solicitanteNome}</p>
            </div>
            <div className="p-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações (opcional)
              </label>
              <textarea
                value={validationComments}
                onChange={(e) => setValidationComments(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Adicione comentários sobre a análise..."
              />
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2">
              <button
                onClick={() => handleValidate(true)}
                className="flex-1 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                Aprovar
              </button>
              <button
                onClick={() => {
                  setShowActionModal(null);
                  setSelectedProcess(null);
                }}
                className="flex-1 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Correction Modal */}
      {showActionModal === 'correction' && selectedProcess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Solicitar Correção</h3>
              <p className="text-sm text-gray-500">{selectedProcess.solicitanteNome}</p>
            </div>
            <div className="p-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo da devolução *
              </label>
              <textarea
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
                rows={4}
                placeholder="Descreva o que precisa ser corrigido..."
                required
              />
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2">
              <button
                onClick={handleRequestCorrection}
                disabled={!correctionReason.trim()}
                className="flex-1 py-2.5 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors disabled:opacity-50"
              >
                Devolver
              </button>
              <button
                onClick={() => {
                  setShowActionModal(null);
                  setSelectedProcess(null);
                  setCorrectionReason('');
                }}
                className="flex-1 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Execute Expense Modal */}
      {showActionModal === 'execute' && selectedProcess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Executar Despesa</h3>
              <p className="text-sm text-gray-500">{selectedProcess.solicitanteNome}</p>
            </div>
            <div className="p-5">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto mb-3" />
                <p className="text-emerald-800 font-medium">
                  Confirma a execução da despesa?
                </p>
                <p className="text-sm text-emerald-600 mt-1">
                  Valor: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedProcess.valorTotal)}
                </p>
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2">
              <button
                onClick={handleExecuteExpense}
                className="flex-1 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
              >
                Confirmar Execução
              </button>
              <button
                onClick={() => {
                  setShowActionModal(null);
                  setSelectedProcess(null);
                }}
                className="flex-1 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyDeskPanel;
