import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

export function useDocuments(solicitacaoId: string | null) {
  return useQuery({
    queryKey: ['documents', solicitacaoId],
    queryFn: async () => {
      if (!solicitacaoId) return [];
      
      const { data, error } = await supabase
        .from('documentos')
        .select('*')
        .eq('solicitacao_id', solicitacaoId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!solicitacaoId,
  });
}

interface CreateDocumentInput {
  solicitacao_id: string;
  nome: string;
  tipo: string;
  conteudo?: string;
  created_by?: string;
}

export function useCreateDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (document: CreateDocumentInput) => {
      const { data, error } = await supabase
        .from('documentos')
        .insert(document)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ['documents', data.solicitacao_id] 
      });
      // Also invalidate process details to refresh document count
      queryClient.invalidateQueries({ 
        queryKey: ['process'] 
      });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, solicitacaoId }: { id: string; solicitacaoId: string }) => {
      const { error } = await supabase
        .from('documentos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, solicitacaoId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ['documents', data.solicitacaoId] 
      });
    },
  });
}
