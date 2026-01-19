import React, { useState } from 'react';
import { X, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { DropdownFonteRecurso } from './BudgetDropdowns';

export interface DocumentoLiquidacaoFormData {
  fonte_recurso: string;  // Herdada da NE (read-only)
  numero_siafe: string;   // 6 dígitos
  data_emissao: string;
}

interface DocumentoLiquidacaoFormModalProps {
  fonteRecursoNE: string; // Vem da NE já gerada
  onSubmit: (data: DocumentoLiquidacaoFormData & { numero_completo: string }) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export const DocumentoLiquidacaoFormModal: React.FC<DocumentoLiquidacaoFormModalProps> = ({ 
  fonteRecursoNE,
  onSubmit, 
  onClose, 
  isLoading = false 
}) => {
  const today = new Date().toISOString().split('T')[0];
  const ano = new Date().getFullYear();
  
  const [formData, setFormData] = useState<DocumentoLiquidacaoFormData>({
    fonte_recurso: fonteRecursoNE, // Pré-preenchida
    numero_siafe: '',
    data_emissao: today
  });

  const [errors, setErrors] = useState<Partial<DocumentoLiquidacaoFormData>>({});

  // Compor número completo: YYYYFFFFFFDLNNNNNN
  const numeroCompleto = formData.numero_siafe
    ? `${ano}${formData.fonte_recurso}DL${formData.numero_siafe}`
    : '';

  const validate = (): boolean => {
    const newErrors: Partial<DocumentoLiquidacaoFormData> = {};

    if (!formData.numero_siafe.trim()) {
      newErrors.numero_siafe = 'Número SIAFE é obrigatório';
    } else if (!/^\d{6}$/.test(formData.numero_siafe)) {
      newErrors.numero_siafe = 'Número deve ter exatamente 6 dígitos';
    }

    if (!formData.data_emissao) {
      newErrors.data_emissao = 'Data de emissão é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        ...formData,
        numero_completo: numeroCompleto
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-amber-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-600 rounded-lg text-white">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Gerar Documento de Liquidação</h3>
              <p className="text-xs text-slate-600">Informe o número SIAFE (fonte herdada da NE)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 hover:bg-amber-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Fonte de Recurso (Read-only) */}
          <DropdownFonteRecurso
            value={formData.fonte_recurso}
            onChange={() => {}} // Não permite mudança
            readOnly={true}
          />

          {/* Número SIAFE */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Número SIAFE (6 dígitos) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="000111"
              value={formData.numero_siafe}
              maxLength={6}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                setFormData({ ...formData, numero_siafe: value });
                setErrors({ ...errors, numero_siafe: undefined });
              }}
              className={`w-full px-4 py-2.5 rounded-xl border-2 ${
                errors.numero_siafe 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-slate-200 bg-white'
              } focus:border-amber-500 focus:outline-none transition-colors font-mono text-lg tracking-wider`}
            />
            {errors.numero_siafe && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle size={14} />
                {errors.numero_siafe}
              </p>
            )}
            <p className="mt-1.5 text-xs text-slate-500">
              Número da liquidação emitido pelo SIAFE
            </p>
          </div>

          {/* Data Emissão */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Data de Emissão <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.data_emissao}
              max={today}
              onChange={(e) => {
                setFormData({ ...formData, data_emissao: e.target.value });
                setErrors({ ...errors, data_emissao: undefined });
              }}
              className={`w-full px-4 py-2.5 rounded-xl border-2 ${
                errors.data_emissao 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-slate-200 bg-white'
              } focus:border-amber-500 focus:outline-none transition-colors`}
            />
            {errors.data_emissao && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle size={14} />
                {errors.data_emissao}
              </p>
            )}
          </div>

          {/* Preview do Número Completo */}
          {numeroCompleto && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs font-bold text-amber-700 mb-2 flex items-center gap-2">
                📋 Número Completo do Documento de Liquidação
              </p>
              <p className="text-2xl font-black text-amber-900 font-mono tracking-wider">
                {numeroCompleto}
              </p>
              <p className="text-xs text-amber-600 mt-2">
                {ano} (ano) + {formData.fonte_recurso} (fonte) + DL + {formData.numero_siafe} (SIAFE)
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !numeroCompleto}
              className="flex-1 px-6 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white rounded-xl font-bold text-sm transition-colors shadow-lg flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Gerando...
                </>
              ) : (
                'Gerar DL'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
