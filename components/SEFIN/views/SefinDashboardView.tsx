'use client'

import React, { useMemo } from 'react'
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Calendar,
  ArrowRight,
  Zap
} from 'lucide-react'
import { useSefinCockpit } from '../../../hooks/useSefinCockpit'
import { DashboardKPI, CompactKPI } from '../Dashboard/DashboardKPIs'
import { Sparkline } from '../Dashboard/Sparkline'

// Urgent Task Mini-Card
interface UrgentTaskProps {
  nup: string
  suprido: string
  hoursAgo: number
  tipo: string
  valor?: number
  onClick?: () => void
}

function UrgentTaskCard({ nup, suprido, hoursAgo, tipo, valor, onClick }: UrgentTaskProps) {
  const getTypeLabel = (t: string) => {
    const labels: Record<string, string> = {
      'PORTARIA': 'Portaria',
      'CERTIDAO_REGULARIDADE': 'Certidão',
      'NOTA_EMPENHO': 'NE'
    }
    return labels[t] || t
  }

  return (
    <div 
      onClick={onClick}
      className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 hover:border-amber-300 hover:shadow-sm transition-all cursor-pointer group"
    >
      <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
        <AlertTriangle size={18} className="text-red-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-800 truncate">{nup}</span>
          <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-purple-100 text-purple-700 rounded">
            {getTypeLabel(tipo)}
          </span>
        </div>
        <div className="text-xs text-slate-500 truncate">{suprido}</div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-xs font-bold text-red-600">{hoursAgo}h</div>
        {valor && (
          <div className="text-[10px] text-slate-500">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)}
          </div>
        )}
      </div>
      <ArrowRight size={16} className="text-slate-300 group-hover:text-amber-500 transition-colors" />
    </div>
  )
}

// Quick Stat Row
function StatRow({ label, value, color = 'text-slate-800' }: { label: string; value: number; color?: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-b-0">
      <span className="text-sm text-slate-600">{label}</span>
      <span className={`font-semibold ${color}`}>{value}</span>
    </div>
  )
}

