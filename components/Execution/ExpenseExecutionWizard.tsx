import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  CheckCircle2, 
  FileText, 
  Award, 
  DollarSign, 
  FileCheck, 
  CreditCard,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Send,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useBudgetAllocations } from '../../hooks/useBudgetAllocations';
import { useToast } from '../ui/ToastProvider';

interface ProcessData {
  id: string;
  nup?: string;
  protocolNumber?: string;
  interestedParty?: string;
  value?: number;
  tipo?: string;
  type?: string;
  itens_despesa?: any[];
  ptres_code?: string;
  dotacao_code?: string;
  ne_numero?: string;
  dl_numero?: string;
  ob_numero?: string;
  portaria_sf_numero?: string;
  suprido_nome?: string;
  valor_total?: number;
}

interface ExpenseExecutionWizardProps {
  isOpen: boolean;
  onClose: () => void;
  process: ProcessData;
  onSuccess?: () => void;
}

type ExecutionStep = 'PORTARIA' | 'CERTIDAO' | 'NE' | 'DL' | 'OB' | 'TRAMITAR';

const STEPS: { key: ExecutionStep; label: string; icon: React.ReactNode }[] = [
  { key: 'PORTARIA', label: 'Portaria SF', icon: <FileText size={18} /> },
  { key: 'CERTIDAO', label: 'Certidão', icon: <Award size={18} /> },
  { key: 'NE', label: 'Nota de Empenho', icon: <DollarSign size={18} /> },
  { key: 'DL', label: 'Doc. Liquidação', icon: <FileCheck size={18} /> },
  { key: 'OB', label: 'Ordem Bancária', icon: <CreditCard size={18} /> },
  { key: 'TRAMITAR', label: 'Tramitar', icon: <Send size={18} /> },
];

