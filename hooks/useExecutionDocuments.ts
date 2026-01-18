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

  const generateWithFormData = async (tipo: string, formData: any) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Criar documento de execução com form_data
      const { data: docData, error: insertError } = await supabase
        .from('execution_documents')
        .insert({
          solicitacao_id: solicitacaoId,
          tipo,
          titulo: getTituloByTipo(tipo),
          ordem: getOrdemByTipo(tipo),
          status: 'GERADO',
          generated_at: new Date().toISOString(),
          metadata: { form_data: formData }
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Criar entrada no dossiê digital
      await linkToDossier(docData);

      await fetchDocuments();
      return { success: true, data: docData };
    } catch (err) {
      console.error('Error generating document with form:', err);
      setError(err instanceof Error ? err.message : 'Erro ao gerar documento');
      return { success: false, error: err };
    } finally {
      setIsLoading(false);
    }
  };

  const generateSingle = async (tipo: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: docData, error: insertError } = await supabase
        .from('execution_documents')
        .insert({
          solicitacao_id: solicitacaoId,
          tipo,
          titulo: getTituloByTipo(tipo),
          ordem: getOrdemByTipo(tipo),
          status: 'GERADO',
          generated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Criar entrada no dossiê digital
      await linkToDossier(docData);

      await fetchDocuments();
      return { success: true, data: docData };
    } catch (err) {
      console.error('Error generating single document:', err);
      setError(err instanceof Error ? err.message : 'Erro ao gerar documento');
      return { success: false, error: err };
    } finally {
      setIsLoading(false);
    }
  };

  const linkToDossier = async (executionDoc: any) => {
    try {
      // Criar entrada na tabela documentos para aparecer no dossiê
      const { error: dossierError } = await supabase
        .from('documentos')
        .insert({
          solicitacao_id: solicitacaoId,
          tipo: executionDoc.tipo,
          titulo: executionDoc.titulo,
          arquivo_url: executionDoc.arquivo_url,
          metadata: {
            execution_document_id: executionDoc.id,
            is_execution_document: true,
            ...executionDoc.metadata
          }
        });

      if (dossierError) {
        console.error('Error linking to dossier:', dossierError);
        // Não falhar se der erro no dossiê, apenas logar
      }
    } catch (err) {
      console.error('Error in linkToDossier:', err);
    }
  };

  return {
    documents,
    isLoading,
    error,
    generateAllDocuments,
    generateWithFormData,
    generateSingle,
    sendToSEFIN,
    refreshDocuments: fetchDocuments
  };
}

// Helper functions
function getTituloByTipo(tipo: string): string {
  const map: { [key: string]: string } = {
    'PORTARIA': 'Portaria de Concessão',
    'CERTIDAO_REGULARIDADE': 'Certidão de Regularidade',
    'NOTA_EMPENHO': 'Nota de Empenho',
    'NOTA_LIQUIDACAO': 'Nota de Liquidação',
    'ORDEM_BANCARIA': 'Ordem Bancária'
  };
  return map[tipo] || tipo;
}

function getOrdemByTipo(tipo: string): number {
  const map: { [key: string]: number } = {
    'PORTARIA': 1,
    'CERTIDAO_REGULARIDADE': 2,
    'NOTA_EMPENHO': 3,
    'NOTA_LIQUIDACAO': 4,
    'ORDEM_BANCARIA': 5
  };
  return map[tipo] || 999;
}
