'use client'

import React from 'react'
import { 
  Search, 
  LayoutDashboard,
  Inbox,
  History,
  Shield,
  Zap
} from 'lucide-react'

// Types defined locally to avoid circular dependency
export type GestorViewType = 'dashboard' | 'inbox' | 'history'
export type GestorMode = 'MANAGEMENT' | 'EXECUTION'

interface GestorHeaderProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  activeView: GestorViewType
  onNavigate: (view: GestorViewType) => void
  gestorMode: GestorMode
  onModeChange: (mode: GestorMode) => void
  pendingCount?: number
  extraActions?: React.ReactNode
}

interface NavItem {
  id: GestorViewType
  label: string
  shortLabel: string
  icon: React.ReactNode
  badge?: number
  showInMode?: GestorMode | 'both'
}

export function GestorHeader({
  searchQuery,
  onSearchChange,
  activeView,
  onNavigate,
  gestorMode,
  onModeChange,
  pendingCount = 0,
  extraActions
}: GestorHeaderProps) {
  
  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Painel',
      shortLabel: 'Painel',
      icon: <LayoutDashboard size={18} />,
      showInMode: 'both'
    },
    {
      id: 'inbox',
      label: 'Caixa de Entrada',
      shortLabel: 'Inbox',
      icon: <Inbox size={18} />,
      badge: pendingCount,
      showInMode: 'MANAGEMENT'
    },
    {
      id: 'history',
      label: 'Histórico',
      shortLabel: 'Histórico',
      icon: <History size={18} />,
      showInMode: 'both'
    }
  ]

  // Filter nav items based on current mode
  const filteredNavItems = navItems.filter(item => 
    item.showInMode === 'both' || item.showInMode === gestorMode
  )

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm">
      {/* Single Row: Mode Switcher + Navigation + Search */}
      <div className="h-14 flex items-center px-6 gap-4">
        
        {/* Mode Switcher (Role Context) */}
        <div className="flex bg-slate-100 p-1 rounded-xl mr-4">
          <button
            onClick={() => onModeChange('MANAGEMENT')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              gestorMode === 'MANAGEMENT'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Shield size={16} />
            <span className="hidden sm:inline">Gestão de Equipe</span>
            <span className="sm:hidden">Gestão</span>
          </button>
          <button
            onClick={() => onModeChange('EXECUTION')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              gestorMode === 'EXECUTION'
                ? 'bg-amber-500 text-white shadow-lg shadow-amber-200'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Zap size={16} />
            <span className="hidden sm:inline">Minha Execução</span>
            <span className="sm:hidden">Execução</span>
          </button>
        </div>

        {/* Mode Tag (Execution Only) */}
        {gestorMode === 'EXECUTION' && (
          <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-wider rounded-full border border-amber-200 animate-pulse">
            Modo Exclusivo: Extra-Emergencial
          </span>
        )}

        {/* Divider */}
        <div className="h-6 w-px bg-slate-200" />

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1">
          {filteredNavItems.map((item) => (
            <button
              key={item.id}
              data-view={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all relative ${
                activeView === item.id
                  ? gestorMode === 'EXECUTION'
                    ? 'bg-amber-50 text-amber-700 font-bold'
                    : 'bg-blue-50 text-blue-700 font-bold'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {item.icon}
              <span className="hidden md:inline">{item.label}</span>
              <span className="md:hidden">{item.shortLabel}</span>
              
              {/* Badge */}
              {item.badge !== undefined && item.badge > 0 && (
                <span className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-black rounded-full ${
                  gestorMode === 'EXECUTION'
                    ? 'bg-amber-500 text-white'
                    : 'bg-blue-600 text-white'
                }`}>
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search Bar */}
        <div className="relative w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por NUP, suprido, unidade..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
          />
          {searchQuery && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase">
              ctrl+k
            </span>
          )}
        </div>

        {/* Extra Actions */}
        {extraActions && (
          <div className="pl-4 border-l border-slate-200">
            {extraActions}
          </div>
        )}
      </div>
    </header>
  )
}
