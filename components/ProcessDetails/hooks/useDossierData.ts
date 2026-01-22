import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';

export interface DossierDocument {
  id: string;
  nome: string;
  titulo?: string;
  tipo: string;
  status: string;
  conteudo?: string;
  created_by: string;
  created_at: string;
  updated_at?: string;
  solicitacao_id: string;
  metadata?: any;
  profiles?: {
    nome: string;
    cargo: string;
  };
}

export interface PrestacaoContasData {
  id: string;
  solicitacao_id: string;
  status: string;
  valor_concedido: number;
  valor_gasto: number;
  valor_devolvido: number;
  total_inss_retido?: number;
  total_iss_retido?: number;
  gdr_inss_numero?: string;
  gdr_inss_paga?: boolean;
  gdr_inss_valor?: number;
  gdr_saldo_numero?: string;
  gdr_saldo_paga?: boolean;
  gdr_saldo_valor?: number;
  submitted_at?: string;
  created_at: string;
}

export interface ComprovantePC {
  id: string;
  prestacao_id: string;
  tipo: string;
  numero?: string;
  emitente: string;
  cnpj_cpf?: string;
  valor: number;
  data_emissao: string;
  descricao?: string;
  elemento_despesa: string;
  file_path: string;
  file_name: string;
  storage_url?: string;
  created_at: string;
}

interface UseDossierDataProps {
  processId: string;
  currentUserId: string;
}

export const useDossierData = ({ processId, currentUserId }: UseDossierDataProps) => {
  const [dossierDocs, setDossierDocs] = useState<DossierDocument[]>([]);
  const [prestacaoData, setPrestacaoData] = useState<PrestacaoContasData | null>(null);
  const [comprovantesPC, setComprovantesPC] = useState<ComprovantePC[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all dossier data
  const fetchDocs = async () => {
    if (!processId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // 1. Fetch documentos
      const { data: docsData, error: fetchError } = await supabase
        .from('documentos')
        .select('*, profiles:created_by(nome, cargo)')
        .eq('solicitacao_id', processId)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;
      setDossierDocs(docsData || []);

      // 2. Fetch prestação de contas
      const { data: pcData, error: pcError } = await supabase
        .from('prestacao_contas')
        .select('*')
        .eq('solicitacao_id', processId)
        .maybeSingle();

      if (pcError && pcError.code !== 'PGRST116') throw pcError;
      setPrestacaoData(pcData || null);

      // 3. Fetch comprovantes if PC exists
      if (pcData) {
        const { data: compData, error: compError } = await supabase
          .from('comprovantes_pc')
          .select('*')
          .eq('prestacao_id', pcData.id)
          .order('created_at', { ascending: true });

        if (compError) throw compError;
        setComprovantesPC(compData || []);
      } else {
        setComprovantesPC([]);
      }

    } catch (err) {
      console.error('Error fetching dossier docs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch documents');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchDocs();
  }, [processId]);

  // Real-time subscription for live updates
  useEffect(() => {
    if (!processId) return;

    const channel = supabase
      .channel(`dossier:${processId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documentos',
          filter: `solicitacao_id=eq.${processId}`,
        },
        () => fetchDocs()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'prestacao_contas',
          filter: `solicitacao_id=eq.${processId}`,
        },
        () => fetchDocs()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [processId]);

  // CRUD operations
  const addDocument = async (doc: Partial<DossierDocument>) => {
    try {
      const { data, error } = await supabase
        .from('documentos')
        .insert({
          ...doc,
          solicitacao_id: processId,
          created_by: currentUserId,
        })
        .select('*, profiles:created_by(nome, cargo)')
        .single();

      if (error) throw error;
      
      return { success: true, data };
    } catch (err) {
      console.error('Error adding document:', err);
      return { success: false, error: err };
    }
  };

  const updateDocument = async (docId: string, updates: Partial<DossierDocument>) => {
    try {
      const { data, error } = await supabase
        .from('documentos')
        .update(updates)
        .eq('id', docId)
        .select('*, profiles:created_by(nome, cargo)')
        .single();

      if (error) throw error;
      
      return { success: true, data };
    } catch (err) {
      console.error('Error updating document:', err);
      return { success: false, error: err };
    }
  };

  const deleteDocument = async (docId: string) => {
    try {
      // Log to audit trail
      const docToDelete = dossierDocs.find(d => d.id === docId);
      
      await supabase.from('historico_documentos').insert({
        documento_id: docId,
        acao: 'DELETE',
        usuario_id: currentUserId,
        dados_anteriores: docToDelete,
      });

      // Delete the document
      const { error } = await supabase
        .from('documentos')
        .delete()
        .eq('id', docId);

      if (error) throw error;
      
      return { success: true };
    } catch (err) {
      console.error('Error deleting document:', err);
      return { success: false, error: err };
    }
  };

  return {
    dossierDocs,
    prestacaoData,
    comprovantesPC,
    isLoading,
    error,
    refreshDocs: fetchDocs,
    addDocument,
    updateDocument,
    deleteDocument,
  };
};
