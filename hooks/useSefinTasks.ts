/**
 * useSefinTasks Hook
 * Supabase CRUD for SEFIN signing tasks
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface SigningTask {
  id: string;
  solicitacao_id?: string;
  documento_id?: string;
  tipo: string;
  titulo: string;
  origem: string;
  valor?: number;
  status: 'PENDING' | 'SIGNED' | 'REJECTED' | 'SENT';
  ordenador_id?: string;
  assinado_em?: string;
  created_at?: string;
}

interface UseSefinTasksReturn {
  tasks: SigningTask[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  signTask: (id: string) => Promise<boolean>;
  signMultipleTasks: (ids: string[]) => Promise<boolean>;
  tramitarTasks: (ids: string[]) => Promise<boolean>;
  rejectTask: (id: string, motivo: string) => Promise<boolean>;
  
  // Refresh
  refresh: () => Promise<void>;
}

export function useSefinTasks(): UseSefinTasksReturn {
  const [tasks, setTasks] = useState<SigningTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('sefin_tasks')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (fetchError) throw fetchError;
      
      setTasks((data || []).map(t => ({
        id: t.id,
        solicitacao_id: t.solicitacao_id,
        documento_id: t.documento_id,
        tipo: t.tipo,
        titulo: t.titulo,
        origem: t.origem,
        valor: parseFloat(t.valor) || 0,
        status: t.status as any,
        ordenador_id: t.ordenador_id,
        assinado_em: t.assinado_em,
        created_at: t.created_at,
      })));
    } catch (err: any) {
      console.error('Error fetching sefin tasks:', err);
      setError(err.message || 'Erro ao carregar tarefas');
      
      // Fallback to mock data
      setTasks(FALLBACK_TASKS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const signTask = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('sefin_tasks')
        .update({ 
          status: 'SIGNED', 
          assinado_em: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
      await fetchData();
      return true;
    } catch (err: any) {
      console.error('Error signing task:', err);
      setError(err.message);
      return false;
    }
  };

  const signMultipleTasks = async (ids: string[]): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('sefin_tasks')
        .update({ 
          status: 'SIGNED', 
          assinado_em: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .in('id', ids);
      
      if (error) throw error;
      await fetchData();
      return true;
    } catch (err: any) {
      console.error('Error signing multiple tasks:', err);
      setError(err.message);
      return false;
    }
  };

  const tramitarTasks = async (ids: string[]): Promise<boolean> => {
    try {
      // 1. Get tasks to verify linked solicitacao_id
      const tasksToTramit = tasks.filter(t => ids.includes(t.id));
      const solicitacaoIds = tasksToTramit
        .map(t => t.solicitacao_id)
        .filter(Boolean) as string[];

      // 2. Update solicitacoes - status to RETORNO SEFIN, destination to SOSFU
      if (solicitacaoIds.length > 0) {
        const { error: solError } = await supabase
          .from('solicitacoes')
          .update({
            status: 'RETORNO SEFIN',
            destino_atual: 'SOSFU',
            execution_status: 'AGUARDANDO_DL_OB',
            updated_at: new Date().toISOString()
          })
          .in('id', solicitacaoIds);
          
        if (solError) throw solError;

        // 3. ESSENCIAL: Atualizar execution_documents para ASSINADO!
        const { error: docError } = await supabase
          .from('execution_documents')
          .update({
            status: 'ASSINADO',
            assinado_em: new Date().toISOString()
          })
          .in('solicitacao_id', solicitacaoIds)
          .in('tipo', ['PORTARIA', 'CERTIDAO_REGULARIDADE', 'NOTA_EMPENHO']);
          
        if (docError) {
          console.error('Erro ao atualizar documentos:', docError);
          // Não falha, apenas loga
        }

        // 4. Criar histórico de tramitação
        for (const solId of solicitacaoIds) {
          await supabase.from('historico_tramitacao').insert({
            solicitacao_id: solId,
            origem: 'SEFIN',
            destino: 'SOSFU',
            status_anterior: 'AGUARDANDO ASSINATURA SEFIN',
            status_novo: 'RETORNO SEFIN',
            observacao: 'Documentos assinados pelo Ordenador. Processo retorna para SOSFU gerar DL e OB.'
          });
        }
      }

      // 5. Mark tasks as SENT
      const { error } = await supabase
        .from('sefin_tasks')
        .update({ 
          status: 'SENT', 
          updated_at: new Date().toISOString()
        })
        .in('id', ids);
      
      if (error) throw error;
      await fetchData();
      return true;
    } catch (err: any) {
      console.error('Error tramiting tasks:', err);
      setError(err.message);
      return false;
    }
  };

  const rejectTask = async (id: string, motivo: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('sefin_tasks')
        .update({ 
          status: 'REJECTED',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
      await fetchData();
      return true;
    } catch (err: any) {
      console.error('Error rejecting task:', err);
      setError(err.message);
      return false;
    }
  };

  return {
    tasks,
    isLoading,
    error,
    signTask,
    signMultipleTasks,
    tramitarTasks,
    rejectTask,
    refresh: fetchData,
  };
}

// Fallback mock data
const FALLBACK_TASKS: SigningTask[] = [
  { id: '1', tipo: 'PORTARIA', titulo: 'Portaria nº 001/2026 - Comarca de Belém', origem: 'SOSFU', valor: 20000, status: 'PENDING' },
  { id: '2', tipo: 'PORTARIA', titulo: 'Portaria nº 002/2026 - Comarca de Ananindeua', origem: 'SOSFU', valor: 16000, status: 'PENDING' },
  { id: '3', tipo: 'NOTA_EMPENHO', titulo: 'NE nº 2026NE00001 - Suprimento Ordinário', origem: 'SOSFU', valor: 36000, status: 'PENDING' },
  { id: '4', tipo: 'PORTARIA', titulo: 'Portaria nº 003/2026 - Comarca de Santarém', origem: 'SOSFU', valor: 16000, status: 'SIGNED', assinado_em: '2026-01-10T14:30:00Z' },
];
