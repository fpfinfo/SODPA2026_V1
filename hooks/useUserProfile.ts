import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { AppRole } from '../types';

export interface UserProfile {
  id: string;
  email: string;
  nome: string;
  cpf?: string;
  matricula?: string;
  cargo?: string;
  vinculo?: string;
  lotacao?: string;
  municipio?: string;
  avatar_url?: string | null;
  telefone?: string;
  banco?: string;
  agencia?: string;
  conta_corrente?: string;
  gestor_nome?: string;
  gestor_email?: string;
  role?: string;
  signature_pin?: string;
  _source: 'servidores_tj' | 'profiles' | 'auth_only';
}

interface UseUserProfileResult {
  userProfile: UserProfile | null;
  loading: boolean;
  error: Error | null;
  refetchUser: () => Promise<void>;
}

export function useUserProfile(user: { id?: string; email?: string } | null): UseUserProfileResult & { initialRole: AppRole | null } {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [initialRole, setInitialRole] = useState<AppRole | null>(null);

  const fetchUser = useCallback(async () => {
    // 1. Strict Guard Clauses
    if (!user || !user.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const currentUserId = user.id;
      const userEmail = user.email;

      // Fetch from profiles by ID (single source of truth)
      const profileResponse = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUserId)
        .maybeSingle();

      const profileData = profileResponse.data;

      // Build merged profile using profiles data
      if (profileData) {
        const mergedProfile: UserProfile = {
          ...profileData,
          id: currentUserId || profileData.id,
          nome: profileData.nome || 'Usuário',
          email: userEmail || profileData.email || '',
          cpf: profileData.cpf,
          matricula: profileData.matricula,
          cargo: profileData.cargo,
          vinculo: profileData.vinculo,
          lotacao: profileData.lotacao,
          municipio: profileData.municipio,
          avatar_url: profileData.avatar_url,
          telefone: profileData.telefone,
          banco: profileData.banco,
          agencia: profileData.agencia,
          conta_corrente: profileData.conta_corrente,
          gestor_nome: profileData.gestor_nome,
          gestor_email: profileData.gestor_email,
          role: profileData.role || 'USER',
          signature_pin: profileData.signature_pin,
          _source: 'profiles',
        };

        setUserProfile(mergedProfile);

        // ✅ CORREÇÃO: Buscar role do RBAC (user_roles), não de profiles.role
        console.log('🔍 [DEBUG] Buscando role do RBAC para user:', currentUserId);
        
        const { data: userRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select(`
            role_id,
            roles (
              id,
              name,
              description
            )
          `)
          .eq('user_id', currentUserId);

        if (rolesError) {
          console.error('❌ Erro ao buscar roles:', rolesError);
        }

        console.log('📊 [DEBUG] User roles encontradas:', userRoles);

        // Determinar role principal (primeira role encontrada)
        let primaryRoleName: string | null = null;
        
        if (userRoles && userRoles.length > 0) {
          // Pegar a primeira role
          const firstRole = userRoles[0].roles as any;
          primaryRoleName = firstRole?.name || null;
          console.log('✅ [DEBUG] Role principal do RBAC:', primaryRoleName);
        } else {
          console.warn('⚠️ [DEBUG] Nenhuma role RBAC encontrada, usando profiles.role como fallback');
          primaryRoleName = profileData.role;
        }

        // Mapear nome da role para AppRole
        const rawRole = primaryRoleName?.toUpperCase();
        

        console.log('🔍 [DEBUG] Profile Data:', {
          profileData_role: profileData?.role,
          rawRole,
          email: userEmail
        });
        
        
        // Map RBAC role names AND legacy roles to valid AppRole values
        const legacyRoleMap: Record<string, AppRole> = {
          // ✅ RBAC Role Names (nomes reais da tabela roles)
          'EQUIPE TÉCNICA SODPA': AppRole.SODPA,
          'SECRETARIA DE FINANÇAS': AppRole.SEFIN,
          'ASSESSORIA JURÍDICA': AppRole.AJSEFIN,
          'GESTÃO DE PESSOAS': AppRole.SGP,
          'PRESIDÊNCIA': AppRole.PRESIDENCIA,
          'ADMINISTRADOR': AppRole.SODPA,  // Admin tem acesso a tudo, default SODPA
          'SERVIDOR/MAGISTRADO': AppRole.USER,  // ✅ Servidores básicos são USER
          
          // Direct matches (sistema SODPA2026)
          'USER': AppRole.USER,
          'SUPRIDO': AppRole.USER,  // Compatibilidade legado
          'GESTOR': AppRole.GESTOR,
          'SEFIN': AppRole.SEFIN,
          'AJSEFIN': AppRole.AJSEFIN,
          'SGP': AppRole.SGP,
          'SODPA': AppRole.SODPA,
          'PRESIDENCIA': AppRole.PRESIDENCIA,
          
          // ❌ SOSFU removido - não faz parte do SODPA2026
          // Legacy mappings para campos antigos → USER
          'SOSFU': AppRole.USER,  // ✅ SOSFU legado → USER
          'CHEFE_SOSFU': AppRole.GESTOR,
          'CHEFE': AppRole.GESTOR,
          'ORDENADOR': AppRole.SEFIN,
          'MAGISTRADO': AppRole.GESTOR,
          'JUIZ': AppRole.GESTOR,
          'ANALISTA': AppRole.USER,  // ✅ ANALISTA legado → USER
        };
        
        
        const mappedRole = rawRole ? legacyRoleMap[rawRole] : undefined;
        console.log('✅ [useUserProfile] Role Mapping:', {
          rbacRole: primaryRoleName,
          profilesRole: profileData?.role,
          rawRole,
          mappedRole,
          source: userRoles && userRoles.length > 0 ? 'RBAC' : 'profiles.role'
        });
        
        
        if (mappedRole) {
            console.log('✅ Setting initialRole to:', mappedRole);
            setInitialRole(mappedRole);
        } else {
            // Fallback: se não há role RBAC válido, usa USER (perfil padrão)
            console.warn('⚠️ [useUserProfile] Invalid or missing role:', rawRole, ', defaulting to USER');
            setInitialRole(AppRole.USER);
        }

      } else {
        // Fallback
        // Only warn if we had a valid ID but found nothing
        if (userEmail) {
             console.warn('No profile data found for:', userEmail);
        }
        
        setUserProfile({
          id: currentUserId,
          email: userEmail || '',
          nome: userEmail?.split('@')[0] || 'Usuário',
          _source: 'auth_only'
        });
      }
    } catch (err: any) {
      console.error('Profile fetch error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.email]); // Dependencies: only re-run if ID or Email changes

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return { userProfile, loading, error, refetchUser: fetchUser, initialRole };
}
