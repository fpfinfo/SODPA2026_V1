import React, { useState } from 'react';
import { X, CheckCircle2, AlertTriangle, FileText, DollarSign, User, Send } from 'lucide-react';

interface SefinAnaliseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  processData: {
    nup: string;
    supridoNome: string;
  };
  financialData: {
    valorConcedido: number;
    totalGasto: number;
    totalGlosado: number;
    saldoDevolver: number;
  };
  hasGDR?: boolean;
  hasAtesto?: boolean;
}

export const SefinAnaliseModal: React.FC<SefinAnaliseModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  processData,
  financialData,
  hasGDR = false,
  hasAtesto = false
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  if (!isOpen) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handleConfirm = async () => {
    if (!confirmed) return;
    
    setIsProcessing(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error confirming approval:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const allChecksOk = hasGDR !== false && hasAtesto;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-xl">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Confirmar Aprovação</h2>
              <p className="text-sm text-gray-500">Prestação de Contas - {processData.nup}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Process Info */}
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <User className="h-5 w-5 text-slate-500" />
              <div>
                <p className="text-xs text-slate-400 font-medium">Suprido</p>
                <p className="text-sm font-bold text-slate-800">{processData.supridoNome}</p>
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="bg-blue-50 rounded-xl p-4 space-y-3">
            <h4 className="text-sm font-bold text-blue-800 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Resumo Financeiro
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/60 rounded-lg p-3">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Valor Concedido</p>
                <p className="text-lg font-black text-slate-800">{formatCurrency(financialData.valorConcedido)}</p>
              </div>
              <div className="bg-white/60 rounded-lg p-3">
                <p className="text-[10px] text-blue-400 font-bold uppercase">Total Gasto</p>
                <p className="text-lg font-black text-blue-700">{formatCurrency(financialData.totalGasto)}</p>
              </div>
              <div className="bg-white/60 rounded-lg p-3">
                <p className="text-[10px] text-amber-400 font-bold uppercase">Glosas</p>
                <p className="text-lg font-black text-amber-600">{formatCurrency(financialData.totalGlosado)}</p>
              </div>
              <div className="bg-white/60 rounded-lg p-3">
                <p className="text-[10px] text-emerald-400 font-bold uppercase">Saldo a Devolver</p>
                <p className="text-lg font-black text-emerald-600">{formatCurrency(financialData.saldoDevolver)}</p>
              </div>
            </div>
          </div>

          {/* Checklist */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-3">
            <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Verificações
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm">
                {hasAtesto ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                )}
                <span className={hasAtesto ? 'text-slate-700' : 'text-amber-700'}>
                  Atesto do Gestor {hasAtesto ? 'presente' : 'pendente'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                {hasGDR !== false ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                )}
                <span className={hasGDR !== false ? 'text-slate-700' : 'text-amber-700'}>
                  GDR de Devolução {hasGDR ? 'anexada' : financialData.saldoDevolver > 0 ? 'pendente' : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Warning if checks are not OK */}
          {!allChecksOk && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-bold mb-1">Atenção</p>
                <p className="text-amber-700">
                  Existem verificações pendentes. A aprovação será registrada com ressalvas.
                </p>
              </div>
            </div>
          )}

          {/* Confirmation Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm text-slate-600 group-hover:text-slate-800">
              Confirmo que revisei todos os comprovantes e documentos anexados, e que a prestação de contas 
              está de acordo com a Portaria do TJPA.
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-5 border-t border-gray-100 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!confirmed || isProcessing}
            className="flex-1 py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Aprovar PC
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SefinAnaliseModal;
