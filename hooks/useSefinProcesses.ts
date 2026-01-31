import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface SefinProcess {
  id: string;
  nup: string;
  protocol: string;
  requesterName: string;
  requesterEmail?: string;
  destination?: string;
  description: string;
  value: number;
  status: string;
  destino_atual: string;
  assignedTo?: string;
  expenseAuthorizedBy?: string;
  created_at: string;
  updated_at: string;
}

export interface SefinOrdenador {
  id: string;
  name: string;
  email: string;
  cargo: string;
  avatarUrl: string;
  activeProcesses: number;
  capacity: number;
}

export interface SefinStats {
  waiting: number;
  authorizedTodayCount: number;
  authorizedTodayValue: number;
  retainedCount: number;
  totalBalance: number;
}

export const useSefinProcesses = () => {
  const [processes, setProcesses] = useState<SefinProcess[]>([]);
  const [ordenadores, setOrdenadores] = useState<SefinOrdenador[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setCurrentUserEmail(user.email);
      }
    };
    fetchCurrentUser();
  }, []);

  // Fetch SEFIN team members (ordenadores)
  const fetchOrdenadores = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('usuarios_sistema')
        .select(`
          id,
          servidores_tj!inner (
            id,
            nome,
            email,
            cargo,
            avatar_url
          )
        `)
        .eq('perfil', 'SEFIN')
        .eq('ativo', true);

      if (fetchError) throw fetchError;

      const mapped: SefinOrdenador[] = (data || []).map((u: any) => ({
        id: u.id,
        name: u.servidores_tj?.nome || 'Ordenador',
        email: u.servidores_tj?.email || '',
        cargo: u.servidores_tj?.cargo || 'Ordenador de Despesa',
        avatarUrl: u.servidores_tj?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.servidores_tj?.nome || 'O')}&background=10b981&color=fff`,
        activeProcesses: 0,
        capacity: 0
      }));

      setOrdenadores(mapped);
    } catch (err) {
      console.error('Error fetching ordenadores:', err);
    }
  }, []);

  // Fetch processes destined to SEFIN
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
          assigned_to_id,
          created_at,
          updated_at,
          profiles!solicitacoes_user_id_fkey (nome, email)
        `)
        .or('destino_atual.eq.SEFIN,status.ilike.%AGUARDANDO ASSINATURA%,status.ilike.%AGUARDANDO_ASSINATURA%')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const mapped: SefinProcess[] = (data || []).map((p: any) => ({
        id: p.id,
        nup: p.nup || '',
        protocol: p.nup || `PROC-${p.id.slice(0,8)}`,
        requesterName: p.profiles?.nome || 'Suprido',
        requesterEmail: p.profiles?.email,
        description: p.descricao || '',
        value: p.valor_solicitado || 0,
        status: p.status || 'PENDENTE',
        destino_atual: p.destino_atual || '',
        assignedTo: p.assigned_to_id,
        created_at: p.created_at,
        updated_at: p.updated_at
      }));

      setProcesses(mapped);
    } catch (err) {
      console.error('Error fetching SEFIN processes:', err);
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchProcesses();
    fetchOrdenadores();
  }, [fetchProcesses, fetchOrdenadores]);

  // Pending signatures filter
  const pendingSignatures = useMemo(() => {
    return processes.filter(p => 
      p.status?.toUpperCase().includes('AGUARDANDO') && 
      (p.destino_atual === 'SEFIN' || p.status?.toUpperCase().includes('ASSINATURA'))
    );
  }, [processes]);

  // Calculate stats
  const stats: SefinStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    
    const authorizedToday = processes.filter(p => 
      p.status?.toUpperCase() === 'APROVADO' && 
      p.updated_at?.startsWith(today)
    );

    return {
      waiting: pendingSignatures.length,
      authorizedTodayCount: authorizedToday.length,
      authorizedTodayValue: authorizedToday.reduce((acc, p) => acc + (p.value || 0), 0),
      retainedCount: processes.filter(p => p.status?.toUpperCase() === 'REJEITADO').length,
      totalBalance: 2500000 // Would come from budget table in production
    };
  }, [processes, pendingSignatures]);

  // Ordenadores with active process counts
  const ordenadoresWithStats = useMemo(() => {
    return ordenadores.map(ord => {
      const assigned = pendingSignatures.filter(p => p.assignedTo === ord.id);
      return {
        ...ord,
        activeProcesses: assigned.length,
        capacity: Math.min(100, assigned.length * 20)
      };
    });
  }, [ordenadores, pendingSignatures]);

  // Sign a single document
  const signDocument = async (processId: string) => {
    const { error } = await supabase
      .from('solicitacoes')
      .update({
        status: 'APROVADO',
        destino_atual: 'SOSFU',
        updated_at: new Date().toISOString()
      })
      .eq('id', processId);

    if (error) throw error;

    // Record in history
    await supabase.from('historico_tramitacao').insert({
      solicitacao_id: processId,
      origem: 'SEFIN',
      destino: 'SOSFU',
      status_anterior: 'AGUARDANDO ASSINATURA',
      status_novo: 'APROVADO',
      observacao: 'Documento assinado pelo Ordenador de Despesa'
    });

    await fetchProcesses();
  };

  // Batch sign multiple documents
  const batchSign = async (processIds: string[]) => {
    for (const id of processIds) {
      await signDocument(id);
    }
  };

  // Reject and return to SOSFU
  const rejectProcess = async (processId: string, reason: string) => {
    const { error } = await supabase
      .from('solicitacoes')
      .update({
        status: 'DEVOLVIDO',
        destino_atual: 'SOSFU',
        updated_at: new Date().toISOString()
      })
      .eq('id', processId);

    if (error) throw error;

    await supabase.from('historico_tramitacao').insert({
      solicitacao_id: processId,
      origem: 'SEFIN',
      destino: 'SOSFU',
      status_anterior: 'AGUARDANDO ASSINATURA',
      status_novo: 'DEVOLVIDO',
      observacao: `Devolvido pelo Ordenador: ${reason}`
    });

    await fetchProcesses();
  };

  // Assign to ordenador
  const assignToOrdenador = async (processId: string, ordenadorId: string) => {
    const { error } = await supabase
      .from('solicitacoes')
      .update({
        assigned_to_id: ordenadorId,
        updated_at: new Date().toISOString()
      })
      .eq('id', processId);

    if (error) throw error;
    await fetchProcesses();
  };

  return {
    processes,
    pendingSignatures,
    ordenadores: ordenadoresWithStats,
    stats,
    isLoading,
    error,
    currentUserEmail,
    // Actions
    signDocument,
    batchSign,
    rejectProcess,
    assignToOrdenador,
    refresh: fetchProcesses
  };
};
