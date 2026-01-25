import React, { useEffect, useState, useMemo } from 'react';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  RefreshCw,
  DollarSign,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Send,
  ArrowLeft,
  AlertCircle,
  Database,
  ClipboardCheck,
  Square,
  CheckSquare,
  User,
  Calculator,
  Receipt,
  Loader2,
  Sparkles
} from 'lucide-react';
import { usePrestacaoContas } from '../../hooks/usePrestacaoContas';
import { useComprovantes, ELEMENTOS_DESPESA } from '../../hooks/useComprovantes';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../ui/ToastProvider';

// =============================================================================
// TYPES
// =============================================================================

interface PrestacaoContasTabProps {
  solicitacaoId: string;
  processData: {
    nup: string;
    valorConcedido: number;
    supridoNome: string;
    dataFim?: string;           // Data final do evento (formulário de solicitação)
    portariaData?: string;      // Data de emissão da Portaria
    prazoPrestacao?: string;
  };
  onBaixaSiafe: () => void;
  onDevolver: () => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export const PrestacaoContasTab: React.FC<PrestacaoContasTabProps> = ({
  solicitacaoId,
  processData,
  onBaixaSiafe,
  onDevolver
}) => {
  const { showToast } = useToast();
  const [motivoDevoluacao, setMotivoDevoluacao] = useState('');
  const [showDevoluacaoForm, setShowDevoluacaoForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasAtestoGestor, setHasAtestoGestor] = useState(false);
  const [isAutoAnalyzing, setIsAutoAnalyzing] = useState(false);
  
  // Admin Override States
  const [showAdminOverride, setShowAdminOverride] = useState(false);
  const [adminOverrideReason, setAdminOverrideReason] = useState('');
  
  // Checklist state
  const [checklist, setChecklist] = useState({
    periodoDentroDoLimite: false,
    prazoPrestacaoContas: false,    // Novo: Prazo de PC (Art. 4°)
    elementosCompativeis: false,
    valoresConferem: false,
    documentosPFCompletos: false,
    calculosINSSCorretos: false,
    gdrINSSAnexada: false,
    gdrSaldoAnexada: false,
    atestoGestorPresente: false
  });
  
  const toggleChecklistItem = (key: keyof typeof checklist) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ==========================================================================
  // PERIOD CALCULATIONS (Art. 4° da Portaria)
  // ==========================================================================
  const periodInfo = useMemo(() => {
    const portariaDate = processData.portariaData ? new Date(processData.portariaData) : null;
    const dataFimDate = processData.dataFim ? new Date(processData.dataFim) : null;
    
    // Período de Aplicação: Da emissão da Portaria até a data final do evento
    let diasAplicacao = 0;
    if (portariaDate && dataFimDate) {
      diasAplicacao = Math.ceil((dataFimDate.getTime() - portariaDate.getTime()) / (1000 * 60 * 60 * 24));
    }
    
    // Período de Prestação de Contas: Data fim do evento + 7 dias
    const prazoPCDate = dataFimDate ? new Date(dataFimDate.getTime() + 7 * 24 * 60 * 60 * 1000) : null;
    
    const formatDate = (date: Date | null) => {
      if (!date) return '--';
      return date.toLocaleDateString('pt-BR');
    };
    
    return {
      portariaDate,
      dataFimDate,
      diasAplicacao,
      prazoPCDate,
      periodoAplicacaoOk: portariaDate && dataFimDate ? (diasAplicacao >= 0 && diasAplicacao <= 90) : null,
      periodoAplicacaoLabel: portariaDate && dataFimDate 
        ? `${formatDate(portariaDate)} → ${formatDate(dataFimDate)} (${diasAplicacao} dias)`
        : 'Datas não disponíveis',
      prazoPCLabel: prazoPCDate 
        ? `até ${formatDate(prazoPCDate)}`
        : 'Data não disponível'
    };
  }, [processData.portariaData, processData.dataFim]);

  const {
    pc,
    isLoading,
    isSubmitted,
    isPendency,
    isApproved,
    isDone,
    isTCE,
    canReview,
    canBaixa,
    saldoRestante,
    fetchPC,
    approvePC,
    devolvPC
  } = usePrestacaoContas({ solicitacaoId });

  const {
    comprovantes,
    totalValor,
    totalGlosado,
    totalLiquido,
    totalValidados,
    pendentesValidacao,
    porElemento,
    alertasCriticos,
    alertasAltos,
    fetchComprovantes,
    validarComprovante,
    runSentinelaOCR
  } = useComprovantes({ prestacaoId: pc?.id || '' });

  // Load data
  useEffect(() => {
    fetchPC();
  }, [fetchPC]);

  useEffect(() => {
    if (pc?.id) {
      fetchComprovantes();
    }
  }, [pc?.id, fetchComprovantes]);

  // ==========================================================================
  // AUTO-FETCH ATESTO DO GESTOR (verifica documento no dossiê)
  // ==========================================================================
  useEffect(() => {
    const checkAtesto = async () => {
      if (!solicitacaoId) return;
      // Accept multiple tipo variations that could represent Atesto do Gestor
      const { data } = await supabase
        .from('documentos')
        .select('id')
        .eq('solicitacao_id', solicitacaoId)
        .in('tipo', ['CERTIDAO_ATESTO_PC', 'CERTIDAO_ATESTO', 'ATESTO', 'CERTIDAO'])
        .maybeSingle();
      setHasAtestoGestor(!!data);
    };
    checkAtesto();
  }, [solicitacaoId]);

  // ==========================================================================
  // AUTO-VALIDATION LOGIC (Art. 4° e Conformidade)
  // ==========================================================================
  const autoValidation = useMemo(() => {
    // 2. Prazo PC: PC submetida antes de dataFim + 7 dias
    const prazoPCOk = periodInfo.prazoPCDate && pc?.submitted_at 
      ? new Date(pc.submitted_at) <= periodInfo.prazoPCDate 
      : null;

    // 3. Elementos compatíveis: todos comprovantes têm elementos válidos
    const ELEMENTOS_PERMITIDOS = ['3.3.90.30', '3.3.90.33', '3.3.90.36', '3.3.90.39'];
    const elementosOk = comprovantes.length > 0 
      ? comprovantes.every(c => ELEMENTOS_PERMITIDOS.includes(c.elemento_despesa))
      : null;

    // 4. Valores conferem: soma dos comprovantes = valor gasto na PC
    const somaComprovantes = comprovantes.reduce((sum, c) => sum + (c.valor || 0), 0);
    const valoresOk = comprovantes.length > 0 
      ? Math.abs(somaComprovantes - totalValor) < 0.01
      : null;

    // 5. Docs PF: se há elemento 36, todos têm dados PF completos
    const compsPF = comprovantes.filter(c => c.elemento_despesa === '3.3.90.36');
    const docsPFOk = compsPF.length === 0 
      ? null  // N/A
      : compsPF.every(c => c.prestador_pf_dados?.cpf && c.prestador_pf_dados?.pis_nit);

    // 6. Cálculos INSS: verificar se inss_retido ≈ valor_bruto * 0.11
    const inssOk = compsPF.length === 0 
      ? null  // N/A
      : compsPF.every(c => {
          const expected = (c.prestador_pf_dados?.valor_bruto || 0) * 0.11;
          const actual = c.prestador_pf_dados?.inss_retido || 0;
          return Math.abs(expected - actual) < 1; // tolerância de R$1
        });

    // 7. GDR INSS: verificar URL se pc.gdr_inss_paga
    const gdrINSSOk = pc?.gdr_inss_paga 
      ? !!pc?.gdr_inss_arquivo_url 
      : null;  // N/A

    // 8. GDR Saldo: verificar URL se pc.gdr_saldo_paga
    const gdrSaldoOk = pc?.gdr_saldo_paga 
      ? !!pc?.gdr_saldo_arquivo_url 
      : null;  // N/A

    // 9. Atesto Gestor: estado já preenchido via useEffect
    const atestoOk = hasAtestoGestor;

    return { prazoPCOk, elementosOk, valoresOk, docsPFOk, inssOk, gdrINSSOk, gdrSaldoOk, atestoOk };
  }, [pc, comprovantes, periodInfo, hasAtestoGestor, totalValor]);

  // Contador inteligente do checklist (considera auto-validações)
  const checklistCount = useMemo(() => {
    const items = [
      { key: 'periodoDentroDoLimite', auto: periodInfo.periodoAplicacaoOk },
      { key: 'prazoPrestacaoContas', auto: autoValidation.prazoPCOk },
      { key: 'elementosCompativeis', auto: autoValidation.elementosOk },
      { key: 'valoresConferem', auto: autoValidation.valoresOk },
      { key: 'documentosPFCompletos', auto: autoValidation.docsPFOk },
      { key: 'calculosINSSCorretos', auto: autoValidation.inssOk },
      { key: 'gdrINSSAnexada', auto: autoValidation.gdrINSSOk },
      { key: 'gdrSaldoAnexada', auto: autoValidation.gdrSaldoOk },
      { key: 'atestoGestorPresente', auto: autoValidation.atestoOk }
    ];
    
    const completed = items.filter(item => 
      item.auto === true || checklist[item.key as keyof typeof checklist]
    ).length;
    
    const failed = items.filter(item => item.auto === false).length;
    
    return { completed, total: items.length, failed };
  }, [checklist, periodInfo, autoValidation]);

  const allChecklistComplete = checklistCount.completed === checklistCount.total && checklistCount.failed === 0;

  // ==========================================================================
  // FAILURE DETECTION - Identifica falhas e ações recomendadas
  // ==========================================================================
  const failureDetails = useMemo(() => {
    const failures: Array<{
      key: string;
      title: string;
      description: string;
      severity: 'critical' | 'high' | 'medium';
      actions: Array<{ label: string; type: 'devolver' | 'glosar' | 'tce' | 'manual' }>;
    }> = [];

    // 1. Período excedeu 90 dias
    if (periodInfo.diasAplicacao > 90) {
      failures.push({
        key: 'periodo_excedido',
        title: 'Período de Aplicação Excedido',
        description: `O período de aplicação é de ${periodInfo.diasAplicacao} dias, excedendo o limite de 90 dias estabelecido no Art. 4° da Portaria.`,
        severity: 'critical',
        actions: [
          { label: 'Devolver para Correção', type: 'devolver' },
          { label: 'Instaurar TCE', type: 'tce' }
        ]
      });
    }

    // 2. PC submetida fora do prazo
    if (autoValidation.prazoPCOk === false) {
      failures.push({
        key: 'prazo_pc_excedido',
        title: 'Prazo de Prestação de Contas Excedido',
        description: 'A PC foi submetida após o prazo de 7 dias do término do período de aplicação.',
        severity: 'high',
        actions: [
          { label: 'Devolver para Justificativa', type: 'devolver' },
          { label: 'Instaurar TCE', type: 'tce' }
        ]
      });
    }

    // 3. Elemento não autorizado
    if (autoValidation.elementosOk === false) {
      failures.push({
        key: 'elemento_nao_autorizado',
        title: 'Elemento de Despesa Não Autorizado',
        description: 'Foram encontrados comprovantes com elementos de despesa não autorizados (fora de 30/33/36/39).',
        severity: 'critical',
        actions: [
          { label: 'Glosar Valor', type: 'glosar' },
          { label: 'Devolver para Correção', type: 'devolver' }
        ]
      });
    }

    // 4. Valores divergentes
    if (autoValidation.valoresOk === false) {
      failures.push({
        key: 'valores_divergentes',
        title: 'Divergência nos Valores',
        description: 'A soma dos comprovantes não confere com o valor total gasto declarado na PC.',
        severity: 'high',
        actions: [
          { label: 'Devolver para Correção', type: 'devolver' },
          { label: 'Verificar Manualmente', type: 'manual' }
        ]
      });
    }

    // 5. Docs PF incompletos
    if (autoValidation.docsPFOk === false) {
      failures.push({
        key: 'docs_pf_incompletos',
        title: 'Documentação de Pessoa Física Incompleta',
        description: 'Faltam CPF ou PIS/NIT nos dados de prestadores de serviço pessoa física.',
        severity: 'high',
        actions: [
          { label: 'Devolver para Completar', type: 'devolver' }
        ]
      });
    }

    // 6. Cálculo INSS incorreto
    if (autoValidation.inssOk === false) {
      failures.push({
        key: 'inss_incorreto',
        title: 'Cálculo de INSS Incorreto',
        description: 'O valor de INSS retido não corresponde a 11% do valor bruto do serviço.',
        severity: 'medium',
        actions: [
          { label: 'Devolver para Correção', type: 'devolver' },
          { label: 'Verificar Manualmente', type: 'manual' }
        ]
      });
    }

    // 7. GDR INSS não anexada
    if (autoValidation.gdrINSSOk === false) {
      failures.push({
        key: 'gdr_inss_faltando',
        title: 'GDR de INSS Não Anexada',
        description: 'O pagamento de INSS foi declarado, mas a GDR não foi anexada ao dossiê.',
        severity: 'high',
        actions: [
          { label: 'Devolver para Anexar', type: 'devolver' }
        ]
      });
    }

    // 8. GDR Saldo não anexada
    if (autoValidation.gdrSaldoOk === false) {
      failures.push({
        key: 'gdr_saldo_faltando',
        title: 'GDR de Devolução Não Anexada',
        description: 'A devolução de saldo foi declarada, mas a GDR não foi anexada ao dossiê.',
        severity: 'high',
        actions: [
          { label: 'Devolver para Anexar', type: 'devolver' }
        ]
      });
    }

    // 9. Atesto não encontrado
    if (!autoValidation.atestoOk) {
      failures.push({
        key: 'atesto_faltando',
        title: 'Atesto do Gestor Não Encontrado',
        description: 'A Certidão de Atesto do Gestor não foi encontrada no dossiê digital.',
        severity: 'critical',
        actions: [
          { label: 'Aguardar Atesto do Gestor', type: 'manual' },
          { label: 'Devolver ao Gestor', type: 'devolver' }
        ]
      });
    }

    return failures;
  }, [periodInfo, autoValidation]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Handler para análise automática de comprovantes
  const handleAutoAnalyze = async () => {
    setIsAutoAnalyzing(true);
    try {
      for (const comp of comprovantes.filter(c => !c.sentinela_risk)) {
        await runSentinelaOCR(comp.id);
      }
      // Auto-validar comprovantes com risco baixo
      for (const comp of comprovantes.filter(c => c.sentinela_risk === 'LOW' && !c.validado)) {
        await validarComprovante(comp.id);
      }
      showToast({
        title: 'Análise concluída',
        message: `${comprovantes.length} comprovante(s) analisado(s) com IA`,
        type: 'success'
      });
    } catch (err) {
      console.error('Auto-analyze error:', err);
    } finally {
      setIsAutoAnalyzing(false);
      fetchComprovantes();
    }
  };

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleApprove = async () => {
    if (!allChecklistComplete) {
      showToast({
        title: 'Checklist incompleto',
        message: 'Complete todos os itens do checklist antes de aprovar.',
        type: 'error'
      });
      return;
    }

    if (pendentesValidacao > 0) {
      if (!confirm(`Ainda há ${pendentesValidacao} comprovante(s) não validado(s). Deseja aprovar mesmo assim?`)) {
        return;
      }
    }

    setIsProcessing(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // 1. Aprovar a PC
      const result = await approvePC();
      if (!result.success) throw new Error(result.error);

      // 2. Criar registro na tabela baixa_siafe
      await supabase.from('baixa_siafe').insert({
        solicitacao_id: solicitacaoId,
        prestacao_contas_id: pc?.id,
        nup: processData.nup,
        suprido_nome: processData.supridoNome,
        unidade: '', // TODO: get from process
        valor_aprovado: totalLiquido,
        status_pc: 'APROVADO',
        status_baixa: 'PENDENTE'
      });

      // 3. Inserir registros na gestao_inss (para cada comprovante 3.3.90.36)
      const comprovantesPF = comprovantes.filter(c => c.elemento_despesa === '3.3.90.36' && c.prestador_pf_dados);
      for (const comp of comprovantesPF) {
        const pf = comp.prestador_pf_dados!;
        await supabase.from('gestao_inss').insert({
          solicitacao_id: solicitacaoId,
          prestacao_contas_id: pc?.id,
          comprovante_id: comp.id,
          cpf: pf.cpf,
          nome: pf.nome,
          pis_nit: pf.pis_nit,
          valor_bruto: pf.valor_bruto,
          inss_retido_11: pf.inss_retido,
          inss_patronal_20: pf.valor_bruto * 0.20,
          nup: processData.nup,
          portaria_numero: '', // TODO: get from process
          comarca: '',
          atividade: pf.atividade,
          data_prestacao: pf.data_prestacao,
          status: 'PENDENTE_RECOLHIMENTO'
        });
      }

      // 4. Inserir registro na gestao_devolucoes (se houver saldo)
      const saldoDevolver = processData.valorConcedido - totalLiquido;
      if (saldoDevolver > 0 && pc?.gdr_saldo_paga) {
        await supabase.from('gestao_devolucoes').insert({
          solicitacao_id: solicitacaoId,
          prestacao_contas_id: pc?.id,
          suprido_nome: processData.supridoNome,
          numero_gdr: pc.gdr_saldo_numero,
          elemento_origem: 'SALDO_NAO_UTILIZADO',
          valor_concedido: processData.valorConcedido,
          valor_gasto: totalLiquido,
          valor_devolucao: saldoDevolver,
          status_gdr: 'PENDENTE'
        });
      }

      showToast({
        title: 'PC Aprovada!',
        message: 'Registros criados em Baixa SIAFE, Gestão INSS e Devoluções.',
        type: 'success'
      });

      onBaixaSiafe();
    } catch (err: any) {
      console.error('Error approving PC:', err);
      showToast({
        title: 'Erro ao aprovar',
        message: err.message || 'Tente novamente',
        type: 'error'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDevolver = async () => {
    if (!motivoDevoluacao.trim()) {
      alert('Informe o motivo da devolução');
      return;
    }

    const result = await devolvPC(motivoDevoluacao);
    if (result.success) {
      setShowDevoluacaoForm(false);
      setMotivoDevoluacao('');
      onDevolver();
    } else {
      alert(result.error || 'Erro ao devolver');
    }
  };

  const handleValidarTodos = async () => {
    for (const comp of comprovantes.filter(c => !c.validado)) {
      await validarComprovante(comp.id);
    }
  };

  const handleRunSentinelaTodos = async () => {
    for (const comp of comprovantes.filter(c => !c.sentinela_risk)) {
      await runSentinelaOCR(comp.id);
    }
  };

  // ==========================================================================
  // ADMIN OVERRIDE APPROVAL (Força aprovação com justificativa para auditoria)
  // ==========================================================================
  const handleAdminOverrideApproval = async () => {
    if (!adminOverrideReason.trim() || adminOverrideReason.length < 20) {
      showToast({
        title: 'Justificativa Obrigatória',
        message: 'A justificativa deve ter pelo menos 20 caracteres.',
        type: 'error'
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Get current user for audit
      const { data: { user } } = await supabase.auth.getUser();

      // 1. Force approve the PC status directly (bypass validation)
      const { error: pcError } = await supabase
        .from('prestacao_contas')
        .update({ status: 'APROVADA', reviewed_at: new Date().toISOString(), reviewed_by: user?.id })
        .eq('solicitacao_id', solicitacaoId);
      if (pcError) throw pcError;

      // 2. Update solicitacao workflow - Use 'Aprovado com Ressalvas' for SiafeManager compatibility
      await supabase
        .from('solicitacoes')
        .update({ 
          status_workflow: 'PC_APPROVED', 
          status: 'Aprovado com Ressalvas',  // This is AccountStatus.APPROVED_CAVEATS for Baixa SIAFE
          updated_at: new Date().toISOString() 
        })
        .eq('id', solicitacaoId);

      // 2. Log the override in historico_tramitacao for audit
      await supabase.from('historico_tramitacao').insert({
        solicitacao_id: solicitacaoId,
        origem: 'SOSFU',
        destino: 'SOSFU',
        status_anterior: 'PC_REVIEW_SOSFU',
        status_novo: 'PC_APPROVED_OVERRIDE',
        observacao: `[ADMIN OVERRIDE] Aprovação forçada por ${user?.email}. Justificativa: ${adminOverrideReason}. Problemas ignorados: ${failureDetails.map(f => f.title).join(', ')}`
      });

      showToast({
        title: 'PC Aprovada (Override)',
        message: 'Aprovação registrada com justificativa no histórico.',
        type: 'success'
      });

      setShowAdminOverride(false);
      setAdminOverrideReason('');
      onBaixaSiafe();
    } catch (err: any) {
      console.error('Admin Override error:', err);
      showToast({
        title: 'Erro no Override',
        message: err.message || 'Tente novamente',
        type: 'error'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // ==========================================================================
  // STATUS BADGE
  // ==========================================================================

  const getStatusBadge = () => {
    if (isDone) return { label: 'Concluído', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 };
    if (isApproved) return { label: 'Aprovada', color: 'bg-blue-100 text-blue-700', icon: ShieldCheck };
    if (isPendency) return { label: 'Pendência', color: 'bg-amber-100 text-amber-700', icon: AlertTriangle };
    if (isSubmitted) return { label: 'Submetida', color: 'bg-purple-100 text-purple-700', icon: Send };
    if (isTCE) return { label: 'TCE', color: 'bg-red-100 text-red-700', icon: AlertCircle };
    return { label: 'Rascunho', color: 'bg-slate-100 text-slate-600', icon: FileText };
  };

  const statusBadge = getStatusBadge();

  // ==========================================================================
  // RENDER
  // ==========================================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw size={32} className="text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!pc) {
    return (
      <div className="text-center py-20 text-slate-400">
        <FileText size={48} className="mx-auto mb-4 opacity-50" />
        <p className="font-bold">Prestação de Contas não encontrada</p>
        <p className="text-sm mt-1">O Suprido ainda não iniciou a PC</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com Status */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
            <FileText size={28} className="text-slate-600" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800">Análise de Prestação de Contas</h3>
            <p className="text-sm text-slate-500">NUP: {processData.nup}</p>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${statusBadge.color}`}>
          <statusBadge.icon size={18} />
          {statusBadge.label}
        </div>
      </div>

      {/* Alertas Críticos */}
      {(alertasCriticos > 0 || alertasAltos > 0) && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
            <AlertTriangle size={24} className="text-red-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-red-800">
              {alertasCriticos} alerta(s) crítico(s) | {alertasAltos} alerta(s) alto(s)
            </p>
            <p className="text-xs text-red-600">Revise os comprovantes marcados pelo Sentinela</p>
          </div>
          <button
            onClick={handleRunSentinelaTodos}
            className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors"
          >
            Reprocessar OCR
          </button>
        </div>
      )}

      {/* Resumo Financeiro */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-50 rounded-2xl p-4">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-1">Valor Concedido</p>
          <p className="text-xl font-black text-slate-800">{formatCurrency(processData.valorConcedido)}</p>
        </div>
        <div className="bg-blue-50 rounded-2xl p-4">
          <p className="text-[10px] text-blue-400 font-black uppercase tracking-wider mb-1">Total Gasto</p>
          <p className="text-xl font-black text-blue-700">{formatCurrency(totalValor)}</p>
        </div>
        <div className="bg-amber-50 rounded-2xl p-4">
          <p className="text-[10px] text-amber-400 font-black uppercase tracking-wider mb-1">Glosas</p>
          <p className="text-xl font-black text-amber-700">{formatCurrency(totalGlosado)}</p>
        </div>
        <div className={`rounded-2xl p-4 ${saldoRestante >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
          <p className={`text-[10px] font-black uppercase tracking-wider mb-1 ${saldoRestante >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            Saldo a Devolver
          </p>
          <p className={`text-xl font-black ${saldoRestante >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
            {formatCurrency(Math.max(0, processData.valorConcedido - totalLiquido))}
          </p>
        </div>
      </div>

      {/* Banner de Falhas - Exibe quando há problemas na PC */}
      {failureDetails.length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 bg-red-100 border-b border-red-200 flex items-center gap-3">
            <AlertCircle size={20} className="text-red-600" />
            <h4 className="text-sm font-black text-red-800">
              {failureDetails.length} Problema{failureDetails.length > 1 ? 's' : ''} Encontrado{failureDetails.length > 1 ? 's' : ''}
            </h4>
            <span className="ml-auto text-xs text-red-600 font-bold">
              Ação necessária antes de aprovar
            </span>
            {/* Admin Override Button */}
            <button
              onClick={() => setShowAdminOverride(true)}
              className="ml-2 px-3 py-1.5 bg-slate-800 text-white text-[10px] font-black uppercase tracking-wider rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-1.5"
              title="Aprovar mesmo com problemas (requer justificativa)"
            >
              <ShieldAlert size={12} />
              Override Admin
            </button>
          </div>
          <div className="divide-y divide-red-100">
            {failureDetails.map(failure => (
              <div key={failure.key} className="px-4 py-4">
                <div className="flex items-start gap-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    failure.severity === 'critical' ? 'bg-red-200 text-red-700' :
                    failure.severity === 'high' ? 'bg-orange-200 text-orange-700' :
                    'bg-amber-200 text-amber-700'
                  }`}>
                    <XCircle size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="text-sm font-bold text-slate-800">{failure.title}</h5>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                        failure.severity === 'critical' ? 'bg-red-200 text-red-700' :
                        failure.severity === 'high' ? 'bg-orange-200 text-orange-700' :
                        'bg-amber-200 text-amber-700'
                      }`}>
                        {failure.severity === 'critical' ? 'Crítico' : failure.severity === 'high' ? 'Alto' : 'Médio'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mb-3">{failure.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {failure.actions.map((action, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            if (action.type === 'devolver') {
                              setShowDevoluacaoForm(true);
                              setMotivoDevoluacao(failure.description);
                            } else if (action.type === 'tce') {
                              showToast({
                                title: 'Instauração de TCE',
                                message: 'Funcionalidade de TCE será disponibilizada em breve.',
                                type: 'info'
                              });
                            } else if (action.type === 'glosar') {
                              showToast({
                                title: 'Glosa de Valores',
                                message: 'Utilize a seção de comprovantes para aplicar glosas.',
                                type: 'info'
                              });
                            }
                          }}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                            action.type === 'devolver' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-200' :
                            action.type === 'tce' ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200' :
                            action.type === 'glosar' ? 'bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-200' :
                            'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                          }`}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Checklist de Conferência */}
      {canReview && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-4 py-3 bg-purple-50 border-b border-purple-100 flex items-center gap-3">
            <ClipboardCheck size={20} className="text-purple-600" />
            <h4 className="text-sm font-black text-purple-800">Checklist de Conferência Técnica</h4>
            <span className={`ml-2 text-xs font-bold px-2 py-1 rounded-full ${
              checklistCount.failed > 0 
                ? 'bg-red-100 text-red-700' 
                : checklistCount.completed === checklistCount.total 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : 'bg-purple-100 text-purple-600'
            }`}>
              {checklistCount.completed}/{checklistCount.total} {checklistCount.failed > 0 ? `(${checklistCount.failed} falha${checklistCount.failed > 1 ? 's' : ''})` : ''}
            </span>
            <button
              onClick={handleAutoAnalyze}
              disabled={isAutoAnalyzing || comprovantes.every(c => c.sentinela_risk)}
              className="ml-auto px-3 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAutoAnalyzing ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  Analisar com IA
                </>
              )}
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {[
              { 
                key: 'periodoDentroDoLimite', 
                label: `Período de Aplicação: ${periodInfo.periodoAplicacaoLabel}`, 
                sublabel: periodInfo.diasAplicacao > 90 ? '⚠️ Excede limite de 90 dias (Art. 4°)' : 'Dentro do limite de 90 dias (Art. 4°)',
                required: true,
                autoStatus: periodInfo.diasAplicacao > 0 ? periodInfo.periodoAplicacaoOk : null
              },
              { 
                key: 'prazoPrestacaoContas', 
                label: `Prazo de Prestação de Contas: ${periodInfo.prazoPCLabel}`, 
                sublabel: autoValidation.prazoPCOk === false 
                  ? '⚠️ PC submetida após o prazo!' 
                  : 'Período de aplicação + 7 dias (Art. 4°)',
                required: true,
                autoStatus: autoValidation.prazoPCOk
              },
              { 
                key: 'elementosCompativeis', 
                label: 'Elementos de despesa compatíveis com autorização', 
                sublabel: autoValidation.elementosOk === true 
                  ? '✓ Todos elementos são 30/33/36/39' 
                  : autoValidation.elementosOk === false 
                    ? '⚠️ Elemento não autorizado encontrado' 
                    : 'Verificação automática',
                required: true,
                autoStatus: autoValidation.elementosOk
              },
              { 
                key: 'valoresConferem', 
                label: 'Valores dos comprovantes conferem com totais', 
                sublabel: autoValidation.valoresOk === true 
                  ? `✓ Soma: ${formatCurrency(totalValor)}` 
                  : autoValidation.valoresOk === false 
                    ? '⚠️ Divergência nos valores' 
                    : 'Verificação automática',
                required: true,
                autoStatus: autoValidation.valoresOk
              },
              { 
                key: 'documentosPFCompletos', 
                label: 'Documentos de prestadores PF completos (se aplicável)', 
                sublabel: autoValidation.docsPFOk === true 
                  ? '✓ CPF e PIS/NIT preenchidos' 
                  : autoValidation.docsPFOk === false 
                    ? '⚠️ Dados PF incompletos' 
                    : 'N/A - Sem serviços PF',
                required: comprovantes.some(c => c.elemento_despesa === '3.3.90.36'),
                autoStatus: autoValidation.docsPFOk
              },
              { 
                key: 'calculosINSSCorretos', 
                label: 'Cálculos de INSS/ISS corretos (se aplicável)', 
                sublabel: autoValidation.inssOk === true 
                  ? '✓ INSS 11% validado' 
                  : autoValidation.inssOk === false 
                    ? '⚠️ Cálculo INSS divergente' 
                    : 'N/A - Sem serviços PF',
                required: comprovantes.some(c => c.elemento_despesa === '3.3.90.36'),
                autoStatus: autoValidation.inssOk
              },
              { 
                key: 'gdrINSSAnexada', 
                label: 'GDR de INSS anexada e correta', 
                sublabel: autoValidation.gdrINSSOk === true 
                  ? '✓ Arquivo anexado' 
                  : autoValidation.gdrINSSOk === false 
                    ? '⚠️ GDR INSS não encontrada' 
                    : 'N/A - Sem retenção INSS',
                required: pc?.gdr_inss_paga || false,
                autoStatus: autoValidation.gdrINSSOk
              },
              { 
                key: 'gdrSaldoAnexada', 
                label: 'GDR de devolução anexada e correta', 
                sublabel: autoValidation.gdrSaldoOk === true 
                  ? '✓ Arquivo anexado' 
                  : autoValidation.gdrSaldoOk === false 
                    ? '⚠️ GDR Saldo não encontrada' 
                    : 'N/A - Sem saldo a devolver',
                required: pc?.gdr_saldo_paga || false,
                autoStatus: autoValidation.gdrSaldoOk
              },
              { 
                key: 'atestoGestorPresente', 
                label: 'Atesto do Gestor presente no dossiê', 
                sublabel: autoValidation.atestoOk 
                  ? '✓ Certidão de Atesto encontrada' 
                  : '⚠️ Certidão de Atesto não encontrada',
                required: true,
                autoStatus: autoValidation.atestoOk
              }
            ].map(item => {
              // Auto-status for period validation
              const isAutoValidated = (item as any).autoStatus !== undefined;
              const autoOk = (item as any).autoStatus === true;
              const autoFail = (item as any).autoStatus === false;
              const isChecked = checklist[item.key as keyof typeof checklist] || autoOk;
              
              return (
                <div 
                  key={item.key}
                  className={`px-4 py-3 flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-all ${!item.required ? 'opacity-50' : ''} ${autoFail ? 'bg-red-50' : ''}`}
                  onClick={() => item.required && !isAutoValidated && toggleChecklistItem(item.key as keyof typeof checklist)}
                >
                  <button 
                    disabled={!item.required || isAutoValidated}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                      autoFail ? 'bg-red-500 text-white' :
                      isChecked 
                        ? 'bg-emerald-500 text-white' 
                        : 'border-2 border-slate-300 text-slate-300'
                    }`}
                  >
                    {autoFail ? (
                      <XCircle size={16} />
                    ) : isChecked ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      <Square size={14} />
                    )}
                  </button>
                  <div className="flex-1">
                    <span className={`text-sm ${autoFail ? 'text-red-700 font-bold' : isChecked ? 'text-emerald-700 font-medium' : 'text-slate-600'}`}>
                      {item.label}
                    </span>
                    {(item as any).sublabel && (
                      <p className={`text-xs mt-0.5 ${autoFail ? 'text-red-500' : 'text-slate-400'}`}>
                        {(item as any).sublabel}
                      </p>
                    )}
                  </div>
                  {!item.required && (
                    <span className="ml-auto text-xs text-slate-400">N/A</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
          <h4 className="text-sm font-black text-slate-700">Distribuição por Elemento de Despesa</h4>
        </div>
        <div className="divide-y divide-slate-100">
          {ELEMENTOS_DESPESA.map(el => {
            const data = porElemento[el.code] || { total: 0, count: 0 };
            const percent = totalValor > 0 ? (data.total / totalValor) * 100 : 0;
            return (
              <div key={el.code} className="px-4 py-3 flex items-center gap-4">
                <div className="w-24">
                  <span className="text-xs font-bold text-slate-500">{el.code}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-slate-600">{el.label}</span>
                    <span className="font-bold text-slate-800">{formatCurrency(data.total)} ({data.count})</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lista de Comprovantes */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <h4 className="text-sm font-black text-slate-700">
            Comprovantes ({comprovantes.length})
          </h4>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">
              {totalValidados} validado(s) | {pendentesValidacao} pendente(s)
            </span>
            {pendentesValidacao > 0 && (
              <button
                onClick={handleValidarTodos}
                className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg hover:bg-emerald-200 transition-colors"
              >
                Validar Todos
              </button>
            )}
          </div>
        </div>
        <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
          {comprovantes.map(comp => (
            <div key={comp.id} className="px-4 py-3 flex items-center gap-4 hover:bg-slate-50 transition-colors">
              {/* Risk Badge */}
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold ${
                comp.sentinela_risk === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                comp.sentinela_risk === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                comp.sentinela_risk === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                comp.sentinela_risk === 'LOW' ? 'bg-emerald-100 text-emerald-700' :
                'bg-slate-100 text-slate-500'
              }`}>
                {comp.sentinela_risk ? comp.sentinela_risk.charAt(0) : '?'}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">{comp.tipo.replace('_', ' ')}</span>
                  {comp.numero && <span className="text-xs text-slate-500">#{comp.numero}</span>}
                  {comp.validado && <CheckCircle2 size={14} className="text-emerald-500" />}
                </div>
                <p className="text-sm font-bold text-slate-800 truncate">{comp.emitente}</p>
              </div>

              {/* Value */}
              <div className="text-right">
                <p className="text-sm font-black text-slate-900">{formatCurrency(comp.valor)}</p>
                {comp.glosa_valor ? (
                  <p className="text-xs text-amber-600">-{formatCurrency(comp.glosa_valor)}</p>
                ) : null}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                {comp.storage_url && (
                  <a
                    href={comp.storage_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Eye size={16} />
                  </a>
                )}
                {!comp.validado && (
                  <button
                    onClick={() => validarComprovante(comp.id)}
                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    title="Validar"
                  >
                    <CheckCircle2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Devolução Form */}
      {showDevoluacaoForm && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-amber-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-800">Devolver para Correção</p>
              <p className="text-xs text-amber-700">Informe o motivo da devolução ao Suprido</p>
            </div>
            <button
              onClick={() => setShowDevoluacaoForm(false)}
              className="p-1 hover:bg-amber-100 rounded-lg"
            >
              <XCircle size={18} className="text-amber-600" />
            </button>
          </div>
          <textarea
            value={motivoDevoluacao}
            onChange={e => setMotivoDevoluacao(e.target.value)}
            placeholder="Descreva os problemas encontrados e o que deve ser corrigido..."
            rows={3}
            className="w-full px-4 py-3 border border-amber-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowDevoluacaoForm(false)}
              className="px-4 py-2 text-slate-600 font-bold text-sm hover:bg-slate-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              onClick={handleDevolver}
              className="px-4 py-2 bg-amber-600 text-white font-bold text-sm rounded-lg hover:bg-amber-700"
            >
              Devolver PC
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {canReview && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            onClick={() => setShowDevoluacaoForm(true)}
            className="px-6 py-3 border-2 border-amber-300 text-amber-700 font-bold rounded-xl hover:bg-amber-50 transition-colors flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            Devolver para Correção
          </button>
          <button
            onClick={handleApprove}
            className="px-8 py-3 bg-emerald-600 text-white font-black rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all flex items-center gap-2"
          >
            <ShieldCheck size={18} />
            Aprovar PC
          </button>
        </div>
      )}

      {/* Baixa SIAFE Button */}
      {canBaixa && (
        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            onClick={onBaixaSiafe}
            className="px-8 py-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center gap-2"
          >
            <Database size={18} />
            Registrar Baixa SIAFE
          </button>
        </div>
      )}

      {/* === ADMIN OVERRIDE MODAL === */}
      {showAdminOverride && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full animate-in zoom-in-95 duration-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-5 text-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                  <ShieldAlert size={24} className="text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black">Override Administrativo</h3>
                  <p className="text-sm text-slate-300">Aprovar PC mesmo com problemas identificados</p>
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="px-6 py-4 bg-amber-50 border-b border-amber-200">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-800">Atenção: Esta ação será registrada para auditoria</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Seu email, data/hora e justificativa serão gravados no histórico do processo.
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Problemas a serem ignorados:
                </label>
                <div className="flex flex-wrap gap-2">
                  {failureDetails.map(f => (
                    <span key={f.key} className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-lg">
                      {f.title}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Justificativa do Override <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={adminOverrideReason}
                  onChange={(e) => setAdminOverrideReason(e.target.value)}
                  placeholder="Explique o motivo pelo qual está aprovando esta PC mesmo com problemas identificados. Mínimo 20 caracteres."
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm focus:border-slate-400 focus:ring-0 transition-colors resize-none"
                />
                <p className="text-xs text-slate-500 mt-1 text-right">
                  {adminOverrideReason.length}/20 caracteres mínimos
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAdminOverride(false);
                  setAdminOverrideReason('');
                }}
                className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAdminOverrideApproval}
                disabled={isProcessing || adminOverrideReason.length < 20}
                className="px-6 py-2.5 text-sm font-black text-white bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    Confirmar Override
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrestacaoContasTab;
