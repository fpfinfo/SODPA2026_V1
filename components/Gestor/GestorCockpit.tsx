'use client'

import React, { useState } from 'react'
import { GestorHeader, type GestorViewType, type GestorMode } from './GestorHeader'
import { useGestorProcesses } from '../../hooks/useGestorProcesses'

// Views
import { GestorDashboardView } from './views/GestorDashboardView'
import { GestorInboxView } from './views/GestorInboxView'
import { GestorHistoryView } from './views/GestorHistoryView'
import { GestorExecutionView } from './views/GestorExecutionView'

// Re-export types for external consumers
export type { GestorViewType, GestorMode }

export function GestorCockpit() {
  const [activeView, setActiveView] = useState<GestorViewType>('dashboard')
  const [gestorMode, setGestorMode] = useState<GestorMode>('MANAGEMENT')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Get counts for header badges
  const { data: pendingProcesses = [] } = useGestorProcesses()
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
      />

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {renderActiveView()}
      </main>
    </div>
  )
}
