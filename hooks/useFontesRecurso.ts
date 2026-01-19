import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

interface FonteRecurso {
  fonte_recurso: string;
  fonte_descricao: string;
}

/**
 * Hook para buscar fontes de recurso do orçamento
 * Usado nos modais de NE/DL/OB
 */
export const useFontesRecurso = () => {
  const { data: fontes, isLoading, error } = useQuery<FonteRecurso[]>({
    queryKey: ['fontes-recurso', 2026],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orcamento_sosfu')
        .select('fonte_recurso, fonte_descricao')
        .eq('ano', 2026)
        .not('fonte_recurso', 'is', null)
        .order('fonte_recurso');
      
      if (error) throw error;
      
      // Remover duplicadas
      const unique = data?.reduce((acc, current) => {
        const exists = acc.find(item => item.fonte_recurso === current.fonte_recurso);
        if (!exists) {
          acc.push(current);
        }
        return acc;
      }, [] as FonteRecurso[]);
      
      return unique || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  return { fontes, isLoading, error };
};
