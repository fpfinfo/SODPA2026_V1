// ============================================================================
// useSODPAStats - Hook for fetching SODPA dashboard statistics
// Provides aggregated metrics for management dashboard
// ============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface SODPAStats {
  // Totals by status
  totalPendente: number;
  totalEmAnalise: number;
  totalAprovados: number;
  totalDevolvidos: number;
  totalConcluidos: number;
  
  // Time metrics
  avgProcessingDays: number;
  
  // Volume metrics
  totalThisMonth: number;
  totalLastMonth: number;
  growthPercent: number;
  
  // Value metrics
  totalValuePending: number;
  totalValueApproved: number;
  
  // By type
  countDiarias: number;
  countPassagens: number;
  
  // SLA metrics
  withinSLA: number;
  overdueSLA: number;
}

export interface LocationStats {
  municipio: string;
  count: number;
  value: number;
}

export const useSODPAStats = () => {
  const [stats, setStats] = useState<SODPAStats | null>(null);
  const [topLocations, setTopLocations] = useState<LocationStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

      // Fetch all requests for aggregation
      const { data: requests, error: fetchError } = await supabase
        .from('sodpa_requests')
        .select('id, status, tipo, valor_total, solicitante_municipio, created_at, updated_at');

      if (fetchError) throw fetchError;

      const allRequests = requests || [];

      // Calculate status totals
      const statusCounts = allRequests.reduce((acc, r) => {
        const status = (r.status || '').toUpperCase();
        if (status.includes('PENDENTE') || status === 'NOVO') acc.pendente++;
        else if (status.includes('ANALISE')) acc.emAnalise++;
        else if (status.includes('APROVADO')) acc.aprovados++;
        else if (status.includes('DEVOLVIDO')) acc.devolvidos++;
        else if (status.includes('CONCLUIDO')) acc.concluidos++;
        return acc;
      }, { pendente: 0, emAnalise: 0, aprovados: 0, devolvidos: 0, concluidos: 0 });

      // Calculate type counts
      const typeCounts = allRequests.reduce((acc, r) => {
        if (r.tipo === 'DIARIA') acc.diarias++;
        else if (r.tipo === 'PASSAGEM') acc.passagens++;
        return acc;
      }, { diarias: 0, passagens: 0 });

      // Calculate value totals
      const valueTotals = allRequests.reduce((acc, r) => {
        const status = (r.status || '').toUpperCase();
        const value = r.valor_total || 0;
        if (status.includes('PENDENTE') || status.includes('ANALISE')) {
          acc.pending += value;
        }
        if (status.includes('APROVADO') || status.includes('CONCLUIDO')) {
          acc.approved += value;
        }
        return acc;
      }, { pending: 0, approved: 0 });

      // Calculate monthly volumes
      const thisMonth = allRequests.filter(r => r.created_at >= startOfMonth);
      const lastMonth = allRequests.filter(r => 
        r.created_at >= startOfLastMonth && r.created_at <= endOfLastMonth
      );

      const growthPercent = lastMonth.length > 0 
        ? ((thisMonth.length - lastMonth.length) / lastMonth.length) * 100 
        : 0;

      // Calculate average processing time (for completed requests)
      const completedRequests = allRequests.filter(r => 
        r.status?.toUpperCase().includes('CONCLUIDO') || r.status?.toUpperCase().includes('APROVADO')
      );
      
      let avgDays = 0;
      if (completedRequests.length > 0) {
        const totalDays = completedRequests.reduce((acc, r) => {
          const created = new Date(r.created_at);
          const updated = new Date(r.updated_at);
          const diffDays = Math.ceil((updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
          return acc + diffDays;
        }, 0);
        avgDays = Math.round(totalDays / completedRequests.length);
      }

      // Calculate SLA (assuming 5-day SLA)
      const SLA_DAYS = 5;
      const pendingRequests = allRequests.filter(r => 
        r.status?.toUpperCase().includes('PENDENTE') || r.status?.toUpperCase().includes('ANALISE')
      );
      
      const slaCounts = pendingRequests.reduce((acc, r) => {
        const created = new Date(r.created_at);
        const diffDays = Math.ceil((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= SLA_DAYS) acc.within++;
        else acc.overdue++;
        return acc;
      }, { within: 0, overdue: 0 });

      // Calculate top locations
      const locationMap = new Map<string, { count: number; value: number }>();
      allRequests.forEach(r => {
        const municipio = r.solicitante_municipio || 'Não informado';
        const current = locationMap.get(municipio) || { count: 0, value: 0 };
        current.count++;
        current.value += r.valor_total || 0;
        locationMap.set(municipio, current);
      });

      const sortedLocations = Array.from(locationMap.entries())
        .map(([municipio, data]) => ({ municipio, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      setTopLocations(sortedLocations);

      setStats({
        totalPendente: statusCounts.pendente,
        totalEmAnalise: statusCounts.emAnalise,
        totalAprovados: statusCounts.aprovados,
        totalDevolvidos: statusCounts.devolvidos,
        totalConcluidos: statusCounts.concluidos,
        avgProcessingDays: avgDays,
        totalThisMonth: thisMonth.length,
        totalLastMonth: lastMonth.length,
        growthPercent: Math.round(growthPercent * 10) / 10,
        totalValuePending: valueTotals.pending,
        totalValueApproved: valueTotals.approved,
        countDiarias: typeCounts.diarias,
        countPassagens: typeCounts.passagens,
        withinSLA: slaCounts.within,
        overdueSLA: slaCounts.overdue
      });

    } catch (err) {
      console.error('Error fetching SODPA stats:', err);
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Derived: Total active
  const totalActive = useMemo(() => {
    if (!stats) return 0;
    return stats.totalPendente + stats.totalEmAnalise;
  }, [stats]);

  // Derived: SLA compliance percentage
  const slaCompliancePercent = useMemo(() => {
    if (!stats) return 100;
    const total = stats.withinSLA + stats.overdueSLA;
    if (total === 0) return 100;
    return Math.round((stats.withinSLA / total) * 100);
  }, [stats]);

  return {
    stats,
    topLocations,
    isLoading,
    error,
    // Derived
    totalActive,
    slaCompliancePercent,
    // Actions
    refresh: fetchStats
  };
};

export default useSODPAStats;
