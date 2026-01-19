import React, { useState, useRef } from 'react';
import { Shield, CheckCircle, XCircle, Clock, Loader2, AlertCircle, AlertTriangle } from 'lucide-react';
import { useConformityValidation, ProcessData, ExecutionDocument } from '../hooks/useConformityValidation';
import { useBudgetValidation } from '../hooks/useBudgetValidation';
import { JustificationAnalysis, NLPAnalysis } from './JustificationAnalysis';

interface ConformityChecklistProps {
  processData: ProcessData;
  executionDocuments?: ExecutionDocument[];
  className?: string;
  ptresCode?: string; // For real-time budget validation
  nlpAnalysis?: NLPAnalysis; // AI-powered justification analysis
  solicitacaoId?: string; // For triggering analysis
}

export const ConformityChecklist: React.FC<ConformityChecklistProps> = ({ 
  processData,
  executionDocuments = [],
  className = '',
  ptresCode,
  nlpAnalysis,
  solicitacaoId
}) => {
  const checklistRef = useRef<HTMLDivElement>(null);
  const {
    checklist,
    summary,
    allValid
  } = useConformityValidation(processData, executionDocuments);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const firstErrorRef = useRef<HTMLDivElement>(null);

  // Real-time budget validation
  const budgetValidation = useBudgetValidation({
    ptresCode,
    valorSolicitado: processData.valor_solicitado || 0
  });

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    
    // Simula tempo de análise
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setIsAnalyzing(false);
    
    // Scroll para primeiro erro se houver
    if (!allValid && firstErrorRef.current) {
      firstErrorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const getStatusIcon = (status: 'pending' | 'valid' | 'invalid') => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'invalid':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
      default:
        return <Clock className="w-5 h-5 text-amber-500" />;
    }
  };

  const getStatusBgColor = (status: 'pending' | 'valid' | 'invalid') => {
    switch (status) {
      case 'valid':
        return 'bg-emerald-50 border-emerald-200';
      case 'invalid':
        return 'bg-red-50 border-red-200';
      case 'pending':
      default:
        return 'bg-amber-50 border-amber-200';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100">
          <Shield className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-black text-slate-900">Checklist de Conformidade</h3>
          <p className="text-sm text-slate-500">
            {allValid ? (
              <span className="text-emerald-600 font-bold">✓ Todos os requisitos atendidos</span>
            ) : (
              <span className="text-amber-600">Verificação de requisitos obrigatórios</span>
            )}
          </p>
        </div>
      </div>

      {/* Botão Analisar */}
      <button
        onClick={handleAnalyze}
        disabled={isAnalyzing}
        className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-3"
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Analisando...
          </>
        ) : (
          <>
            <Shield className="w-5 h-5" />
            Analisar Conformidade
          </>
        )}
      </button>

      {/* Checklist Items */}
      <div className="space-y-3">
        {checklist.map((item, index) => {
          const isFirstError = !allValid && item.status === 'invalid' && 
            checklist.slice(0, index).every(i => i.status !== 'invalid');
          
          return (
            <div
              key={item.id}
              ref={isFirstError ? firstErrorRef : null}
              className={`p-4 rounded-xl border-2 transition-all ${getStatusBgColor(item.status)}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getStatusIcon(item.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-900">{item.label}</h4>
                  <p className="text-xs text-slate-600 mt-0.5">{item.description}</p>
                  
                  {/* Budget Validation Alert for Valor Solicitado */}
                  {item.id === 'valor_solicitado' && budgetValidation.status !== 'LOADING' && budgetValidation.status !== 'UNAVAILABLE' && (
                    <div className={`mt-3 p-3 rounded-lg border-2 ${
                      budgetValidation.status === 'OVER_BUDGET' ? 'bg-red-50 border-red-300' :
                      budgetValidation.status === 'LIMITE_CRITICO' ? 'bg-amber-50 border-amber-300' :
                      'bg-emerald-50 border-emerald-300'
                    }`}>
                      <div className="flex items-start gap-2">
                        {budgetValidation.status === 'OVER_BUDGET' ? (
                          <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                        ) : budgetValidation.status === 'LIMITE_CRITICO' ? (
                          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold ${
                            budgetValidation.status === 'OVER_BUDGET' ? 'text-red-700' :
                            budgetValidation.status === 'LIMITE_CRITICO' ? 'text-amber-700' :
                            'text-emerald-700'
                          }`}>
                            ✨ Validação Orçamentária Automática
                          </p>
                          <p className={`text-xs mt-1 ${
                            budgetValidation.status === 'OVER_BUDGET' ? 'text-red-600' :
                            budgetValidation.status === 'LIMITE_CRITICO' ? 'text-amber-600' :
                            'text-emerald-600'
                          }`}>
                            {budgetValidation.message}
                          </p>
                          <div className="mt-2 text-[10px] text-slate-600 space-y-0.5">
                            <div className="flex justify-between">
                              <span>Utilização após aprovação:</span>
                              <span className={`font-mono font-bold ${
                                budgetValidation.status === 'OVER_BUDGET' ? 'text-red-700' :
                                budgetValidation.status === 'LIMITE_CRITICO' ? 'text-amber-700' :
                                'text-emerald-700'
                              }`}>
                                {budgetValidation.percentualUtilizado.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* NLP Justification Analysis for Justificativa */}
                  {item.id === 'justificativa' && nlpAnalysis && (
                    <JustificationAnalysis nlpAnalysis={nlpAnalysis} />
                  )}

                  {item.errorMessage && (
                    <p className="text-xs text-red-600 font-medium mt-2 flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      {item.errorMessage}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className={`p-4 rounded-xl border-2 ${
        allValid ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-slate-700">
            Status Geral:
          </span>
          <span className={`text-sm font-black uppercase tracking-wider ${
            allValid ? 'text-emerald-600' : 'text-amber-600'
          }`}>
            {allValid ? '✓ Conforme' : '⚠ Pendente'}
          </span>
        </div>
        {!allValid && (
          <p className="text-xs text-slate-600 mt-2">
            Complete todos os itens acima para aprovar esta solicitação
          </p>
        )}
      </div>
    </div>
  );
};
