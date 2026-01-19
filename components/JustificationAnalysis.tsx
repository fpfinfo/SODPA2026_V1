import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Sparkles } from 'lucide-react';

export interface NLPAnalysis {
  aprovado: boolean;
  categoria: 'CONSUMO' | 'SERVICO_PF' | 'SERVICO_PJ' | 'VIAGEM' | 'OUTRA';
  confianca: number;
  motivo_rejeicao?: string;
  sugestao_analista: string;
  elementos_detectados: string[];
  analyzed_at?: string;
}

interface JustificationAnalysisProps {
  nlpAnalysis?: NLPAnalysis;
  isAnalyzing?: boolean;
}

const CATEGORIA_LABELS: Record<string, string> = {
  CONSUMO: 'Material de Consumo',
  SERVICO_PF: 'Serviço PF',
  SERVICO_PJ: 'Serviço PJ',
  VIAGEM: 'Viagem/Locomoção',
  OUTRA: 'Outra categoria'
};

export const JustificationAnalysis: React.FC<JustificationAnalysisProps> = ({ 
  nlpAnalysis,
  isAnalyzing = false 
}) => {
  if (isAnalyzing) {
    return (
      <div className="mt-3 p-3 rounded-lg bg-blue-50 border-2 border-blue-200">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
          <p className="text-xs font-bold text-blue-700">
            🤖 Analisando justificativa com IA...
          </p>
        </div>
      </div>
    );
  }

  if (!nlpAnalysis) {
    return null;
  }

  const statusConfig = nlpAnalysis.aprovado 
    ? { color: 'emerald', icon: CheckCircle, label: 'Justificativa Adequada' }
    : { color: 'red', icon: XCircle, label: 'Justificativa Insuficiente' };

  const Icon = statusConfig.icon;

  return (
    <div className={`mt-3 p-3 rounded-lg border-2 bg-${statusConfig.color}-50 border-${statusConfig.color}-300`}>
      <div className="flex items-start gap-2">
        <Icon className={`w-4 h-4 text-${statusConfig.color}-600 mt-0.5 flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className={`text-xs font-bold text-${statusConfig.color}-700`}>
              🤖 {statusConfig.label}
            </p>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] px-2 py-0.5 rounded bg-white/70 font-medium text-${statusConfig.color}-700`}>
                {CATEGORIA_LABELS[nlpAnalysis.categoria]}
              </span>
              <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded">
                {nlpAnalysis.confianca}%
              </span>
            </div>
          </div>
          
          <p className={`text-xs mt-1 text-${statusConfig.color}-700 leading-relaxed`}>
            {nlpAnalysis.sugestao_analista}
          </p>

          {nlpAnalysis.motivo_rejeicao && (
            <div className="mt-2 p-2 bg-white/50 rounded border border-current/20">
              <p className="text-[10px] font-bold text-red-700">Motivo da rejeição:</p>
              <p className="text-[10px] text-red-600">{nlpAnalysis.motivo_rejeicao}</p>
            </div>
          )}

          {nlpAnalysis.elementos_detectados.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {nlpAnalysis.elementos_detectados.map((elemento, i) => (
                <span 
                  key={i} 
                  className="text-[10px] px-2 py-0.5 rounded bg-white/70 text-slate-700 border border-slate-300"
                >
                  {elemento}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
