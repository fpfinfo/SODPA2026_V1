import React from 'react';
import { Users } from 'lucide-react';
import { SgpAnalyst } from './types';

interface AnalystCardProps {
  analyst: SgpAnalyst;
  isCurrentUser?: boolean;
}

const AnalystCard: React.FC<AnalystCardProps> = ({ analyst, isCurrentUser }) => {
  let barColor = 'bg-indigo-500';
  if (analyst.capacity > 75) barColor = 'bg-orange-500';
  if (analyst.capacity > 90) barColor = 'bg-red-500';

  return (
    <div className={`bg-white rounded-xl border shadow-sm p-5 transition-all hover:shadow-md ${isCurrentUser ? 'border-indigo-300 ring-2 ring-indigo-100' : 'border-gray-200'}`}>
      <div className="flex items-start gap-4 mb-4">
        <div className="relative">
          <img 
            src={analyst.avatarUrl} 
            alt={analyst.name} 
            className="w-14 h-14 rounded-full object-cover border-2 border-gray-100"
          />
          {analyst.isActive && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" title="Online"></span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-gray-900 truncate">{analyst.name}</h4>
            {isCurrentUser && (
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded border border-indigo-200">
                VOCÊ
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">{analyst.cargo}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{analyst.email}</p>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase">Carga de Trabalho</span>
          <span className="text-xs font-bold text-gray-600">{analyst.capacity}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full ${barColor} transition-all duration-500`} 
            style={{ width: `${analyst.capacity}%` }}
          ></div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-xl font-bold text-gray-800">{analyst.activeProcesses}</p>
          <p className="text-[10px] text-gray-400 uppercase font-medium">Pendentes</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-xl font-bold text-gray-800">{analyst.delayedItems}</p>
          <p className="text-[10px] text-gray-400 uppercase font-medium">Atrasados</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-xl font-bold text-gray-800">{Math.round(analyst.activeProcesses * 1.5)}</p>
          <p className="text-[10px] text-gray-400 uppercase font-medium">Semana</p>
        </div>
      </div>
    </div>
  );
};

interface SgpTeamPanelProps {
  team: SgpAnalyst[];
  currentUserEmail?: string;
  onAssignTo?: (analystId: string) => void;
}

export const SgpTeamPanel: React.FC<SgpTeamPanelProps> = ({ team, currentUserEmail, onAssignTo }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white flex items-center justify-between">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <Users size={18} className="text-indigo-600" />
          Gestão de Equipe
        </h3>
        <span className="text-xs text-gray-400">Analistas de RH</span>
      </div>

      <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
        {team.map(analyst => (
          <AnalystCard 
            key={analyst.id}
            analyst={analyst}
            isCurrentUser={analyst.email === currentUserEmail}
          />
        ))}
      </div>
    </div>
  );
};

export default SgpTeamPanel;
