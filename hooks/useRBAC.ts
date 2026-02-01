import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface Role {
  id: string;
  code: string;
  name: string;
  description?: string;
  hierarchy_level: number;
  is_default: boolean;
  is_active: boolean;
}

export interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  is_active: boolean;
  granted_at: string;
  granted_by?: string;
  justification?: string;
  revoked_at?: string;
  revoked_by?: string;
  revocation_reason?: string;
  // Joined data
  role?: Role;
  granter_name?: string;
}

export interface UserWithRoles {
  id: string;
  email: string;
  nome: string;
  matricula?: string;
  cargo?: string;
  setor?: string;
  avatar_url?: string;
  ativo: boolean;
  roles: UserRole[];
}

export function useRBAC() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [usersWithRoles, setUsersWithRoles] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all available roles
  const fetchRoles = useCallback(async () => {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .eq('is_active', true)
      .order('hierarchy_level');
    
    if (error) {
      console.error('Error fetching roles:', error);
      return [];
    }
    return data || [];
  }, []);

  // Fetch all users with their assigned roles
  const fetchUsersWithRoles = useCallback(async () => {
    try {
      // First, get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, nome, matricula, cargo, setor, avatar_url, ativo')
        .order('nome');

      if (profilesError) throw profilesError;

      // Then get all active user_roles with role info
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select(`
          id,
          user_id,
          role_id,
          is_active,
          granted_at,
          granted_by,
          justification,
          revoked_at,
          roles (id, code, name, hierarchy_level)
        `)
        .eq('is_active', true);

      if (rolesError) throw rolesError;

      // Combine profiles with their roles
      const usersMap = new Map<string, UserWithRoles>();
      
      for (const profile of profiles || []) {
        usersMap.set(profile.id, {
          ...profile,
          roles: []
        });
      }

      for (const ur of userRoles || []) {
        const user = usersMap.get(ur.user_id);
        if (user) {
          user.roles.push({
            ...ur,
            role: ur.roles as unknown as Role
          });
        }
      }

      return Array.from(usersMap.values());
    } catch (err: any) {
      console.error('Error fetching users with roles:', err);
      throw err;
    }
  }, []);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [rolesData, usersData] = await Promise.all([
          fetchRoles(),
          fetchUsersWithRoles()
        ]);
        setRoles(rolesData);
        setUsersWithRoles(usersData);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar dados RBAC');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [fetchRoles, fetchUsersWithRoles]);

  // Grant role to user
  const grantRole = async (
    userId: string, 
    roleCode: string, 
    grantedBy: string,
    justification?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.rpc('grant_role', {
        p_user_id: userId,
        p_role_code: roleCode,
        p_granted_by: grantedBy,
        p_justification: justification || null
      });

      if (error) throw error;

      // Refresh data
      const usersData = await fetchUsersWithRoles();
      setUsersWithRoles(usersData);

      return { success: true };
    } catch (err: any) {
      console.error('Error granting role:', err);
      return { success: false, error: err.message };
    }
  };

  // Revoke role from user
  const revokeRole = async (
    userId: string, 
    roleCode: string, 
    revokedBy: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.rpc('revoke_role', {
        p_user_id: userId,
        p_role_code: roleCode,
        p_revoked_by: revokedBy,
        p_reason: reason || null
      });

      if (error) throw error;

      // Refresh data
      const usersData = await fetchUsersWithRoles();
      setUsersWithRoles(usersData);

      return { success: true };
    } catch (err: any) {
      console.error('Error revoking role:', err);
      return { success: false, error: err.message };
    }
  };

  // Check if user has specific role
  const userHasRole = (userId: string, roleCode: string): boolean => {
    const user = usersWithRoles.find(u => u.id === userId);
    if (!user) return false;
    return user.roles.some(r => r.role?.code?.toUpperCase() === roleCode.toUpperCase());
  };

  // Get role stats
  const getRoleStats = (): Record<string, number> => {
    const stats: Record<string, number> = {};
    for (const role of roles) {
      stats[role.code] = usersWithRoles.filter(u => 
        u.roles.some(r => r.role?.code === role.code)
      ).length;
    }
    return stats;
  };

  return {
    roles,
    usersWithRoles,
    loading,
    error,
    grantRole,
    revokeRole,
    userHasRole,
    getRoleStats,
    refresh: async () => {
      const usersData = await fetchUsersWithRoles();
      setUsersWithRoles(usersData);
    }
  };
}
