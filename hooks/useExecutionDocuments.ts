import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface ExecutionDocument {
  id: string;
  solicitacao_id: string;
  tipo: string;
  titulo: string;
  ordem: number;
  status: 'PENDENTE' | 'GERADO' | 'ASSINADO';
  arquivo_url?: string;
  metadata?: any;
  created_at: string;
  generated_at?: string;
  assinado_em?: string;
  assinado_por?: string;
}

export function useExecutionDocuments(solicitacaoId: string) {
  const [documents, setDocuments] = useState<ExecutionDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (solicitacaoId) {
      fetchDocuments();
    }
  }, [solicitacaoId]);

  const fetchDocuments = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('execution_documents')
        .select('*')
        .eq('solicitacao_id', solicitacaoId)
        .order('ordem', { ascending: true });

      if (fetchError) throw fetchError;
      setDocuments(data || []);
    } catch (err) {
      console.error('Error fetching execution documents:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar documentos');
    } finally {
      setIsLoading(false);
    }
  };

  const generateAllDocuments = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: rpcError } = await supabase.rpc('generate_execution_documents', {
        p_solicitacao_id: solicitacaoId
      });

      if (rpcError) throw rpcError;
      
      await fetchDocuments();
      return { success: true, data };
    } catch (err) {
      console.error('Error generating documents:', err);
      setError(err instanceof Error ? err.message : 'Erro ao gerar documentos');
      return { success: false, error: err };
    } finally {
      setIsLoading(false);
    }
  };

  const sendToSEFIN = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Atualizar status da solicitação
      const { error: updateError } = await supabase
        .from('solicitacoes')
        .update({
          execution_status: 'AGUARDANDO_ASSINATURA_SEFIN',
          sefin_sent_at: new Date().toISOString()
        })
        .eq('id', solicitacaoId);

      if (updateError) throw updateError;
      
      // TODO: Criar registro de tramitação para SEFIN
      
      return { success: true };
    } catch (err) {
      console.error('Error sending to SEFIN:', err);
      setError(err instanceof Error ? err.message : 'Erro ao enviar para SEFIN');
      return { success: false, error: err };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    documents,
    isLoading,
    error,
    generateAllDocuments,
    sendToSEFIN,
    refreshDocuments: fetchDocuments
  };
}
