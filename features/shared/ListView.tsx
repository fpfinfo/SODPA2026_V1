
import React from 'react';
import { Process, ProcessType, StaffMember, AccountStatus } from '../types';
import { STAFF_MEMBERS } from '../constants';
import { MoreHorizontal, FileText, Send, UserCheck, UserPlus, ShieldCheck } from 'lucide-react';

interface ListViewProps {
  processes: Process[];
  onViewDetails?: (process: Process) => void;
  onAction?: (action: string, id: string) => void;
  staffWorkload: Record<string, number>;
  isLoading?: boolean;
}

export const ListView: React.FC<ListViewProps> = ({ processes, onViewDetails, onAction, staffWorkload, isLoading }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
          <tr>
            <th className="px-4 py-3">Protocolo / Interessado</th>
            <th className="px-4 py-3">Tipo / Status</th>
            <th className="px-4 py-3">Valor</th>
            <th className="px-4 py-3">Responsável</th>
            <th className="px-4 py-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, index) => (
                <tr key={index} className="animate-pulse">
                    <td className="px-4 py-3">
                        <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                    </td>
                    <td className="px-4 py-3">
                        <div className="h-3 bg-slate-200 rounded w-1/3 mb-1"></div>
                        <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                    </td>
                    <td className="px-4 py-3">
                         <div className="h-4 bg-slate-200 rounded w-24"></div>
                    </td>
                    <td className="px-4 py-3">
                         <div className="flex items-center gap-2">
                             <div className="w-6 h-6 bg-slate-200 rounded-full"></div>
                             <div className="h-3 bg-slate-200 rounded w-16"></div>
                         </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                             <div className="w-8 h-8 bg-slate-200 rounded"></div>
                             <div className="w-8 h-8 bg-slate-200 rounded"></div>
                        </div>
                    </td>
                </tr>
            ))
          ) : (
             processes.map((process) => {
                const isConcession = process.type === ProcessType.CONCESSION;
                // Safely access assignedToId
                const assignedStaff = STAFF_MEMBERS.find(s => s.id === process.assignedToId);
                const workloadCount = process.assignedToId ? (staffWorkload[process.assignedToId] || 0) : 0;
                const canSentinela = process.status === AccountStatus.AUDIT;

                return (
                <tr 
                    key={process.id} 
                    className="hover:bg-slate-50 group transition-colors cursor-pointer"
                    onClick={() => onViewDetails && onViewDetails(process)}
                >
                    <td className="px-4 py-3">
                    <div className="flex flex-col">
                        <span className="font-medium text-slate-800">{process.interestedParty || 'Interessado não identificado'}</span>
                        <span className="text-xs text-slate-500 font-mono">{process.protocolNumber}</span>
                    </div>
                    </td>
                    <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                        <span className={`inline-flex w-fit px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isConcession ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                            {isConcession ? 'Solicitação' : 'Prestação'}
                        </span>
                        <span className="text-xs text-slate-600">{process.status}</span>
                    </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(process.value)}
                    </td>
                    <td className="px-4 py-3">
                    {assignedStaff ? (
                        <div className="flex items-center gap-2">
                            <img 
                                src={assignedStaff.avatarUrl} 
                                alt={assignedStaff.name} 
                                className="w-6 h-6 rounded-full cursor-help" 
                                title={`${assignedStaff.name} possui ${workloadCount} processos ativos`}
                            />
                            <span className="text-xs text-slate-600">{assignedStaff.name.split(' ')[0]}</span>
                        </div>
                    ) : (
                        <span className="text-xs text-slate-400 italic flex items-center gap-1">
                            <UserPlus size={12} />
                            Livre
                        </span>
                    )}
                    </td>
                    <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                            {canSentinela && (
                                <button 
                                    className="p-1.5 bg-blue-50 hover:bg-blue-100 rounded text-blue-600 border border-blue-200" 
                                    title="Ativar Sentinela"
                                    onClick={() => onAction && onAction('sentinela', process.id)}
                                >
                                    <ShieldCheck size={16} />
                                </button>
                            )}
                            <button 
                                className="p-1.5 hover:bg-slate-200 rounded text-slate-600" 
                                title="Atribuir"
                                onClick={() => onAction && onAction('assume', process.id)}
                            >
                                <UserCheck size={16} />
                            </button>
                            <button 
                                className="p-1.5 hover:bg-slate-200 rounded text-slate-600" 
                                title="Detalhes"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onViewDetails && onViewDetails(process);
                                }}
                            >
                                <MoreHorizontal size={16} />
                            </button>
                        </div>
                    </td>
                </tr>
                );
             })
          )}
        </tbody>
      </table>
    </div>
  );
};
