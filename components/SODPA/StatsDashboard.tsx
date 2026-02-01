// ============================================================================
// StatsDashboard - Dashboard component for displaying SODPA statistics
// Used by managers to track performance and volume metrics
// ============================================================================

import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Calendar,
  Plane,
  MapPin,
  DollarSign,
  Target,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { useSODPAStats } from '../../hooks/useSODPAStats';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  trend?: number;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, color, trend }) => (
  <div className={`bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow`}>
    <div className="flex items-start justify-between mb-3">
      <div className={`p-2.5 rounded-xl ${color}`}>
        {icon}
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-bold ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <div className="text-2xl font-bold text-gray-900">{value}</div>
    <div className="text-xs text-gray-500 mt-1">{title}</div>
    {subtitle && <div className="text-[10px] text-gray-400 mt-0.5">{subtitle}</div>}
  </div>
);

const ProgressBar: React.FC<{ value: number; max: number; color: string; label?: string }> = ({ 
  value, max, color, label 
}) => {
  const percent = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      {label && (
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">{label}</span>
          <span className="font-bold text-gray-700">{value}/{max}</span>
        </div>
      )}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} rounded-full transition-all duration-500`} 
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

export const StatsDashboard: React.FC = () => {
  const { 
    stats, 
    topLocations, 
    isLoading, 
    totalActive, 
    slaCompliancePercent,
    refresh 
  } = useSODPAStats();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-100 h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-100 h-48 rounded-xl" />
          <div className="bg-gray-100 h-48 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-gray-400">
        <BarChart3 size={48} className="mx-auto mb-4 opacity-30" />
        <p>Nenhum dado disponível</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <BarChart3 size={20} className="text-blue-600" />
          Estatísticas SODPA
        </h2>
        <button
          onClick={refresh}
          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Atualizar estatísticas"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Pendentes"
          value={stats.totalPendente}
          icon={<Clock size={18} className="text-amber-600" />}
          color="bg-amber-50"
        />
        <StatCard
          title="Em Análise"
          value={stats.totalEmAnalise}
          icon={<Target size={18} className="text-blue-600" />}
          color="bg-blue-50"
        />
        <StatCard
          title="Aprovados"
          value={stats.totalAprovados}
          icon={<CheckCircle size={18} className="text-green-600" />}
          color="bg-green-50"
        />
        <StatCard
          title="Devolvidos"
          value={stats.totalDevolvidos}
          icon={<RotateCcw size={18} className="text-red-600" />}
          color="bg-red-50"
        />
      </div>

      {/* Secondary metrics row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Este Mês"
          value={stats.totalThisMonth}
          subtitle="novas solicitações"
          icon={<Calendar size={18} className="text-indigo-600" />}
          color="bg-indigo-50"
          trend={stats.growthPercent}
        />
        <StatCard
          title="Tempo Médio"
          value={`${stats.avgProcessingDays} dias`}
          subtitle="para conclusão"
          icon={<Clock size={18} className="text-purple-600" />}
          color="bg-purple-50"
        />
        <StatCard
          title="Diárias"
          value={stats.countDiarias}
          icon={<Calendar size={18} className="text-cyan-600" />}
          color="bg-cyan-50"
        />
        <StatCard
          title="Passagens"
          value={stats.countPassagens}
          icon={<Plane size={18} className="text-sky-600" />}
          color="bg-sky-50"
        />
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SLA and Value Summary */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-700 flex items-center gap-2">
            <Target size={16} className="text-blue-600" />
            Desempenho
          </h3>

          <div className="space-y-4">
            <ProgressBar
              value={stats.withinSLA}
              max={stats.withinSLA + stats.overdueSLA}
              color="bg-green-500"
              label="Dentro do SLA (5 dias)"
            />

            <div className="flex items-center justify-between py-3 border-t border-gray-100">
              <span className="text-sm text-gray-600">Conformidade SLA</span>
              <span className={`text-lg font-bold ${slaCompliancePercent >= 80 ? 'text-green-600' : slaCompliancePercent >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                {slaCompliancePercent}%
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
              <div className="text-center p-3 bg-amber-50 rounded-lg">
                <div className="text-lg font-bold text-amber-600">
                  {formatCurrency(stats.totalValuePending)}
                </div>
                <div className="text-[10px] text-amber-500 uppercase font-bold">Valor Pendente</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">
                  {formatCurrency(stats.totalValueApproved)}
                </div>
                <div className="text-[10px] text-green-500 uppercase font-bold">Valor Aprovado</div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Locations */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <h3 className="font-bold text-gray-700 flex items-center gap-2 mb-4">
            <MapPin size={16} className="text-indigo-600" />
            Top Municípios
          </h3>

          <div className="space-y-2">
            {topLocations.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Nenhum dado disponível</p>
            ) : (
              topLocations.slice(0, 5).map((loc, idx) => (
                <div 
                  key={loc.municipio}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      idx === 0 ? 'bg-amber-100 text-amber-600' :
                      idx === 1 ? 'bg-gray-100 text-gray-600' :
                      idx === 2 ? 'bg-orange-100 text-orange-600' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-700 truncate max-w-[120px]">
                      {loc.municipio}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-800">{loc.count}</span>
                    <span className="text-xs text-gray-400 ml-1">proc.</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsDashboard;
