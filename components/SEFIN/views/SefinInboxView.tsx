'use client'

import React, { useState, useMemo } from 'react'
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  ChevronRight,
  Filter,
  CheckSquare,
  Square,
  Signature,
  RotateCcw,
  X,
  Shield,
  ArrowUpDown,
  Zap,
  Info
} from 'lucide-react'
import { useSefinCockpit, SefinTask, RiskLevel } from '../../../hooks/useSefinCockpit'
import { ContextDrawer } from '../ContextDrawer'
import { SignatureConfirmModal } from '../SignatureConfirmModal'

interface SefinInboxViewProps {
  searchQuery?: string
}

type SortOption = 'priority' | 'date' | 'value' | 'risk'

// Document Type Badge
function DocumentTypeBadge({ tipo }: { tipo: string }) {
  const typeConfig: Record<string, { label: string; color: string }> = {
    'PORTARIA': { label: 'Portaria', color: 'bg-purple-100 text-purple-700' },
    'CERTIDAO_REGULARIDADE': { label: 'Certidão', color: 'bg-blue-100 text-blue-700' },
    'NOTA_EMPENHO': { label: 'Nota Empenho', color: 'bg-emerald-100 text-emerald-700' },
    'NOTA_LIQUIDACAO': { label: 'Liquidação', color: 'bg-amber-100 text-amber-700' },
    'ORDEM_BANCARIA': { label: 'Ord. Bancária', color: 'bg-indigo-100 text-indigo-700' }
  }

  const config = typeConfig[tipo] || { label: tipo, color: 'bg-slate-100 text-slate-700' }

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  )
}

// Priority Tag
function PriorityTag({ isUrgent, isHighValue }: { isUrgent: boolean; isHighValue: boolean }) {
  if (isUrgent) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-100 text-red-700 text-xs font-medium">
        <AlertTriangle size={12} />
        Urgente
      </span>
    )
  }
  if (isHighValue) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-700 text-xs font-medium">
        Alto Valor
      </span>
    )
  }
  return null
}

