'use client'

import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

// =============================================================================
// TYPES
// =============================================================================

export type TipoComprovante = 'NOTA_FISCAL' | 'CUPOM_FISCAL' | 'RECIBO' | 'FATURA' | 'OUTROS'
export type ElementoDespesa = '3.3.90.30' | '3.3.90.33' | '3.3.90.36' | '3.3.90.39'
export type SentinelaRisk = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface ComprovanteMetadata {
  tipo: TipoComprovante
  numero?: string
  serie?: string
  emitente: string
  cnpj_cpf?: string
  valor: number
  data_emissao: string
  descricao?: string
  elemento_despesa: ElementoDespesa
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
  tipo: TipoComprovante
  numero?: string
  serie?: string
  emitente: string
  cnpj_cpf?: string
  valor: number
  data_emissao: string
  descricao?: string
  elemento_despesa: ElementoDespesa
  file_path: string
  file_name: string
  storage_url?: string
  file_size_bytes?: number
  mime_type?: string
  ocr_data?: any
  ocr_confidence?: number
  sentinela_risk?: SentinelaRisk
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

export interface UseComprovantesOptions {
  prestacaoId: string
}

// =============================================================================
// CONSTANTS
// =============================================================================

const STORAGE_BUCKET = 'comprovantes'
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']

// Elementos de despesa com labels
export const ELEMENTOS_DESPESA = [
  { code: '3.3.90.30', label: 'Material de Consumo' },
  { code: '3.3.90.33', label: 'Passagens e Locomoção' },
  { code: '3.3.90.36', label: 'Serviços Pessoa Física' },
  { code: '3.3.90.39', label: 'Serviços Pessoa Jurídica' }
] as const

// Tipos de comprovante com labels
export const TIPOS_COMPROVANTE = [
  { code: 'NOTA_FISCAL', label: 'Nota Fiscal' },
  { code: 'CUPOM_FISCAL', label: 'Cupom Fiscal' },
  { code: 'RECIBO', label: 'Recibo' },
  { code: 'FATURA', label: 'Fatura' },
  { code: 'OUTROS', label: 'Outros' }
] as const

// =============================================================================
// HOOK
// =============================================================================

export function useComprovantes({ prestacaoId }: UseComprovantesOptions) {
  const [comprovantes, setComprovantes] = useState<ComprovantePC[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // ==========================================================================
  // FETCH - Listar comprovantes
  // ==========================================================================
  const fetchComprovantes = useCallback(async () => {
    if (!prestacaoId) return

    try {
      setIsLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('comprovantes_pc')
        .select('*')
        .eq('prestacao_id', prestacaoId)
        .order('created_at', { ascending: true })

      if (fetchError) throw fetchError

      setComprovantes(data || [])
      console.log('📋 [useComprovantes] Loaded:', data?.length || 0, 'items')
    } catch (err: any) {
      console.error('❌ [useComprovantes] Fetch error:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [prestacaoId])

  // ==========================================================================
  // UPLOAD - Upload de arquivo + criar registro
  // ==========================================================================
  const uploadComprovante = useCallback(async (
    file: File,
    metadata: ComprovanteMetadata
  ) => {
    if (!prestacaoId) throw new Error('Prestação não encontrada')

    // Validações
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Tipo de arquivo não permitido. Use PDF, JPEG ou PNG.')
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error('Arquivo muito grande. Máximo: 10MB')
    }

    try {
      setIsUploading(true)
      setUploadProgress(0)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      // Gerar caminho único no storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${prestacaoId}/${Date.now()}_${crypto.randomUUID()}.${fileExt}`

      console.log('📤 [useComprovantes] Uploading:', fileName)
      setUploadProgress(20)

      // Upload para Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError
      setUploadProgress(60)

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(fileName)

      setUploadProgress(80)

      // Criar registro no banco
      const { data: record, error: insertError } = await supabase
        .from('comprovantes_pc')
        .insert({
          prestacao_id: prestacaoId,
          tipo: metadata.tipo,
          numero: metadata.numero,
          serie: metadata.serie,
          emitente: metadata.emitente,
          cnpj_cpf: metadata.cnpj_cpf,
          valor: metadata.valor,
          data_emissao: metadata.data_emissao,
          descricao: metadata.descricao,
          elemento_despesa: metadata.elemento_despesa,
          file_path: uploadData.path,
          file_name: file.name,
          storage_url: urlData.publicUrl,
          file_size_bytes: file.size,
          mime_type: file.type
        })
        .select()
        .single()

      if (insertError) throw insertError
      setUploadProgress(100)

      // Atualizar lista local
      setComprovantes(prev => [...prev, record])

      console.log('✅ [useComprovantes] Upload complete:', record.id)
      return { success: true, data: record }
    } catch (err: any) {
      console.error('❌ [useComprovantes] Upload error:', err)
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }, [prestacaoId])

  // ==========================================================================
  // DELETE - Remover comprovante
  // ==========================================================================
  const deleteComprovante = useCallback(async (comprovanteId: string) => {
    const comprovante = comprovantes.find(c => c.id === comprovanteId)
    if (!comprovante) throw new Error('Comprovante não encontrado')

    try {
      setError(null)

      // Remover do Storage
      const { error: storageError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([comprovante.file_path])

      if (storageError) {
        console.warn('⚠️ [useComprovantes] Storage delete warning:', storageError)
        // Continuar mesmo se falhar no storage
      }

      // Remover do banco
      const { error: deleteError } = await supabase
        .from('comprovantes_pc')
        .delete()
        .eq('id', comprovanteId)

      if (deleteError) throw deleteError

      // Atualizar lista local
      setComprovantes(prev => prev.filter(c => c.id !== comprovanteId))

      console.log('✅ [useComprovantes] Deleted:', comprovanteId)
      return { success: true }
    } catch (err: any) {
      console.error('❌ [useComprovantes] Delete error:', err)
      setError(err.message)
      return { success: false, error: err.message }
    }
  }, [comprovantes])

  // ==========================================================================
  // VALIDAR - Marcar comprovante como validado (SOSFU action)
  // ==========================================================================
  const validarComprovante = useCallback(async (
    comprovanteId: string,
    glosa?: { valor: number; motivo: string }
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const updateData: Partial<ComprovantePC> = {
        validado: true,
        validado_at: new Date().toISOString(),
        validado_by: user?.id
      }

      if (glosa) {
        updateData.glosa_valor = glosa.valor
        updateData.glosa_motivo = glosa.motivo
      }

      const { error } = await supabase
        .from('comprovantes_pc')
        .update(updateData)
        .eq('id', comprovanteId)

      if (error) throw error

      // Atualizar lista local
      setComprovantes(prev => prev.map(c => 
        c.id === comprovanteId ? { ...c, ...updateData } as ComprovantePC : c
      ))

      console.log('✅ [useComprovantes] Validated:', comprovanteId)
      return { success: true }
    } catch (err: any) {
      console.error('❌ [useComprovantes] Validate error:', err)
      return { success: false, error: err.message }
    }
  }, [])

  // ==========================================================================
  // SENTINELA OCR - Executar análise de documento
  // ==========================================================================
  const runSentinelaOCR = useCallback(async (comprovanteId: string) => {
    const comprovante = comprovantes.find(c => c.id === comprovanteId)
    if (!comprovante) throw new Error('Comprovante não encontrado')

    try {
      console.log('🔍 [useComprovantes] Running Sentinela OCR on:', comprovanteId)

      // TODO: Integrar com Tesseract.js ou API de OCR
      // Por enquanto, simular resultado
      const mockOcrResult = {
        success: true,
        confidence: 85.5,
        extractedData: {
          numero: comprovante.numero || 'Não detectado',
          emitente: comprovante.emitente,
          valor: comprovante.valor,
          data: comprovante.data_emissao
        },
        risk: 'LOW' as SentinelaRisk,
        alerts: []
      }

      // Salvar resultado
      const { error } = await supabase
        .from('comprovantes_pc')
        .update({
          ocr_data: mockOcrResult.extractedData,
          ocr_confidence: mockOcrResult.confidence,
          sentinela_risk: mockOcrResult.risk,
          sentinela_alerts: mockOcrResult.alerts
        })
        .eq('id', comprovanteId)

      if (error) throw error

      // Atualizar lista local
      setComprovantes(prev => prev.map(c => 
        c.id === comprovanteId ? {
          ...c,
          ocr_data: mockOcrResult.extractedData,
          ocr_confidence: mockOcrResult.confidence,
          sentinela_risk: mockOcrResult.risk,
          sentinela_alerts: mockOcrResult.alerts
        } : c
      ))

      console.log('✅ [useComprovantes] OCR completed:', mockOcrResult.risk)
      return { success: true, data: mockOcrResult }
    } catch (err: any) {
      console.error('❌ [useComprovantes] OCR error:', err)
      return { success: false, error: err.message }
    }
  }, [comprovantes])

  // ==========================================================================
  // COMPUTED
  // ==========================================================================
  const totalValor = comprovantes.reduce((sum, c) => sum + c.valor, 0)
  const totalGlosado = comprovantes.reduce((sum, c) => sum + (c.glosa_valor || 0), 0)
  const totalLiquido = totalValor - totalGlosado
  const totalValidados = comprovantes.filter(c => c.validado).length
  const pendentesValidacao = comprovantes.filter(c => !c.validado).length

  // Agrupar por elemento de despesa
  const porElemento = comprovantes.reduce((acc, c) => {
    const key = c.elemento_despesa
    if (!acc[key]) {
      acc[key] = { total: 0, count: 0, comprovantes: [] }
    }
    acc[key].total += c.valor - (c.glosa_valor || 0)
    acc[key].count += 1
    acc[key].comprovantes.push(c)
    return acc
  }, {} as Record<string, { total: number; count: number; comprovantes: ComprovantePC[] }>)

  // Alertas Sentinela
  const alertasCriticos = comprovantes.filter(c => c.sentinela_risk === 'CRITICAL').length
  const alertasAltos = comprovantes.filter(c => c.sentinela_risk === 'HIGH').length

  return {
    // State
    comprovantes,
    isLoading,
    isUploading,
    uploadProgress,
    error,

    // Computed
    totalValor,
    totalGlosado,
    totalLiquido,
    totalValidados,
    pendentesValidacao,
    porElemento,
    alertasCriticos,
    alertasAltos,

    // Actions
    fetchComprovantes,
    uploadComprovante,
    deleteComprovante,
    validarComprovante,
    runSentinelaOCR,
    refresh: fetchComprovantes
  }
}

export default useComprovantes
