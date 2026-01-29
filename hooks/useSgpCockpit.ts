'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'

// Types
export type SgpTaskType = 'GLOSA' | 'ALCANCE' | 'DEDUCAO' | 'FOLHA_PAGAMENTO' | 'RESSARCIMENTO'
export type SgpTaskStatus = 'PENDING' | 'ASSIGNED' | 'IN_REVIEW' | 'SIGNED' | 'RETURNED' | 'CANCELLED'
export type SgpOrigin = 'SOSFU' | 'AJSEFIN' | 'SEFIN' | 'TCE'

export interface SgpTask {
  id: string
  solicitacao_id: string | null
  documento_id: string | null
  tipo: SgpTaskType
  titulo: string
  descricao?: string
  valor: number
  origem: SgpOrigin
  status: SgpTaskStatus
  observacoes?: string
  
  // Assignment
  assigned_to: string | null
  assigned_at?: string
  assigned_by?: string
  
  // Signature
  assinado_por?: string
  assinado_em?: string
  
  // Return
  returned_to?: string
  returned_at?: string
  return_reason?: string
  
  // Audit
  created_at: string
  updated_at?: string
  created_by?: string
  
  // Joined data (from servidor)
  servidor?: {
    nome: string
    matricula: string
    lotacao: string
    email?: string
  }
  
  // Assignee info
  assignee?: {
    nome: string
    avatar_url?: string
  }
}

export interface SgpKPI {
  pendingTotal: number
  assignedToMe: number
  processedTotal: number
  totalDeductionValue: number
  urgentCount: number
}

export interface SgpFilters {
  status: 'all' | 'pending' | 'assigned' | 'signed' | 'returned'
  type: 'all' | SgpTaskType
  origin: 'all' | SgpOrigin
  assignee: 'all' | 'me' | 'unassigned' | string
  searchQuery: string
}

interface UseSgpCockpitOptions {
  autoRefresh?: boolean
  refreshInterval?: number
}

