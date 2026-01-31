import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface PresidencyProcess {
  id: string;
  nup: string;
  protocol: string;
  requesterName: string;
  description: string;
  value: number;
  status: string;
  destino_atual: string;
  destination?: string;
  deadline?: string;
  created_at: string;
  updated_at: string;
}

export interface ActiveTraveler {
  id: string;
  name: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  status: 'NORMAL' | 'RISK' | 'ALERT';
}

export interface PresidencyStats {
  pending: number;
  inTransit: number;
  urgent: number;
  riskyLocations: number;
  monthlyCost: number;
}

export const usePresidencyProcesses = () => {
  const [processes, setProcesses] = useState<PresidencyProcess[]>([]);
  const [activeTravelers, setActiveTravelers] = useState<ActiveTraveler[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch processes requiring presidential authorization
  const fetchProcesses = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('solicitacoes')
        .select(`
          id,
          nup,
          descricao,
          valor_solicitado,
          status,
          destino_atual,
          prazo_aplicacao,
          created_at,
          updated_at,
          profiles!solicitacoes_user_id_fkey (nome, email)
        `)
        .or('destino_atual.eq.PRESIDENCIA,status.ilike.%PRESIDENCIA%,status.ilike.%APROVACAO_SUPERIOR%')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const mapped: PresidencyProcess[] = (data || []).map((p: any) => ({
        id: p.id,
        nup: p.nup || '',
        protocol: p.nup || `PROC-${p.id.slice(0, 8)}`,
        requesterName: p.profiles?.nome || 'Servidor',
        description: p.descricao || '',
        value: p.valor_solicitado || 0,
        status: p.status || 'PENDENTE',
        destino_atual: p.destino_atual || '',
        deadline: p.prazo_aplicacao,
        created_at: p.created_at,
        updated_at: p.updated_at
      }));

      setProcesses(mapped);
    } catch (err) {
      console.error('Error fetching presidency processes:', err);
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch active travelers (from approved recent travel authorizations)
  const fetchActiveTravelers = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error: fetchError } = await supabase
        .from('solicitacoes')
        .select(`
          id,
          nup,
          descricao,
          prazo_aplicacao,
          created_at,
          profiles!solicitacoes_user_id_fkey (nome)
        `)
        .eq('status', 'APROVADO')
        .gte('prazo_aplicacao', today)
        .order('prazo_aplicacao', { ascending: true })
        .limit(10);

      if (fetchError) throw fetchError;

      const mapped: ActiveTraveler[] = (data || []).map((p: any) => ({
        id: p.id,
        name: p.profiles?.nome || 'Servidor',
        destination: p.descricao?.split(' - ')[0] || 'Destino',
        departureDate: p.created_at,
        returnDate: p.prazo_aplicacao || '',
        status: 'NORMAL' as const
      }));

      setActiveTravelers(mapped);
    } catch (err) {
      console.error('Error fetching active travelers:', err);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchProcesses();
    fetchActiveTravelers();
  }, [fetchProcesses, fetchActiveTravelers]);

  // Pending list
  const pendingList = useMemo(() => {
    return processes.filter(p => 
      p.destino_atual === 'PRESIDENCIA' || 
      p.status?.toUpperCase().includes('PRESIDENCIA')
    );
  }, [processes]);

  // Calculate stats
  const stats: PresidencyStats = useMemo(() => {
    const today = new Date();
    
    const pending = pendingList.length;
    const inTransit = activeTravelers.length;
    const riskyLocations = activeTravelers.filter(t => t.status === 'RISK').length;
    
    // Urgent: within 3 days
    const urgent = pendingList.filter(p => {
      if (!p.deadline) return false;
      const travelDate = new Date(p.deadline);
      const diffDays = Math.ceil((travelDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 3;
    }).length;

    const monthlyCost = processes
      .filter(p => p.status === 'APROVADO')
      .reduce((acc, curr) => acc + (curr.value || 0), 0);

    return { pending, inTransit, urgent, monthlyCost, riskyLocations };
  }, [pendingList, activeTravelers, processes]);

  // Authorize process
  const authorizeProcess = async (processId: string) => {
    const { error } = await supabase
      .from('solicitacoes')
      .update({
        status: 'APROVADO',
        destino_atual: 'SEFIN',
        updated_at: new Date().toISOString()
      })
      .eq('id', processId);

    if (error) throw error;

    await supabase.from('historico_tramitacao').insert({
      solicitacao_id: processId,
      origem: 'PRESIDENCIA',
      destino: 'SEFIN',
      status_anterior: 'EM ANÁLISE PRESIDÊNCIA',
      status_novo: 'APROVADO',
      observacao: 'Autorizado pela Presidência'
    });

    await fetchProcesses();
  };

  // Reject process
  const rejectProcess = async (processId: string, reason: string) => {
    const { error } = await supabase
      .from('solicitacoes')
      .update({
        status: 'DEVOLVIDO',
        destino_atual: 'SODPA',
        updated_at: new Date().toISOString()
      })
      .eq('id', processId);

    if (error) throw error;

    await supabase.from('historico_tramitacao').insert({
      solicitacao_id: processId,
      origem: 'PRESIDENCIA',
      destino: 'SODPA',
      status_anterior: 'EM ANÁLISE PRESIDÊNCIA',
      status_novo: 'DEVOLVIDO',
      observacao: `Indeferido pela Presidência: ${reason}`
    });

    await fetchProcesses();
  };

  return {
    processes,
    pendingList,
    activeTravelers,
    stats,
    isLoading,
    error,
    // Actions
    authorizeProcess,
    rejectProcess,
    refresh: fetchProcesses
  };
};
