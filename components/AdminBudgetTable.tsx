/**
 * Admin Budget Table Component
 * Management of administrative units' budget caps and execution tracking
 */

import React, { useState, useMemo } from 'react';
import {
  Search,
  Building2,
  Plus,
  Edit3,
  Check,
  X,
  TrendingUp,
  DollarSign,
  Save,
  RefreshCw,
  Info,
  CheckCircle,
  AlertTriangle,
  FileText,
  Hash
} from 'lucide-react';

export interface BudgetLineItem {
  id: string;
  unitName: string;
  shortName?: string;
  expenseElement: string;
  dotationNumber: string;
  currentDotation: number;
  committedValue: number;
}

interface AdminBudgetTableProps {
  units: BudgetLineItem[]; // Renamed prop for clarity, though keeping generic name locally might be easier
  onUpdateUnit: (id: string, updates: Partial<BudgetLineItem>) => void;
  onAddUnit: (unit: Omit<BudgetLineItem, 'id'>) => void;
  onSave?: () => Promise<void>;
}

// Mock initial data
const MOCK_BUDGET_ITEMS: BudgetLineItem[] = [
  { id: '1', unitName: 'Secretaria de Informática', shortName: 'SECIN', expenseElement: '33.90.30', dotationNumber: '123', currentDotation: 150000, committedValue: 45000 },
  { id: '2', unitName: 'Secretaria de Engenharia', shortName: 'SECENG', expenseElement: '33.90.39', dotationNumber: '124', currentDotation: 120000, committedValue: 80000 },
  { id: '3', unitName: 'SGP', shortName: 'SGP', expenseElement: '33.90.36', dotationNumber: '125', currentDotation: 50000, committedValue: 12000 },
];

