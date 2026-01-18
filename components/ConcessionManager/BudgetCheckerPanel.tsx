import React from 'react';
import { Building2 } from 'lucide-react';

interface BudgetCheckerPanelProps {
  percentUsed: number;
  percentImpact: number;
  unitCategory: 'JURISDICTIONAL' | 'ADMINISTRATIVE' | string;
}

export const BudgetCheckerPanel: React.FC<BudgetCheckerPanelProps> = ({
  percentUsed,
  percentImpact,
  unitCategory
}) => {
  return (
    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-black text-slate-700 uppercase flex items-center gap-2">
          <Building2 size={16} className="text-blue-500"/> Pré-Análise Orçamentária
        </h3>
        <span className="text-xs font-bold text-slate-500">
          Unidade: {unitCategory === 'JURISDICTIONAL' ? 'Comarca' : 'Adm'}
        </span>
      </div>
      
      <div className="relative h-8 bg-slate-200 rounded-full overflow-hidden flex mb-2">
        <div 
          className="h-full bg-slate-400 flex items-center justify-center text-[10px] font-bold text-white" 
          style={{ width: `${percentUsed}%` }}
        >
          Exec
        </div>
        <div 
          className="h-full bg-blue-500 flex items-center justify-center text-[10px] font-bold text-white animate-pulse" 
          style={{ width: `${percentImpact}%` }}
        >
          Este
        </div>
      </div>
    </div>
  );
};
