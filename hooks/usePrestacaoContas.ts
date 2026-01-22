'use client'

import { useState, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useQueryClient } from '@tanstack/react-query'

// =============================================================================
// TYPES
// =============================================================================

export type PCStatus =
  | 'RASCUNHO'
  | 'SUBMETIDA'
  | 'EM_ANALISE'
  | 'PENDENCIA'
  | 'APROVADA'
  | 'SIAFE_BAIXADA'
  // TCE Status
  | 'TCE_INSTAURADA'
  | 'TCE_PRAZO_RECURSAL'
  | 'TCE_DECISAO'
  | 'TCE_AVERBACAO_SGP'

export interface PrestacaoContas {
  id: string
  solicitacao_id: string
  status: PCStatus
  valor_concedido: number
  valor_gasto: number
  valor_devolvido: number
  observacoes?: string
  motivo_pendencia?: string
  nlp_analysis?: any
  submitted_at?: string
  submitted_by?: string
  reviewed_at?: string
  reviewed_by?: string
  siafe_nl?: string
  siafe_date?: string
  // Campos Tributários
  total_inss_retido?: number
  total_inss_patronal?: number
  total_iss_retido?: number
  // GDR INSS
  gdr_inss_numero?: string
  gdr_inss_arquivo_path?: string
  gdr_inss_arquivo_url?: string
  gdr_inss_valor?: number
  gdr_inss_paga?: boolean
  gdr_inss_data_pagamento?: string
  // GDR Saldo
  gdr_saldo_numero?: string
  gdr_saldo_arquivo_path?: string
  gdr_saldo_arquivo_url?: string
  gdr_saldo_valor?: number
  gdr_saldo_paga?: boolean
  gdr_saldo_data_pagamento?: string
  // TCE fields
  tce_instaurada_at?: string
  tce_prazo_recursal_fim?: string
  tce_decisao?: 'ARQUIVADO' | 'AVERBACAO'
  tce_decisao_at?: string
  tce_decisao_by?: string
  tce_sgp_enviado_at?: string
  tce_observacoes?: string
  created_at: string
  updated_at: string
}

export interface PrestadorPFDados {
  nome: string
  cpf: string
  rg: string
  data_nascimento: string
  pis_nit: string
  endereco: {
    logradouro: string
    numero: string
    complemento?: string
    bairro: string
    cidade: string
    estado: string
    cep: string
  }
  atividade: string
  data_prestacao: string
  valor_bruto: number
  iss_retido: number
  inss_retido: number
  valor_liquido: number
  documentos_pessoais_path?: string
  comprovante_residencia_path?: string
}

export interface ComprovantePC {
  id: string
  prestacao_id: string
  tipo: 'NOTA_FISCAL' | 'CUPOM_FISCAL' | 'RECIBO' | 'FATURA' | 'OUTROS'
  numero?: string
  serie?: string
  emitente: string
  cnpj_cpf?: string
  valor: number
  data_emissao: string
  descricao?: string
  elemento_despesa: '3.3.90.30' | '3.3.90.33' | '3.3.90.36' | '3.3.90.39'
  file_path: string
  file_name: string
  storage_url?: string
  ocr_data?: any
  ocr_confidence?: number
  sentinela_risk?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  sentinela_alerts?: any[]
  validado: boolean
  validado_at?: string
  validado_by?: string
  glosa_valor?: number
  glosa_motivo?: string
  // Campos para Pessoa Física (elemento 3.3.90.36)
  prestador_pf_dados?: PrestadorPFDados
  inss_retido?: number
  iss_retido?: number
  valor_liquido?: number
  created_at: string
}

export interface UsePrestacaoContasOptions {
  solicitacaoId: string
}

// =============================================================================
// HOOK
// =============================================================================

