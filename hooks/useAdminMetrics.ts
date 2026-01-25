import { supabase } from '../lib/supabaseClient';

export interface AdminMetrics {
  totalUsers: number;
  totalComarcas: number;
  totalProcessos: number;
  totalFinanceiro: number;
  alertasSistema: number;
  servicesStatus: {
    database: 'ONLINE' | 'OFFLINE';
    storage: 'ONLINE' | 'OFFLINE';
    apiSefaz: 'ONLINE' | 'OFFLINE';
  }
}

export async function fetchAdminMetrics(): Promise<AdminMetrics> {
  // Simulando fetch de métricas (em prod seria via RPC ou queries otimizadas)
  // 1. Users
  const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
  
  // 2. Comarcas
  const { count: comarcasCount } = await supabase.from('comarcas').select('*', { count: 'exact', head: true });

  // 3. Processos Ativos
  const { count: pcsCount } = await supabase.from('prestacao_contas').select('*', { count: 'exact', head: true });

  // 4. Financeiro (Mock por enquanto, idealmente RPC)
  const financeiro = 1450000; // R$ 1.45M

  return {
    totalUsers: usersCount || 0,
    totalComarcas: comarcasCount || 0,
    totalProcessos: pcsCount || 0,
    totalFinanceiro: financeiro,
    alertasSistema: 0,
    servicesStatus: {
      database: 'ONLINE',
      storage: 'ONLINE',
      apiSefaz: 'ONLINE' // Mock
    }
  };
}
