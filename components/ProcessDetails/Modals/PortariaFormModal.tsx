import React, { useState } from 'react';
import { X, FileText, AlertCircle } from 'lucide-react';

interface PortariaFormData {
  numero_portaria: string;
  data_ato: string;
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
  const today = new Date().toISOString().split('T')[0];
  
  const [formData, setFormData] = useState<PortariaFormData>({
    numero_portaria: '',
    data_ato: today
  });

  const [errors, setErrors] = useState<Partial<PortariaFormData>>({});

  const validate = (): boolean => {
    const newErrors: Partial<PortariaFormData> = {};

    if (!formData.numero_portaria.trim()) {
      newErrors.numero_portaria = 'Número da portaria é obrigatório';
    }

    if (!formData.data_ato) {
      newErrors.data_ato = 'Data do ato é obrigatória';
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
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Gerar Portaria de Concessão</h3>
              <p className="text-sm text-slate-500">Informe o número e data do ato</p>
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
          {/* Número Portaria */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Número da Portaria <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Ex: 001/2026-GP"
              value={formData.numero_portaria}
              onChange={(e) => setFormData({ ...formData, numero_portaria: e.target.value })}
              className={`w-full px-4 py-3 rounded-xl border-2 ${
                errors.numero_portaria 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-slate-200 bg-white'
              } focus:border-blue-500 focus:outline-none transition-colors font-mono`}
            />
            {errors.numero_portaria && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.numero_portaria}
              </p>
            )}
            <p className="mt-2 text-xs text-slate-500">
              Número de identificação da portaria de concessão
            </p>
          </div>

          {/* Data do Ato */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Data do Ato <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.data_ato}
              max={today}
              onChange={(e) => setFormData({ ...formData, data_ato: e.target.value })}
              className={`w-full px-4 py-3 rounded-xl border-2 ${
                errors.data_ato 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-slate-200 bg-white'
              } focus:border-blue-500 focus:outline-none transition-colors`}
            />
            {errors.data_ato && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.data_ato}
              </p>
            )}
            <p className="mt-2 text-xs text-slate-500">
              Data em que a portaria foi assinada
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
