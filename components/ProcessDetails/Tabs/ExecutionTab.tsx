import React, { useState } from 'react';
import { 
  Receipt, FileText, CheckCircle, Clock, Send, AlertCircle, 
  Loader2, Lock, CreditCard, Banknote, ArrowRight, Sparkles 
} from 'lucide-react';
import { useProcessExecution } from '../../../hooks/useProcessExecution';
import { useWorkflowStatus, WorkflowStatus } from '../../../hooks/useWorkflowStatus';
import { useServidorRegularidade } from '../../../hooks/useServidorRegularidade';
import { PortariaFormModal } from '../Modals/PortariaFormModal';
import { NotaEmpenhoFormModal } from '../Modals/NotaEmpenhoFormModal';
import { DocumentoLiquidacaoFormModal } from '../Modals/DocumentoLiquidacaoFormModal';
import { OrdemBancariaFormModal } from '../Modals/OrdemBancariaFormModal';

interface ExecutionTabProps {
  processData: any;
  enrichedProcessData?: any;
}

// Documentos do Bloco A (Pré-SEFIN)
const BLOCK_A_DOCUMENTS = [
  { tipo: 'PORTARIA', titulo: 'Portaria de Concessão', icon: FileText },
  { tipo: 'CERTIDAO_REGULARIDADE', titulo: 'Certidão de Regularidade', icon: CheckCircle },
  { tipo: 'NOTA_EMPENHO', titulo: 'Nota de Empenho', icon: Receipt },
];

// Documentos do Bloco B (Pós-SEFIN)
const BLOCK_B_DOCUMENTS = [
  { tipo: 'NOTA_LIQUIDACAO', titulo: 'Nota de Liquidação (DL)', icon: CreditCard },
  { tipo: 'ORDEM_BANCARIA', titulo: 'Ordem Bancária (OB)', icon: Banknote },
];

// Mapeamento de códigos de elemento de despesa
const EXPENSE_ELEMENT_LABELS: Record<string, string> = {
  '3.3.90.30.01': 'Material de Consumo',
  '3.3.90.30.02': 'Combustíveis e Lubrificantes',
  '3.3.90.30': 'Material de Consumo',
  '3.3.90.33': 'Passagens e Despesas com Locomoção',
  '3.3.90.36': 'Outros Serviços de Terceiros - PF',
  '3.3.90.39': 'Outros Serviços de Terceiros - PJ',
};

