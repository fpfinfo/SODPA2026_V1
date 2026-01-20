import React, { useState, useEffect, useMemo } from 'react';
import { X, FileText, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { DropdownPTRES, DropdownDotacao } from './BudgetDropdowns';
import { usePortariaNumber } from '../../../hooks/usePortariaNumber';

interface PortariaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PortariaFormData) => void;
  isLoading?: boolean;
  expenseElements?: string[]; // Elementos de despesa da solicitação
}

export interface PortariaFormData {
  ptres_code: string;
  dotacoes: Record<string, string>; // { '3.3.90.30': '162', '3.3.90.39': '171' }
  numero_portaria: string;
  data_ato: string;
  // Legacy compatibility
  dotacao_code?: string;
}

// Mapeamento de elementos para labels
const ELEMENT_LABELS: Record<string, string> = {
  '3.3.90.30': 'Material de Consumo / Combustível',
  '3.3.90.33': 'Passagens e Locomoção',
  '3.3.90.36': 'Serviços de Terceiros - Pessoa Física',
  '3.3.90.39': 'Serviços de Terceiros - Pessoa Jurídica',
};

// Extrai o prefixo natureza (3.3.90.XX)
const extractNaturezaPrefix = (element: string): string => {
  // "3.3.90.30.01" -> "3.3.90.30"
  // "3.3.90.39" -> "3.3.90.39"
  const parts = element.split('.');
  if (parts.length >= 4) {
    return parts.slice(0, 4).join('.');
  }
  return element;
};

export const PortariaFormModal: React.FC<PortariaFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  expenseElements = []
}) => {
  // Agrupa elementos por natureza
  const elementGroups = useMemo(() => {
    if (!expenseElements || expenseElements.length === 0) {
      return []; // Modo single dropdown se não houver elementos
    }
    const groups = new Set<string>();
    expenseElements.forEach(el => {
      groups.add(extractNaturezaPrefix(el));
    });
    return Array.from(groups).sort();
  }, [expenseElements]);

  const [formData, setFormData] = useState<{
    ptres_code: string;
    dotacoes: Record<string, string>;
    numero_portaria: string;
    data_ato: string;
  }>({
    ptres_code: '',
    dotacoes: {},
    numero_portaria: '',
    data_ato: new Date().toISOString().split('T')[0]
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
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

  const updateDotacao = (group: string, code: string) => {
    setFormData(prev => ({
      ...prev,
      dotacoes: { ...prev.dotacoes, [group]: code }
    }));
    setErrors(prev => ({ ...prev, [group]: '' }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.ptres_code.trim()) {
      newErrors.ptres_code = 'PTRES é obrigatório';
    }

    // Valida cada grupo de dotação
    if (elementGroups.length > 0) {
      elementGroups.forEach(group => {
        if (!formData.dotacoes[group]?.trim()) {
          newErrors[group] = `Dotação para ${ELEMENT_LABELS[group] || group} é obrigatória`;
        }
      });
    } else {
      // Modo single dropdown (fallback)
      if (!formData.dotacoes['single']?.trim()) {
        newErrors['single'] = 'Dotação é obrigatória';
      }
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
      // Compatibilidade: se só uma dotação, usar dotacao_code
      const firstDotacao = Object.values(formData.dotacoes)[0] || '';
      onSubmit({
        ...formData,
        dotacao_code: firstDotacao
      });
    }
  };

  const handleClose = () => {
    setFormData({
      ptres_code: '',
      dotacoes: {},
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

  const hasMultipleGroups = elementGroups.length > 1;
  const allDotacoesSelected = elementGroups.length === 0 
    ? !!formData.dotacoes['single']
    : elementGroups.every(g => !!formData.dotacoes[g]);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Gerar Portaria de Concessão</h3>
              <p className="text-xs text-slate-500">
                {hasMultipleGroups 
                  ? `Selecione PTRES e ${elementGroups.length} dotações por natureza`
                  : 'Selecione PTRES e dotação orçamentária'}
              </p>
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
        <form onSubmit={handleSubmit} className="px-6 py-6 max-h-[60vh] overflow-y-auto">
          {/* PTRES Dropdown */}
          <DropdownPTRES
            value={formData.ptres_code}
            onChange={(code) => {
              setFormData({ ...formData, ptres_code: code, dotacoes: {} });
              setErrors({});
            }}
            error={errors.ptres_code}
          />

          {/* Multi-Dotação: Um dropdown por grupo de natureza */}
          {elementGroups.length > 0 ? (
            <div className="space-y-4">
              {hasMultipleGroups && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-2">
                  <p className="text-xs font-bold text-amber-700 flex items-center gap-2">
                    <AlertCircle size={14} />
                    Esta solicitação possui {elementGroups.length} naturezas de despesa diferentes
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    Selecione uma dotação para cada natureza abaixo:
                  </p>
                </div>
              )}
              
              {elementGroups.map((group, index) => (
                <div key={group} className="relative">
                  {hasMultipleGroups && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
                        {index + 1}. {ELEMENT_LABELS[group] || group}
                      </span>
                      {formData.dotacoes[group] && (
                        <CheckCircle2 size={14} className="text-green-500" />
                      )}
                    </div>
                  )}
                  <DropdownDotacao
                    ptres={formData.ptres_code}
                    value={formData.dotacoes[group] || ''}
                    onChange={(code) => updateDotacao(group, code)}
                    error={errors[group]}
                  />
                </div>
              ))}
            </div>
          ) : (
            /* Fallback: Single dropdown se não tiver elementos */
            <DropdownDotacao
              ptres={formData.ptres_code}
              value={formData.dotacoes['single'] || ''}
              onChange={(code) => updateDotacao('single', code)}
              error={errors['single']}
            />
          )}

          {/* Informações Automáticas */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 mt-4">
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

              {hasMultipleGroups && (
                <div className="flex items-center justify-between pt-2 border-t border-blue-100">
                  <span className="text-xs text-slate-600 font-medium">Dotações selecionadas:</span>
                  <span className={`text-sm font-bold ${allDotacoesSelected ? 'text-green-600' : 'text-amber-600'}`}>
                    {Object.keys(formData.dotacoes).filter(k => formData.dotacoes[k]).length} / {elementGroups.length}
                  </span>
                </div>
              )}
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
              disabled={isLoading || loadingNumber || !numeroGerado || !allDotacoesSelected}
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