export function usePrestacaoContas({ solicitacaoId }: UsePrestacaoContasOptions) {
  const queryClient = useQueryClient()
  
  // State
  const [pc, setPC] = useState<PrestacaoContas | null>(null)
  const [comprovantes, setComprovantes] = useState<ComprovantePC[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ==========================================================================
  // FETCH - Buscar PC existente
  // ==========================================================================
  const fetchPC = useCallback(async () => {
    if (!solicitacaoId) return

    try {
      setIsLoading(true)
      setError(null)

      // Buscar PC
      const { data: pcData, error: pcError } = await supabase
        .from('prestacao_contas')
        .select('*')
        .eq('solicitacao_id', solicitacaoId)
        .single()

      if (pcError && pcError.code !== 'PGRST116') { // 116 = not found
        throw pcError
      }

      setPC(pcData || null)

      // Buscar comprovantes se PC existe
      if (pcData) {
        const { data: compData, error: compError } = await supabase
          .from('comprovantes_pc')
          .select('*')
          .eq('prestacao_id', pcData.id)
          .order('created_at', { ascending: true })

        if (compError) throw compError
        setComprovantes(compData || [])
      }

      console.log('📋 [usePrestacaoContas] Loaded:', pcData?.status || 'not found')
    } catch (err: any) {
      console.error('❌ [usePrestacaoContas] Error:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [solicitacaoId])

  // ==========================================================================
  // CREATE - Iniciar nova PC (rascunho)
  // ==========================================================================
  const createPC = useCallback(async (valorConcedido: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data, error } = await supabase
        .from('prestacao_contas')
        .insert({
          solicitacao_id: solicitacaoId,
          status: 'RASCUNHO',
          valor_concedido: valorConcedido,
          submitted_by: user.id
        })
        .select()
        .single()

      if (error) throw error

      setPC(data)
      console.log('✅ [usePrestacaoContas] Created:', data.id)
      
      return { success: true, data }
    } catch (err: any) {
      console.error('❌ [usePrestacaoContas] Create error:', err)
      return { success: false, error: err.message }
    }
  }, [solicitacaoId])

  // ==========================================================================
  // SUBMIT - Submeter para análise SOSFU
  // ==========================================================================
  const submitPC = useCallback(async () => {
    if (!pc) throw new Error('PC não encontrada')

    try {
      // Validar: precisa ter pelo menos 1 comprovante
      if (comprovantes.length === 0) {
        throw new Error('Adicione pelo menos um comprovante antes de submeter')
      }

      // Validar: valor gasto não pode exceder valor concedido
      if (pc.valor_gasto > pc.valor_concedido) {
        throw new Error('Valor gasto excede o valor concedido')
      }

      const { error } = await supabase
        .from('prestacao_contas')
        .update({
          status: 'SUBMETIDA',
          submitted_at: new Date().toISOString()
        })
        .eq('id', pc.id)

      if (error) throw error

      // Atualizar workflow da solicitação
      await supabase
        .from('solicitacoes')
        .update({
          status_workflow: 'PC_SUBMITTED',
          updated_at: new Date().toISOString()
        })
        .eq('id', solicitacaoId)

      // Registrar histórico
      await supabase
        .from('historico_tramitacao')
        .insert({
          solicitacao_id: solicitacaoId,
          origem: 'SUPRIDO',
          destino: 'SOSFU',
          status_anterior: 'AWAITING_ACCOUNTABILITY',
          status_novo: 'PC_SUBMITTED',
          observacao: `Prestação de Contas submetida. Valor: R$ ${pc.valor_gasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        })

      setPC(prev => prev ? { ...prev, status: 'SUBMETIDA' } : null)
      queryClient.invalidateQueries({ queryKey: ['processes'] })
      
      console.log('✅ [usePrestacaoContas] Submitted')
      return { success: true }
    } catch (err: any) {
      console.error('❌ [usePrestacaoContas] Submit error:', err)
      return { success: false, error: err.message }
    }
  }, [pc, comprovantes, solicitacaoId, queryClient])

  // ==========================================================================
  // DEVOLV - Devolver para correção (SOSFU action)
  // ==========================================================================
  const devolvPC = useCallback(async (motivo: string) => {
    if (!pc) throw new Error('PC não encontrada')

    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from('prestacao_contas')
        .update({
          status: 'PENDENCIA',
          motivo_pendencia: motivo,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id
        })
        .eq('id', pc.id)

      if (error) throw error

      // Atualizar workflow
      await supabase
        .from('solicitacoes')
        .update({
          status_workflow: 'PC_PENDENCY',
          updated_at: new Date().toISOString()
        })
        .eq('id', solicitacaoId)

      // Registrar histórico
      await supabase
        .from('historico_tramitacao')
        .insert({
          solicitacao_id: solicitacaoId,
          origem: 'SOSFU',
          destino: 'SUPRIDO',
          status_anterior: 'PC_SUBMITTED',
          status_novo: 'PC_PENDENCY',
          observacao: `Prestação de Contas devolvida para correção. Motivo: ${motivo}`
        })

      setPC(prev => prev ? { ...prev, status: 'PENDENCIA', motivo_pendencia: motivo } : null)
      queryClient.invalidateQueries({ queryKey: ['processes'] })

      console.log('✅ [usePrestacaoContas] Returned to Suprido')
      return { success: true }
    } catch (err: any) {
      console.error('❌ [usePrestacaoContas] Devolv error:', err)
      return { success: false, error: err.message }
    }
  }, [pc, solicitacaoId, queryClient])

  // ==========================================================================
  // APPROVE - Aprovar PC (aguardar baixa SIAFE)
  // ==========================================================================
  const approvePC = useCallback(async () => {
    if (!pc) throw new Error('PC não encontrada')

    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from('prestacao_contas')
        .update({
          status: 'APROVADA',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id
        })
        .eq('id', pc.id)

      if (error) throw error

      // Atualizar workflow
      await supabase
        .from('solicitacoes')
        .update({
          status_workflow: 'PC_APPROVED',
          updated_at: new Date().toISOString()
        })
        .eq('id', solicitacaoId)

      setPC(prev => prev ? { ...prev, status: 'APROVADA' } : null)
      queryClient.invalidateQueries({ queryKey: ['processes'] })

      console.log('✅ [usePrestacaoContas] Approved')
      return { success: true }
    } catch (err: any) {
      console.error('❌ [usePrestacaoContas] Approve error:', err)
      return { success: false, error: err.message }
    }
  }, [pc, solicitacaoId, queryClient])

  // ==========================================================================
  // BAIXA SIAFE - Registrar baixa de responsabilidade
  // ==========================================================================
  const baixaSiafe = useCallback(async (siafeNl: string, siafeDate: string) => {
    if (!pc) throw new Error('PC não encontrada')
    if (!siafeNl || !siafeDate) throw new Error('Informe o número da NL e data da baixa')

    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from('prestacao_contas')
        .update({
          status: 'SIAFE_BAIXADA',
          siafe_nl: siafeNl,
          siafe_date: siafeDate,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id
        })
        .eq('id', pc.id)

      if (error) throw error

      // Atualizar workflow - processo finalizado
      await supabase
        .from('solicitacoes')
        .update({
          status_workflow: 'PC_SIAFE_DONE',
          siafe_nl: siafeNl,
          siafe_date: siafeDate,
          updated_at: new Date().toISOString()
        })
        .eq('id', solicitacaoId)

      // Registrar histórico
      await supabase
        .from('historico_tramitacao')
        .insert({
          solicitacao_id: solicitacaoId,
          origem: 'SOSFU',
          destino: 'ARQUIVO',
          status_anterior: 'PC_APPROVED',
          status_novo: 'PC_SIAFE_DONE',
          observacao: `Baixa SIAFE realizada. NL: ${siafeNl} | Data: ${siafeDate}`
        })

      setPC(prev => prev ? { ...prev, status: 'SIAFE_BAIXADA', siafe_nl: siafeNl, siafe_date: siafeDate } : null)
      queryClient.invalidateQueries({ queryKey: ['processes'] })

      console.log('✅ [usePrestacaoContas] SIAFE baixa completed')
      return { success: true }
    } catch (err: any) {
      console.error('❌ [usePrestacaoContas] Baixa error:', err)
      return { success: false, error: err.message }
    }
  }, [pc, solicitacaoId, queryClient])

  // ==========================================================================
  // TCE - Decisão do Ordenador
  // ==========================================================================
  const decidirTCE = useCallback(async (decisao: 'ARQUIVADO' | 'AVERBACAO', observacoes?: string) => {
    if (!pc) throw new Error('PC não encontrada')

    try {
      const { data: { user } } = await supabase.auth.getUser()

      const updateData: Partial<PrestacaoContas> = {
        status: decisao === 'AVERBACAO' ? 'TCE_AVERBACAO_SGP' : 'SIAFE_BAIXADA',
        tce_decisao: decisao,
        tce_decisao_at: new Date().toISOString(),
        tce_decisao_by: user?.id,
        tce_observacoes: observacoes
      }

      const { error } = await supabase
        .from('prestacao_contas')
        .update(updateData)
        .eq('id', pc.id)

      if (error) throw error

      // Atualizar workflow
      await supabase
        .from('solicitacoes')
        .update({
          status_workflow: decisao === 'AVERBACAO' ? 'TCE_AVERBACAO_SGP' : 'PC_SIAFE_DONE',
          updated_at: new Date().toISOString()
        })
        .eq('id', solicitacaoId)

      setPC(prev => prev ? { ...prev, ...updateData } as PrestacaoContas : null)
      queryClient.invalidateQueries({ queryKey: ['processes'] })

      console.log('✅ [usePrestacaoContas] TCE decision:', decisao)
      return { success: true }
    } catch (err: any) {
      console.error('❌ [usePrestacaoContas] TCE decision error:', err)
      return { success: false, error: err.message }
    }
  }, [pc, solicitacaoId, queryClient])

  // ==========================================================================
  // COMPUTED VALUES
  // ==========================================================================
  const computed = useMemo(() => {
    const saldoRestante = (pc?.valor_concedido || 0) - (pc?.valor_gasto || 0)
    const percentGasto = pc?.valor_concedido 
      ? ((pc.valor_gasto / pc.valor_concedido) * 100)
      : 0

    return {
      saldoRestante,
      percentGasto,
      hasComprovantes: comprovantes.length > 0,
      totalComprovantes: comprovantes.length,
      // Flags de status
      isDraft: pc?.status === 'RASCUNHO',
      isSubmitted: pc?.status === 'SUBMETIDA',
      isPendency: pc?.status === 'PENDENCIA',
      isApproved: pc?.status === 'APROVADA',
      isDone: pc?.status === 'SIAFE_BAIXADA',
      isTCE: pc?.status?.startsWith('TCE_') || false,
      // Permissões
      canEdit: pc?.status === 'RASCUNHO' || pc?.status === 'PENDENCIA',
      canSubmit: pc?.status === 'RASCUNHO' || pc?.status === 'PENDENCIA',
      canReview: pc?.status === 'SUBMETIDA' || pc?.status === 'EM_ANALISE',
      canBaixa: pc?.status === 'APROVADA'
    }
  }, [pc, comprovantes])

  return {
    // State
    pc,
    comprovantes,
    isLoading,
    error,
    
    // Computed
    ...computed,
    
    // Actions
    fetchPC,
    createPC,
    submitPC,
    devolvPC,
    approvePC,
    baixaSiafe,
    decidirTCE,
    refresh: fetchPC
  }
}

export default usePrestacaoContas
