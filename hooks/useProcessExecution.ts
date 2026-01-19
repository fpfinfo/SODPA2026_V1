import { useEffect, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useToast } from '../components/ui/ToastProvider';

export interface ExecutionDocument {
  id: string;
  solicitacao_id: string;
  tipo: 'PORTARIA' | 'CERTIDAO_REGULARIDADE' | 'NOTA_EMPENHO' | 'NOTA_LIQUIDACAO' | 'ORDEM_BANCARIA';
  titulo: string;
  ordem: number;
  status: 'PENDENTE' | 'GERADO' | 'ASSINADO';
  arquivo_url?: string;
  metadata?: any;
  fonte_recurso?: string;
  created_at: string;
  generated_at?: string;
  created_by?: string;
}

export interface ExecutionState {
  portaria: ExecutionDocument | null;
  certidao: ExecutionDocument | null;
  ne: ExecutionDocument | null;
  dl: ExecutionDocument | null;
  ob: ExecutionDocument | null;
}

/**
 * Hook robusto para gerenciar execução da despesa
 * - React Query para cache inteligente
 * - Mutations com invalidação automática
 * - Logs detalhados para debug
 * - Tratamento de erros explícito
 */
export function useProcessExecution(solicitacaoId: string) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [state, setState] = useState<ExecutionState>({
    portaria: null,
    certidao: null,
    ne: null,
    dl: null,
    ob: null
  });

  // ========================================
  // QUERY: Buscar documentos
  // ========================================
  const { 
    data: documents = [], 
    isLoading, 
    error,
    refetch
  } = useQuery({
    queryKey: ['execution-documents', solicitacaoId],
    queryFn: async () => {
      console.log('🔍 [useProcessExecution] Buscando documentos para:', solicitacaoId);
      
      const { data, error } = await supabase
        .from('execution_documents')
        .select('*')
        .eq('solicitacao_id', solicitacaoId)
        .order('ordem');

      if (error) {
        console.error('❌ [useProcessExecution] Erro ao buscar documentos:', error);
        throw error;
      }

      console.log(`✅ [useProcessExecution] ${data?.length || 0} documentos carregados`);
      console.table(data?.map(d => ({ tipo: d.tipo, status: d.status, created_at: d.created_at })));
      
      return data as ExecutionDocument[];
    },
    enabled: !!solicitacaoId,
    staleTime: 0, // Sempre considerar dados stale
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 2
  });

  // ========================================
  // REALTIME: Subscription
  // ========================================
  useEffect(() => {
    if (!solicitacaoId) return;

    console.log('🔄 [useProcessExecution] Iniciando subscription realtime');

    const channel = supabase
      .channel(`execution-${solicitacaoId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'execution_documents',
          filter: `solicitacao_id=eq.${solicitacaoId}`
        },
        (payload) => {
          console.log('⚡ [Realtime] Evento recebido:', payload.eventType, payload.new);
          
          // Invalidar cache para forçar refetch
          queryClient.invalidateQueries({ 
            queryKey: ['execution-documents', solicitacaoId] 
          });
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 [useProcessExecution] Cancelando subscription');
      supabase.removeChannel(channel);
    };
  }, [solicitacaoId, queryClient]);

  // ========================================
  // STATE: Mapear array para objeto
  // ========================================
  useEffect(() => {
    const newState: ExecutionState = {
      portaria: documents.find(d => d.tipo === 'PORTARIA') || null,
      certidao: documents.find(d => d.tipo === 'CERTIDAO_REGULARIDADE') || null,
      ne: documents.find(d => d.tipo === 'NOTA_EMPENHO') || null,
      dl: documents.find(d => d.tipo === 'NOTA_LIQUIDACAO') || null,
      ob: documents.find(d => d.tipo === 'ORDEM_BANCARIA') || null
    };

    console.log('📊 [Estado] Mapeamento atualizado:', {
      portaria: newState.portaria?.status || 'PENDENTE',
      certidao: newState.certidao?.status || 'PENDENTE',
      ne: newState.ne?.status || 'PENDENTE',
      dl: newState.dl?.status || 'PENDENTE',
      ob: newState.ob?.status || 'PENDENTE'
    });

    setState(newState);
  }, [documents]);

  // ========================================
  // MUTATION: Gerar documento
  // ========================================
  const generateDocumentMutation = useMutation({
    mutationFn: async ({ tipo, formData }: { tipo: string; formData?: any }) => {
      console.log(`📝 [Mutation] Gerando documento: ${tipo}`);
      console.log('📋 [Mutation] Form data:', formData);

      // Criar documento
      const { data, error } = await supabase
        .from('execution_documents')
        .insert({
          solicitacao_id: solicitacaoId,
          tipo,
          titulo: getTituloByTipo(tipo),
          ordem: getOrdemByTipo(tipo),
          status: 'GERADO',
          generated_at: new Date().toISOString(),
          metadata: formData ? { form_data: formData } : {},
          fonte_recurso: formData?.fonte_recurso || null,
          ptres_code: formData?.ptres_code || null,
          dotacao_code: formData?.dotacao_code || null
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ [Mutation] Erro ao gerar ${tipo}:`, error);
        throw error;
      }

      console.log(`✅ [Mutation] ${tipo} gerado com sucesso:`, data);

      // Criar entrada no dossiê
      try {
        await linkToDossier(data);
        console.log('📁 [Dossiê] Documento vinculado ao dossiê');
      } catch (dossierError) {
        console.warn('⚠️ [Dossiê] Erro ao vincular (não crítico):', dossierError);
      }

      return data;
    },
    onSuccess: (data, variables) => {
      console.log(`🎉 [Mutation Success] ${variables.tipo} criado!`);
      
      // Invalidar cache para forçar refetch
      queryClient.invalidateQueries({ 
        queryKey: ['execution-documents', solicitacaoId] 
      });

      // Refetch explícito para garantir
      refetch();

      showToast({
        title: 'Documento gerado',
        message: `${data.titulo} criado com sucesso`,
        type: 'success'
      });
    },
    onError: (error: any, variables) => {
      console.error(`❌ [Mutation Error] Falha ao gerar ${variables.tipo}:`, error);
      
      showToast({
        title: 'Erro ao gerar documento',
        message: error.message || 'Verifique as permissões e tente novamente',
        type: 'error'
      });
    }
  });

  // ========================================
  // MUTATION: Enviar para SEFIN
  // ========================================
  const sendToSEFINMutation = useMutation({
    mutationFn: async () => {
      console.log('📤 [SEFIN] Enviando para SEFIN...');

      // 1. Atualizar status da solicitação
      const { error: updateError } = await supabase
        .from('solicitacoes')
        .update({
          execution_status: 'AGUARDANDO_ASSINATURA_SEFIN',
          sefin_sent_at: new Date().toISOString()
        })
        .eq('id', solicitacaoId);

      if (updateError) {
        console.error('❌ [SEFIN] Erro ao atualizar solicitação:', updateError);
        throw updateError;
      }

      // 2. Criar tramitação
      const { error: tramitError } = await supabase
        .from('historico_tramitacao')
        .insert({
          solicitacao_id: solicitacaoId,
          origem: 'SUPRIDO',
          destino: 'SEFIN',
          status_anterior: 'EM ANÁLISE SOSFU',
          status_novo: 'AGUARDANDO ASSINATURA SEFIN',
          observacao: 'Documentos de execução enviados para assinatura (Portaria, Certidão, NE)',
          created_at: new Date().toISOString()
        });

      if (tramitError) {
        console.error('❌ [SEFIN] Erro ao criar tramitação:', tramitError);
        throw tramitError;
      }

      console.log('✅ [SEFIN] Processo enviado com sucesso!');
    },
    onSuccess: () => {
      showToast({
        title: 'Enviado para SEFIN',
        message: 'Documentos enviados para assinatura com sucesso',
        type: 'success'
      });
    },
    onError: (error: any) => {
      console.error('❌ [SEFIN] Erro:', error);
      showToast({
        title: 'Erro ao enviar para SEFIN',
        message: error.message,
        type: 'error'
      });
    }
  });

  // ========================================
  // HELPER: Vincular ao dossiê
  // ========================================
  const linkToDossier = async (doc: ExecutionDocument) => {
    await supabase.from('documentos').insert({
      solicitacao_id: solicitacaoId,
      tipo: doc.tipo,
      titulo: doc.titulo,
      arquivo_url: doc.arquivo_url,
      metadata: {
        execution_document_id: doc.id,
        is_execution_document: true,
        ...doc.metadata
      }
    });
  };

  // ========================================
  // VALIDAÇÕES DE FLUXO
  // ========================================
  const canGeneratePortaria = true;
  const canGenerateCertidao = 
    state.portaria?.status === 'GERADO' || state.portaria?.status === 'ASSINADO';
  const canGenerateNE = 
    state.certidao?.status === 'GERADO' || state.certidao?.status === 'ASSINADO';
  const canGenerateDL = 
    state.portaria?.status === 'ASSINADO' &&
    state.certidao?.status === 'ASSINADO' &&
    state.ne?.status === 'ASSINADO';
  const canGenerateOB = state.dl?.status === 'GERADO' || state.dl?.status === 'ASSINADO';
  const canSendToSEFIN = 
    state.portaria?.status === 'GERADO' &&
    state.certidao?.status === 'GERADO' &&
    state.ne?.status === 'GERADO';

  console.log('🎯 [Validações]', {
    canGeneratePortaria,
    canGenerateCertidao,
    canGenerateNE,
    canGenerateDL,
    canGenerateOB,
    canSendToSEFIN,
    portariaStatus: state.portaria?.status,
    certidaoStatus: state.certidao?.status,
    neStatus: state.ne?.status,
    dlStatus: state.dl?.status
  });

  // ========================================
  // RETURN
  // ========================================
  return {
    // Estado
    state,
    documents,
    isLoading,
    error,
    
    // Validações
    canGeneratePortaria,
    canGenerateCertidao,
    canGenerateNE,
    canGenerateDL,
    canGenerateOB,
    canSendToSEFIN,
    
    // Actions
    generateDocument: generateDocumentMutation.mutate,
    sendToSEFIN: sendToSEFINMutation.mutate,
    isGenerating: generateDocumentMutation.isPending,
    isSending: sendToSEFINMutation.isPending,
    
    // Refetch manual
    refetch
  };
}

// ========================================
// HELPERS
// ========================================
function getTituloByTipo(tipo: string): string {
  const map: Record<string, string> = {
    PORTARIA: 'Portaria de Concessão',
    CERTIDAO_REGULARIDADE: 'Certidão de Regularidade',
    NOTA_EMPENHO: 'Nota de Empenho',
    NOTA_LIQUIDACAO: 'Nota de Liquidação',
    ORDEM_BANCARIA: 'Ordem Bancária'
  };
  return map[tipo] || tipo;
}

function getOrdemByTipo(tipo: string): number {
  const map: Record<string, number> = {
    PORTARIA: 1,
    CERTIDAO_REGULARIDADE: 2,
    NOTA_EMPENHO: 3,
    NOTA_LIQUIDACAO: 4,
    ORDEM_BANCARIA: 5
  };
  return map[tipo] || 999;
}
