'use client'

import React from 'react'
import { 
  LayoutDashboard, 
  Inbox, 
  Search, 
  BarChart3, 
  ChevronLeft,
  ChevronRight,
  FileSignature,
  AlertCircle
} from 'lucide-react'
import type { SefinViewType } from './SefinCockpit'

interface SefinSidebarProps {
  activeView: SefinViewType
  onNavigate: (view: SefinViewType) => void
  isCollapsed: boolean
  onToggleCollapse: () => void
  pendingCount?: number
  urgentCount?: number
}

interface NavItem {
  id: SefinViewType
  label: string
  icon: React.ReactNode
  badge?: number
  badgeType?: 'default' | 'urgent'
}

export function SefinSidebar({
  activeView,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
  pendingCount = 0,
  urgentCount = 0
}: SefinSidebarProps) {
  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Painel',
      icon: <LayoutDashboard size={20} />
    },
    {
      id: 'inbox',
      label: 'Caixa de Entrada',
      icon: <Inbox size={20} />,
      badge: pendingCount,
      badgeType: 'default'
    },
    {
      id: 'explorer',
      label: 'Explorador',
      icon: <Search size={20} />
    },
    {
      id: 'insights',
      label: 'Insights',
      icon: <BarChart3 size={20} />
    }
  ]

  return (
    <aside 
      className={`
        bg-gradient-to-b from-slate-900 to-slate-800 
        text-white flex flex-col
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-16' : 'w-64'}
      `}
    >
      {/* Logo/Brand */}
      <div className="h-16 flex items-center px-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
            <FileSignature size={18} className="text-slate-900" />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <h1 className="font-bold text-base tracking-tight">SEFIN</h1>
              <p className="text-[10px] text-slate-400 -mt-0.5">Cockpit Executivo</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onNavigate(item.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                  transition-all duration-200 group relative
                  ${activeView === item.id 
                    ? 'bg-amber-500/20 text-amber-400' 
                    : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                  }
                `}
              >
                <span className={`flex-shrink-0 ${activeView === item.id ? 'text-amber-400' : ''}`}>
                  {item.icon}
                </span>
                
                {!isCollapsed && (
                  <span className="text-sm font-medium truncate">
                    {item.label}
                  </span>
                )}

                {/* Badge */}
                {item.badge !== undefined && item.badge > 0 && (
                  <span 
                    className={`
                      ${isCollapsed ? 'absolute -top-1 -right-1' : 'ml-auto'}
                      min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold
                      flex items-center justify-center
                      ${item.badgeType === 'urgent' 
                        ? 'bg-red-500 text-white' 
                        : 'bg-slate-600 text-slate-200'
                      }
                    `}
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}

                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="
                    absolute left-full ml-2 px-2 py-1 
                    bg-slate-800 text-white text-sm rounded
                    opacity-0 pointer-events-none group-hover:opacity-100
                    transition-opacity whitespace-nowrap z-50
                    shadow-lg
                  ">
                    {item.label}
                  </div>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Urgent Alert (if any) */}
      {urgentCount > 0 && !isCollapsed && (
        <div className="mx-2 mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle size={16} />
            <span className="text-xs font-medium">
              {urgentCount} {urgentCount === 1 ? 'processo urgente' : 'processos urgentes'}
            </span>
          </div>
        </div>
      )}

      {/* Collapse Toggle */}
      <div className="border-t border-slate-700/50 p-2">
        <button
          onClick={onToggleCollapse}
          className="
            w-full flex items-center justify-center gap-2 
            px-3 py-2 rounded-lg
            text-slate-400 hover:bg-slate-700/50 hover:text-white
            transition-colors
          "
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!isCollapsed && <span className="text-sm">Recolher</span>}
        </button>
      </div>
    </aside>
  )
}

export default SefinSidebar
