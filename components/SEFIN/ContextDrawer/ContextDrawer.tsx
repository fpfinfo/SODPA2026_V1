'use client'

import React, { useEffect, useRef } from 'react'
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
  Edit3,
  Send,
  RotateCcw,
  KeyRound
} from 'lucide-react'
import { SefinTask } from '../../../hooks/useSefinCockpit'

interface ContextDrawerProps {
  task: SefinTask | null
  isOpen: boolean
  onClose: () => void
  onSign?: (taskId: string) => void
  onReturn?: (taskId: string, reason: string) => void
}

// Timeline Event Component
interface TimelineEventProps {
  date: string
  time: string
  action: string
  actor?: string
  isFirst?: boolean
  isLast?: boolean
  status?: 'completed' | 'current' | 'pending'
}

function TimelineEvent({ date, time, action, actor, isFirst, isLast, status = 'completed' }: TimelineEventProps) {
  const statusColors = {
    completed: 'bg-emerald-500',
    current: 'bg-amber-500 animate-pulse',
    pending: 'bg-slate-300'
  }

  return (
    <div className="flex gap-3">
      {/* Timeline Line */}
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full ${statusColors[status]} flex-shrink-0`} />
        {!isLast && <div className="w-0.5 h-12 bg-slate-200 -mt-0.5" />}
      </div>

      {/* Content */}
      <div className="pb-4 -mt-1">
        <div className="text-xs text-slate-400">{date} às {time}</div>
        <div className="text-sm font-medium text-slate-800">{action}</div>
        {actor && <div className="text-xs text-slate-500">Por: {actor}</div>}
      </div>
    </div>
  )
}

// Document Info Row
function InfoRow({ icon: Icon, label, value }: { 
  icon: React.ElementType
  label: string
  value: string | number 
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <Icon size={16} className="text-slate-400 flex-shrink-0" />
      <span className="text-sm text-slate-500 w-24">{label}</span>
      <span className="text-sm font-medium text-slate-800">{value}</span>
    </div>
  )
}

export function ContextDrawer({ task, isOpen, onClose, onSign, onReturn }: ContextDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null)

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  const getTypeLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      'PORTARIA': 'Portaria de Concessão',
      'CERTIDAO_REGULARIDADE': 'Certidão de Regularidade',
      'NOTA_EMPENHO': 'Nota de Empenho',
      'NOTA_LIQUIDACAO': 'Nota de Liquidação',
      'ORDEM_BANCARIA': 'Ordem Bancária'
    }
    return labels[tipo] || tipo
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string, text: string, label: string }> = {
      'PENDING': { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pendente' },
      'SIGNED': { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Assinado' },
      'REJECTED': { bg: 'bg-red-100', text: 'text-red-700', label: 'Devolvido' },
      'SENT': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Enviado' }
    }
    const config = statusConfig[status] || statusConfig['PENDING']
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  // Mock timeline events (in production, fetch from historico_tramitacao)
  const timelineEvents = [
    { 
      date: formatDate(task.created_at), 
      time: formatTime(task.created_at), 
      action: 'Enviado para SEFIN', 
      actor: 'SOSFU',
      status: 'completed' as const
    },
    { 
      date: formatDate(task.created_at), 
      time: formatTime(new Date(new Date(task.created_at).getTime() - 3600000).toISOString()), 
      action: `${getTypeLabel(task.tipo)} gerada`, 
      actor: 'Sistema',
      status: 'completed' as const
    },
    { 
      date: formatDate(new Date(new Date(task.created_at).getTime() - 86400000).toISOString()), 
      time: '16:45', 
      action: 'Solicitação aprovada pelo Gestor', 
      actor: 'Gestor',
      status: 'completed' as const
    }
  ]

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
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <FileText size={20} className="text-amber-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800">{getTypeLabel(task.tipo)}</h2>
              <p className="text-xs text-slate-500">{task.processo?.nup || 'N/A'}</p>
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
        <div className="overflow-y-auto h-[calc(100%-140px)] p-5">
          {/* Status Badge */}
          <div className="flex items-center justify-between mb-4">
            {getStatusBadge(task.status)}
            <div className="flex items-center gap-2">
              <button className="p-1.5 hover:bg-slate-100 rounded text-slate-500">
                <Download size={16} />
              </button>
              <button className="p-1.5 hover:bg-slate-100 rounded text-slate-500">
                <Printer size={16} />
              </button>
            </div>
          </div>

          {/* Document Preview Placeholder */}
          <div className="bg-slate-100 rounded-xl p-4 mb-6 border border-slate-200">
            <div className="aspect-[210/297] bg-white rounded-lg border border-slate-200 shadow-sm flex items-center justify-center">
              <div className="text-center">
                <FileText size={40} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm text-slate-400">Preview do documento</p>
                <button className="mt-2 text-xs text-amber-600 hover:underline">
                  Abrir visualização completa
                </button>
              </div>
            </div>
          </div>

          {/* Document Info */}
          <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-200">
            <h3 className="font-semibold text-slate-800 text-sm mb-3">Informações</h3>
            <div className="divide-y divide-slate-200">
              <InfoRow icon={User} label="Suprido" value={task.processo?.suprido_nome || 'N/A'} />
              <InfoRow icon={Building2} label="Lotação" value={task.processo?.lotacao_nome || 'N/A'} />
              <InfoRow icon={DollarSign} label="Valor" value={formatCurrency(task.processo?.valor_total || 0)} />
              <InfoRow icon={Calendar} label="Criado em" value={formatDate(task.created_at)} />
              <InfoRow icon={Clock} label="Horário" value={formatTime(task.created_at)} />
            </div>
          </div>

          {/* Timeline */}
          <div className="mb-6">
            <h3 className="font-semibold text-slate-800 text-sm mb-4 flex items-center gap-2">
              <Calendar size={16} className="text-blue-500" />
              Histórico do Processo
            </h3>
            <div className="pl-2">
              {timelineEvents.map((event, index) => (
                <TimelineEvent
                  key={index}
                  {...event}
                  isFirst={index === 0}
                  isLast={index === timelineEvents.length - 1}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        {task.status === 'PENDING' && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200">
            <div className="flex gap-3">
              <button
                onClick={() => onReturn?.(task.id, 'Motivo da devolução')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
              >
                <RotateCcw size={18} />
                Devolver
              </button>
              <button
                onClick={() => onSign?.(task.id)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 rounded-lg text-white font-medium hover:bg-emerald-700 transition-colors"
              >
                <KeyRound size={18} />
                Assinar
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default ContextDrawer
