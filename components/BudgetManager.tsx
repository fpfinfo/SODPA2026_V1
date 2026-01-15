import React, { useState } from 'react';
import { AnnualBudget, Process, ProcessType, ConcessionStatus, BudgetDistribution, ProcessItem, AdminBudget, BudgetRule } from '../types';
import { MOCK_BUDGET_MATRIX, MOCK_ADMIN_BUDGETS, MOCK_BUDGET_RULES } from '../constants';
import { useBudgetData } from '../hooks/useBudgetData';
import { useComarcasBudget } from '../hooks/useComarcasBudget';
import { BudgetDistributionMatrix } from './BudgetDistributionMatrix';
import { BudgetMatrixConfig } from './BudgetMatrixConfig';
import { ComarcaBudgetMatrix } from './ComarcaBudgetMatrix';
import { BatchGenerationWizard } from './BatchGenerationWizard';
import { BatchSigningPanel } from './BatchSigningPanel';
import { 
  Wallet, 
  TrendingUp, 
  PieChart, 
  Zap, 
  PlusCircle, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Users, 
  ArrowRight,
  Calculator,
  Loader2,
  Table,
  Settings,
  Database,
  FileSignature,
  Send,
  MapPin,
  Package,
  CalendarRange,
} from 'lucide-react';

const BRASAO_TJPA_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/217479058_brasao-tjpa.png';

interface BudgetManagerProps {
  budget: AnnualBudget;
  onLaunchBatch: (newProcesses: Process[], totalValue: number) => void;
}

