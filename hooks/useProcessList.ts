import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

export interface ProcessListFilters {
  status?: string;
  destinoAtual?: string;
  userId?: string;
}

export function useProcessList(filters: ProcessListFilters = {}) {
  return useQuery({
    queryKey: ['processes', filters],
    queryFn: async () => {
      let query = supabase
        .from('solicitacoes')
        .select(`
          id,
          nup,
          tipo,
          valor_solicitado,
          status,
          destino_atual,
          created_at,
          profiles!solicitacoes_user_id_fkey (
            id,
            nome
          )
        `)
        .order('created_at', { ascending: false });

      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.destinoAtual) {
        query = query.eq('destino_atual', filters.destinoAtual);
      }
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30 * 1000,
  });
}