export function useSgpCockpit(options: UseSgpCockpitOptions = {}) {
  const { autoRefresh = true, refreshInterval = 30000 } = options

  // State
  const [tasks, setTasks] = useState<SgpTask[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<SgpFilters>({
    status: 'all',
    type: 'all',
    origin: 'all',
    assignee: 'all',
    searchQuery: ''
  })

  // Get current user on mount
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setCurrentUserId(user.id)
    }
    getCurrentUser()
  }, [])

  // Fetch tasks from Supabase
  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Query sgp_tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('sgp_tasks')
        .select(`
          id,
          solicitacao_id,
          documento_id,
          tipo,
          titulo,
          descricao,
          valor,
          origem,
          status,
          assigned_to,
          assigned_at,
          assigned_by,
          assinado_por,
          assinado_em,
          returned_to,
          returned_at,
          return_reason,
          created_at,
          updated_at,
          created_by
        `)
        .order('created_at', { ascending: false })

      if (tasksError) {
        console.error('Error fetching sgp_tasks:', tasksError)
        throw tasksError
      }

      console.log('[SGP] Tasks loaded:', tasksData?.length || 0)

      // Get assignee profiles
      const assigneeIds = [...new Set((tasksData || []).map(t => t.assigned_to).filter(Boolean))]
      let assigneeMap: Record<string, { nome: string; avatar_url?: string }> = {}
      
      if (assigneeIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, nome, avatar_url')
          .in('id', assigneeIds)

        if (profiles) {
          assigneeMap = profiles.reduce((acc, p) => {
            acc[p.id] = { nome: p.nome, avatar_url: p.avatar_url }
            return acc
          }, {} as typeof assigneeMap)
        }
      }

      // Transform data
      const transformedTasks: SgpTask[] = (tasksData || []).map((task: any) => ({
        ...task,
        assignee: task.assigned_to ? assigneeMap[task.assigned_to] : undefined,
      }))

      setTasks(transformedTasks)
    } catch (err: any) {
      console.error('Error fetching SGP tasks:', err)
      setError(err.message || 'Erro ao carregar tarefas')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(fetchTasks, refreshInterval)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, fetchTasks])

  // Computed KPIs
  const kpis = useMemo<SgpKPI>(() => {
    const pending = tasks.filter(t => t.status === 'PENDING')
    const assignedToMe = tasks.filter(t => 
      t.assigned_to === currentUserId && 
      ['ASSIGNED', 'IN_REVIEW'].includes(t.status)
    )
    const processed = tasks.filter(t => t.status === 'SIGNED')
    
    const totalValue = tasks
      .filter(t => t.status !== 'CANCELLED')
      .reduce((sum, t) => sum + (t.valor || 0), 0)

    const urgent = pending.filter(t => {
      const created = new Date(t.created_at)
      const hoursSinceCreated = (Date.now() - created.getTime()) / (1000 * 60 * 60)
      return hoursSinceCreated > 24
    })

    return {
      pendingTotal: pending.length,
      assignedToMe: assignedToMe.length,
      processedTotal: processed.length,
      totalDeductionValue: totalValue,
      urgentCount: urgent.length
    }
  }, [tasks, currentUserId])

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Status filter
      if (filters.status !== 'all') {
        const statusMap: Record<string, string[]> = {
          'pending': ['PENDING'],
          'assigned': ['ASSIGNED', 'IN_REVIEW'],
          'signed': ['SIGNED'],
          'returned': ['RETURNED']
        }
        if (!statusMap[filters.status]?.includes(task.status)) return false
      }

      // Type filter
      if (filters.type !== 'all' && task.tipo !== filters.type) return false

      // Origin filter
      if (filters.origin !== 'all' && task.origem !== filters.origin) return false

      // Assignee filter
      if (filters.assignee !== 'all') {
        if (filters.assignee === 'me' && task.assigned_to !== currentUserId) return false
        if (filters.assignee === 'unassigned' && task.assigned_to !== null) return false
        if (filters.assignee !== 'me' && filters.assignee !== 'unassigned' && 
            task.assigned_to !== filters.assignee) return false
      }

      // Search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase()
        const titulo = task.titulo?.toLowerCase() || ''
        const servidor = task.servidor?.nome?.toLowerCase() || ''
        const matricula = task.servidor?.matricula || ''
        
        if (!titulo.includes(query) && !servidor.includes(query) && !matricula.includes(query)) {
          return false
        }
      }

      return true
    })
  }, [tasks, filters, currentUserId])

  // Actions

  /**
   * Assign task to a team member
   */
  const assignTask = useCallback(async (taskId: string, memberId: string) => {
    try {
      const { error } = await supabase
        .from('sgp_tasks')
        .update({
          assigned_to: memberId,
          assigned_at: new Date().toISOString(),
          assigned_by: currentUserId,
          status: 'ASSIGNED'
        })
        .eq('id', taskId)

      if (error) throw error
      await fetchTasks()
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }, [currentUserId, fetchTasks])

  /**
   * Assign task to self
   */
  const assignToMe = useCallback(async (taskId: string) => {
    if (!currentUserId) return { success: false, error: 'Usuário não autenticado' }
    return assignTask(taskId, currentUserId)
  }, [currentUserId, assignTask])

  /**
   * Redistribute tasks from one member to another
   */
  const redistributeTasks = useCallback(async (fromMemberId: string, toMemberId: string) => {
    try {
      const { error } = await supabase
        .from('sgp_tasks')
        .update({
          assigned_to: toMemberId,
          assigned_at: new Date().toISOString(),
          assigned_by: currentUserId
        })
        .eq('assigned_to', fromMemberId)
        .in('status', ['ASSIGNED', 'IN_REVIEW'])

      if (error) throw error
      await fetchTasks()
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }, [currentUserId, fetchTasks])

  /**
   * Sign a task (process the deduction)
   */
  const signTask = useCallback(async (taskId: string, pin: string) => {
    try {
      // Verify PIN
      const { data: profile } = await supabase
        .from('profiles')
        .select('signature_pin')
        .eq('id', currentUserId)
        .single()

      const validPin = profile?.signature_pin || '123456'
      if (pin !== validPin) {
        throw new Error('PIN inválido')
      }

      const { error } = await supabase
        .from('sgp_tasks')
        .update({
          status: 'SIGNED',
          assinado_por: currentUserId,
          assinado_em: new Date().toISOString()
        })
        .eq('id', taskId)

      if (error) throw error
      await fetchTasks()
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }, [currentUserId, fetchTasks])

  /**
   * Return task to origin (SOSFU/AJSEFIN)
   */
  const returnTask = useCallback(async (taskId: string, destination: 'SOSFU' | 'AJSEFIN', reason: string) => {
    try {
      const { error } = await supabase
        .from('sgp_tasks')
        .update({
          status: 'RETURNED',
          returned_to: destination,
          returned_at: new Date().toISOString(),
          return_reason: reason
        })
        .eq('id', taskId)

      if (error) throw error

      // Get task to record tramitation
      const { data: task } = await supabase
        .from('sgp_tasks')
        .select('solicitacao_id')
        .eq('id', taskId)
        .single()

      if (task?.solicitacao_id) {
        await supabase
          .from('tramitacoes')
          .insert({
            solicitacao_id: task.solicitacao_id,
            origem: 'SGP',
            destino: destination,
            observacao: reason,
            user_id: currentUserId
          })
      }

      await fetchTasks()
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }, [currentUserId, fetchTasks])

  /**
   * Create a new SGP task (for internal use)
   */
  const createTask = useCallback(async (taskData: Partial<SgpTask>) => {
    try {
      const { error } = await supabase
        .from('sgp_tasks')
        .insert({
          ...taskData,
          created_by: currentUserId,
          status: taskData.status || 'PENDING'
        })

      if (error) throw error
      await fetchTasks()
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }, [currentUserId, fetchTasks])

  return {
    // Data
    tasks,
    filteredTasks,
    kpis,
    isLoading,
    error,
    currentUserId,
    
    // Filters
    filters,
    setFilters,
    updateFilter: <K extends keyof SgpFilters>(key: K, value: SgpFilters[K]) => {
      setFilters(prev => ({ ...prev, [key]: value }))
    },
    
    // Actions
    assignTask,
    assignToMe,
    redistributeTasks,
    signTask,
    returnTask,
    createTask,
    refresh: fetchTasks
  }
}

export default useSgpCockpit
