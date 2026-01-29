'use client'

import React, { useEffect, useRef, useState } from 'react'
import { 
  X, 
  FileText, 
  Calendar,
  User,
  Building2,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Download,
  Printer,
  Send,
  RotateCcw,
  KeyRound,
  Loader2,
  FileSignature,
  CreditCard,
  FileQuestion,
  FilePlus
} from 'lucide-react'
import { SgpTask } from '../../hooks/useSgpCockpit'
import { supabase } from '../../lib/supabaseClient'

const BRASAO_TJPA_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/217479058_brasao-tjpa.png';

interface SgpContextDrawerProps {
  task: SgpTask | null
  isOpen: boolean
  onClose: () => void
  onSign?: (taskId: string) => Promise<void>
  onReturn?: (taskId: string, reason: string) => Promise<void>
  onCreateDocument?: (taskId: string) => void
  onTramitar?: (taskId: string) => void
}

// Timeline Event Component
interface TimelineEventProps {
  date: string
  time: string
  action: string
  actor?: string
  isLast?: boolean
  status?: 'completed' | 'current' | 'pending'
}

function TimelineEvent({ date, time, action, actor, isLast, status = 'completed' }: TimelineEventProps) {
  const statusColors = {
    completed: 'bg-emerald-500',
    current: 'bg-amber-500 animate-pulse',
    pending: 'bg-slate-300'
  }

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full ${statusColors[status]} flex-shrink-0`} />
        {!isLast && <div className="w-0.5 h-12 bg-slate-200 -mt-0.5" />}
      </div>
      <div className="pb-4 -mt-1">
        <div className="text-xs text-slate-400">{date} às {time}</div>
        <div className="text-sm font-medium text-slate-800">{action}</div>
        {actor && <div className="text-xs text-slate-500">Por: {actor}</div>}
      </div>
    </div>
  )
}

// Info Row Component
function InfoRow({ icon: Icon, label, value }: { 
  icon: React.ElementType
  label: string
  value: string | number | React.ReactNode 
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <Icon size={16} className="text-slate-400 flex-shrink-0" />
      <span className="text-sm text-slate-500 w-28">{label}</span>
      <span className="text-sm font-medium text-slate-800">{value}</span>
    </div>
  )
}

export function SgpContextDrawer({ task, isOpen, onClose, onSign, onReturn, onCreateDocument, onTramitar }: SgpContextDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null)
  const [isLoadingDocument, setIsLoadingDocument] = useState(false)
  const [solicitacaoData, setSolicitacaoData] = useState<any>(null)
  const [documentos, setDocumentos] = useState<any[]>([])
  const [returnReason, setReturnReason] = useState('')
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Fetch solicitacao and documents data
  useEffect(() => {
    const fetchData = async () => {
      if (!task?.solicitacao_id) {
        setSolicitacaoData(null)
        setDocumentos([])
        return
      }

      setIsLoadingDocument(true)
      try {
        // Fetch solicitacao with profile
        const { data: sol } = await supabase
          .from('solicitacoes')
          .select(`
            *,
            profiles:user_id (nome, cargo, email, cpf)
          `)
          .eq('id', task.solicitacao_id)
          .single()

        if (sol) {
          setSolicitacaoData(sol)
        }

        // Fetch related documents
        const { data: docs } = await supabase
          .from('documentos')
          .select('*')
          .eq('solicitacao_id', task.solicitacao_id)
          .order('created_at', { ascending: false })

        if (docs) {
          setDocumentos(docs)
        }
      } catch (err) {
        console.error('Error fetching SGP task data:', err)
      } finally {
        setIsLoadingDocument(false)
      }
    }

    if (isOpen && task) {
      fetchData()
    }
  }, [task?.solicitacao_id, isOpen])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  if (!isOpen || !task) return null

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('pt-BR')
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  const formatCurrency = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numValue || 0)
  }

  const getTypeLabel = (tipo: string) => {
    return tipo === 'ALCANCE' ? 'Alcance de Responsabilidade' : 'Glosa de Despesa'
  }

  const getTypeBadge = (tipo: string) => {
    const isAlcance = tipo === 'ALCANCE'
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-black uppercase ${
        isAlcance ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
      }`}>
        {tipo}
      </span>
    )
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string, text: string, label: string }> = {
      'PENDING': { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pendente' },
      'ASSIGNED': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Atribuído' },
      'IN_REVIEW': { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Em Análise' },
      'SIGNED': { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Assinado' },
      'RETURNED': { bg: 'bg-red-100', text: 'text-red-700', label: 'Devolvido' },
      'PROCESSED': { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Processado' }
    }
    const config = statusConfig[status] || statusConfig['PENDING']
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  // Timeline events
  const timelineEvents = [
    { 
      date: formatDate(task.created_at), 
      time: formatTime(task.created_at), 
      action: `Recebido de ${task.origem}`, 
      actor: task.origem,
      status: 'completed' as const
    },
    ...(task.assigned_at ? [{
      date: formatDate(task.assigned_at),
      time: formatTime(task.assigned_at),
      action: 'Atribuído para análise',
      actor: 'SGP',
      status: 'completed' as const
    }] : []),
    ...(task.assinado_em ? [{
      date: formatDate(task.assinado_em),
      time: formatTime(task.assinado_em),
      action: 'Averbação assinada',
      actor: 'SGP',
      status: 'completed' as const
    }] : []),
    {
      date: '-',
      time: '-',
      action: 'Aguardando Averbação',
      status: (task.status === 'PENDING' || task.status === 'ASSIGNED') ? 'current' as const : 'completed' as const
    }
  ]

  const handleSign = async () => {
    if (!onSign) return
    setIsProcessing(true)
    try {
      await onSign(task.id)
      onClose()
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReturn = async () => {
    if (!onReturn || !returnReason.trim()) return
    setIsProcessing(true)
    try {
      await onReturn(task.id, returnReason)
      setShowReturnModal(false)
      setReturnReason('')
      onClose()
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40 transition-opacity duration-300" />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`
          fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-rose-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 rounded-xl">
              <CreditCard size={20} className="text-rose-600" />
            </div>
            <div>
              <h2 className="font-black text-slate-800">{getTypeLabel(task.tipo)}</h2>
              <p className="text-xs text-slate-500 flex items-center gap-2">
                {task.titulo}
                {getTypeBadge(task.tipo)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(100%-180px)] p-5">
          {/* Status and Type Badges */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {getStatusBadge(task.status)}
              <span className="text-xs text-slate-400">Origem: {task.origem}</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-1.5 hover:bg-slate-100 rounded text-slate-500" title="Download">
                <Download size={16} />
              </button>
              <button className="p-1.5 hover:bg-slate-100 rounded text-slate-500" title="Imprimir">
                <Printer size={16} />
              </button>
            </div>
          </div>

          {/* Value Highlight */}
          <div className="bg-gradient-to-r from-rose-500 to-rose-600 rounded-2xl p-6 mb-6 text-white shadow-lg">
            <p className="text-xs font-medium text-rose-100 uppercase tracking-widest mb-1">Valor a Averbar</p>
            <p className="text-3xl font-black">{formatCurrency(task.valor)}</p>
            <p className="text-xs text-rose-200 mt-2">
              {task.tipo === 'ALCANCE' ? 'Reposição ao Erário' : 'Desconto em Folha'}
            </p>
          </div>

          {/* Document Preview Area */}
          <div className="bg-slate-100 rounded-xl p-4 mb-6 border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                <FileText size={16} className="text-slate-400" />
                Documentos ({documentos.length})
              </h3>
              {onCreateDocument && (
                <button
                  onClick={() => onCreateDocument(task.id)}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-bold text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors"
                >
                  <FilePlus size={14} />
                  Novo Doc
                </button>
              )}
            </div>
            
            {isLoadingDocument ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <Loader2 size={24} className="animate-spin mb-2" />
                <span className="text-xs">Carregando documentos...</span>
              </div>
            ) : documentos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <FileQuestion size={32} className="mb-2" />
                <span className="text-xs">Nenhum documento anexado</span>
              </div>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {documentos.slice(0, 5).map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 hover:border-rose-200 transition-colors">
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-slate-400" />
                      <span className="text-xs font-medium text-slate-700">{doc.tipo?.replace(/_/g, ' ')}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">{formatDate(doc.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Process Info */}
          <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-200">
            <h3 className="font-semibold text-slate-800 text-sm mb-3">Informações do Processo</h3>
            <div className="divide-y divide-slate-200">
              <InfoRow icon={User} label="Servidor" value={solicitacaoData?.profiles?.nome || task.titulo || 'N/A'} />
              <InfoRow icon={Building2} label="Lotação" value={solicitacaoData?.lotacao_nome || 'N/A'} />
              <InfoRow icon={DollarSign} label="Valor Original" value={formatCurrency(solicitacaoData?.valor_solicitado || 0)} />
              <InfoRow icon={Calendar} label="Recebido em" value={formatDate(task.created_at)} />
              <InfoRow icon={Clock} label="Prazo" value={task.assinado_em ? 'Concluído' : 'Aguardando'} />
            </div>
          </div>

          {/* Timeline */}
          <div className="mb-6">
            <h3 className="font-semibold text-slate-800 text-sm mb-4 flex items-center gap-2">
              <Calendar size={16} className="text-rose-500" />
              Histórico
            </h3>
            <div className="pl-2">
              {timelineEvents.filter(e => e.date !== '-' || e.status === 'current').map((event, index) => (
                <TimelineEvent
                  key={index}
                  {...event}
                  isLast={index === timelineEvents.length - 1}
                />
              ))}
            </div>
          </div>

          {/* Observations */}
          {task.observacoes && (
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
              <h3 className="font-semibold text-amber-800 text-sm mb-2 flex items-center gap-2">
                <AlertCircle size={16} />
                Observações
              </h3>
              <p className="text-sm text-amber-700">{task.observacoes}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {(task.status === 'PENDING' || task.status === 'ASSIGNED' || task.status === 'IN_REVIEW') && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200">
            <div className="flex gap-3">
              <button
                onClick={() => setShowReturnModal(true)}
                disabled={isProcessing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <RotateCcw size={18} />
                Devolver
              </button>
              {onTramitar && (
                <button
                  onClick={() => onTramitar(task.id)}
                  disabled={isProcessing}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-blue-300 bg-blue-50 rounded-xl text-blue-700 font-medium hover:bg-blue-100 transition-colors disabled:opacity-50"
                >
                  <Send size={18} />
                  Tramitar
                </button>
              )}
              <button
                onClick={handleSign}
                disabled={isProcessing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 rounded-xl text-white font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {isProcessing ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <FileSignature size={18} />
                )}
                Assinar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Return Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowReturnModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95">
            <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
              <RotateCcw size={20} className="text-amber-600" />
              Devolver Processo
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Informe o motivo da devolução para {task.origem}:
            </p>
            <textarea
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              placeholder="Descreva o motivo da devolução..."
              className="w-full p-3 border border-slate-200 rounded-xl text-sm resize-none h-24 focus:ring-2 focus:ring-rose-200 outline-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowReturnModal(false)}
                className="flex-1 py-2 text-slate-500 font-medium hover:bg-slate-50 rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleReturn}
                disabled={!returnReason.trim() || isProcessing}
                className="flex-1 py-2 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing && <Loader2 size={16} className="animate-spin" />}
                Confirmar Devolução
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default SgpContextDrawer