export const BudgetManager: React.FC<BudgetManagerProps> = ({ budget, onLaunchBatch }) => {
  // Use Supabase hooks
  const { rules: budgetRulesFromDb } = useBudgetData();
  const { comarcas: comarcasFromDb } = useComarcasBudget();
  
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showMatrix, setShowMatrix] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [subTab, setSubTab] = useState<'OVERVIEW' | 'MATRIZ' | 'GERAR' | 'ASSINATURA'>('OVERVIEW');
  
  // State for distributions (Comarcas), Admin Budgets, and Rules - use Supabase data or fallback
  const [distributions, setDistributions] = useState<BudgetDistribution[]>(MOCK_BUDGET_MATRIX);
  const [adminBudgets, setAdminBudgets] = useState<AdminBudget[]>(MOCK_ADMIN_BUDGETS);
  const [budgetRules, setBudgetRules] = useState<BudgetRule[]>(budgetRulesFromDb.length > 0 ? budgetRulesFromDb : MOCK_BUDGET_RULES);
  
  const [batchConfig, setBatchConfig] = useState({
    period: '1º Quadrimestre/2026',
    description: 'Suprimento Ordinário - Custeio de Despesas de Pequeno Vulto - Período Regimental'
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const formatPercent = (val: number, total: number) => ((val / total) * 100).toFixed(1) + '%';

  // Calculate totals based on global budget passed as prop
  const totalExecuted = budget.executedOrdinary + budget.executedExtraordinary;
  const balance = budget.totalCap - totalExecuted;
  
  // Calculate Batch Total based on comarcas from Supabase
  const comarcasToUse = comarcasFromDb.length > 0 ? comarcasFromDb : [];
  const calculateBatchTotal = () => {
      let total = 0;
      comarcasToUse.forEach(comarca => {
          total += (comarca.teto_anual / 3);
      });
      return total;
  };

  const batchTotal = calculateBatchTotal();

  const handleGenerateOficio = () => {
    setIsProcessing(true);
    setTimeout(() => {
        // Na prática, aqui seria criado um objeto Process do tipo "BATCH_PROGRAMMING" enviado à SEPLAN
        // Para fins de demo, apenas notificamos
        alert(`Ofício de Programação de Pagamento gerado com sucesso!\n\nValor Total: ${formatCurrency(batchTotal)}\nDestino: Ordenador de Despesa (SEPLAN)\n\nApós a assinatura do Ordenador, a opção 'Gerar Portarias em Lote' ficará disponível.`);
        setIsProcessing(false);
        setShowBatchModal(false);
        setWizardStep(1);
    }, 1500);
  };

  return (
    <>
    {/* Sub-Tab Navigation */}
    <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-2xl w-fit">
      <button
        onClick={() => setSubTab('OVERVIEW')}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
          subTab === 'OVERVIEW' ? 'bg-white shadow-md text-slate-800' : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        <CalendarRange size={16} />
        Visão Geral
      </button>
      <button
        onClick={() => setSubTab('MATRIZ')}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
          subTab === 'MATRIZ' ? 'bg-white shadow-md text-slate-800' : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        <MapPin size={16} />
        Matriz Comarcas
      </button>
      <button
        onClick={() => setSubTab('GERAR')}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
          subTab === 'GERAR' ? 'bg-white shadow-md text-slate-800' : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        <Package size={16} />
        Gerar Lote
      </button>
      <button
        onClick={() => setSubTab('ASSINATURA')}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
          subTab === 'ASSINATURA' ? 'bg-white shadow-md text-slate-800' : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        <FileSignature size={16} />
        Assinatura Lotes
      </button>
    </div>

    {/* Sub-Tab Content */}
    {subTab === 'MATRIZ' ? (
      <ComarcaBudgetMatrix />
    ) : subTab === 'GERAR' ? (
      <div className="bg-white rounded-2xl border border-slate-200 p-8">
        <div className="text-center mb-8">
          <Package size={48} className="mx-auto text-blue-500 mb-4" />
          <h3 className="text-xl font-black text-slate-800">Gerar Lote Quadrimestral</h3>
          <p className="text-sm text-slate-500">Inicie o assistente para gerar 144 processos de suprimento ordinário</p>
        </div>
        <div className="flex justify-center">
          <button
            onClick={() => setShowBatchModal(true)}
            className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-black uppercase tracking-wider shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all"
          >
            <Package size={20} />
            Iniciar Wizard de Geração
          </button>
        </div>
      </div>
    ) : subTab === 'ASSINATURA' ? (
      <BatchSigningPanel />
    ) : (
      <>
    {/* Matrix Modal */}
    {showMatrix && (
        <BudgetDistributionMatrix 
            distributions={distributions}
            adminBudgets={adminBudgets}
            onSave={(newDist, newAdmin) => { 
                setDistributions(newDist); 
                setAdminBudgets(newAdmin);
                setShowMatrix(false); 
            }}
            onClose={() => setShowMatrix(false)}
        />
    )}

    {/* Rules Config Modal */}
    {showConfig && (
        <BudgetMatrixConfig 
            rules={budgetRules}
            onSave={(newRules) => {
                setBudgetRules(newRules);
                setShowConfig(false);
            }}
            onClose={() => setShowConfig(false)}
        />
    )}

    {/* Batch Modal (Fluxo do Ofício) */}
    {showBatchModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowBatchModal(false)}></div>
            
            <div className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col h-[90vh]">
                <div className="bg-slate-900 px-8 py-6 flex justify-between items-center text-white shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 rounded-xl"><Zap size={24}/></div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tight">Programação de Pagamento Ordinário</h2>
                            <p className="text-xs text-slate-400 font-medium">Fluxo 1: Elaboração e Autorização do Ordenador</p>
                        </div>
                    </div>
                    <button onClick={() => setShowBatchModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20}/></button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {wizardStep === 1 ? (
                        <div className="space-y-8">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Referência Temporal</label>
                                        <select 
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700"
                                            value={batchConfig.period}
                                            onChange={e => setBatchConfig({...batchConfig, period: e.target.value})}
                                        >
                                            <option>1º Quadrimestre/2026</option>
                                            <option>2º Quadrimestre/2026</option>
                                            <option>3º Quadrimestre/2026</option>
                                        </select>
                                    </div>
                                    
                                    <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl">
                                        <h4 className="font-black text-blue-800 text-sm mb-2 flex items-center gap-2"><Calculator size={16}/> Resumo do Lote</h4>
                                        <div className="space-y-2 text-sm text-blue-900">
                                            <div className="flex justify-between">
                                                <span>Unidades Beneficiadas:</span>
                                                <span className="font-bold">{comarcasToUse.length} Comarcas</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Valor Total Previsto:</span>
                                                <span className="font-bold">{formatCurrency(batchTotal)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Saldo Disponível:</span>
                                                <span className={`font-bold ${balance < batchTotal ? 'text-red-600' : 'text-emerald-600'}`}>{formatCurrency(balance)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button onClick={() => { setShowBatchModal(false); setShowMatrix(true); }} className="flex-1 p-4 bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center hover:bg-slate-50 transition-colors group gap-2">
                                            <Table size={24} className="text-slate-400 group-hover:text-blue-600"/>
                                            <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700">Ajustar Matriz de Valores</span>
                                        </button>
                                        <button onClick={() => { setShowBatchModal(false); setShowConfig(true); }} className="flex-1 p-4 bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center hover:bg-slate-50 transition-colors group gap-2">
                                            <Database size={24} className="text-slate-400 group-hover:text-indigo-600"/>
                                            <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700">Regras de Execução</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 overflow-hidden flex flex-col">
                                    <h4 className="font-black text-slate-700 text-xs uppercase tracking-widest mb-4">Prévia da Distribuição</h4>
                                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                                        <table className="w-full text-xs">
                                            <thead className="text-slate-400 font-bold uppercase text-[10px]">
                                                <tr>
                                                    <th className="text-left pb-2">Comarca</th>
                                                    <th className="text-right pb-2">Valor</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200">
                                                {comarcasToUse.map(c => {
                                                    const val = c.teto_anual / 3;
                                                    return (
                                                        <tr key={c.id}>
                                                            <td className="py-2 text-slate-600">{c.comarca_nome}</td>
                                                            <td className="py-2 text-right font-medium">{formatCurrency(val)}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full">
                            <div className="flex-1 bg-white shadow-xl border border-slate-200 p-12 mb-6 overflow-y-auto custom-scrollbar">
                                {/* Visualização do Ofício */}
                                <div className="max-w-2xl mx-auto font-serif text-slate-900 leading-relaxed">
                                    <div className="text-center mb-8 opacity-80">
                                        <img src={BRASAO_TJPA_URL} className="w-20 mx-auto mb-4 grayscale" />
                                        <h3 className="font-bold text-sm uppercase">Poder Judiciário do Estado do Pará</h3>
                                        <p className="text-xs uppercase tracking-widest">Serviço de Suprimento de Fundos - SOSFU</p>
                                    </div>
                                    
                                    <p className="text-right mb-8">Belém, {new Date().toLocaleDateString('pt-BR')}</p>
                                    <p className="font-bold mb-6">Ofício nº {Math.floor(Math.random() * 1000)}/2026-SOSFU</p>
                                    <p className="mb-6"><strong>Ao Sr. Secretário de Planejamento, Coordenação e Finanças</strong></p>
                                    
                                    <p className="mb-4 text-justify">
                                        Senhor Secretário,
                                    </p>
                                    <p className="mb-4 text-justify">
                                        Cumprimentando-o cordialmente, encaminho a Vossa Senhoria a <strong>Programação de Pagamento de Suprimento de Fundos Ordinário</strong> referente ao <strong>{batchConfig.period}</strong>, destinada ao custeio de despesas de pequeno vulto das unidades judiciárias deste Tribunal.
                                    </p>
                                    <p className="mb-4 text-justify">
                                        O montante total a ser descentralizado perfaz o valor de <strong>{formatCurrency(batchTotal)}</strong>, distribuído entre {comarcasToUse.length} comarcas, conforme detalhamento anexo e saldo orçamentário disponível na Ação 8193.
                                    </p>
                                    <p className="mb-8 text-justify">
                                        Sendo o que se apresenta para o momento, submeto à vossa apreciação para autorização e posterior emissão das Portarias e Notas de Empenho.
                                    </p>
                                    
                                    <div className="text-center mt-12">
                                        <div className="w-64 h-px bg-black mx-auto mb-2"></div>
                                        <p className="font-bold uppercase text-sm">Chefe da SOSFU</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-8 py-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
                    {wizardStep === 1 ? (
                        <>
                            <div className="text-xs text-slate-500">Passo 1 de 2: Revisão de Valores</div>
                            <button 
                                onClick={() => setWizardStep(2)} 
                                disabled={balance < batchTotal}
                                className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg transition-all ${balance < batchTotal ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                            >
                                Gerar Minuta do Ofício <ArrowRight size={16}/>
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => setWizardStep(1)} className="text-xs font-bold text-slate-500 hover:text-slate-800">Voltar para Revisão</button>
                            <button 
                                onClick={handleGenerateOficio} 
                                disabled={isProcessing}
                                className="px-8 py-3 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all flex items-center gap-2"
                            >
                                {isProcessing ? <Loader2 size={16} className="animate-spin"/> : <Send size={16}/>}
                                Enviar para Autorização (SEPLAN)
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    )}

    <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm mb-6">
      
      <div className="flex flex-col lg:flex-row justify-between items-end gap-6">
        {/* Left: Main KPI */}
        <div className="flex items-center gap-6 flex-1">
            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-emerald-400 shadow-xl">
                <Wallet size={32} />
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                    Teto Orçamentário Global <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[9px]">{budget.year}</span>
                </p>
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter">{formatCurrency(budget.totalCap)}</h2>
                <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                        <span className="text-xs font-bold text-slate-600">Ordinário: {formatPercent(budget.executedOrdinary, budget.totalCap)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                        <span className="text-xs font-bold text-slate-600">Extra: {formatPercent(budget.executedExtraordinary, budget.totalCap)}</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Center: Progress Bar */}
        <div className="flex-1 w-full lg:max-w-md">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                <span>Execução Global</span>
                <span>Saldo: {formatCurrency(balance)}</span>
            </div>
            <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200">
                <div style={{ width: `${(budget.executedOrdinary / budget.totalCap) * 100}%` }} className="h-full bg-blue-600 relative group" title={`Ordinário: ${formatCurrency(budget.executedOrdinary)}`}></div>
                <div style={{ width: `${(budget.executedExtraordinary / budget.totalCap) * 100}%` }} className="h-full bg-amber-500 relative group" title={`Extraordinário: ${formatCurrency(budget.executedExtraordinary)}`}></div>
            </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-col gap-2">
            <div className="flex gap-2">
                <button 
                    onClick={() => setShowMatrix(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                    <Table size={14} /> Valores
                </button>
                <button 
                    onClick={() => setShowConfig(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                    <Settings size={14} /> Regras
                </button>
            </div>
            <button 
                onClick={() => setShowBatchModal(true)}
                className="flex items-center justify-center gap-3 px-6 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all hover:-translate-y-1 active:scale-95"
            >
                <FileSignature size={18} className="text-yellow-400" />
                Criar Programação Ordinária
            </button>
        </div>
      </div>
    </div>
    </>
    )}
    </>
  );
};
