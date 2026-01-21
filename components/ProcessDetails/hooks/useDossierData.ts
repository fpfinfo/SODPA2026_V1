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

interface UseDossierDataProps {
  processId: string;
  currentUserId: string;
}

export const useDossierData = ({ processId, currentUserId }: UseDossierDataProps) => {
  const [dossierDocs, setDossierDocs] = useState<DossierDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch documents
  const fetchDocs = async () => {
    if (!processId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('documentos')
        .select('*, profiles:created_by(nome, cargo)')
        .eq('solicitacao_id', processId)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;
      
      setDossierDocs(data || []);
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
        (payload) => {
          console.log('Real-time change detected:', payload);
          
          // Refresh documents on any change (INSERT, UPDATE, DELETE)
          fetchDocs();
        }
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
    isLoading,
    error,
    refreshDocs: fetchDocs,
    addDocument,
    updateDocument,
    deleteDocument,
  };
};
