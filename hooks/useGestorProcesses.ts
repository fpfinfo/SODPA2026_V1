import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

export interface GestorProcess {
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

export function useGestorProcesses() {
  return useQuery({
    queryKey: ['gestor-processes'],
    queryFn: async () => {
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
          itens_despesa,
          juri_participantes,
          user_id,
          profiles!solicitacoes_user_id_fkey (
            nome
          )
        `)
        .eq('destino_atual', 'GESTOR')
        .or('status.eq.PENDENTE ATESTO,status_workflow.eq.PC_SUBMITTED') // Atesto concessão OU Atesto PC
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data for display
      const transformed: GestorProcess[] = ((data || []) as any[]).map(s => {
        const profileName = Array.isArray(s.profiles) 
          ? s.profiles[0]?.nome 
          : s.profiles?.nome;
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
          rawData: s
        };
      });

      return transformed;
    },
    staleTime: 30 * 1000,
  });
}

export function useGestorKPIs() {
  return useQuery({
    queryKey: ['gestor-kpis'],
    queryFn: async () => {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // Count atestados (GESTOR -> SOSFU)
      const { count: atestadosCount } = await supabase
        .from('historico_tramitacao')
        .select('*', { count: 'exact', head: true })
        .eq('origem', 'GESTOR')
        .eq('destino', 'SOSFU')
        .gte('data_tramitacao', firstDayOfMonth);

      // Count devolutions (GESTOR -> SUPRIDO)
      const { count: devolucoesCount } = await supabase
        .from('historico_tramitacao')
        .select('*', { count: 'exact', head: true })
        .eq('origem', 'GESTOR')
        .eq('destino', 'SUPRIDO')
        .gte('data_tramitacao', firstDayOfMonth);

      return {
        atestadosNoMes: atestadosCount || 0,
        devolucoes: devolucoesCount || 0,
      };
    },
    staleTime: 60 * 1000, // 1 minute for KPIs
  });
}
