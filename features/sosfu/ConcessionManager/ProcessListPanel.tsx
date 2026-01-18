import React from 'react';
import { Search } from 'lucide-react';
import { Process, ConcessionStatus } from '../../types';

interface ProcessListPanelProps {
  processes: Process[];
  selectedId: string | null;
  onSelect: (id: string, process: Process) => void;
  filterText: string;
  setFilterText: (text: string) => void;
  statusFilter: string;
  setStatusFilter: (status: ConcessionStatus | 'ALL') => void;
  formatMoney: (val: number) => string;
}

export const ProcessListPanel: React.FC<ProcessListPanelProps> = ({
  processes,
  selectedId,
  onSelect,
  filterText,
  setFilterText,
  statusFilter,
  setStatusFilter,
  formatMoney
}) => {
  return (
    <div className="w-1/3 bg-white rounded-[32px] border border-slate-200 shadow-sm flex flex-col overflow-hidden">
      {/* Filter Header */}
      <div className="p-4 border-b border-slate-100 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16}/>
          <input 
            type="text" 
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Filtrar processos..."
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
          />
        </div>
        <select 
          className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as ConcessionStatus | 'ALL')}
        >
          <option value="ALL">Todos os Status</option>
          <option value={ConcessionStatus.TRIAGE}>Triagem</option>
          <option value={ConcessionStatus.ANALYSIS}>Análise Técnica</option>
          <option value={ConcessionStatus.AWAITING_SIGNATURE}>Assinaturas</option>
          <option value={ConcessionStatus.FINANCE}>Financeiro</option>
          <option value={ConcessionStatus.COMPLETE}>Concedido</option>
        </select>
      </div>
      
      {/* Process List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
        {processes.map(p => (
          <div 
            key={p.id}
            onClick={() => onSelect(p.id, p)}
            className={`p-4 rounded-2xl border cursor-pointer transition-all hover:shadow-md group ${
              selectedId === p.id 
                ? 'bg-blue-50 border-blue-200 shadow-sm' 
                : 'bg-white border-slate-100 hover:border-slate-300'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                p.supplyCategory === 'EXTRAORDINARY' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
              }`}>
                {p.supplyCategory === 'EXTRAORDINARY' ? 'Extra' : 'Ordinário'}
              </span>
              <span className="text-[10px] font-bold text-slate-400">{new Date(p.createdAt).toLocaleDateString()}</span>
            </div>
            <h4 className="text-sm font-bold text-slate-800 leading-tight mb-1 line-clamp-1">{p.interestedParty}</h4>
            <p className="text-xs text-slate-500 font-mono mb-2">{p.protocolNumber}</p>
            <div className="flex justify-between items-end border-t border-slate-200/50 pt-2 mt-2">
              <span className={`text-[10px] font-bold uppercase ${
                p.priority === 'CRITICAL' ? 'text-red-500 flex items-center gap-1' : 'text-slate-400'
              }`}>
                {p.status}
              </span>
              <span className="text-sm font-black text-slate-700">{formatMoney(p.value)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