export const ExpenseExecutionWizard: React.FC<ExpenseExecutionWizardProps> = ({
  isOpen,
  onClose,
  process,
  onSuccess
}) => {
  const [currentStep, setCurrentStep] = useState<ExecutionStep>('PORTARIA');
  const [isProcessing, setIsProcessing] = useState(false);
  const { showToast } = useToast();
  
  // Form states
  const [selectedPtres, setSelectedPtres] = useState(process.ptres_code || '');
  const [selectedDotacoes, setSelectedDotacoes] = useState<string[]>(
    process.dotacao_code ? process.dotacao_code.split(';') : []
  );
  const [neNumero, setNeNumero] = useState(process.ne_numero || '');
  const [neData, setNeData] = useState('');
  const [dlNumero, setDlNumero] = useState(process.dl_numero || '');
  const [dlData, setDlData] = useState('');
  const [obNumero, setObNumero] = useState(process.ob_numero || '');
  const [obData, setObData] = useState('');
  const [portariaNumero, setPortariaNumero] = useState(process.portaria_sf_numero || '');
  
  // Document states
  const [generatedDocs, setGeneratedDocs] = useState<Record<string, boolean>>({
    PORTARIA: !!process.portaria_sf_numero,
    CERTIDAO: false,
    NE: !!process.ne_numero,
    DL: !!process.dl_numero,
    OB: !!process.ob_numero
  });

  // Budget allocations hook
  const { 
    ptresOptions, 
    dotacaoOptions, 
    isLoading: isLoadingBudget,
    fetchAllPTRES,
    fetchDotacoesForPTRES
  } = useBudgetAllocations();

  // Extract element codes from process
  const elementCodes = useMemo(() => {
    if (process.itens_despesa && Array.isArray(process.itens_despesa)) {
      return process.itens_despesa.map((item: any) => item.elemento_despesa || item.element_code).filter(Boolean);
    }
    return ['3.3.90.30', '3.3.90.39']; // Fallback common elements
  }, [process.itens_despesa]);

  // Fetch all PTRES options on mount
  useEffect(() => {
    fetchAllPTRES();
  }, [fetchAllPTRES]);

  // Fetch dotacoes when PTRES changes
  useEffect(() => {
    if (selectedPtres) {
      fetchDotacoesForPTRES(selectedPtres);
    }
  }, [selectedPtres, fetchDotacoesForPTRES]);

  const currentStepIndex = STEPS.findIndex(s => s.key === currentStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === STEPS.length - 1;

  const goNext = () => {
    if (!isLastStep) {
      setCurrentStep(STEPS[currentStepIndex + 1].key);
    }
  };

  const goPrev = () => {
    if (!isFirstStep) {
      setCurrentStep(STEPS[currentStepIndex - 1].key);
    }
  };

  // Toggle dotação selection
  const toggleDotacao = (dotacaoCode: string) => {
    setSelectedDotacoes(prev => 
      prev.includes(dotacaoCode)
        ? prev.filter(d => d !== dotacaoCode)
        : [...prev, dotacaoCode]
    );
  };

  const handleGeneratePortaria = async () => {
    if (!selectedPtres || selectedDotacoes.length === 0) {
      showToast({ type: 'warning', title: 'Campos obrigatórios', message: 'Selecione o PTRES e pelo menos uma Dotação.' });
      return;
    }

    setIsProcessing(true);
    try {
      // Generate Portaria number
      const year = new Date().getFullYear();
      const portariaNum = `${Math.floor(Math.random() * 900) + 100}/${year}-SF`;
      
      // Save to database - join multiple dotacoes with ;
      const dotacaoString = selectedDotacoes.join(';');
      await supabase
        .from('solicitacoes')
        .update({
          ptres_code: selectedPtres,
          dotacao_code: dotacaoString,
          portaria_sf_numero: portariaNum,
          execution_started_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', process.id);

      // Create document record
      await supabase.from('documentos').insert({
        solicitacao_id: process.id,
        tipo: 'PORTARIA_SF',
        nome: `Portaria SF ${portariaNum}`,
        titulo: `Portaria de Suprimento de Fundos`,
        status: 'MINUTA',
        conteudo: generatePortariaContent(portariaNum, selectedPtres, selectedDotacoes),
        created_by: (await supabase.auth.getUser()).data.user?.id
      });

      setPortariaNumero(portariaNum);
      setGeneratedDocs(prev => ({ ...prev, PORTARIA: true }));
      showToast({ type: 'success', title: 'Portaria gerada!', message: `Número: ${portariaNum}` });
      goNext();
    } catch (error) {
      console.error('Error generating Portaria:', error);
      showToast({ type: 'error', title: 'Erro', message: 'Falha ao gerar Portaria.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateCertidao = async () => {
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from('documentos').insert({
        solicitacao_id: process.id,
        tipo: 'CERTIDAO_REGULARIDADE',
        nome: 'Certidão de Regularidade',
        titulo: 'Certidão de Regularidade Fiscal do Suprido',
        status: 'MINUTA',
        conteudo: generateCertidaoContent(),
        created_by: user?.id
      });

      setGeneratedDocs(prev => ({ ...prev, CERTIDAO: true }));
      showToast({ type: 'success', title: 'Certidão emitida!', message: 'Certidão de Regularidade gerada.' });
      goNext();
    } catch (error) {
      console.error('Error generating Certidão:', error);
      showToast({ type: 'error', title: 'Erro', message: 'Falha ao gerar Certidão.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveNE = async () => {
    if (!neNumero) {
      showToast({ type: 'warning', title: 'Número obrigatório', message: 'Informe o número da Nota de Empenho.' });
      return;
    }

    setIsProcessing(true);
    try {
      await supabase
        .from('solicitacoes')
        .update({
          ne_numero: neNumero,
          ne_data: neData || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', process.id);

      // Create document record
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('documentos').insert({
        solicitacao_id: process.id,
        tipo: 'NOTA_EMPENHO',
        nome: `Nota de Empenho ${neNumero}`,
        titulo: 'Nota de Empenho',
        status: 'ASSINADO', // External document already signed
        conteudo: `Nota de Empenho nº ${neNumero}\nData: ${neData || 'N/I'}\nDocumento gerado no sistema SIAFE.`,
        created_by: user?.id
      });

      setGeneratedDocs(prev => ({ ...prev, NE: true }));
      showToast({ type: 'success', title: 'NE registrada!', message: `Número: ${neNumero}` });
      goNext();
    } catch (error) {
      console.error('Error saving NE:', error);
      showToast({ type: 'error', title: 'Erro', message: 'Falha ao registrar Nota de Empenho.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveDL = async () => {
    if (!dlNumero) {
      showToast({ type: 'warning', title: 'Número obrigatório', message: 'Informe o número do Documento de Liquidação.' });
      return;
    }

    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      await supabase
        .from('solicitacoes')
        .update({
          dl_numero: dlNumero,
          dl_data: dlData || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', process.id);

      // Insert DL document into dossier
      await supabase.from('documentos').insert({
        solicitacao_id: process.id,
        nome: `DOCUMENTO DE LIQUIDAÇÃO Nº ${dlNumero}`,
        tipo: 'LIQUIDACAO',
        status: 'MINUTA',
        conteudo: `DOCUMENTO DE LIQUIDAÇÃO Nº ${dlNumero}\n\nProcesso: ${process.nup}\nInteressado: ${process.interestedParty || process.suprido_nome}\nValor: R$ ${Number(process.value || process.valor_total || 0).toFixed(2).replace('.', ',')}\nData de Emissão: ${dlData || new Date().toLocaleDateString('pt-BR')}\n\nA liquidação da despesa refere-se ao suprimento de fundos concedido conforme portaria em anexo.`,
        created_by: user?.id,
      });

      setGeneratedDocs(prev => ({ ...prev, DL: true }));
      showToast({ type: 'success', title: 'DL registrado!', message: `Número: ${dlNumero}` });
      goNext();
    } catch (error) {
      console.error('Error saving DL:', error);
      showToast({ type: 'error', title: 'Erro', message: 'Falha ao registrar Documento de Liquidação.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveOB = async () => {
    if (!obNumero) {
      showToast({ type: 'warning', title: 'Número obrigatório', message: 'Informe o número da Ordem Bancária.' });
      return;
    }

    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      await supabase
        .from('solicitacoes')
        .update({
          ob_numero: obNumero,
          ob_data: obData || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', process.id);

      // Insert OB document into dossier
      await supabase.from('documentos').insert({
        solicitacao_id: process.id,
        nome: `ORDEM BANCÁRIA Nº ${obNumero}`,
        tipo: 'ORDEM_BANCARIA',
        status: 'MINUTA',
        conteudo: `ORDEM BANCÁRIA Nº ${obNumero}\n\nProcesso: ${process.nup}\nInteressado: ${process.interestedParty || process.suprido_nome}\nValor: R$ ${Number(process.value || process.valor_total || 0).toFixed(2).replace('.', ',')}\nData de Emissão: ${obData || new Date().toLocaleDateString('pt-BR')}\n\nOrdem de pagamento ao servidor suprido conforme liquidação e documentação em anexo.`,
        created_by: user?.id,
      });

      setGeneratedDocs(prev => ({ ...prev, OB: true }));
      showToast({ type: 'success', title: 'OB registrada!', message: `Número: ${obNumero}` });
      goNext();
    } catch (error) {
      console.error('Error saving OB:', error);
      showToast({ type: 'error', title: 'Erro', message: 'Falha ao registrar Ordem Bancária.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTramitarOrdenador = async () => {
    // Check all required docs are generated
    if (!generatedDocs.PORTARIA || !generatedDocs.CERTIDAO || !generatedDocs.NE) {
      showToast({ 
        type: 'warning', 
        title: 'Documentos pendentes', 
        message: 'Gere a Portaria SF, Certidão e NE antes de tramitar.' 
      });
      return;
    }

    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Update process status
      await supabase
        .from('solicitacoes')
        .update({
          status: 'AGUARDANDO ASSINATURA',
          destino_atual: 'SEFIN',
          updated_at: new Date().toISOString()
        })
        .eq('id', process.id);

      // Record tramitation history
      await supabase.from('historico_tramitacao').insert({
        solicitacao_id: process.id,
        origem: 'SOSFU',
        destino: 'SEFIN',
        status_anterior: 'EM ANÁLISE SOSFU',
        status_novo: 'AGUARDANDO ASSINATURA',
        observacao: 'Portaria SF, Certidão de Regularidade e Nota de Empenho enviados para assinatura do Ordenador de Despesa.',
        tramitado_por: user?.id,
        data_tramitacao: new Date().toISOString()
      });

      // Create SEFIN signing tasks for each document
      const docsToSign = [
        { tipo: 'PORTARIA', titulo: `Portaria SF ${portariaNumero} - ${process.interestedParty || process.suprido_nome}` },
        { tipo: 'CERTIDAO', titulo: `Certidão de Regularidade - ${process.interestedParty || process.suprido_nome}` },
        { tipo: 'NOTA_EMPENHO', titulo: `Nota de Empenho ${neNumero} - ${process.nup}` },
      ];

      if (generatedDocs.DL) {
        docsToSign.push({ tipo: 'LIQUIDACAO', titulo: `Documento de Liquidação ${dlNumero} - ${process.nup}` });
      }
      if (generatedDocs.OB) {
        docsToSign.push({ tipo: 'ORDEM_BANCARIA', titulo: `Ordem Bancária ${obNumero} - ${process.nup}` });
      }

      for (const doc of docsToSign) {
        const { error: insertError } = await supabase.from('sefin_tasks').insert({
          solicitacao_id: process.id,
          tipo: doc.tipo,
          titulo: doc.titulo,
          origem: 'SOSFU',
          valor: process.value || process.valor_total || 0,
          status: 'PENDING',
        });
        if (insertError) {
          console.error('Error inserting sefin_task:', insertError);
        } else {
          console.log('Successfully inserted sefin_task:', doc.titulo);
        }
      }

      showToast({ 
        type: 'success', 
        title: 'Tramitado com sucesso!', 
        message: 'Documentos enviados para assinatura do Ordenador.' 
      });
      
      onClose();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error tramiting to Ordenador:', error);
      showToast({ type: 'error', title: 'Erro', message: 'Falha ao tramitar para o Ordenador.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const generatePortariaContent = (numero: string, ptres: string, dotacoes: string[]) => {
    const nup = process.nup || process.protocolNumber || 'N/I';
    const interessado = process.interestedParty || process.suprido_nome || 'Servidor não identificado';
    const valor = process.value || process.valor_total || 0;
    const valorFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
    
    const dotacaoText = dotacoes.length === 1 
      ? `Dotação Orçamentária ${dotacoes[0]}`
      : `Dotações Orçamentárias: ${dotacoes.join(', ')}`;

    return `PORTARIA SF Nº ${numero}

Secretário de Planejamento, Coordenação e Finanças do Tribunal de Justiça do Estado do Pará, no exercício das suas atribuições, estabelecidas na Portaria nº XXXX/2026-GP,

RESOLVE:

Art. 1º AUTORIZAR a concessão de Suprimento de Fundos ao servidor ${interessado}, a ser executado através do PTRES ${ptres} e ${dotacaoText}, conforme especificações constantes no NUP ${nup}.

Art. 2º O valor total do presente Suprimento de Fundos é de ${valorFormatado}, obedecendo aos limites estabelecidos pela Resolução CNJ nº 169/2013.

Art. 3º O prazo de aplicação é de 90 (noventa) dias contados da data de recebimento do numerário, e o prazo para prestação de contas é de 30 (trinta) dias após o término do prazo de aplicação.

Art. 4º Esta Portaria entra em vigor na data de sua publicação.

Belém-PA, ${new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}.

_____________________________
SECRETÁRIO EXECUTIVO DE FINANÇAS
Ordenador de Despesa`;
  };

  const generateCertidaoContent = () => {
    const interessado = process.interestedParty || 'Servidor não identificado';
    const nup = process.nup || process.protocolNumber || 'N/I';

    return `CERTIDÃO DE REGULARIDADE

CERTIFICO, para os devidos fins e a quem interessar possa, que o servidor ${interessado}, interessado no processo NUP ${nup}, encontra-se REGULAR perante as obrigações relacionadas a suprimentos de fundos anteriores, não constando pendências de prestação de contas em aberto nesta Secretaria de Finanças.

A presente certidão é emitida com base nos registros do Sistema de Controle de Suprimentos de Fundos (SISUP/SCS) do Tribunal de Justiça do Estado do Pará.

Belém-PA, ${new Date().toLocaleDateString('pt-BR')}.

_____________________________
ANALISTA SOSFU
Seção de Suprimento de Fundos`;
  };

  if (!isOpen) return null;

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight">Execução da Despesa</h2>
              <p className="text-blue-200 text-sm font-medium mt-1">
                {process.nup || process.protocolNumber} • {process.interestedParty}
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-all">
              <X size={24} />
            </button>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-8 overflow-x-auto pb-2">
            {STEPS.map((step, idx) => (
              <div 
                key={step.key}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all ${
                  currentStep === step.key 
                    ? 'bg-white text-blue-600' 
                    : generatedDocs[step.key as keyof typeof generatedDocs]
                      ? 'bg-emerald-500/20 text-emerald-200'
                      : 'bg-white/10 text-white/60'
                }`}
              >
                {generatedDocs[step.key as keyof typeof generatedDocs] ? (
                  <CheckCircle2 size={14} />
                ) : (
                  step.icon
                )}
                {step.label}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="p-8 max-h-[50vh] overflow-y-auto">
          {/* Step: PORTARIA */}
          {currentStep === 'PORTARIA' && (
            <div className="space-y-6">
              <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                <h3 className="text-lg font-black text-slate-800 mb-4">1. Portaria de Suprimento de Fundos</h3>
                <p className="text-sm text-slate-600 mb-6">
                  Selecione o PTRES e a Dotação Orçamentária para esta solicitação. 
                  Estes dados serão referenciados no Art. 1º da Portaria.
                </p>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                      PTRES *
                    </label>
                    <select
                      value={selectedPtres}
                      onChange={(e) => setSelectedPtres(e.target.value)}
                      className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm font-medium"
                      disabled={isLoadingBudget}
                    >
                      <option value="">Selecione o PTRES...</option>
                      {ptresOptions.map(opt => (
                        <option key={opt.code} value={opt.code}>
                          {opt.code} - {opt.description} ({formatCurrency(opt.availableAmount)} disponível)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                      Dotações Orçamentárias * <span className="text-slate-400 font-medium normal-case">(selecione uma ou mais)</span>
                    </label>
                    <div className={`bg-white border border-slate-200 rounded-xl p-4 max-h-48 overflow-y-auto ${!selectedPtres ? 'opacity-50' : ''}`}>
                      {!selectedPtres ? (
                        <p className="text-sm text-slate-400 italic">Selecione um PTRES primeiro</p>
                      ) : isLoadingBudget ? (
                        <p className="text-sm text-slate-400">Carregando dotações...</p>
                      ) : dotacaoOptions.length === 0 ? (
                        <p className="text-sm text-slate-400 italic">Nenhuma dotação disponível para este PTRES</p>
                      ) : (
                        <div className="space-y-2">
                          {dotacaoOptions.map(opt => (
                            <label 
                              key={opt.code} 
                              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                                selectedDotacoes.includes(opt.code)
                                  ? 'bg-blue-50 border border-blue-200'
                                  : 'bg-slate-50 border border-transparent hover:bg-slate-100'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={selectedDotacoes.includes(opt.code)}
                                onChange={() => toggleDotacao(opt.code)}
                                className="w-4 h-4 text-blue-600 rounded border-slate-300"
                              />
                              <div className="flex-1">
                                <p className="text-sm font-bold text-slate-700">{opt.code}</p>
                                <p className="text-[10px] text-slate-500">{opt.description}</p>
                              </div>
                              <span className="text-[10px] font-medium text-emerald-600">
                                {formatCurrency(opt.availableAmount)}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                    {selectedDotacoes.length > 0 && (
                      <p className="text-[10px] text-blue-600 font-medium mt-2">
                        {selectedDotacoes.length} dotação(ões) selecionada(s)
                      </p>
                    )}
                  </div>
                </div>

                {selectedPtres && selectedDotacoes.length > 0 && (
                  <div className="mt-6 p-4 bg-white rounded-xl border border-slate-200">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Prévia do Art. 1º</p>
                    <p className="text-sm text-slate-700">
                      <strong>Art. 1º</strong> AUTORIZAR a concessão de Suprimento de Fundos ao servidor {process.interestedParty}, 
                      a ser executado através do <strong className="text-blue-600">PTRES {selectedPtres}</strong> e 
                      {selectedDotacoes.length === 1 ? (
                        <strong className="text-blue-600"> Dotação Orçamentária {selectedDotacoes[0]}</strong>
                      ) : (
                        <strong className="text-blue-600"> Dotações Orçamentárias: {selectedDotacoes.join(', ')}</strong>
                      )}.
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={handleGeneratePortaria}
                disabled={!selectedPtres || selectedDotacoes.length === 0 || isProcessing || generatedDocs.PORTARIA}
                className="w-full py-4 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <FileText size={16} />}
                {generatedDocs.PORTARIA ? 'Portaria Gerada' : 'Minutar Portaria SF'}
              </button>
            </div>
          )}

          {/* Step: CERTIDAO */}
          {currentStep === 'CERTIDAO' && (
            <div className="space-y-6">
              <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                <h3 className="text-lg font-black text-slate-800 mb-4">2. Certidão de Regularidade</h3>
                <p className="text-sm text-slate-600 mb-6">
                  A Certidão de Regularidade atesta que o servidor interessado não possui pendências 
                  de prestação de contas anteriores. Clique no botão para emitir automaticamente.
                </p>

                <div className="p-4 bg-white rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3 text-emerald-600">
                    <CheckCircle2 size={24} />
                    <span className="font-bold">Servidor {process.interestedParty} encontra-se REGULAR</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleGenerateCertidao}
                disabled={isProcessing || generatedDocs.CERTIDAO}
                className="w-full py-4 bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <Award size={16} />}
                {generatedDocs.CERTIDAO ? 'Certidão Emitida' : 'Emitir Certidão'}
              </button>
            </div>
          )}

          {/* Step: NE */}
          {currentStep === 'NE' && (
            <div className="space-y-6">
              <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
                <h3 className="text-lg font-black text-slate-800 mb-4">3. Nota de Empenho (NE)</h3>
                <p className="text-sm text-slate-600 mb-6">
                  Informe o número da Nota de Empenho gerada no sistema SIAFE.
                </p>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                      Número da NE *
                    </label>
                    <input
                      type="text"
                      value={neNumero}
                      onChange={(e) => setNeNumero(e.target.value)}
                      placeholder="Ex: 2026NE00123"
                      className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                      Data de Emissão
                    </label>
                    <input
                      type="date"
                      value={neData}
                      onChange={(e) => setNeData(e.target.value)}
                      className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm font-medium"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleSaveNE}
                disabled={!neNumero || isProcessing}
                className="w-full py-4 bg-amber-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <DollarSign size={16} />}
                {generatedDocs.NE ? 'NE Registrada' : 'Registrar NE'}
              </button>
            </div>
          )}

          {/* Step: DL */}
          {currentStep === 'DL' && (
            <div className="space-y-6">
              <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100">
                <h3 className="text-lg font-black text-slate-800 mb-4">4. Documento de Liquidação (DL)</h3>
                <p className="text-sm text-slate-600 mb-6">
                  Informe o número do Documento de Liquidação gerado no sistema SIAFE.
                </p>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                      Número do DL *
                    </label>
                    <input
                      type="text"
                      value={dlNumero}
                      onChange={(e) => setDlNumero(e.target.value)}
                      placeholder="Ex: 2026DL00456"
                      className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                      Data de Emissão
                    </label>
                    <input
                      type="date"
                      value={dlData}
                      onChange={(e) => setDlData(e.target.value)}
                      className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm font-medium"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleSaveDL}
                disabled={!dlNumero || isProcessing}
                className="w-full py-4 bg-purple-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <FileCheck size={16} />}
                {generatedDocs.DL ? 'DL Registrado' : 'Registrar DL'}
              </button>
            </div>
          )}

          {/* Step: OB */}
          {currentStep === 'OB' && (
            <div className="space-y-6">
              <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                <h3 className="text-lg font-black text-slate-800 mb-4">5. Ordem Bancária (OB)</h3>
                <p className="text-sm text-slate-600 mb-6">
                  Informe o número da Ordem Bancária gerada no sistema SIAFE.
                </p>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                      Número da OB *
                    </label>
                    <input
                      type="text"
                      value={obNumero}
                      onChange={(e) => setObNumero(e.target.value)}
                      placeholder="Ex: 2026OB00789"
                      className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                      Data de Emissão
                    </label>
                    <input
                      type="date"
                      value={obData}
                      onChange={(e) => setObData(e.target.value)}
                      className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm font-medium"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleSaveOB}
                disabled={!obNumero || isProcessing}
                className="w-full py-4 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <CreditCard size={16} />}
                {generatedDocs.OB ? 'OB Registrada' : 'Registrar OB'}
              </button>
            </div>
          )}

          {/* Step: TRAMITAR */}
          {currentStep === 'TRAMITAR' && (
            <div className="space-y-6">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <h3 className="text-lg font-black text-slate-800 mb-4">6. Tramitar para Ordenador</h3>
                <p className="text-sm text-slate-600 mb-6">
                  Envie a Portaria SF, Certidão de Regularidade e Nota de Empenho para assinatura do Ordenador de Despesa.
                </p>

                {/* Checklist */}
                <div className="space-y-3">
                  <div className={`flex items-center gap-3 p-3 rounded-xl ${generatedDocs.PORTARIA ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {generatedDocs.PORTARIA ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                    <span className="font-bold text-sm">Portaria SF {portariaNumero && `(${portariaNumero})`}</span>
                  </div>
                  <div className={`flex items-center gap-3 p-3 rounded-xl ${generatedDocs.CERTIDAO ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {generatedDocs.CERTIDAO ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                    <span className="font-bold text-sm">Certidão de Regularidade</span>
                  </div>
                  <div className={`flex items-center gap-3 p-3 rounded-xl ${generatedDocs.NE ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {generatedDocs.NE ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                    <span className="font-bold text-sm">Nota de Empenho {neNumero && `(${neNumero})`}</span>
                  </div>
                </div>

                {(!generatedDocs.PORTARIA || !generatedDocs.CERTIDAO || !generatedDocs.NE) && (
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                    <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-700">
                      Gere todos os documentos obrigatórios antes de tramitar para o Ordenador.
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={handleTramitarOrdenador}
                disabled={!generatedDocs.PORTARIA || !generatedDocs.CERTIDAO || !generatedDocs.NE || isProcessing}
                className="w-full py-4 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                Tramitar para Ordenador (SEFIN)
              </button>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-6 border-t border-slate-100 flex justify-between">
          <button
            onClick={goPrev}
            disabled={isFirstStep}
            className="flex items-center gap-2 px-6 py-3 text-slate-500 font-bold text-xs hover:bg-slate-50 rounded-xl disabled:opacity-30"
          >
            <ChevronLeft size={16} /> Anterior
          </button>
          
          {!isLastStep && currentStep !== 'TRAMITAR' && (
            <button
              onClick={goNext}
              className="flex items-center gap-2 px-6 py-3 text-blue-600 font-bold text-xs hover:bg-blue-50 rounded-xl"
            >
              Pular <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpenseExecutionWizard;
