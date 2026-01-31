'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Users,
  UserPlus,
  ArrowRight,
  Send,
  FileSignature,
  Inbox,
  User,
  Filter,
  RotateCcw,
  X,
  Eye,
  UserCheck,
  CheckSquare,
  Square,
  Keyboard,
  Focus,
  BarChart3,
  History
} from 'lucide-react'
import { useSefinCockpit, SefinTask } from '../../../hooks/useSefinCockpit'
import { useSefinTeamMembers, SefinTeamMemberWithWorkload } from '../../../hooks/useSefinTeamMembers'
import { useToast } from '../../ui/ToastProvider'
import { SignatureModal } from '../../ui/SignatureModal'
import { ContextDrawer } from '../ContextDrawer/ContextDrawer'

// Types
type ListFilter = 'INBOX' | 'MY_TASKS' | 'PROCESSED' | 'TEAM_MEMBER'

// Format currency
const formatCurrency = (value: number) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

// KPI Card Component
interface KPICardProps {
  label: string
  value: number
  sublabel: string
  icon: React.ReactNode
  color: 'amber' | 'emerald' | 'blue' | 'red'
  onClick?: () => void
}

function KPICard({ label, value, sublabel, icon, color, onClick }: KPICardProps) {
  const colorMap = {
    amber: 'from-amber-500 to-amber-600 border-amber-200',
    emerald: 'from-emerald-500 to-emerald-600 border-emerald-200',
    blue: 'from-blue-500 to-blue-600 border-blue-200',
    red: 'from-red-500 to-red-600 border-red-200'
  }

  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-2xl border-2 ${onClick ? 'cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02]' : ''} overflow-hidden`}
    >
      <div className={`bg-gradient-to-r ${colorMap[color]} p-4 text-white`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium opacity-90 uppercase tracking-wider">{label}</p>
            <p className="text-3xl font-black mt-1">{value}</p>
          </div>
          <div className="p-3 bg-white/20 rounded-xl">
            {icon}
          </div>
        </div>
      </div>
      <div className="px-4 py-2 bg-slate-50">
        <p className="text-xs text-slate-500 font-medium">{sublabel}</p>
      </div>
    </div>
  )
}

// Team Member Card
interface TeamMemberCardProps {
  member: SefinTeamMemberWithWorkload
  isCurrentUser: boolean
  onRedistribute?: (memberId: string) => void
  onDrop?: (taskId: string) => void
  isDragActive?: boolean
}

function TeamMemberCard({ member, isCurrentUser, onRedistribute, onDrop, isDragActive }: TeamMemberCardProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const taskId = e.dataTransfer.getData('taskId')
    if (taskId && onDrop) {
      onDrop(taskId)
    }
  }

  return (
    <div 
      className={`bg-white rounded-2xl border-2 p-5 transition-all ${
        isCurrentUser ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200'
      } ${isDragOver ? '!border-emerald-400 !ring-4 !ring-emerald-100 scale-[1.02] shadow-lg' : ''} ${
        isDragActive ? 'opacity-70' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drop Zone Indicator */}
      {isDragOver && (
        <div className="absolute inset-0 bg-emerald-500/10 rounded-2xl flex items-center justify-center pointer-events-none z-10">
          <div className="bg-emerald-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
            ⬇️ Redistribuir para {member.nome.split(' ')[0]}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <img 
          src={member.avatar} 
          alt={member.nome}
          className="w-16 h-16 rounded-full border-2 border-white shadow-lg"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-800">{member.nome}</h3>
            {isCurrentUser && (
              <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-full uppercase">
                Você
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">{member.cargo}</p>
          
          {/* Workload Bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-500">Carga de Trabalho</span>
              <span className={`font-bold ${member.workloadPercent > 80 ? 'text-red-600' : member.workloadPercent > 50 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {member.workloadPercent}%
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${
                  member.workloadPercent > 80 ? 'bg-red-500' : 
                  member.workloadPercent > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${member.workloadPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100">
        <div className="text-center">
          <p className="text-xl font-black text-slate-800">{member.pendingCount}</p>
          <p className="text-[10px] text-slate-500 uppercase">Pendentes</p>
        </div>
        <div className="text-center border-x border-slate-100">
          <p className="text-xl font-black text-emerald-600">{member.signedTodayCount}</p>
          <p className="text-[10px] text-slate-500 uppercase">Hoje</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-black text-blue-600">{member.assignedCount}</p>
          <p className="text-[10px] text-slate-500 uppercase">Total</p>
        </div>
      </div>
    </div>
  )
}

// Process List Item
interface ProcessItemProps {
  task: SefinTask
  currentUserId: string | null
  isSelected?: boolean
  onToggleSelect?: () => void
  onAssignToMe?: () => void
  onAssignToColleague?: () => void
  onSign?: () => void
  onView?: () => void
  isHighlighted?: boolean
}

function ProcessItem({ task, currentUserId, isSelected, onToggleSelect, onAssignToMe, onAssignToColleague, onSign, onView, isHighlighted }: ProcessItemProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const tooltipTimeout = React.useRef<NodeJS.Timeout | null>(null)

  const getTypeLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      'PORTARIA': 'Portaria',
      'CERTIDAO_REGULARIDADE': 'Certidão',
      'NOTA_EMPENHO': 'NE',
      'NOTA_LIQUIDACAO': 'NL',
      'ORDEM_BANCARIA': 'OB',
      'DECISAO': 'Decisão',
      'PARECER': 'Parecer',
      'AUTORIZACAO_ORDENADOR': 'Autorização'
    }
    return labels[tipo] || tipo
  }

  const created = new Date(task.created_at)
  const hoursAgo = Math.round((Date.now() - created.getTime()) / (1000 * 60 * 60))
  const isUrgent = hoursAgo > 24
  const isAssignedToMe = task.assigned_to === currentUserId
  const isAssigned = !!task.assigned_to

  // SLA Calculation - 48h default for SEFIN documents
  const SLA_HOURS = 48
  const hoursRemaining = SLA_HOURS - hoursAgo
  const slaPercent = Math.max(0, Math.min(100, (hoursRemaining / SLA_HOURS) * 100))
  const slaColor = hoursRemaining > 24 ? 'bg-emerald-400' : hoursRemaining > 12 ? 'bg-amber-400' : 'bg-red-500'
  const slaTextColor = hoursRemaining > 24 ? 'text-emerald-600' : hoursRemaining > 12 ? 'text-amber-600' : 'text-red-600'

  // Tooltip handlers with delay
  const handleMouseEnter = () => {
    tooltipTimeout.current = setTimeout(() => setShowTooltip(true), 400)
  }
  const handleMouseLeave = () => {
    if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current)
    setShowTooltip(false)
  }

  return (
    <div 
      className={`bg-white rounded-xl border-2 transition-all overflow-hidden relative ${
      isSelected ? 'border-emerald-400 ring-2 ring-emerald-100' : 
      isHighlighted ? 'border-amber-400 ring-2 ring-amber-100' : 
      'border-slate-200 hover:border-amber-300 hover:shadow-md'
    } ${task.assigned_to ? 'cursor-grab active:cursor-grabbing' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      draggable={!!task.assigned_to}
      onDragStart={(e) => {
        e.dataTransfer.setData('taskId', task.id)
        e.dataTransfer.effectAllowed = 'move'
      }}
    >
      {/* SLA Progress Bar */}
      {task.status === 'PENDING' && (
        <div className="h-1 bg-slate-100 w-full">
          <div 
            className={`h-full ${slaColor} transition-all`} 
            style={{ width: `${slaPercent}%` }}
          />
        </div>
      )}

      {/* Preview Tooltip */}
      {showTooltip && (
        <div className="absolute z-50 left-1/2 -translate-x-1/2 -top-2 -translate-y-full bg-slate-900 text-white text-xs rounded-lg p-3 shadow-xl min-w-[280px] pointer-events-none animate-in fade-in duration-150">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-slate-400">NUP:</span>
              <p className="font-medium">{task.processo?.nup || 'N/A'}</p>
            </div>
            <div>
              <span className="text-slate-400">Valor:</span>
              <p className="font-medium text-emerald-400">{formatCurrency(task.processo?.valor_total || 0)}</p>
            </div>
            <div>
              <span className="text-slate-400">Suprido:</span>
              <p className="font-medium truncate">{task.processo?.suprido_nome || 'N/A'}</p>
            </div>
            <div>
              <span className="text-slate-400">SLA:</span>
              <p className={`font-medium ${slaTextColor}`}>
                {hoursRemaining > 0 ? `${hoursRemaining}h restantes` : 'Vencido!'}
              </p>
            </div>
          </div>
          {/* Arrow */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-full w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-slate-900" />
        </div>
      )}

      {/* Main Content - Clickable */}
      <div 
        onClick={onView}
        className="flex items-center gap-4 p-4 cursor-pointer"
      >
        {/* Selection Checkbox */}
        {onToggleSelect && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}
            className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
              isSelected 
                ? 'bg-emerald-500 border-emerald-500 text-white' 
                : 'border-slate-300 hover:border-emerald-400 text-transparent hover:text-emerald-400'
            }`}
          >
            <CheckCircle2 size={14} />
          </button>
        )}
        
        {/* Type Badge */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isUrgent ? 'bg-red-100' : 'bg-amber-100'
        }`}>
          {isUrgent ? (
            <AlertTriangle size={20} className="text-red-500" />
          ) : (
            <FileText size={20} className="text-amber-600" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-800 truncate">{task.processo?.nup || 'N/A'}</span>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-100 text-purple-700 rounded-full">
              {getTypeLabel(task.tipo)}
            </span>
            {isUrgent && (
              <span className="px-2 py-0.5 text-[10px] font-bold bg-red-100 text-red-700 rounded-full animate-pulse">
                URGENTE
              </span>
            )}
            {isAssignedToMe && (
              <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 rounded-full">
                MINHA TAREFA
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 truncate">{task.processo?.suprido_nome || 'N/A'}</p>
          <p className="text-xs text-slate-400">{task.processo?.lotacao_nome}</p>
        </div>

        {/* Value */}
        <div className="text-right flex-shrink-0">
          <p className="font-bold text-slate-800">
            {formatCurrency(task.processo?.valor_total || 0)}
          </p>
          <p className={`text-xs ${isUrgent ? 'text-red-600 font-bold' : 'text-slate-400'}`}>
            {hoursAgo}h atrás
          </p>
        </div>

        {/* View Arrow */}
        <ArrowRight size={18} className="text-slate-300 hover:text-amber-500 flex-shrink-0" />
      </div>

      {/* Action Buttons - Always Visible */}
      <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-t border-slate-100">
        {/* Assignment Actions - Only show if not assigned */}
        {!isAssigned && (
          <>
            {onAssignToMe && (
              <button 
                onClick={(e) => { e.stopPropagation(); onAssignToMe(); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
              >
                <UserCheck size={14} />
                Atribuir para Mim
              </button>
            )}
            {onAssignToColleague && (
              <button 
                onClick={(e) => { e.stopPropagation(); onAssignToColleague(); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-300 transition-colors"
              >
                <UserPlus size={14} />
                Atribuir Colega
              </button>
            )}
          </>
        )}

        {/* Sign Button - Only show if assigned to me */}
        {isAssignedToMe && onSign && (
          <button 
            onClick={(e) => { e.stopPropagation(); onSign(); }}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors"
          >
            <FileSignature size={14} />
            Assinar Documento
          </button>
        )}

        {/* View Button */}
        {onView && (
          <button 
            onClick={(e) => { e.stopPropagation(); onView(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 text-sm font-medium rounded-lg hover:bg-amber-200 transition-colors ml-auto"
          >
            <Eye size={14} />
            Ver Detalhes
          </button>
        )}
      </div>
    </div>
  )
}


// Main Component Props
interface SefinControlPanelViewProps {
  darkMode?: boolean
}

// Main Component
export function SefinControlPanelView({ darkMode = false }: SefinControlPanelViewProps) {
  const { showToast } = useToast()
  const { 
    tasks, 
    kpis, 
    isLoading, 
    currentUserId,
    assignTask, 
    assignToMe,
    signTask
  } = useSefinCockpit()
  
  const { teamLoad, getColleague } = useSefinTeamMembers()

  // Persistent Filter State (localStorage)
  const FILTER_STORAGE_KEY = 'sefin_list_filter'
  const getInitialFilter = (): ListFilter => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(FILTER_STORAGE_KEY)
      if (saved && ['INBOX', 'MY_TASKS', 'PROCESSED', 'TEAM_MEMBER'].includes(saved)) {
        return saved as ListFilter
      }
    }
    return 'INBOX'
  }

  // State
  const [listFilter, setListFilter] = useState<ListFilter>(getInitialFilter)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<SefinTask | null>(null)
  
  // Batch Selection State
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set())
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [isBatchSigning, setIsBatchSigning] = useState(false)

  // Persist filter changes to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(FILTER_STORAGE_KEY, listFilter)
    }
  }, [listFilter])

  // Focus Mode State
  const [focusMode, setFocusMode] = useState(false)

  // Action History State
  interface ActionLogEntry {
    id: string
    type: 'ASSIGN' | 'SIGN' | 'BATCH_SIGN' | 'REDISTRIBUTE' | 'VIEW'
    description: string
    timestamp: Date
    taskId?: string
    nup?: string
  }
  const [actionHistory, setActionHistory] = useState<ActionLogEntry[]>([])
  const [showAuditPanel, setShowAuditPanel] = useState(false)

  // Log action helper
  const logAction = useCallback((entry: Omit<ActionLogEntry, 'id' | 'timestamp'>) => {
    setActionHistory(prev => [{
      ...entry,
      id: crypto.randomUUID(),
      timestamp: new Date()
    }, ...prev].slice(0, 50)) // Keep last 50 actions
  }, [])

  // Computed KPIs
  const myTasks = useMemo(() => 
    tasks.filter(t => t.assigned_to === currentUserId && t.status === 'PENDING'),
    [tasks, currentUserId]
  )

  const signedToday = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    return tasks.filter(t => t.status === 'SIGNED' && t.signed_at?.startsWith(today))
  }, [tasks])

  // Extended Statistics
  const signedThisWeek = useMemo(() => {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    return tasks.filter(t => t.status === 'SIGNED' && t.signed_at && new Date(t.signed_at) >= weekAgo)
  }, [tasks])

  const signedThisMonth = useMemo(() => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    return tasks.filter(t => t.status === 'SIGNED' && t.signed_at && new Date(t.signed_at) >= monthStart)
  }, [tasks])

  // Average processing time (hours)
  const avgProcessingTime = useMemo(() => {
    const signedWithTime = tasks.filter(t => t.status === 'SIGNED' && t.signed_at && t.created_at)
    if (signedWithTime.length === 0) return 0
    const totalHours = signedWithTime.reduce((sum, t) => {
      const created = new Date(t.created_at).getTime()
      const signed = new Date(t.signed_at!).getTime()
      return sum + (signed - created) / (1000 * 60 * 60)
    }, 0)
    return Math.round(totalHours / signedWithTime.length)
  }, [tasks])

  const urgentTasks = useMemo(() => 
    tasks.filter(t => {
      const created = new Date(t.created_at)
      const hoursAgo = (Date.now() - created.getTime()) / (1000 * 60 * 60)
      return t.status === 'PENDING' && hoursAgo > 24
    }),
    [tasks]
  )

  // Filtered tasks for list
  const filteredTasks = useMemo(() => {
    switch (listFilter) {
      case 'INBOX':
        return tasks.filter(t => t.status === 'PENDING' && !t.assigned_to)
      case 'MY_TASKS':
        return tasks.filter(t => t.assigned_to === currentUserId && t.status === 'PENDING')
      case 'PROCESSED':
        return tasks.filter(t => t.status === 'SIGNED')
      case 'TEAM_MEMBER':
        return tasks.filter(t => t.assigned_to === selectedMemberId && t.status === 'PENDING')
      default:
        return tasks.filter(t => t.status === 'PENDING')
    }
  }, [tasks, listFilter, currentUserId, selectedMemberId])

  // Handlers
  const handleAssignToMe = async (taskId: string) => {
    const result = await assignToMe(taskId)
    if (result.success) {
      showToast({ type: 'success', title: 'Atribuído!', message: 'Processo atribuído para você.' })
    } else {
      showToast({ type: 'error', title: 'Erro', message: result.error || 'Erro ao atribuir' })
    }
  }

  const handleAssignToColleague = async (taskId: string) => {
    const colleague = getColleague()
    if (!colleague) {
      showToast({ type: 'warning', title: 'Sem Colega', message: 'Nenhum outro ordenador disponível.' })
      return
    }
    
    const result = await assignTask(taskId, colleague.id)
    if (result.success) {
      showToast({ type: 'success', title: 'Atribuído!', message: `Processo atribuído para ${colleague.nome}.` })
    } else {
      showToast({ type: 'error', title: 'Erro', message: result.error || 'Erro ao atribuir' })
    }
  }

  // Handle drag-and-drop redistribution
  const handleRedistribute = async (taskId: string, targetMemberId: string) => {
    const task = tasks.find(t => t.id === taskId)
    const targetMember = teamLoad.find(m => m.id === targetMemberId)
    const result = await assignTask(taskId, targetMemberId)
    if (result.success) {
      showToast({ 
        type: 'success', 
        title: 'Redistribuído!', 
        message: `Processo redistribuído para ${targetMember?.nome || 'colega'}.` 
      })
      // Log the action
      logAction({
        type: 'REDISTRIBUTE',
        description: `Redistribuído para ${targetMember?.nome || 'colega'}`,
        taskId,
        nup: task?.processo?.nup
      })
    } else {
      showToast({ type: 'error', title: 'Erro', message: result.error || 'Erro ao redistribuir' })
    }
  }

  // Open signature modal
  const handleOpenSignModal = (task: SefinTask) => {
    setSelectedTask(task)
    setShowSignatureModal(true)
  }

  // Handle actual signing with PIN from modal
  const handleConfirmSign = async (pin: string): Promise<{ success: boolean; error?: string }> => {
    if (!selectedTask) return { success: false, error: 'Nenhuma tarefa selecionada' }
    
    const result = await signTask(selectedTask.id, pin)
    if (result.success) {
      showToast({ type: 'success', title: 'Assinado!', message: 'Documento assinado com sucesso.' })
      setSelectedTask(null)
    }
    return result
  }

  // State for modals
  const [showSignatureModal, setShowSignatureModal] = useState(false)
  const [showDrawer, setShowDrawer] = useState(false)

  // Open process details drawer
  const handleViewProcess = (task: SefinTask) => {
    setSelectedTask(task)
    setShowDrawer(true)
  }

  // Batch Selection Handlers
  const handleToggleSelect = useCallback((taskId: string) => {
    setSelectedTaskIds(prev => {
      const next = new Set(prev)
      if (next.has(taskId)) {
        next.delete(taskId)
      } else {
        next.add(taskId)
      }
      return next
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    const eligibleTasks = filteredTasks.filter(t => t.assigned_to === currentUserId && t.status === 'PENDING')
    if (selectedTaskIds.size === eligibleTasks.length) {
      setSelectedTaskIds(new Set())
    } else {
      setSelectedTaskIds(new Set(eligibleTasks.map(t => t.id)))
    }
  }, [filteredTasks, currentUserId, selectedTaskIds.size])

  const handleClearSelection = useCallback(() => {
    setSelectedTaskIds(new Set())
    setHighlightedIndex(-1)
  }, [])

  // Batch Sign Handler
  const handleBatchSign = useCallback(async (pin: string): Promise<{ success: boolean; error?: string }> => {
    if (selectedTaskIds.size === 0) return { success: false, error: 'Nenhum documento selecionado' }
    
    setIsBatchSigning(true)
    let successCount = 0
    let errorCount = 0
    
    for (const taskId of selectedTaskIds) {
      const result = await signTask(taskId, pin)
      if (result.success) {
        successCount++
      } else {
        errorCount++
      }
    }
    
    setIsBatchSigning(false)
    setSelectedTaskIds(new Set())
    
    if (errorCount === 0) {
      showToast({ type: 'success', title: 'Assinatura em Lote', message: `${successCount} documento(s) assinado(s) com sucesso!` })
      return { success: true }
    } else {
      showToast({ type: 'warning', title: 'Assinatura Parcial', message: `${successCount} sucesso, ${errorCount} erro(s)` })
      return { success: true, error: `${errorCount} erro(s)` }
    }
  }, [selectedTaskIds, signTask, showToast])

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      
      const tasks = filteredTasks
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setHighlightedIndex(prev => Math.min(prev + 1, tasks.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setHighlightedIndex(prev => Math.max(prev - 1, 0))
          break
        case 'Enter':
          if (highlightedIndex >= 0 && tasks[highlightedIndex]) {
            handleViewProcess(tasks[highlightedIndex])
          }
          break
        case 'a':
        case 'A':
          if (highlightedIndex >= 0 && tasks[highlightedIndex] && !tasks[highlightedIndex].assigned_to) {
            handleAssignToMe(tasks[highlightedIndex].id)
          }
          break
        case 's':
        case 'S':
          if (highlightedIndex >= 0 && tasks[highlightedIndex]?.assigned_to === currentUserId) {
            handleOpenSignModal(tasks[highlightedIndex])
          }
          break
        case ' ': // Space to toggle selection
          e.preventDefault()
          if (highlightedIndex >= 0 && tasks[highlightedIndex]) {
            handleToggleSelect(tasks[highlightedIndex].id)
          }
          break
        case 'Escape':
          handleClearSelection()
          break
        case '?':
          setShowShortcuts(prev => !prev)
          break
        case 'f':
        case 'F':
          setFocusMode(prev => !prev)
          break
        case 'h':
        case 'H':
          setShowAuditPanel(prev => !prev)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [filteredTasks, highlightedIndex, currentUserId, handleToggleSelect, handleClearSelection])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    )
  }

  return (
    <div className={`p-6 space-y-6 transition-colors duration-300 ${darkMode ? 'bg-slate-900 text-white' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            {focusMode ? '🎯 Modo Foco' : 'Painel de Controle'}
          </h1>
          <p className="text-slate-500">Ordenador de Despesas - SEFIN</p>
        </div>
        <div className="flex items-center gap-3">
          {/* History Panel Toggle */}
          <button
            onClick={() => setShowAuditPanel(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
            title="Histórico de Ações (H)"
          >
            <History size={16} />
            Histórico
          </button>

          {/* Focus Mode Toggle */}
          <button
            onClick={() => setFocusMode(!focusMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              focusMode 
                ? 'bg-amber-500 text-white shadow-lg' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            title="Atalho: F"
          >
            {focusMode ? <X size={16} /> : <Focus size={16} />}
            {focusMode ? 'Sair do Foco' : 'Modo Foco'}
          </button>
          
          {/* Team Avatars */}
          <div className="flex -space-x-3">
            {teamLoad.map(member => (
              <img 
                key={member.id}
                src={member.avatar}
                alt={member.nome}
                className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                title={member.nome}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Personal Stats Mini-Dashboard - Only when not in focus mode */}
      {!focusMode && (
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <BarChart3 size={20} className="text-amber-400" />
              Minhas Estatísticas
            </h2>
            <span className="text-xs text-slate-400">Tempo médio: {avgProcessingTime}h</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-white/10 rounded-xl">
              <p className="text-3xl font-black text-emerald-400">{signedToday.length}</p>
              <p className="text-xs text-slate-300">Hoje</p>
            </div>
            <div className="text-center p-3 bg-white/10 rounded-xl">
              <p className="text-3xl font-black text-amber-400">{signedThisWeek.length}</p>
              <p className="text-xs text-slate-300">Esta Semana</p>
            </div>
            <div className="text-center p-3 bg-white/10 rounded-xl">
              <p className="text-3xl font-black text-blue-400">{signedThisMonth.length}</p>
              <p className="text-xs text-slate-300">Este Mês</p>
            </div>
          </div>
        </div>
      )}

      {/* KPI Grid - Hidden in focus mode */}
      {!focusMode && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            label="Pendentes"
            value={kpis.pendingTotal}
            sublabel="Aguardando tratamento"
            icon={<FileText size={24} />}
            color="amber"
            onClick={() => setListFilter('INBOX')}
          />
          <KPICard
            label="Minha Fila"
            value={myTasks.length}
            sublabel="Atribuídos para mim"
            icon={<User size={24} />}
            color="blue"
            onClick={() => setListFilter('MY_TASKS')}
          />
          <KPICard
            label="Assinados Hoje"
            value={signedToday.length}
            sublabel="Documentos processados"
            icon={<CheckCircle2 size={24} />}
            color="emerald"
            onClick={() => setListFilter('PROCESSED')}
          />
          <KPICard
            label="Urgentes"
            value={urgentTasks.length}
            sublabel="+24h sem tratamento"
            icon={<AlertTriangle size={24} />}
            color="red"
          />
        </div>
      )}

      {/* Team Management - Hidden in focus mode */}
      {!focusMode && (
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-slate-800 flex items-center gap-2">
              <Users size={20} className="text-amber-500" />
              Gestão de Equipe
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teamLoad.map(member => (
              <TeamMemberCard
                key={member.id}
                member={member}
                isCurrentUser={member.id === currentUserId}
                onDrop={(taskId) => handleRedistribute(taskId, member.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Process List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {/* Filter Tabs */}
        <div className="flex items-center gap-2 p-4 border-b border-slate-100 bg-slate-50">
          <Filter size={16} className="text-slate-400" />
          <button
            onClick={() => setListFilter('INBOX')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              listFilter === 'INBOX' 
                ? 'bg-amber-500 text-white' 
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Inbox size={14} className="inline mr-1" />
            Inbox
          </button>
          <button
            onClick={() => setListFilter('MY_TASKS')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              listFilter === 'MY_TASKS' 
                ? 'bg-amber-500 text-white' 
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <User size={14} className="inline mr-1" />
            Minha Fila
          </button>
          <button
            onClick={() => setListFilter('PROCESSED')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              listFilter === 'PROCESSED' 
                ? 'bg-amber-500 text-white' 
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <CheckCircle2 size={14} className="inline mr-1" />
            Processados
          </button>
        </div>

        {/* Batch Actions Toolbar */}
        {listFilter === 'MY_TASKS' && (
          <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-emerald-50 to-amber-50 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-emerald-600 transition-colors"
              >
                {selectedTaskIds.size > 0 ? <CheckSquare size={16} /> : <Square size={16} />}
                {selectedTaskIds.size > 0 ? 'Deselecionar' : 'Selecionar Todos'}
              </button>
              {selectedTaskIds.size > 0 && (
                <>
                  <span className="text-sm font-medium text-emerald-600">
                    {selectedTaskIds.size} selecionado(s)
                  </span>
                  <button
                    onClick={handleClearSelection}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {selectedTaskIds.size > 0 && (
                <button
                  onClick={() => {
                    setShowSignatureModal(true)
                  }}
                  disabled={isBatchSigning}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
                >
                  <FileSignature size={16} />
                  {isBatchSigning ? 'Assinando...' : `Assinar ${selectedTaskIds.size} Doc(s)`}
                </button>
              )}
              <button
                onClick={() => setShowShortcuts(!showShortcuts)}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600"
                title="Atalhos de teclado (?)"
              >
                <Keyboard size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Shortcuts Help */}
        {showShortcuts && (
          <div className="px-4 py-2 bg-slate-800 text-white text-xs flex items-center gap-4 flex-wrap">
            <span className="opacity-60">Atalhos:</span>
            <span><kbd className="px-1.5 py-0.5 bg-slate-700 rounded">↑↓</kbd> Navegar</span>
            <span><kbd className="px-1.5 py-0.5 bg-slate-700 rounded">Enter</kbd> Abrir</span>
            <span><kbd className="px-1.5 py-0.5 bg-slate-700 rounded">Space</kbd> Selecionar</span>
            <span><kbd className="px-1.5 py-0.5 bg-slate-700 rounded">A</kbd> Atribuir</span>
            <span><kbd className="px-1.5 py-0.5 bg-slate-700 rounded">S</kbd> Assinar</span>
            <span><kbd className="px-1.5 py-0.5 bg-slate-700 rounded">Esc</kbd> Limpar</span>
          </div>
        )}

        {/* Task List */}
        <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task, index) => (
              <ProcessItem
                key={task.id}
                task={task}
                currentUserId={currentUserId}
                isSelected={selectedTaskIds.has(task.id)}
                isHighlighted={index === highlightedIndex}
                onToggleSelect={listFilter === 'MY_TASKS' ? () => handleToggleSelect(task.id) : undefined}
                onAssignToMe={() => handleAssignToMe(task.id)}
                onAssignToColleague={() => handleAssignToColleague(task.id)}
                onSign={() => handleOpenSignModal(task)}
                onView={() => handleViewProcess(task)}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <CheckCircle2 size={48} className="mx-auto mb-4 text-emerald-400" />
              <p className="text-slate-600 font-medium">Nenhum processo nesta categoria</p>
              <p className="text-slate-400 text-sm">Todos os documentos foram tratados</p>
            </div>
          )}
        </div>
      </div>

      {/* Signature Modal - Supports both single and batch signing */}
      <SignatureModal
        isOpen={showSignatureModal}
        onClose={() => {
          setShowSignatureModal(false)
          setSelectedTask(null)
        }}
        onConfirm={selectedTaskIds.size > 0 ? handleBatchSign : handleConfirmSign}
        title={selectedTaskIds.size > 0 ? 'Assinatura em Lote' : 'Confirmar Assinatura'}
        description={selectedTaskIds.size > 0 
          ? `Assinando ${selectedTaskIds.size} documento(s) selecionado(s)`
          : `Assinando documento: ${selectedTask?.tipo || ''}`
        }
        documentsCount={selectedTaskIds.size > 0 ? selectedTaskIds.size : 1}
      />

      {/* Full Context Drawer with Document Preview */}
      <ContextDrawer
        task={selectedTask}
        isOpen={showDrawer}
        onClose={() => {
          setShowDrawer(false)
          setSelectedTask(null)
        }}
        onSign={(taskId) => {
          setShowDrawer(false)
          const task = tasks.find(t => t.id === taskId)
          if (task) handleOpenSignModal(task)
        }}
        onReturn={(taskId, reason) => {
          console.log('Return task:', taskId, reason)
          showToast({ type: 'info', title: 'Devolvido', message: 'Processo devolvido.' })
          setShowDrawer(false)
          setSelectedTask(null)
        }}
      />

      {/* Audit Panel - Right Slide-in */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl border-l border-slate-200 z-50 transform transition-transform duration-300 ${showAuditPanel ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <History size={18} className="text-amber-500" />
            <h3 className="font-black text-slate-800">Histórico de Ações</h3>
          </div>
          <button 
            onClick={() => setShowAuditPanel(false)}
            className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X size={18} className="text-slate-500" />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto h-[calc(100%-64px)]">
          {actionHistory.length === 0 ? (
            <div className="text-center py-12">
              <History size={32} className="mx-auto text-slate-300 mb-3" />
              <p className="text-sm text-slate-500">Nenhuma ação registrada</p>
              <p className="text-xs text-slate-400 mt-1">Suas ações aparecerão aqui</p>
            </div>
          ) : (
            <div className="space-y-3">
              {actionHistory.map(action => (
                <div 
                  key={action.id}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      action.type === 'SIGN' || action.type === 'BATCH_SIGN' ? 'bg-emerald-100 text-emerald-600' :
                      action.type === 'ASSIGN' ? 'bg-blue-100 text-blue-600' :
                      action.type === 'REDISTRIBUTE' ? 'bg-amber-100 text-amber-600' :
                      'bg-slate-200 text-slate-600'
                    }`}>
                      {action.type === 'SIGN' || action.type === 'BATCH_SIGN' ? <FileSignature size={14} /> :
                       action.type === 'ASSIGN' ? <UserCheck size={14} /> :
                       action.type === 'REDISTRIBUTE' ? <Send size={14} /> :
                       <Eye size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-800">{action.description}</p>
                      {action.nup && (
                        <p className="text-[10px] text-slate-500 truncate">NUP: {action.nup}</p>
                      )}
                      <p className="text-[10px] text-slate-400 mt-1">
                        {action.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Overlay */}
      {showAuditPanel && (
        <div 
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setShowAuditPanel(false)}
        />
      )}


    </div>
  )
}

export default SefinControlPanelView
