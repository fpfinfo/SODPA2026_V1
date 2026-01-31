// ============================================================================
// SODPA - Hook de Processos Unificados (Diárias + Passagens)
// ============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  ProcessoSODPA, 
  SolicitacaoDiaria, 
  SolicitacaoPassagem,
  SODPAStats,
  StatusDiaria,
  StatusPassagem
} from '../types';

export function useSODPAProcesses() {
  const [processos, setProcessos] = useState<ProcessoSODPA[]>([]);
  const [diarias, setDiarias] = useState<SolicitacaoDiaria[]>([]);
  const [passagens, setPassagens] = useState<SolicitacaoPassagem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    };
    fetchUser();
  }, []);

  // Fetch all SODPA processes
  const fetchProcessos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch diárias
      const { data: diariasData, error: diariasError } = await supabase
        .from('diarias')
        .select(`
          id, nup, destino, servidor_id, motivo,
          data_inicio, data_fim, quantidade, tipo_diaria,
          valor_unitario, valor_total, status, prioridade,
          assigned_to_id, destino_atual, observacoes,
          created_at, updated_at,
          profiles:servidor_id (nome, email)
        `)
        .order('created_at', { ascending: false });

      if (diariasError) throw diariasError;

      // Fetch passagens
      const { data: passagensData, error: passagensError } = await supabase
        .from('passagens')
        .select(`
          id, nup, tipo_passagem, classe_tarifa, servidor_id,
          justificativa, valor_estimado, valor_final, status,
          prioridade, assigned_to_id, destino_atual, observacoes,
          created_at, updated_at,
          profiles:servidor_id (nome, email)
        `)
        .order('created_at', { ascending: false });

      if (passagensError) throw passagensError;

      // Normalize diárias
      const normalizedDiarias: SolicitacaoDiaria[] = (diariasData || []).map(d => ({
        id: d.id,
        servidorId: d.servidor_id,
        servidorNome: (d.profiles as any)?.nome || 'Desconhecido',
        nup: d.nup,
        destino: d.destino,
        motivo: d.motivo,
        dataInicio: d.data_inicio,
        dataFim: d.data_fim,
        quantidade: d.quantidade,
        tipoDiaria: d.tipo_diaria,
        valorUnitario: d.valor_unitario,
        valorTotal: d.valor_total,
        status: d.status as StatusDiaria,
        prioridade: d.prioridade,
        assignedToId: d.assigned_to_id,
        destinoAtual: d.destino_atual,
        observacoes: d.observacoes,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      }));

      // Normalize passagens
      const normalizedPassagens: SolicitacaoPassagem[] = (passagensData || []).map(p => ({
        id: p.id,
        servidorId: p.servidor_id,
        servidorNome: (p.profiles as any)?.nome || 'Desconhecido',
        nup: p.nup,
        tipoPassagem: p.tipo_passagem,
        classeTarifa: p.classe_tarifa,
        justificativa: p.justificativa,
        valorEstimado: p.valor_estimado,
        valorFinal: p.valor_final,
        status: p.status as StatusPassagem,
        prioridade: p.prioridade,
        assignedToId: p.assigned_to_id,
        destinoAtual: p.destino_atual,
        observacoes: p.observacoes,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      }));

      setDiarias(normalizedDiarias);
      setPassagens(normalizedPassagens);

      // Create unified process list
      const unifiedProcessos: ProcessoSODPA[] = [
        ...normalizedDiarias.map(d => ({
          id: d.id,
          tipo: 'DIARIA' as const,
          protocoloNUP: d.nup,
          solicitanteId: d.servidorId,
          solicitanteNome: d.servidorNome,
          status: d.status,
          valorTotal: d.valorTotal,
          prioridade: d.prioridade,
          assignedToId: d.assignedToId,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
        })),
        ...normalizedPassagens.map(p => ({
          id: p.id,
          tipo: 'PASSAGEM' as const,
          protocoloNUP: p.nup,
          solicitanteId: p.servidorId,
          solicitanteNome: p.servidorNome,
          status: p.status,
          valorTotal: p.valorFinal || p.valorEstimado || 0,
          prioridade: p.prioridade,
          assignedToId: p.assignedToId,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        })),
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setProcessos(unifiedProcessos);
    } catch (err) {
      console.error('Erro ao carregar processos SODPA:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar processos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProcessos();
  }, [fetchProcessos]);

  // Statistics
  const stats = useMemo<SODPAStats>(() => {
    const diariasProcessos = processos.filter(p => p.tipo === 'DIARIA');
    const passagensProcessos = processos.filter(p => p.tipo === 'PASSAGEM');

    const inboxDiarias = diariasProcessos.filter(p => p.status === 'SOLICITADA' && !p.assignedToId);
    const inboxPassagens = passagensProcessos.filter(p => p.status === 'SOLICITADA' && !p.assignedToId);

    const minhaMesaDiarias = diariasProcessos.filter(p => p.assignedToId === currentUserId);
    const minhaMesaPassagens = passagensProcessos.filter(p => p.assignedToId === currentUserId);

    return {
      total: processos.length,
      inbox: {
        total: inboxDiarias.length + inboxPassagens.length,
        diarias: inboxDiarias.length,
        passagens: inboxPassagens.length,
      },
      minhaMesa: {
        total: minhaMesaDiarias.length + minhaMesaPassagens.length,
        diarias: minhaMesaDiarias.length,
        passagens: minhaMesaPassagens.length,
      },
      aguardandoAprovacao: processos.filter(p => 
        ['APROVADA', 'EMITIDA'].includes(p.status)
      ).length,
      concluidos: processos.filter(p => 
        ['PAGA', 'UTILIZADA'].includes(p.status)
      ).length,
    };
  }, [processos, currentUserId]);

  // Actions
  const assignToUser = useCallback(async (
    processoId: string, 
    userId: string, 
    tipo: 'DIARIA' | 'PASSAGEM'
  ) => {
    const table = tipo === 'DIARIA' ? 'diarias' : 'passagens';
    const newStatus = tipo === 'DIARIA' ? 'EM_ANALISE' : 'COTACAO';

    const { error } = await supabase
      .from(table)
      .update({ 
        assigned_to_id: userId, 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', processoId);

    if (error) throw error;
    await fetchProcessos();
  }, [fetchProcessos]);

  const updateStatus = useCallback(async (
    processoId: string,
    newStatus: StatusDiaria | StatusPassagem,
    tipo: 'DIARIA' | 'PASSAGEM'
  ) => {
    const table = tipo === 'DIARIA' ? 'diarias' : 'passagens';

    const { error } = await supabase
      .from(table)
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', processoId);

    if (error) throw error;
    await fetchProcessos();
  }, [fetchProcessos]);

  // Filter helpers
  const getDiarias = useCallback(() => diarias, [diarias]);
  const getPassagens = useCallback(() => passagens, [passagens]);
  
  const getInbox = useCallback(() => 
    processos.filter(p => p.status === 'SOLICITADA' && !p.assignedToId),
    [processos]
  );
  
  const getMinhaMesa = useCallback(() => 
    processos.filter(p => p.assignedToId === currentUserId),
    [processos, currentUserId]
  );

  const getByStatus = useCallback((status: StatusDiaria | StatusPassagem) =>
    processos.filter(p => p.status === status),
    [processos]
  );

  // Create new passagem
  const createPassagem = useCallback(async (data: {
    nomeInteressado: string;
    setor: string;
    categoria: string;
    destino: string;
    dataViagem: string; 
    valorEstimado: number;
    motivo: string;
    solicitanteId: string;
  }) => {
    try {
        const mockNUP = `TJPA-REQ-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`;
        
        const { error } = await supabase
        .from('passagens')
        .insert([{
            nup: mockNUP,
            servidor_id: data.solicitanteId,
            tipo_passagem: 'NACIONAL',
            classe_tarifa: data.categoria, 
            justificativa: data.motivo,
            valor_estimado: data.valorEstimado,
            status: 'SOLICITADA',
            observacoes: `Destino: ${data.destino} | Setor: ${data.setor}`,
            created_at: new Date().toISOString()
        }]);

      if (error) throw error;
      await fetchProcessos();
      return { success: true };
    } catch (err) {
       console.error('Erro ao criar passagem:', err);
       return { success: false, error: err };
    }
  }, [fetchProcessos]);

  return {
    processos,
    diarias,
    passagens,
    loading,
    error,
    stats,
    currentUserId,
    refetch: fetchProcessos,
    assignToUser,
    updateStatus,
    getDiarias,
    getPassagens,
    getInbox,
    getMinhaMesa,
    getByStatus,
    createPassagem
  };
}