export function SefinDashboardView() {
  const { kpis, tasks, filteredTasks, isLoading } = useSefinCockpit()

  // Generate mock trend data (in production, this would come from historical data)
  const trendData = useMemo(() => {
    // Simulate 7-day trend data
    const generateTrend = (current: number, variance: number = 3) => {
      const data = []
      for (let i = 6; i >= 0; i--) {
        const randomVariance = Math.floor(Math.random() * variance * 2) - variance
        data.push(Math.max(0, current + randomVariance))
      }
      data[data.length - 1] = current // Last value is current
      return data
    }

    return {
      pending: generateTrend(kpis.pendingTotal, 5),
      signed: generateTrend(kpis.signedToday, 4),
      avgTime: generateTrend(kpis.avgSignTime, 2),
      urgent: generateTrend(kpis.urgentCount, 2)
    }
  }, [kpis])

  // Get urgent tasks (more than 24h pending)
  const urgentTasks = useMemo(() => {
    return tasks
      .filter(t => {
        const created = new Date(t.created_at)
        const hoursSinceCreated = (Date.now() - created.getTime()) / (1000 * 60 * 60)
        return t.status === 'PENDING' && hoursSinceCreated > 24
      })
      .slice(0, 5)
  }, [tasks])

  // High value tasks (>R$ 5000)
  const highValueTasks = useMemo(() => {
    return tasks
      .filter(t => t.status === 'PENDING' && (t.processo?.valor_total || 0) >= 5000)
      .sort((a, b) => (b.processo?.valor_total || 0) - (a.processo?.valor_total || 0))
      .slice(0, 3)
  }, [tasks])

  // Calculate totals
  const totalValue = useMemo(() => {
    return tasks.reduce((sum, t) => sum + (t.processo?.valor_total || 0), 0)
  }, [tasks])

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Hero KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardKPI
          label="Pendentes"
          value={kpis.pendingTotal}
          sublabel="Aguardando assinatura"
          icon="document"
          status={kpis.pendingTotal > 10 ? 'warning' : 'ok'}
          format="number"
          trend={{
            data: trendData.pending,
            changePercent: kpis.pendingTotal > 0 ? 5 : 0,
            isPositive: false
          }}
        />
        <DashboardKPI
          label="Assinados Hoje"
          value={kpis.signedToday}
          sublabel="Documentos processados"
          icon="check"
          status="ok"
          format="number"
          trend={{
            data: trendData.signed,
            changePercent: 12,
            isPositive: true
          }}
        />
        <DashboardKPI
          label="Tempo Médio"
          value={kpis.avgSignTime}
          sublabel="Horas até assinatura"
          icon="clock"
          status={kpis.avgSignTime > 24 ? 'danger' : kpis.avgSignTime > 12 ? 'warning' : 'ok'}
          format="time"
          trend={{
            data: trendData.avgTime,
            changePercent: kpis.avgSignTime < 24 ? -8 : 5,
            isPositive: kpis.avgSignTime < 24
          }}
        />
        <DashboardKPI
          label="Urgentes"
          value={kpis.urgentCount}
          sublabel="+24h sem assinatura"
          icon="alert"
          status={kpis.urgentCount > 0 ? 'danger' : 'ok'}
          format="number"
          trend={{
            data: trendData.urgent
          }}
        />
      </div>

      {/* Financial Summary Bar */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-lg">
            <DollarSign size={20} />
          </div>
          <div>
            <div className="text-xs text-slate-400">Valor Total em Processos</div>
            <div className="text-xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-400">{tasks.filter(t => t.status === 'PENDING').length}</div>
            <div className="text-xs text-slate-400">Pendentes</div>
          </div>
          <div className="w-px h-10 bg-slate-700" />
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-400">{tasks.filter(t => t.status === 'SIGNED').length}</div>
            <div className="text-xs text-slate-400">Assinados</div>
          </div>
        </div>
      </div>

      {/* Three Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Urgent Tasks - Takes 2 columns */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Zap size={18} className="text-red-500" />
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
                    valor={task.processo?.valor_total}
                  />
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle2 size={40} className="mx-auto mb-3 text-emerald-400" />
              <p className="text-sm font-medium text-slate-600">Excelente!</p>
              <p className="text-xs text-slate-400">Nenhum documento urgente pendente</p>
            </div>
          )}

          {/* High Value Section */}
          {highValueTasks.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-100">
              <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <DollarSign size={14} className="text-amber-500" />
                Alto Valor ({'>'} R$ 5.000)
              </h4>
              <div className="space-y-2">
                {highValueTasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between p-2 bg-amber-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-slate-800">{task.processo?.nup}</span>
                      <span className="text-xs text-slate-500 ml-2">{task.processo?.suprido_nome}</span>
                    </div>
                    <span className="font-bold text-amber-700">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(task.processo?.valor_total || 0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats Sidebar */}
        <div className="space-y-4">
          {/* Type Breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
              <TrendingUp size={18} className="text-blue-500" />
              Por Tipo de Documento
            </h3>

            <div>
              <StatRow 
                label="Portarias" 
                value={filteredTasks.filter(t => t.tipo === 'PORTARIA').length} 
              />
              <StatRow 
                label="Certidões" 
                value={filteredTasks.filter(t => t.tipo === 'CERTIDAO_REGULARIDADE').length} 
              />
              <StatRow 
                label="Notas de Empenho" 
                value={filteredTasks.filter(t => t.tipo === 'NOTA_EMPENHO').length} 
              />
              <StatRow 
                label="Liquidações" 
                value={filteredTasks.filter(t => t.tipo === 'NOTA_LIQUIDACAO').length} 
              />
              <StatRow 
                label="Ordens Bancárias" 
                value={filteredTasks.filter(t => t.tipo === 'ORDEM_BANCARIA').length} 
              />
            </div>
          </div>

          {/* Weekly Activity */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
              <Calendar size={18} className="text-emerald-500" />
              Atividade Semanal
            </h3>

            <div className="flex justify-center">
              <Sparkline 
                data={trendData.signed}
                width={200}
                height={60}
                color="#10B981"
                strokeWidth={2}
                showDots
              />
            </div>

            <div className="flex justify-between text-xs text-slate-400 mt-2 px-4">
              <span>7 dias atrás</span>
              <span>Hoje</span>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100">
              <StatRow 
                label="Alto Valor (&gt;R$10k)" 
                value={kpis.highValueCount}
                color="text-amber-600" 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SefinDashboardView
