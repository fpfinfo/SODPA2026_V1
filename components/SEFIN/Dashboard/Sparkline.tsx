'use client'

import React from 'react'

interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  color?: string
  fillColor?: string
  strokeWidth?: number
  showDots?: boolean
  animated?: boolean
}

/**
 * Lightweight SVG Sparkline component
 * No external dependencies required
 */
export function Sparkline({
  data,
  width = 100,
  height = 32,
  color = '#F59E0B',
  fillColor,
  strokeWidth = 2,
  showDots = false,
  animated = true
}: SparklineProps) {
  if (!data || data.length < 2) {
    return (
      <svg width={width} height={height}>
        <line 
          x1={0} y1={height / 2} 
          x2={width} y2={height / 2}
          stroke={color}
          strokeWidth={1}
          strokeDasharray="4 4"
          opacity={0.3}
        />
      </svg>
    )
  }

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  // Add padding to prevent line from touching edges
  const padding = 4
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2

  // Calculate points
  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth
    const y = padding + chartHeight - ((value - min) / range) * chartHeight
    return { x, y, value }
  })

  // Create smooth curve path using bezier curves
  const pathD = points.reduce((path, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`
    }
    
    // Use quadratic bezier for smoother curves
    const prev = points[index - 1]
    const cpX = (prev.x + point.x) / 2
    
    return `${path} Q ${cpX} ${prev.y}, ${point.x} ${point.y}`
  }, '')

  // Create fill path (area under the curve)
  const fillPathD = pathD 
    + ` L ${points[points.length - 1].x} ${height - padding}`
    + ` L ${padding} ${height - padding} Z`

  return (
    <svg 
      width={width} 
      height={height} 
      className={animated ? 'animate-in fade-in duration-500' : ''}
    >
      {/* Gradient for fill */}
      <defs>
        <linearGradient id={`sparkline-gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={fillColor || color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={fillColor || color} stopOpacity={0.05} />
        </linearGradient>
      </defs>

      {/* Fill area */}
      <path
        d={fillPathD}
        fill={`url(#sparkline-gradient-${color.replace('#', '')})`}
      />

      {/* Line */}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={animated ? 'animate-in slide-in-from-left duration-700' : ''}
      />

      {/* Dots */}
      {showDots && points.map((point, index) => (
        <circle
          key={index}
          cx={point.x}
          cy={point.y}
          r={index === points.length - 1 ? 3 : 2}
          fill={index === points.length - 1 ? color : 'white'}
          stroke={color}
          strokeWidth={1}
        />
      ))}

      {/* Last point highlight */}
      {points.length > 0 && (
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r={3}
          fill={color}
          className={animated ? 'animate-pulse' : ''}
        />
      )}
    </svg>
  )
}

// Trend indicator component
interface TrendIndicatorProps {
  current: number
  previous: number
  format?: 'percent' | 'number' | 'currency'
}

export function TrendIndicator({ current, previous, format = 'percent' }: TrendIndicatorProps) {
  const diff = current - previous
  const percentChange = previous !== 0 ? (diff / previous) * 100 : 0
  const isPositive = diff >= 0

  const formatValue = () => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('pt-BR', { 
          style: 'currency', 
          currency: 'BRL',
          notation: 'compact'
        }).format(Math.abs(diff))
      case 'number':
        return Math.abs(diff).toLocaleString('pt-BR')
      case 'percent':
      default:
        return `${Math.abs(percentChange).toFixed(1)}%`
    }
  }

  return (
    <div className={`flex items-center gap-1 text-xs font-semibold ${
      isPositive ? 'text-emerald-600' : 'text-red-600'
    }`}>
      <svg 
        width={12} 
        height={12} 
        viewBox="0 0 12 12" 
        fill="currentColor"
        className={isPositive ? '' : 'rotate-180'}
      >
        <path d="M6 2L10 8H2L6 2Z" />
      </svg>
      <span>{formatValue()}</span>
    </div>
  )
}

export default Sparkline
