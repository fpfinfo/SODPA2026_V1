'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

// Ordenadores SEFIN
const SEFIN_TEAM_FALLBACK = [
  {
    id: 'ordenador-01',
    email: 'ordenador01@tjpa.jus.br',
    nome: 'Anailton Paulo de Alencar',
    cargo: 'Ordenador de Despesas',
    avatar: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/avatar/avatar1.png',
    capacidade_diaria: 30
  },
  {
    id: 'ordenador-02',
    email: 'ordenador02@tjpa.jus.br',
    nome: 'Miguel Lucivaldo Alves Santos',
    cargo: 'Ordenador de Despesas',
    avatar: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/avatar/avatar2.png',
    capacidade_diaria: 30
  }
]

export interface SefinTeamMember {
  id: string
  email: string
  nome: string
  cargo: string
  avatar: string
  capacidade_diaria: number
}

export interface SefinTeamMemberWithWorkload extends SefinTeamMember {
  assignedCount: number
  pendingCount: number
  signedTodayCount: number
  workloadPercent: number
}

interface UseSefinTeamMembersOptions {
  autoRefresh?: boolean
  refreshInterval?: number
}

export function useSefinTeamMembers(options: UseSefinTeamMembersOptions = {}) {
  const { autoRefresh = true, refreshInterval = 30000 } = options

  const [teamMembers, setTeamMembers] = useState<SefinTeamMember[]>(SEFIN_TEAM_FALLBACK)
  const [taskCounts, setTaskCounts] = useState<Record<string, { assigned: number; pending: number; signedToday: number }>>({})
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setCurrentUserId(user.id)
    }
    getCurrentUser()
  }, [])

  // Fetch team members from database
  const fetchTeamMembers = useCallback(async () => {
    try {
      setIsLoading(true)

      // Try to fetch from profiles table
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, email, nome, cargo, avatar_url, capacidade_diaria')
        .or('role.ilike.SEFIN,role.ilike.ORDENADOR,email.in.(ordenador01@tjpa.jus.br,ordenador02@tjpa.jus.br)')

      let finalMembers: SefinTeamMember[] = SEFIN_TEAM_FALLBACK

      if (error) {
        console.warn('Error fetching SEFIN team from profiles, using fallback:', error)
      } else if (profiles && profiles.length > 0) {
        finalMembers = profiles.map(p => ({
          id: p.id,
          email: p.email || '',
          nome: p.nome || 'Ordenador',
          cargo: p.cargo || 'Ordenador de Despesas',
          avatar: p.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.nome || 'O')}&background=f59e0b&color=fff`,
          capacidade_diaria: p.capacidade_diaria || 30
        }))
      }
      
      setTeamMembers(finalMembers)

      // Fetch task counts per member using the fetched IDs (not stale state)
      const memberIds = finalMembers.map(m => m.id)
      if (memberIds.length > 0) {
        // Only query if we have valid UUIDs (not fallback placeholder IDs)
        const hasValidUuids = memberIds.every(id => id.includes('-'))
        
        if (hasValidUuids) {
          const { data: tasks, error: taskError } = await supabase
            .from('sefin_tasks')
            .select('assigned_to, status, assinado_em')
            .in('assigned_to', memberIds)

          if (taskError) {
            console.warn('Error fetching task counts:', taskError)
          } else if (tasks) {
            const counts: Record<string, { assigned: number; pending: number; signedToday: number }> = {}
            const today = new Date().toISOString().split('T')[0]

            memberIds.forEach(id => {
              const memberTasks = tasks.filter(t => t.assigned_to === id)
              counts[id] = {
                assigned: memberTasks.length,
                pending: memberTasks.filter(t => t.status === 'PENDING').length,
                signedToday: memberTasks.filter(t => t.status === 'SIGNED' && t.assinado_em?.startsWith(today)).length
              }
            })

            setTaskCounts(counts)
          }
        }
      }
    } catch (err) {
      console.error('Error in fetchTeamMembers:', err)
      setTeamMembers(SEFIN_TEAM_FALLBACK)
    } finally {
      setIsLoading(false)
    }
  }, [teamMembers])

  // Initial fetch
  useEffect(() => {
    fetchTeamMembers()
  }, [])

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(fetchTeamMembers, refreshInterval)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, fetchTeamMembers])

  // Team members with workload calculated
  const teamLoad = useMemo<SefinTeamMemberWithWorkload[]>(() => {
    return teamMembers.map(member => {
      const counts = taskCounts[member.id] || { assigned: 0, pending: 0, signedToday: 0 }
      const workloadPercent = Math.min(100, Math.round((counts.pending / member.capacidade_diaria) * 100))

      return {
        ...member,
        assignedCount: counts.assigned,
        pendingCount: counts.pending,
        signedTodayCount: counts.signedToday,
        workloadPercent
      }
    })
  }, [teamMembers, taskCounts])

  // Get current member
  const getCurrentMember = useCallback((): SefinTeamMemberWithWorkload | undefined => {
    return teamLoad.find(m => m.id === currentUserId)
  }, [teamLoad, currentUserId])

  // Get member by ID
  const getMemberById = useCallback((id: string): SefinTeamMemberWithWorkload | undefined => {
    return teamLoad.find(m => m.id === id)
  }, [teamLoad])

  // Get the other ordenador (for assignment)
  const getColleague = useCallback((): SefinTeamMemberWithWorkload | undefined => {
    return teamLoad.find(m => m.id !== currentUserId)
  }, [teamLoad, currentUserId])

  return {
    teamMembers,
    teamLoad,
    currentUserId,
    isLoading,
    getCurrentMember,
    getMemberById,
    getColleague,
    refresh: fetchTeamMembers
  }
}

export default useSefinTeamMembers
