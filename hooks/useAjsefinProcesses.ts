import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface AjsefinProcess {
  id: string;
  nup: string;
  protocol: string;
  requesterName: string;
  description: string;
  value: number;
  status: string;
  destino_atual: string;
  assignedTo?: string;
  legalOpinion?: string;
  opinionStatus?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  created_at: string;
  updated_at: string;
}

export interface AjsefinAssessor {
  id: string;
  name: string;
  email: string;
  cargo: string;
  avatarUrl: string;
  activeProcesses: number;
  completedToday: number;
}

export interface AjsefinStats {
  pendingOpinion: number;
  inProgress: number;
  completedToday: number;
  avgResponseTime: number;
}

export const useAjsefinProcesses = () => {
  const [processes, setProcesses] = useState<AjsefinProcess[]>([]);
  const [assessors, setAssessors] = useState<AjsefinAssessor[]>([]);
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

  // Fetch AJSEFIN team members (assessors)
  const fetchAssessors = useCallback(async () => {
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
        .eq('perfil', 'AJSEFIN')
        .eq('ativo', true);

      if (fetchError) throw fetchError;

      const mapped: AjsefinAssessor[] = (data || []).map((u: any) => ({
        id: u.id,
        name: u.servidores_tj?.nome || 'Assessor',
        email: u.servidores_tj?.email || '',
        cargo: u.servidores_tj?.cargo || 'Assessor Jurídico',
        avatarUrl: u.servidores_tj?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.servidores_tj?.nome || 'A')}&background=8b5cf6&color=fff`,
        activeProcesses: 0,
        completedToday: 0
      }));

      setAssessors(mapped);
    } catch (err) {
      console.error('Error fetching assessors:', err);
    }
  }, []);

  // Fetch processes destined to AJSEFIN
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
        .or('destino_atual.eq.AJSEFIN,status.ilike.%PARECER%,status.ilike.%ANÁLISE JURÍDICA%')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const mapped: AjsefinProcess[] = (data || []).map((p: any) => {
        const status = p.status?.toUpperCase() || '';
        let opinionStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' = 'PENDING';
        if (status.includes('EM ANÁLISE')) opinionStatus = 'IN_PROGRESS';
        if (status.includes('PARECER EMITIDO') || status.includes('CONCLUÍDO')) opinionStatus = 'COMPLETED';

        return {
          id: p.id,
          nup: p.nup || '',
          protocol: p.nup || `PROC-${p.id.slice(0, 8)}`,
          requesterName: p.profiles?.nome || 'Suprido',
          description: p.descricao || '',
          value: p.valor_solicitado || 0,
          status: p.status || 'PENDENTE',
          destino_atual: p.destino_atual || '',
          assignedTo: p.assigned_to_id,
          opinionStatus,
          created_at: p.created_at,
          updated_at: p.updated_at
        };
      });

      setProcesses(mapped);
    } catch (err) {
      console.error('Error fetching AJSEFIN processes:', err);
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchProcesses();
    fetchAssessors();
  }, [fetchProcesses, fetchAssessors]);

  // Pending opinions filter
  const pendingOpinions = useMemo(() => {
    return processes.filter(p => 
      p.destino_atual === 'AJSEFIN' && 
      p.opinionStatus !== 'COMPLETED'
    );
  }, [processes]);

  // Calculate stats
  const stats: AjsefinStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    
    const completedToday = processes.filter(p => 
      p.opinionStatus === 'COMPLETED' && 
      p.updated_at?.startsWith(today)
    );

    return {
      pendingOpinion: processes.filter(p => p.opinionStatus === 'PENDING').length,
      inProgress: processes.filter(p => p.opinionStatus === 'IN_PROGRESS').length,
      completedToday: completedToday.length,
      avgResponseTime: 2.5 // Would be calculated from real data
    };
  }, [processes]);

  // Assessors with active process counts
  const assessorsWithStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    
    return assessors.map(assessor => {
      const assigned = pendingOpinions.filter(p => p.assignedTo === assessor.id);
      const completed = processes.filter(p => 
        p.assignedTo === assessor.id && 
        p.opinionStatus === 'COMPLETED' &&
        p.updated_at?.startsWith(today)
      );
      
      return {
        ...assessor,
        activeProcesses: assigned.length,
        completedToday: completed.length
      };
    });
  }, [assessors, pendingOpinions, processes]);

  // Assign to assessor
  const assignToAssessor = async (processId: string, assessorId: string) => {
    const { error } = await supabase
      .from('solicitacoes')
      .update({
        assigned_to_id: assessorId,
        status: 'EM ANÁLISE JURÍDICA',
        updated_at: new Date().toISOString()
      })
      .eq('id', processId);

    if (error) throw error;
    await fetchProcesses();
  };

  // Submit legal opinion and tramit to SEFIN
  const submitOpinion = async (processId: string, opinion: string) => {
    const { error } = await supabase
      .from('solicitacoes')
      .update({
        status: 'PARECER EMITIDO',
        destino_atual: 'SEFIN',
        updated_at: new Date().toISOString()
      })
      .eq('id', processId);

    if (error) throw error;

    // Record in history
    await supabase.from('historico_tramitacao').insert({
      solicitacao_id: processId,
      origem: 'AJSEFIN',
      destino: 'SEFIN',
      status_anterior: 'EM ANÁLISE JURÍDICA',
      status_novo: 'PARECER EMITIDO',
      observacao: `Parecer Jurídico emitido: ${opinion.slice(0, 100)}...`
    });

    await fetchProcesses();
  };

  // Return to SOSFU for adjustments
  const returnToSOSFU = async (processId: string, reason: string) => {
    const { error } = await supabase
      .from('solicitacoes')
      .update({
        status: 'DEVOLVIDO PARA AJUSTE',
        destino_atual: 'SOSFU',
        updated_at: new Date().toISOString()
      })
      .eq('id', processId);

    if (error) throw error;

    await supabase.from('historico_tramitacao').insert({
      solicitacao_id: processId,
      origem: 'AJSEFIN',
      destino: 'SOSFU',
      status_anterior: 'EM ANÁLISE JURÍDICA',
      status_novo: 'DEVOLVIDO PARA AJUSTE',
      observacao: `Devolvido pela AJSEFIN: ${reason}`
    });

    await fetchProcesses();
  };

  return {
    processes,
    pendingOpinions,
    assessors: assessorsWithStats,
    stats,
    isLoading,
    error,
    currentUserEmail,
    // Actions
    assignToAssessor,
    submitOpinion,
    returnToSOSFU,
    refresh: fetchProcesses
  };
};
