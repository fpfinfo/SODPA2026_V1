import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

export interface SupridoProcess {
  id: string;
  nup: string;
  type: string;
  interested: string;
  val: number;
  date: string;
  status: string;
  desc: string;
  items: any[];
  rawData: any;
}

export function useSupridoProcesses(userId?: string) {
  return useQuery({
    queryKey: ['suprido-processes', userId],
    queryFn: async () => {
      let query = supabase
        .from('solicitacoes')
        .select(`
          id,
          nup,
          tipo,
          valor_solicitado,
          status,
          descricao,
          created_at,
          itens_despesa,
          juri_participantes,
          user_id,
          profiles!solicitacoes_user_id_fkey (
            nome
          )
        `)
        .eq('status', 'PENDENTE ATESTO')
        .eq('destino_atual', 'SUPRIDO')
        .order('created_at', { ascending: false });

      // If userId is provided, filter by user
      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const transformed: SupridoProcess[] = (data || []).map((s: any) => {
        const profileName = Array.isArray(s.profiles) ? s.profiles[0]?.nome : s.profiles?.nome;
        return {
          id: s.id,
          nup: s.nup,
          type: s.tipo === 'JURI' ? 'SESSÃO DE JÚRI' : 'EXTRA-EMERGENCIAL',
          interested: profileName || 'N/A',
          val: s.valor_solicitado || 0,
          date: new Date(s.created_at).toLocaleDateString('pt-BR'),
          status: s.status,
          desc: s.descricao || 'Sem descrição',
          items: s.itens_despesa || [],
          rawData: s,
        };
      });

      return transformed;
    },
    staleTime: 30 * 1000,
  });
}

// Hook for user's historical processes (all statuses)
export function useSupridoHistory(userId?: string) {
  return useQuery({
    queryKey: ['suprido-history', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('solicitacoes')
        .select(`
          id,
          nup,
          tipo,
          valor_solicitado,
          status,
          status_workflow,
          descricao,
          created_at,
          destino_atual,
          data_inicio,
          data_fim
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return (data || []).map((s: any) => ({
        id: s.id,
        nup: s.nup,
        type: s.tipo === 'JURI' ? 'SESSÃO DE JÚRI' : 'EXTRA-EMERGENCIAL',
        val: s.valor_solicitado || 0,
        date: new Date(s.created_at).toLocaleDateString('pt-BR'),
        status: s.status,
        status_workflow: s.status_workflow,
        desc: s.descricao || 'Sem descrição',
        destino: s.destino_atual,
        data_fim: s.data_fim,
        created_at: s.created_at
      }));
    },
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
}

// Hook para processos prontos para PRESTAÇÃO DE CONTAS
// Busca processos onde o suprido já confirmou o recebimento do recurso
export function useSupridoAccountability(userId?: string) {
  return useQuery({
    queryKey: ['suprido-accountability', userId],
    queryFn: async () => {
      if (!userId) return [];

      // Buscar processos com status_workflow = ACCOUNTABILITY_OPEN
      const { data, error } = await supabase
        .from('solicitacoes')
        .select(`
          id,
          nup,
          tipo,
          valor_solicitado,
          status,
          status_workflow,
          descricao,
          created_at,
          data_credito,
          data_inicio,
          data_fim
        `)
        .eq('user_id', userId)
        .eq('status_workflow', 'ACCOUNTABILITY_OPEN')
        .order('data_credito', { ascending: false });

      if (error) throw error;

      return (data || []).map((s: any) => ({
        id: s.id,
        nup: s.nup,
        type: s.tipo === 'JURI' ? 'SESSÃO DE JÚRI' : 'EXTRA-EMERGENCIAL',
        val: s.valor_solicitado || 0,
        date: new Date(s.created_at).toLocaleDateString('pt-BR'),
        data_credito: s.data_credito,
        status: s.status,
        status_workflow: s.status_workflow,
        desc: s.descricao || 'Sem descrição',
        data_inicio: s.data_inicio,
        data_fim: s.data_fim,
        // Calcular dias restantes para prestação (90 dias a partir do crédito)
        diasRestantes: s.data_credito 
          ? Math.max(0, 90 - Math.floor((Date.now() - new Date(s.data_credito).getTime()) / (1000 * 60 * 60 * 24)))
          : 90
      }));
    },
    enabled: !!userId,
    staleTime: 30 * 1000, // Atualiza a cada 30s
  });
}
