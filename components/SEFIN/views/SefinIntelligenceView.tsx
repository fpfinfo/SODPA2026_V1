'use client'

import React, { useState, useMemo } from 'react'
import { 
  DollarSign, 
  FileText, 
  Wallet, 
  TrendingUp, 
  CheckCircle2, 
  MapPin, 
  Users,
  AlertTriangle,
  ArrowRight,
  Target
} from 'lucide-react'
import { useFinancialAnalytics } from '../../../hooks/useFinancialAnalytics'
import { UNIT_PTRES_MAP, BudgetUnit } from '../../../constants'
import { SefinGeoMap } from '../charts/SefinGeoMap'

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
  const [geoTab, setGeoTab] = useState<GeoTab>('POLE')

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  // Computed Budget Metrics based on filter
  const filteredBudgetMetrics = useMemo(() => {
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

      // Forecasting Logic
      const currentMonth = new Date().getMonth() + 1 // 1-12
      const projectedUsage = (totalCommitted / currentMonth) * 12
      const isOverBudgetRisk = projectedUsage > totalAllocated

      return { totalAllocated, totalCommitted, available, percentageUsed, projectedUsage, isOverBudgetRisk }
    }

    // FALLBACK
    const totalAllocated = budget.total
    const totalCommitted = budget.executed
    const available = totalAllocated - totalCommitted
    const percentageUsed = totalAllocated > 0 ? (totalCommitted / totalAllocated) * 100 : 0
    
    // Simple mock forecast
    const currentMonth = new Date().getMonth() + 1
    const projectedUsage = totalCommitted * (12 / currentMonth)
    const isOverBudgetRisk = projectedUsage > totalAllocated

    return { totalAllocated, totalCommitted, available, percentageUsed, projectedUsage, isOverBudgetRisk }
  }, [budgetAllocations, analyticsFilter, budget])

  // Geo Data for Map
  const geoMapData = useMemo(() => {
    let sourceData: any[] = []
    
    switch (geoTab) {
      case 'COMARCA': sourceData = byComarca; break;
      case 'ENTRANCIA': sourceData = byEntrancia; break;
      case 'POLE': sourceData = byPole; break;
      case 'REGION': sourceData = byRegion; break;
    }

    if (sourceData && sourceData.length > 0) {
      return sourceData.map(p => ({
        name: p.name,
        value: p.value,
        region: geoTab === 'POLE' ? 'Polo' : geoTab === 'REGION' ? 'Região' : 'Pará'
      }))
    }

    // Mock data if empty (Fallback)
    return [
      { name: 'Belém', value: 450000, region: 'Metropolitana' },
      { name: 'Santarém', value: 280000, region: 'Baixo Amazonas' },
      { name: 'Marabá', value: 320000, region: 'Sudeste' },
      { name: 'Altamira', value: 150000, region: 'Xingu' },
      { name: 'Castanhal', value: 180000, region: 'Nordeste' },
      { name: 'Redenção', value: 120000, region: 'Sul' },
      { name: 'Breves', value: 90000, region: 'Marajó' },
      { name: 'Itaituba', value: 110000, region: 'Tapajós' },
    ]
  }, [geoTab, byComarca, byEntrancia, byPole, byRegion])

  return (
    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar animate-in fade-in space-y-8 pb-32">
      
      {/* Header with Filter */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Target className="text-blue-600" size={24}/>
            Visão Geral Orçamentária
          </h3>
          <p className="text-xs font-medium text-slate-500">Acompanhamento da execução financeira e projeções para 2026.</p>
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

      {/* Alert Banner for Forecast */}
      {filteredBudgetMetrics.isOverBudgetRisk && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h4 className="font-bold text-amber-800 text-sm">Alerta de Previsão Orçamentária</h4>
                <p className="text-xs text-amber-700">
                  Neste ritmo, a dotação será insuficiente até o final do exercício. 
                  Projeção: <span className="font-bold">{formatCurrency(filteredBudgetMetrics.projectedUsage)}</span>
                </p>
              </div>
            </div>
            <button className="text-xs font-bold bg-amber-200 text-amber-800 px-3 py-1.5 rounded-lg hover:bg-amber-300 transition-colors">
              Ver Detalhes
            </button>
        </div>
      )}

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
        <div className="bg-slate-900 p-6 rounded-[24px] text-white shadow-xl flex flex-col justify-between relative overflow-hidden group hover:shadow-2xl transition-shadow">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Geo Distribution - Bubble Chart */}
        <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm lg:col-span-2">
           <div className="flex items-center justify-between mb-6">
             <h4 className="text-sm font-black text-slate-700 uppercase flex items-center gap-2">
               <MapPin size={16} /> Distribuição Geográfica de Gastos
             </h4>
             <div className="flex bg-slate-100 p-1 rounded-lg">
                {[
                  { id: 'COMARCA', label: 'Comarca' },
                  { id: 'ENTRANCIA', label: 'Entrância' },
                  { id: 'POLE', label: 'Polo' },
                  { id: 'REGION', label: 'Região' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setGeoTab(tab.id as GeoTab)}
                    className={`px-3 py-1 text-[10px] font-bold rounded transition-all ${
                      geoTab === tab.id 
                        ? 'bg-white shadow text-slate-800' 
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
             </div>
           </div>
           
           <SefinGeoMap data={geoMapData} height={320} />
        </div>

        {/* Elements List */}
        <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm flex flex-col">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Por Elemento de Despesa (Top 5)</p>
          <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
            {loadingAnalytics ? (
              <div className="space-y-2 animate-pulse">
                {[1,2,3].map(i => <div key={i} className="h-4 bg-slate-100 rounded"/>)}
              </div>
            ) : (
              byElement.slice(0, 8).map((el, i) => (
                <div key={i} className="group">
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-600 truncate max-w-[180px]" title={el.name}>
                      <span className="font-mono text-slate-400 mr-2">{el.code}</span>
                      {el.name}
                    </span>
                    <span className="text-slate-800">{formatCurrency(el.value)}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all duration-500 group-hover:bg-blue-600" 
                      style={{ width: `${el.percent}%` }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
          <button className="mt-4 w-full py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center gap-1">
            Ver Todos os Elementos <ArrowRight size={12}/>
          </button>
        </div>
      </div>
      
      {/* Top Supridos Row */}
      <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Users size={14}/> Ranking de Supridos (Maior Volume)
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loadingAnalytics ? (
                [1,2,3].map(i => <div key={i} className="h-12 bg-slate-100 rounded animate-pulse"/>)
            ) : (
                topSupridos.slice(0, 6).map((sup, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black ${i < 3 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{sup.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{sup.unit}</p>
                    </div>
                    <span className="text-xs font-black text-emerald-600 whitespace-nowrap">{formatCurrency(sup.value)}</span>
                  </div>
                ))
            )}
           </div>
        </div>
    </div>
  )
}

export default SefinIntelligenceView
