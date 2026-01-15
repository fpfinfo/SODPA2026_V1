/**
 * Admin Budget Table Component
 * Management of administrative units' budget caps and execution tracking
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  Search,
  Building2,
  Plus,
  Edit3,
  Check,
  X,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Save,
  RefreshCw,
  Info,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

export interface AdminUnit {
  id: string;
  name: string;
  shortName?: string;
  annualCap: number;
  executed: number;
}

interface AdminBudgetTableProps {
  units: AdminUnit[];
  onUpdateUnit: (id: string, updates: Partial<AdminUnit>) => void;
  onAddUnit: (unit: Omit<AdminUnit, 'id'>) => void;
  onSave?: () => Promise<void>;
}

// Mock initial data
const MOCK_ADMIN_UNITS: AdminUnit[] = [
  { id: '1', name: 'Secretaria de Informática', shortName: 'SECIN', annualCap: 150000, executed: 45000 },
  { id: '2', name: 'Secretaria de Engenharia', shortName: 'SECENG', annualCap: 120000, executed: 80000 },
  { id: '3', name: 'Secretaria de Gestão de Pessoas (SGP)', shortName: 'SGP', annualCap: 50000, executed: 12000 },
  { id: '4', name: 'Gabinete Militar', shortName: 'GABMIL', annualCap: 80000, executed: 25000 },
  { id: '5', name: 'Coordenadoria de Cerimonial', shortName: 'CERIM', annualCap: 60000, executed: 55000 },
];

export const AdminBudgetTable: React.FC<AdminBudgetTableProps> = ({
  units: initialUnits,
  onUpdateUnit,
  onAddUnit,
  onSave,
}) => {
  const [units, setUnits] = useState<AdminUnit[]>(initialUnits.length > 0 ? initialUnits : MOCK_ADMIN_UNITS);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);
  const [isAdding, setIsAdding] = useState(false);
  const [newUnit, setNewUnit] = useState({ name: '', annualCap: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filter units by search
  const filteredUnits = useMemo(() => {
    if (!searchTerm.trim()) return units;
    const term = searchTerm.toLowerCase();
    return units.filter(u => 
      u.name.toLowerCase().includes(term) || 
      u.shortName?.toLowerCase().includes(term)
    );
  }, [units, searchTerm]);

  // Calculate totals
  const totals = useMemo(() => {
    return units.reduce((acc, u) => ({
      cap: acc.cap + u.annualCap,
      executed: acc.executed + u.executed,
    }), { cap: 0, executed: 0 });
  }, [units]);

  const formatBRL = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const getStatusColor = (executed: number, cap: number) => {
    if (cap === 0) return { bg: 'bg-slate-100', bar: 'bg-slate-300', text: 'text-slate-500' };
    const pct = (executed / cap) * 100;
    if (pct >= 90) return { bg: 'bg-red-50', bar: 'bg-red-500', text: 'text-red-600' };
    if (pct >= 70) return { bg: 'bg-amber-50', bar: 'bg-amber-500', text: 'text-amber-600' };
    return { bg: 'bg-emerald-50', bar: 'bg-emerald-500', text: 'text-emerald-600' };
  };

  const handleStartEdit = (unit: AdminUnit) => {
    setEditingId(unit.id);
    setEditValue(unit.annualCap);
  };

  const handleSaveEdit = (id: string) => {
    setUnits(prev => prev.map(u => u.id === id ? { ...u, annualCap: editValue } : u));
    onUpdateUnit(id, { annualCap: editValue });
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue(0);
  };

  const handleAddUnit = () => {
    if (!newUnit.name.trim() || newUnit.annualCap <= 0) return;
    const newId = Date.now().toString();
    const unit: AdminUnit = {
      id: newId,
      name: newUnit.name,
      annualCap: newUnit.annualCap,
      executed: 0,
    };
    setUnits(prev => [...prev, unit]);
    onAddUnit(unit);
    setNewUnit({ name: '', annualCap: 0 });
    setIsAdding(false);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      // Save to localStorage
      localStorage.setItem('admin_units_budget', JSON.stringify(units));
      if (onSave) await onSave();
      setSaveMessage({ type: 'success', text: 'Tetos salvos com sucesso!' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'Erro ao salvar. Tente novamente.' });
      setTimeout(() => setSaveMessage(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  // Load from localStorage on mount
  React.useEffect(() => {
    const saved = localStorage.getItem('admin_units_budget');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as AdminUnit[];
        if (parsed.length > 0) setUnits(parsed);
      } catch (e) {
        console.warn('[AdminBudgetTable] Failed to parse saved data');
      }
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-teal-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-teal-200">
            <Building2 size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800">Unidades Administrativas</h3>
            <p className="text-xs text-slate-500">Orçamento exclusivo para Extra-Emergencial</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar Unidade..."
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 w-64"
            />
          </div>
          
          {/* Add Button */}
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-bold hover:bg-teal-700 transition-colors shadow-sm"
          >
            <Plus size={16} />
            Nova Unidade
          </button>
        </div>
      </div>

      {/* Alert */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700">
          Unidades Administrativas não recebem suprimento ordinário. O teto limita apenas solicitações Extra-Emergenciais.
        </p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Unidades</p>
          <p className="text-2xl font-black text-slate-800">{units.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Teto Global</p>
          <p className="text-2xl font-black text-teal-600">{formatBRL(totals.cap)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Executado</p>
          <p className="text-2xl font-black text-slate-800">{formatBRL(totals.executed)}</p>
          <p className="text-xs text-slate-500">{((totals.executed / totals.cap) * 100).toFixed(1)}% utilizado</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Unidade Administrativa (Secretaria/Setor)
              </th>
              <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest w-40">
                Teto Anual (R$)
              </th>
              <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest w-32">
                Executado (R$)
              </th>
              <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest w-36">
                Saldo Disponível (R$)
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-40">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {/* Add New Row */}
            {isAdding && (
              <tr className="bg-teal-50/50 animate-in slide-in-from-top-2">
                <td className="px-6 py-4">
                  <input
                    type="text"
                    value={newUnit.name}
                    onChange={(e) => setNewUnit(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nome da Unidade..."
                    className="w-full px-3 py-2 border border-teal-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    autoFocus
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="relative">
                    <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="number"
                      value={newUnit.annualCap || ''}
                      onChange={(e) => setNewUnit(prev => ({ ...prev, annualCap: parseFloat(e.target.value) || 0 }))}
                      placeholder="0,00"
                      className="w-full pl-8 pr-3 py-2 border border-teal-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </td>
                <td className="px-6 py-4 text-right text-sm text-slate-400">R$ 0,00</td>
                <td className="px-6 py-4 text-right text-sm font-bold text-teal-600">
                  {formatBRL(newUnit.annualCap)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleAddUnit}
                      className="p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={() => { setIsAdding(false); setNewUnit({ name: '', annualCap: 0 }); }}
                      className="p-2 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {/* Data Rows */}
            {filteredUnits.map((unit) => {
              const saldo = unit.annualCap - unit.executed;
              const pct = unit.annualCap > 0 ? (unit.executed / unit.annualCap) * 100 : 0;
              const status = getStatusColor(unit.executed, unit.annualCap);
              const isEditing = editingId === unit.id;

              return (
                <tr key={unit.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${status.bar}`} />
                      <div>
                        <p className="text-sm font-bold text-slate-700">{unit.name}</p>
                        {unit.shortName && (
                          <p className="text-[10px] text-slate-400 font-mono">{unit.shortName}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <div className="flex items-center gap-2 justify-end">
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(parseFloat(e.target.value) || 0)}
                          className="w-28 px-3 py-1 border border-blue-300 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveEdit(unit.id)}
                          className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-sm font-bold text-slate-700">{formatBRL(unit.annualCap)}</span>
                        <button
                          onClick={() => handleStartEdit(unit)}
                          className="p-1.5 opacity-0 group-hover:opacity-100 bg-slate-100 text-slate-500 rounded-lg hover:bg-blue-100 hover:text-blue-600 transition-all"
                        >
                          <Edit3 size={12} />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm text-slate-600">{formatBRL(unit.executed)}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`text-sm font-bold ${saldo < 0 ? 'text-red-600' : 'text-teal-600'}`}>
                      {formatBRL(saldo)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {/* Progress Bar */}
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${status.bar}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <span className={`text-xs font-bold ${status.text} w-14 text-right`}>
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredUnits.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                  <Building2 size={32} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-medium">Nenhuma unidade encontrada</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Save Actions */}
      <div className="flex flex-col gap-4">
        {saveMessage && (
          <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg animate-in slide-in-from-bottom-2 ${
            saveMessage.type === 'success' 
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {saveMessage.type === 'success' ? (
              <CheckCircle size={20} className="shrink-0" />
            ) : (
              <AlertTriangle size={20} className="shrink-0" />
            )}
            <span className="text-sm font-bold">{saveMessage.text}</span>
          </div>
        )}
        
        <div className="flex justify-end gap-4">
          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-xl text-sm font-black uppercase tracking-wider shadow-lg hover:bg-teal-700 transition-colors"
          >
            {isSaving ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save size={18} />
                Salvar Alterações
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminBudgetTable;
