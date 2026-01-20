'use client'

import React, { useState, useEffect } from 'react'
import { 
  History,
  BadgeCheck,
  ThumbsDown,
  RefreshCw,
  Printer
} from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'

interface GestorHistoryViewProps {
  searchQuery: string
}

interface HistoryEntry {
  id: string
  nup: string
  tipo: string
  valor: number
  interessado: string
  destino: string
  statusNovo: string
  observacao: string
  data: string
  hora: string
}

export function GestorHistoryView({ searchQuery }: GestorHistoryViewProps) {
  const [historyData, setHistoryData] = useState<HistoryEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'SOSFU' | 'SUPRIDO'>('ALL')

  const fetchHistory = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('historico_tramitacao')
        .select(`
          id,
          origem,
          destino,
          status_anterior,
          status_novo,
          observacao,
          data_tramitacao,
          solicitacao_id,
          solicitacoes!historico_tramitacao_solicitacao_id_fkey (
            nup,
            tipo,
            valor_solicitado,
            profiles!solicitacoes_user_id_fkey (
              nome
            )
          )
        `)
        .eq('origem', 'GESTOR')
        .order('data_tramitacao', { ascending: false })
        .limit(50)

      if (error) throw error

      const transformed = ((data || []) as any[]).map(h => ({
        id: h.id,
        nup: h.solicitacoes?.nup || 'N/A',
        tipo: h.solicitacoes?.tipo || 'N/A',
        valor: h.solicitacoes?.valor_solicitado || 0,
        interessado: h.solicitacoes?.profiles?.nome || 'N/A',
        destino: h.destino,
        statusNovo: h.status_novo,
        observacao: h.observacao,
        data: new Date(h.data_tramitacao).toLocaleDateString('pt-BR'),
        hora: new Date(h.data_tramitacao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      }))

      setHistoryData(transformed)
    } catch (error) {
      console.error('Error fetching history:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  // Filter and search
  const filteredHistory = historyData.filter(h => {
    // Type filter
    if (historyFilter !== 'ALL' && h.destino !== historyFilter) return false
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        h.nup?.toLowerCase().includes(query) ||
        h.interessado?.toLowerCase().includes(query) ||
        h.tipo?.toLowerCase().includes(query)
      )
    }
    return true
  })

  const sosfuCount = historyData.filter(h => h.destino === 'SOSFU').length
  const supridoCount = historyData.filter(h => h.destino === 'SUPRIDO').length

  return (
    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar animate-in fade-in pb-32">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Histórico de Tramitações</h1>
          <p className="text-sm text-slate-500 font-medium mt-1 flex items-center gap-2">
            <History size={16} className="text-blue-600" />
            Processos atestados e devolvidos
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2">
            <Printer size={16} /> Imprimir
          </button>
          <button 
            onClick={fetchHistory}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center gap-2"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div 
          onClick={() => setHistoryFilter(historyFilter === 'SOSFU' ? 'ALL' : 'SOSFU')}
          className={`p-6 rounded-[28px] border flex items-center justify-between cursor-pointer transition-all ${
            historyFilter === 'SOSFU'
              ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg'
              : 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
          }`}
        >
          <div>
            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${
              historyFilter === 'SOSFU' ? 'text-emerald-200' : 'text-emerald-600'
            }`}>
              Enviados para SOSFU
            </p>
            <p className={`text-3xl font-black ${
              historyFilter === 'SOSFU' ? 'text-white' : 'text-emerald-700'
            }`}>
              {sosfuCount}
            </p>
          </div>
          <div className={`p-4 rounded-2xl ${
            historyFilter === 'SOSFU' ? 'bg-emerald-500/30 text-white' : 'bg-emerald-100 text-emerald-600'
          }`}>
            <BadgeCheck size={24} />
          </div>
        </div>

        <div 
          onClick={() => setHistoryFilter(historyFilter === 'SUPRIDO' ? 'ALL' : 'SUPRIDO')}
          className={`p-6 rounded-[28px] border flex items-center justify-between cursor-pointer transition-all ${
            historyFilter === 'SUPRIDO'
              ? 'bg-red-600 border-red-600 text-white shadow-lg'
              : 'bg-red-50 border-red-200 hover:bg-red-100'
          }`}
        >
          <div>
            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${
              historyFilter === 'SUPRIDO' ? 'text-red-200' : 'text-red-600'
            }`}>
              Devolvidos ao Suprido
            </p>
            <p className={`text-3xl font-black ${
              historyFilter === 'SUPRIDO' ? 'text-white' : 'text-red-700'
            }`}>
              {supridoCount}
            </p>
          </div>
          <div className={`p-4 rounded-2xl ${
            historyFilter === 'SUPRIDO' ? 'bg-red-500/30 text-white' : 'bg-red-100 text-red-600'
          }`}>
            <ThumbsDown size={24} />
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
            Registro de Tramitações
          </h3>
        </div>

        {isLoading ? (
          <div className="p-20 text-center">
            <RefreshCw size={32} className="mx-auto text-blue-500 animate-spin mb-4" />
            <p className="text-sm text-slate-500">Carregando histórico...</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="p-20 text-center opacity-50">
            <History size={64} className="mx-auto text-slate-400 mb-4" />
            <p className="text-xl font-black text-slate-900">Sem Registros</p>
            <p className="text-sm text-slate-500">Nenhuma tramitação encontrada.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredHistory.map(h => (
              <div key={h.id} className="p-6 hover:bg-slate-50 transition-all">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${
                      h.destino === 'SOSFU' 
                        ? 'bg-emerald-50 text-emerald-600' 
                        : 'bg-red-50 text-red-600'
                    }`}>
                      {h.destino === 'SOSFU' ? <BadgeCheck size={20} /> : <ThumbsDown size={20} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase">
                          {h.nup}
                        </span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                          h.destino === 'SOSFU' 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {h.destino === 'SOSFU' ? 'ATESTADO' : 'DEVOLVIDO'}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">{h.tipo}</h4>
                      <p className="text-xs text-slate-500">{h.interessado}</p>
                      {h.observacao && (
                        <p className="text-xs text-slate-400 italic mt-2">"{h.observacao}"</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-800">{h.data}</p>
                    <p className="text-[10px] text-slate-400">{h.hora}</p>
                    <p className="text-sm font-black text-slate-700 mt-2">
                      {formatCurrency(h.valor)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
