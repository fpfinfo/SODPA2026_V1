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
      // Fetch SODPA team members from profiles
      const { data: servidores, error: servidoresError } = await supabase
        .from('profiles')
        .select('id, email, nome, cargo, setor, avatar_url, capacidade_diaria, ativo')
        .eq('setor', 'SODPA')
        .eq('ativo', true)
        .order('nome');

      if (servidoresError) throw servidoresError;

      // Fetch task counts per member
      const membersWithStats: TeamMemberWithStats[] = await Promise.all(
        (servidores || []).map(async (s) => {
          // Count diárias assigned (not completed)
          const { data: diariasData, count: diariasCount } = await supabase
            .from('diarias')
            .select('created_at', { count: 'exact' })
            .eq('assigned_to_id', s.id)
            .not('status', 'in', '("PAGA","CANCELADA")');

          // Count passagens assigned (not completed)
          const { data: passagensData, count: passagensCount } = await supabase
            .from('passagens')
            .select('created_at', { count: 'exact' })
            .eq('assigned_to_id', s.id)
            .not('status', 'in', '("UTILIZADA","CANCELADA")');

          // Calculate SLA overdue (5 business days = ~7 calendar days)
          const SLA_DAYS = 7;
          const now = new Date();
          let overdueCount = 0;
          (diariasData || []).forEach((d: any) => {
            const created = new Date(d.created_at);
            const diffDays = Math.ceil((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays > SLA_DAYS) overdueCount++;
          });
          (passagensData || []).forEach((p: any) => {
            const created = new Date(p.created_at);
            const diffDays = Math.ceil((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays > SLA_DAYS) overdueCount++;
          });

          const totalTasks = (diariasCount || 0) + (passagensCount || 0);
          const capacidade = s.capacidade_diaria || 10;
          const ocupacao = Math.round((totalTasks / capacidade) * 100);

          return {
            id: s.id,
            nome: s.nome,
            email: s.email,
            funcao: s.cargo || 'ANALISTA',  // cargo vem do DB, funcao é o campo do tipo
            avatarUrl: s.avatar_url,
            capacidadeDiaria: capacidade,
            taskCount: totalTasks,
            atrasados: overdueCount,
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
      .from('profiles')
      .update({ capacidade_diaria: newCapacity })
      .eq('id', memberId);

    if (error) throw error;
    await fetchTeamMembers();
  }, [fetchTeamMembers]);

  // Add existing user to SODPA team (UPDATE, not INSERT)
  const addMember = useCallback(async (data: Omit<TeamMember, 'id'>) => {
    try {
      console.log('🔵 [useSODPATeamMembers] Iniciando addMember:', {
        email: data.email,
        nome: data.nome,
        funcao: data.funcao,
        setor: data.setor
      });

      // The user already exists in profiles, we just update their setor
      const { data: result, error, count } = await supabase
        .from('profiles')
        .update({
          cargo: data.funcao,  // funcao do tipo → cargo no DB
          setor: 'SODPA',
          ativo: true,
        })
        .eq('email', data.email)  // Find by email
        .select();  // Return updated row(s)

      console.log('📊 [useSODPATeamMembers] Resultado do UPDATE:', {
        result,
        error,
        count,
        rowsAffected: result?.length || 0
      });

      if (error) {
        console.error('❌ [useSODPATeamMembers] Erro no UPDATE:', error);
        throw error;
      }

      if (!result || result.length === 0) {
        const msg = `Usuário com email "${data.email}" não encontrado no banco de dados.`;
        console.error('⚠️ [useSODPATeamMembers]', msg);
        throw new Error(msg);
      }

      console.log('✅ [useSODPATeamMembers] Usuário atualizado com sucesso:', result[0]);
      
      await fetchTeamMembers();
      return { success: true, data: result[0] };
    } catch (err) {
      console.error('💥 [useSODPATeamMembers] Error adding member:', err);
      return { success: false, error: err };
    }
  }, [fetchTeamMembers]);

  // Update member
  const updateMember = useCallback(async (id: string, data: Partial<TeamMember>) => {
    try {
      // Map funcao to cargo for database
      const dbData = {
        ...data,
        cargo: data.funcao,  // funcao do tipo → cargo no DB
      };
      delete dbData.funcao;  // Remove funcao antes de enviar ao DB
      
      const { error } = await supabase
        .from('profiles')
        .update(dbData)
        .eq('id', id);

      if (error) throw error;
      await fetchTeamMembers();
      return { success: true };
    } catch (err) {
      console.error('Error updating member:', err);
      return { success: false, error: err };
    }
  }, [fetchTeamMembers]);

  // Remove member from team (reset setor)
  const removeMember = useCallback(async (id: string) => {
    try {
      console.log('🗑️ [useSODPATeamMembers] Removendo membro da equipe:', id);
      
      // Reset setor para null (ou outro valor default)
      const { error } = await supabase
        .from('profiles')
        .update({ 
          setor: null,  // Remove da equipe
          cargo: null   // Limpa cargo também
        })
        .eq('id', id);

      if (error) {
        console.error('❌ Erro ao remover membro:', error);
        throw error;
      }
      
      console.log('✅ Membro removido da equipe SODPA');
      await fetchTeamMembers();
      return { success: true };
    } catch (err) {
      console.error('💥 Error removing member:', err);
      return { success: false, error: err };
    }
  }, [fetchTeamMembers]);

  // Toggle Status
  const toggleStatus = useCallback(async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ ativo: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      await fetchTeamMembers();
      return { success: true };
    } catch (err) {
      console.error('Error toggling status:', err);
      return { success: false, error: err };
    }
  }, [fetchTeamMembers]);

  return {
    members,
    loading,
    error,
    refetch: fetchTeamMembers,
    getMemberById,
    getAvailableMembers,
    updateCapacity,
    addMember,
    updateMember,
    toggleStatus,
    removeMember  // ✅ Nova função
  };
}
