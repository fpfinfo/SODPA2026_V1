/**
 * useTeamMembers Hook
 * Manages system users (SOSFU/AJSEFIN team) linked to servidores_tj
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Role } from '../types';

export interface TeamMember {
  id: string;
  servidor_id: string;
  role: Role;
  ativo: boolean;
  // From servidores_tj
  nome: string;
  email: string | null;
  cargo: string | null;
  lotacao: string | null;
  avatar_url: string | null;
  matricula: string | null;
}

interface UseTeamMembersReturn {
  teamMembers: TeamMember[];
  isLoading: boolean;
  error: string | null;
  createTeamMember: (servidorId: string, role: Role) => Promise<boolean>;
  updateTeamMember: (id: string, data: Partial<{ role: Role; ativo: boolean }>) => Promise<boolean>;
  deleteTeamMember: (id: string) => Promise<boolean>;
  updateServidorAvatar: (servidorId: string, file: File) => Promise<string | null>;
  updateServidor: (servidorId: string, data: Partial<{ email: string; cargo: string; lotacao: string }>) => Promise<boolean>;
  searchServidores: (query: string) => Promise<ServidorSearchResult[]>;
  refresh: () => Promise<void>;
}

export interface ServidorSearchResult {
  id: string;
  nome: string;
  cargo: string | null;
  lotacao: string | null;
  email: string | null;
}

export function useTeamMembers(): UseTeamMembersReturn {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeamMembers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('usuarios_sistema')
        .select(`
          id,
          servidor_id,
          role,
          ativo,
          servidor:servidores_tj!servidor_id(
            nome,
            email,
            cargo,
            lotacao,
            avatar_url,
            matricula
          )
        `)
        .eq('ativo', true)
        .order('created_at');

      if (fetchError) throw fetchError;

      // Transform the data to flatten servidor info
      const members: TeamMember[] = (data || []).map((item: any) => ({
        id: item.id,
        servidor_id: item.servidor_id,
        role: item.role as Role,
        ativo: item.ativo,
        nome: item.servidor?.nome || 'Servidor não encontrado',
        email: item.servidor?.email,
        cargo: item.servidor?.cargo,
        lotacao: item.servidor?.lotacao,
        avatar_url: item.servidor?.avatar_url,
        matricula: item.servidor?.matricula,
      }));

      setTeamMembers(members);
    } catch (err: any) {
      console.error('Error fetching team members:', err);
      setError(err.message || 'Erro ao carregar membros da equipe');
      setTeamMembers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeamMembers();
  }, [fetchTeamMembers]);

  const createTeamMember = async (servidorId: string, role: Role): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('usuarios_sistema')
        .insert([{ servidor_id: servidorId, role }]);

      if (error) throw error;
      await fetchTeamMembers();
      return true;
    } catch (err: any) {
      console.error('Error creating team member:', err);
      setError(err.message);
      return false;
    }
  };

  const updateTeamMember = async (id: string, data: Partial<{ role: Role; ativo: boolean }>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('usuarios_sistema')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      await fetchTeamMembers();
      return true;
    } catch (err: any) {
      console.error('Error updating team member:', err);
      setError(err.message);
      return false;
    }
  };

  const deleteTeamMember = async (id: string): Promise<boolean> => {
    try {
      // Soft delete by setting ativo = false
      const { error } = await supabase
        .from('usuarios_sistema')
        .update({ ativo: false, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      await fetchTeamMembers();
      return true;
    } catch (err: any) {
      console.error('Error deleting team member:', err);
      setError(err.message);
      return false;
    }
  };

  const searchServidores = async (query: string): Promise<ServidorSearchResult[]> => {
    if (!query || query.length < 2) return [];

    try {
      const { data, error } = await supabase
        .from('servidores_tj')
        .select('id, nome, cargo, lotacao, email')
        .ilike('nome', `%${query}%`)
        .eq('ativo', true)
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('Error searching servidores:', err);
      return [];
    }
  };

  const updateServidorAvatar = async (servidorId: string, file: File): Promise<string | null> => {
    try {
      // Validate file
      const maxBytes = 2 * 1024 * 1024; // 2MB
      if (file.size > maxBytes) {
        setError('O arquivo deve ter no máximo 2MB');
        return null;
      }

      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setError('Formato inválido. Use JPG, PNG, GIF ou WebP.');
        return null;
      }

      // Generate unique file name
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `servidor_${servidorId}_${Date.now()}.${fileExt}`;
      const filePath = `public/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update servidores_tj with the new avatar URL
      const { error: updateError } = await supabase
        .from('servidores_tj')
        .update({ 
          avatar_url: publicUrl, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', servidorId);

      if (updateError) throw updateError;

      // Refresh team members to get updated avatar
      await fetchTeamMembers();

      console.log('Servidor avatar updated:', publicUrl);
      return publicUrl;
    } catch (err: any) {
      console.error('Error updating servidor avatar:', err);
      setError(err.message || 'Erro ao atualizar avatar');
      return null;
    }
  };

  const updateServidor = async (servidorId: string, data: Partial<{ email: string; cargo: string; lotacao: string }>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('servidores_tj')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', servidorId);

      if (error) throw error;
      await fetchTeamMembers();
      return true;
    } catch (err: any) {
      console.error('Error updating servidor:', err);
      setError(err.message);
      return false;
    }
  };

  return {
    teamMembers,
    isLoading,
    error,
    createTeamMember,
    updateTeamMember,
    deleteTeamMember,
    updateServidorAvatar,
    updateServidor,
    searchServidores,
    refresh: fetchTeamMembers,
  };
}
