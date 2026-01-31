import React from 'react';
import { AlertCircle, List, MoreHorizontal, ArrowLeftRight } from 'lucide-react';
import { AjsefinTeamMember } from './types';

interface TeamMemberRowProps {
  member: AjsefinTeamMember;
  compact?: boolean;
}

const TeamMemberRow: React.FC<TeamMemberRowProps> = ({ member, compact = false }) => {
  // Determine bar color based on capacity
  let barColor = 'bg-blue-500';
  if (member.capacity > 75) barColor = 'bg-orange-500';
  if (member.capacity > 90) barColor = 'bg-red-500';

  const hasDelays = member.delayedItems > 0;

  if (compact) {
    return (
      <div className={`p-4 border-b last:border-0 transition-colors flex items-center justify-between gap-3 ${
        hasDelays ? 'bg-red-50/50 hover:bg-red-50' : 'bg-white hover:bg-gray-50'
      }`}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
           <div className="relative flex-shrink-0">
                <img 
                src={member.avatarUrl} 
                alt={member.name} 
                className={`w-10 h-10 rounded-full object-cover border-2 ${hasDelays ? 'border-red-300' : 'border-gray-200'}`}
                />
                <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-white rounded-full ${hasDelays ? 'bg-red-500' : 'bg-green-500'}`}></div>
           </div>
           
           <div className="flex-1 min-w-0">
             <div className="flex justify-between items-center mb-0.5">
                 <h4 className={`text-sm font-bold truncate ${hasDelays ? 'text-red-900' : 'text-gray-800'}`}>
                   {member.name.split(' ')[0]} {member.name.split(' ').pop()}
                 </h4>
                 {hasDelays && <AlertCircle size={14} className="text-red-500 flex-shrink-0" />}
             </div>
             
             <div className="flex items-center gap-2">
                 <div className="w-full bg-gray-200/70 rounded-full h-1.5 flex-1">
                    <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${member.capacity}%` }}></div>
                 </div>
                 <span className="text-[10px] font-bold text-gray-500 w-8 text-right">{member.capacity}%</span>
             </div>
           </div>
        </div>
        
        <button className="text-gray-300 hover:text-blue-600 p-1">
            <MoreHorizontal size={16} />
        </button>
      </div>
    );
  }

  // Default Table Row Layout (for Main Dashboard)
  return (
    <div className={`border-b last:border-0 p-4 transition-colors flex flex-col sm:flex-row items-center gap-4 ${
        hasDelays 
        ? 'bg-red-50 border-red-100 hover:bg-red-100/80' 
        : 'bg-white border-gray-100 hover:bg-gray-50'
    }`}>
      {/* Profile Info */}
      <div className="flex items-center gap-4 w-full sm:w-1/4">
        <div className="relative">
            <img 
            src={member.avatarUrl} 
            alt={member.name} 
            className={`w-12 h-12 rounded-full object-cover border-2 ${hasDelays ? 'border-red-300' : 'border-gray-200'}`}
            />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
        </div>
        
        <div className="overflow-hidden">
          <h4 className={`text-sm font-bold truncate ${hasDelays ? 'text-red-900' : 'text-gray-800'}`}>{member.name.toUpperCase()}</h4>
          <p className="text-xs text-gray-400 font-medium uppercase">{member.function}</p>
        </div>
      </div>

      {/* Workload Bar */}
      <div className="flex-1 w-full sm:w-1/2 flex flex-col justify-center px-4">
         <div className="flex justify-between items-center mb-1">
             <span className={`text-xs font-semibold ${hasDelays ? 'text-red-700' : 'text-gray-600'}`}>{member.activeProcesses} Processos</span>
             <span className="text-xs font-semibold text-gray-400">{member.capacity}% Cap.</span>
         </div>
         <div className="w-full bg-gray-200/50 rounded-full h-2">
            <div 
                className={`h-2 rounded-full ${barColor}`} 
                style={{ width: `${member.capacity}%` }}
            ></div>
         </div>
      </div>

      {/* Alerts */}
      <div className="w-full sm:w-1/6 flex justify-center">
        {hasDelays ? (
            <div className="inline-flex items-center gap-1 px-3 py-1 bg-white text-red-600 rounded-full text-xs font-bold border border-red-200 shadow-sm animate-pulse">
                <AlertCircle size={12} />
                {member.delayedItems} ATRASADOS
            </div>
        ) : (
            <span className="text-gray-300">-</span>
        )}
      </div>

      {/* Actions */}
      <div className="w-full sm:w-auto flex justify-end gap-2">
         <button className={`p-2 rounded-lg transition-colors border ${
             hasDelays 
             ? 'text-red-400 hover:text-red-600 hover:bg-white border-red-200' 
             : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50 border-gray-200'
         }`}>
             <List size={16} />
         </button>
         <button className={`p-2 rounded-lg transition-colors border ${
             hasDelays 
             ? 'text-red-400 hover:text-red-600 hover:bg-white border-red-200' 
             : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50 border-gray-200'
         }`}>
             <ArrowLeftRight size={16} />
         </button>
      </div>
    </div>
  );
};

export default TeamMemberRow;
