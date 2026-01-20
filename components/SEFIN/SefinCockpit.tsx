'use client'

import React, { useState } from 'react'
import { SefinSidebar } from './SefinSidebar'
import { SefinHeader } from './SefinHeader'

// Views (to be implemented in later phases)
import { SefinDashboardView } from './views/SefinDashboardView'
import { SefinInboxView } from './views/SefinInboxView'
import { SefinExplorerView } from './views/SefinExplorerView'
import { SefinInsightsView } from './views/SefinInsightsView'

export type SefinViewType = 'dashboard' | 'inbox' | 'explorer' | 'insights'

interface SefinCockpitProps {
  user?: {
    id: string
    nome: string
    cargo?: string
    avatar?: string
  }
}

export function SefinCockpit({ user }: SefinCockpitProps) {
  const [activeView, setActiveView] = useState<SefinViewType>('dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  // Render active view based on navigation
  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <SefinDashboardView />
      case 'inbox':
        return <SefinInboxView searchQuery={searchQuery} />
      case 'explorer':
        return <SefinExplorerView searchQuery={searchQuery} />
      case 'insights':
        return <SefinInsightsView />
      default:
        return <SefinDashboardView />
    }
  }

  return (
    <div className="h-screen flex bg-slate-50">
      {/* Sidebar - Left Column */}
      <SefinSidebar
        activeView={activeView}
        onNavigate={setActiveView}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header with Search */}
        <SefinHeader
          user={user}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeView={activeView}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {renderActiveView()}
        </main>
      </div>
    </div>
  )
}

export default SefinCockpit
