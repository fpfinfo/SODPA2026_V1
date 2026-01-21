'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'

// ========================================
// TYPES
// ========================================
export type WorkflowStatus = 
  | 'EXECUTION_DRAFT'      // SOSFU gera docs iniciais
  | 'WAITING_SEFIN'        // SOSFU enviou, SEFIN vê na mesa
  | 'SIGNED_BY_SEFIN'      // SEFIN assinou, SOSFU vê botões liberados
  | 'PAYMENT_PROCESSING'   // SOSFU gerou OB, na Análise Técnica
  | 'FUNDS_RELEASED'       // Técnico confirmou crédito
  | 'AWAITING_SUPRIDO_CONFIRMATION' // Crédito liberado, aguardando Suprido confirmar recebimento
  | 'AWAITING_ACCOUNTABILITY'       // Suprido confirmou, prazo de 30 dias iniciado
  | 'ACCOUNTABILITY_OPEN'  // Suprido pode gastar (legado)

export interface WorkflowPhase {
  id: WorkflowStatus
  label: string
  description: string
  icon: string
}

export const WORKFLOW_PHASES: WorkflowPhase[] = [
  { id: 'EXECUTION_DRAFT', label: 'Instrução', description: 'Geração de documentos iniciais', icon: '📝' },
  { id: 'WAITING_SEFIN', label: 'Aguardando SEFIN', description: 'Documentos enviados para assinatura', icon: '⏳' },
  { id: 'SIGNED_BY_SEFIN', label: 'Assinado', description: 'Pronto para liquidação e pagamento', icon: '✅' },
  { id: 'PAYMENT_PROCESSING', label: 'Análise Técnica', description: 'Verificação final antes da liberação', icon: '🔍' },
  { id: 'FUNDS_RELEASED', label: 'Liberado', description: 'Recurso creditado na conta', icon: '💰' },
  { id: 'AWAITING_SUPRIDO_CONFIRMATION', label: 'Confirmação Pendente', description: 'Aguardando Suprido confirmar recebimento', icon: '🔔' },
  { id: 'AWAITING_ACCOUNTABILITY', label: 'Aguardando Prestação', description: 'Prazo de 30 dias para prestação de contas', icon: '⏰' },
  { id: 'ACCOUNTABILITY_OPEN', label: 'Prestação de Contas', description: 'Período de utilização do recurso', icon: '📊' }
]


interface UseWorkflowStatusOptions {
  enableRealtime?: boolean
}

