import React, { useState, useRef } from 'react';
import { Shield, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { useConformityValidation, ProcessData as ValidationProcessData } from '../hooks/useConformityValidation';

interface ConformityChecklistProps {
  processData: ValidationProcessData;
  className?: string;
}

export const ConformityChecklist: React.FC<ConformityChecklistProps> = ({ 
  processData,
  className = '' 
}) => {
  const { checklist, overallStatus, allValid } = useConformityValidation(processData);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const firstErrorRef = useRef<HTMLDivElement>(null);

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