// Risk Badge Component
function RiskBadge({ riskScore, riskLevel }: { riskScore: number; riskLevel: RiskLevel }) {
  const config: Record<RiskLevel, { bg: string; text: string; label: string; icon: string }> = {
    'low': { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Baixo', icon: '🟢' },
    'medium': { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Médio', icon: '🟡' },
    'high': { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Alto', icon: '🟠' },
    'critical': { bg: 'bg-red-100', text: 'text-red-700', label: 'Crítico', icon: '🔴' }
  }

  const { bg, text, label, icon } = config[riskLevel]

  return (
    <span 
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${bg} ${text}`}
      title={`Score: ${riskScore}/100`}
    >
      <span>{icon}</span>
      {label}
    </span>
  )
}

// Task Card Component
interface TaskCardProps {
  task: SefinTask
  isSelected: boolean
  onSelect: () => void
  onClick: () => void
}

function TaskCard({ task, isSelected, onSelect, onClick }: TaskCardProps) {
  const created = new Date(task.created_at)
  const hoursSinceCreated = (Date.now() - created.getTime()) / (1000 * 60 * 60)
  const isUrgent = hoursSinceCreated > 24
  const isHighValue = (task.processo?.valor_total || 0) >= 10000

  return (
    <div 
      className={`
        flex items-center gap-4 p-4 bg-white rounded-lg border
        transition-all cursor-pointer
        ${isSelected 
          ? 'border-amber-400 bg-amber-50/50 shadow-sm' 
          : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
        }
      `}
    >
      {/* Checkbox */}
      <button 
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        className="flex-shrink-0 text-slate-400 hover:text-amber-500 transition-colors"
      >
        {isSelected ? (
          <CheckSquare size={20} className="text-amber-500" />
        ) : (
          <Square size={20} />
        )}
      </button>

      {/* Main Content */}
      <div className="flex-1 min-w-0" onClick={onClick}>
        <div className="flex items-center gap-2 mb-1">
          <DocumentTypeBadge tipo={task.tipo} />
          <RiskBadge riskScore={task.riskScore} riskLevel={task.riskLevel} />
          <PriorityTag isUrgent={isUrgent} isHighValue={isHighValue} />
        </div>

        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-800">
            {task.processo?.nup || 'NUP não disponível'}
          </span>
          <span className="text-slate-400">•</span>
          <span className="text-sm text-slate-600 truncate">
            {task.processo?.suprido_nome || 'N/A'}
          </span>
        </div>

        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
          <span>{task.processo?.lotacao_nome}</span>
          {task.processo?.valor_total && (
            <>
              <span>•</span>
              <span className="font-medium">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(task.processo.valor_total)}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Time Indicator */}
      <div className="flex-shrink-0 text-right">
        <div className={`text-sm font-medium ${isUrgent ? 'text-red-600' : 'text-slate-600'}`}>
          {hoursSinceCreated < 1 
            ? `${Math.round(hoursSinceCreated * 60)}min`
            : `${Math.round(hoursSinceCreated)}h`
          }
        </div>
        <div className="text-xs text-slate-400">atrás</div>
      </div>

      {/* Arrow */}
      <ChevronRight size={18} className="flex-shrink-0 text-slate-300" />
    </div>
  )
}

// Batch Actions Bar
interface BatchActionsProps {
  selectedCount: number
  totalValue?: number
  onSign: () => void
  onClear: () => void
}

function BatchActionsBar({ selectedCount, totalValue, onSign, onClear }: BatchActionsProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white rounded-xl shadow-2xl px-6 py-3 flex items-center gap-6 z-50">
      <div className="flex items-center gap-2">
        <CheckSquare size={18} className="text-amber-400" />
        <span className="text-sm font-medium">
          {selectedCount} {selectedCount === 1 ? 'selecionado' : 'selecionados'}
        </span>
        {totalValue !== undefined && totalValue > 0 && (
          <span className="text-xs text-slate-400">
            ({new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)})
          </span>
        )}
      </div>

      <div className="w-px h-6 bg-slate-700" />

      <button
        onClick={onSign}
        className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 rounded-lg text-sm font-medium transition-colors"
      >
        <Signature size={16} />
        Assinar em Lote
      </button>

      <button
        onClick={onClear}
        className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
      >
        <X size={18} />
      </button>
    </div>
  )
}

// Filter Pills
interface FilterPillsProps {
  activeType: string
  onTypeChange: (type: string) => void
}

function FilterPills({ activeType, onTypeChange }: FilterPillsProps) {
  const types = [
    { id: 'all', label: 'Todos' },
    { id: 'PORTARIA', label: 'Portarias' },
    { id: 'CERTIDAO_REGULARIDADE', label: 'Certidões' },
    { id: 'NOTA_EMPENHO', label: 'Notas Empenho' }
  ]

  return (
    <div className="flex items-center gap-2">
      {types.map(type => (
        <button
          key={type.id}
          onClick={() => onTypeChange(type.id)}
          className={`
            px-3 py-1.5 rounded-full text-sm font-medium transition-all
            ${activeType === type.id
              ? 'bg-amber-500 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }
          `}
        >
          {type.label}
        </button>
      ))}
    </div>
  )
}

export function SefinInboxView({ searchQuery }: SefinInboxViewProps) {
  const [signModalOpen, setSignModalOpen] = useState(false)
  
  // CRÍTICO: Pausar auto-refresh quando modal de assinatura está aberto para evitar loops visuais
  const { tasks, filteredTasks, isLoading, filters, updateFilter, signTask, signMultipleTasks, returnTask } = useSefinCockpit({
    autoRefresh: !signModalOpen  // Pausa refresh quando modal está aberto
  })
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectedTask, setSelectedTask] = useState<SefinTask | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [signModalMode, setSignModalMode] = useState<'single' | 'batch'>('batch')
  const [taskToSign, setTaskToSign] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('priority')

  // Apply search query from header - only when searchQuery prop changes
  React.useEffect(() => {
    if (searchQuery !== undefined && searchQuery !== filters.searchQuery) {
      updateFilter('searchQuery', searchQuery)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleOpenDrawer = (task: SefinTask) => {
    setSelectedTask(task)
    setDrawerOpen(true)
  }

  const handleCloseDrawer = () => {
    setDrawerOpen(false)
    setSelectedTask(null)
  }

  const handleSign = async (taskId: string) => {
    setTaskToSign(taskId)
    setSignModalMode('single')
    setSignModalOpen(true)
  }

  const handleConfirmSign = async (pin: string): Promise<{ success: boolean; error?: string }> => {
    if (signModalMode === 'single' && taskToSign) {
      const result = await signTask(taskToSign, pin)
      if (result.success) {
        handleCloseDrawer()
      }
      return result
    } else {
      const result = await signMultipleTasks(Array.from(selectedIds), pin)
      if (result.success) {
        setSelectedIds(new Set())
      }
      return result
    }
  }

  const handleReturn = async (taskId: string, reason: string) => {
    const motivo = prompt('Informe o motivo da devolução:')
    if (!motivo) return

    const result = await returnTask(taskId, motivo)
    if (result.success) {
      handleCloseDrawer()
      alert('Documento devolvido com sucesso!')
    } else {
      alert(`Erro: ${result.error}`)
    }
  }

  const handleBatchSign = async () => {
    setSignModalMode('batch')
    setSignModalOpen(true)
  }

  const handleCloseSignModal = () => {
    setSignModalOpen(false)
    setTaskToSign(null)
  }

  // Calculate total value of selected tasks (Deduplicated by Process)
  const selectedTotalValue = useMemo(() => {
    const uniqueProcessIds = new Set<string>()
    let total = 0

    Array.from(selectedIds).forEach(id => {
      const task = tasks.find(t => t.id === id)
      if (task?.processo?.id && !uniqueProcessIds.has(task.processo.id)) {
        uniqueProcessIds.add(task.processo.id)
        total += (task.processo.valor_total || 0)
      }
    })
    return total
  }, [selectedIds, tasks])

  // Filter and sort pending tasks
  const pendingTasks = useMemo(() => {
    const pending = filteredTasks.filter(t => t.status === 'PENDING')
    
    // Apply sorting
    return pending.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          // Urgent first, then high risk, then low risk
          const aUrgent = (Date.now() - new Date(a.created_at).getTime()) > 24 * 60 * 60 * 1000
          const bUrgent = (Date.now() - new Date(b.created_at).getTime()) > 24 * 60 * 60 * 1000
          if (aUrgent !== bUrgent) return aUrgent ? -1 : 1
          return b.riskScore - a.riskScore
        case 'date':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'value':
          return (b.processo?.valor_total || 0) - (a.processo?.valor_total || 0)
        case 'risk':
          return b.riskScore - a.riskScore
        default:
          return 0
      }
    })
  }, [filteredTasks, sortBy])

  // Low-risk batch candidates
  const batchCandidates = useMemo(() => {
    return pendingTasks.filter(t => t.riskLevel === 'low')
  }, [pendingTasks])

  // Select all low-risk items
  const selectAllLowRisk = () => {
    const lowRiskIds = batchCandidates.map(t => t.id)
    setSelectedIds(new Set(lowRiskIds))
  }

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    )
  }

  // Sort options
  const sortOptions = [
    { id: 'priority' as const, label: 'Prioridade' },
    { id: 'date' as const, label: 'Data' },
    { id: 'value' as const, label: 'Valor' },
    { id: 'risk' as const, label: 'Risco' }
  ]

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">
            Mesa de Decisão da SEFIN
          </h2>
          <p className="text-sm text-slate-500">
            {pendingTasks.length} {pendingTasks.length === 1 ? 'documento pendente' : 'documentos pendentes'}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <FilterPills 
            activeType={filters.type}
            onTypeChange={(type) => updateFilter('type', type as any)}
          />

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <ArrowUpDown size={14} className="text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2 text-sm bg-slate-100 border-none rounded-lg text-slate-600 focus:ring-2 focus:ring-amber-300"
            >
              {sortOptions.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </div>
          
          <button className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
            <Filter size={16} />
            Mais Filtros
          </button>
        </div>
      </div>

      {/* Batch Candidates Banner */}
      {batchCandidates.length > 0 && selectedIds.size === 0 && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Shield size={18} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-800">
                {batchCandidates.length} documento{batchCandidates.length !== 1 ? 's' : ''} de baixo risco
              </p>
              <p className="text-xs text-emerald-600">
                Candidatos para assinatura em lote
              </p>
            </div>
          </div>
          <button
            onClick={selectAllLowRisk}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            <Zap size={16} />
            Selecionar Todos
          </button>
        </div>
      )}

      {/* Task List */}
      <div className="space-y-2">
        {pendingTasks.length > 0 ? (
          pendingTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              isSelected={selectedIds.has(task.id)}
              onSelect={() => toggleSelection(task.id)}
              onClick={() => handleOpenDrawer(task)}
            />
          ))
        ) : (
          <div className="text-center py-16 text-slate-400">
            <CheckCircle2 size={48} className="mx-auto mb-3 text-emerald-300" />
            <p className="text-lg font-medium text-slate-600">Parabéns!</p>
            <p className="text-sm">Não há documentos pendentes de assinatura</p>
          </div>
        )}
      </div>

      {/* Batch Actions */}
      {selectedIds.size > 0 && (
        <BatchActionsBar
          selectedCount={selectedIds.size}
          totalValue={selectedTotalValue}
          onSign={handleBatchSign}
          onClear={() => setSelectedIds(new Set())}
        />
      )}

      {/* Context Drawer */}
      <ContextDrawer
        task={selectedTask}
        isOpen={drawerOpen}
        onClose={handleCloseDrawer}
        onSign={handleSign}
        onReturn={handleReturn}
      />

      {/* Signature Confirmation Modal */}
      <SignatureConfirmModal
        isOpen={signModalOpen}
        onClose={handleCloseSignModal}
        onConfirm={handleConfirmSign}
        documentsCount={signModalMode === 'batch' ? selectedIds.size : 1}
        totalValue={signModalMode === 'batch' ? selectedTotalValue : (selectedTask?.processo?.valor_total || 0)}
        documentType={signModalMode === 'single' ? selectedTask?.tipo : undefined}
      />
    </div>
  )
}

export default SefinInboxView
