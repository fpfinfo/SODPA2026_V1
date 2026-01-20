'use client'

import React, { useState, useMemo } from 'react'
import { 
  DollarSign, 
  FileText, 
  Wallet, 
  TrendingUp, 
  CheckCircle2, 
  MapPin, 
  Users 
} from 'lucide-react'
import { useFinancialAnalytics } from '../../../hooks/useFinancialAnalytics'
import { UNIT_PTRES_MAP, BudgetUnit } from '../../../constants'

type GeoTab = 'COMARCA' | 'ENTRANCIA' | 'POLE' | 'REGION'

export function SefinIntelligenceView() {
  const { 
    budget,
    byElement,
    byType,
    byComarca, 
    byEntrancia, 
    byPole, 
    byRegion, 
    topSupridos,
    budgetAllocations = [],
    isLoading: loadingAnalytics 
  } = useFinancialAnalytics()

  const [analyticsFilter, setAnalyticsFilter] = useState<BudgetUnit | 'TODOS'>('TODOS')
  const [geoTab, setGeoTab] = useState<GeoTab>('COMARCA')

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  // Computed Budget Metrics based on filter
  // Falls back to aggregated solicitacoes data when budget_allocations is empty
  const filteredBudgetMetrics = useMemo(() => {
    // Se temos alocações, filtrar por PTRES
    if (budgetAllocations && budgetAllocations.length > 0) {
      let targetPtres: string[] = []
      if (analyticsFilter === 'TODOS') {
         targetPtres = Object.values(UNIT_PTRES_MAP).flat()
      } else {
         targetPtres = [...UNIT_PTRES_MAP[analyticsFilter]]
      }

      const relevantAllocations = budgetAllocations.filter(a => targetPtres.includes(a.ptres_code))
      
      const totalAllocated = relevantAllocations.reduce((acc, curr) => acc + curr.allocated_value, 0)
      const totalCommitted = relevantAllocations.reduce((acc, curr) => acc + curr.committed_value, 0)
      const available = totalAllocated - totalCommitted
      const percentageUsed = totalAllocated > 0 ? (totalCommitted / totalAllocated) * 100 : 0

      return { totalAllocated, totalCommitted, available, percentageUsed }
    }

    // FALLBACK: Usar dados agregados diretamente do budget (provenientes de solicitacoes)
    const totalAllocated = budget.total
    const totalCommitted = budget.executed
    const available = totalAllocated - totalCommitted
    const percentageUsed = totalAllocated > 0 ? (totalCommitted / totalAllocated) * 100 : 0

    return { totalAllocated, totalCommitted, available, percentageUsed }
  }, [budgetAllocations, analyticsFilter, budget])

  return (
    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar animate-in fade-in space-y-8 pb-32">
      
      {/* Header with Filter */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight">Visão Geral Orçamentária</h3>
          <p className="text-xs font-medium text-slate-500">Acompanhamento da execução financeira por unidade.</p>
        </div>
        <div className="bg-white p-1 rounded-xl border border-slate-200">
           <select 
              value={analyticsFilter}
              onChange={(e) => setAnalyticsFilter(e.target.value as any)}
              className="bg-transparent text-xs font-black uppercase tracking-widest text-slate-600 px-4 py-2 outline-none cursor-pointer hover:bg-slate-50 rounded-lg transition-colors"
           >
              <option value="TODOS">Todas as Unidades</option>
              <option value="SOSFU">SOSFU - Fundo Rotativo</option>
              <option value="COMIL">COMIL - Coordenadoria Militar</option>
              <option value="EJPA">EJPA - Escola Judicial</option>
              <option value="SETIC">SETIC - Informática</option>
           </select>
        </div>
      </div>

      {/* Budget Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Card 1: Dotação Atual (Azul) */}
        <div className="bg-white p-6 rounded-[24px] border border-blue-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><DollarSign size={64} className="text-blue-600"/></div>
          <div>
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Dotação Atual 2026</p>
            <h3 className="text-2xl font-black text-slate-800">
              {loadingAnalytics ? <span className="animate-pulse bg-slate-200 rounded h-8 w-32 inline-block"/> : formatCurrency(filteredBudgetMetrics.totalAllocated)}
            </h3>
          </div>
          <div className="mt-4">
             <div className="text-[10px] font-bold text-slate-400">Limite Aprovado LOA</div>
          </div>
        </div>

        {/* Card 2: Empenhado (Laranja) */}
        <div className="bg-white p-6 rounded-[24px] border border-amber-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><FileText size={64} className="text-amber-600"/></div>
          <div>
            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Valor Empenhado</p>
            <h3 className="text-2xl font-black text-slate-800">
              {loadingAnalytics ? <span className="animate-pulse bg-slate-200 rounded h-8 w-32 inline-block"/> : formatCurrency(filteredBudgetMetrics.totalCommitted)}
            </h3>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-[10px] font-bold mb-1">
              <span className="text-amber-600">{loadingAnalytics ? '...' : filteredBudgetMetrics.percentageUsed.toFixed(1)}% do Total</span>
            </div>
            <div className="w-full h-1.5 bg-amber-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-500 transition-all duration-1000 ease-out" 
                style={{ width: `${loadingAnalytics ? 0 : filteredBudgetMetrics.percentageUsed}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Card 3: Disponível (Verde) */}
        <div className="bg-slate-900 p-6 rounded-[24px] text-white shadow-xl flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><Wallet size={64}/></div>
          <div>
            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Saldo Disponível</p>
            <h3 className="text-3xl font-black">
              {loadingAnalytics ? <span className="animate-pulse bg-slate-700/50 rounded h-8 w-32 inline-block"/> : formatCurrency(filteredBudgetMetrics.available)}
            </h3>
          </div>
          <div className="mt-4">
             <div className="text-[10px] font-bold text-slate-400 flex items-center gap-2">
                <CheckCircle2 size={12} className="text-emerald-500"/> Livre para Execução
             </div>
          </div>
        </div>
        
        {/* Card 4: Executado */}
        <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><TrendingUp size={64}/></div>
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Liquidado / Pago</p>
                <h3 className="text-2xl font-black text-slate-800">{formatCurrency(budget.executed)}</h3> 
                {analyticsFilter !== 'TODOS' && <span className="text-[9px] text-red-400 font-bold block mt-1">*Valor Global (Sem Filtro)</span>}
             </div>
              <div className="mt-4">
                <div className="text-[10px] font-bold text-slate-400">Processado Financeiramente</div>
             </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Por Tipo de Suprimento</p>
          <div className="space-y-3">
            {loadingAnalytics ? (
              <div className="space-y-2 animate-pulse">
                {[1,2,3].map(i => <div key={i} className="h-4 bg-slate-100 rounded"/>)}
              </div>
            ) : (
              byType.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${item.color || 'bg-slate-400'}`}></div>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-700">{item.name}</span>
                      <span className="text-slate-500">{formatCurrency(item.value)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm col-span-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Por Elemento de Despesa</p>
          <div className="space-y-3">
            {loadingAnalytics ? (
              <div className="space-y-2 animate-pulse">
                {[1,2,3].map(i => <div key={i} className="h-4 bg-slate-100 rounded"/>)}
              </div>
            ) : (
              byElement.map((el, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-600">
                      <span className="font-mono text-slate-400 mr-2">{el.code}</span>
                      {el.name}
                    </span>
                    <span className="text-slate-800">{formatCurrency(el.value)}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                      style={{ width: `${el.percent}%` }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm col-span-2">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Distribuição Geográfica</p>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button onClick={() => setGeoTab('COMARCA')} className={`px-3 py-1 text-[10px] font-bold rounded ${geoTab === 'COMARCA' ? 'bg-white shadow text-slate-800' : 'text-slate-400'}`}>Comarca</button>
              <button onClick={() => setGeoTab('ENTRANCIA')} className={`px-3 py-1 text-[10px] font-bold rounded ${geoTab === 'ENTRANCIA' ? 'bg-white shadow text-slate-800' : 'text-slate-400'}`}>Entrância</button>
              <button onClick={() => setGeoTab('POLE')} className={`px-3 py-1 text-[10px] font-bold rounded ${geoTab === 'POLE' ? 'bg-white shadow text-slate-800' : 'text-slate-400'}`}>Pólo</button>
              <button onClick={() => setGeoTab('REGION')} className={`px-3 py-1 text-[10px] font-bold rounded ${geoTab === 'REGION' ? 'bg-white shadow text-slate-800' : 'text-slate-400'}`}>Região</button>
            </div>
          </div>
          <div className="space-y-3">
            {loadingAnalytics ? (
              <div className="space-y-4 p-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-4 animate-pulse">
                    <div className="w-4 h-4 bg-slate-200 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-2 bg-slate-200 rounded w-3/4" />
                      <div className="h-2 bg-slate-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
                (geoTab === 'COMARCA' ? byComarca : 
                  geoTab === 'ENTRANCIA' ? byEntrancia :
                  geoTab === 'POLE' ? byPole : 
                  byRegion).map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <MapPin size={14} className="text-slate-400"/>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-700">{item.name}</span>
                        <span className="text-slate-500">{formatCurrency(item.value)}</span>
                      </div>
                    </div>
                  </div>
                ))
            )}
            {!loadingAnalytics && (geoTab === 'COMARCA' ? byComarca : geoTab === 'ENTRANCIA' ? byEntrancia : geoTab === 'POLE' ? byPole : byRegion).length === 0 && (
               <div className="text-center py-6 text-slate-400 text-xs italic">Nenhum dado encontrado para esta visualização.</div>
            )}
          </div>
        </div>
        <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Users size={14}/> Top Supridos
          </p>
          <div className="space-y-4">
            {loadingAnalytics ? (
                <div className="space-y-4">
                    {[1,2,3].map(i => <div key={i} className="h-8 bg-slate-200 rounded animate-pulse"/>)}
                </div>
            ) : (
                topSupridos.map((sup, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-xs font-black text-slate-500">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-800">{sup.name}</p>
                      <p className="text-[10px] text-slate-400">{sup.role} - {sup.unit}</p>
                    </div>
                    <span className="text-xs font-black text-emerald-600">{formatCurrency(sup.value)}</span>
                  </div>
                ))
            )}
           </div>
        </div>
      </div>
    </div>
  )
}

export default SefinIntelligenceView
