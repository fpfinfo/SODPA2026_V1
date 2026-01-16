import React, { useState, useMemo, useEffect } from 'react';
import { 
  PenTool, 
  FileSignature, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Filter, 
  ChevronRight, 
  FileText, 
  Scale, 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  Building2, 
  Maximize2, 
  ShieldCheck, 
  ArrowLeft, 
  Briefcase, 
  Wallet, 
  PieChart, 
  BarChart3, 
  LayoutDashboard, 
  ListTodo, 
  MapPin, 
  Users, 
  Layers, 
  Landmark, 
  ArrowUpRight, 
  MoreHorizontal,
  Square,
  CheckSquare,
  X,
  MessageSquare,
  Key,
  Lock,
  Loader2
} from 'lucide-react';
import { Process, ConcessionStatus } from '../types';
import { useSefinTasks, SigningTask as DbSigningTask } from '../hooks/useSefinTasks';

const BRASAO_TJPA_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/217479058_brasao-tjpa.png';

type DocumentOrigin = 'SOSFU' | 'AJSEFIN';
type DocumentType = 'PORTARIA' | 'NOTA_EMPENHO' | 'DESPACHO' | 'DECISAO';
type ViewMode = 'OPERATIONAL' | 'ANALYTICS';
type GeoTab = 'MUNICIPALITY' | 'REGION' | 'POLE';

interface SefinDashboardProps {
  processes?: Process[];
  onSignComplete?: (processId: string) => void;
}

interface SigningTask {
  id: string;
  protocol: string;
  type: DocumentType;
  origin: DocumentOrigin;
  title: string;
  description: string;
  value?: number;
  date: string;
  priority: 'NORMAL' | 'HIGH';
  status: 'PENDING' | 'SIGNED' | 'RETURNED';
  author: string;
  content_preview: string;
  unitCode?: string;
  unitName?: string;
}

const ANALYTICS_DATA = {
  budget: { total: 12500000, executed: 3245000, percentage: 25.96 },
  byElement: [
    { code: '3.3.90.39', label: 'Serviços de Terceiros - PJ', value: 1150000, percent: 35 },
    { code: '3.3.90.36', label: 'Serviços de Terceiros - PF', value: 850000, percent: 26 },
    { code: '3.3.90.30.01', label: 'Consumo em Geral', value: 650000, percent: 20 },
    { code: '3.3.90.33', label: 'Passagens e Locomoção', value: 350000, percent: 11 },
    { code: '3.3.90.30.02', label: 'Combustíveis e Lubrificantes', value: 245000, percent: 8 },
  ],
  byType: [
    { label: 'Extraordinário - Júri', value: 1800000, color: 'bg-amber-500' },
    { label: 'Extraordinário - Emergencial', value: 1045000, color: 'bg-red-500' },
    { label: 'Ordinário', value: 400000, color: 'bg-blue-600' },
  ],
  byMunicipality: [
    { name: 'Belém', value: 850000 },
    { name: 'Ananindeua', value: 420000 },
    { name: 'Santarém', value: 380000 },
    { name: 'Marabá', value: 290000 },
    { name: 'Castanhal', value: 210000 },
  ],
  byRegion: [
    { name: '1ª Região (Metropolitana)', value: 1500000 },
    { name: '2ª Região (Nordeste)', value: 800000 },
    { name: '3ª Região (Baixo Amazonas)', value: 600000 },
  ],
  byPole: [
    { name: 'Pólo Belém', value: 1200000 },
    { name: 'Pólo Santarém', value: 500000 },
    { name: 'Pólo Altamira', value: 350000 },
  ],
  topSupridos: [
    { name: 'Ademário Silva De Jesus', role: 'Técnico Judiciário', unit: 'Comarca Mãe do Rio', total: 45000 },
    { name: 'Maria Oliveira Santos', role: 'Diretora de Secretaria', unit: 'Comarca Santarém', total: 38500 },
    { name: 'João Paulo Costa', role: 'Oficial de Justiça', unit: 'Comarca Belém', total: 32000 },
    { name: 'Ana Beatriz Lima', role: 'Analista Judiciário', unit: 'Comarca Marabá', total: 28900 },
  ]
};

