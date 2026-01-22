import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  FileText,
  User,
  DollarSign,
  Calendar,
  Eye,
  Receipt,
  Calculator,
  Send,
  ArrowLeft,
  RotateCcw,
  Loader2,
  ExternalLink,
  Info,
  ClipboardCheck
} from 'lucide-react';
import { usePrestacaoContas, ComprovantePC } from '../../hooks/usePrestacaoContas';
import { useToast } from '../ui/ToastProvider';
import { supabase } from '../../lib/supabaseClient';

// =============================================================================
// TYPES
// =============================================================================

interface PrestacaoAtestoTabProps {
  solicitacaoId: string;
  processData: {
    nup: string;
    valorConcedido: number;
    supridoNome: string;
    portariaNumero?: string;
  };
  onSuccess?: () => void;
  onClose?: () => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export const PrestacaoAtestoTab: React.FC<PrestacaoAtestoTabProps> = ({
  solicitacaoId,
  processData,
  onSuccess,
  onClose
}) => {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDevolverModal, setShowDevolverModal] = useState(false);
  const [motivoDevolucao, setMotivoDevolucao] = useState('');
  const [expandedComprovante, setExpandedComprovante] = useState<string | null>(null);

  const {
    pc,
    comprovantes,
    isLoading,
    error,
    fetchPC,
    refresh
  } = usePrestacaoContas({ solicitacaoId });

