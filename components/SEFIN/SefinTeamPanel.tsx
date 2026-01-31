import React from 'react';
import { Users } from 'lucide-react';
import { SefinOrdenador } from './types';

interface OrdenadorCardProps {
  ordenador: SefinOrdenador;
  onAssignToSelf?: () => void;
  isCurrentUser?: boolean;
}

const OrdenadorCard: React.FC<OrdenadorCardProps> = ({ ordenador, onAssignToSelf, isCurrentUser }) => {
  // Determine bar color based on capacity
  let barColor = 'bg-blue-500';
  if (ordenador.capacity > 75) barColor = 'bg-orange-500';
  if (ordenador.capacity > 90) barColor = 'bg-red-500';

  return (
    <div className={`bg-white rounded-xl border shadow-sm p-5 transition-all hover:shadow-md ${isCurrentUser ? 'border-green-300 ring-2 ring-green-100' : 'border-gray-200'}`}>
      {/* Header with avatar and info */}
      <div className="flex items-start gap-4 mb-4">
        <div className="relative">
          <img 
            src={ordenador.avatarUrl} 
            alt={ordenador.name} 
            className="w-14 h-14 rounded-full object-cover border-2 border-gray-100"
          />
          {ordenador.isActive && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" title="Ativo"></span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-gray-900 truncate">{ordenador.name}</h4>
            {isCurrentUser && (
              <span className="text-[10px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded border border-green-200">
                VOCÊ
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">{ordenador.cargo}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{ordenador.email}</p>
        </div>
      </div>

      {/* Workload bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase">Carga de Trabalho</span>
          <span className="text-xs font-bold text-gray-600">{ordenador.capacity}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full ${barColor} transition-all duration-500`} 
            style={{ width: `${ordenador.capacity}%` }}
          ></div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-xl font-bold text-gray-800">{ordenador.activeProcesses}</p>
          <p className="text-[10px] text-gray-400 uppercase font-medium">Pendentes</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-xl font-bold text-gray-800">{ordenador.delayedItems}</p>
          <p className="text-[10px] text-gray-400 uppercase font-medium">Hoje</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-xl font-bold text-gray-800">{Math.round(ordenador.activeProcesses * 1.2)}</p>
          <p className="text-[10px] text-gray-400 uppercase font-medium">Total</p>
        </div>
      </div>
    </div>
  );
};

interface TeamPanelProps {
  ordenadores: SefinOrdenador[];
  currentUserEmail?: string;
  onAssignTo?: (ordenadorId: string) => void;
}

export const SefinTeamPanel: React.FC<TeamPanelProps> = ({ ordenadores, currentUserEmail, onAssignTo }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <Users size={18} className="text-slate-600" />
          Gestão de Equipe
        </h3>
        <span className="text-xs text-gray-400">Ordenadores de Despesa</span>
      </div>

      {/* Ordenadores Grid */}
      <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
        {ordenadores.map(ord => (
          <OrdenadorCard 
            key={ord.id}
            ordenador={ord}
            isCurrentUser={ord.email === currentUserEmail}
            onAssignToSelf={() => onAssignTo?.(ord.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default SefinTeamPanel;
