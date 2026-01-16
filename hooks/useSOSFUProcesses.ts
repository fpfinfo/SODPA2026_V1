import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface SOSFUProcess {
  id: string;
  nup: string;
  tipo: string;
  status: string;
  valor_solicitado: number;
  descricao: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  destino_atual: string;
  assigned_to_id: string | null;
  // Execution documents numbers
  ne_numero?: string;
  dl_numero?: string;
  ob_numero?: string;
  // User info
  suprido_nome?: string;
  suprido_email?: string;
}

export interface SOSFUStats {
  total: number;
  inbox: {
    total: number;
    solicitacoes: number;
    prestacoes: number;
  };
  myTasks: number;
  awaitingSignature: number;
  awaitingPC: number;
  inAnalysis: number;
}

export type ProcessCategory = 'SOLICITACAO' | 'PRESTACAO';

export const useSOSFUProcesses = () => {
  const [processes, setProcesses] = useState<SOSFUProcess[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Classify process by category
  const getCategory = (process: SOSFUProcess): ProcessCategory => {
    const status = process.status?.toUpperCase() || '';
    const tipo = process.tipo?.toLowerCase() || '';
    
    // Prestação de Contas
    if (
      status.includes('PRESTAND') || 
      status.includes('AGUARDANDO PC') ||
      status.includes('PC ') ||
      tipo.includes('prestação') ||
      tipo.includes('prestacao')
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
          profiles!solicitacoes_user_id_fkey (nome, email)
        `)
        .or('destino_atual.ilike.%SOSFU%,destino_atual.ilike.%ANALISE%,status.ilike.%AGUARDANDO%')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Map data with user info
      const mappedProcesses: SOSFUProcess[] = (data || []).map((p: any) => ({
        ...p,
        suprido_nome: p.profiles?.nome || 'Suprido',
        suprido_email: p.profiles?.email || ''
      }));

      setProcesses(mappedProcesses);
    } catch (err) {
      console.error('Error fetching SOSFU processes:', err);
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Calculate stats
  const stats: SOSFUStats = {
    total: processes.length,
    inbox: {
      total: processes.filter(p => !p.assigned_to_id).length,
      solicitacoes: processes.filter(p => !p.assigned_to_id && getCategory(p) === 'SOLICITACAO').length,
      prestacoes: processes.filter(p => !p.assigned_to_id && getCategory(p) === 'PRESTACAO').length,
    },
    myTasks: processes.filter(p => p.assigned_to_id === 'CURRENT_USER').length, // TODO: get current user
    awaitingSignature: processes.filter(p => 
      p.status?.toUpperCase().includes('AGUARDANDO ASSINATURA')
    ).length,
    awaitingPC: processes.filter(p => 
      p.status?.toUpperCase().includes('AGUARDANDO PRESTAÇÃO') ||
      p.status?.toUpperCase().includes('AGUARDANDO PC')
    ).length,
    inAnalysis: processes.filter(p => 
      p.status?.toUpperCase().includes('EM ANÁLISE') ||
      p.status?.toUpperCase().includes('ANALISE')
    ).length,
  };

  // Filter by category
  const getSolicitacoes = () => processes.filter(p => getCategory(p) === 'SOLICITACAO');
  const getPrestacoes = () => processes.filter(p => getCategory(p) === 'PRESTACAO');
  const getInbox = () => processes.filter(p => !p.assigned_to_id);

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

  // Tramit to SEPLAN for signature
  const tramitToSeplan = async (processId: string) => {
    const { error } = await supabase
      .from('solicitacoes')
      .update({
        status: 'AGUARDANDO ASSINATURA',
        destino_atual: 'SEPLAN',
        updated_at: new Date().toISOString()
      })
      .eq('id', processId);
    
    if (error) throw error;
    
    // Record in history
    await supabase.from('historico_tramitacao').insert({
      solicitacao_id: processId,
      origem: 'SOSFU',
      destino: 'SEPLAN',
      status_anterior: 'EM ANÁLISE',
      status_novo: 'AGUARDANDO ASSINATURA',
      observacao: 'Enviado para assinatura do Ordenador'
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
    getCategory,
    getSolicitacoes,
    getPrestacoes,
    getInbox,
    assignToUser,
    updateExecutionNumbers,
    tramitToSeplan,
    completeExecution,
    refresh: fetchProcesses
  };
};
