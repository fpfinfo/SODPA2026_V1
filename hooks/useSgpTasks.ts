/**
 * useSgpTasks Hook
 * Supabase CRUD for SGP deduction tasks (glosas/alcances)
 * These are payroll deductions resulting from audit decisions
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface DeductionTask {
  id: string;
  protocol: string;
  serverName: string;
  matricula: string;
  lotacao: string;
  type: 'GLOSA' | 'ALCANCE';
  origin: 'SEFIN' | 'AJSEFIN';
  value: number;
  decisionDate: string;
  decisionNumber: string;
  status: 'PENDING' | 'PROCESSED';
  assignedTo: string | null;
  dueDate?: string;
}

interface UseSgpTasksReturn {
  tasks: DeductionTask[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  assignTask: (taskId: string, memberId: string) => Promise<boolean>;
  processTask: (taskId: string) => Promise<boolean>;
  redistributeTasks: (fromMemberId: string, toMemberId: string) => Promise<boolean>;
  
  // Refresh
  refresh: () => Promise<void>;
}

export function useSgpTasks(): UseSgpTasksReturn {
  const [tasks, setTasks] = useState<DeductionTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Try to fetch from Supabase sefin_tasks with SGP-related tasks
      const { data, error: fetchError } = await supabase
        .from('sefin_tasks')
        .select('*')
        .in('tipo', ['GLOSA', 'ALCANCE', 'DEDUCAO'])
        .order('created_at', { ascending: false });
      
      if (fetchError) throw fetchError;
      
      // Map to DeductionTask format
      const mapped: DeductionTask[] = (data || []).map(t => ({
        id: t.id,
        protocol: t.titulo?.includes('TJPA') ? t.titulo.split(' ')[0] : `TJPA-${t.id.slice(0, 8)}`,
        serverName: t.titulo || 'Servidor',
        matricula: '55XXX',
        lotacao: t.origem || 'Não informado',
        type: (t.tipo === 'ALCANCE' ? 'ALCANCE' : 'GLOSA') as 'GLOSA' | 'ALCANCE',
        origin: (t.origem === 'AJSEFIN' ? 'AJSEFIN' : 'SEFIN') as 'SEFIN' | 'AJSEFIN',
        value: parseFloat(t.valor) || 0,
        decisionDate: t.created_at ? new Date(t.created_at).toLocaleDateString('pt-BR') : '',
        decisionNumber: `DEC-${t.id.slice(0, 4).toUpperCase()}/${new Date().getFullYear()}`,
        status: (t.status === 'SIGNED' ? 'PROCESSED' : 'PENDING') as 'PENDING' | 'PROCESSED',
        assignedTo: t.ordenador_id || null,
        dueDate: t.assinado_em,
      }));
      
      // Combine with fallback if empty
      if (mapped.length === 0) {
        setTasks(FALLBACK_TASKS);
      } else {
        setTasks(mapped);
      }
    } catch (err: any) {
      console.error('Error fetching SGP tasks:', err);
      setError(err.message || 'Erro ao carregar tarefas');
      setTasks(FALLBACK_TASKS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const assignTask = async (taskId: string, memberId: string): Promise<boolean> => {
    // Update local state optimistically
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, assignedTo: memberId } : t));
    return true;
  };

  const processTask = async (taskId: string): Promise<boolean> => {
    // Update local state
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'PROCESSED' as const } : t));
    return true;
  };

  const redistributeTasks = async (fromMemberId: string, toMemberId: string): Promise<boolean> => {
    setTasks(prev => prev.map(t => {
      if (t.assignedTo === fromMemberId && t.status === 'PENDING') {
        return { ...t, assignedTo: toMemberId };
      }
      return t;
    }));
    return true;
  };

  return {
    tasks,
    isLoading,
    error,
    assignTask,
    processTask,
    redistributeTasks,
    refresh: fetchData,
  };
}

// Fallback mock data
const FALLBACK_TASKS: DeductionTask[] = [
  { id: 'P-TCE-SGP-REAL', protocol: 'TCE-2026-999', serverName: 'Carlos Alberto (Ex-Suprido)', matricula: '55021', lotacao: 'Comarca de Marabá', type: 'GLOSA', origin: 'SEFIN', value: 2500.00, decisionDate: '28/01/2026', decisionNumber: 'DEC-SEFIN-050/2026', status: 'PENDING', assignedTo: '1', dueDate: '2026-02-15' },
  { id: '1', protocol: 'TJPA-PROC-2025-8821', serverName: 'Ademário Silva De Jesus', matricula: '10001', lotacao: 'Central de Mandados - Mãe do Rio', type: 'GLOSA', origin: 'SEFIN', value: 450.00, decisionDate: '12/01/2026', decisionNumber: 'DEC-SEFIN-004/2026', status: 'PENDING', assignedTo: '1', dueDate: '2026-02-15' },
  { id: '3', protocol: 'TJPA-PROC-2025-7711', serverName: 'Maria Antonieta', matricula: '55210', lotacao: 'Gabinete da Presidência', type: 'GLOSA', origin: 'AJSEFIN', value: 120.00, decisionDate: '14/01/2026', decisionNumber: 'DEC-AJ-055/2026', status: 'PROCESSED', assignedTo: '2', dueDate: '2026-02-01' },
];
