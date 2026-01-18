import React, { useState } from 'react';
import { X, FileText, AlertCircle } from 'lucide-react';

interface NotaEmpenhoFormData {
  numero_ne: string;
  data_emissao: string;
}

interface NotaEmpenhoFormModalProps {
  onSubmit: (data: NotaEmpenhoFormData) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export const NotaEmpenhoFormModal: React.FC<NotaEmpenhoFormModalProps> = ({ 
  onSubmit, 
  onClose, 
  isLoading = false 
}) => {
  const today = new Date().toISOString().split('T')[0];
  
  const [formData, setFormData] = useState<NotaEmpenhoFormData>({
    numero_ne: '',
    data_emissao: today
  });

  const [errors, setErrors] = useState<Partial<NotaEmpenhoFormData>>({});

  const validate = (): boolean => {
    const newErrors: Partial<NotaEmpenhoFormData> = {};

    if (!formData.numero_ne.trim()) {
      newErrors.numero_ne = 'Número da NE é obrigatório';
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
      onSubmit(formData);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <FileText className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Gerar Nota de Empenho</h3>
              <p className="text-sm text-slate-500">Informe o número e data de emissão</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Número NE */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Número da Nota de Empenho <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Ex: 2026NE000123"
              value={formData.numero_ne}
              onChange={(e) => setFormData({ ...formData, numero_ne: e.target.value })}
              className={`w-full px-4 py-3 rounded-xl border-2 ${
                errors.numero_ne 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-slate-200 bg-white'
              } focus:border-emerald-500 focus:outline-none transition-colors font-mono`}
            />
            {errors.numero_ne && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.numero_ne}
              </p>
            )}
            <p className="mt-2 text-xs text-slate-500">
              Número de identificação da nota de empenho no SIAFE
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
              onChange={(e) => setFormData({ ...formData, data_emissao: e.target.value })}
              className={`w-full px-4 py-3 rounded-xl border-2 ${
                errors.data_emissao 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-slate-200 bg-white'
              } focus:border-emerald-500 focus:outline-none transition-colors`}
            />
            {errors.data_emissao && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.data_emissao}
              </p>
            )}
            <p className="mt-2 text-xs text-slate-500">
              Data em que a nota de empenho foi emitida
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl font-bold transition-colors shadow-lg"
            >
              {isLoading ? 'Gerando...' : 'Gerar Nota de Empenho'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