// ========================================
// HOOK
// ========================================
export function useWorkflowStatus(solicitacaoId: string, options: UseWorkflowStatusOptions = {}) {
  const { enableRealtime = true } = options
  
  // State
  const [status, setStatus] = useState<WorkflowStatus>('EXECUTION_DRAFT')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // Fetch current status
  const fetchStatus = useCallback(async () => {
    if (!solicitacaoId) return

    try {
      setIsLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('solicitacoes')
        .select('status_workflow, updated_at')
        .eq('id', solicitacaoId)
        .single()

      if (fetchError) throw fetchError

      let workflowStatus = (data?.status_workflow as WorkflowStatus) || 'EXECUTION_DRAFT'
      
      // ========================================
      // FALLBACK: Check if Block A documents are signed
      // If status_workflow wasn't updated but docs are signed, fix it
      // ========================================
      if (workflowStatus === 'WAITING_SEFIN' || workflowStatus === 'EXECUTION_DRAFT') {
        const { data: docs } = await supabase
          .from('execution_documents')
          .select('tipo, status')
          .eq('solicitacao_id', solicitacaoId)
          .in('tipo', ['PORTARIA', 'CERTIDAO_REGULARIDADE', 'NOTA_EMPENHO'])
        
        if (docs && docs.length >= 3) {
          const allSigned = docs.every(d => d.status === 'ASSINADO')
          if (allSigned) {
            console.log('✅ [Workflow] Block A docs all signed, upgrading status to SIGNED_BY_SEFIN')
            workflowStatus = 'SIGNED_BY_SEFIN'
            
            // Also update the database to keep it in sync
            await supabase
              .from('solicitacoes')
              .update({ 
                status_workflow: 'SIGNED_BY_SEFIN',
                updated_at: new Date().toISOString()
              })
              .eq('id', solicitacaoId)
          }
        }
      }

      setStatus(workflowStatus)
      setLastUpdate(data?.updated_at ? new Date(data.updated_at) : null)
      
      console.log(`📊 [Workflow] Status: ${workflowStatus}`)
    } catch (err: any) {
      console.error('❌ [Workflow] Error:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [solicitacaoId])


  // Initial fetch
  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  // Realtime subscription
  useEffect(() => {
    if (!solicitacaoId || !enableRealtime) return

    console.log('🔄 [Workflow] Starting realtime subscription')

    const channel = supabase
      .channel(`workflow-${solicitacaoId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'solicitacoes',
          filter: `id=eq.${solicitacaoId}`
        },
        (payload) => {
          console.log('⚡ [Workflow] Realtime update:', payload.new)
          const newStatus = payload.new.status_workflow as WorkflowStatus
          if (newStatus && newStatus !== status) {
            setStatus(newStatus)
            setLastUpdate(new Date())
          }
        }
      )
      .subscribe()

    return () => {
      console.log('🔌 [Workflow] Unsubscribing')
      supabase.removeChannel(channel)
    }
  }, [solicitacaoId, enableRealtime, status])

  // Update status
  const updateStatus = useCallback(async (newStatus: WorkflowStatus) => {
    try {
      const { error: updateError } = await supabase
        .from('solicitacoes')
        .update({ 
          status_workflow: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', solicitacaoId)

      if (updateError) throw updateError

      setStatus(newStatus)
      setLastUpdate(new Date())
      console.log(`✅ [Workflow] Status updated to: ${newStatus}`)
      
      return { success: true }
    } catch (err: any) {
      console.error('❌ [Workflow] Update error:', err)
      return { success: false, error: err.message }
    }
  }, [solicitacaoId])

  // Computed flags baseados no status atual
  const flags = useMemo(() => {
    const currentPhaseIndex = WORKFLOW_PHASES.findIndex(p => p.id === status)
    
    return {
      // Fase atual
      currentPhase: WORKFLOW_PHASES.find(p => p.id === status),
      currentPhaseIndex,
      
      // Flags de estado
      isInDraft: status === 'EXECUTION_DRAFT',
      isWaitingSefin: status === 'WAITING_SEFIN',
      isSignedBySefin: status === 'SIGNED_BY_SEFIN',
      isInPaymentProcessing: status === 'PAYMENT_PROCESSING',
      isFundsReleased: status === 'FUNDS_RELEASED',
      isAwaitingSupridoConfirmation: status === 'AWAITING_SUPRIDO_CONFIRMATION',
      isAwaitingAccountability: status === 'AWAITING_ACCOUNTABILITY',
      isAccountabilityOpen: status === 'ACCOUNTABILITY_OPEN',
      
      // Flags de permissão - Bloco A (Pré-SEFIN)
      canEditBlockA: status === 'EXECUTION_DRAFT',
      canSendToSefin: status === 'EXECUTION_DRAFT',
      
      // Flags de permissão - Bloco B (Pós-SEFIN)
      canGenerateDL: status === 'SIGNED_BY_SEFIN',
      canGenerateOB: status === 'SIGNED_BY_SEFIN',
      canSendToTechnicalAnalysis: status === 'SIGNED_BY_SEFIN',
      
      // Flags de permissão - Análise Técnica
      canReleaseFunds: status === 'PAYMENT_PROCESSING',
      
      // Flags de permissão - Suprido
      canConfirmReceipt: status === 'AWAITING_SUPRIDO_CONFIRMATION',
      
      // Flags de bloqueio
      isBlockALocked: status !== 'EXECUTION_DRAFT',
      isBlockBLocked: status !== 'SIGNED_BY_SEFIN',
      isBlockBVisible: ['SIGNED_BY_SEFIN', 'PAYMENT_PROCESSING', 'FUNDS_RELEASED', 'AWAITING_SUPRIDO_CONFIRMATION', 'AWAITING_ACCOUNTABILITY', 'ACCOUNTABILITY_OPEN'].includes(status),
      
      // Progress
      progressPercentage: ((currentPhaseIndex + 1) / WORKFLOW_PHASES.length) * 100
    }
  }, [status])


  return {
    // State
    status,
    isLoading,
    error,
    lastUpdate,
    
    // Phases
    phases: WORKFLOW_PHASES,
    
    // Flags
    ...flags,
    
    // Actions
    updateStatus,
    refresh: fetchStatus
  }
}

export default useWorkflowStatus
