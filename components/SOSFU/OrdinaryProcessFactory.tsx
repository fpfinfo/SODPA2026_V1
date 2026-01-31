import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
  Factory,
  Play,
  CheckSquare,
  Square,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Calendar,
  DollarSign,
  Building2,
  Filter,
  Calculator,
  X,
  Save,
  AlertTriangle,
  FileText,
  UserPlus
} from 'lucide-react';
import { useToast } from '../ui/ToastProvider';
import { TitularAssignmentModal } from './TitularAssignmentModal';

// Types
interface ExpenseDistribution {
  '30.01': number; // Consumo em Geral
  '30.02': number; // Combustíveis e Lubrificantes
  '33': number; // Transporte
  '36': number; // PF
  '39': number; // PJ
}

interface UnidadeConcessao {
  id: string;
  comarca_id: string;
  comarca_nome: string;
  comarca_codigo: string;
  suprido_id: string | null;
  suprido_nome: string | null;
  status: string;
  valor_total_autorizado: number;
  distribution: ExpenseDistribution;
  ptres: string;
  selected: boolean;
  processado: boolean;
  solicitacao_id: string | null;
}

interface OrdinaryProcessFactoryProps {
  onProcessComplete?: () => void;
}

const EXPENSE_ELEMENTS = [
  { code: '30.01', label: '3.3.90.30.01 - Consumo em Geral' },
  { code: '30.02', label: '3.3.90.30.02 - Combustíveis e Lubrificantes' },
  { code: '33', label: '3.3.90.33 - Passagens e Desp. com Locomoção' },
  { code: '36', label: '3.3.90.36 - Outros Serv. Terceiros - PF' },
  { code: '39', label: '3.3.90.39 - Outros Serv. Terceiros - PJ' }
];

