import React, { useState } from 'react';
import {
  X,
  Database,
  Calendar,
  Hash,
  CheckCircle2,
  AlertTriangle,
  FileText,
  RefreshCw
} from 'lucide-react';
import { usePrestacaoContas } from '../../hooks/usePrestacaoContas';
import { useToast } from '../ui/ToastProvider';

// =============================================================================
// TYPES
// =============================================================================

interface BaixaSiafeModalProps {
  solicitacaoId: string;
  processData: {
    nup: string;
    supridoNome: string;
    valorConcedido: number;
    portariaNumero?: string;
  };
  onClose: () => void;
  onSuccess?: () => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export const BaixaSiafeModal: React.FC<BaixaSiafeModalProps> = ({
  solicitacaoId,
  processData,
  onClose,
  onSuccess
}) => {
  const { showToast } = useToast();
  const [siafeNl, setSiafeNl] = useState('');
  const [siafeDate, setSiafeDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { baixaSiafe } = usePrestacaoContas({ solicitacaoId });

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!siafeNl.trim()) {
      showToast({
        title: 'Campo obrigatório',
        message: 'Informe o número da Nota de Lançamento (NL)',
        type: 'error'
      });
      return;
    }

    if (!siafeDate) {
      showToast({
        title: 'Campo obrigatório',
        message: 'Informe a data da baixa',
        type: 'error'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await baixaSiafe(siafeNl.trim(), siafeDate);

      if (result.success) {
        showToast({
          title: 'Baixa SIAFE Realizada!',
          message: `NL ${siafeNl} registrada com sucesso. Processo concluído.`,
          type: 'success'
        });
        onSuccess?.();
        onClose();
      } else {
        showToast({
          title: 'Erro ao registrar baixa',
          message: result.error || 'Tente novamente',
          type: 'error'
        });
      }
    } catch (error: any) {
      showToast({
        title: 'Erro',
        message: error.message || 'Falha ao processar baixa SIAFE',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[28px] w-full max-w-lg shadow-2xl animate-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Database size={24} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800">Baixa de Responsabilidade</h2>
              <p className="text-xs text-slate-500">Registro SIAFE</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Process Summary */}
          <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">NUP</p>
                <p className="text-sm font-bold text-slate-800">{processData.nup}</p>
              </div>
              {processData.portariaNumero && (
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Portaria</p>
                  <p className="text-sm font-bold text-slate-700">{processData.portariaNumero}</p>
                </div>
              )}
            </div>
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Suprido</p>
                <p className="text-sm font-bold text-slate-800">{processData.supridoNome}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Valor</p>
                <p className="text-sm font-black text-emerald-700">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(processData.valorConcedido)}
                </p>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Hash size={12} /> Número da Nota de Lançamento (NL) *
              </label>
              <input
                type="text"
                value={siafeNl}
                onChange={e => setSiafeNl(e.target.value)}
                placeholder="Ex: 2026NL00001234"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300"
                required
                disabled={isSubmitting}
              />
              <p className="text-xs text-slate-400">
                Número da baixa de responsabilidade registrada no SIAFE
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Calendar size={12} /> Data da Baixa *
              </label>
              <input
                type="date"
                value={siafeDate}
                onChange={e => setSiafeDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Info Alert */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
            <FileText size={18} className="text-blue-500 mt-0.5" />
            <div>
              <p className="text-sm text-blue-800">
                Após a baixa, será gerada automaticamente a <strong>Portaria de Regularidade de Prestação de Contas</strong> 
                para assinatura do Ordenador.
              </p>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-500 mt-0.5" />
            <div>
              <p className="text-sm text-amber-800">
                Esta ação é <strong>irreversível</strong>. Certifique-se de que os dados estão corretos antes de confirmar.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-3 text-slate-600 font-bold text-sm hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !siafeNl.trim() || !siafeDate}
              className="px-8 py-3 bg-blue-600 text-white font-black text-sm rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-blue-200 transition-all"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  Confirmar Baixa SIAFE
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BaixaSiafeModal;