export const SefinDashboard: React.FC<SefinDashboardProps> = ({ processes = [], onSignComplete }) => {
  // Use Supabase hook for tasks
  const { tasks: dbTasks, isLoading: loadingTasks, signTask, signMultipleTasks, rejectTask } = useSefinTasks();
  
  const [viewMode, setViewMode] = useState<ViewMode>('OPERATIONAL');
  const [activeTab, setActiveTab] = useState<'INBOX' | 'SIGNED'>('INBOX');
  const [originFilter, setOriginFilter] = useState<DocumentOrigin | 'ALL'>('ALL');
  const [geoTab, setGeoTab] = useState<GeoTab>('MUNICIPALITY');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewTask, setPreviewTask] = useState<SigningTask | null>(null);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [isSigningProcess, setIsSigningProcess] = useState(false);

  // Map DB tasks to UI format
  const supabaseTasks: SigningTask[] = useMemo(() => {
    return dbTasks.map(t => ({
      id: t.id,
      protocol: `TJPA-${t.tipo}-${t.id.slice(0, 8).toUpperCase()}`,
      type: t.tipo as DocumentType || 'PORTARIA',
      origin: t.origem as DocumentOrigin || 'SOSFU',
      title: t.titulo,
      description: t.titulo,
      value: t.valor,
      date: t.created_at ? new Date(t.created_at).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR'),
      priority: 'NORMAL' as const,
      status: t.status === 'SIGNED' ? 'SIGNED' : t.status === 'REJECTED' ? 'RETURNED' : 'PENDING' as any,
      author: 'SOSFU - Gestão de Concessão',
      content_preview: t.titulo,
    }));
  }, [dbTasks]);

  // Generate SigningTasks from tramited processes (status = AWAITING_SIGNATURE)
  const dynamicTasks: SigningTask[] = useMemo(() => {
    return processes
      .filter(p => p.status === ConcessionStatus.AWAITING_SIGNATURE)
      .map(p => ({
        id: `PROC-${p.id}`,
        protocol: p.protocolNumber,
        type: 'PORTARIA' as DocumentType,
        origin: 'SOSFU' as DocumentOrigin,
        title: `Portaria de Concessão - ${p.interestedParty}`,
        description: p.purpose || `Suprimento de fundos para ${p.interestedParty}`,
        value: p.value,
        date: new Date().toLocaleDateString('pt-BR'),
        priority: p.priority === 'CRITICAL' ? 'HIGH' : 'NORMAL' as 'HIGH' | 'NORMAL',
        status: 'PENDING' as const,
        author: 'SOSFU - Gestão de Concessão',
        content_preview: `Portaria de concessão de suprimento de fundos ao servidor ${p.interestedParty}, CPF ${p.providerCpf || 'N/I'}, valor ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.value)}.`,
        unitCode: p.city || 'N/I',
        unitName: p.city || 'Lotação não informada',
      }));
  }, [processes]);

  // Combine Supabase tasks with dynamic tasks from tramited processes
  const allTasks = useMemo(() => [...supabaseTasks, ...dynamicTasks], [supabaseTasks, dynamicTasks]);

  const filteredTasks = allTasks.filter(t => {
    if (activeTab === 'INBOX' && t.status !== 'PENDING') return false;
    if (activeTab === 'SIGNED' && t.status === 'PENDING') return false;
    if (originFilter !== 'ALL' && t.origin !== originFilter) return false;
    return true;
  });

  const toggleSelection = (id: string) => { const newSet = new Set(selectedIds); if (newSet.has(id)) newSet.delete(id); else newSet.add(id); setSelectedIds(newSet); };
  const toggleSelectAll = () => { if (selectedIds.size === filteredTasks.length) setSelectedIds(new Set()); else setSelectedIds(new Set(filteredTasks.map(t => t.id))); };

  const unitBudgetLimit = 12500000;
  const unitBudgetUsed = 3245000;
  const currentBalance = unitBudgetLimit - unitBudgetUsed;
  const selectedImpact = useMemo(() => allTasks.filter(t => selectedIds.has(t.id) && t.status === 'PENDING').reduce((acc, curr) => acc + (curr.value || 0), 0), [selectedIds, allTasks]);
  const projectedBalance = currentBalance - selectedImpact;

  const handleBatchSign = () => { setIsSigningProcess(true); setTimeout(() => { setIsSigningProcess(false); setIsSignModalOpen(false); alert(`${selectedIds.size} documentos assinados com sucesso!`); setSelectedIds(new Set()); }, 2000); };
  const handleReturnTask = () => { if(!returnReason) return alert('Informe o motivo.'); setIsReturnModalOpen(false); setPreviewTask(null); setReturnReason(''); alert('Documento devolvido à origem.'); };
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const renderAnalytics = () => (
    <div className="flex-1 overflow-y-auto p-10 custom-scrollbar animate-in fade-in space-y-8 pb-32">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-900 p-6 rounded-[24px] text-white shadow-xl flex flex-col justify-between relative overflow-hidden group"><div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><Wallet size={64}/></div><div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Executado</p><h3 className="text-3xl font-black">{formatCurrency(ANALYTICS_DATA.budget.executed)}</h3></div><div className="mt-4"><div className="flex justify-between text-[10px] font-bold mb-1"><span className="text-emerald-400">{ANALYTICS_DATA.budget.percentage}% da Cota</span><span className="text-slate-500">2026</span></div><div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${ANALYTICS_DATA.budget.percentage}%` }}></div></div></div></div>
        <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Por Tipo de Suprimento</p><div className="space-y-3">{ANALYTICS_DATA.byType.map((item, i) => (<div key={i} className="flex items-center gap-3"><div className={`w-3 h-3 rounded-full ${item.color}`}></div><div className="flex-1"><div className="flex justify-between text-xs font-bold"><span className="text-slate-700">{item.label}</span><span className="text-slate-500">{formatCurrency(item.value)}</span></div></div></div>))}</div></div>
        <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm col-span-2"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Por Elemento de Despesa</p><div className="space-y-3">{ANALYTICS_DATA.byElement.map((el, i) => (<div key={i}><div className="flex justify-between text-xs font-bold mb-1"><span className="text-slate-600"><span className="font-mono text-slate-400 mr-2">{el.code}</span>{el.label}</span><span className="text-slate-800">{formatCurrency(el.value)}</span></div><div className="h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${el.percent}%` }}></div></div></div>))}</div></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm col-span-2"><div className="flex items-center justify-between mb-4"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Distribuição Geográfica</p><div className="flex bg-slate-100 p-1 rounded-lg"><button onClick={() => setGeoTab('MUNICIPALITY')} className={`px-3 py-1 text-[10px] font-bold rounded ${geoTab === 'MUNICIPALITY' ? 'bg-white shadow text-slate-800' : 'text-slate-400'}`}>Município</button><button onClick={() => setGeoTab('REGION')} className={`px-3 py-1 text-[10px] font-bold rounded ${geoTab === 'REGION' ? 'bg-white shadow text-slate-800' : 'text-slate-400'}`}>Região</button><button onClick={() => setGeoTab('POLE')} className={`px-3 py-1 text-[10px] font-bold rounded ${geoTab === 'POLE' ? 'bg-white shadow text-slate-800' : 'text-slate-400'}`}>Pólo</button></div></div><div className="space-y-3">{(geoTab === 'MUNICIPALITY' ? ANALYTICS_DATA.byMunicipality : geoTab === 'REGION' ? ANALYTICS_DATA.byRegion : ANALYTICS_DATA.byPole).map((item, i) => (<div key={i} className="flex items-center gap-4"><MapPin size={14} className="text-slate-400"/><div className="flex-1"><div className="flex justify-between text-xs font-bold"><span className="text-slate-700">{item.name}</span><span className="text-slate-500">{formatCurrency(item.value)}</span></div></div></div>))}</div></div>
        <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Users size={14}/> Top Supridos</p><div className="space-y-4">{ANALYTICS_DATA.topSupridos.map((sup, i) => (<div key={i} className="flex items-center gap-3"><div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-xs font-black text-slate-500">{i + 1}</div><div className="flex-1"><p className="text-xs font-bold text-slate-800">{sup.name}</p><p className="text-[10px] text-slate-400">{sup.unit}</p></div><span className="text-xs font-black text-emerald-600">{formatCurrency(sup.total)}</span></div>))}</div></div>
      </div>
    </div>
  );

  const renderOperational = () => (
    <div className="p-8 max-w-[1800px] mx-auto h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4"><h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">{activeTab === 'INBOX' ? 'Caixa de Assinaturas' : 'Documentos Assinados'}{originFilter !== 'ALL' && <span className="text-slate-400 font-normal">/ {originFilter}</span>}</h2><div className="flex bg-white border border-slate-200 rounded-xl p-1"><button onClick={() => setOriginFilter('ALL')} className={`px-3 py-1 text-[10px] font-black uppercase rounded-lg transition-all ${originFilter === 'ALL' ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}>Todos</button><button onClick={() => setOriginFilter('SOSFU')} className={`px-3 py-1 text-[10px] font-black uppercase rounded-lg transition-all ${originFilter === 'SOSFU' ? 'bg-blue-50 text-blue-700' : 'text-slate-400 hover:text-slate-600'}`}>Técnico</button><button onClick={() => setOriginFilter('AJSEFIN')} className={`px-3 py-1 text-[10px] font-black uppercase rounded-lg transition-all ${originFilter === 'AJSEFIN' ? 'bg-purple-50 text-purple-700' : 'text-slate-400 hover:text-slate-600'}`}>Jurídico</button></div></div>
        <div className="flex gap-3"><div className="relative"><Search className="absolute left-3 top-2.5 text-slate-400" size={16} /><input type="text" placeholder="Buscar documento..." className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64" /></div></div>
      </div>
      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex-1 relative">
        <div className="overflow-y-auto custom-scrollbar h-full pb-20">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 shadow-sm"><tr><th className="px-6 py-4 w-16 text-center"><button onClick={toggleSelectAll} className="text-slate-400 hover:text-slate-600">{selectedIds.size > 0 && selectedIds.size === filteredTasks.length ? <CheckSquare size={20} className="text-blue-600"/> : <Square size={20}/>}</button></th><th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Documento / Tipo</th><th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Origem</th><th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Resumo / Valor</th><th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Data</th><th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Ação</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{filteredTasks.length === 0 ? (<tr><td colSpan={6} className="px-8 py-20 text-center text-slate-400"><div className="flex flex-col items-center gap-4"><CheckCircle2 size={48} className="text-emerald-100" /><p className="font-medium text-sm">Tudo em dia! Nenhum documento pendente.</p></div></td></tr>) : (filteredTasks.map(task => (<tr key={task.id} className={`hover:bg-slate-50 transition-colors group ${selectedIds.has(task.id) ? 'bg-blue-50/30' : ''}`}><td className="px-6 py-6 text-center"><button onClick={() => toggleSelection(task.id)} className="text-slate-300 hover:text-blue-500">{selectedIds.has(task.id) ? <CheckSquare size={20} className="text-blue-600"/> : <Square size={20}/>}</button></td><td className="px-6 py-6 cursor-pointer" onClick={() => setPreviewTask(task)}><div className="flex items-center gap-4"><div className={`p-3 rounded-2xl shrink-0 ${task.type === 'PORTARIA' || task.type === 'NOTA_EMPENHO' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>{task.type === 'NOTA_EMPENHO' ? <DollarSign size={20}/> : <FileSignature size={20}/>}</div><div><p className="text-sm font-black text-slate-800">{task.title}</p><p className="text-xs font-mono text-slate-500 mt-0.5">{task.protocol}</p></div></div></td><td className="px-6 py-6 cursor-pointer" onClick={() => setPreviewTask(task)}><span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${task.origin === 'SOSFU' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-purple-50 text-purple-700 border-purple-100'}`}>{task.origin}</span></td><td className="px-6 py-6 max-w-md cursor-pointer" onClick={() => setPreviewTask(task)}><p className="text-xs font-medium text-slate-600 line-clamp-1">{task.description}</p>{task.value && <p className="text-sm font-black text-emerald-600 mt-1">{formatCurrency(task.value)}</p>}</td><td className="px-6 py-6 cursor-pointer" onClick={() => setPreviewTask(task)}><div className="flex items-center gap-2 text-xs font-medium text-slate-500"><Clock size={14} /> {task.date}</div></td><td className="px-6 py-6 text-right"><button onClick={() => setPreviewTask(task)} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 hover:text-blue-600 transition-all shadow-sm">Ler</button></td></tr>)))}</tbody>
          </table>
        </div>
        {selectedIds.size > 0 && (<div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white p-2 pl-6 rounded-2xl shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-4 z-20 border border-slate-700"><span className="text-xs font-bold text-slate-300"><span className="text-white font-black">{selectedIds.size}</span> selecionados</span><div className="h-6 w-px bg-slate-700"></div><div className="flex gap-2"><button onClick={() => setIsSignModalOpen(true)} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-900/50"><PenTool size={14}/> Assinar em Lote</button><button onClick={() => { setSelectedIds(new Set()); }} className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all"><X size={16}/></button></div></div>)}
      </div>
    </div>
  );

  return (
    <div className="h-full bg-[#f8fafc] overflow-hidden flex flex-col relative">
      <div className="bg-white border-b border-slate-200 px-10 py-8 flex justify-between items-end shadow-sm z-20">
        <div><h1 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3">Módulo Executivo <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-500 tracking-normal border border-slate-200">SEFIN</span></h1><p className="text-slate-500 font-medium mt-2 flex items-center gap-2"><Briefcase size={16} className="text-slate-400" /> Painel do Ordenador de Despesas</p></div>
        <div className="flex items-center gap-6">
          <div className="bg-slate-100 p-1 rounded-xl flex border border-slate-200"><button onClick={() => setViewMode('OPERATIONAL')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'OPERATIONAL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><ListTodo size={16} /> Fluxo de Assinaturas</button><button onClick={() => setViewMode('ANALYTICS')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'ANALYTICS' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><LayoutDashboard size={16} /> Inteligência Financeira</button></div>
          <div className="h-10 w-px bg-slate-200"></div>
          <div className="text-right"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dotação Orçamentária 2026</p><div className="flex flex-col items-end"><div className="flex items-baseline gap-2"><p className={`text-2xl font-black transition-all duration-300 ${selectedImpact > 0 ? 'text-slate-400 line-through text-lg' : 'text-slate-800'}`}>{formatCurrency(currentBalance)}</p>{selectedImpact > 0 && (<p className="text-2xl font-black text-blue-600 animate-in fade-in slide-in-from-bottom-1">{formatCurrency(projectedBalance)}</p>)}</div>{selectedImpact > 0 && (<p className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Impacto: -{formatCurrency(selectedImpact)}</p>)}</div></div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {viewMode === 'OPERATIONAL' && (<div className="w-72 bg-white border-r border-slate-200 p-6 flex flex-col gap-8 z-10 animate-in slide-in-from-left-4"><div className="space-y-2"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3">Fluxo de Assinaturas</p><button onClick={() => { setActiveTab('INBOX'); setOriginFilter('ALL'); }} className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${activeTab === 'INBOX' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-50'}`}><span className="text-sm font-bold flex items-center gap-3"><PenTool size={16}/> Pendentes</span><span className={`text-xs font-black px-2 py-0.5 rounded-md ${activeTab === 'INBOX' ? 'bg-white/20' : 'bg-slate-100'}`}>{allTasks.filter(t => t.status === 'PENDING').length}</span></button><button onClick={() => setActiveTab('SIGNED')} className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${activeTab === 'SIGNED' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-50'}`}><span className="text-sm font-bold flex items-center gap-3"><FileSignature size={16}/> Assinados</span></button></div></div>)}
        <div className="flex-1 overflow-hidden relative bg-slate-50">{viewMode === 'OPERATIONAL' ? renderOperational() : renderAnalytics()}</div>

        {previewTask && (<div className="absolute inset-0 z-40 flex justify-end"><div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" onClick={() => setPreviewTask(null)}></div><div className="w-[850px] bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col relative z-50"><div className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm shrink-0"><div className="flex items-center gap-4"><button onClick={() => setPreviewTask(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"><X size={20}/></button><div><h3 className="text-sm font-black text-slate-800 flex items-center gap-2">{previewTask.title}<span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[9px] rounded uppercase tracking-widest">Minuta</span></h3><p className="text-xs text-slate-500 font-mono">{previewTask.protocol}</p></div></div><div className="flex gap-3"><button onClick={() => setIsReturnModalOpen(true)} className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-red-50 flex items-center gap-2"><MessageSquare size={14}/> Devolver</button><button onClick={() => { setSelectedIds(new Set([previewTask.id])); setIsSignModalOpen(true); }} className="px-6 py-2 bg-blue-600 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-blue-700 shadow-md flex items-center gap-2"><PenTool size={14}/> Assinar</button></div></div><div className="flex-1 overflow-y-auto p-12 bg-slate-100 flex justify-center custom-scrollbar"><div className="w-[650px] bg-white shadow-xl min-h-[900px] p-16 text-slate-800 font-serif leading-relaxed relative"><div className="absolute top-0 right-0 p-8 opacity-5"><img src={BRASAO_TJPA_URL} className="w-32 grayscale" /></div><div className="text-center mb-12 space-y-2"><img src={BRASAO_TJPA_URL} className="w-16 mx-auto mb-4" /><h4 className="text-xs font-bold uppercase tracking-widest text-slate-900">Tribunal de Justiça do Estado do Pará</h4><h5 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Secretaria de Finanças</h5></div><h2 className="text-lg font-black text-center mb-8 uppercase border-y-2 border-slate-900 py-2">{previewTask.type.replace('_', ' ')}</h2><div className="text-justify space-y-6 text-sm"><p>{previewTask.content_preview}</p><p>Considerando o disposto na Lei Complementar nº... e a disponibilidade orçamentária atestada pela SOSFU.</p><p><strong>DETERMINO</strong> o prosseguimento do feito conforme solicitado, autorizando a despesa no valor de {previewTask.value && formatCurrency(previewTask.value)}.</p></div><div className="mt-24 pt-8 border-t border-slate-300 text-center"><div className="w-48 h-px bg-slate-900 mx-auto mb-2"></div><p className="font-bold text-xs uppercase">Ordenador de Despesas</p><p className="text-[10px] text-slate-400 uppercase">Aguardando Assinatura Digital</p></div></div></div></div></div>)}

        {isSignModalOpen && (<div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95"><div className="text-center mb-6"><div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4"><Key size={32}/></div><h3 className="text-xl font-black text-slate-800">Assinatura Digital</h3><p className="text-sm text-slate-500 mt-2">Você está prestes a assinar <strong>{selectedIds.size} documento(s)</strong>.</p></div><div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 space-y-2"><div className="flex justify-between text-xs font-bold text-slate-600"><span>Total Financeiro:</span><span>{formatCurrency(selectedImpact)}</span></div><div className="flex justify-between text-xs font-bold text-slate-600"><span>Certificado:</span><span className="text-emerald-600 flex items-center gap-1"><Lock size={10}/> A3 - VALID</span></div></div><div className="space-y-4"><div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Senha do Token / PIN</label><input type="password" placeholder="••••••" className="w-full p-3 bg-white border border-slate-300 rounded-xl text-center text-lg font-black tracking-widest focus:ring-2 focus:ring-blue-500 outline-none" /></div><button onClick={handleBatchSign} disabled={isSigningProcess} className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 shadow-xl transition-all flex items-center justify-center gap-2">{isSigningProcess ? <Clock size={16} className="animate-spin"/> : <PenTool size={16}/>}{isSigningProcess ? 'Processando Assinaturas...' : 'Confirmar Assinatura'}</button><button onClick={() => setIsSignModalOpen(false)} className="w-full py-3 text-slate-500 font-bold text-xs hover:text-slate-800">Cancelar</button></div></div></div>)}

        {isReturnModalOpen && (<div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 animate-in zoom-in-95"><div className="flex items-center gap-4 mb-6 text-red-600"><AlertCircle size={32}/><h3 className="text-xl font-black text-slate-900">Devolver Processo</h3></div><p className="text-sm text-slate-500 mb-6">O documento retornará para a caixa de entrada da origem ({previewTask?.origin}) com status de <strong>Correção Solicitada</strong>.</p><div className="space-y-4"><div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Motivo da Devolução *</label><textarea className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="Descreva o que precisa ser ajustado..." value={returnReason} onChange={e => setReturnReason(e.target.value)}/></div><div className="flex gap-3"><button onClick={() => setIsReturnModalOpen(false)} className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-50">Cancelar</button><button onClick={handleReturnTask} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-red-700 shadow-lg shadow-red-200">Confirmar Devolução</button></div></div></div></div>)}
      </div>
    </div>
  );
};