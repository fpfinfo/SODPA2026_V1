
import React, { useMemo } from 'react';
import { Process, ProcessType } from '../types';
import { Inbox, DollarSign, AlertTriangle, TrendingUp } from 'lucide-react';

interface KPIHeaderProps {
  processes: Process[];
}

export const KPIHeader: React.FC<KPIHeaderProps> = ({ processes }) => {
  const stats = useMemo(() => {
    // Check if assignedToId exists safely
    const unassigned = processes.filter(p => !p.assignedToId).length;
    
    const concessionVolume = processes
      .filter(p => p.type === ProcessType.CONCESSION)
      .reduce((acc, curr) => acc + curr.value, 0);

    const accountVolume = processes
      .filter(p => p.type === ProcessType.ACCOUNTABILITY)
      .reduce((acc, curr) => acc + curr.value, 0);

    const slaAlerts = processes.filter(p => {
      // Safely handle optional slaDeadline using a fallback to avoid Invalid Date
      if (!p.slaDeadline) return false;
      const deadline = new Date(p.slaDeadline);
      const now = new Date();
      const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 2; // Alert if less than 2 days or negative
    }).length;

    return { unassigned, concessionVolume, accountVolume, slaAlerts };
  }, [processes]);

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Fila de Entrada</p>
          <h3 className="text-2xl font-bold text-slate-800">{stats.unassigned}</h3>
          <p className="text-xs text-slate-400">Processos sem dono</p>
        </div>
        <div className="p-3 bg-blue-50 rounded-full text-blue-600">
          <Inbox size={24} />
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Em Concessão</p>
          <h3 className="text-2xl font-bold text-emerald-600">{formatCurrency(stats.concessionVolume)}</h3>
          <p className="text-xs text-slate-400">Volume solicitante</p>
        </div>
        <div className="p-3 bg-emerald-50 rounded-full text-emerald-600">
          <TrendingUp size={24} />
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Em Prestação de Contas</p>
          <h3 className="text-2xl font-bold text-amber-600">{formatCurrency(stats.accountVolume)}</h3>
          <p className="text-xs text-slate-400">Volume em auditoria</p>
        </div>
        <div className="p-3 bg-amber-50 rounded-full text-amber-600">
          <DollarSign size={24} />
        </div>
      </div>

      <div className={`p-4 rounded-lg shadow-sm border flex items-center justify-between ${stats.slaAlerts > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
        <div>
          <p className={`text-sm font-medium ${stats.slaAlerts > 0 ? 'text-red-600' : 'text-slate-500'}`}>Alertas SLA</p>
          <h3 className={`text-2xl font-bold ${stats.slaAlerts > 0 ? 'text-red-700' : 'text-slate-800'}`}>{stats.slaAlerts}</h3>
          <p className={`text-xs ${stats.slaAlerts > 0 ? 'text-red-500' : 'text-slate-400'}`}>Prazos críticos</p>
        </div>
        <div className={`p-3 rounded-full ${stats.slaAlerts > 0 ? 'bg-red-100 text-red-600' : 'bg-slate-50 text-slate-400'}`}>
          <AlertTriangle size={24} />
        </div>
      </div>
    </div>
  );
};
