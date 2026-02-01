import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/AuthContext';

export interface SODPARequest {
  id: string;
  tipo: 'DIARIA' | 'PASSAGEM';
  status: string;
  nup?: string;
  solicitante_nome: string;
  solicitante_email: string;
  solicitante_lotacao: string;
  tipo_destino: string;
  origem: string;
  destino: string;
  data_inicio: string;
  data_fim: string;
  dias: number;
  motivo: string;
  valor_diaria?: number;
  valor_total?: number;
  assinatura_digital: boolean;
  data_assinatura?: string;
  destino_atual: string;
  created_at: string;
}

// Hook for user's SODPA requests (viewer: the requester)
export function useSODPAMyRequests() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['sodpa-my-requests', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('sodpa_requests')
        .select('*')
        .eq('solicitante_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return (data || []) as SODPARequest[];
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  });
}

// Hook for SODPA inbox (viewer: SODPA analysts)
export function useSODPAInbox() {
  return useQuery({
    queryKey: ['sodpa-inbox'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sodpa_requests')
        .select('*')
        .eq('destino_atual', 'SODPA')
        .eq('status', 'ENVIADO')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []) as SODPARequest[];
    },
    staleTime: 30 * 1000,
  });
}

// Hook for SODPA stats
export function useSODPAStats() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['sodpa-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return { pending: 0, approved: 0, pendingPC: 0, total: 0 };

      const { data, error } = await supabase
        .from('sodpa_requests')
        .select('status')
        .eq('solicitante_id', user.id);

      if (error) throw error;

      const requests = data || [];
      
      return {
        pending: requests.filter(r => ['ENVIADO', 'EM_ANALISE'].includes(r.status)).length,
        approved: requests.filter(r => ['APROVADO', 'CONCLUIDO'].includes(r.status)).length,
        pendingPC: requests.filter(r => r.status === 'AGUARDANDO_PRESTACAO').length,
        total: requests.length
      };
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  });
}
