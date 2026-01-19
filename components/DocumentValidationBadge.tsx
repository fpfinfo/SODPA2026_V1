import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';

export interface DocumentValidation {
  id: string;
  documento_id: string;
  tipo_validacao: 'OCR' | 'SIGNATURE' | 'FIELD_MATCH';
  status: 'APPROVED' | 'REJECTED' | 'REVIEW_NEEDED';
  resultado: {
    extracted?: any;
    validationResults?: any;
  };
  confianca: number;
  created_at: string;
}

interface DocumentValidationBadgeProps {
  validation?: DocumentValidation;
  isProcessing?: boolean;
}

export const DocumentValidationBadge: React.FC<DocumentValidationBadgeProps> = ({ 
  validation,
  isProcessing = false 
}) => {
  // Loading state
  if (isProcessing) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
        <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
        <div>
          <p className="text-xs font-bold text-blue-700">Processando OCR...</p>
          <p className="text-[10px] text-blue-600">Validando documento automaticamente</p>
        </div>
      </div>
    );
  }

  // No validation yet
  if (!validation) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200">
        <AlertTriangle className="w-4 h-4 text-slate-400" />
        <div>
          <p className="text-xs font-bold text-slate-600">Aguardando validação</p>
          <p className="text-[10px] text-slate-500">Documento não processado</p>
        </div>
      </div>
    );
  }

  // Status configuration
  const statusConfig = {
    APPROVED: { 
      color: 'emerald', 
      icon: CheckCircle, 
      label: 'Validado Automaticamente',
      description: 'Todos os campos conferem'
    },
    REVIEW_NEEDED: { 
      color: 'amber', 
      icon: AlertTriangle, 
      label: 'Requer Revisão Humana',
      description: 'Algumas divergências encontradas'
    },
    REJECTED: { 
      color: 'red', 
      icon: XCircle, 
      label: 'Validação Falhou',
      description: 'Dados não conferem'
    }
  };

  const config = statusConfig[validation.status];
  const Icon = config.icon;

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg bg-${config.color}-50 border-2 border-${config.color}-200`}>
      <Icon className={`w-5 h-5 text-${config.color}-600 mt-0.5 flex-shrink-0`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className={`text-xs font-bold text-${config.color}-700`}>
            ✨ {config.label}
          </p>
          <span className={`text-[10px] font-mono font-bold text-${config.color}-600 bg-white px-2 py-0.5 rounded`}>
            {validation.confianca?.toFixed(0)}% confiança
          </span>
        </div>
        <p className={`text-[10px] text-${config.color}-600`}>
          {config.description}
        </p>
        
        {/* Extracted fields preview */}
        {validation.resultado?.extracted && (
          <div className="mt-2 pt-2 border-t border-current/20 space-y-1">
            {validation.resultado.extracted.cpf && (
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-600">CPF extraído:</span>
                <span className="font-mono">{validation.resultado.extracted.cpf}</span>
              </div>
            )}
            {validation.resultado.extracted.data && (
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-600">Data:</span>
                <span className="font-mono">{validation.resultado.extracted.data}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
