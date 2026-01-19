import React, { useState } from 'react';
import { Receipt, Calculator, Calendar, Banknote, FileText, CheckCircle, Clock, Send, AlertCircle, Loader2, Lock } from 'lucide-react';
import { useExecutionDocuments } from '../../../hooks/useExecutionDocuments';
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
  { tipo: 'PORTARIA', titulo: 'Portaria de Concessão', requiredForSEFIN: true, needsForm: true },
  { tipo: 'CERTIDAO_REGULARIDADE', titulo: 'Certidão de Regularidade', requiredForSEFIN: true, needsForm: false },
  { tipo: 'NOTA_EMPENHO', titulo: 'Nota de Empenho', requiredForSEFIN: true, needsForm: true },
  { tipo: 'NOTA_LIQUIDACAO', titulo: 'Nota de Liquidação', requiredForSEFIN: false, needsForm: false },
  { tipo: 'ORDEM_BANCARIA', titulo: 'Ordem Bancária', requiredForSEFIN: false, needsForm: false }
];

export const ExecutionTab: React.FC<ExecutionTabProps> = ({ 
  processData, 
  enrichedProcessData 
}) => {
  const { documents, isLoading, generateWithFormData, generateSingle, sendToSEFIN } = useExecutionDocuments(processData.id);
  const { hasPendencias, detalhes, checkPendencias } = useServidorRegularidade(processData.suprido_id);
  const [isSending, setIsSending] = useState(false);
  const [showPortariaModal, setShowPortariaModal] = useState(false);
  const [showNEModal, setShowNEModal] = useState(false);
  const [showDLModal, setShowDLModal] = useState(false);
  const [showOBModal, setShowOBModal] = useState(false);
  const [generatingDoc, setGeneratingDoc] = useState<string | null>(null);

  const itens = enrichedProcessData?.itens_despesa || processData.items || [];
  const totalGeral = enrichedProcessData?.valor_total || processData.value || 0;

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

  // Lógica de controle de fluxo sequencial
  const getDocStatus = (tipo: string) => {
    const doc = documents.find(d => d.tipo === tipo);
    return doc?.status || 'PENDENTE';
  };

  const canGeneratePortaria = true; // Sempre pode gerar a primeira
  const canGenerateCertidao = getDocStatus('PORTARIA') === 'GERADO';
  const canGenerateNE = getDocStatus('CERTIDAO_REGULARIDADE') === 'GERADO';
  
  const requiredDocsForSEFIN = documents.filter(doc => 
    ['PORTARIA', 'CERTIDAO_REGULARIDADE', 'NOTA_EMPENHO'].includes(doc.tipo)
  );
  const canSendToSEFIN = requiredDocsForSEFIN.length === 3 && requiredDocsForSEFIN.every(doc => doc.status === 'GERADO');
  
  // Após retorno da SEFIN (documentos assinados)
  const docsRetornadosSEFIN = requiredDocsForSEFIN.length === 3 && requiredDocsForSEFIN.every(doc => doc.status === 'ASSINADO');
  const canGenerateDL = docsRetornadosSEFIN;
  const canGenerateOB = docsRetornadosSEFIN && getDocStatus('NOTA_LIQUIDACAO') === 'GERADO';

  // Handlers
  const handlePortariaSubmit = async (formData: any) => {
    setGeneratingDoc('PORTARIA');
    const result = await generateWithFormData('PORTARIA', formData);
    setGeneratingDoc(null);
    setShowPortariaModal(false);
    // TODO: Show toast
  };

  const handleGenerateCertidao = async () => {
    setGeneratingDoc('CERTIDAO_REGULARIDADE');
    
    // Validar pendências do servidor
    const { data: pendenciasCheck } = await checkPendencias();
    
    if (pendenciasCheck?.has_pendencias) {
      alert(`❌ Servidor possui pendências:\n\n${(pendenciasCheck.detalhes || []).join('\n')}\n\nRegularize antes de gerar a certidão.`);
      setGeneratingDoc(null);
      return;
    }
    
    // Gerar certidão se regularizado
    await generateSingle('CERTIDAO_REGULARIDADE');
    setGeneratingDoc(null);
  };

  const handleNESubmit = async (formData: any) => {
    setGeneratingDoc('NOTA_EMPENHO');
    const result = await generateWithFormData('NOTA_EMPENHO', formData);
    setGeneratingDoc(null);
    setShowNEModal(false);
  };

  const handleDLSubmit = async (formData: any) => {
    setGeneratingDoc('NOTA_LIQUIDACAO');
    const result = await generateWithFormData('NOTA_LIQUIDACAO', formData);
    setGeneratingDoc(null);
    setShowDLModal(false);
  };

  const handleOBSubmit = async (formData: any) => {
    setGeneratingDoc('ORDEM_BANCARIA');
    const result = await generateWithFormData('ORDEM_BANCARIA', formData);
    setGeneratingDoc(null);
    setShowOBModal(false);
  };

  const handleSendToSEFIN = async () => {
    setIsSending(true);
    const result = await sendToSEFIN();
    setIsSending(false);
  };

  const getButtonConfig = (tipo: string) => {
    const status = getDocStatus(tipo);
    let canGenerate = false;
    let isLocked = false;
    let lockReason = '';

    switch(tipo) {
      case 'PORTARIA':
        canGenerate = canGeneratePortaria && status === 'PENDENTE';
        break;
      case 'CERTIDAO_REGULARIDADE':
        canGenerate = canGenerateCertidao && status === 'PENDENTE';
        isLocked = !canGenerateCertidao;
        lockReason = 'Gere a Portaria primeiro';
        break;
      case 'NOTA_EMPENHO':
        canGenerate = canGenerateNE && status === 'PENDENTE';
        isLocked = !canGenerateNE;
        lockReason = 'Gere a Certidão primeiro';
        break;
      case 'NOTA_LIQUIDACAO':
        canGenerate = canGenerateDL && status === 'PENDENTE';
        isLocked = !canGenerateDL;
        lockReason = 'Aguarde retorno da SEFIN';
        break;
      case 'ORDEM_BANCARIA':
        canGenerate = canGenerateOB && status === 'PENDENTE';
        isLocked = !canGenerateOB;
        lockReason = 'Gere a Nota de Liquidação primeiro';
        break;
    }

    return { canGenerate, isLocked, lockReason, status };
  };

  return (
    <div className="p-8 space-y-8">
      {/* Modals */}
      {showPortariaModal && (
        <PortariaFormModal
          onSubmit={handlePortariaSubmit}
          onClose={() => setShowPortariaModal(false)}
          isLoading={generatingDoc === 'PORTARIA'}
        />
      )}
      {showNEModal && (
        <NotaEmpenhoFormModal
          onSubmit={handleNESubmit}
          onClose={() => setShowNEModal(false)}
          isLoading={generatingDoc === 'NOTA_EMPENHO'}
        />
      )}

      {/* Status Card */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black">Fase de Execução</h3>
            <p className="text-sm opacity-90 mt-1">
              {canSendToSEFIN 
                ? 'Documentos prontos - Tramite para SEFIN'
                : docsRetornadosSEFIN
                ? 'Complete os documentos finais'
                : 'Gere os documentos na sequência indicada'}
            </p>
          </div>
          {canSendToSEFIN && (
            <CheckCircle className="w-12 h-12 opacity-80" />
          )}
        </div>
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
            const { canGenerate, isLocked, lockReason, status } = getButtonConfig(docConfig.tipo);
            const isGenerating = generatingDoc === docConfig.tipo;
            
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

      {/* Botão Enviar para SEFIN */}
      {canSendToSEFIN && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h4 className="font-black text-amber-900 mb-2">
                Documentos Prontos para Assinatura
              </h4>
              <p className="text-sm text-amber-800 mb-4">
                A Portaria, Certidão e Nota de Empenho foram geradas e precisam ser 
                tramitadas para a SEFIN para assinatura.
              </p>
              <button
                onClick={handleSendToSEFIN}
                disabled={isSending}
                className="px-6 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg transition-all"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Tramitar para SEFIN (Assinatura)
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-blue-100 rounded-xl">
          <Receipt className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-900">Detalhamento Financeiro</h3>
          <p className="text-sm text-slate-500">Elementos de despesa e cronograma de execução</p>
        </div>
      </div>

      {/* Itens de Despesa */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
          <h4 className="text-sm font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Elementos de Despesa
          </h4>
        </div>
        <table className="w-full">
          <thead className="bg-slate-100 text-xs font-bold text-slate-600 uppercase">
            <tr>
              <th className="px-6 py-3 text-left">Código</th>
              <th className="px-6 py-3 text-left">Descrição</th>
              <th className="px-6 py-3 text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {itens.length > 0 ? (
              itens.map((item: any, idx: number) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-sm text-blue-600 font-bold">
                    {item.codigo || item.element || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {item.descricao || item.description || item.desc || 'Despesa'}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-sm text-slate-900">
                    {formatCurrency(item.valor_total || item.value || item.val || 0)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-sm text-slate-400">
                  Nenhum item de despesa cadastrado
                </td>
              </tr>
            )}
          </tbody>
          {itens.length > 0 && (
            <tfoot className="bg-slate-800 text-white">
              <tr>
                <td colSpan={2} className="px-6 py-4 text-sm font-bold uppercase">
                  Total Geral
                </td>
                <td className="px-6 py-4 text-right text-lg font-black">
                  {formatCurrency(totalGeral)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Timeline de Execução */}
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h4 className="text-sm font-black text-slate-700 uppercase">
            Cronograma de Execução
          </h4>
        </div>
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 shadow-lg">
              <div className="w-4 h-4 rounded-full bg-white"></div>
            </div>
            <div className="flex-1 bg-white rounded-xl p-4 shadow-sm">
              <p className="text-sm font-bold text-slate-800">Solicitação Criada</p>
              <p className="text-xs text-slate-500 mt-1">
                {formatDate(processData.createdAt || processData.created_at)}
              </p>
            </div>
          </div>
          
          {enrichedProcessData?.data_inicio && enrichedProcessData?.data_fim && (
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                <div className="w-4 h-4 rounded-full bg-white"></div>
              </div>
              <div className="flex-1 bg-white rounded-xl p-4 shadow-sm">
                <p className="text-sm font-bold text-slate-800">Período de Execução</p>
                <p className="text-xs text-slate-500 mt-1">
                  De {formatDate(enrichedProcessData.data_inicio)} até{' '}
                  {formatDate(enrichedProcessData.data_fim)}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-300 flex items-center justify-center flex-shrink-0">
              <div className="w-4 h-4 rounded-full bg-white"></div>
            </div>
            <div className="flex-1 bg-white/50 rounded-xl p-4 border-2 border-dashed border-slate-200">
              <p className="text-sm font-bold text-slate-400">Prestação de Contas</p>
              <p className="text-xs text-slate-400 mt-1">
                Aguardando execução
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Resumo Financeiro */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Banknote className="w-4 h-4 text-blue-600" />
            <p className="text-xs font-bold text-slate-500 uppercase">Valor Solicitado</p>
          </div>
          <p className="text-2xl font-black text-blue-600">
            {formatCurrency(totalGeral)}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="w-4 h-4 text-amber-600" />
            <p className="text-xs font-bold text-slate-500 uppercase">INSS Retido</p>
          </div>
          <p className="text-2xl font-black text-amber-600">
            {formatCurrency(enrichedProcessData?.inss_total || 0)}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Receipt className="w-4 h-4 text-emerald-600" />
            <p className="text-xs font-bold text-slate-500 uppercase">Valor Líquido</p>
          </div>
          <p className="text-2xl font-black text-emerald-600">
            {formatCurrency(totalGeral - (enrichedProcessData?.inss_total || 0))}
          </p>
        </div>
      </div>

      {/* Modais */}
      <PortariaFormModal
        isOpen={showPortariaModal}
        onClose={() => setShowPortariaModal(false)}
        onSubmit={handlePortariaSubmit}
        isLoading={generatingDoc === 'PORTARIA'}
      />

      {showNEModal && (
        <NotaEmpenhoFormModal
          onSubmit={handleNESubmit}
          onClose={() => setShowNEModal(false)}
          isLoading={generatingDoc === 'NOTA_EMPENHO'}
        />
      )}

      {(showDLModal && documents.find(d => d.tipo === 'NOTA_EMPENHO')?.fonte_recurso) && (
        <DocumentoLiquidacaoFormModal
          fonteRecursoNE={documents.find(d => d.tipo === 'NOTA_EMPENHO')!.fonte_recurso!}
          onSubmit={handleDLSubmit}
          onClose={() => setShowDLModal(false)}
          isLoading={generatingDoc === 'NOTA_LIQUIDACAO'}
        />
      )}

      {(showOBModal && documents.find(d => d.tipo === 'NOTA_EMPENHO')?.fonte_recurso) && (
        <OrdemBancariaFormModal
          fonteRecursoNE={documents.find(d => d.tipo === 'NOTA_EMPENHO')!.fonte_recurso!}
          onSubmit={handleOBSubmit}
          onClose={() => setShowOBModal(false)}
          isLoading={generatingDoc === 'ORDEM_BANCARIA'}
        />
      )}
    </div>
  );
};
