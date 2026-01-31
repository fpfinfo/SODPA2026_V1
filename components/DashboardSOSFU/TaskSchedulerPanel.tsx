import React, { useMemo, useState } from 'react';
import { 
  Calendar, 
  ChevronDown, 
  ChevronRight,
  Clock,
  AlertCircle,
  CheckCircle2,
  Inbox
} from 'lucide-react';
import { TaskSchedulerCard } from './TaskSchedulerCard';
import { WorkloadCapacityIndicator } from './WorkloadCapacityIndicator';

interface Process {
  id: string;
  nup: string;
  tipo: string;
  valor_total?: number;
  suprido_nome?: string;
  status?: string;
  data_planejada?: string | null;
  prioridade_usuario?: number;
  notas_planejamento?: string;
}

interface TaskSchedulerPanelProps {
  processes: Process[];
  capacity: number;
  onSchedule: (processId: string, date: string | null, priority?: number, notes?: string) => Promise<void>;
  onViewDetails: (processId: string) => void;
  onCapacityChange?: (newCapacity: number) => Promise<void>;
  onAdjustQty?: (processId: string) => void;
}

interface DateGroup {
  key: string;
  label: string;
  dateStr: string | null;
  processes: Process[];
  icon: React.ReactNode;
  color: string;
}

export const TaskSchedulerPanel: React.FC<TaskSchedulerPanelProps> = ({
  processes,
  capacity,
  onSchedule,
  onViewDetails,
  onCapacityChange,
  onAdjustQty,
}) => {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Group processes by scheduled date
  const dateGroups = useMemo((): DateGroup[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const endOfWeek = new Date(today);
    endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));
    const endOfWeekStr = endOfWeek.toISOString().split('T')[0];

    // Initialize groups
    const unscheduled: Process[] = [];
    const todayProcesses: Process[] = [];
    const tomorrowProcesses: Process[] = [];
    const thisWeekProcesses: Process[] = [];
    const futureProcesses: Process[] = [];
    const overdueProcesses: Process[] = [];

    // Sort processes into groups
    processes.forEach(p => {
      if (!p.data_planejada) {
        unscheduled.push(p);
      } else if (p.data_planejada < todayStr) {
        overdueProcesses.push(p);
      } else if (p.data_planejada === todayStr) {
        todayProcesses.push(p);
      } else if (p.data_planejada === tomorrowStr) {
        tomorrowProcesses.push(p);
      } else if (p.data_planejada <= endOfWeekStr) {
        thisWeekProcesses.push(p);
      } else {
        futureProcesses.push(p);
      }
    });

    // Sort by priority within each group
    const sortByPriority = (a: Process, b: Process) => 
      (a.prioridade_usuario || 2) - (b.prioridade_usuario || 2);

    const groups: DateGroup[] = [];

    // Unscheduled first (as per user preference)
    if (unscheduled.length > 0) {
      groups.push({
        key: 'unscheduled',
        label: 'Sem Data Agendada',
        dateStr: null,
        processes: unscheduled.sort(sortByPriority),
        icon: <Inbox size={18} />,
        color: 'text-slate-500 bg-slate-50',
      });
    }

    // Overdue (if any)
    if (overdueProcesses.length > 0) {
      groups.push({
        key: 'overdue',
        label: 'Atrasados',
        dateStr: null,
        processes: overdueProcesses.sort(sortByPriority),
        icon: <AlertCircle size={18} />,
        color: 'text-red-600 bg-red-50',
      });
    }

    // Today
    if (todayProcesses.length > 0) {
      groups.push({
        key: 'today',
        label: 'Hoje',
        dateStr: todayStr,
        processes: todayProcesses.sort(sortByPriority),
        icon: <CheckCircle2 size={18} />,
        color: 'text-blue-600 bg-blue-50',
      });
    }

    // Tomorrow
    if (tomorrowProcesses.length > 0) {
      groups.push({
        key: 'tomorrow',
        label: 'Amanhã',
        dateStr: tomorrowStr,
        processes: tomorrowProcesses.sort(sortByPriority),
        icon: <Clock size={18} />,
        color: 'text-purple-600 bg-purple-50',
      });
    }

    // This Week
    if (thisWeekProcesses.length > 0) {
      groups.push({
        key: 'thisWeek',
        label: 'Esta Semana',
        dateStr: null,
        processes: thisWeekProcesses.sort(sortByPriority),
        icon: <Calendar size={18} />,
        color: 'text-emerald-600 bg-emerald-50',
      });
    }

    // Future
    if (futureProcesses.length > 0) {
      groups.push({
        key: 'future',
        label: 'Próximas Semanas',
        dateStr: null,
        processes: futureProcesses.sort(sortByPriority),
        icon: <Calendar size={18} />,
        color: 'text-slate-400 bg-slate-50',
      });
    }

    return groups;
  }, [processes]);

  const todayCount = dateGroups.find(g => g.key === 'today')?.processes.length || 0;
  const unscheduledCount = dateGroups.find(g => g.key === 'unscheduled')?.processes.length || 0;

  const toggleGroup = (key: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  if (processes.length === 0) {
    return (
      <div className="text-center py-16">
        <Inbox size={48} className="mx-auto text-slate-300 mb-4" />
        <h3 className="text-lg font-bold text-slate-600">Nenhum processo atribuído</h3>
        <p className="text-sm text-slate-400 mt-1">Processos atribuídos a você aparecerão aqui</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Capacity Indicator */}
      <WorkloadCapacityIndicator
        todayCount={todayCount}
        capacity={capacity}
        onCapacityChange={onCapacityChange}
        totalAssigned={processes.length}
        unscheduledCount={unscheduledCount}
      />

      {/* Date Groups */}
      <div className="space-y-4">
        {dateGroups.map(group => {
          const isCollapsed = collapsedGroups.has(group.key);
          
          return (
            <div key={group.key} className="bg-white rounded-2xl border border-slate-200">
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(group.key)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${group.color}`}>
                    {group.icon}
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                      {group.label}
                    </h3>
                    {group.dateStr && (
                      <p className="text-xs text-slate-400">
                        {new Date(group.dateStr + 'T00:00:00').toLocaleDateString('pt-BR', { 
                          weekday: 'long', 
                          day: 'numeric', 
                          month: 'long' 
                        })}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-slate-400">
                    {group.processes.length} {group.processes.length === 1 ? 'processo' : 'processos'}
                  </span>
                  {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                </div>
              </button>

              {/* Group Content */}
              {!isCollapsed && (
                <div className="px-4 pb-4 space-y-2">
                  {group.processes.map(process => (
                    <TaskSchedulerCard
                      key={process.id}
                      process={process}
                      onSchedule={onSchedule}
                      onViewDetails={onViewDetails}
                      onAdjustQty={onAdjustQty}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
