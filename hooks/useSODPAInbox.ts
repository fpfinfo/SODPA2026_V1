// ============================================================================
// useSODPAInbox - Hook para gerenciar a Caixa de Entrada SODPA
// Processos não atribuídos aguardando análise inicial
// ============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/AuthContext';
import { ProcessoSODPA, StatusDiaria, StatusPassagem } from '../types';

export type InboxFilter = 'ALL' | 'DIARIA' | 'PASSAGEM';
export type InboxSort = 'created_at' | 'prioridade' | 'valor';

interface UseSODPAInboxReturn {
  // Data
  processos: ProcessoSODPA[];
  loading: boolean;
  error: string | null;
  
  // Counts
  totalDiarias: number;
  totalPassagens: number;
  total: number;
  
  // Filters
  filter: InboxFilter;
  setFilter: (filter: InboxFilter) => void;
  sortBy: InboxSort;
  setSortBy: (sort: InboxSort) => void;
  
  // Actions
  assignToMe: (processId: string, tipo: 'DIARIA' | 'PASSAGEM') => Promise<boolean>;
  assignToMember: (processId: string, tipo: 'DIARIA' | 'PASSAGEM', memberId: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useSODPAInbox(): UseSODPAInboxReturn {
  const { user } = useAuth();
  const [processos, setProcessos] = useState<ProcessoSODPA[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<InboxFilter>('ALL');
  const [sortBy, setSortBy] = useState<InboxSort>('created_at');

  // Fetch unassigned processes (inbox)
  const fetchInbox = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch unassigned diarias
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
          assigned_to_id,
          profiles!diarias_servidor_id_fkey (
            id,
            nome,
            email,
            cargo
          )
        `)
        .is('assigned_to_id', null)
        .in('status', ['SOLICITADA', 'PENDENTE_ANALISE', 'RETORNO_SEFIN'])
        .order('created_at', { ascending: false });

      if (diariasError) throw diariasError;

      // Fetch unassigned passagens
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
          assigned_to_id,
          profiles!passagens_servidor_id_fkey (
            id,
            nome,
            email,
            cargo
          )
        `)
        .is('assigned_to_id', null)
        .in('status', ['SOLICITADA', 'PENDENTE_ANALISE', 'RETORNO_SEFIN'])
        .order('created_at', { ascending: false });

      if (passagensError) throw passagensError;

      // Normalize and merge processes
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
      }));

      setProcessos([...normalizedDiarias, ...normalizedPassagens]);
    } catch (err) {
      console.error('[useSODPAInbox] Error fetching inbox:', err);
      setError('Erro ao carregar caixa de entrada');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchInbox();
  }, [fetchInbox]);

  // Assign process to current user
  const assignToMe = useCallback(async (processId: string, tipo: 'DIARIA' | 'PASSAGEM'): Promise<boolean> => {
    if (!user?.id) {
      setError('Usuário não autenticado');
      return false;
    }

    try {
      const table = tipo === 'DIARIA' ? 'diarias' : 'passagens';
      
      const { error: updateError } = await supabase
        .from(table)
        .update({ 
          assigned_to_id: user.id,
          status: 'EM_ANALISE',
          updated_at: new Date().toISOString()
        })
        .eq('id', processId);

      if (updateError) throw updateError;

      // Remove from local state
      setProcessos(prev => prev.filter(p => p.id !== processId));
      
      return true;
    } catch (err) {
      console.error('[useSODPAInbox] Error assigning to me:', err);
      setError('Erro ao atribuir processo');
      return false;
    }
  }, [user?.id]);

  // Assign process to another team member
  const assignToMember = useCallback(async (
    processId: string, 
    tipo: 'DIARIA' | 'PASSAGEM', 
    memberId: string
  ): Promise<boolean> => {
    try {
      const table = tipo === 'DIARIA' ? 'diarias' : 'passagens';
      
      const { error: updateError } = await supabase
        .from(table)
        .update({ 
          assigned_to_id: memberId,
          status: 'EM_ANALISE',
          updated_at: new Date().toISOString()
        })
        .eq('id', processId);

      if (updateError) throw updateError;

      // Remove from local state
      setProcessos(prev => prev.filter(p => p.id !== processId));
      
      return true;
    } catch (err) {
      console.error('[useSODPAInbox] Error assigning to member:', err);
      setError('Erro ao atribuir processo');
      return false;
    }
  }, []);

  // Filtered and sorted processes
  const filteredProcessos = useMemo(() => {
    let result = [...processos];

    // Apply filter
    if (filter !== 'ALL') {
      result = result.filter(p => p.tipo === filter);
    }

    // Apply sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'prioridade':
          const prioridadeOrder = { URGENTE: 0, ALTA: 1, NORMAL: 2, BAIXA: 3 };
          return (prioridadeOrder[a.prioridade] || 2) - (prioridadeOrder[b.prioridade] || 2);
        case 'valor':
          return (b.valorTotal || 0) - (a.valorTotal || 0);
        case 'created_at':
        default:
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
    });

    return result;
  }, [processos, filter, sortBy]);

  // Counts
  const totalDiarias = useMemo(() => processos.filter(p => p.tipo === 'DIARIA').length, [processos]);
  const totalPassagens = useMemo(() => processos.filter(p => p.tipo === 'PASSAGEM').length, [processos]);

  return {
    processos: filteredProcessos,
    loading,
    error,
    totalDiarias,
    totalPassagens,
    total: processos.length,
    filter,
    setFilter,
    sortBy,
    setSortBy,
    assignToMe,
    assignToMember,
    refetch: fetchInbox,
  };
}
