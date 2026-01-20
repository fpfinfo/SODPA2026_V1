'use client'

import React from 'react'
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { Sparkline, TrendIndicator } from './Sparkline'

interface DashboardKPIProps {
  label: string
  value: number | string
  sublabel?: string
  trend?: {
    data: number[]
    isPositive?: boolean
    changePercent?: number
  }
  status?: 'ok' | 'warning' | 'danger'
  icon?: 'money' | 'document' | 'clock' | 'alert' | 'check'
  format?: 'currency' | 'number' | 'percent' | 'time'
  size?: 'sm' | 'md' | 'lg'
}

const STATUS_COLORS = {
  ok: {
    bg: 'from-emerald-500 to-emerald-600',
    light: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-700',
    accent: '#10B981'
  },
  warning: {
    bg: 'from-amber-500 to-amber-600',
    light: 'bg-amber-50 border-amber-200',
    text: 'text-amber-700',
    accent: '#F59E0B'
  },
  danger: {
    bg: 'from-red-500 to-red-600',
    light: 'bg-red-50 border-red-200',
    text: 'text-red-700',
    accent: '#EF4444'
  }
}

const ICONS = {
  money: DollarSign,
  document: FileText,
  clock: Clock,
  alert: AlertTriangle,
  check: CheckCircle2
}

export function DashboardKPI({
  label,
  value,
  sublabel,
  trend,
  status = 'ok',
  icon = 'document',
  format = 'number',
  size = 'md'
}: DashboardKPIProps) {
  const colors = STATUS_COLORS[status]
  const Icon = ICONS[icon]

  const formatValue = (val: number | string): string => {
    if (typeof val === 'string') return val
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          notation: val >= 1000000 ? 'compact' : 'standard',
          maximumFractionDigits: 0
        }).format(val)
      case 'percent':
        return `${val.toFixed(1)}%`
      case 'time':
        return `${val}h`
      case 'number':
      default:
        return val.toLocaleString('pt-BR')
    }
  }

  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-5'
  }

  const valueSizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl'
  }

  return (
    <div className={`
      relative overflow-hidden rounded-xl border
      ${colors.light}
      ${sizeClasses[size]}
      transition-all duration-200
      hover:shadow-md hover:scale-[1.02]
    `}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg bg-white/60 ${colors.text}`}>
          <Icon size={size === 'lg' ? 22 : 18} />
        </div>
        
        {trend?.changePercent !== undefined && (
          <div className={`
            flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold
            ${trend.isPositive 
              ? 'bg-emerald-100 text-emerald-700' 
              : 'bg-red-100 text-red-700'
            }
          `}>
            {trend.isPositive 
              ? <ArrowUpRight size={12} /> 
              : <ArrowDownRight size={12} />
            }
            {Math.abs(trend.changePercent).toFixed(1)}%
          </div>
        )}
      </div>

      {/* Value */}
      <div className={`${valueSizes[size]} font-bold text-slate-800 mb-1`}>
        {formatValue(value)}
      </div>

      {/* Label */}
      <div className="text-sm font-medium text-slate-600">
        {label}
      </div>

      {/* Sublabel */}
      {sublabel && (
        <div className="text-xs text-slate-500 mt-0.5">
          {sublabel}
        </div>
      )}

      {/* Sparkline */}
      {trend?.data && trend.data.length > 0 && (
        <div className="mt-3">
          <Sparkline 
            data={trend.data}
            width={size === 'lg' ? 140 : 100}
            height={size === 'lg' ? 36 : 28}
            color={colors.accent}
            strokeWidth={2}
          />
        </div>
      )}
    </div>
  )
}

// Compact KPI for horizontal layouts
interface CompactKPIProps {
  label: string
  value: number | string
  icon?: React.ReactNode
  color?: string
}

export function CompactKPI({ label, value, icon, color = 'text-slate-600' }: CompactKPIProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-lg border border-slate-200">
      {icon && (
        <div className={`${color}`}>
          {icon}
        </div>
      )}
      <div>
        <div className="text-lg font-bold text-slate-800">
          {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
        </div>
        <div className="text-xs text-slate-500">{label}</div>
      </div>
    </div>
  )
}

export default DashboardKPI
