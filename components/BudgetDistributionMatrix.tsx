import React, { useState } from 'react';
import { BudgetDistribution, AdminBudget } from '../types';
import { Save, AlertCircle, Search, Calculator, Table, Building2, MapPin, University, AlertTriangle } from 'lucide-react';

interface BudgetDistributionMatrixProps {
  distributions: BudgetDistribution[];
  adminBudgets: AdminBudget[]; // Prop nova para orçamentos administrativos
  onSave: (updatedDistributions: BudgetDistribution[], updatedAdminBudgets: AdminBudget[]) => void;
  onClose: () => void;
}

type TabMode = 'JURISDICTIONAL' | 'ADMINISTRATIVE';

export const BudgetDistributionMatrix: React.FC<BudgetDistributionMatrixProps> = ({ distributions, adminBudgets, onSave, onClose }) => {
  const [tabMode, setTabMode] = useState<TabMode>('JURISDICTIONAL');
  const [dataComarcas, setDataComarcas] = useState<BudgetDistribution[]>(JSON.parse(JSON.stringify(distributions)));
  const [dataAdmin, setDataAdmin] = useState<AdminBudget[]>(JSON.parse(JSON.stringify(adminBudgets)));
  const [search, setSearch] = useState('');

  // Handle updates for Comarcas
  const handleUpdateComarca = (index: number, field: string, value: number) => {
    const newData = [...dataComarcas];
    if (field === 'annualValue') {
      newData[index].annualValue = value;
    } else {
      newData[index].split = { ...newData[index].split, [field]: value };
    }
    setDataComarcas(newData);
  };

  // Handle updates for Admin Units
  const handleUpdateAdmin = (index: number, field: keyof AdminBudget, value: number) => {
    const newData = [...dataAdmin];
    if (field === 'annualCap') {
        newData[index].annualCap = value;
    }
    // 'executed' usually updated by system logic, but editable here for corrections if needed
    // Assuming mainly Cap editing here
    setDataAdmin(newData);
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const filteredComarcas = dataComarcas.filter(d => d.comarcaName.toLowerCase().includes(search.toLowerCase()));
  const filteredAdmin = dataAdmin.filter(d => d.unitName.toLowerCase().includes(search.toLowerCase()));

  const handleSave = () => {
    // Validate totals for Comarcas
    if (tabMode === 'JURISDICTIONAL') {
        const invalid = dataComarcas.find(d => {
            const total = d.split.consumption + d.split.fuel + d.split.transport + d.split.servicePF + d.split.servicePJ;
            return Math.abs(total - 100) > 0.1;
        });

        if (invalid) {
            alert(`Erro de Validação: A comarca ${invalid.comarcaName} não totaliza 100% no rateio.`);
            return;
        }
    }

    onSave(dataComarcas, dataAdmin);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white w-full max-w-6xl h-[85vh] rounded-[32px] shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-8 py-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl shadow-lg transition-colors ${tabMode === 'JURISDICTIONAL' ? 'bg-blue-600 text-white shadow-blue-200' : 'bg-slate-800 text-white shadow-slate-200'}`}>
                        {tabMode === 'JURISDICTIONAL' ? <University size={24} /> : <Building2 size={24} />}
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">Gestão de Tetos Orçamentários</h2>
                        <p className="text-xs text-slate-500 font-medium">Parametrização por Unidade Organizacional</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                        <input 
                            type="text" 
                            placeholder={tabMode === 'JURISDICTIONAL' ? "Buscar Comarca..." : "Buscar Unidade..."} 
                            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all">
                        <Save size={16} /> Salvar Alterações
                    </button>
                    <button onClick={onClose} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                        Fechar
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-slate-50 border-b border-slate-200 px-8 pt-4 gap-2">
                <button 
                    onClick={() => setTabMode('JURISDICTIONAL')}
                    className={`px-6 py-3 rounded-t-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all ${tabMode === 'JURISDICTIONAL' ? 'bg-white border-x border-t border-slate-200 text-blue-700 -mb-px relative z-10 shadow-sm' : 'text-slate-400 hover:bg-slate-100'}`}
                >
                    <MapPin size={16} /> Comarcas (Jurisdicional)
                </button>
                <button 
                    onClick={() => setTabMode('ADMINISTRATIVE')}
                    className={`px-6 py-3 rounded-t-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all ${tabMode === 'ADMINISTRATIVE' ? 'bg-white border-x border-t border-slate-200 text-slate-800 -mb-px relative z-10 shadow-sm' : 'text-slate-400 hover:bg-slate-100'}`}
                >
                    <Building2 size={16} /> Unidades Administrativas
                </button>
            </div>

            {/* Table Content */}
            <div className="flex-1 overflow-auto custom-scrollbar p-8 bg-slate-100">
                {tabMode === 'JURISDICTIONAL' ? (
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in">
                        <div className="px-6 py-4 border-b border-slate-100 bg-blue-50/30 flex justify-between items-center">
                            <span className="text-[10px] font-bold text-blue-700 uppercase">Matriz de Rateio - Fluxo Ordinário & Extraordinário</span>
                            <span className="text-[10px] font-bold text-slate-400">Total Comarcas: {dataComarcas.length}</span>
                        </div>
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="p-4 w-64 bg-slate-50">Comarca</th>
                                    <th className="p-4 w-32 bg-slate-50">Teto Anual (R$)</th>
                                    <th className="p-4 w-32 bg-blue-50/50 text-blue-700">Cota Quadr.</th>
                                    <th className="p-4 text-center w-24">Consumo<br/>(30.01) %</th>
                                    <th className="p-4 text-center w-24">Combust.<br/>(30.02) %</th>
                                    <th className="p-4 text-center w-24">Locom.<br/>(33) %</th>
                                    <th className="p-4 text-center w-24">Serv. PF<br/>(36) %</th>
                                    <th className="p-4 text-center w-24">Serv. PJ<br/>(39) %</th>
                                    <th className="p-4 text-center w-20">Total %</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                                {filteredComarcas.map((row, index) => {
                                    const totalPercent = row.split.consumption + row.split.fuel + row.split.transport + row.split.servicePF + row.split.servicePJ;
                                    const isValid = Math.abs(totalPercent - 100) < 0.1;
                                    
                                    return (
                                        <tr key={row.comarcaId} className="hover:bg-slate-50 group transition-colors">
                                            <td className="p-4 font-bold text-slate-700">{row.comarcaName}</td>
                                            <td className="p-4">
                                                <input 
                                                    type="number" 
                                                    className="w-full p-2 border border-slate-200 rounded bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                                    value={row.annualValue}
                                                    onChange={(e) => handleUpdateComarca(index, 'annualValue', parseFloat(e.target.value) || 0)}
                                                />
                                            </td>
                                            <td className="p-4 bg-blue-50/30 font-black text-blue-700">
                                                {formatCurrency(row.annualValue / 3)}
                                            </td>
                                            <td className="p-4"><input type="number" className="w-full text-center p-1 border rounded" value={row.split.consumption} onChange={(e) => handleUpdateComarca(index, 'consumption', parseFloat(e.target.value) || 0)} /></td>
                                            <td className="p-4"><input type="number" className="w-full text-center p-1 border rounded" value={row.split.fuel} onChange={(e) => handleUpdateComarca(index, 'fuel', parseFloat(e.target.value) || 0)} /></td>
                                            <td className="p-4"><input type="number" className="w-full text-center p-1 border rounded" value={row.split.transport} onChange={(e) => handleUpdateComarca(index, 'transport', parseFloat(e.target.value) || 0)} /></td>
                                            <td className="p-4"><input type="number" className="w-full text-center p-1 border rounded" value={row.split.servicePF} onChange={(e) => handleUpdateComarca(index, 'servicePF', parseFloat(e.target.value) || 0)} /></td>
                                            <td className="p-4"><input type="number" className="w-full text-center p-1 border rounded" value={row.split.servicePJ} onChange={(e) => handleUpdateComarca(index, 'servicePJ', parseFloat(e.target.value) || 0)} /></td>
                                            <td className="p-4 text-center">
                                                <span className={`px-2 py-1 rounded font-black ${isValid ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700 animate-pulse'}`}>
                                                    {totalPercent}%
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <span className="text-[10px] font-bold text-slate-700 uppercase flex items-center gap-2">
                                <AlertTriangle size={12} className="text-amber-500" />
                                Orçamento Exclusivo para Extra-Emergencial
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">Total Unidades: {dataAdmin.length}</span>
                        </div>
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="p-4 w-96 bg-slate-50">Unidade Administrativa (Secretaria/Setor)</th>
                                    <th className="p-4 w-48 bg-slate-50 text-right">Teto Anual (R$)</th>
                                    <th className="p-4 w-48 bg-slate-50 text-right">Executado (R$)</th>
                                    <th className="p-4 w-48 bg-slate-50 text-right">Saldo Disponível (R$)</th>
                                    <th className="p-4 bg-slate-50">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                                {filteredAdmin.map((row, index) => {
                                    const balance = row.annualCap - row.executed;
                                    const percentUsed = (row.executed / row.annualCap) * 100;
                                    
                                    return (
                                        <tr key={row.unitId} className="hover:bg-slate-50 group transition-colors">
                                            <td className="p-4 font-bold text-slate-700 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                                                    <Building2 size={16} />
                                                </div>
                                                {row.unitName}
                                            </td>
                                            <td className="p-4 text-right">
                                                <input 
                                                    type="number" 
                                                    className="w-32 p-2 border border-slate-200 rounded bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium text-right"
                                                    value={row.annualCap}
                                                    onChange={(e) => handleUpdateAdmin(index, 'annualCap', parseFloat(e.target.value) || 0)}
                                                />
                                            </td>
                                            <td className="p-4 text-right font-medium text-slate-600">
                                                {formatCurrency(row.executed)}
                                            </td>
                                            <td className="p-4 text-right">
                                                <span className={`font-black ${balance < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                                    {formatCurrency(balance)}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full ${percentUsed > 90 ? 'bg-red-500' : percentUsed > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                                                        style={{ width: `${Math.min(percentUsed, 100)}%` }}
                                                    ></div>
                                                </div>
                                                <p className="text-[9px] text-slate-400 mt-1 text-right">{percentUsed.toFixed(1)}% utilizado</p>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            
            <div className="px-8 py-4 bg-slate-50 border-t border-slate-200 flex gap-4 items-center text-[10px] text-slate-500 font-medium">
                <AlertCircle size={14} className="text-blue-500" />
                <span>
                    {tabMode === 'JURISDICTIONAL' 
                        ? 'Os valores definidos aqui impactam diretamente a geração automática de lotes ordinários para as Comarcas.' 
                        : 'Unidades Administrativas não recebem suprimento ordinário. O teto limita apenas solicitações Extra-Emergenciais.'}
                </span>
            </div>
        </div>
    </div>
  );
};
