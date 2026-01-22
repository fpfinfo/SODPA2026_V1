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
  Loader2
} from 'lucide-react';
import { usePrestacaoContas, ComprovantePC, PrestadorPFDados } from '../../hooks/usePrestacaoContas';
import { ComprovantesUploader } from './ComprovantesUploader';
import { ConciliacaoPanel } from './ConciliacaoPanel';
import { GDRUploader } from './GDRUploader';
import { PrestadorPFForm } from './PrestadorPFForm';
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

type WizardStep = 1 | 2 | 3 | 4;

const STEPS = [
  { id: 1, title: 'Resumo', icon: Briefcase },
  { id: 2, title: 'Comprovantes', icon: Receipt },
  { id: 3, title: 'GDRs', icon: Calculator },
  { id: 4, title: 'Declaração', icon: ClipboardCheck }
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

  // Calculate days remaining
  const diasRestantes = useMemo(() => {
    if (!processData.prazoPrestacao) return null;
    const prazo = new Date(processData.prazoPrestacao);
    const hoje = new Date();
    const diff = Math.ceil((prazo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  }, [processData.prazoPrestacao]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // ==========================================================================
  // STEP NAVIGATION
  // ==========================================================================

  const canProceed = (step: WizardStep): boolean => {
    switch (step) {
      case 1: return true; // Always can view summary
      case 2: return totalGasto > 0; // Comprovantes exist if total > 0
      case 3: {
        // GDR step: must have all required GDRs uploaded
        const inssOk = !temINSSParaRecolher || gdrINSSPaga;
        const saldoOk = !temSaldoParaDevolver || gdrSaldoPaga;
        return inssOk && saldoOk;
      }
      case 4: return declaracaoAceita && totalGasto <= processData.valorConcedido;
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

    // Update local state
    if (tipo === 'INSS') {
      setGdrINSSPaga(true);
      setGdrINSSNumero(numero);
    } else {
      setGdrSaldoPaga(true);
      setGdrSaldoNumero(numero);
    }

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
    if (!canProceed(4)) return;

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

      const result = await submitPC();

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
  // RENDER STEPS
  // ==========================================================================

  const renderStep1 = () => (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="text-center pb-6 border-b border-slate-100">
        <div className="w-20 h-20 bg-blue-100 rounded-3xl mx-auto flex items-center justify-center mb-4">
          <Briefcase size={40} className="text-blue-600" />
        </div>
        <h2 className="text-2xl font-black text-slate-800">Resumo da Concessão</h2>
        <p className="text-sm text-slate-500 mt-2">Verifique os dados antes de prosseguir</p>
      </div>

      {/* Process Info Card */}
      <div className="bg-slate-50 rounded-[28px] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">NUP</p>
            <p className="text-lg font-black text-slate-800">{processData.nup}</p>
          </div>
          {processData.portariaNumero && (
            <div className="text-right">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Portaria</p>
              <p className="text-sm font-bold text-slate-700">{processData.portariaNumero}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <User size={20} className="text-slate-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Suprido</p>
              <p className="text-sm font-bold text-slate-800 truncate max-w-[180px]">{processData.supridoNome}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center shadow-sm">
              <DollarSign size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Valor Concedido</p>
              <p className="text-sm font-black text-emerald-700">{formatCurrency(processData.valorConcedido)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Elementos Autorizados */}
      {processData.elementosAprovados && processData.elementosAprovados.length > 0 && (
        <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4">
          <p className="text-[10px] text-purple-500 font-black uppercase tracking-wider mb-3">
            Elementos de Despesa Autorizados:
          </p>
          <div className="flex flex-wrap gap-2">
            {processData.elementosAprovados.map(el => (
              <span key={el} className="px-3 py-1 bg-white text-purple-700 rounded-lg text-xs font-bold border border-purple-200">
                {el}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Deadline Warning */}
      {diasRestantes !== null && (
        <div className={`rounded-2xl p-4 flex items-center gap-4 ${diasRestantes <= 3 ? 'bg-red-50 border border-red-100' : diasRestantes <= 7 ? 'bg-amber-50 border border-amber-100' : 'bg-blue-50 border border-blue-100'}`}>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${diasRestantes <= 3 ? 'bg-red-100' : diasRestantes <= 7 ? 'bg-amber-100' : 'bg-blue-100'}`}>
            <Calendar size={24} className={diasRestantes <= 3 ? 'text-red-600' : diasRestantes <= 7 ? 'text-amber-600' : 'text-blue-600'} />
          </div>
          <div className="flex-1">
            <p className={`text-sm font-bold ${diasRestantes <= 3 ? 'text-red-700' : diasRestantes <= 7 ? 'text-amber-700' : 'text-blue-700'}`}>
              {diasRestantes > 0 ? `${diasRestantes} dia(s) restante(s) para prestação` : diasRestantes === 0 ? 'Prazo vence HOJE!' : `Prazo vencido há ${Math.abs(diasRestantes)} dia(s)`}
            </p>
            <p className="text-xs text-slate-500">
              Prazo: {processData.prazoPrestacao ? new Date(processData.prazoPrestacao).toLocaleDateString('pt-BR') : 'N/A'}
            </p>
          </div>
        </div>
      )}

      {/* Pendency Alert (if returned) */}
      {isPendency && pc?.motivo_pendencia && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-800">PC Devolvida para Correção</p>
              <p className="text-sm text-amber-700 mt-1">{pc.motivo_pendencia}</p>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
        <Info size={20} className="text-blue-500 mt-0.5" />
        <div>
          <p className="text-sm text-blue-800">
            <strong>Próximo passo:</strong> Anexe os comprovantes de despesa (notas fiscais, recibos, cupons) 
            que demonstram a aplicação dos recursos.
          </p>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="text-center pb-4">
        <h2 className="text-2xl font-black text-slate-800">Comprovantes de Despesa</h2>
        <p className="text-sm text-slate-500 mt-1">Anexe notas fiscais, recibos e cupons</p>
      </div>

      {/* Alerta sobre Serviços PF */}
      <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <Info size={20} className="text-purple-600 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-purple-800">Serviços de Pessoa Física (3.3.90.36)</p>
            <p className="text-sm text-purple-700 mt-1">
              Para serviços PF, será necessário informar dados do prestador e o sistema calculará 
              automaticamente as retenções de ISS (5%) e INSS (11%).
            </p>
          </div>
        </div>
      </div>

      {/* Uploader Component */}
      {pc && (
        <ComprovantesUploader
          prestacaoId={pc.id}
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

  const renderStep3 = () => (
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

  const renderStep4 = () => (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="text-center pb-6 border-b border-slate-100">
        <div className="w-20 h-20 bg-emerald-100 rounded-3xl mx-auto flex items-center justify-center mb-4">
          <ClipboardCheck size={40} className="text-emerald-600" />
        </div>
        <h2 className="text-2xl font-black text-slate-800">Conferência Final</h2>
        <p className="text-sm text-slate-500 mt-2">Revise os valores e confirme a declaração</p>
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

      {/* Validation Error */}
      {totalGasto > processData.valorConcedido && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-red-600 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-800">Valor Excedido</p>
            <p className="text-xs text-red-700">
              O total gasto ({formatCurrency(totalGasto)}) excede o valor concedido ({formatCurrency(processData.valorConcedido)}).
              Revise os comprovantes.
            </p>
          </div>
        </div>
      )}

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
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-3xl p-8 max-w-lg w-full mx-4">
          <div className="flex items-center justify-center gap-3">
            <RefreshCw size={24} className="animate-spin text-blue-600" />
            <span className="text-slate-600">Carregando prestação de contas...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-8">
      <div className="bg-white rounded-[32px] w-full max-w-2xl mx-4 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-black uppercase tracking-tight">Prestação de Contas</h1>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-all">
              <X size={24} />
            </button>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-between">
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
          {currentStep === 4 && renderStep4()}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 p-4 flex items-center justify-between bg-slate-50">
          <button
            onClick={currentStep === 1 ? onClose : goBack}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
          >
            <ArrowLeft size={18} />
            {currentStep === 1 ? 'Cancelar' : 'Voltar'}
          </button>

          {currentStep < 4 ? (
            <button
              onClick={goNext}
              disabled={!canProceed(currentStep)}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próximo
              <ArrowRight size={18} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canProceed(4) || isSubmitting}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Enviar ao Gestor
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
