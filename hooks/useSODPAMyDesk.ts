// ============================================================================
// useSODPAMyDesk - Hook para gerenciar "Minha Mesa" SODPA
// Processos atribuídos ao analista logado - execução de despesa
// ============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/AuthContext';
import { ProcessoSODPA, StatusDiaria, StatusPassagem } from '../types';

export type DeskTab = 'EM_ANALISE' | 'AGUARDANDO_DOCS' | 'PRONTOS_SEFIN' | 'RETORNO_SEFIN';

interface UseSODPAMyDeskReturn {
  // Data
  processos: ProcessoSODPA[];
  loading: boolean;
  error: string | null;
  
  // Counts by status
  emAnalise: number;
  aguardandoDocs: number;
  prontosSefin: number;
  retornoSefin: number;
  total: number;
  
  // Current tab
  activeTab: DeskTab;
  setActiveTab: (tab: DeskTab) => void;
  
  // Actions
  validateProcess: (processId: string, tipo: 'DIARIA' | 'PASSAGEM', approved: boolean, comments?: string) => Promise<boolean>;
  sendToSefin: (processId: string, tipo: 'DIARIA' | 'PASSAGEM') => Promise<boolean>;
  requestCorrection: (processId: string, tipo: 'DIARIA' | 'PASSAGEM', reason: string) => Promise<boolean>;
  redistribute: (processId: string, tipo: 'DIARIA' | 'PASSAGEM', toMemberId: string) => Promise<boolean>;
  executeExpense: (processId: string, tipo: 'DIARIA' | 'PASSAGEM') => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useSODPAMyDesk(): UseSODPAMyDeskReturn {
  const { user } = useAuth();
  const [processos, setProcessos] = useState<ProcessoSODPA[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DeskTab>('EM_ANALISE');

  // Fetch processes assigned to current user
  const fetchMyDesk = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);

    try {
      // Fetch my diarias
      const { data: diarias, error: diariasError } = await supabase
        .from('diarias')
        .select(`
          id,
          servidor_id,
          nup,
          destino,
          data_inicio,
          data_fim,
          quantidade,
          valor_total,
          status,
          prioridade,
          observacoes,
          created_at,
          updated_at,
          assigned_to_id,
          profiles!diarias_servidor_id_fkey (
            id,
            nome,
            email,
            cargo
          )
        `)
        .eq('assigned_to_id', user.id)
        .order('updated_at', { ascending: false });

      if (diariasError) throw diariasError;

      // Fetch my passagens
      const { data: passagens, error: passagensError } = await supabase
        .from('passagens')
        .select(`
          id,
          servidor_id,
          nup,
          tipo_passagem,
          classe_tarifa,
          valor_estimado,
          status,
          prioridade,
          justificativa,
          created_at,
          updated_at,
          assigned_to_id,
          profiles!passagens_servidor_id_fkey (
            id,
            nome,
            email,
            cargo
          )
        `)
        .eq('assigned_to_id', user.id)
        .order('updated_at', { ascending: false });

      if (passagensError) throw passagensError;

      // Normalize and merge
      const normalizedDiarias: ProcessoSODPA[] = (diarias || []).map(d => ({
        id: d.id,
        tipo: 'DIARIA' as const,
        solicitanteId: d.servidor_id,
        solicitanteNome: (d.profiles as any)?.nome || 'Servidor não identificado',
        solicitanteEmail: (d.profiles as any)?.email || '',
        solicitanteCargo: (d.profiles as any)?.cargo || '',
        protocoloNUP: d.nup,
        status: d.status as StatusDiaria,
        prioridade: d.prioridade || 'NORMAL',
        valorTotal: d.valor_total || 0,
        dataInicio: d.data_inicio,
        dataFim: d.data_fim,
        destino: d.destino,
        observacoes: d.observacoes,
        atribuidoA: d.assigned_to_id,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      }));

      const normalizedPassagens: ProcessoSODPA[] = (passagens || []).map(p => ({
        id: p.id,
        tipo: 'PASSAGEM' as const,
        solicitanteId: p.servidor_id,
        solicitanteNome: (p.profiles as any)?.nome || 'Servidor não identificado',
        solicitanteEmail: (p.profiles as any)?.email || '',
        solicitanteCargo: (p.profiles as any)?.cargo || '',
        protocoloNUP: p.nup,
        status: p.status as StatusPassagem,
        prioridade: p.prioridade || 'NORMAL',
        valorTotal: p.valor_estimado || 0,
        tipoPassagem: p.tipo_passagem,
        classeTarifa: p.classe_tarifa,
        justificativa: p.justificativa,
        atribuidoA: p.assigned_to_id,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      }));

      setProcessos([...normalizedDiarias, ...normalizedPassagens]);
    } catch (err) {
      console.error('[useSODPAMyDesk] Error fetching my desk:', err);
      setError('Erro ao carregar minha mesa');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Initial fetch
  useEffect(() => {
    fetchMyDesk();
  }, [fetchMyDesk]);

  // Validate/approve process
  const validateProcess = useCallback(async (
    processId: string,
    tipo: 'DIARIA' | 'PASSAGEM',
    approved: boolean,
    comments?: string
  ): Promise<boolean> => {
    try {
      const table = tipo === 'DIARIA' ? 'diarias' : 'passagens';
      const newStatus = approved ? 'APROVADA' : 'DEVOLVIDA';
      
      const { error: updateError } = await supabase
        .from(table)
        .update({ 
          status: newStatus,
          observacoes_analise: comments,
          updated_at: new Date().toISOString()
        })
        .eq('id', processId);

      if (updateError) throw updateError;

      // Update local state
      setProcessos(prev => prev.map(p => 
        p.id === processId ? { ...p, status: newStatus as any } : p
      ));
      
      return true;
    } catch (err) {
      console.error('[useSODPAMyDesk] Error validating:', err);
      setError('Erro ao validar processo');
      return false;
    }
  }, []);

  // Send to SEFIN for signature
  const sendToSefin = useCallback(async (
    processId: string,
    tipo: 'DIARIA' | 'PASSAGEM'
  ): Promise<boolean> => {
    try {
      const table = tipo === 'DIARIA' ? 'diarias' : 'passagens';
      
      const { error: updateError } = await supabase
        .from(table)
        .update({ 
          status: 'AGUARDANDO_SEFIN',
          destino_atual: 'SEFIN',
          updated_at: new Date().toISOString()
        })
        .eq('id', processId);

      if (updateError) throw updateError;

      // Update local state
      setProcessos(prev => prev.map(p => 
        p.id === processId ? { ...p, status: 'AGUARDANDO_SEFIN' as any } : p
      ));

      // TODO: Create sefin_tasks entry for SEFIN inbox
      
      return true;
    } catch (err) {
      console.error('[useSODPAMyDesk] Error sending to SEFIN:', err);
      setError('Erro ao tramitar para SEFIN');
      return false;
    }
  }, []);

  // Request correction from requester
  const requestCorrection = useCallback(async (
    processId: string,
    tipo: 'DIARIA' | 'PASSAGEM',
    reason: string
  ): Promise<boolean> => {
    try {
      const table = tipo === 'DIARIA' ? 'diarias' : 'passagens';
      
      const { error: updateError } = await supabase
        .from(table)
        .update({ 
          status: 'DEVOLVIDA',
          motivo_devolucao: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', processId);

      if (updateError) throw updateError;

      // Update local state
      setProcessos(prev => prev.map(p => 
        p.id === processId ? { ...p, status: 'DEVOLVIDA' as any } : p
      ));
      
      return true;
    } catch (err) {
      console.error('[useSODPAMyDesk] Error requesting correction:', err);
      setError('Erro ao solicitar correção');
      return false;
    }
  }, []);

  // Redistribute to another team member
  const redistribute = useCallback(async (
    processId: string,
    tipo: 'DIARIA' | 'PASSAGEM',
    toMemberId: string
  ): Promise<boolean> => {
    try {
      const table = tipo === 'DIARIA' ? 'diarias' : 'passagens';
      
      const { error: updateError } = await supabase
        .from(table)
        .update({ 
          assigned_to_id: toMemberId,
          updated_at: new Date().toISOString()
        })
        .eq('id', processId);

      if (updateError) throw updateError;

      // Remove from local state
      setProcessos(prev => prev.filter(p => p.id !== processId));
      
      return true;
    } catch (err) {
      console.error('[useSODPAMyDesk] Error redistributing:', err);
      setError('Erro ao redistribuir processo');
      return false;
    }
  }, []);

  // Execute expense (after SEFIN return)
  const executeExpense = useCallback(async (
    processId: string,
    tipo: 'DIARIA' | 'PASSAGEM'
  ): Promise<boolean> => {
    try {
      const table = tipo === 'DIARIA' ? 'diarias' : 'passagens';
      const finalStatus = tipo === 'DIARIA' ? 'PAGA' : 'EMITIDA';
      
      const { error: updateError } = await supabase
        .from(table)
        .update({ 
          status: finalStatus,
          data_execucao: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', processId);

      if (updateError) throw updateError;

      // Update local state
      setProcessos(prev => prev.map(p => 
        p.id === processId ? { ...p, status: finalStatus as any } : p
      ));
      
      return true;
    } catch (err) {
      console.error('[useSODPAMyDesk] Error executing expense:', err);
      setError('Erro ao executar despesa');
      return false;
    }
  }, []);

  // Filtered processes by tab
  const filteredProcessos = useMemo(() => {
    return processos.filter(p => {
      switch (activeTab) {
        case 'EM_ANALISE':
          return ['EM_ANALISE', 'COTACAO'].includes(p.status);
        case 'AGUARDANDO_DOCS':
          return p.status === 'AGUARDANDO_DOCS';
        case 'PRONTOS_SEFIN':
          return p.status === 'APROVADA';
        case 'RETORNO_SEFIN':
          return ['ASSINADA', 'RETORNO_SEFIN'].includes(p.status);
        default:
          return true;
      }
    });
  }, [processos, activeTab]);

  // Counts by status
  const emAnalise = useMemo(() => 
    processos.filter(p => ['EM_ANALISE', 'COTACAO'].includes(p.status)).length, 
    [processos]
  );
  
  const aguardandoDocs = useMemo(() => 
    processos.filter(p => p.status === 'AGUARDANDO_DOCS').length, 
    [processos]
  );
  
  const prontosSefin = useMemo(() => 
    processos.filter(p => p.status === 'APROVADA').length, 
    [processos]
  );
  
  const retornoSefin = useMemo(() => 
    processos.filter(p => ['ASSINADA', 'RETORNO_SEFIN'].includes(p.status)).length, 
    [processos]
  );

  return {
    processos: filteredProcessos,
    loading,
    error,
    emAnalise,
    aguardandoDocs,
    prontosSefin,
    retornoSefin,
    total: processos.length,
    activeTab,
    setActiveTab,
    validateProcess,
    sendToSefin,
    requestCorrection,
    redistribute,
    executeExpense,
    refetch: fetchMyDesk,
  };
}
