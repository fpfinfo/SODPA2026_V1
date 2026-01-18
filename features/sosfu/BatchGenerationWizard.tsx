/**
 * Batch Generation Wizard Component
 * 3-step wizard for generating quarterly ordinary supply processes
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  CheckCircle,
  AlertTriangle,
  UserX,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Rocket,
  FileText,
  Users,
  DollarSign,
  Package,
  X,
} from 'lucide-react';
import {
  Quarter,
  QUARTER_CONFIG,
  ComarcaBudget,
  formatCurrency,
  calculateQuarterValue,
} from '../types/batch';
import { useComarcasBudget } from '../hooks/useComarcasBudget';

interface BatchGenerationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate?: (quarter: Quarter, comarcas: ComarcaBudget[]) => Promise<void>;
}

type WizardStep = 'SELECT' | 'VALIDATE' | 'CONFIRM';

export const BatchGenerationWizard: React.FC<BatchGenerationWizardProps> = ({
  isOpen,
  onClose,
  onGenerate,
}) => {
  // Use Supabase hook for comarcas
  const { comarcas: supabaseComarcas, isLoading: loadingComarcas } = useComarcasBudget();
  
  const [step, setStep] = useState<WizardStep>('SELECT');
  const [selectedQuarter, setSelectedQuarter] = useState<Quarter | null>(null);
  const [comarcas, setComarcas] = useState<ComarcaBudget[]>([]);
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  
  // Sync from Supabase
  useEffect(() => {
    if (supabaseComarcas.length > 0) {
      setComarcas(supabaseComarcas);
    }
  }, [supabaseComarcas]);

  // Validation stats
  const validation = useMemo(() => {
    const regular = comarcas.filter(c => c.status === 'REGULAR' && !excludedIds.has(c.id));
    const pendente = comarcas.filter(c => c.status === 'PENDENTE');
    const semSuprido = comarcas.filter(c => c.status === 'SEM_SUPRIDO');
    const included = comarcas.filter(c => !excludedIds.has(c.id) && c.status !== 'SEM_SUPRIDO');
    
    return { regular, pendente, semSuprido, included };
  }, [comarcas, excludedIds]);

  // Totals for confirmation
  const totals = useMemo(() => {
    const includedComarcas = validation.included;
    const totalAnual = includedComarcas.reduce((sum, c) => sum + c.teto_anual, 0);
    const totalQuarter = totalAnual / 3;
    const totalProcessos = includedComarcas.length;
    const totalDocumentos = totalProcessos * 3; // Portaria + NE + Certidão
    
    return { totalAnual, totalQuarter, totalProcessos, totalDocumentos };
  }, [validation.included]);

  const handleToggleExclude = (id: string) => {
    setExcludedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleGenerate = async () => {
    if (!selectedQuarter) return;
    setIsGenerating(true);
    
    try {
      // Simulate generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      if (onGenerate) {
        await onGenerate(selectedQuarter, validation.included);
      }
      setIsComplete(true);
    } catch (error) {
      console.error('Generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    setStep('SELECT');
    setSelectedQuarter(null);
    setExcludedIds(new Set());
    setIsComplete(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                <Package size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800">Gerar Lote Quadrimestral</h2>
                <p className="text-sm text-slate-500">Suprimento Ordinário - PTRES 8193</p>
              </div>
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <X size={20} className="text-slate-400" />
            </button>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center gap-2 mt-6">
            {(['SELECT', 'VALIDATE', 'CONFIRM'] as WizardStep[]).map((s, i) => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  step === s ? 'bg-blue-600 text-white' : 
                  i < ['SELECT', 'VALIDATE', 'CONFIRM'].indexOf(step) ? 'bg-emerald-100 text-emerald-700' :
                  'bg-slate-100 text-slate-400'
                }`}>
                  <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-black">
                    {i + 1}
                  </span>
                  {s === 'SELECT' ? 'Período' : s === 'VALIDATE' ? 'Validação' : 'Confirmação'}
                </div>
                {i < 2 && <ChevronRight size={16} className="text-slate-300" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* STEP 1: Select Quarter */}
          {step === 'SELECT' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <Calendar size={48} className="mx-auto text-blue-500 mb-4" />
                <h3 className="text-lg font-black text-slate-800">Selecione o Quadrimestre</h3>
                <p className="text-sm text-slate-500">Escolha o período para geração do lote</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {(Object.entries(QUARTER_CONFIG) as [Quarter, typeof QUARTER_CONFIG['1Q']][]).map(([q, config]) => (
                  <button
                    key={q}
                    onClick={() => setSelectedQuarter(q)}
                    className={`p-6 rounded-2xl border-2 transition-all text-center ${
                      selectedQuarter === q
                        ? 'border-blue-500 bg-blue-50 shadow-lg'
                        : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                    }`}
                  >
                    <p className="text-2xl font-black text-slate-800 mb-1">{config.label}</p>
                    <p className="text-sm text-slate-500">{config.months}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Validate */}
          {step === 'VALIDATE' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Users size={48} className="mx-auto text-amber-500 mb-4" />
                <h3 className="text-lg font-black text-slate-800">Validação de Supridos</h3>
                <p className="text-sm text-slate-500">Verifique a situação de cada comarca</p>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle size={20} className="text-emerald-600" />
                    <span className="text-sm font-bold text-emerald-700">Regulares</span>
                  </div>
                  <p className="text-3xl font-black text-emerald-600">{validation.regular.length}</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={20} className="text-amber-600" />
                    <span className="text-sm font-bold text-amber-700">Pendentes</span>
                  </div>
                  <p className="text-3xl font-black text-amber-600">{validation.pendente.length}</p>
                </div>
                <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <UserX size={20} className="text-red-600" />
                    <span className="text-sm font-bold text-red-700">Sem Suprido</span>
                  </div>
                  <p className="text-3xl font-black text-red-600">{validation.semSuprido.length}</p>
                </div>
              </div>

              {/* Issues List */}
              {(validation.pendente.length > 0 || validation.semSuprido.length > 0) && (
                <div className="bg-slate-50 rounded-2xl p-4 max-h-64 overflow-y-auto">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                    Comarcas com Restrições
                  </p>
                  <div className="space-y-2">
                    {[...validation.pendente, ...validation.semSuprido].map(c => (
                      <div key={c.id} className={`flex items-center justify-between p-3 rounded-xl ${
                        c.status === 'PENDENTE' ? 'bg-amber-50' : 'bg-red-50'
                      }`}>
                        <div>
                          <p className="text-sm font-bold text-slate-700">{c.comarca_nome}</p>
                          <p className="text-xs text-slate-500">
                            {c.status === 'SEM_SUPRIDO' ? 'Sem suprido cadastrado' : c.pendencias?.join(', ')}
                          </p>
                        </div>
                        {c.status !== 'SEM_SUPRIDO' && (
                          <button
                            onClick={() => handleToggleExclude(c.id)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              excludedIds.has(c.id)
                                ? 'bg-slate-200 text-slate-600'
                                : 'bg-red-100 text-red-600 hover:bg-red-200'
                            }`}
                          >
                            {excludedIds.has(c.id) ? 'Incluir' : 'Excluir'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Confirm */}
          {step === 'CONFIRM' && !isComplete && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Rocket size={48} className="mx-auto text-indigo-500 mb-4" />
                <h3 className="text-lg font-black text-slate-800">Confirmar Geração em Lote</h3>
                <p className="text-sm text-slate-500">{selectedQuarter && QUARTER_CONFIG[selectedQuarter].label} / 2026</p>
              </div>

              {/* Summary */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Processos</p>
                    <p className="text-4xl font-black">{totals.totalProcessos}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Valor Total</p>
                    <p className="text-4xl font-black text-emerald-400">{formatCurrency(totals.totalQuarter)}</p>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Documentos</p>
                    <p className="text-xl font-black">{totals.totalDocumentos}</p>
                    <p className="text-xs text-slate-500">Portaria + NE + Certidão</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Por Processo</p>
                    <p className="text-xl font-black">{formatCurrency(totals.totalQuarter / totals.totalProcessos)}</p>
                    <p className="text-xs text-slate-500">Média por comarca</p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-800">Ação Irreversível</p>
                  <p className="text-xs text-amber-700">
                    Ao confirmar, {totals.totalProcessos} processos serão criados e enviados para assinatura do Ordenador.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Complete State */}
          {isComplete && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={40} className="text-emerald-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-2">Lote Gerado com Sucesso!</h3>
              <p className="text-slate-500 mb-6">{totals.totalProcessos} processos aguardando assinatura do Ordenador</p>
              <button
                onClick={handleClose}
                className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
              >
                Fechar
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isComplete && (
          <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between">
            <button
              onClick={() => step === 'SELECT' ? handleClose() : setStep(step === 'VALIDATE' ? 'SELECT' : 'VALIDATE')}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft size={18} />
              {step === 'SELECT' ? 'Cancelar' : 'Voltar'}
            </button>

            {step === 'CONFIRM' ? (
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-black uppercase tracking-wider shadow-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Rocket size={18} />
                    Gerar Lote Agora
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => setStep(step === 'SELECT' ? 'VALIDATE' : 'CONFIRM')}
                disabled={step === 'SELECT' && !selectedQuarter}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próximo
                <ChevronRight size={18} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchGenerationWizard;
