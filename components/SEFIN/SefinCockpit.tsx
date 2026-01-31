'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { SefinHeader } from './SefinHeader'
import { useSefinCockpit } from '../../hooks/useSefinCockpit'

// Views
import { SefinControlPanelView } from './views/SefinControlPanelView'
import { SefinExplorerView } from './views/SefinExplorerView'
import { SefinIntelligenceView } from './views/SefinIntelligenceView'

export type SefinViewType = 'control' | 'explorer' | 'intelligence'

const SEEN_COUNT_KEY = 'sefin_last_seen_count'
const DARK_MODE_KEY = 'sefin_dark_mode'

export function SefinCockpit() {
  const [activeView, setActiveView] = useState<SefinViewType>('control')
  const [searchQuery, setSearchQuery] = useState('')
  const [lastSeenCount, setLastSeenCount] = useState<number>(0)
  const [darkMode, setDarkMode] = useState<boolean>(false)
  
  // Get counts for header badges
  const { tasks, kpis } = useSefinCockpit()
  const pendingCount = tasks.filter(t => t.status === 'PENDING').length
  const urgentCount = kpis.urgentCount

  // Load preferences from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCount = localStorage.getItem(SEEN_COUNT_KEY)
      if (savedCount) {
        setLastSeenCount(parseInt(savedCount, 10) || 0)
      }
      
      const savedDarkMode = localStorage.getItem(DARK_MODE_KEY)
      if (savedDarkMode) {
        setDarkMode(savedDarkMode === 'true')
      }
    }
  }, [])

  // Calculate new processes since last view
  const newCount = Math.max(0, pendingCount - lastSeenCount)

  // Handle acknowledge - save current count
  const handleAcknowledgeNew = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SEEN_COUNT_KEY, pendingCount.toString())
      setLastSeenCount(pendingCount)
    }
  }, [pendingCount])

  // Handle dark mode toggle
  const handleToggleDarkMode = useCallback(() => {
    setDarkMode(prev => {
      const next = !prev
      if (typeof window !== 'undefined') {
        localStorage.setItem(DARK_MODE_KEY, next.toString())
      }
      return next
    })
  }, [])

  // Keyboard shortcut for dark mode (D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'd' || e.key === 'D') {
        handleToggleDarkMode()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleToggleDarkMode])

  // Render active view based on navigation
  const renderActiveView = () => {
    switch (activeView) {
      case 'control':
        return <SefinControlPanelView darkMode={darkMode} />
      case 'explorer':
        return <SefinExplorerView searchQuery={searchQuery} darkMode={darkMode} />
      case 'intelligence':
        return <SefinIntelligenceView darkMode={darkMode} />
      default:
        return <SefinControlPanelView darkMode={darkMode} />
    }
  }

  return (
    <div className={`h-full flex flex-col transition-colors duration-300 ${darkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
      {/* Header with Navigation */}
      <SefinHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeView={activeView}
        onNavigate={setActiveView}
        pendingCount={pendingCount}
        urgentCount={urgentCount}
        newCount={newCount}
        onAcknowledgeNew={handleAcknowledgeNew}
        darkMode={darkMode}
        onToggleDarkMode={handleToggleDarkMode}
      />

      {/* Main Content - Full Width */}
      <main className="flex-1 overflow-auto">
        {renderActiveView()}
      </main>
    </div>
  )
}

export default SefinCockpit