  React.useEffect(() => {
    fetchPC();
  }, [fetchPC]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Calculate totals
  const totais = useMemo(() => {
    const totalGasto = comprovantes.reduce((sum, c) => sum + c.valor, 0);
    const totalINSS = comprovantes
      .filter(c => c.elemento_despesa === '3.3.90.36')
      .reduce((sum, c) => sum + (c.inss_retido || c.prestador_pf_dados?.inss_retido || 0), 0);
    const totalISS = comprovantes
      .filter(c => c.elemento_despesa === '3.3.90.36')
      .reduce((sum, c) => sum + (c.iss_retido || c.prestador_pf_dados?.iss_retido || 0), 0);
    const saldo = processData.valorConcedido - totalGasto;
    
    return { totalGasto, totalINSS, totalISS, saldo };
  }, [comprovantes, processData.valorConcedido]);

  // Group comprovantes by element
  const comprovantesPorElemento = useMemo(() => {
    const groups: Record<string, ComprovantePC[]> = {};
    comprovantes.forEach(c => {
      if (!groups[c.elemento_despesa]) {
        groups[c.elemento_despesa] = [];
      }
      groups[c.elemento_despesa].push(c);
    });
    return groups;
  }, [comprovantes]);

  const elementoLabels: Record<string, string> = {
    '3.3.90.30': 'Material de Consumo',
    '3.3.90.33': 'Passagens e Locomoção',
    '3.3.90.36': 'Serviços de Terceiros PF',
    '3.3.90.39': 'Serviços de Terceiros PJ'
  };

  // ==========================================================================
  // ACTIONS
  // ==========================================================================

  const handleEmitirAtesto = async () => {
    if (!pc) return;

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Update PC status
      const { error: updateError } = await supabase
        .from('prestacao_contas')
        .update({
          status: 'GESTOR_ATESTO',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id
        })
        .eq('id', pc.id);

      if (updateError) throw updateError;

      // Update solicitacao workflow
      await supabase
        .from('solicitacoes')
        .update({
          status_workflow: 'PC_GESTOR_ATESTO',
          updated_at: new Date().toISOString()
        })
        .eq('id', solicitacaoId);

      // Create tramitation history
      await supabase
        .from('historico_tramitacao')
        .insert({
          solicitacao_id: solicitacaoId,
          origem: 'GESTOR',
          destino: 'SOSFU',
          status_anterior: 'PC_SUBMITTED',
          status_novo: 'PC_GESTOR_ATESTO',
          observacao: `Gestor emitiu atesto da prestação de contas. Valor: ${formatCurrency(totais.totalGasto)}`
        });

      // Generate attestation document (could be a PDF in a real scenario)
      await supabase
        .from('documentos')
        .insert({
          solicitacao_id: solicitacaoId,
          tipo: 'ATESTO_PC',
          nome: `Atesto de Prestação de Contas - ${processData.nup}`,
          status: 'ASSINADO',
          assinado_por: user?.id,
          assinado_em: new Date().toISOString()
        });

      showToast({
        title: 'Atesto Emitido!',
        message: 'A PC foi atestada e encaminhada para análise da SOSFU.',
        type: 'success'
      });

      onSuccess?.();
    } catch (err: any) {
      console.error('Error emitting atesto:', err);
      showToast({
        title: 'Erro ao emitir atesto',
        message: err.message || 'Tente novamente',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDevolver = async () => {
    if (!pc || !motivoDevolucao.trim()) {
      showToast({
        title: 'Motivo obrigatório',
        message: 'Informe o motivo da devolução',
        type: 'error'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Update PC status
      const { error: updateError } = await supabase
        .from('prestacao_contas')
        .update({
          status: 'PENDENCIA',
          motivo_pendencia: motivoDevolucao,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id
        })
        .eq('id', pc.id);

      if (updateError) throw updateError;

      // Update solicitacao workflow
      await supabase
        .from('solicitacoes')
        .update({
          status_workflow: 'PC_PENDENCY',
          updated_at: new Date().toISOString()
        })
        .eq('id', solicitacaoId);

      // Create tramitation history
      await supabase
        .from('historico_tramitacao')
        .insert({
          solicitacao_id: solicitacaoId,
          origem: 'GESTOR',
          destino: 'SUPRIDO',
          status_anterior: 'PC_SUBMITTED',
          status_novo: 'PC_PENDENCY',
          observacao: `Gestor devolveu PC para correção. Motivo: ${motivoDevolucao}`
        });

      showToast({
        title: 'PC Devolvida',
        message: 'A PC foi devolvida ao Suprido para correção.',
        type: 'success'
      });

      setShowDevolverModal(false);
      onSuccess?.();
    } catch (err: any) {
      console.error('Error returning PC:', err);
      showToast({
        title: 'Erro ao devolver',
        message: err.message || 'Tente novamente',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-purple-600" />
      </div>
    );
  }

  if (!pc) {
    return (
      <div className="text-center py-20">
        <AlertTriangle size={48} className="mx-auto text-amber-500 mb-4" />
        <h3 className="text-lg font-bold text-slate-700">Prestação de Contas não encontrada</h3>
        <p className="text-sm text-slate-500">O Suprido ainda não iniciou a PC.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-3xl p-6 text-white">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
            <ClipboardCheck size={28} />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight">Atesto de Prestação de Contas</h2>
            <p className="text-white/80 text-sm">Processo: {processData.nup}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-[10px] text-white/60 uppercase tracking-wider">Suprido</p>
            <p className="font-bold truncate">{processData.supridoNome}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-[10px] text-white/60 uppercase tracking-wider">Portaria</p>
            <p className="font-bold">{processData.portariaNumero || '-'}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-[10px] text-white/60 uppercase tracking-wider">Valor Concedido</p>
            <p className="font-bold">{formatCurrency(processData.valorConcedido)}</p>
          </div>
        </div>
      </div>

      {/* Resumo Financeiro */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
          <Calculator size={20} className="text-purple-600" />
          Resumo Financeiro
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 rounded-xl p-4 text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Concedido</p>
            <p className="text-lg font-black text-slate-800">{formatCurrency(processData.valorConcedido)}</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <p className="text-[10px] text-blue-400 font-bold uppercase mb-1">Gasto</p>
            <p className="text-lg font-black text-blue-700">{formatCurrency(totais.totalGasto)}</p>
          </div>
          <div className={`rounded-xl p-4 text-center ${totais.saldo >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
            <p className={`text-[10px] font-bold uppercase mb-1 ${totais.saldo >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>Saldo</p>
            <p className={`text-lg font-black ${totais.saldo >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{formatCurrency(totais.saldo)}</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 text-center">
            <p className="text-[10px] text-purple-400 font-bold uppercase mb-1">INSS Retido</p>
            <p className="text-lg font-black text-purple-700">{formatCurrency(totais.totalINSS)}</p>
          </div>
        </div>
      </div>

      {/* GDRs Anexadas */}
      {(pc.gdr_inss_paga || pc.gdr_saldo_paga) && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
            <Receipt size={20} className="text-emerald-600" />
            GDRs Anexadas
          </h3>

          <div className="space-y-3">
            {pc.gdr_inss_paga && (
              <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={20} className="text-emerald-600" />
                  <div>
                    <p className="font-bold text-emerald-800">GDR INSS</p>
                    <p className="text-sm text-emerald-600">Nº {pc.gdr_inss_numero}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-emerald-700">{formatCurrency(pc.gdr_inss_valor || 0)}</span>
                  {pc.gdr_inss_arquivo_url && (
                    <a href={pc.gdr_inss_arquivo_url} target="_blank" rel="noopener noreferrer"
                      className="p-2 bg-emerald-100 rounded-lg text-emerald-700 hover:bg-emerald-200">
                      <Eye size={16} />
                    </a>
                  )}
                </div>
              </div>
            )}
            {pc.gdr_saldo_paga && (
              <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={20} className="text-emerald-600" />
                  <div>
                    <p className="font-bold text-emerald-800">GDR Devolução</p>
                    <p className="text-sm text-emerald-600">Nº {pc.gdr_saldo_numero}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-emerald-700">{formatCurrency(pc.gdr_saldo_valor || 0)}</span>
                  {pc.gdr_saldo_arquivo_url && (
                    <a href={pc.gdr_saldo_arquivo_url} target="_blank" rel="noopener noreferrer"
                      className="p-2 bg-emerald-100 rounded-lg text-emerald-700 hover:bg-emerald-200">
                      <Eye size={16} />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Comprovantes */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
          <FileText size={20} className="text-blue-600" />
          Comprovantes Anexados ({comprovantes.length})
        </h3>

        {Object.entries(comprovantesPorElemento).map(([elemento, docs]) => (
          <div key={elemento} className="mb-4 last:mb-0">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl mb-2">
              <span className="font-bold text-slate-700">{elemento} - {elementoLabels[elemento]}</span>
              <span className="text-sm text-slate-500">{docs.length} documento(s)</span>
            </div>

            <div className="space-y-2 pl-4">
              {docs.map(doc => (
                <div key={doc.id} className="border border-slate-100 rounded-xl overflow-hidden">
                  <div 
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50"
                    onClick={() => setExpandedComprovante(expandedComprovante === doc.id ? null : doc.id)}
                  >
                    <div className="flex items-center gap-3">
                      <FileText size={18} className="text-slate-400" />
                      <div>
                        <p className="font-medium text-slate-700">{doc.emitente}</p>
                        <p className="text-xs text-slate-400">
                          {doc.tipo} • {doc.numero ? `Nº ${doc.numero}` : 'Sem número'} • {new Date(doc.data_emissao).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-700">{formatCurrency(doc.valor)}</span>
                      {doc.storage_url && (
                        <a href={doc.storage_url} target="_blank" rel="noopener noreferrer"
                          className="p-2 bg-slate-100 rounded-lg text-slate-600 hover:bg-slate-200"
                          onClick={e => e.stopPropagation()}>
                          <Eye size={14} />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Dados PF Expandidos */}
                  {expandedComprovante === doc.id && doc.prestador_pf_dados && (
                    <div className="p-4 bg-purple-50 border-t border-purple-100">
                      <h4 className="text-sm font-bold text-purple-800 mb-3">Dados do Prestador PF</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-purple-500">Nome:</span>
                          <span className="ml-2 font-medium text-purple-900">{doc.prestador_pf_dados.nome}</span>
                        </div>
                        <div>
                          <span className="text-purple-500">CPF:</span>
                          <span className="ml-2 font-medium text-purple-900">{doc.prestador_pf_dados.cpf}</span>
                        </div>
                        <div>
                          <span className="text-purple-500">PIS/NIT:</span>
                          <span className="ml-2 font-medium text-purple-900">{doc.prestador_pf_dados.pis_nit}</span>
                        </div>
                        <div>
                          <span className="text-purple-500">Atividade:</span>
                          <span className="ml-2 font-medium text-purple-900">{doc.prestador_pf_dados.atividade}</span>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-purple-200 grid grid-cols-3 gap-3">
                        <div className="text-center p-2 bg-white rounded-lg">
                          <p className="text-[10px] text-purple-500 uppercase">Valor Bruto</p>
                          <p className="font-bold text-purple-800">{formatCurrency(doc.prestador_pf_dados.valor_bruto)}</p>
                        </div>
                        <div className="text-center p-2 bg-white rounded-lg">
                          <p className="text-[10px] text-red-500 uppercase">INSS 11%</p>
                          <p className="font-bold text-red-600">{formatCurrency(doc.prestador_pf_dados.inss_retido)}</p>
                        </div>
                        <div className="text-center p-2 bg-white rounded-lg">
                          <p className="text-[10px] text-emerald-500 uppercase">Líquido</p>
                          <p className="font-bold text-emerald-600">{formatCurrency(doc.prestador_pf_dados.valor_liquido)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
        <button
          onClick={() => setShowDevolverModal(true)}
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-3 bg-amber-100 text-amber-700 rounded-xl font-bold hover:bg-amber-200 transition-all disabled:opacity-50"
        >
          <RotateCcw size={18} />
          Devolver para Correção
        </button>

        <button
          onClick={handleEmitirAtesto}
          disabled={isSubmitting}
          className="flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest hover:bg-emerald-700 transition-all disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Processando...
            </>
          ) : (
            <>
              <CheckCircle2 size={18} />
              Emitir Atesto e Encaminhar SOSFU
            </>
          )}
        </button>
      </div>

      {/* Modal Devolver */}
      {showDevolverModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-black text-slate-800 mb-4">Devolver para Correção</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-bold text-slate-600 mb-2">Motivo da Devolução *</label>
              <textarea
                value={motivoDevolucao}
                onChange={e => setMotivoDevolucao(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-200 focus:border-amber-400 resize-none"
                placeholder="Descreva o motivo da devolução e as correções necessárias..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDevolverModal(false)}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleDevolver}
                disabled={isSubmitting || !motivoDevolucao.trim()}
                className="flex-1 px-4 py-3 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Devolvendo...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrestacaoAtestoTab;
