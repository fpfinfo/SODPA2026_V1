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
  signed_at?: string;
  signed_by?: string;
  solicitacao_id: string;
  metadata?: any;
  file_url?: string; // For external PDF documents
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
  prestacaoId?: string; // Add explicit ID support
}

export const useDossierData = ({ processId, currentUserId, prestacaoId }: UseDossierDataProps) => {
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

      // 2. Fetch prestação de contas
      // If prestacaoId is provided, use it. Otherwise, fetch by solicitacao_id (risky if multiple exist)
      let query = supabase
        .from('prestacao_contas')
        .select('*');
      
      if (prestacaoId) {
        query = query.eq('id', prestacaoId);
      } else {
        query = query.eq('solicitacao_id', processId);
      }

      const { data: pcData, error: pcError } = await query.maybeSingle();

      if (pcError && pcError.code !== 'PGRST116') throw pcError;
      setPrestacaoData(pcData || null);

      // 3. Fetch comprovantes if PC exists
      let virtualDocs: DossierDocument[] = [];
      
      if (pcData) {
        const { data: compData, error: compError } = await supabase
          .from('comprovantes_pc')
          .select('*')
          .eq('prestacao_id', pcData.id)
          .order('created_at', { ascending: true });

        if (compError) throw compError;
        setComprovantesPC(compData || []);

        // Transform Comprovantes to DossierDocs
        const receiptDocs = (compData || []).map((c: any) => ({
          id: c.id,
          nome: c.file_name || `Comprovante ${c.tipo}`,
          titulo: `${c.tipo} - ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c.valor)}`,
          tipo: 'COMPROVANTE_DESPESA',
          status: 'ANEXADO',
          conteudo: c.descricao || `Despesa com ${c.elemento_despesa}`,
          created_by: 'SUPRIDO', // Inferred
          created_at: c.created_at,
          solicitacao_id: processId,
          file_url: c.storage_url, // IMPORTANT: Use storage_url for the viewer
          metadata: {
            elemento: c.elemento_despesa,
            valor: c.valor
          }
        }));

        // Transform GDRs to DossierDocs
        const gdrDocs = [];
        
        if (pcData.gdr_inss_arquivo_url) {
          gdrDocs.push({
            id: `gdr-inss-${pcData.id}`,
            nome: 'GDR INSS.pdf',
            titulo: 'GDR - Recolhimento INSS',
            tipo: 'GDR',
            status: 'PAGO',
            conteudo: `Guia de Recolhimento INSS - Nº ${pcData.gdr_inss_numero}`,
            created_by: 'SUPRIDO',
            created_at: pcData.updated_at || pcData.created_at, // Use update time as proxy for upload
            solicitacao_id: processId,
            file_url: pcData.gdr_inss_arquivo_url,
            metadata: {
              valor: pcData.gdr_inss_valor,
              numero: pcData.gdr_inss_numero
            }
          });
        }

        if (pcData.gdr_saldo_arquivo_url) {
          gdrDocs.push({
            id: `gdr-saldo-${pcData.id}`,
            nome: 'GDR Devolução.pdf',
            titulo: 'GDR - Devolução de Saldo',
            tipo: 'GDR',
            status: 'PAGO',
            conteudo: `Guia de Devolução de Saldo - Nº ${pcData.gdr_saldo_numero}`,
            created_by: 'SUPRIDO',
            created_at: pcData.updated_at || pcData.created_at,
            solicitacao_id: processId,
            file_url: pcData.gdr_saldo_arquivo_url,
            metadata: {
              valor: pcData.gdr_saldo_valor,
              numero: pcData.gdr_saldo_numero
            }
          });
        }

        virtualDocs = [...receiptDocs, ...gdrDocs];
      } else {
        setComprovantesPC([]);
      }

      // Merge and Sort
      const allDocs = [...(docsData || []), ...virtualDocs].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      setDossierDocs(allDocs);

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
      
      if (!docToDelete) {
        throw new Error('Documento não encontrado na lista local');
      }

      await supabase.from('historico_documentos').insert({
        documento_id: docId,
        acao: 'DELETE',
        usuario_id: currentUserId,
        dados_anteriores: docToDelete,
      });

      // Special handling for CERTIDAO_ATESTO deletion
      if (docToDelete.tipo === 'CERTIDAO_ATESTO' || docToDelete.tipo === 'ATESTO') {
        // Revert process status to PENDENTE_ATESTO
        const { error: updateError } = await supabase
          .from('solicitacoes')
          .update({ status: 'PENDENTE_ATESTO' })
          .eq('id', processId);

        if (updateError) {
          console.error('Error reverting process status:', updateError);
          // We continue with deletion even if status update fails, but ideally we should warn
        }
      }

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
