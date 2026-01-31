import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface SgpProcess {
  id: string;
  nup: string;
  protocol: string;
  requesterName: string;
  requesterMatricula?: string;
  description: string;
  value: number;
  status: string;
  destino_atual: string;
  assignedTo?: string;
  erpStatus?: 'REGULAR' | 'IRREGULAR' | 'PENDING' | 'GLOSA';
  glosaValue?: number;
  created_at: string;
  updated_at: string;
}

export interface SgpAnalyst {
  id: string;
  name: string;
  email: string;
  cargo: string;
  avatarUrl: string;
  activeProcesses: number;
  validatedToday: number;
}

export interface SgpStats {
  pendingValidation: number;
  validated: number;
  glosaIssued: number;
  totalGlosaValue: number;
}

export const useSgpProcesses = () => {
  const [processes, setProcesses] = useState<SgpProcess[]>([]);
  const [analysts, setAnalysts] = useState<SgpAnalyst[]>([]);
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

  // Fetch SGP team members (analysts)
  const fetchAnalysts = useCallback(async () => {
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
        .eq('perfil', 'SGP')
        .eq('ativo', true);

      if (fetchError) throw fetchError;

      const mapped: SgpAnalyst[] = (data || []).map((u: any) => ({
        id: u.id,
        name: u.servidores_tj?.nome || 'Analista',
        email: u.servidores_tj?.email || '',
        cargo: u.servidores_tj?.cargo || 'Analista de RH',
        avatarUrl: u.servidores_tj?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.servidores_tj?.nome || 'S')}&background=f59e0b&color=fff`,
        activeProcesses: 0,
        validatedToday: 0
      }));

      setAnalysts(mapped);
    } catch (err) {
      console.error('Error fetching SGP analysts:', err);
    }
  }, []);

  // Fetch processes destined to SGP
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
        .or('destino_atual.eq.SGP,status.ilike.%GLOSA%,status.ilike.%VALIDAÇÃO RH%')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const mapped: SgpProcess[] = (data || []).map((p: any) => {
        const status = p.status?.toUpperCase() || '';
        let erpStatus: 'REGULAR' | 'IRREGULAR' | 'PENDING' | 'GLOSA' = 'PENDING';
        if (status.includes('REGULAR')) erpStatus = 'REGULAR';
        if (status.includes('IRREGULAR')) erpStatus = 'IRREGULAR';
        if (status.includes('GLOSA')) erpStatus = 'GLOSA';

        return {
          id: p.id,
          nup: p.nup || '',
          protocol: p.nup || `PROC-${p.id.slice(0, 8)}`,
          requesterName: p.profiles?.nome || 'Servidor',
          description: p.descricao || '',
          value: p.valor_solicitado || 0,
          status: p.status || 'PENDENTE',
          destino_atual: p.destino_atual || '',
          assignedTo: p.assigned_to_id,
          erpStatus,
          created_at: p.created_at,
          updated_at: p.updated_at
        };
      });

      setProcesses(mapped);
    } catch (err) {
      console.error('Error fetching SGP processes:', err);
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchProcesses();
    fetchAnalysts();
  }, [fetchProcesses, fetchAnalysts]);

  // Pending validation filter
  const pendingValidation = useMemo(() => {
    return processes.filter(p => 
      p.destino_atual === 'SGP' && 
      p.erpStatus === 'PENDING'
    );
  }, [processes]);

  // Calculate stats
  const stats: SgpStats = useMemo(() => {
    const glosaProcesses = processes.filter(p => p.erpStatus === 'GLOSA');
    
    return {
      pendingValidation: pendingValidation.length,
      validated: processes.filter(p => p.erpStatus === 'REGULAR').length,
      glosaIssued: glosaProcesses.length,
      totalGlosaValue: glosaProcesses.reduce((acc, p) => acc + (p.glosaValue || 0), 0)
    };
  }, [processes, pendingValidation]);

  // Analysts with active process counts
  const analystsWithStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    
    return analysts.map(analyst => {
      const assigned = pendingValidation.filter(p => p.assignedTo === analyst.id);
      const validated = processes.filter(p => 
        p.assignedTo === analyst.id && 
        p.erpStatus === 'REGULAR' &&
        p.updated_at?.startsWith(today)
      );
      
      return {
        ...analyst,
        activeProcesses: assigned.length,
        validatedToday: validated.length
      };
    });
  }, [analysts, pendingValidation, processes]);

  // Assign to analyst
  const assignToAnalyst = async (processId: string, analystId: string) => {
    const { error } = await supabase
      .from('solicitacoes')
      .update({
        assigned_to_id: analystId,
        status: 'EM VALIDAÇÃO RH',
        updated_at: new Date().toISOString()
      })
      .eq('id', processId);

    if (error) throw error;
    await fetchProcesses();
  };

  // Validate process (mark as regular)
  const validateProcess = async (processId: string) => {
    const { error } = await supabase
      .from('solicitacoes')
      .update({
        status: 'VALIDADO - REGULAR',
        destino_atual: 'SOSFU',
        updated_at: new Date().toISOString()
      })
      .eq('id', processId);

    if (error) throw error;

    await supabase.from('historico_tramitacao').insert({
      solicitacao_id: processId,
      origem: 'SGP',
      destino: 'SOSFU',
      status_anterior: 'EM VALIDAÇÃO RH',
      status_novo: 'VALIDADO - REGULAR',
      observacao: 'Servidor regular no ERP - Sem pendências'
    });

    await fetchProcesses();
  };

  // Issue glosa
  const issueGlosa = async (processId: string, glosaValue: number, reason: string) => {
    const { error } = await supabase
      .from('solicitacoes')
      .update({
        status: 'GLOSA EMITIDA',
        destino_atual: 'SOSFU',
        updated_at: new Date().toISOString()
      })
      .eq('id', processId);

    if (error) throw error;

    await supabase.from('historico_tramitacao').insert({
      solicitacao_id: processId,
      origem: 'SGP',
      destino: 'SOSFU',
      status_anterior: 'EM VALIDAÇÃO RH',
      status_novo: 'GLOSA EMITIDA',
      observacao: `Glosa de R$ ${glosaValue.toFixed(2)} emitida: ${reason}`
    });

    await fetchProcesses();
  };

  // Return to SOSFU
  const returnToSOSFU = async (processId: string, reason: string) => {
    const { error } = await supabase
      .from('solicitacoes')
      .update({
        status: 'DEVOLVIDO - IRREGULAR',
        destino_atual: 'SOSFU',
        updated_at: new Date().toISOString()
      })
      .eq('id', processId);

    if (error) throw error;

    await supabase.from('historico_tramitacao').insert({
      solicitacao_id: processId,
      origem: 'SGP',
      destino: 'SOSFU',
      status_anterior: 'EM VALIDAÇÃO RH',
      status_novo: 'DEVOLVIDO - IRREGULAR',
      observacao: `Servidor irregular: ${reason}`
    });

    await fetchProcesses();
  };

  return {
    processes,
    pendingValidation,
    analysts: analystsWithStats,
    stats,
    isLoading,
    error,
    currentUserEmail,
    // Actions
    assignToAnalyst,
    validateProcess,
    issueGlosa,
    returnToSOSFU,
    refresh: fetchProcesses
  };
};
