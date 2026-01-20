'use client'

import React, { useState, useMemo } from 'react'
import { 
  Search, 
  Filter,
  Calendar,
  Download,
  Eye,
  FileText,
  Building2,
  User,
  DollarSign,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useSefinCockpit, SefinTask } from '../../../hooks/useSefinCockpit'
import { ExportButtons } from '../Explorer'
import { ContextDrawer, SimilarSearchType } from '../ContextDrawer'

interface SefinExplorerViewProps {
  searchQuery?: string
}

// Pagination config
const ITEMS_PER_PAGE = 25

// Status Badge
function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; color: string }> = {
    'PENDING': { label: 'Pendente', color: 'bg-amber-100 text-amber-700' },
    'SIGNED': { label: 'Assinado', color: 'bg-emerald-100 text-emerald-700' },
    'REJECTED': { label: 'Devolvido', color: 'bg-red-100 text-red-700' },
    'SENT': { label: 'Enviado', color: 'bg-blue-100 text-blue-700' }
  }

  const config = statusConfig[status] || { label: status, color: 'bg-slate-100 text-slate-700' }

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  )
}

export function SefinExplorerView({ searchQuery }: SefinExplorerViewProps) {
  const { tasks, isLoading, filters, updateFilter } = useSefinCockpit({ autoRefresh: false })
  const [localSearch, setLocalSearch] = useState(searchQuery || '')
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' })
  
  // Context Drawer state
  const [selectedTask, setSelectedTask] = useState<SefinTask | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)

  // Apply filters (search + date range)
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Text search filter
      if (localSearch) {
        const query = localSearch.toLowerCase()
        const nup = task.processo?.nup?.toLowerCase() || ''
        const suprido = task.processo?.suprido_nome?.toLowerCase() || ''
        const lotacao = task.processo?.lotacao_nome?.toLowerCase() || ''
        const tipo = task.tipo?.toLowerCase() || ''
        
        const matchesSearch = nup.includes(query) || suprido.includes(query) || lotacao.includes(query) || tipo.includes(query)
        if (!matchesSearch) return false
      }
      
      // Date range filter
      if (dateRange.start || dateRange.end) {
        const taskDate = new Date(task.created_at)
        const taskDateStr = taskDate.toISOString().split('T')[0]
        
        if (dateRange.start && taskDateStr < dateRange.start) return false
        if (dateRange.end && taskDateStr > dateRange.end) return false
      }
      
      return true
    })
  }, [tasks, localSearch, dateRange])

  // Pagination logic
  const totalPages = Math.ceil(filteredTasks.length / ITEMS_PER_PAGE)
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE
    return filteredTasks.slice(start, end)
  }, [filteredTasks, currentPage])

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setLocalSearch(value)
    setCurrentPage(1)
  }

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    setDateRange(prev => ({ ...prev, [field]: value }))
    setCurrentPage(1)
  }

  // Context Drawer handlers
  const handleOpenDrawer = (task: SefinTask) => {
    setSelectedTask(task)
    setIsDrawerOpen(true)
  }

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false)
    setSelectedTask(null)
  }

  // View Similar handler - searches by comarca or suprido
  const handleViewSimilar = (searchType: SimilarSearchType, value: string) => {
    if (value) {
      handleSearchChange(value)
      setIsDrawerOpen(false)
      setSelectedTask(null)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Search & Filters Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Main Search */}
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por NUP, suprido, unidade, tipo..."
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-amber-300 focus:ring-2 focus:ring-amber-100 transition-all"
            />
          </div>

          {/* Date Range */}
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-slate-400" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => handleDateRangeChange('start', e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
            />
            <span className="text-slate-400">até</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => handleDateRangeChange('end', e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
            />
          </div>

          {/* Export Buttons */}
          <ExportButtons 
            data={filteredTasks} 
            filename={`sefin_relatorio_${new Date().toISOString().split('T')[0]}`}
          />
        </div>

        {/* Quick Filters */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
          <span className="text-xs text-slate-500 mr-2">Filtros rápidos:</span>
          
          {['Todos', 'Assinados', 'Pendentes', 'Devolvidos'].map(filter => (
            <button
              key={filter}
              onClick={() => {
                const statusMap: Record<string, 'all' | 'pending' | 'signed' | 'returned'> = {
                  'Todos': 'all',
                  'Assinados': 'signed',
                  'Pendentes': 'pending',
                  'Devolvidos': 'returned'
                }
                updateFilter('status', statusMap[filter])
                setCurrentPage(1)
              }}
              className={`
                px-3 py-1 rounded-full text-xs font-medium transition-all
                ${filters.status === (filter === 'Todos' ? 'all' : filter.toLowerCase().replace('s', ''))
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }
              `}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left text-xs font-semibold text-slate-600 px-4 py-3">NUP</th>
                <th className="text-left text-xs font-semibold text-slate-600 px-4 py-3">Tipo</th>
                <th className="text-left text-xs font-semibold text-slate-600 px-4 py-3">Suprido</th>
                <th className="text-left text-xs font-semibold text-slate-600 px-4 py-3">Unidade</th>
                <th className="text-left text-xs font-semibold text-slate-600 px-4 py-3">Valor</th>
                <th className="text-left text-xs font-semibold text-slate-600 px-4 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-slate-600 px-4 py-3">Data</th>
                <th className="text-center text-xs font-semibold text-slate-600 px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedTasks.length > 0 ? (
                paginatedTasks.map(task => (
                  <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-800">
                        {task.processo?.nup || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-600">{task.tipo}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-slate-400" />
                        <span className="text-sm text-slate-600">
                          {task.processo?.suprido_nome || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 size={14} className="text-slate-400" />
                        <span className="text-sm text-slate-600 truncate max-w-[150px]">
                          {task.processo?.lotacao_nome || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <DollarSign size={14} className="text-slate-400" />
                        <span className="text-sm font-medium text-slate-700">
                          {task.processo?.valor_total 
                            ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(task.processo.valor_total)
                            : 'N/A'
                          }
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-500">
                        {new Date(task.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button 
                        onClick={() => handleOpenDrawer(task)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
                        title="Visualizar documento"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <FileText size={40} className="mx-auto mb-3 text-slate-300" />
                    <p className="text-sm text-slate-500">Nenhum documento encontrado</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredTasks.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50">
            <span className="text-sm text-slate-500">
              Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredTasks.length)} de {filteredTasks.length} documentos
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm text-slate-600 min-w-[80px] text-center">
                Página {currentPage} de {totalPages || 1}
              </span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="p-1.5 text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Context Drawer */}
      <ContextDrawer
        task={selectedTask}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        onViewSimilar={handleViewSimilar}
      />
    </div>
  )
}

export default SefinExplorerView