export const ExecutionTab: React.FC<ExecutionTabProps> = ({ 
  processData, 
  enrichedProcessData 
}) => {
  // ========================================
  // HOOKS
  // ========================================
  const {
    state,
    documents,
    isLoading: isLoadingDocs,
    canGeneratePortaria,
    canGenerateCertidao,
    canGenerateNE,
    canGenerateDL,
    canGenerateOB,
    canSendToSEFIN,
    generateDocument,
    sendToSEFIN,
    isGenerating,
    isSending
  } = useProcessExecution(processData.id);
  
  const {
    status: workflowStatus,
    isLoading: isLoadingStatus,
    isWaitingSefin,
    isSignedBySefin,
    canEditBlockA,
    isBlockBLocked,
    updateStatus
  } = useWorkflowStatus(processData.id);
  
  const { checkPendencias } = useServidorRegularidade(processData.suprido_id);
  
  // ========================================
  // LOCAL STATE
  // ========================================
  const [showPortariaModal, setShowPortariaModal] = useState(false);
  const [showNEModal, setShowNEModal] = useState(false);
  const [showDLModal, setShowDLModal] = useState(false);
  const [showOBModal, setShowOBModal] = useState(false);

  // Safe parse function
  const parseItens = (data: any): any[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const rawItens = enrichedProcessData?.itens_despesa || processData.items || processData.itens_despesa;
  const itens = parseItens(rawItens);
  const totalGeral = enrichedProcessData?.valor_total || processData.value || processData.valor_total || 0;

  // ========================================
  // HELPERS
  // ========================================
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getDocumentStatus = (tipo: string): 'PENDENTE' | 'GERADO' | 'ASSINADO' => {
    const doc = documents.find(d => d.tipo === tipo);
    return doc?.status || 'PENDENTE';
  };

  const canGenerateDoc = (tipo: string): boolean => {
    switch (tipo) {
      case 'PORTARIA': return canGeneratePortaria;
      case 'CERTIDAO_REGULARIDADE': return canGenerateCertidao;
      case 'NOTA_EMPENHO': return canGenerateNE;
      case 'NOTA_LIQUIDACAO': return canGenerateDL && isSignedBySefin;
      case 'ORDEM_BANCARIA': return canGenerateOB && isSignedBySefin;
      default: return false;
    }
  };

  // ========================================
  // HANDLERS
  // ========================================
  const handlePortariaSubmit = async (formData: any) => {
    generateDocument({ tipo: 'PORTARIA', formData });
    setShowPortariaModal(false);
  };

  const handleGenerateCertidao = async () => {
    const { data: pendenciasCheck } = await checkPendencias();
    if (pendenciasCheck?.has_pendencias) {
      alert(`❌ Servidor possui pendências:\n\n${(pendenciasCheck.detalhes || []).join('\n')}\n\nRegularize antes de gerar a certidão.`);
      return;
    }
    generateDocument({ tipo: 'CERTIDAO_REGULARIDADE' });
  };

  const handleNESubmit = async (formData: any) => {
    generateDocument({ tipo: 'NOTA_EMPENHO', formData });
    setShowNEModal(false);
  };

  const handleDLSubmit = async (formData: any) => {
    generateDocument({ tipo: 'NOTA_LIQUIDACAO', formData });
    setShowDLModal(false);
  };

  const handleOBSubmit = async (formData: any) => {
    generateDocument({ tipo: 'ORDEM_BANCARIA', formData });
    setShowOBModal(false);
  };

  const handleSendToSEFIN = async () => {
    sendToSEFIN();
    await updateStatus('WAITING_SEFIN');
  };

  const handleSendToTechnicalAnalysis = async () => {
    await updateStatus('PAYMENT_PROCESSING');
    // TODO: Navigate to Technical Analysis tab
  };

  // ========================================
  // RENDER: Document Row
  // ========================================
  const renderDocumentRow = (docConfig: typeof BLOCK_A_DOCUMENTS[0], isBlockA: boolean) => {
    const status = getDocumentStatus(docConfig.tipo);
    const canGenerate = canGenerateDoc(docConfig.tipo);
    const isLocked = !canGenerate && status === 'PENDENTE';
    const Icon = docConfig.icon;
    
    return (
      <div key={docConfig.tipo} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
        <div className="flex items-center gap-4 flex-1">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            status === 'ASSINADO' ? 'bg-emerald-100' :
            status === 'GERADO' ? 'bg-blue-100' :
            isLocked ? 'bg-slate-100' : 'bg-blue-50'
          }`}>
            {status === 'ASSINADO' ? (
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            ) : status === 'GERADO' ? (
              <Icon className="w-5 h-5 text-blue-600" />
            ) : isLocked ? (
              <Lock className="w-5 h-5 text-slate-400" />
            ) : (
              <Icon className="w-5 h-5 text-blue-500" />
            )}
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm text-slate-800">{docConfig.titulo}</p>
            {isBlockA && (
              <p className={`text-xs mt-1 flex items-center gap-1 ${
                status === 'ASSINADO' ? 'text-emerald-600' : 'text-orange-600'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  status === 'ASSINADO' ? 'bg-emerald-600' : 'bg-orange-600'
                }`}></span>
                {status === 'ASSINADO' ? '✓ Assinado pela SEFIN' : 'Requerido para SEFIN'}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            status === 'ASSINADO' ? 'bg-emerald-100 text-emerald-700' :
            status === 'GERADO' ? 'bg-blue-100 text-blue-700' :
            'bg-slate-100 text-slate-500'
          }`}>
            {status === 'ASSINADO' ? 'Assinado' : status === 'GERADO' ? 'Gerado' : 'Pendente'}
          </span>
          
          {status === 'PENDENTE' && canGenerate && (
            <button
              onClick={() => {
                if (docConfig.tipo === 'PORTARIA') setShowPortariaModal(true);
                else if (docConfig.tipo === 'CERTIDAO_REGULARIDADE') handleGenerateCertidao();
                else if (docConfig.tipo === 'NOTA_EMPENHO') setShowNEModal(true);
                else if (docConfig.tipo === 'NOTA_LIQUIDACAO') setShowDLModal(true);
                else if (docConfig.tipo === 'ORDEM_BANCARIA') setShowOBModal(true);
              }}
              disabled={isGenerating}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-bold transition-all"
            >
              {isGenerating ? (
                <><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Gerando...</>
              ) : (
                'Gerar'
              )}
            </button>
          )}
        </div>
      </div>
    );
  };

  // ========================================
  // RENDER: Loading
  // ========================================
  if (isLoadingDocs || isLoadingStatus) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-slate-600">Carregando documentos...</span>
      </div>
    );
  }

  // ========================================
  // RENDER: Main
  // ========================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
        <h3 className="text-lg font-black uppercase tracking-wide mb-2">Esteira de Execução</h3>
        <p className="text-sm text-blue-100">
          {isWaitingSefin ? 'Aguardando retorno da SEFIN...' :
           isSignedBySefin ? 'SEFIN assinou! Prossiga com a liquidação.' :
           'Gere os documentos na sequência indicada'}
        </p>
      </div>

      {/* ======================================== */}
      {/* BLOCO A: Instrução e Empenho (Pré-SEFIN) */}
      {/* ======================================== */}
      <div className={`bg-white rounded-2xl border overflow-hidden shadow-sm transition-all ${
        !canEditBlockA && !isSignedBySefin ? 'border-slate-200' : 'border-slate-200'
      }`}>
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-black text-slate-700 uppercase flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">A</span>
              Instrução e Empenho
            </h4>
            <p className="text-xs text-slate-500 mt-1">Documentos para assinatura da SEFIN</p>
          </div>
          {isSignedBySefin && (
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Concluído
            </span>
          )}
        </div>

        <div className="divide-y divide-slate-100">
          {BLOCK_A_DOCUMENTS.map(doc => renderDocumentRow(doc, true))}
        </div>

        {/* Ação: Tramitar para SEFIN */}
        {canSendToSEFIN && !isWaitingSefin && !isSignedBySefin && (
          <div className="px-6 py-4 bg-gradient-to-r from-emerald-50 to-blue-50 border-t border-slate-200">
            <button
              onClick={handleSendToSEFIN}
              disabled={isSending}
              className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
            >
              {isSending ? (
                <><Loader2 className="w-5 h-5 animate-spin" />Enviando...</>
              ) : (
                <><Send className="w-5 h-5" />Tramitar para Assinatura (SEFIN)</>
              )}
            </button>
          </div>
        )}
      </div>

      {/* ======================================== */}
      {/* BANNER: Aguardando SEFIN */}
      {/* ======================================== */}
      {isWaitingSefin && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')] opacity-10"></div>
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-black text-lg">Aguardando Ordenador de Despesas</h4>
              <p className="text-sm text-amber-100">
                Os documentos foram enviados para a SEFIN. O processo retornará automaticamente após as assinaturas.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ======================================== */}
      {/* BLOCO B: Liquidação e Pagamento (Pós-SEFIN) */}
      {/* ======================================== */}
      <div className={`bg-white rounded-2xl border overflow-hidden shadow-sm transition-all ${
        isBlockBLocked ? 'opacity-50 border-slate-200' : 'border-emerald-200 ring-2 ring-emerald-100'
      }`}>
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-black text-slate-700 uppercase flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                isBlockBLocked ? 'bg-slate-400 text-white' : 'bg-emerald-600 text-white'
              }`}>B</span>
              Liquidação e Pagamento
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              {isBlockBLocked ? 'Aguardando retorno da SEFIN para liberar' : 'Documentos de pagamento liberados!'}
            </p>
          </div>
          {isSignedBySefin && !isBlockBLocked && (
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Liberado
            </span>
          )}
        </div>

        <div className="divide-y divide-slate-100">
          {BLOCK_B_DOCUMENTS.map(doc => renderDocumentRow(doc, false))}
        </div>

        {/* Ação: Enviar para Análise Técnica */}
        {isSignedBySefin && getDocumentStatus('ORDEM_BANCARIA') === 'GERADO' && (
          <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-slate-200">
            <button
              onClick={handleSendToTechnicalAnalysis}
              className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
            >
              <ArrowRight className="w-5 h-5" />
              Concluir e Enviar para Análise Técnica
            </button>
          </div>
        )}
      </div>

      {/* ======================================== */}
      {/* Detalhamento Financeiro */}
      {/* ======================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
          <h4 className="text-sm font-black text-slate-700 uppercase">Detalhamento Financeiro</h4>
          <p className="text-xs text-slate-500 mt-1">Elementos de despesa e cronograma de execução</p>
        </div>

        <div className="p-6">
          {itens && itens.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-bold text-slate-700">Elemento</th>
                    <th className="text-left py-3 px-4 font-bold text-slate-700">Descrição</th>
                    <th className="text-right py-3 px-4 font-bold text-slate-700">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {itens.map((item: any, idx: number) => {
                    const elementCode = item.element || item.codigo || item.element_code || '';
                    const description = item.desc || item.descricao || item.description || EXPENSE_ELEMENT_LABELS[elementCode] || '-';
                    return (
                      <tr key={idx} className="border-b border-slate-100">
                        <td className="py-3 px-4 font-mono text-slate-600">{elementCode || '-'}</td>
                        <td className="py-3 px-4 text-slate-700">{description}</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-800">
                          {formatCurrency(item.val || item.valor || item.value || 0)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50">
                    <td colSpan={2} className="py-3 px-4 font-bold text-slate-800">Total Geral</td>
                    <td className="py-3 px-4 text-right font-bold text-blue-600 text-lg">
                      {formatCurrency(totalGeral)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <p className="text-center text-slate-500 py-8">Nenhum item de despesa cadastrado</p>
          )}
        </div>
      </div>

      {/* ========================================
          MODAIS
          ======================================== */}
      
      {showPortariaModal && (
        <PortariaFormModal
          isOpen={showPortariaModal}
          onClose={() => setShowPortariaModal(false)}
          onSubmit={handlePortariaSubmit}
          expenseElements={itens.map((item: any) => item.element || item.codigo || item.elemento).filter(Boolean)}
        />
      )}

      {showNEModal && (
        <NotaEmpenhoFormModal
          isOpen={showNEModal}
          onClose={() => setShowNEModal(false)}
          onSubmit={handleNESubmit}
          processData={enrichedProcessData || processData}
        />
      )}

      {showDLModal && (
        <DocumentoLiquidacaoFormModal
          isOpen={showDLModal}
          onClose={() => setShowDLModal(false)}
          onSubmit={handleDLSubmit}
          processData={enrichedProcessData || processData}
          neData={state.ne || undefined}
        />
      )}

      {showOBModal && (
        <OrdemBancariaFormModal
          isOpen={showOBModal}
          onClose={() => setShowOBModal(false)}
          onSubmit={handleOBSubmit}
          processData={enrichedProcessData || processData}
          neData={state.ne || undefined}
        />
      )}
    </div>
  );
};
