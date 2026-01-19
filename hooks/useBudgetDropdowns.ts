import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

interface PTRES {
  ptres_code: string;
  ptres_description: string;
  valor_disponivel: number;
}

interface Dotacao {
  dotacao_code: string;
  dotacao_description: string;
  valor_disponivel: number;
}

/**
 * Hook para gerenciar dropdowns de PTRES e Dotação Orçamentária
 * Usado no modal de Portaria
 */
export const useBudgetDropdowns = () => {
  const ano = new Date().getFullYear();

  // Buscar lista de PTRES
  const { data: ptresList, isLoading: loadingPTRES, error: errorPTRES } = useQuery<PTRES[]>({
    queryKey: ['budget-ptres', ano],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orcamento_sosfu')
        .select('ptres_code, ptres_description, valor_disponivel')
        .eq('ano', ano)
        .not('ptres_code', 'is', null)
        .order('ptres_code');
      
      if (error) throw error;
      
      // Agrupar por PTRES e somar valores
      const grouped = (data || []).reduce((acc, current) => {
        const existing = acc.find(item => item.ptres_code === current.ptres_code);
        if (existing) {
          existing.valor_disponivel += current.valor_disponivel;
        } else {
          acc.push({ ...current });
        }
        return acc;
      }, [] as PTRES[]);
      
      return grouped;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Função para buscar dotações de um PTRES específico
  const getDotacoes = async (ptresCode: string): Promise<Dotacao[]> => {
    if (!ptresCode) return [];
    
    const { data, error } = await supabase
      .from('orcamento_sosfu')
      .select('dotacao_code, dotacao_description, valor_disponivel')
      .eq('ano', ano)
      .eq('ptres_code', ptresCode)
      .not('dotacao_code', 'is', null)
      .order('dotacao_code');
    
    if (error) throw error;
    return data || [];
  };

  return { 
    ptresList, 
    loadingPTRES, 
    errorPTRES,
    getDotacoes 
  };
};
