import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle,
  FileText,
  Upload,
  ClipboardCheck,
  Send,
  RefreshCw,
  Calendar,
  DollarSign,
  User,
  Briefcase,
  Info,
  Calculator,
  Receipt,
  X,
  Loader2,
  Eye,
  Download
} from 'lucide-react';
import { usePrestacaoContas, ComprovantePC, PrestadorPFDados } from '../../hooks/usePrestacaoContas';
import { checkPCDeadlineException } from '../../hooks/useExceptionDetection';
import { generatePCPDF } from '../../utils/generatePCPDF';
import { ComprovantesUploader } from './ComprovantesUploader';
import { ConciliacaoPanel } from './ConciliacaoPanel';
import { GDRUploader } from './GDRUploader';
import { PrestadorPFForm } from './PrestadorPFForm';
import { DossierReviewPanel } from './DossierReviewPanel';
import { JuriExceptionInlineAlert } from '../ui/JuriExceptionInlineAlert';
import { useToast } from '../ui/ToastProvider';
import { supabase } from '../../lib/supabaseClient';

// =============================================================================
// TYPES
// =============================================================================

interface PrestacaoContasWizardProps {
  solicitacaoId: string;
  processData: {
    nup: string;
    valorConcedido: number;
    supridoNome: string;
    dataFim?: string;
    prazoPrestacao?: string;
    portariaNumero?: string;
    elementosAprovados?: string[];
  };
  onClose: () => void;
  onSuccess?: () => void;
}

type WizardStep = 1 | 2 | 3;

const STEPS = [
  { id: 1, title: 'Execução Financeira', icon: Receipt },
  { id: 2, title: 'Conciliação & GDRs', icon: Calculator },
  { id: 3, title: 'Revisão do Dossiê', icon: ClipboardCheck }
];

// =============================================================================
// COMPONENT
// =============================================================================