export const OrdinaryProcessFactory: React.FC<OrdinaryProcessFactoryProps> = ({
  onProcessComplete
}) => {
  const { showToast } = useToast();
  
  // State
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [quadrimester, setQuadrimester] = useState('1'); // 1, 2, 3
  const [unidades, setUnidades] = useState<UnidadeConcessao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState({ current: 0, total: 0 });
  const [selectAll, setSelectAll] = useState(false);

  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDENTE' | 'PROCESSADO' | 'SEM_TITULAR'>('ALL');
  
  // Modal State
  const [editingUnidade, setEditingUnidade] = useState<UnidadeConcessao | null>(null);
  const [assigningUnidade, setAssigningUnidade] = useState<UnidadeConcessao | null>(null);

  // Deadlines Logic
  const deadlines = useMemo(() => {
    const y = parseInt(year);
    if (quadrimester === '1') return { app: `30/04/${y}`, prest: `07/05/${y}`, label: '1º Quadrimestre' };
    if (quadrimester === '2') return { app: `31/08/${y}`, prest: `07/09/${y}`, label: '2º Quadrimestre' };
    return { app: `31/12/${y}`, prest: `07/01/${y + 1}`, label: '3º Quadrimestre' };
  }, [year, quadrimester]);

  const competenciaKey = `${year}-Q${quadrimester}`;

  // Fetch Data
  const fetchUnidades = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('unidade_titulares')
        .select(`
          id, comarca_id, suprido_atual_id, status, 
          valor_mensal_custeio, valor_mensal_capital, ptres,
          comarcas!unidade_titulares_comarca_id_fkey (nome, codigo),
          profiles!unidade_titulares_suprido_atual_id_fkey (id, nome)
        `)
        .eq('tipo_suprimento', 'ORDINARIO')
        .in('status', ['REGULAR', 'SEM_TITULAR'])
        .order('comarcas(nome)', { ascending: true });

      if (error) throw error;

      // Check existing processes
      const { data: existing } = await supabase
        .from('solicitacoes')
        .select('lotacao_id, id')
        .eq('tipo', 'ORDINARIO')
        .eq('competencia', competenciaKey);

      const existingMap = new Map((existing || []).map(p => [p.lotacao_id, p.id]));

      const transformed: UnidadeConcessao[] = (data || []).map((item: any) => {
        // Default logic: Total value = Custeio + Capital (from DB config) or default 4000
        const total = (item.valor_mensal_custeio || 2000) + (item.valor_mensal_capital || 0);
        
        // Initial Distribution: 60% Consumo, 40% PJ (Example default)
        // In a real app, this could come from a 'distributions' table preference
        const dist: ExpenseDistribution = {
          '30.01': total * 0.6, // Consumo em Geral
          '30.02': 0, // Combustíveis e Lubrificantes
          '33': 0,
          '36': 0,
          '39': total * 0.4
        };

        return {
          id: item.id,
          comarca_id: item.comarca_id,
          comarca_nome: item.comarcas?.nome || 'N/A',
          comarca_codigo: item.comarcas?.codigo || '--',
          suprido_id: item.profiles?.id || item.suprido_atual_id,
          suprido_nome: item.profiles?.nome || null,
          status: item.status,
          valor_total_autorizado: total,
          distribution: dist,
          ptres: item.ptres || '8193',
          selected: false,
          processado: existingMap.has(item.comarca_id),
          solicitacao_id: existingMap.get(item.comarca_id) || null
        };
      });

      setUnidades(transformed);
    } catch (error) {
      console.error('Error fetching unidades:', error);
      showToast({ type: 'error', title: 'Erro', message: 'Falha ao carregar unidades' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUnidades();
  }, [competenciaKey]);

  // Selection Logic
  const toggleSelect = (id: string) => {
    setUnidades(prev => prev.map(u => 
      u.id === id ? { ...u, selected: !u.selected } : u
    ));
  };

  const toggleSelectAll = () => {
    const newState = !selectAll;
    setSelectAll(newState);
    setUnidades(prev => prev.map(u => 
      u.processado ? u : { ...u, selected: newState }
    ));
  };

  // Distribution Logic
  const handleDistributionChange = (code: keyof ExpenseDistribution, val: number) => {
    if (!editingUnidade) return;
    setEditingUnidade({
      ...editingUnidade,
      distribution: { ...editingUnidade.distribution, [code]: val }
    });
  };

  const saveDistribution = () => {
    if (!editingUnidade) return;
    setUnidades(prev => prev.map(u => u.id === editingUnidade.id ? editingUnidade : u));
    setEditingUnidade(null);
  };

  const getDistTotal = (u: UnidadeConcessao) => {
    return Object.values(u.distribution).reduce((a, b) => a + b, 0);
  };

  // Filter Logic
  const filteredUnidades = useMemo(() => {
    return unidades.filter(u => {
      if (filterStatus === 'PENDENTE') return !u.processado;
      if (filterStatus === 'PROCESSADO') return u.processado;
      if (filterStatus === 'SEM_TITULAR') return !u.suprido_id;
      return true;
    });
  }, [unidades, filterStatus]);

  // Totals
  const selectedUnidades = unidades.filter(u => u.selected);
  const totalValorSelecionado = selectedUnidades.reduce((sum, u) => sum + u.valor_total_autorizado, 0);

  // Processing Logic
  const processarConcessao = async () => {
    if (selectedUnidades.length === 0) return;

    // Validations
    const invalidDist = selectedUnidades.filter(u => Math.abs(getDistTotal(u) - u.valor_total_autorizado) > 0.01);
    if (invalidDist.length > 0) {
      showToast({ type: 'error', title: 'Erro de Distribuição', message: `${invalidDist.length} unidades têm distribuição divergente do total autorizado.` });
      return;
    }

    const missingTitular = selectedUnidades.filter(u => !u.suprido_id);
    if (missingTitular.length > 0) {
      showToast({ type: 'error', title: 'Sem Titular', message: `${missingTitular.length} unidades selecionadas não têm suprido definido.` });
      return;
    }

    setIsProcessing(true);
    let sucessos = 0;
    let erros = 0;

    for (let i = 0; i < selectedUnidades.length; i++) {
      const u = selectedUnidades[i];
      setProcessProgress({ current: i + 1, total: selectedUnidades.length });

      try {
        const nup = `TJPA-ORD-${year}Q${quadrimester}-${u.comarca_codigo}`;
        
        // Items for DB
        const itensDespesa = EXPENSE_ELEMENTS.map(el => ({
          element: `3.3.90.${el.code}`,
          desc: el.label.split(' - ')[1],
          val: u.distribution[el.code as keyof ExpenseDistribution]
        })).filter(i => i.val > 0);

        const { data: sol, error } = await supabase.from('solicitacoes').insert({
          nup,
          tipo: 'ORDINARIO',
          competencia: competenciaKey,
          user_id: u.suprido_id,
          lotacao_id: u.comarca_id,
          status: 'CONCEDIDO',
          valor_solicitado: u.valor_total_autorizado,
          valor_total: u.valor_total_autorizado,
          descricao: `Suprimento Ordinário - ${deadlines.label} (${year})`,
          itens_despesa: JSON.stringify(itensDespesa),
          created_at: new Date().toISOString(),
          metadata: { deadlines } // Store deadlines for document generation
        }).select().single();

        if (error) throw error;

        // Create Docs Placeholders
        const docs = [
           { tipo: 'PORTARIA', nome: `Portaria ${deadlines.label}`, status: 'MINUTA' },
           { tipo: 'NOTA_EMPENHO', nome: 'Nota de Empenho', status: 'MINUTA' },
           { tipo: 'ORDEM_BANCARIA', nome: 'Ordem Bancária', status: 'MINUTA' }
        ];

        for (const d of docs) {
            await supabase.from('documentos').insert({
                solicitacao_id: sol.id,
                tipo: d.tipo,
                nome: d.nome,
                status: d.status
            });
        }

        // Notify
        await supabase.from('system_notifications').insert({
            user_id: u.suprido_id,
            type: 'SUCCESS',
            category: 'FINANCE',
            title: 'Suprimento Gerado',
            message: `Ordinário ${deadlines.label} disponível para assinatura.`,
            link_action: `/suprido/processo/${sol.id}`
        });

        // Update local state
        setUnidades(prev => prev.map(item => item.id === u.id ? { ...item, processado: true, selected: false, solicitacao_id: sol.id } : item));
        sucessos++;

      } catch (err) {
        console.error(err);
        erros++;
      }
    }

    setIsProcessing(false);
    showToast({ 
        type: sucessos > 0 ? 'success' : 'error', 
        title: 'Processamento Concluído', 
        message: `${sucessos} gerados com sucesso. ${erros} falhas.` 
    });
    onProcessComplete?.();
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="h-full flex flex-col relative">
       {/* Modal for Assignment */}
       {assigningUnidade && (
         <TitularAssignmentModal
           isOpen={true}
           onClose={() => setAssigningUnidade(null)}
           unidadeId={assigningUnidade.id}
           comarcaNome={assigningUnidade.comarca_nome}
           onSuccess={() => {
             fetchUnidades();
             setAssigningUnidade(null);
           }}
         />
       )}

       {/* Modal for Distribution */}
       {editingUnidade && (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
               <div className="bg-purple-600 p-4 text-white flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-lg">Distribuir Valores</h3>
                    <p className="text-purple-200 text-xs">{editingUnidade.comarca_nome}</p>
                  </div>
                  <button onClick={() => setEditingUnidade(null)} className="p-1 hover:bg-white/20 rounded"><X size={20}/></button>
               </div>
               <div className="p-6 space-y-4">
                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                     <span className="text-sm font-bold text-slate-500">Total Autorizado</span>
                     <div className="relative w-40">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">R$</span>
                        <input 
                           type="number" 
                           value={editingUnidade.valor_total_autorizado}
                           onChange={(e) => setEditingUnidade({...editingUnidade, valor_total_autorizado: parseFloat(e.target.value) || 0})}
                           className="w-full pl-8 pr-3 py-1 text-right text-xl font-black text-slate-800 bg-transparent border-b border-slate-300 focus:border-purple-500 outline-none"
                        />
                     </div>
                  </div>
                  
                  <div className="space-y-3">
                     {EXPENSE_ELEMENTS.map(el => (
                       <div key={el.code} className="flex items-center gap-3">
                          <label className="text-xs font-bold text-slate-600 w-full truncate" title={el.label}>{el.label}</label>
                          <div className="relative w-40">
                             <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                             <input 
                               type="number" 
                               value={editingUnidade.distribution[el.code as keyof ExpenseDistribution]}
                               onChange={(e) => handleDistributionChange(el.code as keyof ExpenseDistribution, parseFloat(e.target.value) || 0)}
                               className="w-full pl-8 pr-3 py-2 text-right text-sm font-bold border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                             />
                          </div>
                       </div>
                     ))}
                  </div>

                  <div className={`p-3 rounded-xl border flex justify-between items-center ${
                     Math.abs(getDistTotal(editingUnidade) - editingUnidade.valor_total_autorizado) < 0.01 
                     ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                     : 'bg-red-50 border-red-200 text-red-700'
                  }`}>
                      <span className="text-xs font-bold uppercase">Total Distribuído</span>
                      <span className="font-black">{formatCurrency(getDistTotal(editingUnidade))}</span>
                  </div>
               </div>
               <div className="p-4 bg-slate-50 flex justify-end gap-3">
                  <button onClick={() => setEditingUnidade(null)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700">Cancelar</button>
                  <button 
                    onClick={saveDistribution}
                    disabled={Math.abs(getDistTotal(editingUnidade) - editingUnidade.valor_total_autorizado) > 0.01}
                    className="px-6 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                     <Save size={16} /> Salvar Distribuição
                  </button>
               </div>
            </div>
         </div>
       )}

       {/* Header */}
       <div className="bg-slate-900 rounded-2xl p-6 mb-6 text-white shadow-lg overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-5"><Factory size={120} /></div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
             <div>
                <div className="flex items-center gap-2 text-purple-400 mb-1">
                   <Factory size={20} />
                   <span className="text-xs font-black uppercase tracking-widest">Fábrica de Processos</span>
                </div>
                <h1 className="text-3xl font-black tracking-tight mb-2">Suprimento Ordinário</h1>
                <p className="text-slate-400 text-sm max-w-xl">
                   Gestão de concessões em lote por ciclo quadrimestral. Distribua o orçamento, valide supridos e gere processos automaticamente.
                </p>
             </div>

             <div className="bg-white/10 p-1 rounded-xl flex items-center">
                {[1, 2, 3].map(q => (
                   <button
                     key={q}
                     onClick={() => setQuadrimester(q.toString())}
                     className={`px-6 py-3 rounded-lg text-sm font-bold transition-all ${
                        quadrimester === q.toString() 
                        ? 'bg-purple-600 text-white shadow-lg scale-105' 
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                     }`}
                   >
                      {q}º Quadrimestre
                   </button>
                ))}
             </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
             <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-1">Ano de Exercício</p>
                <div className="flex items-center gap-2">
                   <Calendar size={16} className="text-purple-400"/>
                   <span className="text-xl font-bold">{year}</span>
                </div>
             </div>
             <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-1">Prazo de Aplicação</p>
                <div className="flex items-center gap-2">
                   <ClockIcon className="text-purple-400" size={16}/>
                   <span className="text-xl font-bold">{deadlines.app}</span>
                </div>
             </div>
             <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-1">Prazo de Prestação</p>
                <div className="flex items-center gap-2">
                   <FileText size={16} className="text-purple-400"/>
                   <span className="text-xl font-bold text-amber-400">{deadlines.prest}</span>
                </div>
             </div>
             <div className="p-4 bg-purple-600/20 border border-purple-500/30 rounded-xl">
                <p className="text-purple-300 text-[10px] font-black uppercase tracking-wider mb-1">Total Selecionado</p>
                <div className="flex items-center gap-2">
                   <DollarSign size={16} className="text-purple-400"/>
                   <span className="text-xl font-bold text-white">{formatCurrency(totalValorSelecionado)}</span>
                </div>
             </div>
          </div>
       </div>

       {/* Toolbar */}
       <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-3">
             <button onClick={toggleSelectAll} className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50">
                {selectAll ? <CheckSquare size={16} className="text-purple-600"/> : <Square size={16}/>}
                Selecionar Todos
             </button>
             <div className="h-6 w-px bg-slate-300 mx-2"/>
             <div className="flex bg-slate-100 p-1 rounded-lg">
                <button onClick={() => setFilterStatus('ALL')} className={`px-3 py-1.5 text-xs font-bold rounded-md ${filterStatus === 'ALL' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>Todas</button>
                <button onClick={() => setFilterStatus('PENDENTE')} className={`px-3 py-1.5 text-xs font-bold rounded-md ${filterStatus === 'PENDENTE' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>Pendentes</button>
                <button onClick={() => setFilterStatus('SEM_TITULAR')} className={`px-3 py-1.5 text-xs font-bold rounded-md ${filterStatus === 'SEM_TITULAR' ? 'bg-white shadow text-red-600' : 'text-slate-500'}`}>Sem Titular</button>
             </div>
          </div>

          <button 
            onClick={processarConcessao}
            disabled={isProcessing || selectedUnidades.length === 0}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg transition-all ${
               isProcessing || selectedUnidades.length === 0 
               ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
               : 'bg-emerald-500 text-white hover:bg-emerald-600 hover:scale-105'
            }`}
          >
             {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} fill="currentColor" />}
             {isProcessing ? `Processando ${processProgress.current}/${processProgress.total}` : 'Processar Unidades Selecionadas'}
          </button>
       </div>

       {/* Preview Summary Panel */}
       {selectedUnidades.length > 0 && (
         <div className="mb-4 bg-gradient-to-r from-purple-50 to-white rounded-xl border border-purple-200 p-4 animate-in fade-in slide-in-from-top-2">
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-6">
               <div className="flex items-center gap-2">
                 <Building2 size={18} className="text-purple-600"/>
                 <span className="text-sm font-bold text-purple-700">{selectedUnidades.length} Comarcas</span>
               </div>
               <div className="flex items-center gap-2">
                 <DollarSign size={18} className="text-emerald-600"/>
                 <span className="text-sm font-bold text-emerald-700">{formatCurrency(totalValorSelecionado)}</span>
               </div>
               {selectedUnidades.filter(u => !u.suprido_id).length > 0 && (
                 <div className="flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded-lg">
                   <AlertTriangle size={14}/>
                   <span className="text-xs font-bold">{selectedUnidades.filter(u => !u.suprido_id).length} sem titular</span>
                 </div>
               )}
               {selectedUnidades.filter(u => Math.abs(getDistTotal(u) - u.valor_total_autorizado) > 0.01).length > 0 && (
                 <div className="flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-1 rounded-lg">
                   <AlertCircle size={14}/>
                   <span className="text-xs font-bold">{selectedUnidades.filter(u => Math.abs(getDistTotal(u) - u.valor_total_autorizado) > 0.01).length} distribuição inválida</span>
                 </div>
               )}
             </div>
             <button 
               onClick={() => { setUnidades(prev => prev.map(u => ({ ...u, selected: false }))); setSelectAll(false); }}
               className="text-xs text-purple-600 font-bold hover:underline"
             >
               Limpar Seleção
             </button>
           </div>
         </div>
       )}

       {/* Table */}
       <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-y-auto custom-scrollbar flex-1">
             <table className="w-full text-left">
                <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200 shadow-sm">
                   <tr>
                      <th className="w-12 px-4 py-3"></th>
                      <th className="px-4 py-3 text-[10px] uppercase font-black text-slate-500 tracking-wider">Comarca / Unidade</th>
                      <th className="px-4 py-3 text-[10px] uppercase font-black text-slate-500 tracking-wider">Suprido Responsável</th>
                      <th className="px-4 py-3 text-[10px] uppercase font-black text-slate-500 tracking-wider text-right">Valor Total</th>
                      <th className="px-4 py-3 text-[10px] uppercase font-black text-slate-500 tracking-wider text-center">Distribuição</th>
                      <th className="px-4 py-3 text-[10px] uppercase font-black text-slate-500 tracking-wider text-center">Status</th>
                      <th className="w-12 px-4 py-3"></th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {isLoading ? (
                      <tr><td colSpan={7} className="p-12 text-center text-slate-400"><Loader2 className="animate-spin mx-auto mb-2"/> Carregando unidades...</td></tr>
                   ) : filteredUnidades.length === 0 ? (
                      <tr><td colSpan={7} className="p-12 text-center text-slate-400">Nenhuma unidade encontrada para este filtro.</td></tr>
                   ) : (
                      filteredUnidades.map(u => {
                         const isDistValid = Math.abs(getDistTotal(u) - u.valor_total_autorizado) < 0.01;
                         return (
                            <tr key={u.id} className={`group hover:bg-slate-50 transition-colors ${u.selected ? 'bg-purple-50/50' : ''}`}>
                               <td className="px-4 py-3 text-center">
                                  {!u.processado && (
                                     <button onClick={() => toggleSelect(u.id)}>
                                        {u.selected ? <CheckSquare size={18} className="text-purple-600"/> : <Square size={18} className="text-slate-300 group-hover:text-slate-400"/>}
                                     </button>
                                  )}
                               </td>
                               <td className="px-4 py-3">
                                  <div className="font-bold text-slate-800 text-sm">{u.comarca_nome}</div>
                                  <div className="text-xs text-slate-400 font-mono">{u.comarca_codigo} • PTRES {u.ptres}</div>
                               </td>
                               <td className="px-4 py-3">
                                  {u.suprido_nome ? (
                                     <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">
                                           {u.suprido_nome.charAt(0)}
                                        </div>
                                        <span className="text-sm font-medium text-slate-700">{u.suprido_nome}</span>
                                     </div>
                                  ) : (
                                     <button 
                                        onClick={() => setAssigningUnidade(u)}
                                        className="flex items-center gap-1 text-red-500 text-xs font-bold bg-red-50 px-2 py-1 rounded w-fit hover:bg-red-100 transition-colors"
                                      >
                                        <UserPlus size={12} /> Sem Titular
                                     </button>
                                  )}
                               </td>
                               <td className="px-4 py-3 text-right font-black text-slate-700 text-sm">
                                  {formatCurrency(u.valor_total_autorizado)}
                               </td>
                               <td className="px-4 py-3 text-center">
                                  {u.processado ? (
                                     <span className="text-xs text-slate-500 font-medium">Definido</span>
                                  ) : (
                                     <button 
                                       onClick={() => setEditingUnidade(u)}
                                       className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                          isDistValid 
                                          ? 'bg-slate-100 text-slate-600 hover:bg-purple-100 hover:text-purple-700' 
                                          : 'bg-red-100 text-red-600 hover:bg-red-200 animate-pulse'
                                       }`}
                                     >
                                        <Calculator size={14} /> 
                                        {isDistValid ? 'Editar' : 'Corrigir'}
                                     </button>
                                  )}
                               </td>
                               <td className="px-4 py-3 text-center">
                                  {u.processado ? (
                                     <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase">
                                        <CheckCircle2 size={12} /> Processado
                                     </span>
                                  ) : (
                                     <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold uppercase">
                                        Pendente
                                     </span>
                                  )}
                               </td>
                               <td className="px-4 py-3"></td>
                            </tr>
                         );
                      })
                   )}
                </tbody>
             </table>
          </div>
          <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-400 text-center font-medium">
             Mostrando {filteredUnidades.length} de {unidades.length} unidades
          </div>
       </div>
    </div>
  );
};

const ClockIcon = ({ size, className }: { size: number, className?: string }) => (
   <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);

export default OrdinaryProcessFactory;
