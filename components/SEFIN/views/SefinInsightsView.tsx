'use client'

import React, { useEffect, useState } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  Clock,
  CheckCircle2,
  Calendar,
  Users,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  Wallet,
  Building2,
  AlertTriangle,
  Lightbulb,
  RefreshCw,
  Sparkles
} from 'lucide-react'
import { useSefinCockpit } from '../../../hooks/useSefinCockpit'
import { BudgetExecutionChart, SpendingTrendChart } from '../charts/SefinFinancialCharts'
import { supabase } from '../../../lib/supabaseClient'

// Stat Card
interface StatCardProps {
  title: string
  value: string | number
  change?: { value: number; isPositive: boolean }
  icon: React.ReactNode
  color?: string
}

function StatCard({ title, value, change, icon, color = 'bg-white' }: StatCardProps) {
  return (
    <div className={`${color} rounded-xl border border-slate-200 p-4 shadow-sm relative overflow-hidden`}>
      <div className="flex items-start justify-between mb-3 relative z-10">
        <div className="p-2 rounded-lg bg-slate-100/50 backdrop-blur-sm">
          {icon}
        </div>
        {change && (
          <div className={`flex items-center gap-1 text-sm font-medium ${
            change.isPositive ? 'text-emerald-600' : 'text-red-600'
          } bg-white/50 px-2 py-0.5 rounded-full`}>
            {change.isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(change.value)}%
          </div>
        )}
      </div>

      <div className="text-2xl font-bold text-slate-800 mb-1 relative z-10">{value}</div>
      <div className="text-sm text-slate-500 relative z-10">{title}</div>
      
      {/* Decorative background circle */}
      <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-slate-50 opacity-50 z-0" />
    </div>
  )
}

interface AIAlert {
  insight_type: string
  severity: 'CRITICAL' | 'WARNING' | 'INFO'
  title: string
  description: string
  metric_value: number
}

