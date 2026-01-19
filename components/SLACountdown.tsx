import React from 'react';
import { Clock, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import { useSLAMonitor, SLAStatus } from '../hooks/useSLAMonitor';

interface SLACountdownProps {
  createdAt: string;
  deadline: string;
  className?: string;
}

const SLA_CONFIG: Record<SLAStatus, { color: string; icon: any; label: string; bgClass: string; textClass: string; borderClass: string }> = {
  NORMAL: { 
    color: 'emerald', 
    icon: CheckCircle, 
    label: 'No prazo',
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-700',
    borderClass: 'border-emerald-200'
  },
  WARNING: { 
    color: 'amber', 
    icon: AlertTriangle, 
    label: 'Atenção',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-700',
    borderClass: 'border-amber-300'
  },
  CRITICAL: { 
    color: 'red', 
    icon: AlertCircle, 
    label: 'URGENTE',
    bgClass: 'bg-red-50',
    textClass: 'text-red-700',
    borderClass: 'border-red-300'
  },
  OVERDUE: { 
    color: 'red', 
    icon: AlertCircle, 
    label: 'VENCIDO',
    bgClass: 'bg-red-100',
    textClass: 'text-red-700',
    borderClass: 'border-red-400'
  }
};

export const SLACountdown: React.FC<SLACountdownProps> = ({ 
  createdAt, 
  deadline,
  className = '' 
}) => {
  const sla = useSLAMonitor(createdAt, deadline);

  if (!sla) return null;

  const config = SLA_CONFIG[sla.status];
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 ${config.bgClass} ${config.borderClass} ${className}`}>
      <Icon className={`w-5 h-5 ${config.textClass} ${sla.status === 'CRITICAL' || sla.status === 'OVERDUE' ? 'animate-pulse' : ''}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-bold ${config.textClass}`}>
          SLA: {config.label}
        </p>
        {sla.status !== 'OVERDUE' ? (
          <p className="text-[10px] text-slate-600 font-mono mt-0.5">
            ⏱️ Restam <span className="font-bold">{sla.timeRemaining.days}d {sla.timeRemaining.hours}h {sla.timeRemaining.minutes}min</span>
          </p>
        ) : (
          <p className="text-[10px] text-red-600 font-bold mt-0.5">
            ⚠️ Vencido há {Math.abs(sla.timeRemaining.days)}d {Math.abs(sla.timeRemaining.hours)}h
          </p>
        )}
      </div>
      <div className="text-right">
        <p className={`text-sm font-mono font-bold ${config.textClass}`}>
          {sla.percentageElapsed.toFixed(0)}%
        </p>
        <p className="text-[9px] text-slate-500">decorrido</p>
      </div>
    </div>
  );
};
