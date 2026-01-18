import React, { useState } from 'react';
import { BudgetRule, BudgetAction, Allocation, SupplyCategory, UnitCategory } from '../types';
import { useBudgetData } from '../hooks/useBudgetData';
import { Save, Plus, Trash2, ArrowRight, Settings, AlertCircle, Database, Loader2 } from 'lucide-react';

interface BudgetMatrixConfigProps {
  rules: BudgetRule[];
  onSave: (rules: BudgetRule[]) => void;
  onClose: () => void;
}

export const BudgetMatrixConfig: React.FC<BudgetMatrixConfigProps> = ({ rules, onSave, onClose }) => {
  // Use Supabase hook instead of mocks
  const { actions, allocations, isLoading } = useBudgetData();
  
  const [currentRules, setCurrentRules] = useState<BudgetRule[]>(JSON.parse(JSON.stringify(rules)));
  const [newRule, setNewRule] = useState<Partial<BudgetRule>>({
    unitCategory: 'JURISDICTIONAL',
    supplyCategory: 'ORDINARY',
    elementPrefix: '3.3.90.30'
  });

  const handleAddRule = () => {
    if (newRule.targetActionCode && newRule.targetAllocationCode) {
      const rule: BudgetRule = {
        id: `RULE-${Date.now()}`,
        unitCategory: newRule.unitCategory as UnitCategory,
        supplyCategory: newRule.supplyCategory as SupplyCategory,
        elementPrefix: newRule.elementPrefix || '',
        targetActionCode: newRule.targetActionCode,
        targetAllocationCode: newRule.targetAllocationCode
      };
      setCurrentRules([...currentRules, rule]);
      // Reset targets but keep context for quick entry
      setNewRule({ ...newRule, targetActionCode: '', targetAllocationCode: '' });
    }
  };

  const handleDeleteRule = (id: string) => {
    setCurrentRules(currentRules.filter(r => r.id !== id));
  };

  const getActionName = (code: string) => actions.find(a => a.code === code)?.description || code;
  const getAllocationName = (code: string) => allocations.find(a => a.code === code)?.description || code;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white w-full max-w-5xl h-[85vh] rounded-[32px] shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-8 py-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200">
                        <Settings size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">Matriz de Execução Orçamentária</h2>
                        <p className="text-xs text-slate-500 font-medium">Configuração dinâmica de Ações e Dotações (De/Para)</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => onSave(currentRules)} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all">
                        <Save size={16} /> Salvar Regras
                    </button>
                    <button onClick={onClose} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                        Fechar
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto custom-scrollbar p-8 bg-slate-100 space-y-8">
                
                {/* Rules Table */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                       <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                          <Database size={16} className="text-indigo-500"/> Regras de Atribuição Ativas ({currentRules.length})
                       </h3>
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-200">
                            <tr>
                                <th className="p-4 w-40">Tipo Unidade</th>
                                <th className="p-4 w-40">Finalidade</th>
                                <th className="p-4 w-32">Elemento</th>
                                <th className="p-4 w-8 text-center"><ArrowRight size={14}/></th>
                                <th className="p-4">Ação Orçamentária (Destino)</th>
                                <th className="p-4">Dotação / Fonte (Destino)</th>
                                <th className="p-4 w-16 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                            {currentRules.map((rule) => (
                                <tr key={rule.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 font-bold text-slate-700">
                                        <span className={`px-2 py-1 rounded border ${rule.unitCategory === 'JURISDICTIONAL' ? 'bg-blue-50 border-blue-100 text-blue-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
                                            {rule.unitCategory === 'JURISDICTIONAL' ? 'Comarcas' : 'Administrativo'}
                                        </span>
                                    </td>
                                    <td className="p-4 font-medium text-slate-600">{rule.supplyCategory === 'ORDINARY' ? 'Ordinário' : 'Extraordinário'}</td>
                                    <td className="p-4 font-mono text-slate-500">{rule.elementPrefix}</td>
                                    <td className="p-4 text-center text-slate-300"><ArrowRight size={14}/></td>
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="font-black text-indigo-700">{rule.targetActionCode}</span>
                                            <span className="text-[10px] text-slate-400 truncate w-48">{getActionName(rule.targetActionCode)}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="font-black text-emerald-700">{rule.targetAllocationCode}</span>
                                            <span className="text-[10px] text-slate-400 truncate w-48">{getAllocationName(rule.targetAllocationCode)}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <button onClick={() => handleDeleteRule(rule.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Add New Rule Form */}
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 shadow-inner">
                    <h4 className="text-sm font-black text-indigo-800 uppercase tracking-widest mb-4 flex items-center gap-2"><Plus size={16}/> Adicionar Nova Regra</h4>
                    <div className="grid grid-cols-7 gap-4 items-end">
                        <div className="col-span-1 space-y-1">
                            <label className="text-[10px] font-bold text-indigo-400 uppercase">Unidade</label>
                            <select 
                                className="w-full p-2 rounded-lg border border-indigo-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                value={newRule.unitCategory}
                                onChange={e => setNewRule({...newRule, unitCategory: e.target.value as any})}
                            >
                                <option value="JURISDICTIONAL">Comarcas</option>
                                <option value="ADMINISTRATIVE">Administrativo</option>
                            </select>
                        </div>
                        <div className="col-span-1 space-y-1">
                            <label className="text-[10px] font-bold text-indigo-400 uppercase">Finalidade</label>
                            <select 
                                className="w-full p-2 rounded-lg border border-indigo-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                value={newRule.supplyCategory}
                                onChange={e => setNewRule({...newRule, supplyCategory: e.target.value as any})}
                            >
                                <option value="ORDINARY">Ordinário</option>
                                <option value="EXTRAORDINARY">Extraordinário</option>
                            </select>
                        </div>
                        <div className="col-span-1 space-y-1">
                            <label className="text-[10px] font-bold text-indigo-400 uppercase">Elemento (Prefixo)</label>
                            <select 
                                className="w-full p-2 rounded-lg border border-indigo-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                value={newRule.elementPrefix}
                                onChange={e => setNewRule({...newRule, elementPrefix: e.target.value})}
                            >
                                <option value="3.3.90.30">33.90.30 (Consumo)</option>
                                <option value="3.3.90.33">33.90.33 (Locomoção)</option>
                                <option value="3.3.90.36">33.90.36 (PF)</option>
                                <option value="3.3.90.39">33.90.39 (PJ)</option>
                            </select>
                        </div>
                        <div className="col-span-2 space-y-1">
                            <label className="text-[10px] font-bold text-indigo-400 uppercase">Ação Vinculada</label>
                            <select 
                                className="w-full p-2 rounded-lg border border-indigo-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                value={newRule.targetActionCode}
                                onChange={e => setNewRule({...newRule, targetActionCode: e.target.value})}
                            >
                                <option value="">Selecione...</option>
                                {actions.map(a => (
                                    <option key={a.code} value={a.code}>{a.code} - {a.description}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-span-1 space-y-1">
                            <label className="text-[10px] font-bold text-indigo-400 uppercase">Dotação</label>
                            <select 
                                className="w-full p-2 rounded-lg border border-indigo-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                value={newRule.targetAllocationCode}
                                onChange={e => setNewRule({...newRule, targetAllocationCode: e.target.value})}
                            >
                                <option value="">Selecione...</option>
                                {allocations.map(a => (
                                    <option key={a.code} value={a.code}>{a.code}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-span-1">
                            <button 
                                onClick={handleAddRule}
                                className="w-full py-2 bg-indigo-600 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-indigo-700 shadow-md transition-all"
                            >
                                Adicionar
                            </button>
                        </div>
                    </div>
                </div>

            </div>
            
            <div className="px-8 py-4 bg-slate-50 border-t border-slate-200 flex gap-4 items-center text-[10px] text-slate-500 font-medium">
                <AlertCircle size={14} className="text-indigo-500" />
                <span>As regras definem automaticamente a fonte de recurso durante a geração de lotes e aprovação de solicitações. Alterações impactam apenas novos processos.</span>
            </div>
        </div>
    </div>
  );
};
