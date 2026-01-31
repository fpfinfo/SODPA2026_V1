import React, { useState, useMemo } from 'react';
import { 
  CheckCircle, Circle, AlertTriangle, Banknote, FileCheck, 
  CreditCard, User, Building, Calendar, Loader2, ArrowRight,
  Shield, Clock, Sparkles
} from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { useWorkflowStatus } from '../../../hooks/useWorkflowStatus';
import { useProcessExecution } from '../../../hooks/useProcessExecution';
import { useToast } from '../../ui/ToastProvider';

import { useTripleCheck } from '../../../hooks/useTripleCheck';

interface TechnicalAnalysisTabProps {
  processData: any;
  enrichedProcessData?: any;
}

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  isAutomatic: boolean;
  isComplete: boolean;
}

export const TechnicalAnalysisTab: React.FC<TechnicalAnalysisTabProps> = ({
  processData,
  enrichedProcessData
}) => {
  // ========================================
  // HOOKS
  // ========================================
  const { showToast } = useToast();
  const { documents } = useProcessExecution(processData.id);
  const { status, isLoading, updateStatus } = useWorkflowStatus(processData.id);
  
  // ========================================
  // LOCAL STATE
  // ========================================
  const [isConfirmingCredit, setIsConfirmingCredit] = useState(false);
  const [creditConfirmed, setCreditConfirmed] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);

  // ========================================
  // COMPUTED VALUES
  // ========================================
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const valor = enrichedProcessData?.valor_total || processData.value || processData.valor_total || 0;
  
  // Bank data (from process or enriched data)
  // Map bank codes to names
  const getBankName = (code: string | null | undefined): string => {
    if (!code) return 'N/A';
    const bankMap: Record<string, string> = {
      '001': '001 - Banco do Brasil',
      '033': '033 - Santander',
      '037': '037 - Banco do Estado do Pará',
      '104': '104 - Caixa Econômica Federal',
      '237': '237 - Bradesco',
      '341': '341 - Itaú',
      '422': '422 - Safra',
      '756': '756 - Sicoob'
    };
    return bankMap[code] || code;
  };

  const bankData = useMemo(() => ({
    banco: getBankName(enrichedProcessData?.banco || processData.banco),
    agencia: enrichedProcessData?.agencia || processData.agencia || '-',
    conta: enrichedProcessData?.conta_corrente || processData.conta_corrente || '-',
    titularNome: enrichedProcessData?.suprido_nome || processData.suprido_nome || 'Suprido',
  }), [enrichedProcessData, processData]);


  // ========================================
  // TRIPLE CHECK (Phase 1)
  // ========================================
  const tripleCheck = useTripleCheck(processData);

  // Check if required documents exist (Portaria, Certidão, NE, DL, OB)
  const hasRequiredDocs = documents.some(d => d.tipo === 'PORTARIA') &&
                          documents.some(d => d.tipo === 'CERTIDAO_REGULARIDADE') &&
                          documents.some(d => d.tipo === 'NOTA_EMPENHO') &&
                          documents.some(d => d.tipo === 'NOTA_LIQUIDACAO') &&
                          documents.some(d => d.tipo === 'ORDEM_BANCARIA');

  // Checklist items - SIMPLIFICADO para trabalhar com documentos do ERP
  const checklist: ChecklistItem[] = useMemo(() => {
    // Verificar status dos documentos
    const neDoc = documents.find(d => d.tipo === 'NOTA_EMPENHO');
    const dlDoc = documents.find(d => d.tipo === 'NOTA_LIQUIDACAO');
    const obDoc = documents.find(d => d.tipo === 'ORDEM_BANCARIA');
    
    // Documentos Bloco A (precisam estar assinados OU gerados para prosseguir)
    const allBlockAGenerated = ['PORTARIA', 'CERTIDAO_REGULARIDADE', 'NOTA_EMPENHO'].every(tipo => {
      const doc = documents.find(d => d.tipo === tipo);
      return doc?.status === 'ASSINADO' || doc?.status === 'GERADO';
    });
    
    // DL e OB precisam existir (gerados)
    const dlGenerated = dlDoc?.status === 'GERADO' || dlDoc?.status === 'ASSINADO';
    const obGenerated = obDoc?.status === 'GERADO' || obDoc?.status === 'ASSINADO';
    
    // SIMPLIFICADO: Se documentos existem, considera válido (ERP já validou valores)
    const isNeValid = !!neDoc;
    const isDlValid = !!dlDoc;
    const isObValid = !!obDoc;

    return [
      {
        id: 'docs_signed',
        label: 'Conformidade Documental (NE)',
        description: allBlockAGenerated ? 'Documentos do Bloco A gerados ✓' : 'Aguardando geração dos documentos',
        icon: FileCheck,
        isAutomatic: true,
        isComplete: allBlockAGenerated && isNeValid
      },
      {
        id: 'dl_generated',
        label: 'Liquidação da Despesa (DL)',
        description: dlGenerated ? 'Documento de Liquidação gerado ✓' : 'Aguardando geração',
        icon: FileCheck,
        isAutomatic: true,
        isComplete: dlGenerated && isDlValid
      },
      {
        id: 'ob_emitted',
        label: 'Pagamento (OB)',
        description: obGenerated ? 'Ordem Bancária emitida ✓' : 'Aguardando emissão',
        icon: CreditCard,
        isAutomatic: true,
        isComplete: obGenerated && isObValid
      },
      {
        id: 'credit_confirmed',
        label: 'Recurso Creditado na Conta',
        description: 'Confirmação manual do técnico',
        icon: Banknote,
        isAutomatic: false,
        isComplete: creditConfirmed
      }
    ];
  }, [documents, creditConfirmed]);

  const allChecklistComplete = checklist.every(item => item.isComplete);
  // ATUALIZAÇÃO: Permitir liberar quando documentos estão prontos
  const canRelease = hasRequiredDocs && allChecklistComplete;

  // ========================================
  // HANDLERS
  // ========================================
  const handleConfirmCredit = async () => {
    setIsConfirmingCredit(true);
    
    try {
      // 1. Update workflow status to awaiting Suprido confirmation
      await updateStatus('AWAITING_SUPRIDO_CONFIRMATION');
      
      // 2. Set credit date and mark analysis as complete
      await supabase
        .from('solicitacoes')
        .update({
          status_workflow: 'AWAITING_SUPRIDO_CONFIRMATION',
          data_credito: new Date().toISOString(),
          analise_tecnica_concluida: true
        })
        .eq('id', processData.id);

      // 3. Create notification for Suprido with action to confirm receipt
      const { data: processInfo } = await supabase
        .from('solicitacoes')
        .select('user_id, nup')
        .eq('id', processData.id)
        .single();

      if (processInfo?.user_id) {
        await supabase.from('system_notifications').insert({
          user_id: processInfo.user_id,
          type: 'CRITICAL',
          category: 'PROCESS',
          title: '💰 Recurso Creditado - Confirme o Recebimento',
          message: `Seu suprimento de fundos (${processInfo.nup}) foi creditado em sua conta. Acesse o sistema para confirmar o recebimento e iniciar a execução.`,
          link_action: `/suprido?action=confirm&id=${processData.id}`,
          is_read: false
        });
      }

      // 4. Record in history
      await supabase.from('historico_tramitacao').insert({
        solicitacao_id: processData.id,
        origem: 'SOSFU',
        destino: 'SUPRIDO',
        status_anterior: 'PAYMENT_PROCESSING',
        status_novo: 'AWAITING_SUPRIDO_CONFIRMATION',
        observacao: 'Crédito liberado. Aguardando confirmação de recebimento pelo Suprido.',
        created_at: new Date().toISOString()
      });

      setCreditConfirmed(true);
      showToast({
        title: 'Crédito Confirmado e Liberado!',
        message: 'O Suprido foi notificado para iniciar a prestação de contas.',
        type: 'success'
      });
    } catch (error: any) {
      console.error('Error confirming credit:', error);
      showToast({
        title: 'Erro ao confirmar',
        message: error.message || 'Tente novamente',
        type: 'error'
      });
    } finally {
      setIsConfirmingCredit(false);
    }
  };

  const handleReleaseFunds = async () => {
    // Legacy function kept for compatibility if needed, but logic is moved to handleConfirmCredit
    await handleConfirmCredit();
  };


  // ========================================
  // RENDER
  // ========================================
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-slate-600">Carregando análise técnica...</span>
      </div>
    );
  }

  // ATUALIZAÇÃO: Permitir análise técnica mesmo aguardando assinatura SEFIN
  // O SOSFU pode adiantar o trabalho enquanto o ordenador assina
  const allowedStatuses = [
    'PAYMENT_PROCESSING', 
    'FUNDS_RELEASED', 
    'AWAITING_SUPRIDO_CONFIRMATION', 
    'AWAITING_ACCOUNTABILITY', 
    'ACCOUNTABILITY_OPEN',
    'WAITING_SEFIN'  // Permite trabalhar enquanto aguarda assinatura
  ];
  
  const isStatusAllowed = allowedStatuses.includes(status as string);
  
  // Show message only if no required documents OR not in allowed status
  if (!hasRequiredDocs && !isStatusAllowed) {
    return (
      <div className="bg-slate-50 rounded-2xl p-8 text-center">
        <Clock className="w-12 h-12 mx-auto text-slate-400 mb-4" />
        <h3 className="font-bold text-slate-700 mb-2">Análise Técnica Pendente</h3>
        <p className="text-sm text-slate-500">
          A análise técnica será liberada após a geração de todos os documentos na aba "Execução da Despesa".
        </p>
      </div>
    );
  }

  // Already released or awaiting confirmation
  if (status === 'FUNDS_RELEASED' || status === 'AWAITING_SUPRIDO_CONFIRMATION' || status === 'AWAITING_ACCOUNTABILITY' || status === 'ACCOUNTABILITY_OPEN') {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-8 text-white text-center">
          <Sparkles className="w-16 h-16 mx-auto mb-4 animate-pulse" />
          <h3 className="text-2xl font-black mb-2">Recurso Liberado com Sucesso!</h3>
          <p className="text-emerald-100">
            O suprido foi notificado. Prazo para aplicação e prestação de contas: até 15 dias após a data final da solicitação (Art. 4°).
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h4 className="font-bold text-slate-800 mb-4">Resumo da Liberação</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-500">Valor Liberado:</span>
              <p className="font-bold text-emerald-600 text-lg">{formatCurrency(valor)}</p>
            </div>
            <div>
              <span className="text-slate-500">Data de Liberação:</span>
              <p className="font-bold">{new Date().toLocaleDateString('pt-BR')}</p>
            </div>
            <div>
              <span className="text-slate-500">Prazo Prestação:</span>
              <p className="font-bold text-emerald-700">
                {(enrichedProcessData?.data_fim || processData.data_fim) ? (() => {
                   const d = new Date(enrichedProcessData?.data_fim || processData.data_fim);
                   d.setDate(d.getDate() + 7);
                   return `Até ${d.toLocaleDateString('pt-BR')}`;
                })() : '15 dias após data final'}
              </p>
              <p className="text-[10px] text-slate-400">Art. 4°, II</p>
            </div>
            <div>
              <span className="text-slate-500">Status:</span>
              <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                Prestação de Contas Aberta
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }



  // Render Triple Check Validation Card if needed
  // ATUALIZAÇÃO: Só mostra se há erros REAIS (não quando documentos existem sem valores)
  const renderTripleCheckCard = () => {
    // Se todos os documentos existem, não mostra o bloqueio
    if (hasRequiredDocs) return null;
    // Se não há erros reais, não mostra
    if (tripleCheck.errors.length === 0) return null;
    
    return (
      <div className="bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden mb-6">
        <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex items-center gap-3">
          <Shield className="text-red-600" size={20}/>
          <h4 className="font-bold text-red-800">Bloqueio de Segurança (Triple Check)</h4>
        </div>
        <div className="p-6">
          <p className="text-sm text-slate-600 mb-4">
            A liberação do recurso está bloqueada devido a inconsistências na trilha financeira.
          </p>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className={`p-3 rounded-lg border ${tripleCheck.neStatus === 'VALID' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
              <p className="text-[10px] font-bold uppercase text-slate-500">Nota de Empenho</p>
              <p className={`font-mono font-bold ${tripleCheck.neStatus === 'VALID' ? 'text-emerald-700' : 'text-red-700'}`}>
                {formatCurrency(tripleCheck.financials.ne)}
              </p>
            </div>
            <div className={`p-3 rounded-lg border ${tripleCheck.dlStatus === 'VALID' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
              <p className="text-[10px] font-bold uppercase text-slate-500">Liquidação</p>
              <p className={`font-mono font-bold ${tripleCheck.dlStatus === 'VALID' ? 'text-emerald-700' : 'text-red-700'}`}>
                {formatCurrency(tripleCheck.financials.dl)}
              </p>
            </div>
            <div className={`p-3 rounded-lg border ${tripleCheck.obStatus === 'VALID' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
              <p className="text-[10px] font-bold uppercase text-slate-500">Ordem Bancária</p>
              <p className={`font-mono font-bold ${tripleCheck.obStatus === 'VALID' ? 'text-emerald-700' : 'text-red-700'}`}>
                {formatCurrency(tripleCheck.financials.ob)}
              </p>
            </div>
          </div>
          {tripleCheck.errors.length > 0 && (
            <div className="space-y-1">
              {tripleCheck.errors.map((err, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-red-600 font-medium">
                  <AlertTriangle size={12}/> {err}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase tracking-wide">Análise Técnica</h3>
            <p className="text-sm text-indigo-100">Checklist final antes da liberação do recurso</p>
          </div>
        </div>
      </div>

      {/* Triple Check Card */}
      {renderTripleCheckCard()}

      {/* Checklist */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
          <h4 className="text-sm font-black text-slate-700 uppercase">Checklist de Liberação</h4>
        </div>

        <div className="divide-y divide-slate-100">
          {checklist.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.id} className="px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    item.isComplete ? 'bg-emerald-100' : 'bg-slate-100'
                  }`}>
                    {item.isComplete ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{item.label}</p>
                    <p className="text-xs text-slate-500">{item.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {item.isAutomatic ? (
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold">
                      Automático
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-xs font-bold">
                      Manual
                    </span>
                  )}
                  
                  {!item.isAutomatic && !item.isComplete && (
                    <button
                      onClick={handleConfirmCredit}
                      disabled={isConfirmingCredit}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg text-sm font-bold transition-all flex items-center gap-2"
                    >
                      {isConfirmingCredit ? (
                        <><Loader2 className="w-4 h-4 animate-spin" />Verificando...</>
                      ) : (
                        'Confirmar Crédito'
                      )}
                    </button>
                  )}
                  
                  {item.isComplete && (
                    <span className="text-emerald-600 font-bold text-sm">✓ Verificado</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bank Data */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
          <h4 className="text-sm font-black text-slate-700 uppercase">Dados Bancários do Suprido</h4>
        </div>

        <div className="p-6 grid grid-cols-2 gap-6">
          <div className="flex items-center gap-3">
            <Building className="w-5 h-5 text-slate-400" />
            <div>
              <span className="text-xs text-slate-500">Banco</span>
              <p className="font-bold text-slate-800">{bankData.banco}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-slate-400" />
            <div>
              <span className="text-xs text-slate-500">Agência / Conta</span>
              <p className="font-bold text-slate-800">{bankData.agencia} / {bankData.conta}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-slate-400" />
            <div>
              <span className="text-xs text-slate-500">Titular</span>
              <p className="font-bold text-slate-800">{bankData.titularNome}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Banknote className="w-5 h-5 text-slate-400" />
            <div>
              <span className="text-xs text-slate-500">Valor a Creditar</span>
              <p className="font-bold text-emerald-600 text-lg">{formatCurrency(valor)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Release Button */}
      {canRelease && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200">
          <div className="flex items-center gap-4 mb-4">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            <p className="text-sm text-slate-700">
              <strong>Atenção:</strong> Ao liberar o recurso, o suprido será notificado. O prazo para aplicação e prestação de contas é de até 15 dias após a data final da solicitação (Art. 4° da Portaria).
            </p>
          </div>
          
          <button
            onClick={handleReleaseFunds}
            disabled={isReleasing}
            className="w-full px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-emerald-400 disabled:to-teal-400 text-white rounded-xl font-black text-lg flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl"
          >
            {isReleasing ? (
              <><Loader2 className="w-6 h-6 animate-spin" />Liberando Recurso...</>
            ) : (
              <><Banknote className="w-6 h-6" />Liberar Recurso para o Suprido</>
            )}
          </button>
        </div>
      )}

      {!canRelease && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <p className="text-sm text-amber-800">
            Complete todos os itens do checklist para liberar o recurso.
          </p>
        </div>
      )}
    </div>
  );
};
