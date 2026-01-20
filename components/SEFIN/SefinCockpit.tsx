'use client'

import React, { useState } from 'react'
import { SefinHeader } from './SefinHeader'
import { useSefinCockpit } from '../../hooks/useSefinCockpit'

// Views
import { SefinDashboardView } from './views/SefinDashboardView'
import { SefinInboxView } from './views/SefinInboxView'
import { SefinExplorerView } from './views/SefinExplorerView'
import { SefinInsightsView } from './views/SefinInsightsView'
import { SefinIntelligenceView } from './views/SefinIntelligenceView'

export type SefinViewType = 'dashboard' | 'inbox' | 'explorer' | 'insights' | 'intelligence'

export function SefinCockpit() {
  const [activeView, setActiveView] = useState<SefinViewType>('dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Get counts for header badges
  const { tasks, kpis } = useSefinCockpit()
  const pendingCount = tasks.filter(t => t.status === 'PENDING').length
  const urgentCount = kpis.urgentCount

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
      case 'intelligence':
        return <SefinIntelligenceView />
      default:
        return <SefinDashboardView />
    }
  }

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header with Navigation */}
      <SefinHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeView={activeView}
        onNavigate={setActiveView}
        pendingCount={pendingCount}
        urgentCount={urgentCount}
      />

      {/* Main Content - Full Width */}
      <main className="flex-1 overflow-auto">
        {renderActiveView()}
      </main>
    </div>
  )
}

export default SefinCockpit
