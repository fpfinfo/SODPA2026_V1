'use client'

import React from 'react'
import { 
  Search, 
  Bell, 
  Settings, 
  User,
  LogOut,
  HelpCircle
} from 'lucide-react'
import type { SefinViewType } from './SefinCockpit'

interface SefinHeaderProps {
  user?: {
    id: string
    nome: string
    cargo?: string
    avatar?: string
  }
  searchQuery: string
  onSearchChange: (query: string) => void
  activeView: SefinViewType
  notificationCount?: number
}

const VIEW_TITLES: Record<SefinViewType, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Painel Executivo',
    subtitle: 'Visão consolidada do dia'
  },
  inbox: {
    title: 'Caixa de Entrada',
    subtitle: 'Documentos aguardando assinatura'
  },
  explorer: {
    title: 'Explorador',
    subtitle: 'Busca e histórico de documentos'
  },
  insights: {
    title: 'Insights',
    subtitle: 'Métricas e análises de desempenho'
  }
}

export function SefinHeader({
  user,
  searchQuery,
  onSearchChange,
  activeView,
  notificationCount = 0
}: SefinHeaderProps) {
  const viewInfo = VIEW_TITLES[activeView]

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 gap-6">
      {/* View Title */}
      <div className="flex-shrink-0">
        <h2 className="text-lg font-semibold text-slate-800">{viewInfo.title}</h2>
        <p className="text-xs text-slate-500 -mt-0.5">{viewInfo.subtitle}</p>
      </div>

      {/* Global Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search 
            size={18} 
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Buscar por NUP, suprido, unidade..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="
              w-full pl-10 pr-4 py-2 
              bg-slate-100 border border-transparent
              rounded-lg text-sm text-slate-700
              placeholder:text-slate-400
              focus:bg-white focus:border-amber-300 focus:ring-2 focus:ring-amber-100
              transition-all
            "
          />
          {/* Keyboard Shortcut Hint */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-200 text-slate-500 rounded">
              Ctrl
            </kbd>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-200 text-slate-500 rounded">
              K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {/* Help */}
        <button 
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          title="Ajuda"
        >
          <HelpCircle size={20} />
        </button>

        {/* Notifications */}
        <button 
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors relative"
          title="Notificações"
        >
          <Bell size={20} />
          {notificationCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </button>

        {/* Settings */}
        <button 
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          title="Configurações"
        >
          <Settings size={20} />
        </button>

        {/* Separator */}
        <div className="w-px h-8 bg-slate-200 mx-2" />

        {/* User Profile */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium text-slate-700">
              {user?.nome || 'Ordenador de Despesas'}
            </p>
            <p className="text-xs text-slate-500">
              {user?.cargo || 'SEFIN'}
            </p>
          </div>
          
          <div className="relative group">
            <button className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-semibold text-sm shadow-md">
              {user?.nome ? user.nome.charAt(0).toUpperCase() : 'O'}
            </button>

            {/* Dropdown Menu */}
            <div className="
              absolute right-0 top-full mt-2 w-48
              bg-white rounded-lg shadow-lg border border-slate-200
              opacity-0 invisible group-hover:opacity-100 group-hover:visible
              transition-all duration-200 z-50
            ">
              <div className="py-1">
                <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
                  <User size={16} />
                  <span>Meu Perfil</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
                  <Settings size={16} />
                  <span>Preferências</span>
                </button>
                <hr className="my-1 border-slate-100" />
                <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                  <LogOut size={16} />
                  <span>Sair</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default SefinHeader
