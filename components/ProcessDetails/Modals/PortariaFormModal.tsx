import React, { useState, useEffect } from 'react';
import { X, FileText, Loader2, Calendar as CalendarIcon, AlertCircle } from 'lucide-react';
import { DropdownPTRES, DropdownDotacao } from './BudgetDropdowns';
import { usePortariaNumber } from '../../../hooks/usePortariaNumber';

interface PortariaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PortariaFormData) => void;
  isLoading?: boolean;
}

export interface PortariaFormData {
  ptres_code: string;
  dotacao_code: string;
  numero_portaria: string; // Gerado automaticamente
  data_ato: string; // Data automática
}

export const PortariaFormModal: React.FC<PortariaFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<PortariaFormData>({
    ptres_code: '',
    dotacao_code: '',
    numero_portaria: '',
    data_ato: new Date().toISOString().split('T')[0]
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof PortariaFormData, string>>>({});
  const { getNextNumber, isLoading: loadingNumber } = usePortariaNumber();
  const [numeroGerado, setNumeroGerado] = useState<string>('');

  // Gerar número ao abrir modal
  useEffect(() => {
    if (isOpen && !numeroGerado) {
      generateNumber();
    }
  }, [isOpen]);

  const generateNumber = async () => {
    try {
      const numero = await getNextNumber();
      setNumeroGerado(numero);
      setFormData(prev => ({ ...prev, numero_portaria: numero }));
    } catch (error) {
      console.error('Erro ao gerar número:', error);
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof PortariaFormData, string>> = {};

    if (!formData.ptres_code.trim()) {
      newErrors.ptres_code = 'PTRES é obrigatório';
    }

    if (!formData.dotacao_code.trim()) {
      newErrors.dotacao_code = 'Dotação é obrigatória';
    }

    if (!formData.numero_portaria) {
      newErrors.numero_portaria = 'Erro ao gerar número da portaria';
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

  const handleClose = () => {
    setFormData({
      ptres_code: '',
      dotacao_code: '',
      numero_portaria: '',
      data_ato: new Date().toISOString().split('T')[0]
    });
    setErrors({});
    setNumeroGerado('');
    onClose();
  };

  if (!isOpen) return null;

  const today = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Gerar Portaria de Concessão</h3>
              <p className="text-xs text-slate-500">Selecione PTRES e dotação orçamentária</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-slate-200 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-6">
          {/* PTRES Dropdown */}
          <DropdownPTRES
            value={formData.ptres_code}
            onChange={(code) => {
              setFormData({ ...formData, ptres_code: code, dotacao_code: '' });
              setErrors({ ...errors, ptres_code: undefined });
            }}
            error={errors.ptres_code}
          />

          {/* Dotação Dropdown (Cascata) */}
          <DropdownDotacao
            ptres={formData.ptres_code}
            value={formData.dotacao_code}
            onChange={(code) => {
              setFormData({ ...formData, dotacao_code: code });
              setErrors({ ...errors, dotacao_code: undefined });
            }}
            error={errors.dotacao_code}
          />

          {/* Informações Automáticas */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
            <p className="text-xs font-bold text-blue-700 mb-3 flex items-center gap-2">
              <AlertCircle size={14} />
              Informações Geradas Automaticamente
            </p>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">Número da Portaria:</span>
                {loadingNumber ? (
                  <div className="flex items-center gap-2 text-xs text-blue-600">
                    <Loader2 size={12} className="animate-spin" />
                    Gerando...
                  </div>
                ) : (
                  <span className="text-sm font-black text-blue-700">{numeroGerado || '—'}</span>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">Data do Ato:</span>
                <span className="text-sm font-bold text-slate-700">{today}</span>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || loadingNumber || !numeroGerado}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Gerando...
                </>
              ) : (
                'Gerar Portaria'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
