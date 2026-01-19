import { useQuery } from '@tanstack/react-query';
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
        .select('ptres, descricao, teto_anual, executado')
        .eq('ano', ano)
        .not('ptres', 'is', null)
        .order('ptres');
      
      if (error) {
        console.error('Erro ao buscar PTRES:', error);
        throw error;
      }
      
      // Mapear para formato esperado
      const mapped = (data || []).map(item => ({
        ptres_code: item.ptres,
        ptres_description: item.descricao,
        valor_disponivel: Number(item.teto_anual) - Number(item.executado)
      }));
      
      // Agrupar por PTRES e somar valores
      const grouped = mapped.reduce((acc, current) => {
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
      .select('dotacao, dotacao_descricao, teto_anual, executado')
      .eq('ano', ano)
      .eq('ptres', ptresCode)
      .not('dotacao', 'is', null)
      .order('dotacao');
    
    if (error) {
      console.error('Erro ao buscar dotações:', error);
      throw error;
    }
    
    // Mapear para formato esperado
    const mapped = (data || []).map(item => ({
      dotacao_code: item.dotacao,
      dotacao_description: item.dotacao_descricao,
      valor_disponivel: Number(item.teto_anual) - Number(item.executado)
    }));
    
    return mapped;
  };

  return { 
    ptresList, 
    loadingPTRES, 
    errorPTRES,
    getDotacoes 
  };
};
