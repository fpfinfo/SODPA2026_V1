'use client'

import React, { useState } from 'react'
import { 
  X, 
  FileText, 
  Upload,
  FilePlus,
  Loader2,
  FileCheck,
  AlertCircle
} from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useToast } from '../ui/ToastProvider'

interface SgpDocumentCreatorProps {
  isOpen: boolean
  onClose: () => void
  taskId: string
  solicitacaoId?: string
  onSuccess?: () => void
}

const DOCUMENT_TYPES = [
  { value: 'CERTIDAO_AVERBACAO', label: 'Certidão de Averbação', icon: FileCheck },
  { value: 'DESPACHO_SGP', label: 'Despacho SGP', icon: FileText },
  { value: 'NOTIFICACAO', label: 'Notificação ao Servidor', icon: AlertCircle },
  { value: 'COMPROVANTE_FOLHA', label: 'Comprovante de Inclusão em Folha', icon: FilePlus },
]

export function SgpDocumentCreator({ isOpen, onClose, taskId, solicitacaoId, onSuccess }: SgpDocumentCreatorProps) {
  const [selectedType, setSelectedType] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [observacoes, setObservacoes] = useState('')
  const { showToast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async () => {
    if (!selectedType) {
      showToast({ type: 'warning', title: 'Tipo Obrigatório', message: 'Selecione o tipo de documento.' })
      return
    }

    setIsProcessing(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      let fileUrl = null
      
      // Upload file if provided
      if (file) {
        const fileExt = file.name.split('.').pop()
        const fileName = `sgp/${taskId}/${Date.now()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('documentos')
          .upload(fileName, file)

        if (uploadError) {
          throw new Error(`Erro no upload: ${uploadError.message}`)
        }

        const { data: urlData } = supabase.storage
          .from('documentos')
          .getPublicUrl(fileName)

        fileUrl = urlData.publicUrl
      }

      // Create document record
      const { error: docError } = await supabase
        .from('documentos')
        .insert({
          solicitacao_id: solicitacaoId,
          tipo: selectedType,
          file_url: fileUrl,
          status: 'PENDENTE',
          source_type: 'SGP_CREATED',
          metadata: {
            sgp_task_id: taskId,
            observacoes: observacoes || null,
            created_by_module: 'SGP'
          },
          created_by: user?.id
        })

      if (docError) throw docError

      showToast({ type: 'success', title: 'Documento Criado!', message: `${DOCUMENT_TYPES.find(t => t.value === selectedType)?.label} anexado com sucesso.` })
      
      // Reset form
      setSelectedType('')
      setFile(null)
      setObservacoes('')
      onClose()
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error('Error creating document:', error)
      showToast({ type: 'error', title: 'Erro', message: (error as Error).message })
    } finally {
      setIsProcessing(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-rose-600 text-white p-6 rounded-t-[32px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <FilePlus size={22} />
              </div>
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight">Novo Documento</h3>
                <p className="text-rose-200 text-xs font-medium">Criar ou anexar documento ao processo</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-all">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Document Type Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Tipo de Documento *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DOCUMENT_TYPES.map((type) => {
                const Icon = type.icon
                const isSelected = selectedType === type.value
                return (
                  <button
                    key={type.value}
                    onClick={() => setSelectedType(type.value)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      isSelected 
                        ? 'border-rose-500 bg-rose-50' 
                        : 'border-slate-200 hover:border-rose-300 bg-white'
                    }`}
                  >
                    <Icon size={18} className={isSelected ? 'text-rose-600' : 'text-slate-400'} />
                    <p className={`text-xs font-bold mt-1 ${isSelected ? 'text-rose-700' : 'text-slate-700'}`}>
                      {type.label}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Arquivo (opcional)
            </label>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-rose-300 transition-colors">
              {file ? (
                <div className="flex items-center justify-center gap-2">
                  <FileCheck size={18} className="text-emerald-500" />
                  <span className="text-sm font-medium text-slate-700">{file.name}</span>
                  <button onClick={() => setFile(null)} className="text-slate-400 hover:text-red-500">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <Upload size={24} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-xs text-slate-500">Clique para selecionar ou arraste o arquivo</p>
                  <p className="text-[10px] text-slate-400 mt-1">PDF, JPG, PNG (máx 10MB)</p>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Observations */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Observações (opcional)
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Adicione informações relevantes..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none h-20 focus:ring-2 focus:ring-rose-200 outline-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 text-slate-500 font-bold text-xs hover:bg-slate-50 rounded-xl transition-all"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSubmit}
            disabled={!selectedType || isProcessing}
            className="flex-1 py-3 bg-rose-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
          >
            {isProcessing ? (
              <><Loader2 size={16} className="animate-spin"/> Salvando...</>
            ) : (
              <><FilePlus size={16}/> Criar Documento</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default SgpDocumentCreator
