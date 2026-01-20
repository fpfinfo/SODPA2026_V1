'use client'

import React from 'react'
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { useSefinCockpit } from '../../../hooks/useSefinCockpit'

// KPI Card Component
interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  color: 'amber' | 'emerald' | 'blue' | 'red' | 'slate'
}

function KPICard({ title, value, subtitle, icon, trend, color }: KPICardProps) {
  const colorClasses = {
    amber: 'from-amber-500 to-amber-600 text-amber-50',
    emerald: 'from-emerald-500 to-emerald-600 text-emerald-50',
    blue: 'from-blue-500 to-blue-600 text-blue-50',
    red: 'from-red-500 to-red-600 text-red-50',
    slate: 'from-slate-600 to-slate-700 text-slate-50'
  }

  return (
    <div className={`
      relative overflow-hidden rounded-xl p-5
      bg-gradient-to-br ${colorClasses[color]}
      shadow-lg
    `}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/20" />
        <div className="absolute -right-8 top-8 w-16 h-16 rounded-full bg-white/10" />
      </div>

      {/* Content */}
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className="p-2 rounded-lg bg-white/20">
            {icon}
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-sm font-medium ${
              trend.isPositive ? 'text-white/90' : 'text-white/80'
            }`}>
              {trend.isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>

        <div className="text-3xl font-bold mb-1">{value}</div>
        <div className="text-sm opacity-90">{title}</div>
        {subtitle && (
          <div className="text-xs opacity-75 mt-1">{subtitle}</div>
        )}
      </div>
    </div>
  )
}

// Urgent Task Mini-Card
interface UrgentTaskProps {
  nup: string
  suprido: string
  hoursAgo: number
  tipo: string
}

function UrgentTaskCard({ nup, suprido, hoursAgo, tipo }: UrgentTaskProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 hover:border-amber-300 hover:shadow-sm transition-all cursor-pointer">
      <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
        <AlertTriangle size={18} className="text-red-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-800 truncate">{nup}</div>
        <div className="text-xs text-slate-500 truncate">{suprido}</div>
      </div>
      <div className="text-right">
        <div className="text-xs font-medium text-red-600">{hoursAgo}h</div>
        <div className="text-[10px] text-slate-400">{tipo}</div>
      </div>
    </div>
  )
}

export function SefinDashboardView() {
  const { kpis, filteredTasks, isLoading } = useSefinCockpit()

  // Get urgent tasks (more than 24h pending)
  const urgentTasks = filteredTasks
    .filter(t => {
      const created = new Date(t.created_at)
      const hoursSinceCreated = (Date.now() - created.getTime()) / (1000 * 60 * 60)
      return t.status === 'PENDENTE' && hoursSinceCreated > 24
    })
    .slice(0, 5)

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Pendentes"
          value={kpis.pendingTotal}
          subtitle="Aguardando assinatura"
          icon={<FileText size={20} />}
          color="amber"
        />
        <KPICard
          title="Assinados Hoje"
          value={kpis.signedToday}
          subtitle="Documentos processados"
          icon={<CheckCircle2 size={20} />}
          trend={{ value: 12, isPositive: true }}
          color="emerald"
        />
        <KPICard
          title="Tempo Médio"
          value={`${kpis.avgSignTime}h`}
          subtitle="Até assinatura"
          icon={<Clock size={20} />}
          color="blue"
        />
        <KPICard
          title="Urgentes"
          value={kpis.urgentCount}
          subtitle="+24h sem assinatura"
          icon={<AlertTriangle size={20} />}
          color={kpis.urgentCount > 0 ? 'red' : 'slate'}
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Urgent Tasks */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <AlertTriangle size={18} className="text-red-500" />
              Atenção Imediata
            </h3>
            <span className="text-xs text-slate-500">
              {urgentTasks.length} {urgentTasks.length === 1 ? 'item' : 'itens'}
            </span>
          </div>

          {urgentTasks.length > 0 ? (
            <div className="space-y-2">
              {urgentTasks.map(task => {
                const created = new Date(task.created_at)
                const hoursAgo = Math.round((Date.now() - created.getTime()) / (1000 * 60 * 60))
                
                return (
                  <UrgentTaskCard
                    key={task.id}
                    nup={task.processo?.nup || 'N/A'}
                    suprido={task.processo?.suprido_nome || 'N/A'}
                    hoursAgo={hoursAgo}
                    tipo={task.tipo}
                  />
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <CheckCircle2 size={40} className="mx-auto mb-2 text-emerald-300" />
              <p className="text-sm">Nenhum documento urgente pendente</p>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-blue-500" />
            Resumo do Dia
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <span className="text-sm text-slate-600">Portarias</span>
              <span className="font-semibold text-slate-800">
                {filteredTasks.filter(t => t.tipo === 'PORTARIA').length}
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <span className="text-sm text-slate-600">Certidões</span>
              <span className="font-semibold text-slate-800">
                {filteredTasks.filter(t => t.tipo === 'CERTIDAO_REGULARIDADE').length}
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <span className="text-sm text-slate-600">Notas de Empenho</span>
              <span className="font-semibold text-slate-800">
                {filteredTasks.filter(t => t.tipo === 'NOTA_EMPENHO').length}
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-slate-600">Alto Valor (&gt;R$10k)</span>
              <span className="font-semibold text-amber-600">
                {kpis.highValueCount}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SefinDashboardView
