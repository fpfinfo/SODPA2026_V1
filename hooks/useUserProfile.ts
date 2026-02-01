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

      // Parallel Data Fetching
      const [servidorResponse, profileResponse] = await Promise.all([
        // 1. Fetch from servidor_tj by email (only if email exists)
        userEmail 
          ? supabase
              .from('servidores_tj')
              .select('*')
              .ilike('email', userEmail)
              .eq('ativo', true)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        
        // 2. Fetch from profiles by ID
        supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUserId)
          .maybeSingle()
      ]);

      const servidorData = servidorResponse.data;
      const profileData = profileResponse.data;

      // Build merged profile prioritizing servidores_tj data
      if (servidorData || profileData) {
        const mergedProfile: UserProfile = {
          // Start with profile data if exists
          ...(profileData || {}),
          // Override with servidores_tj data (authoritative source)
          id: currentUserId || profileData?.id,
          nome: servidorData?.nome || profileData?.nome || 'Usuário',
          email: servidorData?.email || userEmail || profileData?.email || '',
          cpf: servidorData?.cpf || profileData?.cpf,
          matricula: servidorData?.matricula || profileData?.matricula,
          cargo: servidorData?.cargo || profileData?.cargo,
          lotacao: servidorData?.lotacao || profileData?.lotacao,
          municipio: servidorData?.municipio || profileData?.municipio,
          avatar_url: servidorData?.avatar_url || profileData?.avatar_url,
          telefone: servidorData?.telefone || profileData?.telefone,
          banco: servidorData?.banco || profileData?.banco,
          agencia: servidorData?.agencia || profileData?.agencia,
          conta_corrente: servidorData?.conta_corrente || profileData?.conta_corrente,
          gestor_nome: servidorData?.gestor_nome || profileData?.gestor_nome,
          gestor_email: servidorData?.gestor_email || profileData?.gestor_email,
          role: profileData?.role || servidorData?.role || 'SUPRIDO',
          signature_pin: profileData?.signature_pin,
          _source: servidorData ? 'servidores_tj' : 'profiles',
        };

        setUserProfile(mergedProfile);

        // Determine Initial Role with legacy role mapping
        const rawRole = (profileData?.role || servidorData?.role)?.toUpperCase();
        
        // Map legacy roles to valid AppRole values
        const legacyRoleMap: Record<string, AppRole> = {
          // Direct matches (already valid)
          'SUPRIDO': AppRole.SUPRIDO,
          'GESTOR': AppRole.GESTOR,
          'SOSFU': AppRole.SOSFU,
          'SEFIN': AppRole.SEFIN,
          'AJSEFIN': AppRole.AJSEFIN,
          'SGP': AppRole.SGP,
          'SODPA': AppRole.SODPA,
          'PRESIDENCIA': AppRole.PRESIDENCIA,
          // Legacy mappings for roles stored in old format
          'CHEFE_SOSFU': AppRole.GESTOR,  // Chefe da SOSFU atua como Gestor
          'CHEFE': AppRole.GESTOR,         // Chefes são gestores
          'ORDENADOR': AppRole.SEFIN,      // Ordenadores atuam no módulo SEFIN
          'MAGISTRADO': AppRole.GESTOR,    // Magistrados são gestores de comarca
          'JUIZ': AppRole.GESTOR,          // Juízes são gestores de comarca
          'ANALISTA': AppRole.SOSFU,       // Analistas genéricos vão para SOSFU
        };
        
        const mappedRole = rawRole ? legacyRoleMap[rawRole] : undefined;
        console.log('[useUserProfile] DB Role:', profileData?.role, '-> Raw:', rawRole, '-> Mapped:', mappedRole);
        
        if (mappedRole) {
            setInitialRole(mappedRole);
        } else {
            // Fallback: se o role do banco não é válido nem mapeável, usa SUPRIDO
            console.warn('[useUserProfile] Invalid or missing role:', rawRole, ', defaulting to SUPRIDO');
            setInitialRole(AppRole.SUPRIDO);
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
