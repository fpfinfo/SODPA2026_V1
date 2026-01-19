import React, { useState } from 'react';
import { Receipt, Calculator, Calendar, Banknote, FileText, CheckCircle, Clock, Send, AlertCircle, Loader2, Lock } from 'lucide-react';
import { useProcessExecution } from '../../../hooks/useProcessExecution';
import { useServidorRegularidade } from '../../../hooks/useServidorRegularidade';
import { PortariaFormModal } from '../Modals/PortariaFormModal';
import { NotaEmpenhoFormModal } from '../Modals/NotaEmpenhoFormModal';
import { DocumentoLiquidacaoFormModal } from '../Modals/DocumentoLiquidacaoFormModal';
import { OrdemBancariaFormModal } from '../Modals/OrdemBancariaFormModal';

interface ExecutionTabProps {
  processData: any;
  enrichedProcessData?: any;
}

const EXECUTION_DOCUMENTS = [
  { tipo: 'PORTARIA', titulo: 'Portaria de Concessão', requiredForSEFIN: true },
  { tipo: 'CERTIDAO_REGULARIDADE', titulo: 'Certidão de Regularidade', requiredForSEFIN: true },
  { tipo: 'NOTA_EMPENHO', titulo: 'Nota de Empenho', requiredForSEFIN: true },
  { tipo: 'NOTA_LIQUIDACAO', titulo: 'Nota de Liquidação', requiredForSEFIN: false },
  { tipo: 'ORDEM_BANCARIA', titulo: 'Ordem Bancária', requiredForSEFIN: false }
];

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
    isLoading,
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
  
  const { checkPendencias } = useServidorRegularidade(processData.suprido_id);
  
  // ========================================
  // LOCAL STATE
  // ========================================
  const [showPortariaModal, setShowPortariaModal] = useState(false);
  const [showNEModal, setShowNEModal] = useState(false);
  const [showDLModal, setShowDLModal] = useState(false);
  const [showOBModal, setShowOBModal] = useState(false);

  const itens = enrichedProcessData?.itens_despesa || processData.items || [];
  const totalGeral = enrichedProcessData?.valor_total || processData.value || 0;

  // ========================================
  // HELPERS
  // ========================================
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  // ========================================
  // HANDLERS
  // ========================================
  const handlePortariaSubmit = async (formData: any) => {
    generateDocument({ tipo: 'PORTARIA', formData });
    setShowPortariaModal(false);
  };

  const handleGenerateCertidao = async () => {
    // Validar pendências do servidor
    const { data: pendenciasCheck } = await checkPendencias();
    
    if (pendenciasCheck?.has_pendencias) {
      alert(`❌ Servidor possui pendências:\n\n${(pendenciasCheck.detalhes || []).join('\n')}\n\nRegularize antes de gerar a certidão.`);
      return;
    }
    
    // Gerar certidão se regularizado
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

  const handleSendToSEFIN = () => {
    sendToSEFIN();
  };

  // ========================================
  // RENDER HELPERS
  // ========================================
  const getDocumentStatus = (tipo: string): 'PENDENTE' | 'GERADO' | 'ASSINADO' => {
    const doc = documents.find(d => d.tipo === tipo);
    return doc?.status || 'PENDENTE';
  };

  const canGenerateDoc = (tipo: string): boolean => {
    switch (tipo) {
      case 'PORTARIA': return canGeneratePortaria;
      case 'CERTIDAO_REGULARIDADE': return canGenerateCertidao;
      case 'NOTA_EMPENHO': return canGenerateNE;
      case 'NOTA_LIQUIDACAO': return canGenerateDL;
      case 'ORDEM_BANCARIA': return canGenerateOB;
      default: return false;
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'ASSINADO': return 'Assinado';
      case 'GERADO': return 'Gerado';
      default: return 'Pendente';
    }
  };

  const getLockReason = (tipo: string): string | null => {
    if (canGenerateDoc(tipo)) return null;
    
    switch (tipo) {
      case 'CERTIDAO_REGULARIDADE': return 'Gere a Portaria primeiro';
      case 'NOTA_EMPENHO': return 'Gere a Certidão primeiro';
      case 'NOTA_LIQUIDACAO': return 'Aguarde retorno da SEFIN';
      case 'ORDEM_BANCARIA': return 'Gere a Nota de Liquidação primeiro';
      default: return null;
    }
  };

  // ========================================
  // RENDER
  // ========================================
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-slate-600">Carregando documentos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Fase de Execução Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
        <h3 className="text-lg font-black uppercase tracking-wide mb-2">Fase de Execução</h3>
        <p className="text-sm text-blue-100">Gere os documentos na sequência indicada</p>
      </div>

      {/* Documentos de Execução */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
          <h4 className="text-sm font-black text-slate-700 uppercase">
            Documentos de Execução
          </h4>
        </div>

        <div className="divide-y divide-slate-100">
          {EXECUTION_DOCUMENTS.map((docConfig, idx) => {
            const status = getDocumentStatus(docConfig.tipo);
            const canGenerate = canGenerateDoc(docConfig.tipo);
            const isLocked = !canGenerate && status === 'PENDENTE';
            const lockReason = getLockReason(docConfig.tipo);
            
            return (
              <div key={idx} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4 flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    status === 'GERADO' || status === 'ASSINADO'
                      ? 'bg-emerald-100'
                      : isLocked
                      ? 'bg-slate-100'
                      : 'bg-blue-50'
                  }`}>
                    {status === 'GERADO' || status === 'ASSINADO' ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    ) : isLocked ? (
                      <Lock className="w-5 h-5 text-slate-400" />
                    ) : (
                      <FileText className="w-5 h-5 text-blue-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-slate-800">{docConfig.titulo}</p>
                    {docConfig.requiredForSEFIN && (
                      <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-600"></span>
                        Requerido para SEFIN
                      </p>
                    )}
                    {isLocked && lockReason && (
                      <p className="text-xs text-slate-500 mt-1 italic">
                        {lockReason}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    status === 'ASSINADO' 
                      ? 'bg-emerald-100 text-emerald-700'
                      : status === 'GERADO'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {getStatusText(status)}
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
                        <>
                          <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                          Gerando...
                        </>
                      ) : (
                        'Gerar'
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detalhamento Financeiro */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
          <h4 className="text-sm font-black text-slate-700 uppercase">
            Detalhamento Financeiro
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Elementos de despesa e cronograma de execução
          </p>
        </div>

        <div className="p-6">
          {/* Itens de Despesa Table */}
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
                  {itens.map((item: any, idx: number) => (
                    <tr key={idx} className="border-b border-slate-100">
                      <td className="py-3 px-4 font-mono text-slate-600">{item.codigo || item.element_code}</td>
                      <td className="py-3 px-4 text-slate-700">{item.descricao || item.description}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-800">
                        {formatCurrency(item.valor || item.value)}
                      </td>
                    </tr>
                  ))}
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

      {/* Ações Finais */}
      <div className="flex items-center justify-between gap-4 pt-4">
        <button
          onClick={() => window.history.back()}
          className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-bold hover:bg-slate-50 transition-all"
        >
          Voltar
        </button>

        {canSendToSEFIN && (
          <button
            onClick={handleSendToSEFIN}
            disabled={isSending}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg font-bold flex items-center gap-2 transition-all"
          >
            {isSending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Aprovar e Encaminhar (SEFIN)
              </>
            )}
          </button>
        )}
      </div>

      {/* ========================================
          MODAIS
          ======================================== */}
      
      {showPortariaModal && (
        <PortariaFormModal
          isOpen={showPortariaModal}
          onClose={() => setShowPortariaModal(false)}
          onSubmit={handlePortariaSubmit}
          processData={processData}
        />
      )}

      {showNEModal && (
        <NotaEmpenhoFormModal
          isOpen={showNEModal}
          onClose={() => setShowNEModal(false)}
          onSubmit={handleNESubmit}
          processData={processData}
        />
      )}

      {showDLModal && (
        <DocumentoLiquidacaoFormModal
          isOpen={showDLModal}
          onClose={() => setShowDLModal(false)}
          onSubmit={handleDLSubmit}
          processData={processData}
          neData={state.ne || undefined}
        />
      )}

      {showOBModal && (
        <OrdemBancariaFormModal
          isOpen={showOBModal}
          onClose={() => setShowOBModal(false)}
          onSubmit={handleOBSubmit}
          processData={processData}
          neData={state.ne || undefined}
        />
      )}
    </div>
  );
};
