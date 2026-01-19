import React, { useState, useEffect } from 'react';
import { Loader2, ChevronDown } from 'lucide-react';
import { useBudgetDropdowns } from '../../../hooks/useBudgetDropdowns';
import { useFontesRecurso } from '../../../hooks/useFontesRecurso';

// ========================================
// 1. DROPDOWN PTRES
// ========================================

interface DropdownPTRESProps {
  value: string;
  onChange: (code: string) => void;
  error?: string;
}

export const DropdownPTRES: React.FC<DropdownPTRESProps> = ({ value, onChange, error }) => {
  const { ptresList, loadingPTRES, errorPTRES } = useBudgetDropdowns();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value);
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-bold text-slate-700 mb-2">
        PTRES *
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={loadingPTRES}
          className={`w-full px-4 py-2.5 pr-10 border rounded-xl
            ${error ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500'}
            ${loadingPTRES ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'}
            focus:outline-none focus:ring-2 focus:ring-opacity-50
            text-sm font-medium appearance-none`}
        >
          <option value="">Selecione o PTRES</option>
          {ptresList?.map(ptres => (
            <option key={ptres.ptres_code} value={ptres.ptres_code}>
              {ptres.ptres_code} - {ptres.ptres_description} 
              {` (Disponível: ${formatCurrency(ptres.valor_disponivel)})`}
            </option>
          ))}
        </select>
        
        <ChevronDown 
          size={18} 
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" 
        />
        
        {loadingPTRES && (
          <Loader2 size={16} className="absolute right-10 top-1/2 -translate-y-1/2 animate-spin text-blue-600" />
        )}
      </div>
      
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
      
      {errorPTRES && (
        <p className="mt-1 text-xs text-red-600">Erro ao carregar PTRES</p>
      )}
      
      <p className="mt-1 text-xs text-slate-400">
        Programa de Trabalho Resumido do orçamento
      </p>
    </div>
  );
};

// ========================================
// 2. DROPDOWN DOTAÇÃO (CASCATA)
// ========================================

interface DropdownDotacaoProps {
  ptres: string;
  value: string;
  onChange: (code: string) => void;
  error?: string;
}

export const DropdownDotacao: React.FC<DropdownDotacaoProps> = ({ 
  ptres, 
  value, 
  onChange, 
  error 
}) => {
  const { getDotacoes } = useBudgetDropdowns();
  const [dotacoes, setDotacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ptres) {
      setLoading(true);
      getDotacoes(ptres)
        .then(data => setDotacoes(data))
        .catch(err => console.error('Erro ao carregar dotações:', err))
        .finally(() => setLoading(false));
    } else {
      setDotacoes([]);
      onChange(''); // Limpar seleção quando PTRES mudar
    }
  }, [ptres, getDotacoes]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value);
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-bold text-slate-700 mb-2">
        Dotação Orçamentária *
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={!ptres || loading}
          className={`w-full px-4 py-2.5 pr-10 border rounded-xl
            ${error ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500'}
            ${!ptres || loading ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'}
            focus:outline-none focus:ring-2 focus:ring-opacity-50
            text-sm font-medium appearance-none`}
        >
          <option value="">
            {!ptres ? 'Selecione o PTRES primeiro' : 'Selecione a Dotação'}
          </option>
          {dotacoes?.map(dotacao => (
            <option key={dotacao.dotacao_code} value={dotacao.dotacao_code}>
              {dotacao.dotacao_code} - {dotacao.dotacao_description}
              {` (Disponível: ${formatCurrency(dotacao.valor_disponivel)})`}
            </option>
          ))}
        </select>
        
        <ChevronDown 
          size={18} 
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" 
        />
        
        {loading && (
          <Loader2 size={16} className="absolute right-10 top-1/2 -translate-y-1/2 animate-spin text-blue-600" />
        )}
      </div>
      
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
      
      <p className="mt-1 text-xs text-slate-400">
        Elemento de despesa orçamentária (ex: 3.3.90.39)
      </p>
    </div>
  );
};

// ========================================
// 3. DROPDOWN FONTE DE RECURSO
// ========================================

interface DropdownFonteRecursoProps {
  value: string;
  onChange: (code: string) => void;
  error?: string;
  readOnly?: boolean;
}

export const DropdownFonteRecurso: React.FC<DropdownFonteRecursoProps> = ({ 
  value, 
  onChange, 
  error,
  readOnly = false 
}) => {
  const { fontes, isLoading, error: fetchError } = useFontesRecurso();

  return (
    <div className="mb-4">
      <label className="block text-sm font-bold text-slate-700 mb-2">
        Fonte de Recurso *
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={isLoading || readOnly}
          className={`w-full px-4 py-2.5 pr-10 border rounded-xl
            ${error ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500'}
            ${isLoading || readOnly ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'}
            focus:outline-none focus:ring-2 focus:ring-opacity-50
            text-sm font-medium appearance-none`}
        >
          <option value="">Selecione a Fonte de Recurso</option>
          {fontes?.map(fonte => (
            <option key={fonte.fonte_recurso} value={fonte.fonte_recurso}>
              {fonte.fonte_recurso} - {fonte.fonte_descricao}
            </option>
          ))}
        </select>
        
        <ChevronDown 
          size={18} 
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" 
        />
        
        {isLoading && (
          <Loader2 size={16} className="absolute right-10 top-1/2 -translate-y-1/2 animate-spin text-blue-600" />
        )}
      </div>
      
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
      
      {fetchError && (
        <p className="mt-1 text-xs text-red-600">Erro ao carregar fontes</p>
      )}
      
      {readOnly && (
        <p className="mt-1 text-xs text-amber-600 flex items-center gap-1">
          <span>⚠️</span> Fonte herdada da Nota de Empenho (não editável)
        </p>
      )}
      
      <p className="mt-1 text-xs text-slate-400">
        Código de 6 dígitos da fonte de recurso (ex: 040102)
      </p>
    </div>
  );
};
