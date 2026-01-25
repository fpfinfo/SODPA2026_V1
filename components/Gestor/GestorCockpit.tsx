'use client'

import React, { useState } from 'react'
import { GestorHeader, type GestorViewType, type GestorMode } from './GestorHeader'
import { useGestorProcesses } from '../../hooks/useGestorProcesses'

// Views
import { GestorDashboardView } from './views/GestorDashboardView'
import { GestorInboxView } from './views/GestorInboxView'
import { GestorHistoryView } from './views/GestorHistoryView'
import { GestorExecutionView } from './views/GestorExecutionView'
import { NomeacaoModal } from './NomeacaoModal'
import { useUserProfile } from '../../hooks/useUserProfile'
import { supabase } from '../../lib/supabaseClient'
import { UserPlus } from 'lucide-react'

// Re-export types for external consumers
export type { GestorViewType, GestorMode }

import { useAuth } from '../../lib/AuthContext'

export function GestorCockpit() {
  const [activeView, setActiveView] = useState<GestorViewType>('dashboard')
  const [gestorMode, setGestorMode] = useState<GestorMode>('MANAGEMENT')
  const [searchQuery, setSearchQuery] = useState('')
  const [showNomeacaoModal, setShowNomeacaoModal] = useState(false)
  const [unidadeGestor, setUnidadeGestor] = useState<any>(null)

  const { user } = useAuth()
  const { userProfile } = useUserProfile(user)
  
  // Get counts for header badges
  const { data: pendingProcesses = [] } = useGestorProcesses()

  // Fetch Unidade do Gestor
  React.useEffect(() => {
    async function fetchUnidade() {
      if (!userProfile?.lotacao) return
      
      // Tenta achar comarca onde user é gestor
      const { data } = await supabase
        .from('comarcas')
        .select('*')
        .eq('nome', userProfile.lotacao)
        .single()
      
      if (data) {
        setUnidadeGestor(data)
      } else {
         // Fallback
         setUnidadeGestor({ id: 'mock-id', nome: userProfile.lotacao, suprido_nome: 'Atual Suprido' })
      }
    }
    fetchUnidade()
  }, [userProfile])
  const pendingCount = pendingProcesses.length

  // Render active view based on navigation and mode
  const renderActiveView = () => {
    // Both modes support same views, but Execution mode defaults to execution-specific content
    switch (activeView) {
      case 'dashboard':
        // In Execution mode, dashboard shows the execution view (emergency requests)
        if (gestorMode === 'EXECUTION') {
          return <GestorExecutionView searchQuery={searchQuery} />
        }
        return <GestorDashboardView />
      case 'inbox':
        // Inbox is only for Management mode
        if (gestorMode === 'EXECUTION') {
          return <GestorExecutionView searchQuery={searchQuery} />
        }
        return <GestorInboxView searchQuery={searchQuery} />
      case 'history':
        // History shows tramitation history in both modes
        return <GestorHistoryView searchQuery={searchQuery} />
      default:
        if (gestorMode === 'EXECUTION') {
          return <GestorExecutionView searchQuery={searchQuery} />
        }
        return <GestorDashboardView />
    }
  }

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header with Navigation + Mode Switcher */}
      <GestorHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeView={activeView}
        onNavigate={setActiveView}
        gestorMode={gestorMode}
        onModeChange={setGestorMode}
        pendingCount={pendingCount}
        extraActions={
          <button
             onClick={() => setShowNomeacaoModal(true)}
             className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 border border-blue-500"
             title="Nomear novo suprido para a comarca"
          >
             <UserPlus size={18} />
             <span className="hidden sm:inline">Nomear Novo Suprido</span>
             <span className="sm:hidden">Nomear</span>
          </button>
        }
      />

      {/* Nomeacao Modal */}
      <NomeacaoModal 
        isOpen={showNomeacaoModal}
        onClose={() => setShowNomeacaoModal(false)}
        currentUser={userProfile} // Pass profile not auth user
        currentUnidade={unidadeGestor}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {renderActiveView()}
      </main>
    </div>
  )
}
