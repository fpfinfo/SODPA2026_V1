'use client'

import React from 'react'
import { 
  Clock, 
  BadgeCheck, 
  ThumbsDown, 
  TrendingUp,
  RefreshCw
} from 'lucide-react'
import { useGestorProcesses, useGestorKPIs } from '../../../hooks/useGestorProcesses'

export function GestorDashboardView() {
  const { data: pendingProcesses = [], isLoading, refetch } = useGestorProcesses()
  const { data: kpis } = useGestorKPIs()
  
  const atestadosNoMes = kpis?.atestadosNoMes ?? 0
  const devolucoes = kpis?.devolucoes ?? 0
  const pendingCount = pendingProcesses.length

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  // Calculate total pending value
  const totalPendingValue = pendingProcesses.reduce((sum, p) => sum + (p.value || 0), 0)

  return (
    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar animate-in fade-in pb-32">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Painel do Gestor</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Homologação e controle de suprimentos da sua unidade
          </p>
        </div>
        <button 
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Pendentes de Atesto */}
        <div className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm hover:shadow-lg transition-all group cursor-pointer relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                <Clock size={20} />
              </div>
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider">Ação Necessária</span>
            </div>
            <p className="text-4xl font-black text-slate-800">{pendingCount}</p>
            <p className="text-xs font-medium text-slate-500 mt-1">Pendentes de Atesto</p>
          </div>
        </div>

        {/* Atestados no Mês */}
        <div className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm hover:shadow-lg transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                <BadgeCheck size={20} />
              </div>
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Este Mês</span>
            </div>
            <p className="text-4xl font-black text-slate-800">{atestadosNoMes}</p>
            <p className="text-xs font-medium text-slate-500 mt-1">Atestados</p>
          </div>
        </div>

        {/* Devoluções */}
        <div className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm hover:shadow-lg transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                <ThumbsDown size={20} />
              </div>
              <span className="text-[10px] font-black text-red-600 uppercase tracking-wider">Atenção</span>
            </div>
            <p className="text-4xl font-black text-slate-800">{devolucoes}</p>
            <p className="text-xs font-medium text-slate-500 mt-1">Devoluções</p>
          </div>
        </div>

        {/* Valor Total Pendente */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-[28px] shadow-xl hover:shadow-2xl transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/10 text-white rounded-xl">
                <TrendingUp size={20} />
              </div>
              <span className="text-[10px] font-black text-white/60 uppercase tracking-wider">Volume</span>
            </div>
            <p className="text-2xl font-black text-white">{formatCurrency(totalPendingValue)}</p>
            <p className="text-xs font-medium text-white/60 mt-1">Valor Total Pendente</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm">
        <h3 className="text-lg font-black text-slate-800 mb-6">Resumo da Unidade</h3>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw size={32} className="text-blue-500 animate-spin" />
          </div>
        ) : pendingCount === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <BadgeCheck size={40} className="text-emerald-500" />
            </div>
            <p className="text-xl font-black text-slate-900">Tudo Limpo!</p>
            <p className="text-sm text-slate-500 mt-2">Nenhuma solicitação pendente de atesto.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl">
              <p className="text-sm text-blue-800">
                <strong>{pendingCount} solicitaç{pendingCount === 1 ? 'ão' : 'ões'}</strong> aguardando seu atesto, 
                totalizando <strong>{formatCurrency(totalPendingValue)}</strong>.
              </p>
            </div>
            <p className="text-xs text-slate-500">
              Clique em "Caixa de Entrada" na navegação para ver os detalhes e aprovar.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
