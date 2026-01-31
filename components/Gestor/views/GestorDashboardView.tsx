'use client'

import React from 'react'
import { 
  Clock, 
  BadgeCheck, 
  ThumbsDown, 
  TrendingUp,
  RefreshCw,
  Inbox,
  ArrowRight,
  Sparkles
} from 'lucide-react'
import { useGestorProcesses, useGestorKPIs } from '../../../hooks/useGestorProcesses'
import { TimelineRadar } from '../TimelineRadar'
import { useUserProfile } from '../../../hooks/useUserProfile'
import { useAuth } from '../../../lib/AuthContext'

export function GestorDashboardView() {
  const { data: pendingProcesses = [], isLoading, refetch } = useGestorProcesses()
  const { data: kpis } = useGestorKPIs()
  
  const atestadosNoMes = kpis?.atestadosNoMes ?? 0
  const devolucoes = kpis?.devolucoes ?? 0
  const pendingCount = pendingProcesses.length
  
  // Get user name for welcome card
  const { user } = useAuth()
  const { userProfile } = useUserProfile(user)
  const firstName = userProfile?.nome?.split(' ')[0] || 'Gestor'

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  // Calculate total pending value
  const totalPendingValue = pendingProcesses.reduce((sum, p) => sum + (p.val || 0), 0)

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

      {/* Welcome Card - Shows when there are pending items */}
      {pendingCount > 0 && (
        <div className="mb-6 bg-gradient-to-r from-indigo-600 via-blue-600 to-blue-700 p-6 rounded-[28px] shadow-xl relative overflow-hidden group">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <Sparkles className="absolute top-4 right-4 text-white/20" size={32} />
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <span className="text-2xl">👋</span>
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Olá, {firstName}!</h2>
                <p className="text-blue-100 text-sm font-medium mt-0.5">
                  Você tem <span className="font-black text-white">{pendingCount} solicitaç{pendingCount === 1 ? 'ão' : 'ões'}</span> aguardando seu atesto.
                </p>
              </div>
            </div>
            <button 
              onClick={() => {
                // Navigate to inbox - find and click the inbox tab
                const inboxBtn = document.querySelector('[data-view="inbox"]') as HTMLButtonElement;
                if (inboxBtn) inboxBtn.click();
              }}
              className="flex items-center gap-2 px-6 py-3 bg-white text-blue-700 rounded-xl font-black text-sm hover:bg-blue-50 shadow-lg transition-all transform hover:scale-105 active:scale-95"
            >
              <Inbox size={18} />
              Ir para Caixa de Entrada
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      )}

      {/* Radar de Prazos */}
      <TimelineRadar />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Pendentes de Atesto */}
        <div className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-600 opacity-10 rounded-bl-[80px] pointer-events-none transition-opacity group-hover:opacity-20" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-100 transition-colors">
                <Clock size={24} strokeWidth={2} />
              </div>
              <span className="text-[10px] font-black text-blue-600/80 uppercase tracking-widest">Ação Necessária</span>
            </div>
            <p className="text-4xl font-black text-slate-800 tracking-tighter loading-none">{pendingCount}</p>
            <p className="text-xs font-bold text-blue-600/80 mt-1 uppercase tracking-wide">Pendentes de Atesto</p>
          </div>
        </div>

        {/* Atestados no Mês */}
        <div className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500 to-teal-600 opacity-10 rounded-bl-[80px] pointer-events-none transition-opacity group-hover:opacity-20" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-100 transition-colors">
                <BadgeCheck size={24} strokeWidth={2} />
              </div>
              <span className="text-[10px] font-black text-emerald-600/80 uppercase tracking-widest">Este Mês</span>
            </div>
            <p className="text-4xl font-black text-slate-800 tracking-tighter loading-none">{atestadosNoMes}</p>
            <p className="text-xs font-bold text-emerald-600/80 mt-1 uppercase tracking-wide">Atestados Enviados</p>
          </div>
        </div>

        {/* Devoluções */}
        <div className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-500 to-rose-600 opacity-10 rounded-bl-[80px] pointer-events-none transition-opacity group-hover:opacity-20" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-50 text-red-600 rounded-xl group-hover:bg-red-100 transition-colors">
                <ThumbsDown size={24} strokeWidth={2} />
              </div>
              <span className="text-[10px] font-black text-red-600/80 uppercase tracking-widest">Atenção</span>
            </div>
            <p className="text-4xl font-black text-slate-800 tracking-tighter loading-none">{devolucoes}</p>
            <p className="text-xs font-bold text-red-600/80 mt-1 uppercase tracking-wide">Devoluções</p>
          </div>
        </div>

        {/* Valor Total Pendente */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-950 p-6 rounded-[28px] shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all group relative overflow-hidden text-white">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-[0.03] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/10 text-white rounded-xl backdrop-blur-sm">
                <TrendingUp size={24} strokeWidth={2} />
              </div>
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Financeiro</span>
            </div>
            <p className="text-3xl font-black tracking-tighter loading-none">{formatCurrency(totalPendingValue)}</p>
            <p className="text-xs font-bold text-white/40 mt-1 uppercase tracking-wide">Total Pendente</p>
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
