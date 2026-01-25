
import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { RiskScore, calculateRiskScore } from '../utils/riskScoring';

export interface SupridoProfile {
  id: string;
  nome: string;
  cpf?: string;
  email?: string;
  cargo?: string;
  lotacao?: string;
  avatar_url?: string;
  status: 'ACTIVE' | 'BLOCKED';
  stats?: {
    total_processes: number;
    total_value: number;
    avg_pc_days: number;
    open_processes: number;
    risk?: RiskScore;
  }
}

export const useSupridoCRM = () => {
  const [searchResults, setSearchResults] = useState<SupridoProfile[]>([]);
  const [selectedSuprido, setSelectedSuprido] = useState<SupridoProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStatsLoading, setIsStatsLoading] = useState(false);

  // Search by name, cpf, or email
  const searchSupridos = useCallback(async (query: string) => {
    if (!query || query.length < 3) return;
    setIsLoading(true);

    try {
      // Use ILIKE for case-insensitive search
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nome, cpf, email, cargo, lotacao:lotacoes(nome)')
        .or(`nome.ilike.%${query}%,cpf.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;

      // Transform data
      const results: SupridoProfile[] = data.map((p: any) => ({
        id: p.id,
        nome: p.nome,
        cpf: p.cpf,
        email: p.email,
        cargo: p.cargo,
        lotacao: p.lotacao?.nome || 'Não informada',
        status: 'ACTIVE', // Todo: fetch real status from a blocklist table if exists
      }));

      setSearchResults(results);
    } catch (err) {
      console.error('Error searching supridos:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const [supridoProcesses, setSupridoProcesses] = useState<any[]>([]);

  // Fetch detailed stats for a specific suprido
  const fetchSupridoStats = useCallback(async (supridoId: string) => {
    setIsStatsLoading(true);
    try {
        // Fetch solicitacoes counts
        // We need: total count, total value, late PCs, returned, glosas
        
        // 1. Fetch raw solicitacoes data (limited columns)
        const { data: processes, error } = await supabase
            .from('solicitacoes')
            .select('id, nup, status, valor_total, created_at, deadline_pc, data_prestacao_contas, status_workflow, type')
            .eq('user_id', supridoId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        setSupridoProcesses(processes || []);

        const total = processes?.length || 0;
        const totalVal = processes?.reduce((acc, p) => acc + (p.valor_total || 0), 0) || 0;
        
        // Calculate Risk Factors
        let lateCount = 0;
        let returnedCount = 0;
        const glosaCount = 0; // Assuming we don't have Glosa flag yet, strictly.
        
        // Count open processes
        const openCount = processes?.filter(p => !['ARQUIVADO', 'CONCLUIDO'].includes(p.status)).length || 0;

        // Analyze history for risk
        // This calculates stats client-side due to lack of specific aggregate SQL functions currently
        processes?.forEach(p => {
             // Late PC Check
             if (p.deadline_pc && p.status === 'PRESTANDO CONTAS') {
                 if (new Date(p.deadline_pc) < new Date()) lateCount++;
             }
             // Returned Check
             // Simple heuristic: if status was 'DEVOLVIDO' at some point? 
             // Without full history scan, we can only check current status.
             if (p.status === 'DEVOLVIDO') returnedCount++;
        });

        // Get historic devolutions from history table for better accuracy would be ideal, 
        // but for V1 we keep it simple.

        const risk = calculateRiskScore({
            totalProcesses: total,
            latePCs: lateCount,
            returnedProcesses: returnedCount,
            glosas: glosaCount
        });

        // Update selected suprido with stats
        setSelectedSuprido(prev => prev ? ({
            ...prev,
            stats: {
                total_processes: total,
                total_value: totalVal,
                avg_pc_days: 15, // Mock for now or calculate date diffs
                open_processes: openCount,
                risk
            }
        }) : null);

    } catch (err) {
        console.error('Error fetching stats:', err);
    } finally {
        setIsStatsLoading(false);
    }
  }, []);

  const selectSuprido = (suprido: SupridoProfile) => {
      setSelectedSuprido(suprido);
      fetchSupridoStats(suprido.id);
  };

  const clearSelection = () => {
    setSelectedSuprido(null);
    setSupridoProcesses([]);
  }

  // Actions
  const toggleBlockStatus = async (supridoId: string, isBlocked: boolean, reason?: string) => {
      try {
          const { error } = await supabase.from('profiles').update({
              is_blocked: !isBlocked,
              blocking_reason: !isBlocked ? reason : null,
              blocked_at: !isBlocked ? new Date().toISOString() : null
          }).eq('id', supridoId);

          if (error) throw error;

          // Update local state
          if (selectedSuprido && selectedSuprido.id === supridoId) {
              setSelectedSuprido({ ...selectedSuprido, status: !isBlocked ? 'BLOCKED' : 'ACTIVE' });
          }
          
          return true;
      } catch (err) {
          console.error('Error toggling block:', err);
          return false;
      }
  };

  const addNote = async (supridoId: string, content: string, authorId: string) => {
      try {
          const { error } = await supabase.from('suprido_notes').insert({
              suprido_id: supridoId,
              author_id: authorId,
              content
          });
          
          if (error) throw error;
          return true;
      } catch (err) {
          console.error('Error adding note:', err);
          return false;
      }
  };
  
  const [notes, setNotes] = useState<any[]>([]);
  const fetchNotes = useCallback(async (supridoId: string) => {
       const { data } = await supabase
        .from('suprido_notes')
        .select('id, content, created_at, author:profiles!author_id(nome)')
        .eq('suprido_id', supridoId)
        .order('created_at', { ascending: false });
       
       setNotes(data || []);
  }, []);

  // Auto fetch notes when selecting
  useEffect(() => {
      if (selectedSuprido) {
          fetchNotes(selectedSuprido.id);
      } else {
          setNotes([]);
      }
  }, [selectedSuprido, fetchNotes]);

  return {
    searchResults,
    searchSupridos,
    selectedSuprido,
    supridoProcesses,
    notes,
    selectSuprido,
    clearSelection,
    toggleBlockStatus,
    addNote,
    isLoading,
    isStatsLoading
  };
};
