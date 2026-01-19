import React, { useState } from 'react';
import { X, FileText, AlertCircle, Loader2 } from 'lucide-react';

export interface NotaEmpenhoFormData {
  ug: string;            // UG: Unidade Gestora (fixo: 040102)
  numero_siafe: string;  // 6 dígitos
  data_emissao: string;
}

interface NotaEmpenhoFormModalProps {
  onSubmit: (data: NotaEmpenhoFormData & { numero_completo: string }) => void;
  onClose: () => void;
  isLoading?: boolean;
  isOpen?: boolean;
  processData?: any;
}

export const NotaEmpenhoFormModal: React.FC<NotaEmpenhoFormModalProps> = ({ 
  onSubmit, 
  onClose, 
  isLoading = false,
  isOpen = true
}) => {
  if (!isOpen) return null;

  const today = new Date().toISOString().split('T')[0];
  const ano = new Date().getFullYear();
  
  // UG fixo para Suprimento de Fundos
  const UG_SUPRIMENTO_FUNDOS = '040102';
  
  const [formData, setFormData] = useState<NotaEmpenhoFormData>({
    ug: UG_SUPRIMENTO_FUNDOS,
    numero_siafe: '',
    data_emissao: today
  });

  const [errors, setErrors] = useState<Partial<NotaEmpenhoFormData>>({});

  // Compor número completo: YYYYUUUUUUNNENNNNNN (18 caracteres)
  // Exemplo: 2026040102NE000111
  const numeroCompleto = formData.numero_siafe
    ? `${ano}${formData.ug}NE${formData.numero_siafe}`
    : '';

  const validate = (): boolean => {
    const newErrors: Partial<NotaEmpenhoFormData> = {};

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
        <div className="px-6 py-4 border-b border-slate-200 bg-emerald-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 rounded-lg text-white">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Gerar Nota de Empenho</h3>
              <p className="text-xs text-slate-600">Informe número SIAFE da NE</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 hover:bg-emerald-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* UG: Unidade Gestora (Fixo) */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              UG: Unidade Gestora
            </label>
            <div className="relative">
              <input
                type="text"
                value={UG_SUPRIMENTO_FUNDOS}
                disabled
                className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-500 font-mono text-lg tracking-wider cursor-not-allowed"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">
                FIXO
              </div>
            </div>
            <p className="mt-1.5 text-xs text-slate-600">
              💡 Código fixo da Unidade Gestora para <strong>Suprimento de Fundos</strong>
            </p>
          </div>

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
                const value = e.target.value.replace(/\D/g, ''); // Apenas dígitos
                setFormData({ ...formData, numero_siafe: value });
                setErrors({ ...errors, numero_siafe: undefined });
              }}
              className={`w-full px-4 py-2.5 rounded-xl border-2 ${
                errors.numero_siafe 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-slate-200 bg-white'
              } focus:border-emerald-500 focus:outline-none transition-colors font-mono text-lg tracking-wider`}
            />
            {errors.numero_siafe && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle size={14} />
                {errors.numero_siafe}
              </p>
            )}
            <p className="mt-1.5 text-xs text-slate-500">
              Exemplos: <code className="bg-slate-100 px-1 rounded">000111</code>, 
              <code className="bg-slate-100 px-1 rounded ml-1">000222</code>, 
              <code className="bg-slate-100 px-1 rounded ml-1">001500</code>
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
              } focus:border-emerald-500 focus:outline-none transition-colors`}
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
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <p className="text-xs font-bold text-blue-900 uppercase tracking-wide mb-2">
                Prévia do Número de Empenho
              </p>
              <p className="font-mono text-2xl font-bold text-blue-600 tracking-wider">
                {numeroCompleto}
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-slate-500 font-medium">Ano</p>
                  <p className="font-mono font-bold text-slate-700">{ano}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-medium">UG</p>
                  <p className="font-mono font-bold text-slate-700">{UG_SUPRIMENTO_FUNDOS}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-medium">Número</p>
                  <p className="font-mono font-bold text-slate-700">NE{formData.numero_siafe}</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-50 disabled:opacity-50 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.numero_siafe}
              className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Gerando...
                </>
              ) : (
                'Gerar Nota de Empenho'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
