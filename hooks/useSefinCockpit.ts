'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'

// Types
export interface SefinTask {
  id: string
  documento_id: string
  solicitacao_id: string
  tipo: string
  status: string
  created_at: string
  signed_at?: string
  signed_by?: string
  // Joined data
  processo?: {
    nup: string
    suprido_nome: string
    lotacao_nome: string
    valor_total: number
    status: string
    created_at: string
  }
  documento?: {
    tipo: string
    titulo: string
    conteudo: string
  }
}

export interface SefinKPI {
  pendingTotal: number
  signedToday: number
  avgSignTime: number // in hours
  urgentCount: number
  highValueCount: number // > R$ 10.000
}

export interface SefinFilters {
  status: 'all' | 'pending' | 'signed' | 'returned'
  type: 'all' | 'PORTARIA' | 'CERTIDAO_REGULARIDADE' | 'NOTA_EMPENHO' | 'NOTA_LIQUIDACAO' | 'ORDEM_BANCARIA'
  priority: 'all' | 'urgent' | 'high-value' | 'normal'
  period: 'today' | 'week' | 'month' | 'all'
  searchQuery: string
}

interface UseSefinCockpitOptions {
  autoRefresh?: boolean
  refreshInterval?: number // ms
}

export function useSefinCockpit(options: UseSefinCockpitOptions = {}) {
  const { autoRefresh = true, refreshInterval = 30000 } = options

  // State
  const [tasks, setTasks] = useState<SefinTask[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<SefinFilters>({
    status: 'pending',
    type: 'all',
    priority: 'all',
    period: 'all',
    searchQuery: ''
  })

  // Fetch tasks from Supabase
  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Query sefin_tasks with joined data
      const { data: tasksData, error: tasksError } = await supabase
        .from('sefin_tasks')
        .select(`
          id,
          documento_id,
          solicitacao_id,
          tipo,
          status,
          created_at,
          assinado_em,
          ordenador_id,
          solicitacoes (
            nup,
            valor_solicitado,
            status,
            created_at,
            descricao,
            profiles!solicitacoes_user_id_fkey (
              nome,
              lotacao
            )
          ),
          documentos (
            tipo,
            titulo,
            conteudo
          )
        `)
        .order('created_at', { ascending: false })

      if (tasksError) throw tasksError

      // Transform data
      const transformedTasks: SefinTask[] = (tasksData || []).map((task: any) => ({
        id: task.id,
        documento_id: task.documento_id,
        solicitacao_id: task.solicitacao_id,
        tipo: task.tipo,
        status: task.status,
        created_at: task.created_at,
        signed_at: task.assinado_em,
        signed_by: task.ordenador_id,
        processo: task.solicitacoes ? {
          nup: task.solicitacoes.nup,
          suprido_nome: task.solicitacoes.profiles?.nome || 'N/A',
          lotacao_nome: task.solicitacoes.profiles?.lotacao || 'N/A',
          valor_total: task.solicitacoes.valor_solicitado || 0,
          status: task.solicitacoes.status,
          created_at: task.solicitacoes.created_at
        } : undefined,
        documento: task.documentos ? {
          tipo: task.documentos.tipo,
          titulo: task.documentos.titulo,
          conteudo: task.documentos.conteudo
        } : undefined
      }))


      setTasks(transformedTasks)
    } catch (err: any) {
      console.error('Error fetching SEFIN tasks:', err)
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
  const kpis = useMemo<SefinKPI>(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const pending = tasks.filter(t => t.status === 'PENDING')
    const signedToday = tasks.filter(t => 
      t.status === 'SIGNED' && 
      new Date(t.signed_at || t.created_at) >= today
    )
    
    // Calculate average sign time (in hours)
    const signedWithTimes = tasks.filter(t => t.signed_at && t.created_at)
    const avgTime = signedWithTimes.length > 0
      ? signedWithTimes.reduce((acc, t) => {
          const created = new Date(t.created_at).getTime()
          const signed = new Date(t.signed_at!).getTime()
          return acc + (signed - created)
        }, 0) / signedWithTimes.length / (1000 * 60 * 60)
      : 0

    const urgent = pending.filter(t => {
      const created = new Date(t.created_at)
      const hoursSinceCreated = (Date.now() - created.getTime()) / (1000 * 60 * 60)
      return hoursSinceCreated > 24 // More than 24h pending = urgent
    })

    const highValue = pending.filter(t => 
      (t.processo?.valor_total || 0) >= 10000
    )

    return {
      pendingTotal: pending.length,
      signedToday: signedToday.length,
      avgSignTime: Math.round(avgTime * 10) / 10,
      urgentCount: urgent.length,
      highValueCount: highValue.length
    }
  }, [tasks])

  // Filtered tasks based on current filters
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Status filter
      if (filters.status !== 'all') {
        const statusMap: Record<string, string> = {
          'pending': 'PENDING',
          'signed': 'SIGNED',
          'returned': 'REJECTED'
        }
        if (task.status !== statusMap[filters.status]) return false
      }

      // Type filter
      if (filters.type !== 'all' && task.tipo !== filters.type) {
        return false
      }

      // Priority filter
      if (filters.priority !== 'all') {
        const created = new Date(task.created_at)
        const hoursSinceCreated = (Date.now() - created.getTime()) / (1000 * 60 * 60)
        const isUrgent = hoursSinceCreated > 24
        const isHighValue = (task.processo?.valor_total || 0) >= 10000

        if (filters.priority === 'urgent' && !isUrgent) return false
        if (filters.priority === 'high-value' && !isHighValue) return false
        if (filters.priority === 'normal' && (isUrgent || isHighValue)) return false
      }

      // Period filter
      if (filters.period !== 'all') {
        const created = new Date(task.created_at)
        const now = new Date()

        if (filters.period === 'today') {
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          if (created < today) return false
        } else if (filters.period === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          if (created < weekAgo) return false
        } else if (filters.period === 'month') {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          if (created < monthAgo) return false
        }
      }

      // Search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase()
        const nup = task.processo?.nup?.toLowerCase() || ''
        const suprido = task.processo?.suprido_nome?.toLowerCase() || ''
        const lotacao = task.processo?.lotacao_nome?.toLowerCase() || ''
        const tipo = task.tipo?.toLowerCase() || ''

        if (!nup.includes(query) && !suprido.includes(query) && !lotacao.includes(query) && !tipo.includes(query)) {
          return false
        }
      }

      return true
    })
  }, [tasks, filters])

  // Actions
  const signTask = useCallback(async (taskId: string, pin: string) => {
    try {
      // Verify PIN (simplified - should integrate with auth)
      if (pin !== '123456') {
        throw new Error('PIN inválido')
      }

      const { error } = await supabase
        .from('sefin_tasks')
        .update({
          status: 'SIGNED',
          assinado_em: new Date().toISOString(),
          ordenador_id: 'current-user-id' // TODO: Get from auth context
        })
        .eq('id', taskId)

      if (error) throw error

      // Refresh tasks
      await fetchTasks()
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }, [fetchTasks])

  const signMultipleTasks = useCallback(async (taskIds: string[], pin: string) => {
    try {
      if (pin !== '123456') {
        throw new Error('PIN inválido')
      }

      const { error } = await supabase
        .from('sefin_tasks')
        .update({
          status: 'SIGNED',
          assinado_em: new Date().toISOString(),
          ordenador_id: 'current-user-id'
        })
        .in('id', taskIds)

      if (error) throw error

      await fetchTasks()
      return { success: true, count: taskIds.length }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }, [fetchTasks])

  const returnTask = useCallback(async (taskId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('sefin_tasks')
        .update({
          status: 'REJECTED',
          observacoes: reason
        })
        .eq('id', taskId)

      if (error) throw error

      await fetchTasks()
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }, [fetchTasks])

  return {
    // Data
    tasks,
    filteredTasks,
    kpis,
    isLoading,
    error,
    
    // Filters
    filters,
    setFilters,
    updateFilter: <K extends keyof SefinFilters>(key: K, value: SefinFilters[K]) => {
      setFilters(prev => ({ ...prev, [key]: value }))
    },
    
    // Actions
    signTask,
    signMultipleTasks,
    returnTask,
    refresh: fetchTasks
  }
}

export default useSefinCockpit
