import React, { useState } from 'react';
import { X, FileText, AlertCircle } from 'lucide-react';

interface PortariaFormData {
  ptres: string;
  dotacoes: string;
  data_inicio: string;
  data_fim: string;
}

interface PortariaFormModalProps {
  onSubmit: (data: PortariaFormData) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export const PortariaFormModal: React.FC<PortariaFormModalProps> = ({ 
  onSubmit, 
  onClose, 
  isLoading = false 
}) => {
  const [formData, setFormData] = useState<PortariaFormData>({
    ptres: '',
    dotacoes: '',
    data_inicio: '',
    data_fim: ''
  });

  const [errors, setErrors] = useState<Partial<PortariaFormData>>({});

  const validate = (): boolean => {
    const newErrors: Partial<PortariaFormData> = {};

    if (!formData.ptres.trim()) {
      newErrors.ptres = 'PTRES é obrigatório';
    } else if (!/^\d{4}$/.test(formData.ptres.trim())) {
      newErrors.ptres = 'PTRES deve conter 4 dígitos';
    }

    if (!formData.dotacoes.trim()) {
      newErrors.dotacoes = 'Dotações são obrigatórias';
    }

    if (!formData.data_inicio) {
      newErrors.data_inicio = 'Data de início é obrigatória';
    }

    if (!formData.data_fim) {
      newErrors.data_fim = 'Data de fim é obrigatória';
    }

    if (formData.data_inicio && formData.data_fim && formData.data_inicio > formData.data_fim) {
      newErrors.data_fim = 'Data de fim deve ser posterior à data de início';
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
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Gerar Portaria de Concessão</h3>
              <p className="text-sm text-slate-500">Preencha os dados necessários para emissão</p>
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
          {/* PTRES */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              PTRES <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Ex: 8727"
              maxLength={4}
              value={formData.ptres}
              onChange={(e) => setFormData({ ...formData, ptres: e.target.value })}
              className={`w-full px-4 py-3 rounded-xl border-2 ${
                errors.ptres 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-slate-200 bg-white'
              } focus:border-blue-500 focus:outline-none transition-colors`}
            />
            {errors.ptres && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.ptres}
              </p>
            )}
            <p className="mt-2 text-xs text-slate-500">
              Programa de Trabalho Resumido (4 dígitos)
            </p>
          </div>

          {/* Dotações */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Dotações Orçamentárias <span className="text-red-500">*</span>
            </label>
            <textarea
              placeholder="Ex: 3.3.90.30.01 - Material de Consumo"
              rows={3}
              value={formData.dotacoes}
              onChange={(e) => setFormData({ ...formData, dotacoes: e.target.value })}
              className={`w-full px-4 py-3 rounded-xl border-2 ${
                errors.dotacoes 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-slate-200 bg-white'
              } focus:border-blue-500 focus:outline-none transition-colors resize-none`}
            />
            {errors.dotacoes && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.dotacoes}
              </p>
            )}
            <p className="mt-2 text-xs text-slate-500">
              Descreva as dotações orçamentárias utilizadas
            </p>
          </div>

          {/* Período de Execução */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Início da Execução <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.data_inicio}
                onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl border-2 ${
                  errors.data_inicio 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-slate-200 bg-white'
                } focus:border-blue-500 focus:outline-none transition-colors`}
              />
              {errors.data_inicio && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.data_inicio}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Fim da Execução <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.data_fim}
                onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl border-2 ${
                  errors.data_fim 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-slate-200 bg-white'
                } focus:border-blue-500 focus:outline-none transition-colors`}
              />
              {errors.data_fim && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.data_fim}
                </p>
              )}
            </div>
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
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-bold transition-colors shadow-lg"
            >
              {isLoading ? 'Gerando...' : 'Gerar Portaria'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
