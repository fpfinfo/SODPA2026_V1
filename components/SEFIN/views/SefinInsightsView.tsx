'use client'

import React from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  Clock,
  CheckCircle2,
  Calendar,
  Users,
  FileText,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { useSefinCockpit } from '../../../hooks/useSefinCockpit'

// Placeholder chart component (to be replaced with a real charting library)
function MiniChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  return (
    <div className="flex items-end gap-0.5 h-8">
      {data.map((value, i) => (
        <div
          key={i}
          className={`w-2 rounded-t ${color}`}
          style={{ 
            height: `${((value - min) / range) * 100 || 10}%`,
            opacity: 0.3 + (i / data.length) * 0.7
          }}
        />
      ))}
    </div>
  )
}

// Stat Card
interface StatCardProps {
  title: string
  value: string | number
  change?: { value: number; isPositive: boolean }
  icon: React.ReactNode
  chartData?: number[]
  chartColor?: string
}

function StatCard({ title, value, change, icon, chartData, chartColor }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-lg bg-slate-100">
          {icon}
        </div>
        {change && (
          <div className={`flex items-center gap-1 text-sm font-medium ${
            change.isPositive ? 'text-emerald-600' : 'text-red-600'
          }`}>
            {change.isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(change.value)}%
          </div>
        )}
      </div>

      <div className="text-2xl font-bold text-slate-800 mb-1">{value}</div>
      <div className="text-sm text-slate-500">{title}</div>

      {chartData && chartColor && (
        <div className="mt-3">
          <MiniChart data={chartData} color={chartColor} />
        </div>
      )}
    </div>
  )
}

export function SefinInsightsView() {
  const { tasks, kpis, isLoading } = useSefinCockpit({ autoRefresh: false })

  // Mock data for charts (in production, calculate from real data)
  const weeklySignatures = [12, 8, 15, 10, 18, 14, kpis.signedToday]
  const weeklyPending = [5, 8, 6, 10, 7, 9, kpis.pendingTotal]

  // Calculate additional metrics
  const signedTotal = tasks.filter(t => t.status === 'ASSINADO').length
  const returnedTotal = tasks.filter(t => t.status === 'DEVOLVIDO').length
  const returnRate = tasks.length > 0 ? Math.round((returnedTotal / tasks.length) * 100) : 0

  // Document type breakdown
  const typeBreakdown = [
    { type: 'Portarias', count: tasks.filter(t => t.tipo === 'PORTARIA').length, color: 'bg-purple-500' },
    { type: 'Certidões', count: tasks.filter(t => t.tipo === 'CERTIDAO_REGULARIDADE').length, color: 'bg-blue-500' },
    { type: 'Notas Empenho', count: tasks.filter(t => t.tipo === 'NOTA_EMPENHO').length, color: 'bg-emerald-500' },
    { type: 'Liquidações', count: tasks.filter(t => t.tipo === 'NOTA_LIQUIDACAO').length, color: 'bg-amber-500' },
    { type: 'Ordens Bancárias', count: tasks.filter(t => t.tipo === 'ORDEM_BANCARIA').length, color: 'bg-indigo-500' }
  ]

  const totalDocs = typeBreakdown.reduce((acc, t) => acc + t.count, 0) || 1

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">Métricas de Performance</h2>
        <div className="flex items-center gap-2">
          {['7D', '30D', '90D', '1A'].map(period => (
            <button
              key={period}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                period === '7D'
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Assinados"
          value={signedTotal}
          change={{ value: 12, isPositive: true }}
          icon={<CheckCircle2 size={18} className="text-emerald-600" />}
          chartData={weeklySignatures}
          chartColor="bg-emerald-500"
        />
        <StatCard
          title="Tempo Médio (h)"
          value={kpis.avgSignTime}
          change={{ value: 5, isPositive: false }}
          icon={<Clock size={18} className="text-blue-600" />}
        />
        <StatCard
          title="Taxa de Devolução"
          value={`${returnRate}%`}
          icon={<TrendingUp size={18} className="text-amber-600" />}
        />
        <StatCard
          title="Documentos Hoje"
          value={kpis.signedToday}
          icon={<Calendar size={18} className="text-slate-600" />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document Type Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <FileText size={18} className="text-slate-400" />
            Distribuição por Tipo
          </h3>

          <div className="space-y-3">
            {typeBreakdown.map(item => (
              <div key={item.type} className="flex items-center gap-3">
                <div className="w-24 text-sm text-slate-600">{item.type}</div>
                <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${item.color} rounded-full transition-all duration-500`}
                    style={{ width: `${(item.count / totalDocs) * 100}%` }}
                  />
                </div>
                <div className="w-10 text-right text-sm font-medium text-slate-700">
                  {item.count}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Performance */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-slate-400" />
            Desempenho Semanal
          </h3>

          <div className="flex items-end justify-between h-40 gap-2">
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'].map((day, i) => (
              <div key={day} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col items-center gap-1">
                  <div 
                    className="w-full max-w-[24px] bg-amber-500 rounded-t"
                    style={{ height: `${(weeklySignatures[i] / Math.max(...weeklySignatures)) * 80}px` }}
                  />
                </div>
                <span className="text-xs text-slate-500">{day}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-500 rounded" />
              <span className="text-xs text-slate-600">Assinados</span>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Insights */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg mb-1">Insights da Semana</h3>
            <p className="text-slate-400 text-sm">
              Análise automática baseada nos dados do período
            </p>
          </div>
          <TrendingUp size={24} className="text-amber-400" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-2xl font-bold text-amber-400 mb-1">
              {kpis.urgentCount === 0 ? '100%' : `${100 - Math.round((kpis.urgentCount / (kpis.pendingTotal || 1)) * 100)}%`}
            </div>
            <div className="text-sm text-slate-300">SLA Cumprido</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-2xl font-bold text-emerald-400 mb-1">
              {kpis.avgSignTime < 24 ? 'Excelente' : kpis.avgSignTime < 48 ? 'Bom' : 'Atenção'}
            </div>
            <div className="text-sm text-slate-300">Tempo de Resposta</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-400 mb-1">
              {Math.round((signedTotal / (signedTotal + kpis.pendingTotal || 1)) * 100)}%
            </div>
            <div className="text-sm text-slate-300">Taxa de Conclusão</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SefinInsightsView
