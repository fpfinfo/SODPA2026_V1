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
  const bankData = useMemo(() => ({
    banco: enrichedProcessData?.banco_nome || processData.banco_nome || '001 - Banco do Brasil',
    agencia: enrichedProcessData?.agencia || processData.agencia || '-',
    conta: enrichedProcessData?.conta || processData.conta || '-',
    titularNome: enrichedProcessData?.suprido_nome || processData.suprido_nome || 'Suprido',
  }), [enrichedProcessData, processData]);

  // Checklist items
  const checklist: ChecklistItem[] = useMemo(() => {
    const allSigned = ['PORTARIA', 'CERTIDAO_REGULARIDADE', 'NOTA_EMPENHO'].every(tipo => 
      documents.find(d => d.tipo === tipo)?.status === 'ASSINADO'
    );
    const obGenerated = documents.find(d => d.tipo === 'ORDEM_BANCARIA')?.status === 'GERADO';
    
    return [
      {
        id: 'docs_signed',
        label: 'Documentos Assinados pela SEFIN',
        description: 'Portaria, Certidão e Nota de Empenho',
        icon: FileCheck,
        isAutomatic: true,
        isComplete: allSigned
      },
      {
        id: 'ob_emitted',
        label: 'Ordem Bancária Emitida',
        description: 'OB gerada e registrada no sistema',
        icon: CreditCard,
        isAutomatic: true,
        isComplete: obGenerated
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
  const canRelease = status === 'PAYMENT_PROCESSING' && allChecklistComplete;

  // ========================================
  // HANDLERS
  // ========================================
  const handleConfirmCredit = () => {
    setIsConfirmingCredit(true);
    // Simulate bank verification delay
    setTimeout(() => {
      setCreditConfirmed(true);
      setIsConfirmingCredit(false);
      showToast({
        title: 'Crédito Confirmado',
        message: 'Recurso verificado na conta do suprido',
        type: 'success'
      });
    }, 1500);
  };


  const handleReleaseFunds = async () => {
    setIsReleasing(true);
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

      console.log('📧 [TechnicalAnalysis] Creating notification for user_id:', processInfo?.user_id);

      if (processInfo?.user_id) {
        const { data: notificationData, error: notificationError } = await supabase.from('system_notifications').insert({
          user_id: processInfo.user_id,
          type: 'CRITICAL',
          category: 'PROCESS',
          title: '💰 Recurso Creditado - Confirme o Recebimento',
          message: `Seu suprimento de fundos (${processInfo.nup}) foi creditado em sua conta. Acesse o sistema para confirmar o recebimento.`,
          link_action: `/suprido?action=confirm&id=${processData.id}`,
          is_read: false
        }).select();

        if (notificationError) {
          console.error('❌ [TechnicalAnalysis] Notification insert error:', notificationError);
        } else {
          console.log('✅ [TechnicalAnalysis] Notification created:', notificationData);
        }
      } else {
        console.warn('⚠️ [TechnicalAnalysis] No user_id found for process:', processData.id);
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

      showToast({
        title: 'Crédito Confirmado',
        message: 'Suprido notificado para confirmar o recebimento',
        type: 'success'
      });
    } catch (error: any) {
      console.error('Error releasing funds:', error);
      showToast({
        title: 'Erro ao liberar',
        message: error.message || 'Tente novamente',
        type: 'error'
      });
    } finally {
      setIsReleasing(false);
    }
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

  // Show message if not in the right status
  if (status !== 'PAYMENT_PROCESSING' && status !== 'FUNDS_RELEASED' && status !== 'AWAITING_SUPRIDO_CONFIRMATION' && status !== 'AWAITING_ACCOUNTABILITY' && status !== 'ACCOUNTABILITY_OPEN') {
    return (
      <div className="bg-slate-50 rounded-2xl p-8 text-center">
        <Clock className="w-12 h-12 mx-auto text-slate-400 mb-4" />
        <h3 className="font-bold text-slate-700 mb-2">Análise Técnica Pendente</h3>
        <p className="text-sm text-slate-500">
          A análise técnica será liberada após a geração da Ordem Bancária na aba "Execução da Despesa".
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
            O suprido foi notificado. Prazo para prestação de contas: até 7 dias após o término do evento (Art. 4°).
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
              <p className="font-bold">30 dias</p>
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
              <strong>Atenção:</strong> Ao liberar o recurso, o suprido será notificado. O prazo para prestação de contas é de até 7 dias após o término do evento (Art. 4° da Portaria).
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
