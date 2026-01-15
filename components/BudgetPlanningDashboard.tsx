/**
 * Budget Planning Dashboard
 * Visual interface for PTRES-based budget allocation
 * Hierarchy: Global Cap → PTRES → Dotação → Elemento
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  Wallet,
  ChevronDown,
  ChevronUp,
  Save,
  AlertTriangle,
  CheckCircle,
  Info,
  DollarSign,
  Edit3,
  PieChart,
  Briefcase,
  Scale,
  Gavel,
  Zap,
  RefreshCw,
  Building2,
  Landmark,
} from 'lucide-react';
import {
  BudgetPlanConfig,
  PtresAllocation,
  DotacaoItem,
  PTRES_CONFIG,
  EXPENSE_ELEMENTS,
  PtresCode,
  createDefaultBudgetPlan,
  calculateBudgetValues,
  formatBRL,
  parseBRL,
} from '../types/budgetPlanning';
import { AdminBudgetTable } from './AdminBudgetTable';

interface BudgetPlanningDashboardProps {
  initialConfig?: BudgetPlanConfig;
  onSave?: (config: BudgetPlanConfig) => Promise<void>;
}

export const BudgetPlanningDashboard: React.FC<BudgetPlanningDashboardProps> = ({
  initialConfig,
  onSave,
}) => {
  const [config, setConfig] = useState<BudgetPlanConfig>(
    initialConfig || createDefaultBudgetPlan(2026)
  );
  const [expandedPtres, setExpandedPtres] = useState<Set<PtresCode>>(new Set(['8193']));
  const [isSaving, setIsSaving] = useState(false);
  const [editingTotal, setEditingTotal] = useState(false);
  const [tempTotal, setTempTotal] = useState('');
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'PTRES' | 'ADMIN'>('PTRES');

  const computed = useMemo(() => calculateBudgetValues(config), [config]);

  const togglePtres = useCallback((code: PtresCode) => {
    setExpandedPtres(prev => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }, []);

  const handleTotalBudgetChange = useCallback(() => {
    const newValue = parseBRL(tempTotal);
    if (newValue > 0) {
      setConfig(prev => ({ ...prev, total_budget: newValue }));
    }
    setEditingTotal(false);
  }, [tempTotal]);

  const handleDotacaoCodeChange = useCallback((ptresCode: PtresCode, elementCode: string, newCode: string) => {
    setConfig(prev => ({
      ...prev,
      allocations: prev.allocations.map(alloc =>
        alloc.ptres_code === ptresCode
          ? {
              ...alloc,
              items: alloc.items.map(item =>
                item.element_code === elementCode
                  ? { ...item, dotacao_code: newCode }
                  : item
              ),
            }
          : alloc
      ),
    }));
  }, []);

  const handleValueChange = useCallback((ptresCode: PtresCode, elementCode: string, value: number) => {
    setConfig(prev => ({
      ...prev,
      allocations: prev.allocations.map(alloc =>
        alloc.ptres_code === ptresCode
          ? {
              ...alloc,
              items: alloc.items.map(item =>
                item.element_code === elementCode
                  ? { ...item, allocated_value: value }
                  : item
              ),
            }
          : alloc
      ),
    }));
  }, []);

  const handleReset = useCallback(() => {
    if (confirm('Tem certeza que deseja resetar todos os valores? Esta ação não pode ser desfeita.')) {
      setConfig(createDefaultBudgetPlan(config.year));
      setSaveMessage({ type: 'success', text: 'Valores resetados com sucesso!' });
      setTimeout(() => setSaveMessage(null), 3000);
    }
  }, [config.year]);

  const handleSave = async () => {
    if (computed.is_over_budget) {
      setSaveMessage({ type: 'error', text: 'Não é possível salvar: O orçamento distribuído excede o teto global!' });
      setTimeout(() => setSaveMessage(null), 5000);
      return;
    }
    
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      // Try external save handler first
      if (onSave) {
        await onSave(config);
      }
      
      // Save to localStorage as backup
      localStorage.setItem('budget_plan_config', JSON.stringify(config));
      
      setSaveMessage({ type: 'success', text: 'Planejamento salvo com sucesso!' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('[BudgetPlanningDashboard] Save error:', error);
      setSaveMessage({ type: 'error', text: 'Erro ao salvar. Tente novamente.' });
      setTimeout(() => setSaveMessage(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  // Load from localStorage on mount
  React.useEffect(() => {
    if (!initialConfig) {
      const saved = localStorage.getItem('budget_plan_config');
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as BudgetPlanConfig;
          if (parsed.year === 2026) {
            setConfig(parsed);
          }
        } catch (e) {
          console.warn('[BudgetPlanningDashboard] Failed to parse saved config');
        }
      }
    }
  }, [initialConfig]);

  const getPtresIcon = (code: PtresCode) => {
    switch (code) {
      case '8193': return <Briefcase size={24} />;
      case '8727': return <Zap size={24} />;
      case '8163': return <Gavel size={24} />;
    }
  };

  const getPtresColor = (code: PtresCode) => {
    switch (code) {
      case '8193': return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', accent: 'bg-blue-600' };
      case '8727': return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', accent: 'bg-amber-500' };
      case '8163': return { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600', accent: 'bg-purple-600' };
    }
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar pb-10 space-y-8">
      {/* === HEADER: Budget Cap Control === */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[32px] p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Wallet size={28} className="text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">
                  Planejamento Orçamentário {config.year}
                </p>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  Teto Global de Suprimento de Fundos
                </h2>
              </div>
            </div>

            {/* Total Budget Input */}
            <div className="flex items-center gap-4">
              {editingTotal ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tempTotal}
                    onChange={(e) => setTempTotal(e.target.value)}
                    placeholder="6.000.000,00"
                    className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-xl font-bold w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleTotalBudgetChange()}
                    autoFocus
                  />
                  <button
                    onClick={handleTotalBudgetChange}
                    className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors"
                  >
                    <CheckCircle size={20} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setTempTotal(String(config.total_budget)); setEditingTotal(true); }}
                  className="flex items-center gap-3 px-6 py-3 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-colors group"
                >
                  <span className="text-3xl font-black text-white">{formatBRL(config.total_budget)}</span>
                  <Edit3 size={18} className="text-white/50 group-hover:text-white transition-colors" />
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-white/60 font-medium">Distribuição Orçamentária</span>
              <span className={`font-black ${computed.is_over_budget ? 'text-red-400' : 'text-emerald-400'}`}>
                {computed.percentage_used.toFixed(1)}% Alocado
              </span>
            </div>
            
            <div className="h-4 bg-white/10 rounded-full overflow-hidden relative">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  computed.is_over_budget
                    ? 'bg-gradient-to-r from-red-500 to-red-400'
                    : 'bg-gradient-to-r from-blue-600 via-emerald-500 to-emerald-400'
                }`}
                style={{ width: `${Math.min(computed.percentage_used, 100)}%` }}
              />
              {computed.is_over_budget && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] font-black text-white uppercase tracking-wider animate-pulse">
                    ESTOURO DE ORÇAMENTO!
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-between text-xs font-bold">
              <span className={computed.is_over_budget ? 'text-red-400' : 'text-white'}>
                {formatBRL(computed.total_distributed)} Distribuído
              </span>
              <span className={computed.remaining < 0 ? 'text-red-400' : 'text-emerald-400'}>
                {formatBRL(computed.remaining)} Restante
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* === TAB NAVIGATION === */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('PTRES')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'PTRES'
              ? 'bg-white shadow-md text-slate-800'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Landmark size={18} />
          Comarcas (Jurisdicional)
        </button>
        <button
          onClick={() => setActiveTab('ADMIN')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'ADMIN'
              ? 'bg-white shadow-md text-slate-800'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Building2 size={18} />
          Unidades Admin.
        </button>
      </div>

      {/* === TAB CONTENT === */}
      {activeTab === 'ADMIN' ? (
        <AdminBudgetTable
          units={[]}
          onUpdateUnit={() => {}}
          onAddUnit={() => {}}
        />
      ) : (
        <>
          {/* === ALERT if over budget === */}
      {computed.is_over_budget && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 flex items-start gap-4 animate-pulse">
          <AlertTriangle size={24} className="text-red-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-black text-red-800 uppercase tracking-wide mb-1">
              Orçamento Excedido
            </h4>
            <p className="text-xs text-red-700 leading-relaxed">
              A soma dos valores distribuídos ({formatBRL(computed.total_distributed)}) excede o teto global 
              ({formatBRL(config.total_budget)}) em <strong>{formatBRL(Math.abs(computed.remaining))}</strong>. 
              Ajuste os valores antes de salvar.
            </p>
          </div>
        </div>
      )}

      {/* === PTRES CARDS === */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
            <PieChart size={20} className="text-slate-400" />
            Distribuição por PTRES
          </h3>
          <button
            onClick={() => setExpandedPtres(new Set(['8193', '8727', '8163']))}
            className="text-xs font-bold text-blue-600 hover:underline"
          >
            Expandir Todos
          </button>
        </div>

        {config.allocations.map((allocation) => {
          const ptresCode = allocation.ptres_code as PtresCode;
          const colors = getPtresColor(ptresCode);
          const ptresValues = computed.ptres_values[ptresCode];
          const isExpanded = expandedPtres.has(ptresCode);

          return (
            <div
              key={ptresCode}
              className={`rounded-[24px] border-2 ${colors.border} overflow-hidden transition-all duration-300 ${
                isExpanded ? 'shadow-xl' : 'shadow-sm hover:shadow-lg'
              }`}
            >
              {/* Card Header */}
              <button
                onClick={() => togglePtres(ptresCode)}
                className={`w-full ${colors.bg} p-6 flex items-center justify-between transition-colors`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 ${colors.accent} rounded-2xl flex items-center justify-center text-white shadow-lg`}>
                    {getPtresIcon(ptresCode)}
                  </div>
                  <div className="text-left">
                    <p className={`text-[10px] font-black ${colors.text} uppercase tracking-widest mb-0.5`}>
                      PTRES {ptresCode}
                    </p>
                    <h4 className="text-lg font-black text-slate-800">{PTRES_CONFIG[ptresCode].name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{PTRES_CONFIG[ptresCode].description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* Mini Stats */}
                  <div className="text-right hidden md:block">
                    <p className="text-2xl font-black text-slate-800">{formatBRL(ptresValues?.total_allocated || 0)}</p>
                    <p className={`text-xs font-bold ${colors.text}`}>
                      {(ptresValues?.percentage_of_global || 0).toFixed(1)}% do Global
                    </p>
                  </div>

                  {/* Mini Donut */}
                  <div className="w-12 h-12 relative hidden lg:block">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                      <circle
                        cx="18" cy="18" r="14"
                        fill="none"
                        stroke={colors.accent.replace('bg-', '#').replace('-600', '').replace('-500', '')}
                        strokeWidth="4"
                        strokeDasharray={`${(ptresValues?.percentage_of_global || 0) * 0.88} 88`}
                        className="transition-all duration-500"
                        style={{ stroke: ptresCode === '8193' ? '#2563eb' : ptresCode === '8727' ? '#f59e0b' : '#9333ea' }}
                      />
                    </svg>
                  </div>

                  {/* Expand Icon */}
                  <div className={`p-2 rounded-xl ${isExpanded ? 'bg-slate-200' : 'bg-white'} transition-colors`}>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>
              </button>

              {/* Expanded Content - Dotação Matrix */}
              {isExpanded && (
                <div className="bg-white p-6 border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/3">
                          Elemento de Despesa
                        </th>
                        <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest w-32">
                          Nº Dotação
                        </th>
                        <th className="px-4 py-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest w-48">
                          Valor Alocado (R$)
                        </th>
                        <th className="px-4 py-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest w-24">
                          % PTRES
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {allocation.items.map((item) => {
                        const elementConfig = EXPENSE_ELEMENTS.find(e => e.code === item.element_code);
                        const itemBreakdown = ptresValues?.items_breakdown.find(b => b.element_code === item.element_code);

                        return (
                          <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-4">
                              <div className="flex items-start gap-2">
                                <div>
                                  <p className="text-sm font-bold text-slate-700">{item.element_code}</p>
                                  <p className="text-xs text-slate-500">{item.element_name}</p>
                                  {elementConfig?.tooltip && (
                                    <div className="flex items-center gap-1 mt-1">
                                      <Info size={12} className="text-blue-500" />
                                      <span className="text-[10px] text-blue-600 italic">{elementConfig.tooltip}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <input
                                type="text"
                                value={item.dotacao_code}
                                onChange={(e) => handleDotacaoCodeChange(ptresCode, item.element_code, e.target.value)}
                                className="w-24 px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono font-bold text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="170"
                              />
                            </td>
                            <td className="px-4 py-4">
                              <div className="relative">
                                <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                  type="number"
                                  value={item.allocated_value || ''}
                                  onChange={(e) => handleValueChange(ptresCode, item.element_code, parseFloat(e.target.value) || 0)}
                                  className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="0,00"
                                  step="100"
                                />
                              </div>
                            </td>
                            <td className="px-4 py-4 text-right">
                              <span className={`text-sm font-black ${
                                (itemBreakdown?.percentage || 0) > 50 ? colors.text : 'text-slate-600'
                              }`}>
                                {(itemBreakdown?.percentage || 0).toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 border-t-2 border-slate-200">
                        <td colSpan={2} className="px-4 py-4 text-sm font-black text-slate-700 uppercase tracking-wider">
                          Total do PTRES
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className={`text-lg font-black ${colors.text}`}>
                            {formatBRL(ptresValues?.total_allocated || 0)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="text-sm font-black text-slate-600">100%</span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* === SAVE BUTTON === */}
      <div className="flex flex-col gap-4 pt-4">
        {/* Save/Error Message Toast */}
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
            onClick={handleReset}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw size={18} />
            Resetar Valores
          </button>
        <button
          onClick={handleSave}
          disabled={computed.is_over_budget || isSaving}
          className={`flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-black uppercase tracking-wider shadow-lg transition-all ${
            computed.is_over_budget
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
          }`}
        >
          {isSaving ? (
            <>
              <RefreshCw size={18} className="animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save size={18} />
              Salvar Planejamento
            </>
          )}
        </button>
        </div>
      </div>
      </>
      )}
    </div>
  );
};

export default BudgetPlanningDashboard;
