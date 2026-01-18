import React from 'react';
import { Role } from '../types';
import { X, UserCheck, Briefcase } from 'lucide-react';

interface AssignmentModalProps {
  staffMembers: { id: string; nome: string; role: Role | string; avatar_url: string | null }[];
  processesCount: Record<string, number>; // Maps staff ID to number of active processes
  onSelect: (staffId: string) => void;
  onClose: () => void;
}

export const AssignmentModal: React.FC<AssignmentModalProps> = ({ staffMembers, processesCount, onSelect, onClose }) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <UserCheck className="text-blue-600" size={20} />
            Atribuir Processo
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto">
          <p className="text-sm text-slate-500 mb-4">Selecione um membro da equipe SOSFU para assumir esta tarefa:</p>
          
          <div className="space-y-2">
            {staffMembers.map((staff) => {
              const count = processesCount[staff.id] || 0;
              const isOverloaded = count >= 5;
              
              return (
                <button
                  key={staff.id}
                  onClick={() => onSelect(staff.id)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <img src={staff.avatar_url || 'https://www.gravatar.com/avatar?d=mp'} alt={staff.nome} className="w-10 h-10 rounded-full border border-slate-200 object-cover" />
                    <div className="text-left">
                      <p className="font-semibold text-slate-800 text-sm">{staff.nome}</p>
                      <p className="text-xs text-slate-500">{staff.role}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end">
                     <span className={`text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 ${
                       isOverloaded ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                     }`}>
                        <Briefcase size={10} />
                        {count} ativos
                     </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
           <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-800 font-medium">Cancelar</button>
        </div>
      </div>
    </div>
  );
};