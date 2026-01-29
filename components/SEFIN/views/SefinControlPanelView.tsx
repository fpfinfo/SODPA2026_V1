'use client'

import React, { useState, useMemo } from 'react'
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
  RotateCcw
} from 'lucide-react'
import { useSefinCockpit, SefinTask } from '../../../hooks/useSefinCockpit'
import { useSefinTeamMembers, SefinTeamMemberWithWorkload } from '../../../hooks/useSefinTeamMembers'
import { useToast } from '../../ui/ToastProvider'

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
}

function TeamMemberCard({ member, isCurrentUser, onRedistribute }: TeamMemberCardProps) {
  return (
    <div className={`bg-white rounded-2xl border-2 ${isCurrentUser ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200'} p-5`}>
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
  onAssign?: () => void
  onSign?: () => void
  onView?: () => void
}

function ProcessItem({ task, onAssign, onSign, onView }: ProcessItemProps) {
  const getTypeLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      'PORTARIA': 'Portaria',
      'CERTIDAO_REGULARIDADE': 'Certidão',
      'NOTA_EMPENHO': 'NE',
      'NOTA_LIQUIDACAO': 'NL',
      'ORDEM_BANCARIA': 'OB'
    }
    return labels[tipo] || tipo
  }

  const created = new Date(task.created_at)
  const hoursAgo = Math.round((Date.now() - created.getTime()) / (1000 * 60 * 60))
  const isUrgent = hoursAgo > 24

  return (
    <div 
      onClick={onView}
      className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group"
    >
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
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800 truncate">{task.processo?.nup || 'N/A'}</span>
          <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-100 text-purple-700 rounded-full">
            {getTypeLabel(task.tipo)}
          </span>
          {isUrgent && (
            <span className="px-2 py-0.5 text-[10px] font-bold bg-red-100 text-red-700 rounded-full animate-pulse">
              URGENTE
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

      {/* Actions */}
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {onAssign && (
          <button 
            onClick={(e) => { e.stopPropagation(); onAssign(); }}
            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
            title="Atribuir"
          >
            <UserPlus size={16} />
          </button>
        )}
        {onSign && (
          <button 
            onClick={(e) => { e.stopPropagation(); onSign(); }}
            className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors"
            title="Assinar"
          >
            <FileSignature size={16} />
          </button>
        )}
        <ArrowRight size={18} className="text-slate-300 group-hover:text-amber-500" />
      </div>
    </div>
  )
}

// Main Component
export function SefinControlPanelView() {
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

  // State
  const [listFilter, setListFilter] = useState<ListFilter>('INBOX')
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<SefinTask | null>(null)

  // Computed KPIs
  const myTasks = useMemo(() => 
    tasks.filter(t => t.assigned_to === currentUserId && t.status === 'PENDING'),
    [tasks, currentUserId]
  )

  const signedToday = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    return tasks.filter(t => t.status === 'SIGNED' && t.signed_at?.startsWith(today))
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

  const handleSign = async (task: SefinTask) => {
    // In real implementation, would show PIN modal
    const result = await signTask(task.id, '123456')
    if (result.success) {
      showToast({ type: 'success', title: 'Assinado!', message: 'Documento assinado com sucesso.' })
    } else {
      showToast({ type: 'error', title: 'Erro', message: result.error || 'Erro ao assinar' })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Painel de Controle</h1>
          <p className="text-slate-500">Ordenador de Despesas - SEFIN</p>
        </div>
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

      {/* KPI Grid */}
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

      {/* Team Management */}
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
            />
          ))}
        </div>
      </div>

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

        {/* Task List */}
        <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
          {filteredTasks.length > 0 ? (
            filteredTasks.map(task => (
              <ProcessItem
                key={task.id}
                task={task}
                onAssign={() => handleAssignToMe(task.id)}
                onSign={task.assigned_to === currentUserId ? () => handleSign(task) : undefined}
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
    </div>
  )
}

export default SefinControlPanelView
