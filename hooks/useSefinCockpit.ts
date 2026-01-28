'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'

// Types
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

export interface SefinTask {
  id: string
  documento_id: string
  solicitacao_id: string
  tipo: string
  status: string
  created_at: string
  signed_at?: string
  signed_by?: string
  // Risk assessment
  riskScore: number       // 0-100
  riskLevel: RiskLevel
  riskFactors: {
    valueDeviation: number   // 0-40 points
    slaUrgency: number       // 0-30 points  
    timePending: number      // 0-20 points
    historicalRisk: number   // 0-10 points
  }
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
    id: string
    tipo: string
    titulo: string
    status: string
    metadata: Record<string, any>
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
  type: 'all' | 'PORTARIA' | 'CERTIDAO_REGULARIDADE' | 'NOTA_EMPENHO' | 'NOTA_LIQUIDACAO' | 'ORDEM_BANCARIA' | 'AUTORIZACAO_ORDENADOR'
  priority: 'all' | 'urgent' | 'high-value' | 'normal'
  period: 'today' | 'week' | 'month' | 'all'
  searchQuery: string
}

interface UseSefinCockpitOptions {
  autoRefresh?: boolean
  refreshInterval?: number // ms
}

// Risk calculation function
function calculateRisk(task: Omit<SefinTask, 'riskScore' | 'riskLevel' | 'riskFactors'>, avgValue: number = 5000): Pick<SefinTask, 'riskScore' | 'riskLevel' | 'riskFactors'> {
  const factors = {
    valueDeviation: 0,
    slaUrgency: 0,
    timePending: 0,
    historicalRisk: 0
  }

  // 1. Value deviation (40 points max)
  const valor = task.processo?.valor_total || 0
  if (valor > 0 && avgValue > 0) {
    const deviation = Math.abs(valor - avgValue) / avgValue
    factors.valueDeviation = Math.min(40, Math.round(deviation * 40))
  }

  // 2. SLA urgency - based on 90 day limit (30 points max)
  const created = new Date(task.processo?.created_at || task.created_at)
  const daysElapsed = Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24))
  const daysRemaining = 90 - daysElapsed
  
  if (daysRemaining < 7) factors.slaUrgency = 30
  else if (daysRemaining < 15) factors.slaUrgency = 20
  else if (daysRemaining < 30) factors.slaUrgency = 10

  // 3. Time pending in SEFIN queue (20 points max)
  const taskCreated = new Date(task.created_at)
  const hoursPending = (Date.now() - taskCreated.getTime()) / (1000 * 60 * 60)
  
  if (hoursPending > 72) factors.timePending = 20
  else if (hoursPending > 48) factors.timePending = 15
  else if (hoursPending > 24) factors.timePending = 10
  else if (hoursPending > 8) factors.timePending = 5

  // 4. Historical risk (10 points max) - simplified, could be enhanced with real data
  // High value documents have slightly higher risk
  if (valor > 10000) factors.historicalRisk = 5
  if (valor > 14000) factors.historicalRisk = 10

  const totalScore = factors.valueDeviation + factors.slaUrgency + factors.timePending + factors.historicalRisk
  
  let riskLevel: RiskLevel = 'low'
  if (totalScore > 75) riskLevel = 'critical'
  else if (totalScore > 50) riskLevel = 'high'
  else if (totalScore > 25) riskLevel = 'medium'

  return {
    riskScore: Math.min(100, totalScore),
    riskLevel,
    riskFactors: factors
  }
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
          titulo,
          valor,
          solicitacoes (
            nup,
            valor_solicitado,
            status,
            created_at,
            descricao,
            profiles!solicitacoes_user_id_fkey (
              nome,
              email,
              lotacao
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (tasksError) {
        console.error('Error fetching sefin_tasks:', tasksError)
        throw tasksError
      }

      // Debug: log count of tasks and status breakdown
      console.log('sefin_tasks loaded:', tasksData?.length || 0)
      const statusBreakdown = (tasksData || []).reduce((acc: Record<string, number>, t: any) => {
        acc[t.status] = (acc[t.status] || 0) + 1
        return acc
      }, {})
      console.log('sefin_tasks status breakdown:', statusBreakdown)

      // Get unique emails to fetch lotacao from servidores_tj
      const emails = [...new Set((tasksData || [])
        .map((t: any) => t.solicitacoes?.profiles?.email)
        .filter(Boolean)
      )]

      // Fetch lotacao data from servidores_tj for all emails at once
      let lotacaoMap: Record<string, string> = {}
      if (emails.length > 0) {
        const { data: servidores } = await supabase
          .from('servidores_tj')
          .select('email, lotacao')
          .in('email', emails)

        if (servidores) {
          lotacaoMap = servidores.reduce((acc: Record<string, string>, s: any) => {
            if (s.email && s.lotacao) {
              acc[s.email] = s.lotacao
            }
            return acc
          }, {})
        }
      }

      // Calculate average value for risk calculation
      const allValues = (tasksData || []).map((t: any) => t.solicitacoes?.valor_solicitado || t.valor || 0).filter((v: number) => v > 0)
      const avgValue = allValues.length > 0 ? allValues.reduce((a: number, b: number) => a + b, 0) / allValues.length : 5000

      // Transform data with risk calculation
      const transformedTasks: SefinTask[] = (tasksData || []).map((task: any) => {
        const email = task.solicitacoes?.profiles?.email
        const lotacaoFromServidor = email ? lotacaoMap[email] : null
        
        const baseTask = {
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
            suprido_nome: task.solicitacoes.profiles?.nome || task.titulo?.split(' - ')[1] || 'N/A',
            lotacao_nome: lotacaoFromServidor || task.solicitacoes.profiles?.lotacao || 'N/A',
            valor_total: task.solicitacoes.valor_solicitado || task.valor || 0,
            status: task.solicitacoes.status,
            created_at: task.solicitacoes.created_at
          } : {
            nup: '',
            suprido_nome: task.titulo?.split(' - ')[1] || 'N/A',
            lotacao_nome: 'N/A',
            valor_total: task.valor || 0,
            status: task.status,
            created_at: task.created_at
          },
          documento: undefined // Document preview uses templates
        }
        
        // Calculate risk for this task
        const risk = calculateRisk(baseTask as any, avgValue)
        
        return {
          ...baseTask,
          ...risk
        }
      })


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

      // Get current user ID from auth
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      // First, get the task to find documento_id, solicitacao_id, and tipo
      const { data: task, error: taskError } = await supabase
        .from('sefin_tasks')
        .select('documento_id, solicitacao_id, tipo')
        .eq('id', taskId)
        .single()

      if (taskError) throw taskError

      // Update sefin_tasks status
      const { error } = await supabase
        .from('sefin_tasks')
        .update({
          status: 'SIGNED',
          assinado_em: new Date().toISOString(),
          ordenador_id: user.id
        })
        .eq('id', taskId)

      if (error) throw error

      // Get signer profile for metadata
      const { data: signerProfile } = await supabase
        .from('profiles')
        .select('nome, cargo')
        .eq('id', user.id)
        .single()

      // Update documento status to ASSINADO with signer info
      if (task?.documento_id) {
        await supabase
          .from('documentos')
          .update({ 
            status: 'ASSINADO',
            signed_at: new Date().toISOString(),
            signed_by: user.id,
            metadata: {
              signed_by_name: signerProfile?.nome || 'Ordenador de Despesa',
              signer_role: signerProfile?.cargo || 'Ordenador de Despesa'
            }
          })
          .eq('id', task.documento_id)
        
        // Sync execution_documents via documento
        const { data: docData } = await supabase
          .from('documentos')
          .select('tipo, solicitacao_id')
          .eq('id', task.documento_id)
          .single()
        
        if (docData?.solicitacao_id) {
          await supabase
            .from('execution_documents')
            .update({ status: 'ASSINADO' })
            .eq('solicitacao_id', docData.solicitacao_id)
            .eq('tipo', docData.tipo)
        }
      }
      
      // ALWAYS sync execution_documents directly using solicitacao_id + tipo
      // This handles cases where sefin_tasks was created without documento_id
      if (task?.solicitacao_id && task?.tipo) {
        console.log(`🔄 [SEFIN] Syncing execution_documents: solicitacao=${task.solicitacao_id}, tipo=${task.tipo}`)
        await supabase
          .from('execution_documents')
          .update({ status: 'ASSINADO' })
          .eq('solicitacao_id', task.solicitacao_id)
          .eq('tipo', task.tipo)
      }

      // Check if all documents for this solicitacao are signed
      if (task?.solicitacao_id) {
        const { data: pendingTasks } = await supabase
          .from('sefin_tasks')
          .select('id')
          .eq('solicitacao_id', task.solicitacao_id)
          .neq('status', 'SIGNED')

        // If no more pending tasks for this process, update solicitacao status
        if (!pendingTasks || pendingTasks.length === 0) {
          // Check if this was an exceptional authorization (Júri)
          // In that case, return to SOSFU instead of marking as APROVADO
          const isExceptionalAuth = task.tipo === 'AUTORIZACAO_ORDENADOR'
          
          // Check if this is a legal document created by AJSEFIN
          const isAjsefinDocument = ['PARECER', 'DECISAO', 'DESPACHO', 'CERTIDAO'].includes(task.tipo)
          
          if (isExceptionalAuth) {
            // Exceptional authorization signed - return to SOSFU for execution with special status
            await supabase
              .from('solicitacoes')
              .update({ 
                status: 'AUTORIZADO ORDENADOR',
                destino_atual: 'SOSFU',
                updated_at: new Date().toISOString()
              })
              .eq('id', task.solicitacao_id)
            
            // Record tramitation
            await supabase
              .from('tramitacoes')
              .insert({
                solicitacao_id: task.solicitacao_id,
                origem: 'SEFIN',
                destino: 'SOSFU',
                observacao: 'Autorização de Despesa Excepcional assinada pelo Ordenador. Processo retorna ao SOSFU para execução normal.',
                user_id: user.id
              })
          } else if (isAjsefinDocument) {
            // Legal document from AJSEFIN signed - return to AJSEFIN for tramitation
            await supabase
              .from('solicitacoes')
              .update({ 
                status: 'DOCUMENTO ASSINADO',
                destino_atual: 'AJSEFIN',
                updated_at: new Date().toISOString()
              })
              .eq('id', task.solicitacao_id)
            
            // Record tramitation
            await supabase
              .from('tramitacoes')
              .insert({
                solicitacao_id: task.solicitacao_id,
                origem: 'SEFIN',
                destino: 'AJSEFIN',
                observacao: `${task.tipo} assinado pelo Ordenador. Processo retorna à AJSEFIN para tramitação.`,
                user_id: user.id
              })
          } else {
            // Regular flow - mark as APROVADO
            await supabase
              .from('solicitacoes')
              .update({ 
                status: 'APROVADO',
                status_workflow: 'SIGNED_BY_SEFIN', // SCS 4.0: Unlock DL/OB generation
                destino_atual: 'SOSFU',
                updated_at: new Date().toISOString()
              })
              .eq('id', task.solicitacao_id)
          }
        }
      }

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

      // Get current user ID from auth
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      // Get task details for updating related tables (include tipo for direct sync)
      const { data: tasks, error: fetchError } = await supabase
        .from('sefin_tasks')
        .select('id, documento_id, solicitacao_id, tipo')
        .in('id', taskIds)

      if (fetchError) throw fetchError

      // Update sefin_tasks status
      const { error } = await supabase
        .from('sefin_tasks')
        .update({
          status: 'SIGNED',
          assinado_em: new Date().toISOString(),
          ordenador_id: user.id
        })
        .in('id', taskIds)

      if (error) throw error

      // Get signer profile for metadata
      const { data: signerProfile } = await supabase
        .from('profiles')
        .select('nome, cargo')
        .eq('id', user.id)
        .single()

      // Update documento status for each signed task with signer info
      const documentoIds = (tasks || []).map(t => t.documento_id).filter(Boolean)
      if (documentoIds.length > 0) {
        await supabase
          .from('documentos')
          .update({ 
            status: 'ASSINADO',
            signed_at: new Date().toISOString(),
            signed_by: user.id,
            metadata: {
              signed_by_name: signerProfile?.nome || 'Ordenador de Despesa',
              signer_role: signerProfile?.cargo || 'Ordenador de Despesa'
            }
          })
          .in('id', documentoIds)
        
        // Sync execution_documents via documento
        const { data: signedDocs } = await supabase
          .from('documentos')
          .select('tipo, solicitacao_id')
          .in('id', documentoIds)
        
        for (const doc of signedDocs || []) {
          if (doc.solicitacao_id) {
            await supabase
              .from('execution_documents')
              .update({ status: 'ASSINADO' })
              .eq('solicitacao_id', doc.solicitacao_id)
              .eq('tipo', doc.tipo)
          }
        }
      }
      
      // ALWAYS sync execution_documents directly using solicitacao_id + tipo
      // This handles cases where sefin_tasks was created without documento_id
      console.log(`🔄 [SEFIN] Batch syncing execution_documents for ${(tasks || []).length} tasks`)
      for (const task of tasks || []) {
        if (task.solicitacao_id && task.tipo) {
          await supabase
            .from('execution_documents')
            .update({ status: 'ASSINADO' })
            .eq('solicitacao_id', task.solicitacao_id)
            .eq('tipo', task.tipo)
        }
      }

      // Get unique solicitacao_ids and check if all tasks are signed
      const solicitacaoIds = [...new Set((tasks || []).map(t => t.solicitacao_id).filter(Boolean))]
      for (const solicitacaoId of solicitacaoIds) {
        const { data: pendingTasks } = await supabase
          .from('sefin_tasks')
          .select('id')
          .eq('solicitacao_id', solicitacaoId)
          .neq('status', 'SIGNED')

        // If no pending tasks, update solicitacao status
        if (!pendingTasks || pendingTasks.length === 0) {
          await supabase
            .from('solicitacoes')
            .update({ 
              status: 'APROVADO',
              status_workflow: 'SIGNED_BY_SEFIN', // SCS 4.0: Unlock DL/OB generation
              destino_atual: 'SOSFU',
              updated_at: new Date().toISOString()
            })
            .eq('id', solicitacaoId)
        }
      }

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
