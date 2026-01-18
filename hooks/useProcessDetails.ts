import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

export function useProcessDetails(processId: string | null) {
  return useQuery({
    queryKey: ['process', processId],
    queryFn: async () => {
      if (!processId) return null;
      
      const { data, error } = await supabase
        .from('solicitacoes')
        .select(`
          *,
          profiles!solicitacoes_user_id_fkey (
            id,
            nome,
            matricula,
            cargo,
            lotacao,
            email
          ),
          documentos (
            id,
            nome,
            tipo,
            status,
            created_at
          )
        `)
        .eq('id', processId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!processId,
  });
}
