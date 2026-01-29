// ============================================================================
// SODPA - Hook de Gestão da Equipe Técnica
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { TeamMember } from '../types';

export interface TeamMemberWithStats extends TeamMember {
  ocupacaoPercent: number;
  processosAtribuidos: {
    diarias: number;
    passagens: number;
  };
}

export function useSODPATeamMembers() {
  const [members, setMembers] = useState<TeamMemberWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeamMembers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch SODPA team members from servidores_tj
      const { data: servidores, error: servidoresError } = await supabase
        .from('servidores_tj')
        .select('id, user_id, nome, email, funcao, setor, avatar_url, capacidade_diaria, ativo')
        .eq('setor', 'SODPA')
        .eq('ativo', true)
        .order('nome');

      if (servidoresError) throw servidoresError;

      // Fetch task counts per member
      const membersWithStats: TeamMemberWithStats[] = await Promise.all(
        (servidores || []).map(async (s) => {
          // Count diárias assigned (not completed)
          const { count: diariasCount } = await supabase
            .from('diarias')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to_id', s.user_id || s.id)
            .not('status', 'in', '("PAGA","CANCELADA")');

          // Count passagens assigned (not completed)
          const { count: passagensCount } = await supabase
            .from('passagens')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to_id', s.user_id || s.id)
            .not('status', 'in', '("UTILIZADA","CANCELADA")');

          // Count overdue items (simplified - would need SLA field)
          const totalTasks = (diariasCount || 0) + (passagensCount || 0);
          const capacidade = s.capacidade_diaria || 10;
          const ocupacao = Math.round((totalTasks / capacidade) * 100);

          return {
            id: s.id,
            nome: s.nome,
            email: s.email,
            funcao: s.funcao || 'ANALISTA',
            avatarUrl: s.avatar_url,
            capacidadeDiaria: capacidade,
            taskCount: totalTasks,
            atrasados: 0, // TODO: Implementar cálculo de SLA
            setor: s.setor,
            ativo: s.ativo,
            ocupacaoPercent: Math.min(ocupacao, 100),
            processosAtribuidos: {
              diarias: diariasCount || 0,
              passagens: passagensCount || 0,
            },
          };
        })
      );

      setMembers(membersWithStats);
    } catch (err) {
      console.error('Erro ao carregar equipe SODPA:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar equipe');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeamMembers();
  }, [fetchTeamMembers]);

  // Get member by ID
  const getMemberById = useCallback((id: string) => 
    members.find(m => m.id === id),
    [members]
  );

  // Get available members (with capacity)
  const getAvailableMembers = useCallback(() =>
    members.filter(m => m.ocupacaoPercent < 80),
    [members]
  );

  // Update member capacity
  const updateCapacity = useCallback(async (memberId: string, newCapacity: number) => {
    const { error } = await supabase
      .from('servidores_tj')
      .update({ capacidade_diaria: newCapacity })
      .eq('id', memberId);

    if (error) throw error;
    await fetchTeamMembers();
  }, [fetchTeamMembers]);

  return {
    members,
    loading,
    error,
    refetch: fetchTeamMembers,
    getMemberById,
    getAvailableMembers,
    updateCapacity,
  };
}