export const AdminBudgetTable: React.FC<AdminBudgetTableProps> = ({
  units: initialUnits,
  onUpdateUnit,
  onAddUnit,
  onSave,
}) => {
  // We use "units" variable name but it now holds BudgetLineItems
  const [items, setItems] = useState<BudgetLineItem[]>(initialUnits.length > 0 ? initialUnits : MOCK_BUDGET_ITEMS);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Edit State
  const [editForm, setEditForm] = useState<Partial<BudgetLineItem>>({});
  
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState<Partial<BudgetLineItem>>({ 
    unitName: '', expenseElement: '', dotationNumber: '', currentDotation: 0, committedValue: 0 
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filter items
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const term = searchTerm.toLowerCase();
    return items.filter(u => 
      u.unitName.toLowerCase().includes(term) || 
      u.shortName?.toLowerCase().includes(term) ||
      u.expenseElement.toLowerCase().includes(term) ||
      u.dotationNumber.includes(term)
    );
  }, [items, searchTerm]);

  // Calculate totals
  const totals = useMemo(() => {
    return items.reduce((acc, u) => ({
      cap: acc.cap + u.currentDotation,
      executed: acc.executed + u.committedValue,
    }), { cap: 0, executed: 0 });
  }, [items]);

  const formatBRL = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const getStatusColor = (executed: number, cap: number) => {
    if (cap === 0) return { bg: 'bg-slate-100', bar: 'bg-slate-300', text: 'text-slate-500' };
    const pct = (executed / cap) * 100;
    if (pct >= 90) return { bg: 'bg-red-50', bar: 'bg-red-500', text: 'text-red-600' };
    if (pct >= 70) return { bg: 'bg-amber-50', bar: 'bg-amber-500', text: 'text-amber-600' };
    return { bg: 'bg-emerald-50', bar: 'bg-emerald-500', text: 'text-emerald-600' };
  };

  const handleStartEdit = (item: BudgetLineItem) => {
    setEditingId(item.id);
    setEditForm({ ...item });
  };

  const handleSaveEdit = (id: string) => {
    if (!editForm) return;
    
    setItems(prev => prev.map(u => u.id === id ? { ...u, ...editForm } as BudgetLineItem : u));
    onUpdateUnit(id, editForm);
    setEditingId(null);
    setEditForm({});
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleAddItem = () => {
    if (!newItem.unitName?.trim() || !newItem.currentDotation) return;
    const newId = Date.now().toString();
    const item: BudgetLineItem = {
      id: newId,
      unitName: newItem.unitName || '',
      shortName: newItem.shortName || newItem.unitName?.substring(0, 6).toUpperCase(),
      expenseElement: newItem.expenseElement || '',
      dotationNumber: newItem.dotationNumber || '',
      currentDotation: newItem.currentDotation || 0,
      committedValue: newItem.committedValue || 0,
    };
    setItems(prev => [...prev, item]);
    onAddUnit(item);
    setNewItem({ unitName: '', expenseElement: '', dotationNumber: '', currentDotation: 0, committedValue: 0 });
    setIsAdding(false);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      localStorage.setItem('admin_units_budget', JSON.stringify(items));
      if (onSave) await onSave();
      setSaveMessage({ type: 'success', text: 'Dados salvos com sucesso!' });
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
        const parsed = JSON.parse(saved) as BudgetLineItem[];
        // Basic validation to check if it has the new fields, otherwise ignore or migrate
        // For simplicity, we just load if it looks like an array. 
        // ideally we should check if 'expenseElement' exists, if not, maybe migrate old data
        if (parsed.length > 0) setItems(parsed);
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
            <h3 className="text-lg font-black text-slate-800">Matriz Orçamentária</h3>
            <p className="text-xs text-slate-500">Gestão detalhada por Elemento e Dotação</p>
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
              placeholder="Buscar..."
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 w-64"
            />
          </div>
          
          {/* Add Button */}
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-bold hover:bg-teal-700 transition-colors shadow-sm"
          >
            <Plus size={16} />
            Novo Item
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total de Itens</p>
          <p className="text-2xl font-black text-slate-800">{items.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Dotação Global</p>
          <p className="text-2xl font-black text-teal-600">{formatBRL(totals.cap)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Empenhado</p>
          <p className="text-2xl font-black text-slate-800">{formatBRL(totals.executed)}</p>
          <p className="text-xs text-slate-500">{totals.cap > 0 ? ((totals.executed / totals.cap) * 100).toFixed(1) : 0}% utilizado</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full min-w-[1000px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Unidade / Setor
              </th>
              <th className="px-4 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest w-32">
                Elemento
              </th>
              <th className="px-4 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest w-24">
                N° Dotação
              </th>
              <th className="px-4 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest w-36">
                Dotação Atual
              </th>
              <th className="px-4 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest w-36">
                Vlr. Empenhado
              </th>
              <th className="px-4 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest w-36">
                Disponível
              </th>
              <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-24">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {/* Add New Row */}
            {isAdding && (
              <tr className="bg-teal-50/50 animate-in slide-in-from-top-2">
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={newItem.unitName}
                    onChange={(e) => setNewItem(prev => ({ ...prev, unitName: e.target.value }))}
                    placeholder="Nome da Unidade..."
                    className="w-full px-2 py-1.5 border border-teal-200 rounded text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                    autoFocus
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={newItem.expenseElement}
                    onChange={(e) => setNewItem(prev => ({ ...prev, expenseElement: e.target.value }))}
                    placeholder="Ex: 33.90.30"
                    className="w-full px-2 py-1.5 border border-teal-200 rounded text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={newItem.dotationNumber}
                    onChange={(e) => setNewItem(prev => ({ ...prev, dotationNumber: e.target.value }))}
                    placeholder="N°"
                    className="w-full px-2 py-1.5 border border-teal-200 rounded text-xs text-center focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    value={newItem.currentDotation || ''}
                    onChange={(e) => setNewItem(prev => ({ ...prev, currentDotation: parseFloat(e.target.value) || 0 }))}
                    placeholder="0,00"
                    className="w-full px-2 py-1.5 border border-teal-200 rounded text-xs text-right focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    value={newItem.committedValue || ''}
                    onChange={(e) => setNewItem(prev => ({ ...prev, committedValue: parseFloat(e.target.value) || 0 }))}
                    placeholder="0,00"
                    className="w-full px-2 py-1.5 border border-teal-200 rounded text-xs text-right focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </td>
                <td className="px-4 py-3 text-right text-xs text-slate-400">
                  {formatBRL((newItem.currentDotation || 0) - (newItem.committedValue || 0))}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={handleAddItem} className="p-1.5 bg-teal-600 text-white rounded hover:bg-teal-700">
                      <Check size={14} />
                    </button>
                    <button onClick={() => setIsAdding(false)} className="p-1.5 bg-slate-200 text-slate-600 rounded hover:bg-slate-300">
                      <X size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {/* Data Rows */}
            {filteredItems.map((item) => {
              const available = item.currentDotation - item.committedValue;
              const isEditing = editingId === item.id;

              if (isEditing) {
                return (
                  <tr key={item.id} className="bg-blue-50/30">
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={editForm.unitName || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, unitName: e.target.value }))}
                        className="w-full px-2 py-1 border border-blue-300 rounded text-xs focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={editForm.expenseElement || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, expenseElement: e.target.value }))}
                        className="w-full px-2 py-1 border border-blue-300 rounded text-xs focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={editForm.dotationNumber || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, dotationNumber: e.target.value }))}
                        className="w-full px-2 py-1 border border-blue-300 rounded text-xs text-center focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={editForm.currentDotation}
                        onChange={(e) => setEditForm(prev => ({ ...prev, currentDotation: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-2 py-1 border border-blue-300 rounded text-xs text-right focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={editForm.committedValue}
                        onChange={(e) => setEditForm(prev => ({ ...prev, committedValue: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-2 py-1 border border-blue-300 rounded text-xs text-right focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-bold text-slate-500">
                      {formatBRL((editForm.currentDotation || 0) - (editForm.committedValue || 0))}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => handleSaveEdit(item.id)} className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700">
                          <Check size={14} />
                        </button>
                        <button onClick={handleCancelEdit} className="p-1.5 bg-slate-200 text-slate-600 rounded hover:bg-slate-300">
                          <X size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Building2 size={14} className="text-slate-400" />
                      <div>
                        <p className="text-sm font-bold text-slate-700">{item.unitName}</p>
                        {item.shortName && <p className="text-[10px] text-slate-400">{item.shortName}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-slate-400" />
                      <span className="text-xs font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">{item.expenseElement || '-'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                   <div className="flex items-center justify-center gap-1">
                      <Hash size={12} className="text-slate-300" />
                      <span className="text-xs font-mono text-slate-600">{item.dotationNumber || '-'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-bold text-slate-700">{formatBRL(item.currentDotation)}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm text-slate-600">{formatBRL(item.committedValue)}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-sm font-bold ${available < 0 ? 'text-red-600' : 'text-teal-600'}`}>
                      {formatBRL(available)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => handleStartEdit(item)}
                        className="p-1.5 opacity-0 group-hover:opacity-100 bg-slate-100 text-slate-500 rounded hover:bg-blue-50 hover:text-blue-600 transition-all"
                      >
                        <Edit3 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                  <Building2 size={32} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-medium">Nenhum item encontrado</p>
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
