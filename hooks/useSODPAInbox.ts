// ============================================================================
// useSODPAInbox - Hook para gerenciar a Caixa de Entrada SODPA
// Versão 2.0 - Unificado na tabela sodpa_requests
// ============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/AuthContext';

export type InboxFilter = 'ALL' | 'DIARIA' | 'PASSAGEM';
export type InboxSort = 'created_at' | 'prioridade' | 'valor';

// Interface alinhada com sodpa_requests
export interface SODPAInboxProcess {
  id: string;
  tipo: 'DIARIA' | 'PASSAGEM';
  status: string;
  nup?: string;
  solicitanteId: string;
  solicitanteNome: string;
  solicitanteEmail: string;
  solicitanteCargo?: string;
  solicitanteLotacao?: string;
  tipoDestino: string; // ESTADO, PAIS, EXTERIOR
  origem: string;
  destino: string;
  dataInicio: string;
  dataFim: string;
  dias: number;
  motivo?: string;
  valorTotal?: number;
  prioridade: 'URGENTE' | 'ALTA' | 'NORMAL' | 'BAIXA';
  atribuidoA?: string;
  atribuidoNome?: string;
  assinaturaDigital: boolean;
  dataAssinatura?: string;
  destinoAtual: string;
  createdAt: string;
}

interface UseSODPAInboxReturn {
  // Data
  processos: SODPAInboxProcess[];
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
  assignToMe: (processId: string) => Promise<boolean>;
  assignToMember: (processId: string, memberId: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useSODPAInbox(): UseSODPAInboxReturn {
  const { user } = useAuth();
  const [processos, setProcessos] = useState<SODPAInboxProcess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<InboxFilter>('ALL');
  const [sortBy, setSortBy] = useState<InboxSort>('created_at');

  // Fetch from sodpa_requests where destino_atual = 'SODPA'
  const fetchInbox = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('sodpa_requests')
        .select('*')
        .eq('destino_atual', 'SODPA')
        .in('status', ['ENVIADO', 'EM_ANALISE', 'RETORNO'])
        .is('assigned_to_id', null)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Normalize data
      const normalized: SODPAInboxProcess[] = (data || []).map(r => ({
        id: r.id,
        tipo: r.tipo as 'DIARIA' | 'PASSAGEM',
        status: r.status,
        nup: r.nup,
        solicitanteId: r.solicitante_id,
        solicitanteNome: r.solicitante_nome || 'Servidor',
        solicitanteEmail: r.solicitante_email || '',
        solicitanteCargo: r.solicitante_cargo,
        solicitanteLotacao: r.solicitante_lotacao,
        tipoDestino: r.tipo_destino || 'ESTADO',
        origem: r.origem || '',
        destino: r.destino || '',
        dataInicio: r.data_inicio,
        dataFim: r.data_fim,
        dias: r.dias || 1,
        motivo: r.motivo,
        valorTotal: r.valor_total || 0,
        prioridade: (r.prioridade as any) || 'NORMAL',
        atribuidoA: r.assigned_to_id,
        assinaturaDigital: r.assinatura_digital || false,
        dataAssinatura: r.data_assinatura,
        destinoAtual: r.destino_atual,
        createdAt: r.created_at,
      }));

      setProcessos(normalized);
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
  const assignToMe = useCallback(async (processId: string): Promise<boolean> => {
    if (!user?.id) {
      setError('Usuário não autenticado');
      return false;
    }

    try {
      const { error: updateError } = await supabase
        .from('sodpa_requests')
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
    memberId: string
  ): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('sodpa_requests')
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

// Hook for My Desk (assigned to current user)
export function useSODPAMyDesk() {
  const { user } = useAuth();
  const [processos, setProcessos] = useState<SODPAInboxProcess[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyDesk = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('sodpa_requests')
        .select('*')
        .eq('assigned_to_id', user.id)
        .in('status', ['EM_ANALISE', 'AGUARDANDO_RETORNO'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      const normalized: SODPAInboxProcess[] = (data || []).map(r => ({
        id: r.id,
        tipo: r.tipo as 'DIARIA' | 'PASSAGEM',
        status: r.status,
        nup: r.nup,
        solicitanteId: r.solicitante_id,
        solicitanteNome: r.solicitante_nome || 'Servidor',
        solicitanteEmail: r.solicitante_email || '',
        solicitanteCargo: r.solicitante_cargo,
        solicitanteLotacao: r.solicitante_lotacao,
        tipoDestino: r.tipo_destino || 'ESTADO',
        origem: r.origem || '',
        destino: r.destino || '',
        dataInicio: r.data_inicio,
        dataFim: r.data_fim,
        dias: r.dias || 1,
        motivo: r.motivo,
        valorTotal: r.valor_total || 0,
        prioridade: (r.prioridade as any) || 'NORMAL',
        atribuidoA: r.assigned_to_id,
        assinaturaDigital: r.assinatura_digital || false,
        dataAssinatura: r.data_assinatura,
        destinoAtual: r.destino_atual,
        createdAt: r.created_at,
      }));

      setProcessos(normalized);
    } catch (err) {
      console.error('[useSODPAMyDesk] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchMyDesk();
  }, [fetchMyDesk]);

  return { processos, loading, refetch: fetchMyDesk };
}
