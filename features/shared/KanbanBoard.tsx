import React, { useState, useMemo } from 'react';
import { Process, FilterTab, ConcessionStatus, AccountStatus, ProcessType, ProcessStatus } from '../types';
import { CONCESSION_COLUMNS, ACCOUNT_COLUMNS, UNIFIED_COLUMNS } from '../constants';
import { ProcessCard } from './ProcessCard';
import { MoreHorizontal, Plus } from 'lucide-react';

interface KanbanBoardProps {
  processes: Process[];
  activeTab: FilterTab;
  onViewDetails?: (process: Process) => void;
  onAction?: (action: string, id: string) => void;
  staffWorkload: Record<string, number>;
  isLoading?: boolean;
  onMoveProcess?: (id: string, newStatus: ProcessStatus) => void;
}

const SkeletonCard = () => (
  <div className="bg-white rounded-2xl p-4 mb-3 border border-slate-100 shadow-sm animate-pulse h-[140px] flex flex-col justify-between">
    <div>
      <div className="flex justify-between items-start mb-3"><div className="h-4 bg-slate-100 rounded-lg w-1/2"></div><div className="h-4 bg-slate-100 rounded-lg w-1/4"></div></div>
      <div className="space-y-2"><div className="h-3 bg-slate-100 rounded-lg w-3/4"></div><div className="h-3 bg-slate-100 rounded-lg w-1/3"></div></div>
    </div>
    <div className="flex justify-between items-center pt-3 border-t border-slate-50"><div className="h-3 bg-slate-100 rounded-lg w-1/4"></div><div className="w-7 h-7 bg-slate-100 rounded-full"></div></div>
  </div>
);

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ processes, activeTab, onViewDetails, onAction, staffWorkload, isLoading, onMoveProcess }) => {
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const columns = useMemo(() => {
    if (activeTab === 'ALL') {
      return UNIFIED_COLUMNS.map(col => ({ id: col.id, label: col.label, isUnified: true, filter: (p: Process) => col.statuses.includes(p.status as any) }));
    }
    const rawCols = activeTab === 'CONCESSION' ? CONCESSION_COLUMNS : ACCOUNT_COLUMNS;
    return rawCols.map(status => ({ id: status, label: status, isUnified: false, filter: (p: Process) => p.status === status }));
  }, [activeTab]);

  const handleDragOver = (e: React.DragEvent, colId: string) => { e.preventDefault(); setDragOverColumn(colId); };
  const handleDragLeave = () => { setDragOverColumn(null); };

  const handleDrop = (e: React.DragEvent, targetColId: string, isUnified: boolean) => {
    e.preventDefault();
    setDragOverColumn(null);
    const processId = e.dataTransfer.getData('processId');
    if (!processId || !onMoveProcess) return;

    if (!isUnified) { onMoveProcess(processId, targetColId as any as ProcessStatus); return; }

    const process = processes.find(p => p.id === processId);
    if (!process) return;

    let finalStatus: ProcessStatus | null = null;
    if (targetColId === 'NEW') finalStatus = process.type === ProcessType.CONCESSION ? ConcessionStatus.TRIAGE : AccountStatus.RECEIVED;
    else if (targetColId === 'WIP') finalStatus = process.type === ProcessType.CONCESSION ? ConcessionStatus.ANALYSIS : AccountStatus.AUDIT;
    else if (targetColId === 'PENDING') finalStatus = process.type === ProcessType.CONCESSION ? ConcessionStatus.SIGNATURE : AccountStatus.PENDING;
    else if (targetColId === 'DONE') finalStatus = process.type === ProcessType.CONCESSION ? ConcessionStatus.FINANCE : AccountStatus.APPROVED_CAVEATS;

    if (finalStatus) onMoveProcess(processId, finalStatus);
  };

  return (
    <div className="flex gap-6 h-full overflow-x-auto pb-4 px-2 custom-scrollbar snap-x">
      {columns.map((column) => {
        const columnProcesses = processes.filter(column.filter);
        const isOver = dragOverColumn === column.id;
        return (
          <div key={column.id} className={`flex flex-col h-full min-w-[320px] w-[320px] rounded-3xl border transition-all duration-200 snap-center ${isOver ? 'bg-blue-50/80 border-blue-300 shadow-md ring-2 ring-blue-100' : 'bg-slate-100/50 border-slate-200/60 hover:border-slate-300'}`} onDragOver={(e) => handleDragOver(e, column.id)} onDragLeave={handleDragLeave} onDrop={(e) => handleDrop(e, column.id, column.isUnified)}>
            <div className={`px-5 py-4 flex justify-between items-center rounded-t-3xl backdrop-blur-sm ${isOver ? 'bg-blue-100/50' : 'bg-slate-50/50'}`}>
              <div className="flex items-center gap-2 overflow-hidden"><div className={`w-2 h-2 rounded-full ${columnProcesses.length > 0 ? 'bg-blue-500' : 'bg-slate-300'}`}></div><h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider truncate" title={column.label}>{column.label}</h3></div>
              <div className="flex items-center gap-2"><span className="bg-white/80 text-slate-600 px-2.5 py-1 rounded-lg text-[10px] font-black shadow-sm border border-slate-100/50">{isLoading ? '-' : columnProcesses.length}</span><button className="text-slate-400 hover:text-slate-600 transition-colors"><MoreHorizontal size={14} /></button></div>
            </div>
            <div className="flex-1 p-3 overflow-y-auto custom-scrollbar space-y-3">
              {isLoading ? (<><SkeletonCard /><SkeletonCard /><SkeletonCard /></>) : (
                <>{columnProcesses.length === 0 ? (<div className="h-32 border-2 border-dashed border-slate-200/60 rounded-2xl flex flex-col items-center justify-center text-slate-400 gap-2 m-2"><div className="p-2 bg-slate-50 rounded-full"><Plus size={16} className="opacity-50" /></div><span className="text-[10px] font-medium uppercase tracking-wide opacity-60">Sem processos</span></div>) : (columnProcesses.map(process => (<ProcessCard key={process.id} process={process} onAction={onAction} onClick={() => onViewDetails && onViewDetails(process)} currentWorkload={process.assignedToId ? (staffWorkload[process.assignedToId] || 0) : 0}/>)))}</>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
