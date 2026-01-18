import React, { useState, useMemo, useEffect } from 'react';
import { X, FileText, AlertCircle, Calendar, Loader2 } from 'lucide-react';
import { usePTRESList } from '../../../hooks/usePTRESList';
import { useDotacoes } from '../../../hooks/useDotacoes';

interface PortariaFormData {
  ptres: string;
  dotacoes: string[];
  data_inicio: string;
  data_fim: string;
  prazo_prestacao: string;
}

interface PortariaFormModalProps {
  processData?: {
    id: string;
    data_final_execucao?: string;
  };
  onSubmit: (data: PortariaFormData) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export const PortariaFormModal: React.FC<PortariaFormModalProps> = ({ 
  processData,
  onSubmit, 
  onClose, 
  isLoading: isSubmitting = false 
}) => {
  // Fetch PTRES list
  const { ptresList, isLoading: isLoadingPTRES } = usePTRESList();
  
  // Selected PTRES
  const [selectedPTRES, setSelectedPTRES] = useState<string>('');
  
  // Fetch dotações based on selected PTRES
  const { dotacoes, isLoading: isLoadingDotacoes } = useDotacoes(selectedPTRES || null);
  
  // Selected dotações (multi-select)
  const [selectedDotacoes, setSelectedDotacoes] = useState<string[]>([]);
  
  // Datas
  const hoje = new Date().toISOString().split('T')[0];
  const [dataInicio, setDataInicio] = useState(hoje);
  const [dataFim, setDataFim] = useState(processData?.data_final_execucao || '');
  
  // Auto-fill data fim when processData changes
  useEffect(() => {
    if (processData?.data_final_execucao) {
      setDataFim(processData.data_final_execucao);
    }
  }, [processData]);
  
  // Calculate prazo prestação (data fim + 7 days)
  const prazoPrestacao = useMemo(() => {
    if (!dataFim) return '';
    
    const fim = new Date(dataFim);
    fim.setDate(fim.getDate() + 7);
    return fim.toISOString().split('T')[0];
  }, [dataFim]);

  const [errors, setErrors] = useState<Partial<Record<keyof PortariaFormData, string>>>({});

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof PortariaFormData, string>> = {};

    if (!selectedPTRES) {
      newErrors.ptres = 'PTRES é obrigatório';
    }

    if (selectedDotacoes.length === 0) {
      newErrors.dotacoes = 'Selecione pelo menos uma dotação';
    }

    if (!dataInicio) {
      newErrors.data_inicio = 'Data de início é obrigatória';
    }

    if (!dataFim) {
      newErrors.data_fim = 'Data de fim é obrigatória';
    }

    if (dataInicio && dataFim && dataInicio > dataFim) {
      newErrors.data_fim = 'Data de fim deve ser posterior à data de início';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        ptres: selectedPTRES,
        dotacoes: selectedDotacoes,
        data_inicio: dataInicio,
        data_fim: dataFim,
        prazo_prestacao: prazoPrestacao
      });
    }
  };
  
  const handleDotacaoToggle = (codigo: string) => {
    setSelectedDotacoes(prev => 
      prev.includes(codigo)
        ? prev.filter(c => c !== codigo)
        : [...prev, codigo]
    );
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
        {/* Header */}
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between z-10">
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
          {/* PTRES Dropdown */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              PTRES <span className="text-red-500">*</span>
            </label>
            {isLoadingPTRES ? (
              <div className="flex items-center gap-2 text-slate-500 py-3">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Carregando PTRES...</span>
              </div>
            ) : (
              <select
                value={selectedPTRES}
                onChange={(e) => {
                  setSelectedPTRES(e.target.value);
                  setSelectedDotacoes([]); // Reset dotações when PTRES changes
                }}
                className={`w-full px-4 py-3 rounded-xl border-2 ${
                  errors.ptres 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-slate-200 bg-white'
                } focus:border-blue-500 focus:outline-none transition-colors`}
              >
                <option value="">Selecione o PTRES</option>
                {ptresList.map(p => (
                  <option key={p.ptres} value={p.ptres}>
                    {p.ptres} - {p.programa_trabalho}
                  </option>
                ))}
              </select>
            )}
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

          {/* Dotações Multi-select */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Dotações Orçamentárias <span className="text-red-500">*</span>
            </label>
            {!selectedPTRES ? (
              <div className="px-4 py-8 bg-slate-50 rounded-xl border-2 border-slate-200 text-center">
                <p className="text-sm text-slate-500">Selecione um PTRES primeiro</p>
              </div>
            ) : isLoadingDotacoes ? (
              <div className="flex items-center gap-2 text-slate-500 py-3">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Carregando dotações...</span>
              </div>
            ) : dotacoes.length === 0 ? (
              <div className="px-4 py-8 bg-amber-50 rounded-xl border-2 border-amber-200 text-center">
                <p className="text-sm text-amber-700">Nenhuma dotação disponível para este PTRES</p>
              </div>
            ) : (
              <div className={`border-2 rounded-xl ${
                errors.dotacoes ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'
              }`}>
                <div className="max-h-48 overflow-y-auto p-2">
                  {dotacoes.map((dot) => (
                    <label
                      key={dot.codigo}
                      className="flex items-start gap-3 p-3 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDotacoes.includes(dot.codigo)}
                        onChange={() => handleDotacaoToggle(dot.codigo)}
                        className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-700">{dot.codigo}</p>
                        <p className="text-xs text-slate-500">{dot.descricao}</p>
                        {dot.saldo !== undefined && (
                          <p className="text-xs text-emerald-600 mt-1">
                            Saldo: R$ {dot.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
                {selectedDotacoes.length > 0 && (
                  <div className="px-3 py-2 bg-blue-50 border-t border-blue-100">
                    <p className="text-xs font-bold text-blue-700">
                      {selectedDotacoes.length} dotação(ões) selecionada(s)
                    </p>
                  </div>
                )}
              </div>
            )}
            {errors.dotacoes && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.dotacoes}
              </p>
            )}
          </div>

          {/* Período de Execução */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Início da Execução <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
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
              <p className="mt-2 text-xs text-slate-500">
                Data de emissão da Portaria (hoje)
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Fim da Execução <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
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
              <p className="mt-2 text-xs text-slate-500">
                Da solicitação do suprido
              </p>
            </div>
          </div>

          {/* Prazo de Prestação (auto-calculated) */}
          {prazoPrestacao && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-blue-900">
                    Prazo de Prestação de Contas
                  </p>
                  <p className="text-lg font-black text-blue-700 mt-1">
                    {new Date(prazoPrestacao).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Calculado automaticamente (Data Final + 7 dias)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-400 text-slate-700 rounded-xl font-bold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-bold transition-colors shadow-lg flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
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
