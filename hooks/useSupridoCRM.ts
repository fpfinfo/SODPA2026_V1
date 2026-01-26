
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

// Standalone fetch function for use outside hook
export const fetchSupridoStats = async (supridoId: string) => {
    try {
        // 1. Fetch raw solicitacoes data (limited columns)
        const { data: processes, error } = await supabase
            .from('solicitacoes')
            .select('id, nup, status, valor_total, created_at, deadline_pc, data_prestacao_contas, status_workflow, type')
            .eq('user_id', supridoId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const total = processes?.length || 0;
        const totalVal = processes?.reduce((acc, p) => acc + (p.valor_total || 0), 0) || 0;
        
        // Calculate Risk Factors
        let lateCount = 0;
        let returnedCount = 0;
        const glosaCount = 0; 
        
        const openCount = processes?.filter(p => !['ARQUIVADO', 'CONCLUIDO'].includes(p.status)).length || 0;

        processes?.forEach(p => {
             if (p.deadline_pc && p.status === 'PRESTANDO CONTAS') {
                 if (new Date(p.deadline_pc) < new Date()) lateCount++;
             }
             if (p.status === 'DEVOLVIDO') returnedCount++;
        });

        const risk = calculateRiskScore({
            totalProcesses: total,
            latePCs: lateCount,
            returnedProcesses: returnedCount,
            glosas: glosaCount
        });

        return {
            total_processes: total,
            total_value: totalVal,
            avg_pc_days: 15,
            open_processes: openCount,
            risk,
            processes: processes || [] // useful to return raw data too
        };

    } catch (err) {
        console.error('Error fetching stats:', err);
        throw err;
    }
};

export const useSupridoCRM = () => {
  const [searchResults, setSearchResults] = useState<SupridoProfile[]>([]);
  const [selectedSuprido, setSelectedSuprido] = useState<SupridoProfile | null>(null);
  const [supridoProcesses, setSupridoProcesses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStatsLoading, setIsStatsLoading] = useState(false);

  // Search by name, cpf, or email
  const searchSupridos = useCallback(async (query: string) => {
    if (!query || query.length < 3) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nome, cpf, email, cargo, lotacao:lotacoes(nome)')
        .or(`nome.ilike.%${query}%,cpf.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;

      const results: SupridoProfile[] = data.map((p: any) => ({
        id: p.id,
        nome: p.nome,
        cpf: p.cpf,
        email: p.email,
        cargo: p.cargo,
        lotacao: p.lotacao?.nome || 'Não informada',
        status: 'ACTIVE',
      }));

      setSearchResults(results);
    } catch (err) {
      console.error('Error searching supridos:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch detailed stats using standalone function and update state
  const loadSupridoStats = useCallback(async (supridoId: string) => {
    setIsStatsLoading(true);
    try {
        const stats = await fetchSupridoStats(supridoId);
        
        setSupridoProcesses(stats.processes);

        // Update selected suprido with stats
        setSelectedSuprido(prev => prev ? ({
            ...prev,
            stats: {
                total_processes: stats.total_processes,
                total_value: stats.total_value,
                avg_pc_days: stats.avg_pc_days,
                open_processes: stats.open_processes,
                risk: stats.risk
            }
        }) : null);

    } catch (err) {
        // Error logged in fetchSupridoStats
    } finally {
        setIsStatsLoading(false);
    }
  }, []);

  const selectSuprido = (suprido: SupridoProfile) => {
      setSelectedSuprido(suprido);
      // We pass the ID explicitly or assume suprido.id
      loadSupridoStats(suprido.id);
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