export const PrestacaoContasWizard: React.FC<PrestacaoContasWizardProps> = ({
  solicitacaoId,
  processData,
  onClose,
  onSuccess
}) => {
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [totalGasto, setTotalGasto] = useState(0);
  const [totalINSSRetido, setTotalINSSRetido] = useState(0);
  const [totalISSRetido, setTotalISSRetido] = useState(0);
  const [declaracaoAceita, setDeclaracaoAceita] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // GDR States
  const [gdrINSSPaga, setGdrINSSPaga] = useState(false);
  const [gdrSaldoPaga, setGdrSaldoPaga] = useState(false);
  const [gdrINSSNumero, setGdrINSSNumero] = useState('');
  const [gdrSaldoNumero, setGdrSaldoNumero] = useState('');

  const {
    pc,
    comprovantes,
    isLoading,
    isDraft,
    isPendency,
    hasComprovantes,
    saldoRestante,
    createPC,
    submitPC,
    fetchPC,
    refresh
  } = usePrestacaoContas({ solicitacaoId });

  // Calculated values
  const saldoDevolver = processData.valorConcedido - totalGasto;
  const temINSSParaRecolher = totalINSSRetido > 0;
  const temSaldoParaDevolver = saldoDevolver > 0;

  // Load or create PC on mount
  useEffect(() => {
    const initPC = async () => {
      await fetchPC();
      
      // If no PC exists, create draft
      if (!pc) {
        await createPC(processData.valorConcedido);
      }
    };
    initPC();
  }, []);

  // Calculate totals from comprovantes
  useEffect(() => {
    if (comprovantes.length > 0) {
      const total = comprovantes.reduce((sum, c) => sum + c.valor, 0);
      const inss = comprovantes
        .filter(c => c.elemento_despesa === '3.3.90.36')
        .reduce((sum, c) => sum + (c.inss_retido || c.prestador_pf_dados?.inss_retido || 0), 0);
      const iss = comprovantes
        .filter(c => c.elemento_despesa === '3.3.90.36')
        .reduce((sum, c) => sum + (c.iss_retido || c.prestador_pf_dados?.iss_retido || 0), 0);
      
      setTotalGasto(total);
      setTotalINSSRetido(inss);
      setTotalISSRetido(iss);
    }
  }, [comprovantes]);

  // Load GDR states from PC
  useEffect(() => {
    if (pc) {
      setGdrINSSPaga(pc.gdr_inss_paga || false);
      setGdrSaldoPaga(pc.gdr_saldo_paga || false);
      setGdrINSSNumero(pc.gdr_inss_numero || '');
      setGdrSaldoNumero(pc.gdr_saldo_numero || '');
    }
  }, [pc]);

  // Calculate days remaining until PC deadline (from Portaria Art. 4°, II)
  const diasRestantes = useMemo(() => {
    if (!processData.prazoPrestacao) return null;
    const prazo = new Date(processData.prazoPrestacao);
    const hoje = new Date();
    prazo.setHours(0, 0, 0, 0);
    hoje.setHours(0, 0, 0, 0);
    const diff = Math.ceil((prazo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  }, [processData.prazoPrestacao]);

  // PC está fora do prazo se diasRestantes for negativo
  const pcForaDoPrazo = diasRestantes !== null && diasRestantes < 0;
  const diasAtraso = pcForaDoPrazo && diasRestantes !== null ? Math.abs(diasRestantes) : null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // ==========================================================================
  // STEP NAVIGATION
  // ==========================================================================

  const canProceed = (step: WizardStep): boolean => {
    switch (step) {
      case 1: return totalGasto > 0; // Must have at least one expense
      case 2: {
        // GDR step: must have all required GDRs uploaded
        const inssOk = !temINSSParaRecolher || gdrINSSPaga;
        const saldoOk = !temSaldoParaDevolver || gdrSaldoPaga;
        return inssOk && saldoOk;
      }
      case 3: {
        const totalDevolvido = (saldoDevolver > 0 && gdrSaldoPaga) ? saldoDevolver : 0;
        const diferenca = Math.abs(processData.valorConcedido - (totalGasto + totalDevolvido));
        const contaFecha = diferenca < 0.05; 
        return declaracaoAceita && contaFecha;
      }
      default: return false;
    }
  };

  const goNext = () => {
    if (currentStep < 4 && canProceed(currentStep)) {
      setCurrentStep((currentStep + 1) as WizardStep);
    }
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as WizardStep);
    }
  };

  // ==========================================================================
  // GDR UPLOAD HANDLERS
  // ==========================================================================

  const handleGDRUpload = async (tipo: 'INSS' | 'SALDO', file: File, numero: string) => {
    if (!pc) throw new Error('PC não encontrada');

    // Upload file to Supabase Storage
    const filePath = `prestacao/${pc.id}/gdr_${tipo.toLowerCase()}_${Date.now()}.${file.name.split('.').pop()}`;
    
    const { error: uploadError } = await supabase.storage
      .from('documentos')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('documentos')
      .getPublicUrl(filePath);

    // Update PC with GDR data
    const updateData = tipo === 'INSS' 
      ? {
          gdr_inss_numero: numero,
          gdr_inss_arquivo_path: filePath,
          gdr_inss_arquivo_url: urlData.publicUrl,
          gdr_inss_paga: true,
          gdr_inss_valor: totalINSSRetido,
          gdr_inss_data_pagamento: new Date().toISOString().split('T')[0]
        }
      : {
          gdr_saldo_numero: numero,
          gdr_saldo_arquivo_path: filePath,
          gdr_saldo_arquivo_url: urlData.publicUrl,
          gdr_saldo_paga: true,
          gdr_saldo_valor: saldoDevolver,
          gdr_saldo_data_pagamento: new Date().toISOString().split('T')[0]
        };

    const { error: updateError } = await supabase
      .from('prestacao_contas')
      .update(updateData)
      .eq('id', pc.id);

    if (updateError) throw updateError;

    // Modificar o estado local
    if (tipo === 'INSS') {
      setGdrINSSPaga(true);
      setGdrINSSNumero(numero);
    } else {
      setGdrSaldoPaga(true);
      setGdrSaldoNumero(numero);
    }
    
    // Refresh data form Server to ensure URLs are synced
    await refresh();

    showToast({
      title: 'GDR registrada!',
      message: `GDR de ${tipo === 'INSS' ? 'INSS' : 'Devolução'} anexada com sucesso.`,
      type: 'success'
    });
  };

  // ==========================================================================
  // SUBMIT
  // ==========================================================================

  const handleSubmit = async () => {
    if (!canProceed(3)) return;

    setIsSubmitting(true);

    try {
      // Update PC with final values before submit
      if (pc) {
        await supabase
          .from('prestacao_contas')
          .update({
            valor_gasto: totalGasto,
            valor_devolvido: temSaldoParaDevolver && gdrSaldoPaga ? saldoDevolver : 0,
            total_inss_retido: totalINSSRetido,
            total_iss_retido: totalISSRetido,
            total_inss_patronal: totalINSSRetido > 0 ? (totalINSSRetido / 0.11) * 0.20 : 0 // 20% patronal
          })
          .eq('id', pc.id);
      }

      const result = await submitPC(processData.nup);

      if (result.success) {
        showToast({
          title: 'Prestação de Contas Enviada!',
          message: 'Sua PC foi submetida para análise do Gestor.',
          type: 'success'
        });
        onSuccess?.();
        onClose();
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      showToast({
        title: 'Erro ao enviar',
        message: err.message || 'Tente novamente',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================================================
  // ==========================================================================
  // STEP 1: EXECUÇÃO FINANCEIRA (Summary + Comprovantes)
  // ==========================================================================

  const renderStep1 = () => (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="text-center pb-4">
        <div className="w-16 h-16 bg-blue-100 rounded-2xl mx-auto flex items-center justify-center mb-3">
          <Receipt size={32} className="text-blue-600" />
        </div>
        <h2 className="text-2xl font-black text-slate-800">Execução Financeira</h2>
        <p className="text-sm text-slate-500 mt-1">Lance os comprovantes de despesa</p>
      </div>

      {/* Process Info Card (Compact) */}
      <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">NUP</p>
            <p className="text-sm font-black text-slate-800">{processData.nup}</p>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Suprido</p>
            <p className="text-sm font-bold text-slate-700 truncate max-w-[150px]">{processData.supridoNome}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-400 font-bold uppercase">Valor Concedido</p>
          <p className="text-lg font-black text-emerald-700">{formatCurrency(processData.valorConcedido)}</p>
        </div>
      </div>

      {/* Deadline Warning (Compact) */}
      {diasRestantes !== null && diasRestantes <= 7 && (
        <div className={`rounded-xl p-3 flex items-center gap-3 ${diasRestantes <= 3 ? 'bg-red-50 border border-red-100' : 'bg-amber-50 border border-amber-100'}`}>
          <Calendar size={20} className={diasRestantes <= 3 ? 'text-red-600' : 'text-amber-600'} />
          <p className={`text-sm font-bold ${diasRestantes <= 3 ? 'text-red-700' : 'text-amber-700'}`}>
            {diasRestantes > 0 ? `${diasRestantes} dia(s) restante(s)` : diasRestantes === 0 ? 'Prazo vence HOJE!' : `Prazo vencido há ${Math.abs(diasRestantes)} dia(s)`}
          </p>
        </div>
      )}

      {/* Pendency Alert (if returned) */}
      {isPendency && pc?.motivo_pendencia && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-800">PC Devolvida para Correção</p>
              <p className="text-sm text-amber-700 mt-1">{pc.motivo_pendencia}</p>
            </div>
          </div>
        </div>
      )}

      {/* PC Fora do Prazo Alert */}
      {pcForaDoPrazo && diasAtraso !== null && (
        <JuriExceptionInlineAlert
          diasAtraso={diasAtraso}
          userRole="SUPRIDO"
        />
      )}

      {/* Alerta sobre Serviços PF */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-3">
        <div className="flex items-start gap-3">
          <Info size={18} className="text-purple-600 mt-0.5" />
          <p className="text-sm text-purple-700">
            <strong>Serviço PF (3.3.90.36):</strong> Informe dados do prestador para cálculo de INSS (11%) e ISS (5%).
          </p>
        </div>
      </div>

      {/* Uploader Component */}
      {pc && (
        <ComprovantesUploader
          prestacaoId={pc.id}
          nup={processData.nup}
          valorConcedido={processData.valorConcedido}
          onTotalChange={setTotalGasto}
        />
      )}

      {/* Mini Conciliação */}
      <ConciliacaoPanel
        data={{
          totalRecebido: processData.valorConcedido,
          totalGasto,
          totalINSSRetido,
          totalISSRetido,
          gdrINSSPaga,
          gdrSaldoPaga
        }}
        compact={true}
      />
    </div>
  );

  // ==========================================================================
  // STEP 2: CONCILIAÇÃO & GDRs
  // ==========================================================================

  const renderStep2 = () => (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="text-center pb-4">
        <h2 className="text-2xl font-black text-slate-800">Conciliação e GDRs</h2>
        <p className="text-sm text-slate-500 mt-1">Verifique os valores e anexe as GDRs necessárias</p>
      </div>

      {/* Painel de Conciliação Completo */}
      <ConciliacaoPanel
        data={{
          totalRecebido: processData.valorConcedido,
          totalGasto,
          totalINSSRetido,
          totalISSRetido,
          gdrINSSPaga,
          gdrSaldoPaga
        }}
      />

      {/* GDR Uploaders */}
      <div className="space-y-4">
        {temINSSParaRecolher && (
          <GDRUploader
            tipo="INSS"
            valorEsperado={totalINSSRetido}
            numeroGDR={gdrINSSNumero}
            paga={gdrINSSPaga}
            onUpload={(file, numero) => handleGDRUpload('INSS', file, numero)}
          />
        )}

        {temSaldoParaDevolver && (
          <GDRUploader
            tipo="SALDO"
            valorEsperado={saldoDevolver}
            numeroGDR={gdrSaldoNumero}
            paga={gdrSaldoPaga}
            onUpload={(file, numero) => handleGDRUpload('SALDO', file, numero)}
          />
        )}

        {/* Mensagem se não há GDRs necessárias */}
        {!temINSSParaRecolher && !temSaldoParaDevolver && (
          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-6 text-center">
            <CheckCircle2 size={48} className="mx-auto text-emerald-500 mb-4" />
            <h4 className="text-lg font-black text-emerald-800">Nenhuma GDR necessária</h4>
            <p className="text-sm text-emerald-700 mt-2">
              Você utilizou 100% do valor concedido e não há serviços PF com retenção.
              Prossiga para a declaração final.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  // ==========================================================================
  // STEP 3: REVISÃO DO DOSSIÊ (was renderStep4)
  // ==========================================================================

  const renderStep3 = () => (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="text-center pb-6 border-b border-slate-100">
        <div className="w-20 h-20 bg-emerald-100 rounded-3xl mx-auto flex items-center justify-center mb-4">
          <ClipboardCheck size={40} className="text-emerald-600" />
        </div>
        <h2 className="text-2xl font-black text-slate-800">Conferência Final</h2>
        <h2 className="text-2xl font-black text-slate-800">Conferência Final</h2>
        <p className="text-sm text-slate-500 mt-2">Revise os valores e confirme a declaração</p>
        
        <button 
           onClick={() => {
              generatePCPDF({
                  nup: processData.nup,
                  suprido: processData.supridoNome,
                  valorConcedido: processData.valorConcedido,
                  unidade: 'Unidade Jurisdicional', // Pode vir de props se disponivel
                  periodo: processData.prazoPrestacao || new Date().getFullYear().toString()
              }, comprovantes.map(c => ({
                  data: c.data_emissao,
                  fornecedor: c.emitente,
                  documento: `${c.tipo} ${c.numero || ''}`,
                  valor: c.valor,
                  natureza: c.elemento_despesa
              })), {
                  gasto: totalGasto,
                  inss: totalINSSRetido,
                  iss: totalISSRetido,
                  devolvido: (gdrSaldoPaga ? saldoDevolver : 0),
                  saldo: saldoDevolver
              });
           }}
           className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 bg-slate-100 text-slate-600 rounded-full text-xs font-bold hover:bg-slate-200 transition-colors"
        >
            <Download size={14} />
            Baixar Espelho (PDF)
        </button>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-50 rounded-2xl p-4 text-center">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-1">Valor Concedido</p>
          <p className="text-xl font-black text-slate-800">{formatCurrency(processData.valorConcedido)}</p>
        </div>
        <div className="bg-blue-50 rounded-2xl p-4 text-center">
          <p className="text-[10px] text-blue-400 font-black uppercase tracking-wider mb-1">Total Gasto</p>
          <p className="text-xl font-black text-blue-700">{formatCurrency(totalGasto)}</p>
        </div>
      </div>

      {/* Retenções (se houver) */}
      {(totalINSSRetido > 0 || totalISSRetido > 0) && (
        <div className="bg-purple-50 rounded-2xl p-4 space-y-2">
          <p className="text-[10px] text-purple-500 font-black uppercase tracking-wider">Retenções Tributárias</p>
          <div className="flex justify-between text-sm">
            <span className="text-purple-700">INSS (11%)</span>
            <span className="font-bold text-purple-800">{formatCurrency(totalINSSRetido)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-purple-700">ISS (5%)</span>
            <span className="font-bold text-purple-800">{formatCurrency(totalISSRetido)}</span>
          </div>
        </div>
      )}

      {/* GDRs Anexadas */}
      <div className="space-y-2">
        {gdrINSSPaga && (
          <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl">
            <CheckCircle2 size={20} className="text-emerald-600" />
            <span className="text-sm font-medium text-emerald-800">GDR INSS #{gdrINSSNumero}</span>
            <span className="ml-auto text-sm font-bold text-emerald-700">{formatCurrency(totalINSSRetido)}</span>
          </div>
        )}
        {gdrSaldoPaga && (
          <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl">
            <CheckCircle2 size={20} className="text-emerald-600" />
            <span className="text-sm font-medium text-emerald-800">GDR Devolução #{gdrSaldoNumero}</span>
            <span className="ml-auto text-sm font-bold text-emerald-700">{formatCurrency(saldoDevolver)}</span>
          </div>
        )}
      </div>

      {/* Validation Status */}
      {(() => {
        const totalDevolvido = (saldoDevolver > 0 && gdrSaldoPaga) ? saldoDevolver : 0;
        const totalExplicado = totalGasto + totalDevolvido;
        const diferenca = processData.valorConcedido - totalExplicado;
        const contaFecha = Math.abs(diferenca) < 0.05;

        if (contaFecha) {
          return (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
              <CheckCircle2 size={24} className="text-emerald-600" />
              <div>
                <p className="text-sm font-bold text-emerald-800">Conciliação Concluída</p>
                <p className="text-xs text-emerald-700">Todos os valores foram justificados. Você pode enviar a PC.</p>
              </div>
            </div>
          );
        }

        return (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle size={24} className="text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-800">Conciliação Pendente</p>
              <p className="text-xs text-amber-700 mt-1">
                Falta justificar: <strong>{formatCurrency(diferenca)}</strong>
              </p>
              <ul className="list-disc list-inside text-xs text-amber-700 mt-1">
                {saldoDevolver > 0 && !gdrSaldoPaga && <li>É necessário emitir e pagar a GDR de Devolução.</li>}
                {totalGasto === 0 && <li>Não há despesas lançadas.</li>}
              </ul>
            </div>
          </div>
        );
      })()}

      {/* Document Review Section */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-6">
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
            <FileText size={14} /> 
            Conferência do Dossiê Digital
          </h4>
          <span className="text-[10px] font-bold bg-white border border-slate-200 px-2 py-1 rounded-md text-slate-600">
            {(comprovantes?.length || 0) + (gdrINSSPaga ? 1 : 0) + (gdrSaldoPaga ? 1 : 0)} arquivos
          </span>
        </div>
        
        <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
          {/* List Comprovantes */}
          {comprovantes.map((comp) => (
            <div key={comp.id} className="px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Receipt size={16} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700 line-clamp-1">{comp.emitente}</p>
                  <p className="text-[10px] text-slate-500">{comp.descricao} • {formatCurrency(comp.valor)}</p>
                </div>
              </div>
              <a 
                href={comp.storage_url} 
                target="_blank" 
                rel="noopener noreferrer"
                title="Ver comprovante"
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all opacity-0 group-hover:opacity-100"
              >
                <Eye size={16} />
              </a>
            </div>
          ))}

          {/* List GDR INSS */}
          {gdrINSSPaga && (
            <div className="px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">GDR - Recolhimento INSS</p>
                  <p className="text-[10px] text-slate-500">Guia Paga • {formatCurrency(totalINSSRetido)}</p>
                </div>
              </div>
              {pc?.gdr_inss_arquivo_url && (
                <a 
                  href={pc.gdr_inss_arquivo_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-white rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                  <Eye size={16} />
                </a>
              )}
            </div>
          )}

          {/* List GDR Saldo */}
          {gdrSaldoPaga && (
            <div className="px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">GDR - Devolução de Saldo</p>
                  <p className="text-[10px] text-slate-500">Guia Paga • {formatCurrency(saldoDevolver)}</p>
                </div>
              </div>
              {pc?.gdr_saldo_arquivo_url && (
                <a 
                  href={pc.gdr_saldo_arquivo_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-white rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                  <Eye size={16} />
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Declaration */}
      <div className="bg-slate-50 rounded-2xl p-6">
        <label className="flex items-start gap-4 cursor-pointer">
          <input
            type="checkbox"
            checked={declaracaoAceita}
            onChange={e => setDeclaracaoAceita(e.target.checked)}
            className="w-6 h-6 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-slate-700 leading-relaxed">
            <strong className="text-slate-900">DECLARO</strong>, sob as penas da lei, que os recursos foram aplicados 
            estritamente nas despesas autorizadas, em conformidade com a Portaria de concessão, e que os comprovantes 
            anexados são autênticos e correspondem fielmente às operações realizadas.
            {(gdrINSSPaga || gdrSaldoPaga) && (
              <> Confirmo ainda que as GDRs anexadas foram devidamente pagas e os valores recolhidos ao TJPA.</>
            )}
          </span>
        </label>
      </div>
    </div>
  );

  // ==========================================================================
  // MAIN RENDER
  // ==========================================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex flex-col items-center justify-center gap-3">
          <RefreshCw size={32} className="animate-spin text-blue-600" />
          <span className="text-slate-600 font-medium">Carregando prestação de contas...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-[32px] w-full max-w-6xl mx-auto shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
               <button 
                  onClick={onClose} 
                  className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold mb-2 group"
               >
                  <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/> 
                  Voltar ao Painel
               </button>
               <h1 className="text-3xl font-black uppercase tracking-tight">Prestação de Contas</h1>
               <p className="text-slate-400 mt-1 font-medium">Processo NUP {processData.nup}</p>
            </div>
            
            <div className="flex items-center gap-3 px-4 py-2 bg-white/10 rounded-xl border border-white/10">
               <DollarSign size={20} className="text-emerald-400" />
               <span className="font-bold">{formatCurrency(processData.valorConcedido)}</span>
            </div>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;
              
              return (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      isActive ? 'bg-white text-purple-600' : 
                      isCompleted ? 'bg-emerald-400 text-white' : 
                      'bg-white/20 text-white/60'
                    }`}>
                      {isCompleted ? <CheckCircle2 size={20} /> : <Icon size={20} />}
                    </div>
                    <span className={`text-[10px] mt-1 font-bold ${isActive ? 'text-white' : 'text-white/60'}`}>
                      {step.title}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`flex-1 h-1 mx-2 rounded ${isCompleted ? 'bg-emerald-400' : 'bg-white/20'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 p-8 flex items-center justify-between bg-slate-50">
          <button
            onClick={currentStep === 1 ? onClose : goBack}
            className="flex items-center gap-2 px-6 py-4 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-2xl transition-all font-bold shadow-sm"
          >
            <ArrowLeft size={18} />
            {currentStep === 1 ? 'Cancelar e Voltar' : 'Voltar Etapa'}
          </button>

          {currentStep < 3 ? (
            <button
              onClick={goNext}
              disabled={!canProceed(currentStep)}
              className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:-translate-y-1"
            >
              Próxima Etapa
              <ArrowRight size={18} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canProceed(3) || isSubmitting}
              className="flex items-center gap-3 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-emerald-200 hover:-translate-y-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Enviando PC...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Submeter Prestação de Contas
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrestacaoContasWizard;
