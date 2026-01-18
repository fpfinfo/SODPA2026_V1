/**
 * Comarca Budget Matrix Component
 * Grid for managing 144 comarcas with annual budget and element distribution
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Search,
  MapPin,
  Save,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  UserX,
  Edit3,
  Check,
  X,
  Info,
  DollarSign,
  Percent,
  Download,
  Upload,
  Loader2,
} from 'lucide-react';
import {
  ComarcaBudget,
  ElementDistribution,
  formatCurrency,
  validateDistribution,
} from '../types/batch';
import { useComarcasBudget } from '../hooks/useComarcasBudget';

interface ComarcaBudgetMatrixProps {
  onSave?: (comarcas: ComarcaBudget[]) => Promise<void>;
}

const ELEMENT_LABELS: Record<keyof ElementDistribution, { code: string; name: string }> = {
  element_30_01: { code: '30.01', name: 'Combustível' },
  element_30_02: { code: '30.02', name: 'Mat. Consumo' },
  element_33: { code: '33', name: 'Passagens' },
  element_36: { code: '36', name: 'Serv. PF' },
  element_39: { code: '39', name: 'Serv. PJ' },
};

export const ComarcaBudgetMatrix: React.FC<ComarcaBudgetMatrixProps> = ({ onSave }) => {
  // Use Supabase hook for comarcas
  const { comarcas: supabaseComarcas, isLoading: loadingComarcas, updateComarcaBudget, refresh } = useComarcasBudget();
  
  const [comarcas, setComarcas] = useState<ComarcaBudget[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ teto: number; dist: ElementDistribution } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'REGULAR' | 'PENDENTE' | 'SEM_SUPRIDO'>('ALL');
  
  // Sync from Supabase
  useEffect(() => {
    if (supabaseComarcas.length > 0) {
      setComarcas(supabaseComarcas);
    }
  }, [supabaseComarcas]);

  // Filter comarcas
  const filteredComarcas = useMemo(() => {
    let result = comarcas;
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(c => 
        c.comarca_nome.toLowerCase().includes(term) ||
        c.comarca_codigo.toLowerCase().includes(term) ||
        c.suprido_nome?.toLowerCase().includes(term)
      );
    }
    
    if (filterStatus !== 'ALL') {
      result = result.filter(c => c.status === filterStatus);
    }
    
    return result;
  }, [comarcas, searchTerm, filterStatus]);

  // Calculate totals
  const totals = useMemo(() => {
    return comarcas.reduce((acc, c) => ({
      teto: acc.teto + c.teto_anual,
      regular: acc.regular + (c.status === 'REGULAR' ? 1 : 0),
      pendente: acc.pendente + (c.status === 'PENDENTE' ? 1 : 0),
      semSuprido: acc.semSuprido + (c.status === 'SEM_SUPRIDO' ? 1 : 0),
    }), { teto: 0, regular: 0, pendente: 0, semSuprido: 0 });
  }, [comarcas]);

  const getStatusBadge = (status: ComarcaBudget['status']) => {
    switch (status) {
      case 'REGULAR':
        return <span className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full"><CheckCircle size={12} /> Regular</span>;
      case 'PENDENTE':
        return <span className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full"><AlertTriangle size={12} /> Pendente</span>;
      case 'SEM_SUPRIDO':
        return <span className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 text-[10px] font-bold rounded-full"><UserX size={12} /> Sem Suprido</span>;
      case 'BLOQUEADO':
        return <span className="flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-full"><AlertCircle size={12} /> Bloqueado</span>;
    }
  };

  const handleStartEdit = (comarca: ComarcaBudget) => {
    setEditingId(comarca.id);
    setEditValues({ teto: comarca.teto_anual, dist: { ...comarca.distribuicao } });
  };

  const handleSaveEdit = (id: string) => {
    if (!editValues) return;
    
    if (!validateDistribution(editValues.dist)) {
      setMessage({ type: 'error', text: 'A soma das porcentagens deve ser 100%' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    
    setComarcas(prev => prev.map(c => 
      c.id === id ? { ...c, teto_anual: editValues.teto, distribuicao: editValues.dist } : c
    ));
    setEditingId(null);
    setEditValues(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValues(null);
  };

  const handleDistChange = (key: keyof ElementDistribution, value: number) => {
    if (!editValues) return;
    setEditValues(prev => prev ? { ...prev, dist: { ...prev.dist, [key]: value } } : null);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      localStorage.setItem('comarca_budget_matrix', JSON.stringify(comarcas));
      if (onSave) await onSave(comarcas);
      setMessage({ type: 'success', text: 'Matriz salva com sucesso!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao salvar.' });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  // Load from localStorage
  React.useEffect(() => {
    const saved = localStorage.getItem('comarca_budget_matrix');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ComarcaBudget[];
        if (parsed.length > 0) setComarcas(parsed);
      } catch (e) {}
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <MapPin size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800">Matriz de Valores por Comarca</h3>
              <p className="text-xs text-slate-500">Defina o teto anual e a distribuição por elemento de despesa</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar comarca..."
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
              />
            </div>

            {/* Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Todos ({comarcas.length})</option>
              <option value="REGULAR">Regulares ({totals.regular})</option>
              <option value="PENDENTE">Pendentes ({totals.pendente})</option>
              <option value="SEM_SUPRIDO">Sem Suprido ({totals.semSuprido})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Comarcas</p>
          <p className="text-2xl font-black text-slate-800">{comarcas.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Teto Anual Global</p>
          <p className="text-2xl font-black text-blue-600">{formatCurrency(totals.teto)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Por Quadrimestre</p>
          <p className="text-2xl font-black text-emerald-600">{formatCurrency(totals.teto / 3)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Regulares</p>
          <p className="text-2xl font-black text-emerald-600">{totals.regular}</p>
          <p className="text-xs text-slate-500">{((totals.regular / comarcas.length) * 100).toFixed(0)}% do total</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest w-64">
                  Comarca
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest w-40">
                  Suprido
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest w-32">
                  Teto Anual
                </th>
                {Object.entries(ELEMENT_LABELS).map(([key, { code }]) => (
                  <th key={key} className="px-2 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest w-16">
                    {code}
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest w-24">
                  Status
                </th>
                <th className="px-4 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest w-16">
                  Ação
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredComarcas.map((comarca) => {
                const isEditing = editingId === comarca.id;
                const distTotal = isEditing && editValues ? 
                  (Object.values(editValues.dist) as number[]).reduce((a, b) => a + b, 0) : 
                  (Object.values(comarca.distribuicao) as number[]).reduce((a, b) => a + b, 0);
                const distValid = Math.abs(distTotal - 100) < 0.01;

                return (
                  <tr key={comarca.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-bold text-slate-700">{comarca.comarca_nome}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{comarca.comarca_codigo}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {comarca.suprido_nome ? (
                        <div>
                          <p className="text-xs font-medium text-slate-700">{comarca.suprido_nome}</p>
                          <p className="text-[10px] text-slate-400">{comarca.suprido_cpf}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-red-500 italic">Não cadastrado</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isEditing && editValues ? (
                        <input
                          type="number"
                          value={editValues.teto}
                          onChange={(e) => setEditValues(prev => prev ? { ...prev, teto: parseFloat(e.target.value) || 0 } : null)}
                          className="w-28 px-2 py-1 border border-blue-300 rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="text-sm font-bold text-slate-700">{formatCurrency(comarca.teto_anual)}</span>
                      )}
                    </td>
                    {Object.keys(ELEMENT_LABELS).map((key) => {
                      const k = key as keyof ElementDistribution;
                      return (
                        <td key={key} className="px-2 py-3 text-center">
                          {isEditing && editValues ? (
                            <input
                              type="number"
                              value={editValues.dist[k]}
                              onChange={(e) => handleDistChange(k, parseFloat(e.target.value) || 0)}
                              className={`w-14 px-1 py-1 border rounded text-xs text-center focus:outline-none focus:ring-2 ${
                                distValid ? 'border-slate-200 focus:ring-blue-500' : 'border-red-300 focus:ring-red-500'
                              }`}
                              min={0}
                              max={100}
                              step={5}
                            />
                          ) : (
                            <span className="text-xs text-slate-600">{comarca.distribuicao[k]}%</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-center">
                      {getStatusBadge(comarca.status)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleSaveEdit(comarca.id)}
                            className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1.5 bg-slate-200 text-slate-600 rounded hover:bg-slate-300"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStartEdit(comarca)}
                          className="p-1.5 opacity-0 group-hover:opacity-100 bg-slate-100 text-slate-500 rounded hover:bg-blue-100 hover:text-blue-600 transition-all"
                        >
                          <Edit3 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-4">
        {message && (
          <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg ${
            message.type === 'success' 
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
            <span className="text-sm font-bold">{message.text}</span>
          </div>
        )}
        
        <div className="flex justify-end gap-4">
          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-black uppercase tracking-wider shadow-lg hover:bg-blue-700 transition-colors"
          >
            {isSaving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
            {isSaving ? 'Salvando...' : 'Salvar Matriz'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComarcaBudgetMatrix;
