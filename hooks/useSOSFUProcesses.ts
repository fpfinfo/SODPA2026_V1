import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Process, ProcessType, ConcessionStatus } from '../types';

export interface SOSFUStats {
  total: number;
  inbox: {
    total: number;
    solicitacoes: number;
    prestacoes: number;
  };
  myTasks: number;
  awaitingSignature: number;
  signed: number; // NEW: Processes signed but not yet in PC phase
  awaitingPC: number;
  solicitacoesAnalysis: number;
  prestacoesAudit: number;
}

export type ProcessCategory = 'SOLICITACAO' | 'PRESTACAO';

export const useSOSFUProcesses = () => {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Fetch current user's usuarios_sistema ID
  useEffect(() => {
    const fetchCurrentUserId = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        // Get usuarios_sistema ID for this auth user (via profiles.email match)
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', user.id)
          .single();
        
        if (profile?.email) {
          // Find the servidor_tj with this email, then the usuarios_sistema entry
          const { data: servidor } = await supabase
            .from('servidores_tj')
            .select('id')
            .eq('email', profile.email)
            .single();
          
          if (servidor?.id) {
            const { data: systemUser } = await supabase
              .from('usuarios_sistema')
              .select('id')
              .eq('servidor_id', servidor.id)
              .eq('ativo', true)
              .single();
            
            if (systemUser?.id) {
              setCurrentUserId(systemUser.id);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching current user ID:', err);
      }
    };
    fetchCurrentUserId();
  }, []);

  // Classify process by category
  const getCategory = (process: Process): ProcessCategory => {
    const status = (process.status as string)?.toUpperCase() || '';
    const tipo = (process.type as string)?.toLowerCase() || '';
    const workflow = (process as any).status_workflow?.toUpperCase() || '';
    
    // Prestação de Contas - includes PC_REVIEW_SOSFU workflow
    if (
      status.includes('PRESTAND') || 
      status.includes('AGUARDANDO PC') ||
      status.includes('PC ') ||
      tipo.includes('prestação') ||
      tipo.includes('prestacao') ||
      process.type === ProcessType.ACCOUNTABILITY ||
      workflow === 'PC_REVIEW_SOSFU' ||
      workflow === 'PC_PENDENCY' ||
      workflow === 'ACCOUNTABILITY_OPEN'
    ) {
      return 'PRESTACAO';
    }
    
    // Default: Solicitação
    return 'SOLICITACAO';
  };

  // Fetch processes from Supabase
  const fetchProcesses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch all processes destined to SOSFU or in SOSFU workflow
      const { data, error: fetchError } = await supabase
        .from('solicitacoes')
        .select(`
          *,
          profiles!solicitacoes_user_id_fkey (nome, email, banco, agencia, conta_corrente)
        `)
        .or('destino_atual.ilike.%SOSFU%,destino_atual.ilike.%ANALISE%,destino_atual.eq.SUPRIDO,status.ilike.%AGUARDANDO%,status.ilike.%PRESTANDO%,status.ilike.%CONCLU%,status_workflow.eq.PC_REVIEW_SOSFU,status_workflow.eq.PC_PENDENCY')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Map database fields to Process interface
      const mappedProcesses: Process[] = (data || []).map((p: any) => ({
        id: p.id,
        protocolNumber: p.nup || p.protocolNumber,
        type: p.tipo === 'ACCOUNTABILITY' ? ProcessType.ACCOUNTABILITY : ProcessType.CONCESSION,
        status: p.status,
        value: p.valor_solicitado || 0,
        purpose: p.descricao,
        createdAt: p.created_at,
        updated_at: p.updated_at,
        user_id: p.user_id,
        destino_atual: p.destino_atual,
        assignedToId: p.assigned_to_id,
        neNumber: p.ne_numero,
        dlNumber: p.dl_numero,
        obNumber: p.ob_numero,
        interestedParty: p.profiles?.nome || 'Suprido',
        priority: p.priority || 'NORMAL',
        // Scheduling fields
        data_planejada: p.data_planejada,
        prioridade_usuario: p.prioridade_usuario,
        notas_planejamento: p.notas_planejamento,
        supplyCategory: (p.tipo === 'ORDINARIO' || p.tipo === 'ORDINÁRIO') ? 'ORDINARY' : 'EXTRAORDINARY',
        bankData: p.dados_bancarios || (p.profiles?.banco ? { 
          bankName: p.profiles.banco, 
          agency: p.profiles.agencia, 
          account: p.profiles.conta_corrente 
        } : undefined),
        items: p.itens_despesa || p.items || [],
        status_workflow: p.status_workflow,
      }));

      setProcesses(mappedProcesses);
    } catch (err) {
      console.error('Error fetching SOSFU processes:', err);
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Helper: Check if process is in SEFIN flow
  const isInSefinFlow = (p: Process) => {
    const status = (p.status as string)?.toUpperCase() || '';
    return p.destino_atual === 'SEFIN' || 
           status.includes('AGUARDANDO ASSINATURA') ||
           (status.includes('ASSINADO') && !status.includes('AGUARDANDO PC'));
  };

  // Helper: Check if process is awaiting PC
  const isAwaitingPC = (p: Process) => {
    const status = (p.status as string)?.toUpperCase() || '';
    return status.includes('AGUARDANDO PRESTAÇÃO') ||
           status.includes('AGUARDANDO PC') ||
           status.includes('EM EXECUÇÃO') ||
           p.destino_atual === 'SUPRIDO';
  };

  // Helper: Check if process has completed SIAFE baixa (finished)
  const isBaixado = (p: Process) => {
    const status = (p.status as string)?.toUpperCase() || '';
    const workflow = ((p as any).status_workflow as string)?.toUpperCase() || '';
    return status.includes('BAIXADO NO SIAFE') ||
           status.includes('BAIXADO') ||
           workflow === 'PC_SIAFE_DONE' ||
           workflow === 'ARCHIVED';
  };

  // Card Filters
  const getCaixaEntrada = () => processes.filter(p => {
    const workflow = (p as any).status_workflow || '';
    // Include PC_REVIEW_SOSFU in inbox for SOSFU to analyze
    const isPcReview = workflow === 'PC_REVIEW_SOSFU';
    
    return (
      !p.assignedToId && 
      !isInSefinFlow(p) && 
      !isAwaitingPC(p) &&
      !isBaixado(p) &&  // Exclude finished processes
      (p.destino_atual === 'SOSFU' || p.destino_atual === 'EM ANÁLISE' || isPcReview)
    );
  });

  const getMinhaMesa = () => processes.filter(p => 
    p.assignedToId === currentUserId &&
    !isInSefinFlow(p) && 
    !isAwaitingPC(p) &&
    !isBaixado(p) &&  // Exclude finished processes
    (p.destino_atual === 'SOSFU' || p.destino_atual === 'EM ANÁLISE')
  );

  const getFluxoSefin = () => processes.filter(p => isInSefinFlow(p));

  const getAguardPC = () => processes.filter(p => isAwaitingPC(p));

  // Calculate stats
  const stats: SOSFUStats = {
    total: processes.length,
    inbox: {
      total: getCaixaEntrada().length,
      solicitacoes: getCaixaEntrada().filter(p => getCategory(p) === 'SOLICITACAO').length,
      prestacoes: getCaixaEntrada().filter(p => getCategory(p) === 'PRESTACAO').length,
    },
    myTasks: getMinhaMesa().length,
    awaitingSignature: getFluxoSefin().filter(p => 
      (p.status as string)?.toUpperCase().includes('AGUARDANDO')
    ).length,
    signed: getFluxoSefin().filter(p => 
      (p.status as string)?.toUpperCase().includes('ASSINADO') &&
      !(p.status as string)?.toUpperCase().includes('AGUARDANDO')
    ).length,
    awaitingPC: getAguardPC().length,
    solicitacoesAnalysis: getCaixaEntrada().filter(p => 
      getCategory(p) === 'SOLICITACAO'
    ).length,
    prestacoesAudit: getCaixaEntrada().filter(p => 
      getCategory(p) === 'PRESTACAO'
    ).length,
  };

  // Filter by category
  const getSolicitacoes = () => processes.filter(p => getCategory(p) === 'SOLICITACAO');
  const getPrestacoes = () => processes.filter(p => getCategory(p) === 'PRESTACAO');
  const getInbox = () => processes.filter(p => !p.assignedToId);

  // Archive filters - for completed processes (with execution finished, awaiting accountability)
  const getSolicitacoesConcluidas = () => processes.filter(p => {
    const status = (p.status as string)?.toUpperCase() || '';
    const workflow = ((p as any).status_workflow as string)?.toUpperCase() || '';
    
    return status.includes('PRESTANDO CONTAS') ||
           status.includes('SOLICITAÇÃO CONCLUÍDA') || 
           status.includes('SOLICITACAO CONCLUIDA') ||
           status === 'CONCLUIDA' ||
           workflow === 'AWAITING_ACCOUNTABILITY' ||
           workflow === 'ACCOUNTABILITY_OPEN';
  });

  const getPCConcluidas = () => processes.filter(p => {
    const status = (p.status as string)?.toUpperCase() || '';
    const workflow = ((p as any).status_workflow as string)?.toUpperCase() || '';
    return status.includes('PC CONCLUÍDA') || 
           status.includes('PC CONCLUIDA') ||
           status.includes('PRESTAÇÃO CONCLUÍDA') ||
           status === 'PC_CONCLUÍDA' ||
           status.includes('APROVADO COM RESSALVAS') ||  // For SiafeManager pending filter
           status.includes('BAIXADO NO SIAFE') ||  // For SiafeManager history filter
           workflow === 'PC_APPROVED' ||  // PC approved, awaiting SIAFE baixa
           workflow === 'PC_SIAFE_DONE';  // PC with SIAFE baixa completed
  });

  // Assign process to user
  const assignToUser = async (processId: string, userId: string) => {
    const { error } = await supabase
      .from('solicitacoes')
      .update({ 
        assigned_to_id: userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', processId);
    
    if (error) throw error;
    await fetchProcesses();
  };

  // Update execution document numbers
  const updateExecutionNumbers = async (
    processId: string, 
    numbers: { ne_numero?: string; dl_numero?: string; ob_numero?: string }
  ) => {
    const { error } = await supabase
      .from('solicitacoes')
      .update({
        ...numbers,
        updated_at: new Date().toISOString()
      })
      .eq('id', processId);
    
    if (error) throw error;
    await fetchProcesses();
  };

  // Tramit to SEFIN for signature
  const tramitToSefin = async (processId: string) => {
    const { error } = await supabase
      .from('solicitacoes')
      .update({
        status: 'AGUARDANDO ASSINATURA',
        destino_atual: 'SEFIN',
        updated_at: new Date().toISOString()
      })
      .eq('id', processId);
    
    if (error) throw error;
    
    // Record in history
    await supabase.from('historico_tramitacao').insert({
      solicitacao_id: processId,
      origem: 'SOSFU',
      destino: 'SEFIN',
      status_anterior: 'EM ANÁLISE',
      status_novo: 'AGUARDANDO ASSINATURA',
      observacao: 'Enviado para assinatura do Ordenador (SEFIN)'
    });
    
    await fetchProcesses();
  };

  // Complete execution
  const completeExecution = async (processId: string) => {
    const { error } = await supabase
      .from('solicitacoes')
      .update({
        status: 'AGUARDANDO PRESTAÇÃO DE CONTAS',
        destino_atual: 'SUPRIDO',
        updated_at: new Date().toISOString()
      })
      .eq('id', processId);
    
    if (error) throw error;
    
    // Record in history
    await supabase.from('historico_tramitacao').insert({
      solicitacao_id: processId,
      origem: 'SOSFU',
      destino: 'SUPRIDO',
      status_anterior: 'CONCEDIDO',
      status_novo: 'AGUARDANDO PRESTAÇÃO DE CONTAS',
      observacao: 'Execução da despesa concluída. Aguardando prestação de contas.'
    });
    
    await fetchProcesses();
  };

  useEffect(() => {
    fetchProcesses();
  }, [fetchProcesses]);

  return {
    processes,
    stats,
    isLoading,
    error,
    currentUserId,
    getCategory,
    getSolicitacoes,
    getPrestacoes,
    getInbox,
    // Card-specific filters
    getCaixaEntrada,
    getMinhaMesa,
    getFluxoSefin,
    getAguardPC,
    // Archive filters
    getSolicitacoesConcluidas,
    getPCConcluidas,
    // Actions
    assignToUser,
    updateExecutionNumbers,
    tramitToSefin,
    completeExecution,
    refresh: fetchProcesses
  };
};
