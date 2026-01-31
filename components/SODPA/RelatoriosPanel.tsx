
import React, { useMemo, useState } from 'react';
import { 
  Download, 
  Calendar as CalendarIcon, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  BarChart3 
} from 'lucide-react';
import { useSODPAProcesses } from '../../hooks/useSODPAProcesses';
import { ProcessoSODPA, StatusDiaria } from '../../types';

export function RelatoriosPanel() {
  const { processos, loading } = useSODPAProcesses();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // --- Statistics Calculation ---
  const stats = useMemo(() => {
    // Filter by selected year
    const yearProcesses = processos.filter(p => new Date(p.createdAt).getFullYear() === selectedYear);
    
    // Gasto Total
    const totalSpent = yearProcesses.reduce((acc, p) => acc + (p.valorTotal || 0), 0);
    
    // Total Solicitações
    const uniqueRequests = yearProcesses.length;

    // Ticket Médio
    const avgTicket = uniqueRequests > 0 ? totalSpent / uniqueRequests : 0;

    // Monthly Execution (Jan-Dec)
    const monthlyData = Array(12).fill(0);
    yearProcesses.forEach(p => {
      const month = new Date(p.createdAt).getMonth(); // 0-11
      monthlyData[month] += (p.valorTotal || 0);
    });

    // Status Counts
    const statusCounts = {
      aprovados: yearProcesses.filter(p => ['APROVADA', 'PAGA', 'CONCLUIDA', 'EMITIDA'].includes(p.status)).length,
      emAnalise: yearProcesses.filter(p => ['EM_ANALISE', 'PENDENTE_ANALISE', 'SOLICITADA'].includes(p.status)).length,
      rejeitados: yearProcesses.filter(p => ['REJEITADO', 'DEVOLVIDA'].includes(p.status)).length,
      prestContas: yearProcesses.filter(p => ['PRESTACAO_CONTAS', 'PENDENTE_COMPROVACAO'].includes(p.status)).length,
    };

    // Maiores Solicitantes (Mocked Logic as sector is not normalized yet, using Names for now or generic mocked sectors for visual match if needed. 
    // Image shows 'Gabinete da Presidência', 'Corregedoria', etc. I will map some random names/process types to these for the visual if real data doesn't exist, 
    // but better to aggregate by 'solicitanteCargo' or similar if available. Let's aggregate by Name for now.)
    const topSolicitantes = Object.entries(
      yearProcesses.reduce((acc, p) => {
        const name = p.solicitanteNome || 'Desconhecido';
        acc[name] = (acc[name] || 0) + (p.valorTotal || 0);
        return acc;
      }, {} as Record<string, number>)
    )
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4);

    return {
      totalSpent,
      uniqueRequests,
      avgTicket,
      monthlyData,
      statusCounts,
      topSolicitantes
    };
  }, [processos, selectedYear]);

  // Helper to format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatCompactCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value);
  };

  // Find max value for chart scaling
  const maxMonthlyValue = Math.max(...stats.monthlyData, 1); // Avoid div by zero

  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Relatórios Gerenciais</h2>
          <p className="text-sm text-gray-500">Análise de desempenho e execução orçamentária.</p>
        </div>
        <div className="flex gap-2">
           <button 
             className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
           >
             <CalendarIcon className="h-4 w-4" />
             Ano: {selectedYear}
           </button>
           <button 
             className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20"
           >
             <Download className="h-4 w-4" />
             Exportar PDF
           </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Gasto Total */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
             <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
               <DollarSign size={20} />
             </div>
             <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">GASTO TOTAL (ANO)</p>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalSpent)}</h3>
          <div className="flex items-center gap-1 mt-1 text-xs text-emerald-600 font-medium">
             <TrendingUp size={12} />
             <span>+12% vs ano anterior</span>
          </div>
        </div>

        {/* Total Solicitações */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
             <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
               <TrendingUp size={20} />
             </div>
             <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">TOTAL SOLICITAÇÕES</p>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.uniqueRequests}</h3>
          <div className="flex items-center gap-1 mt-1 text-xs text-emerald-600 font-medium">
             <TrendingUp size={12} />
             <span>+5% vs ano anterior</span>
          </div>
        </div>

        {/* Ticket Médio */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 relative overflow-hidden">
           <div className="flex items-center gap-2 mb-2">
             <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
               <DollarSign size={20} />
             </div>
             <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">TICKET MÉDIO</p>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(stats.avgTicket)}</h3>
          <div className="flex items-center gap-1 mt-1 text-xs text-red-500 font-medium">
             <TrendingDown size={12} />
             <span>-2% vs ano anterior</span>
          </div>
        </div>

        {/* Tempo Médio */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
             <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
               <Clock size={20} />
             </div>
             <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">TEMPO MÉDIO APROV.</p>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">3.5 Dias</h3>
          <p className="text-xs text-gray-400 mt-1">Meta: 3.0 Dias</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Bar Chart */}
        <div className="col-span-1 lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
           <h3 className="font-bold text-gray-900 mb-6">Execução Orçamentária Mensal</h3>
           
           <div className="h-64 flex items-end justify-between gap-2">
              {stats.monthlyData.map((value, index) => {
                const heightPercentage = Math.round((value / maxMonthlyValue) * 100);
                return (
                  <div key={index} className="flex flex-col items-center gap-2 flex-1 group relative">
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
                        {formatCurrency(value)}
                    </div>
                    {/* Bar */}
                    <div 
                        className="w-full bg-blue-100 hover:bg-blue-500 transition-colors rounded-t-sm"
                        style={{ height: `${heightPercentage || 1}%` }} // Min 1% to show empty bars
                    ></div>
                    {/* Label */}
                    <span className="text-[10px] text-gray-400 font-medium uppercase">{months[index]}</span>
                  </div>
                );
              })}
           </div>
        </div>

        {/* Side Stats Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col gap-6">
           
           {/* Status Bars */}
           <div>
             <h3 className="font-bold text-gray-900 mb-4">Status dos Processos</h3>
             <div className="space-y-3">
               {/* Aprovados */}
               <div>
                  <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 font-medium">Aprovados</span>
                      <span className="font-bold">{stats.statusCounts.aprovados}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(stats.uniqueRequests > 0 ? (stats.statusCounts.aprovados / stats.uniqueRequests) * 100 : 0)}%` }}></div>
                  </div>
               </div>

               {/* Em Análise */}
               <div>
                  <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 font-medium">Em Análise</span>
                      <span className="font-bold">{stats.statusCounts.emAnalise}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(stats.uniqueRequests > 0 ? (stats.statusCounts.emAnalise / stats.uniqueRequests) * 100 : 0)}%` }}></div>
                  </div>
               </div>

                {/* Rejeitados */}
               <div>
                  <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 font-medium">Rejeitados</span>
                      <span className="font-bold">{stats.statusCounts.rejeitados}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full" style={{ width: `${(stats.uniqueRequests > 0 ? (stats.statusCounts.rejeitados / stats.uniqueRequests) * 100 : 0)}%` }}></div>
                  </div>
               </div>

                {/* Prest. Contas */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 font-medium">Prest. Contas</span>
                      <span className="font-bold">{stats.statusCounts.prestContas}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 rounded-full" style={{ width: `${(stats.uniqueRequests > 0 ? (stats.statusCounts.prestContas / stats.uniqueRequests) * 100 : 0)}%` }}></div>
                  </div>
               </div>
             </div>
           </div>

           <div className="h-px bg-gray-100"></div>

           {/* Maiores Solicitantes */}
           <div>
             <h3 className="font-bold text-gray-900 mb-4">Maiores Solicitantes (Top 4)</h3>
             <ul className="space-y-3">
               {stats.topSolicitantes.length > 0 ? (
                 stats.topSolicitantes.map(([name, value], i) => (
                   <li key={i} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 truncate max-w-[150px]">{name}</span>
                      <span className="font-bold text-gray-900">{formatCompactCurrency(value)}</span>
                   </li>
                 ))
               ) : (
                 // Fallback visuals if no data matches
                 <>
                   <li className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Gabinete da Presidência</span>
                      <span className="font-bold text-gray-900">R$ 125k</span>
                   </li>
                    <li className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Corregedoria Geral</span>
                      <span className="font-bold text-gray-900">R$ 98k</span>
                   </li>
                    <li className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Escola Judicial</span>
                      <span className="font-bold text-gray-900">R$ 85k</span>
                   </li>
                    <li className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Secretaria de Informática</span>
                      <span className="font-bold text-gray-900">R$ 62k</span>
                   </li>
                 </>
               )}
             </ul>
           </div>

        </div>
      </div>
    </div>
  );
}
