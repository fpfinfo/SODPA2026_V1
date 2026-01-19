/**
 * useDocumentData Hook
 * Fetches complete document data including related solicitation for SEFIN preview
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface DocumentData {
  id: string;
  tipo: string;
  titulo: string;
  conteudo?: string;
  status: string;
  created_at: string;
  metadata: any;
  
  // Related solicitation data
  solicitacao?: {
    id: string;
    nup: string;
    tipo: string;
    valor_total: number;
    valor_solicitado: number;
    descricao: string;
    status: string;
    created_at: string;
    suprido_nome?: string;
    suprido_cargo?: string;
    suprido_cpf?: string;
    suprido_email?: string;
    lotacao?: string;
    comarca?: string;
    gestor_nome?: string;
    gestor_email?: string;
    itens_despesa?: any[];
    dados_bancarios?: {
      banco: string;
      agencia: string;
      conta: string;
    };
  };
}

interface UseDocumentDataReturn {
  document: DocumentData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDocumentData(
  documentId?: string,
  solicitacaoId?: string
): UseDocumentDataReturn {
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!documentId && !solicitacaoId) {
      setDocument(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let docData: any = null;
      let solData: any = null;

      // 1. Try to fetch from execution_documents first (if documentId)
      if (documentId) {
        const { data: execDoc, error: execError } = await supabase
          .from('execution_documents')
          .select('*')
          .eq('id', documentId)
          .maybeSingle();

        if (!execError && execDoc) {
          docData = execDoc;
          solicitacaoId = execDoc.solicitacao_id;
        }
      }

      // 2. Fetch related solicitation with full details
      if (solicitacaoId) {
        const { data: sol, error: solError } = await supabase
          .from('solicitacoes')
          .select(`
            *,
            profiles:user_id (
              nome,
              cargo,
              email,
              cpf,
              banco,
              agencia,
              conta_corrente,
              gestor_nome,
              gestor_email
            )
          `)
          .eq('id', solicitacaoId)
          .maybeSingle();

        if (!solError && sol) {
          const profile = sol.profiles as any;
          
          // Try to get lotacao from servidores_tj
          let lotacao = null;
          if (profile?.email) {
            const { data: servidor } = await supabase
              .from('servidores_tj')
              .select('lotacao, cargo, banco, agencia, conta_corrente, cpf')
              .eq('email', profile.email)
              .maybeSingle();
            
            if (servidor) {
              lotacao = servidor.lotacao;
            }
          }

          solData = {
            id: sol.id,
            nup: sol.nup,
            tipo: sol.tipo,
            valor_total: sol.valor_total || sol.valor_solicitado,
            valor_solicitado: sol.valor_solicitado,
            descricao: sol.descricao,
            status: sol.status,
            created_at: sol.created_at,
            suprido_nome: profile?.nome,
            suprido_cargo: profile?.cargo,
            suprido_cpf: profile?.cpf,
            suprido_email: profile?.email,
            lotacao: lotacao,
            gestor_nome: profile?.gestor_nome,
            gestor_email: profile?.gestor_email,
            itens_despesa: sol.itens_despesa,
            dados_bancarios: profile?.banco ? {
              banco: profile.banco,
              agencia: profile.agencia,
              conta: profile.conta_corrente,
            } : sol.dados_bancarios,
          };
        }
      }

      // 3. Build final document data
      if (docData || solData) {
        setDocument({
          id: docData?.id || solicitacaoId || '',
          tipo: docData?.tipo || 'PORTARIA',
          titulo: docData?.titulo || `Documento ${solData?.nup || ''}`,
          conteudo: docData?.conteudo,
          status: docData?.status || 'PENDENTE',
          created_at: docData?.created_at || solData?.created_at || new Date().toISOString(),
          metadata: docData?.metadata || {},
          solicitacao: solData,
        });
      } else {
        setDocument(null);
      }
    } catch (err: any) {
      console.error('Error fetching document data:', err);
      setError(err.message || 'Erro ao carregar dados do documento');
    } finally {
      setIsLoading(false);
    }
  }, [documentId, solicitacaoId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    document,
    isLoading,
    error,
    refetch: fetchData,
  };
}
