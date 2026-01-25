import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useToast } from '../components/ui/ToastProvider';

export type BatchActionType = 'TRAMITAR' | 'ASSINAR';

export const useBatchActions = () => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const { showToast } = useToast();

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  /**
   * Executes a batch action on the selected items.
   * For MVP, we process them sequentially or parallel client-side.
   */
  const executeBatchAction = async (
    action: BatchActionType, 
    ids: string[], 
    payload: any = {}
  ) => {
    if (ids.length === 0) return;
    
    setIsProcessingBatch(true);
    let successCount = 0;
    let failCount = 0;

    try {
      if (action === 'TRAMITAR') {
        // Tramitar processes
        // Payload: { status_novo, destino, observacao, origem }
        
        await Promise.all(ids.map(async (id) => {
            try {
                // Get current status for history
                const { data: current, error: fetchErr } = await supabase
                    .from('solicitacoes')
                    .select('status')
                    .eq('id', id)
                    .single();
                    
                if (fetchErr) throw fetchErr;

                // Update Process
                const { error: updateErr } = await supabase
                    .from('solicitacoes')
                    .update({ 
                        status: payload.status_novo,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', id);

                if (updateErr) throw updateErr;

                // Add History
                await supabase.from('historico_tramitacao').insert({
                    solicitacao_id: id,
                    origem: payload.origem || 'GESTOR',
                    destino: payload.destino,
                    status_anterior: current.status,
                    status_novo: payload.status_novo,
                    observacao: payload.observacao || 'Tramitação em lote',
                    created_at: new Date().toISOString()
                });
                
                successCount++;
            } catch (err) {
                console.error(`Failed to process ${id}`, err);
                failCount++;
            }
        }));

      } else if (action === 'ASSINAR') {
        // Assinar documents
        // Payload: { pin, userId, userRole } 
        // Logic: Find MINUTA docs for these processes and sign them?
        // Or assume Atesto generation? 
        // For simplicity V1: Assinar Atesto Generico if missing, or sign existing minuta.
        
        // This is complex because we need to know WHAT doc to sign.
        // For Batch Actions V1, let's stick to TRAMITAR (Forwarding) which is the biggest pain point.
        // Signing might require PIN input per doc or once for all.
        // IF payload has PIN, we sign.
        
        // FUTURE SCOPE.
      }

      showToast({
        type: failCount === 0 ? 'success' : 'warning',
        title: 'Lote Processado',
        message: `Sucesso: ${successCount} | Falhas: ${failCount}`
      });

    } catch (error: any) {
        console.error('Batch Action Error', error);
        showToast({
            type: 'error',
            title: 'Erro no Processamento',
            message: error.message || 'Falha ao processar lote.'
        });
    } finally {
        setIsProcessingBatch(false);
        clearSelection();
    }
  };

  return {
    selectedIds,
    toggleSelection,
    selectAll,
    clearSelection,
    executeBatchAction,
    isProcessingBatch
  };
};
