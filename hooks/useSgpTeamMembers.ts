'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

export interface SgpTeamMember {
  id: string
  nome: string
  email: string
  cargo: string
  avatar_url?: string
  capacity: number
  currentLoad: number
  status: 'ATIVO' | 'INDISPONIVEL'
}

interface UseSgpTeamMembersReturn {
  teamMembers: SgpTeamMember[]
  isLoading: boolean
  error: string | null
  getCurrentMember: () => SgpTeamMember | undefined
  getMemberById: (id: string) => SgpTeamMember | undefined
  refresh: () => Promise<void>
}

export function useSgpTeamMembers(): UseSgpTeamMembersReturn {
  const [teamMembers, setTeamMembers] = useState<SgpTeamMember[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTeamMembers = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setCurrentUserId(user.id)

      // Fetch all SGP profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, nome, email, cargo, avatar_url')
        .eq('role', 'SGP')
        .order('nome')

      if (profilesError) throw profilesError

      // Get task counts for each member
      const { data: taskCounts, error: tasksError } = await supabase
        .from('sgp_tasks')
        .select('assigned_to')
        .in('status', ['ASSIGNED', 'IN_REVIEW'])
        .not('assigned_to', 'is', null)

      if (tasksError) {
        console.warn('Error fetching task counts:', tasksError)
      }

      // Build load map
      const loadMap: Record<string, number> = {}
      for (const task of taskCounts || []) {
        if (task.assigned_to) {
          loadMap[task.assigned_to] = (loadMap[task.assigned_to] || 0) + 1
        }
      }

      // Transform profiles to team members
      const members: SgpTeamMember[] = (profiles || []).map(p => ({
        id: p.id,
        nome: p.nome || 'Não informado',
        email: p.email || '',
        cargo: p.cargo || 'Analista SGP',
        avatar_url: p.avatar_url,
        capacity: 20, // Default capacity
        currentLoad: loadMap[p.id] || 0,
        status: 'ATIVO' as const
      }))

      // Fallback: if no SGP profiles found, use hardcoded team based on seeds
      if (members.length === 0) {
        setTeamMembers([
          { id: 'sgp-1', nome: 'Hellen Geysa da Silva Miranda Brancalhão', email: 'sgp01@tjpa.jus.br', cargo: 'Secretária-Chefe SGP', capacity: 15, currentLoad: 0, status: 'ATIVO' },
          { id: 'sgp-2', nome: 'João Kleber', email: 'sgp02@tjpa.jus.br', cargo: 'Analista de RH', capacity: 20, currentLoad: 0, status: 'ATIVO' },
          { id: 'sgp-3', nome: 'Lúcia Ferreira', email: 'sgp03@tjpa.jus.br', cargo: 'Técnica Judiciária', capacity: 20, currentLoad: 0, status: 'ATIVO' },
          { id: 'sgp-4', nome: 'Marta Rocha', email: 'sgp04@tjpa.jus.br', cargo: 'Gerente de Folha', capacity: 15, currentLoad: 0, status: 'ATIVO' },
        ])
      } else {
        setTeamMembers(members)
      }
    } catch (err: any) {
      console.error('Error fetching SGP team members:', err)
      setError(err.message || 'Erro ao carregar equipe')
      
      // Fallback on error
      setTeamMembers([
        { id: 'sgp-1', nome: 'Hellen Geysa da Silva Miranda Brancalhão', email: 'sgp01@tjpa.jus.br', cargo: 'Secretária-Chefe SGP', capacity: 15, currentLoad: 0, status: 'ATIVO' },
        { id: 'sgp-2', nome: 'João Kleber', email: 'sgp02@tjpa.jus.br', cargo: 'Analista de RH', capacity: 20, currentLoad: 0, status: 'ATIVO' },
        { id: 'sgp-3', nome: 'Lúcia Ferreira', email: 'sgp03@tjpa.jus.br', cargo: 'Técnica Judiciária', capacity: 20, currentLoad: 0, status: 'ATIVO' },
        { id: 'sgp-4', nome: 'Marta Rocha', email: 'sgp04@tjpa.jus.br', cargo: 'Gerente de Folha', capacity: 15, currentLoad: 0, status: 'ATIVO' },
      ])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTeamMembers()
  }, [fetchTeamMembers])

  const getCurrentMember = useCallback(() => {
    if (!currentUserId) return undefined
    return teamMembers.find(m => m.id === currentUserId)
  }, [currentUserId, teamMembers])

  const getMemberById = useCallback((id: string) => {
    return teamMembers.find(m => m.id === id)
  }, [teamMembers])

  return {
    teamMembers,
    isLoading,
    error,
    getCurrentMember,
    getMemberById,
    refresh: fetchTeamMembers
  }
}

export default useSgpTeamMembers
