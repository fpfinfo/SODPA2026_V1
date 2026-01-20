'use client'

import React from 'react'
import { 
  Search, 
  LayoutDashboard,
  Inbox,
  BarChart3,
  TrendingUp
} from 'lucide-react'
import type { SefinViewType } from './SefinCockpit'

interface SefinHeaderProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  activeView: SefinViewType
  onNavigate: (view: SefinViewType) => void
  pendingCount?: number
  urgentCount?: number
}

interface NavItem {
  id: SefinViewType
  label: string
  shortLabel: string
  icon: React.ReactNode
  badge?: number
  badgeType?: 'default' | 'urgent'
}

export function SefinHeader({
  searchQuery,
  onSearchChange,
  activeView,
  onNavigate,
  pendingCount = 0,
  urgentCount = 0
}: SefinHeaderProps) {
  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Painel',
      shortLabel: 'Painel',
      icon: <LayoutDashboard size={18} />
    },
    {
      id: 'inbox',
      label: 'Caixa de Entrada',
      shortLabel: 'Inbox',
      icon: <Inbox size={18} />,
      badge: pendingCount,
      badgeType: urgentCount > 0 ? 'urgent' : 'default'
    },
    {
      id: 'explorer',
      label: 'Explorador',
      shortLabel: 'Explorer',
      icon: <Search size={18} />
    },
    {
      id: 'insights',
      label: 'Insights',
      shortLabel: 'Insights',
      icon: <BarChart3 size={18} />
    },
    {
      id: 'intelligence',
      label: 'Inteligência',
      shortLabel: 'Intel',
      icon: <TrendingUp size={18} />
    }
  ]

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm">
      {/* Single Row: Navigation + Search */}
      <div className="h-12 flex items-center px-6 gap-4">
        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-lg
                text-sm font-medium transition-all duration-200
                ${activeView === item.id 
                  ? 'bg-amber-500/15 text-amber-700 shadow-sm' 
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                }
              `}
            >
              <span className={activeView === item.id ? 'text-amber-600' : ''}>
                {item.icon}
              </span>
              <span className="hidden lg:inline">{item.label}</span>
              <span className="lg:hidden">{item.shortLabel}</span>
              
              {/* Badge */}
              {item.badge !== undefined && item.badge > 0 && (
                <span 
                  className={`
                    min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold
                    flex items-center justify-center
                    ${item.badgeType === 'urgent' 
                      ? 'bg-red-500 text-white animate-pulse' 
                      : 'bg-slate-600 text-white'
                    }
                  `}
                >
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Global Search - Inline after nav */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search 
              size={16} 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Buscar por NUP, suprido, unidade..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="
                w-full pl-9 pr-4 py-1.5 
                bg-slate-50 border border-slate-200
                rounded-lg text-sm text-slate-700
                placeholder:text-slate-400
                focus:bg-white focus:border-amber-300 focus:ring-2 focus:ring-amber-100
                transition-all
              "
            />
            {/* Keyboard Shortcut Hint */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 text-slate-500 rounded border border-slate-200">
                Ctrl
              </kbd>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 text-slate-500 rounded border border-slate-200">
                K
              </kbd>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default SefinHeader
