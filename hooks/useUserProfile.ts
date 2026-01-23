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

export function useUserProfile(user: any): UseUserProfileResult & { initialRole: AppRole | null } {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [initialRole, setInitialRole] = useState<AppRole | null>(null);

  const fetchUser = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const currentUserId = user.id;
      
      // Guard against empty ID to prevent 400 Bad Request
      if (!currentUserId) {
        setLoading(false);
        return;
      }

      const userEmail = user.email;

      // Parallel Data Fetching
      const [servidorResponse, profileResponse] = await Promise.all([
        // 1. Fetch from servidores_tj by email
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
          email: servidorData?.email || userEmail || profileData?.email,
          cpf: servidorData?.cpf || profileData?.cpf,
          matricula: servidorData?.matricula || profileData?.matricula,
          cargo: servidorData?.cargo || profileData?.cargo,
          lotacao: servidorData?.lotacao || profileData?.lotacao,
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

        // Determine Initial Role
        const dbRole = (profileData?.role || servidorData?.role)?.toUpperCase() as AppRole;
        if (dbRole && Object.values(AppRole).includes(dbRole)) {
            setInitialRole(dbRole);
        }

      } else {
        // Fallback
        console.warn('No profile data found for:', userEmail);
        setUserProfile({
          id: currentUserId,
          email: userEmail,
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
  }, [user]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return { userProfile, loading, error, refetchUser: fetchUser, initialRole };
}
