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
  Loader2
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
    dataFim?: string;
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
  
  // Checklist state
  const [checklist, setChecklist] = useState({
    periodoDentroDoLimite: false,
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
  
  const allChecklistComplete = Object.values(checklist).every(v => v);

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
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

      {/* Checklist de Conferência */}
      {canReview && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-4 py-3 bg-purple-50 border-b border-purple-100 flex items-center gap-3">
            <ClipboardCheck size={20} className="text-purple-600" />
            <h4 className="text-sm font-black text-purple-800">Checklist de Conferência Técnica</h4>
            <span className="ml-auto text-xs text-purple-600 font-bold">
              {Object.values(checklist).filter(v => v).length}/{Object.keys(checklist).length} itens
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {[
              { key: 'periodoDentroDoLimite', label: 'Período de aplicação dentro do limite (90 dias)', required: true },
              { key: 'elementosCompativeis', label: 'Elementos de despesa compatíveis com autorização', required: true },
              { key: 'valoresConferem', label: 'Valores dos comprovantes conferem com totais', required: true },
              { key: 'documentosPFCompletos', label: 'Documentos de prestadores PF completos (se aplicável)', required: comprovantes.some(c => c.elemento_despesa === '3.3.90.36') },
              { key: 'calculosINSSCorretos', label: 'Cálculos de INSS/ISS corretos (se aplicável)', required: comprovantes.some(c => c.elemento_despesa === '3.3.90.36') },
              { key: 'gdrINSSAnexada', label: 'GDR de INSS anexada e correta', required: pc?.gdr_inss_paga || false },
              { key: 'gdrSaldoAnexada', label: 'GDR de devolução anexada e correta', required: pc?.gdr_saldo_paga || false },
              { key: 'atestoGestorPresente', label: 'Atesto do Gestor presente no dossiê', required: true }
            ].map(item => (
              <div 
                key={item.key}
                className={`px-4 py-3 flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-all ${!item.required ? 'opacity-50' : ''}`}
                onClick={() => item.required && toggleChecklistItem(item.key as keyof typeof checklist)}
              >
                <button 
                  disabled={!item.required}
                  className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                    checklist[item.key as keyof typeof checklist] 
                      ? 'bg-emerald-500 text-white' 
                      : 'border-2 border-slate-300 text-slate-300'
                  }`}
                >
                  {checklist[item.key as keyof typeof checklist] ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <Square size={14} />
                  )}
                </button>
                <span className={`text-sm ${checklist[item.key as keyof typeof checklist] ? 'text-emerald-700 font-medium' : 'text-slate-600'}`}>
                  {item.label}
                </span>
                {!item.required && (
                  <span className="ml-auto text-xs text-slate-400">N/A</span>
                )}
              </div>
            ))}
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
    </div>
  );
};

export default PrestacaoContasTab;