export function SefinInsightsView() {
  const { tasks, kpis, isLoading } = useSefinCockpit({ autoRefresh: false })
  const [budgetData, setBudgetData] = useState<any[]>([])
  const [cashFlowData, setCashFlowData] = useState<any[]>([])
  const [aiAlerts, setAiAlerts] = useState<AIAlert[]>([])
  const [loadingCharts, setLoadingCharts] = useState(true)
  const [loadingAI, setLoadingAI] = useState(true)

  const fetchChartData = async () => {
    try {
      setLoadingCharts(true)
      // Fetch Location Stats
      const { data: locStats } = await supabase.from('v_finance_location_stats').select('*').limit(6);
      if (locStats) {
         setBudgetData(locStats.map(item => ({
           label: item.location,
           budget: (item.executed_value || 0) * 1.5,
           actual: item.executed_value || 0
         })));
      }

      // Fetch Daily Flow
      const { data: flowStats } = await supabase.from('v_finance_daily_flow').select('*').order('date', { ascending: true }).limit(30);
      if (flowStats) {
        setCashFlowData(flowStats.map(item => ({
          date: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          value: item.total_value
        })));
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoadingCharts(false);
    }
  };

  const fetchAIInsights = async () => {
     try {
        setLoadingAI(true)
        const { data: insights, error: aiError } = await supabase.rpc('get_sefin_ai_insights');
        if (!aiError && insights) {
           setAiAlerts(insights);
        } else {
           console.error("AI RPC Failed:", aiError)
        }
     } catch (err) {
        console.error("AI Fetch Error:", err)
     } finally {
        setLoadingAI(false)
     }
  }

  // Initial Fetch
  useEffect(() => {
    fetchChartData();
    fetchAIInsights();
  },[]);

  // Calculate additional metrics
  const signedTotal = tasks.filter(t => t.status === 'SIGNED').length
  const returnedTotal = tasks.filter(t => t.status === 'REJECTED').length
  const returnRate = tasks.length > 0 ? Math.round((returnedTotal / tasks.length) * 100) : 0

  // Document type breakdown
  const typeBreakdown = [
    { type: 'Portarias', count: tasks.filter(t => t.tipo === 'PORTARIA').length, color: 'bg-purple-500' },
    { type: 'Certidões', count: tasks.filter(t => t.tipo === 'CERTIDAO_REGULARIDADE').length, color: 'bg-blue-500' },
    { type: 'Notas Empenho', count: tasks.filter(t => t.tipo === 'NOTA_EMPENHO').length, color: 'bg-emerald-500' },
    { type: 'Liquidações', count: tasks.filter(t => t.tipo === 'NOTA_LIQUIDACAO').length, color: 'bg-amber-500' },
    { type: 'Ordens Bancárias', count: tasks.filter(t => t.tipo === 'ORDEM_BANCARIA').length, color: 'bg-indigo-500' }
  ]

  const totalDocs = typeBreakdown.reduce((acc, t) => acc + t.count, 0) || 1

  if (isLoading && loadingCharts && loadingAI) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    )
  }

  // Use the most critical insight for the main banner
  const mainInsight = aiAlerts.find(a => a.severity === 'CRITICAL') || aiAlerts.find(a => a.severity === 'WARNING') || aiAlerts[0];

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
           <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
             <TrendingUp className="text-amber-500" size={28} />
             Centro de Inteligência Financeira
           </h2>
           <p className="text-slate-500 font-medium">Análise em tempo real da execução orçamentária e fluxo de processos</p>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          {['7D', '30D', '90D', '2026'].map(period => (
            <button
              key={period}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                period === '30D'
                  ? 'bg-white text-amber-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {period}
            </button>
          ))}
          <button 
            onClick={() => { fetchChartData(); fetchAIInsights(); }}
            className="p-2 text-slate-500 hover:text-amber-600 hover:bg-white rounded-lg transition-colors ml-2"
            title="Atualizar Dados"
          >
             <RefreshCw size={16} className={loadingAI ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Executado no Período"
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
             cashFlowData.reduce((acc, curr) => acc + curr.value, 0) || 0
          )}
          change={{ value: 12, isPositive: true }}
          icon={<Wallet size={20} className="text-emerald-600" />}
          color="bg-emerald-50/50 border-emerald-100"
        />
        <StatCard
          title="Processos Assinados"
          value={signedTotal}
          change={{ value: 8, isPositive: true }}
          icon={<CheckCircle2 size={20} className="text-blue-600" />}
        />
        <StatCard
          title="Tempo Médio (SLA)"
          value={`${kpis.avgSignTime}h`}
          change={{ value: 5, isPositive: false }}
          icon={<Clock size={20} className="text-amber-600" />}
        />
        <StatCard
          title="Taxa de Devolução"
          value={`${returnRate}%`}
          change={{ value: 2, isPositive: false }}
          icon={<RotateCcw size={20} className="text-red-600" />}
          color="bg-red-50/50 border-red-100"
        />
      </div>

      {/* Financial Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Budget Execution Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Building2 size={20} className="text-slate-400" />
              Execução Orçamentária por Lotação (Top 6)
            </h3>
            <div className="flex items-center gap-3 text-xs font-medium">
               <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-300"></div> Estimado</span>
               <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Executado</span>
            </div>
          </div>
          <BudgetExecutionChart data={budgetData.length > 0 ? budgetData : [{ label: 'Sem dados', budget: 0, actual: 0 }]} height={280} />
        </div>

        {/* Breakdown Donut & Types */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
           <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
              <PieChart size={20} className="text-slate-400" />
              Volume por Tipo
            </h3>
            
            <div className="flex-1 flex flex-col justify-center gap-4">
              {typeBreakdown.map(item => (
                <div key={item.type} className="group">
                  <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                    <span>{item.type}</span>
                    <span className="text-slate-900">{item.count}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                     <div 
                        className={`h-full ${item.color} rounded-full transition-all duration-1000 group-hover:opacity-80`}
                        style={{ width: `${(item.count / totalDocs) * 100}%` }}
                     />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                <p className="text-3xl font-black text-slate-800">{totalDocs}</p>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Documentos Processados</p>
            </div>
        </div>
      </div>

      {/* Cash Flow Trend */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
         <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp size={20} className="text-amber-500" />
              Tendência de Liberação de Recursos (Últimos 30 Dias)
            </h3>
            <button className="text-xs font-bold text-amber-600 hover:text-amber-700 hover:bg-amber-50 px-3 py-1 rounded-lg transition-colors">
              Ver Relatório Detalhado
            </button>
         </div>
         <SpendingTrendChart data={cashFlowData.length > 0 ? cashFlowData : [{ date: 'Hoje', value: 0 }]} height={240} />
      </div>

      {/* Real AI Insights Banner - Fully Dynamic */}
      <div className="min-h-[120px]">
        {loadingAI ? (
            <div className="w-full bg-white border border-slate-200 rounded-2xl p-6 flex items-center justify-center gap-3 animate-pulse">
                <Sparkles className="animate-spin text-amber-500" size={20} />
                <span className="text-sm font-medium text-slate-500">Processando Inteligência Artificial...</span>
            </div>
        ) : mainInsight ? (
            <div className={`rounded-2xl p-6 text-white shadow-lg flex items-start gap-4 animate-in slide-in-from-bottom-5 duration-700 ${
            mainInsight.severity === 'CRITICAL' ? 'bg-gradient-to-r from-red-900 to-red-800' : 
            mainInsight.severity === 'WARNING' ? 'bg-gradient-to-r from-amber-600 to-orange-700' :
            'bg-gradient-to-r from-slate-900 to-slate-800'
            }`}>
            <div className={`p-3 rounded-xl ${
                mainInsight.severity === 'CRITICAL' ? 'bg-red-500/20' : 
                mainInsight.severity === 'WARNING' ? 'bg-amber-400/20' :
                'bg-white/10'
            }`}>
                {mainInsight.severity === 'CRITICAL' ? <AlertTriangle size={24} className="text-white" /> : 
                mainInsight.severity === 'WARNING' ? <AlertTriangle size={24} className="text-white" /> :
                <Lightbulb size={24} className="text-amber-400" />}
            </div>
            <div className="flex-1">
                <h4 className="font-bold text-lg mb-1 flex items-center gap-2">
                    Análise de Inteligência Artificial
                    {mainInsight.severity !== 'INFO' && (
                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wider">{mainInsight.severity === 'CRITICAL' ? 'Crítico' : 'Atenção'}</span>
                    )}
                </h4>
                <p className="text-white/90 text-sm leading-relaxed max-w-3xl">
                    {mainInsight.description}
                </p>
            </div>
            <button className="px-5 py-2.5 bg-white text-slate-900 rounded-xl text-sm font-bold hover:bg-white/90 transition-colors shadow-sm whitespace-nowrap">
                Ver Recomendações
            </button>
            </div>
        ) : (
            <div className="w-full bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-2">
                <p className="text-sm font-medium text-slate-500">Nenhum insight disponível no momento.</p>
                <button onClick={fetchAIInsights} className="text-xs text-blue-600 hover:underline">Tentar novamente</button>
            </div>
        )}
      </div>
    </div>
  )
}

function RotateCcw({ size, className }: { size: number, className: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 12"/><path d="M3 3v9h9"/></svg>
    )
}

export default SefinInsightsView
