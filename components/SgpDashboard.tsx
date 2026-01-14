import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Banknote, 
  FileText, 
  Search, 
  Filter, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  Calculator, 
  Save, 
  ArrowRightLeft, 
  UserMinus,
  FileCheck,
  Building,
  User,
  Layout,
  Inbox,
  UserCog,
  CheckSquare,
  BarChart2,
  List,
  UserPlus,
  X,
  FileSearch,
  MoreHorizontal,
  Briefcase,
  ScrollText
} from 'lucide-react';

const BRASAO_TJPA_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/217479058_brasao-tjpa.png';

type SgpView = 'DASHBOARD' | 'LIST' | 'WORKSTATION';
type ListFilterType = 'INBOX' | 'MY_TASKS' | 'PROCESSED' | 'TEAM_MEMBER';

interface DeductionTask {
  id: string;
  protocol: string;
  serverName: string;
  matricula: string;
  lotacao: string;
  type: 'GLOSA' | 'ALCANCE';
  origin: 'SEPLAN' | 'AJSEFIN';
  value: number;
  decisionDate: string;
  decisionNumber: string;
  status: 'PENDING' | 'PROCESSED';
  assignedTo: string | null;
  dueDate?: string;
}

const SGP_TEAM = [
  { id: '1', name: 'Marta Rocha', role: 'Gerente de Folha', avatar: 'https://i.pravatar.cc/150?u=marta', capacity: 15 },
  { id: '2', name: 'João Kleber', role: 'Analista de RH', avatar: 'https://i.pravatar.cc/150?u=joao', capacity: 20 },
  { id: '3', name: 'Lúcia Ferreira', role: 'Técnica Judiciária', avatar: 'https://i.pravatar.cc/150?u=lucia', capacity: 20 },
];

const CURRENT_USER_ID = '1';

const MOCK_TASKS: DeductionTask[] = [
  { id: 'P-TCE-SGP-REAL', protocol: 'TCE-2026-999', serverName: 'Carlos Alberto (Ex-Suprido)', matricula: '55021', lotacao: 'Comarca de Marabá', type: 'GLOSA', origin: 'SEPLAN', value: 2500.00, decisionDate: '28/01/2026', decisionNumber: 'DEC-SEPLAN-050/2026', status: 'PENDING', assignedTo: '1', dueDate: '2026-02-15' },
  { id: '1', protocol: 'TJPA-PROC-2025-8821', serverName: 'Ademário Silva De Jesus', matricula: '10001', lotacao: 'Central de Mandados - Mãe do Rio', type: 'GLOSA', origin: 'SEPLAN', value: 450.00, decisionDate: '12/01/2026', decisionNumber: 'DEC-SEPLAN-004/2026', status: 'PENDING', assignedTo: '1', dueDate: '2026-02-15' },
  { id: '3', protocol: 'TJPA-PROC-2025-7711', serverName: 'Maria Antonieta', matricula: '55210', lotacao: 'Gabinete da Presidência', type: 'GLOSA', origin: 'AJSEFIN', value: 120.00, decisionDate: '14/01/2026', decisionNumber: 'DEC-AJ-055/2026', status: 'PROCESSED', assignedTo: '2', dueDate: '2026-02-01' }
];

export const SgpDashboard: React.FC = () => {
  const [tasks, setTasks] = useState<DeductionTask[]>(MOCK_TASKS);
  const [viewMode, setViewMode] = useState<SgpView>('DASHBOARD');
  const [listFilter, setListFilter] = useState<ListFilterType>('INBOX');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<DeductionTask | null>(null);
  const [activeDocTab, setActiveDocTab] = useState<'DECISAO' | 'DESPACHO'>('DECISAO');
  const [isProcessing, setIsProcessing] = useState(false);
  const [deductionForm, setDeductionForm] = useState({ rubrica: '9201 - RESTITUIÇÃO AO ERÁRIO', refMonth: '03/2026', installments: 1 });
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [redistributionSourceId, setRedistributionSourceId] = useState<string | null>(null);

  const stats = useMemo(() => ({ inbox: tasks.filter(t => t.status === 'PENDING' && !t.assignedTo).length, myTasks: tasks.filter(t => t.assignedTo === CURRENT_USER_ID && t.status === 'PENDING').length, processed: tasks.filter(t => t.status === 'PROCESSED').length, totalRecovery: tasks.filter(t => t.status === 'PENDING').reduce((acc, curr) => acc + curr.value, 0) }), [tasks]);
  const teamLoad = useMemo(() => SGP_TEAM.map(member => { const memberTasks = tasks.filter(t => t.assignedTo === member.id && t.status === 'PENDING'); return { ...member, activeCount: memberTasks.length, utilization: (memberTasks.length / member.capacity) * 100 }; }), [tasks]);

  const handleCardClick = (view: SgpView, filter?: ListFilterType) => { setViewMode(view); if (filter) setListFilter(filter); };
  const handleViewMemberQueue = (memberId: string) => { setSelectedMemberId(memberId); setListFilter('TEAM_MEMBER'); setViewMode('LIST'); };
  const handleAssign = (taskId: string, memberId: string) => { setTasks(prev => prev.map(t => t.id === taskId ? { ...t, assignedTo: memberId } : t)); setAssigningId(null); };
  const handleBulkRedistribute = (targetMemberId: string) => { if (!redistributionSourceId) return; setTasks(prev => prev.map(t => { if (t.assignedTo === redistributionSourceId && t.status === 'PENDING') return { ...t, assignedTo: targetMemberId }; return t; })); setRedistributionSourceId(null); alert('Processos redistribuídos com sucesso!'); };
  const handleProcessDeduction = () => { setIsProcessing(true); setTimeout(() => { alert(`SUCESSO:\n1. Desconto averbado no MentorH (Rubrica ${deductionForm.rubrica})\n2. Certidão de Averbação Gerada e Anexada.\n3. Processo devolvido à SOSFU para baixa de responsabilidade.`); setTasks(prev => prev.map(t => t.id === selectedTask?.id ? { ...t, status: 'PROCESSED' } : t)); setIsProcessing(false); setSelectedTask(null); setViewMode('DASHBOARD'); }, 2000); };

  const renderRedistributionModal = () => {
    if (!redistributionSourceId) return null;
    const sourceMember = SGP_TEAM.find(m => m.id === redistributionSourceId);
    const taskCount = tasks.filter(t => t.assignedTo === redistributionSourceId && t.status === 'PENDING').length;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center"><h3 className="font-black text-slate-800 flex items-center gap-2"><ArrowRightLeft className="text-rose-600" size={20}/> Redistribuir Carga</h3><button onClick={() => setRedistributionSourceId(null)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button></div>
          <div className="p-6"><div className="bg-amber-50 border border-amber-100 p-4 rounded-xl mb-6 flex items-start gap-3"><UserMinus size={20} className="text-amber-600 shrink-0 mt-0.5"/><div><p className="text-sm font-bold text-amber-800">Origem: {sourceMember?.name}</p><p className="text-xs text-amber-700 mt-1">Este analista possui <strong>{taskCount} processos</strong> ativos.</p></div></div><p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Selecione o Destino</p><div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">{SGP_TEAM.filter(m => m.id !== redistributionSourceId).map(member => { const load = teamLoad.find(t => t.id === member.id); return (<button key={member.id} onClick={() => handleBulkRedistribute(member.id)} className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50 transition-all group text-left"><div className="flex items-center gap-3"><img src={member.avatar} className="w-8 h-8 rounded-full"/><div><p className="text-sm font-bold text-slate-700 group-hover:text-rose-700">{member.name}</p><p className="text-[10px] text-slate-400">{member.role}</p></div></div><span className={`text-[10px] font-bold px-2 py-1 rounded ${load && load.utilization > 80 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>{load?.activeCount} ativos</span></button>); })}</div></div>
        </div>
      </div>
    );
  };

  const renderDashboard = () => (
    <div className="p-8 max-w-[1600px] mx-auto space-y-10 animate-in fade-in">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div onClick={() => handleCardClick('LIST', 'INBOX')} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group hover:border-rose-400 hover:shadow-md transition-all cursor-pointer"><div className="absolute top-0 left-0 w-1 h-full bg-rose-500 group-hover:w-2 transition-all"></div><div className="flex justify-between items-start mb-4"><div className="p-3 bg-rose-50 text-rose-600 rounded-xl group-hover:scale-110 transition-transform"><Inbox size={20}/></div><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">Entrada</span></div><div><h3 className="text-3xl font-black text-slate-800 mb-1">{stats.inbox}</h3><p className="text-xs font-bold text-slate-500 uppercase tracking-wide group-hover:text-rose-600">Novos Recebidos</p><p className="text-[10px] text-slate-400 mt-1">Aguardando análise</p></div></div>
        <div onClick={() => handleCardClick('LIST', 'MY_TASKS')} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group hover:border-purple-400 hover:shadow-md transition-all cursor-pointer"><div className="absolute top-0 left-0 w-1 h-full bg-purple-500 group-hover:w-2 transition-all"></div><div className="flex justify-between items-start mb-4"><div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition-transform"><UserCog size={20}/></div><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">Minha Fila</span></div><div><h3 className="text-3xl font-black text-slate-800 mb-1">{stats.myTasks}</h3><p className="text-xs font-bold text-slate-500 uppercase tracking-wide group-hover:text-purple-600">Atribuídos a Mim</p><p className="text-[10px] text-slate-400 mt-1">Averbações pendentes</p></div></div>
        <div onClick={() => handleCardClick('LIST', 'PROCESSED')} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer"><div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 group-hover:w-2 transition-all"></div><div className="flex justify-between items-start mb-4"><div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform"><CheckSquare size={20}/></div><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">Histórico</span></div><div><h3 className="text-3xl font-black text-slate-800 mb-1">{stats.processed}</h3><p className="text-xs font-bold text-slate-500 uppercase tracking-wide group-hover:text-emerald-600">Processados</p><p className="text-[10px] text-slate-400 mt-1">Descontos implantados</p></div></div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group"><div className="flex justify-between items-start mb-4"><div className="p-3 bg-slate-100 text-slate-600 rounded-xl"><Banknote size={20}/></div><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">Financeiro</span></div><div><h3 className="text-3xl font-black text-slate-800 mb-1">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalRecovery)}</h3><p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total a Recuperar</p><p className="text-[10px] text-slate-400 mt-1">Valores em aberto</p></div></div>
      </div>

      <div className="bg-white rounded-[32px] shadow-lg border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center"><h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-3"><Users size={20} className="text-slate-400"/> Gestão da Equipe SGP</h3></div>
        <table className="w-full text-left border-collapse"><thead className="bg-slate-50 border-b border-slate-200"><tr><th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 w-1/3">Analista / Cargo</th><th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Carga de Trabalho</th><th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th><th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Ações</th></tr></thead><tbody className="divide-y divide-slate-100">{teamLoad.map(member => (<tr key={member.id} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => handleViewMemberQueue(member.id)}><td className="px-8 py-6"><div className="flex items-center gap-4"><div className="relative"><img src={member.avatar} className="w-12 h-12 rounded-2xl border-2 border-white shadow-md group-hover:scale-105 transition-transform" /><div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full ${member.activeCount > 8 ? 'bg-amber-500' : 'bg-emerald-500'}`}></div></div><div><p className="text-sm font-black text-slate-800">{member.name}</p><p className="text-[11px] font-medium text-slate-500 mt-0.5">{member.role}</p></div></div></td><td className="px-8 py-6"><div className="max-w-xs"><div className="flex justify-between text-xs font-bold mb-2"><span className="text-slate-600">{member.activeCount} Processos</span><span className="text-slate-400">{Math.round(member.utilization)}% Cap.</span></div><div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${member.utilization > 90 ? 'bg-red-500' : member.utilization > 70 ? 'bg-amber-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(member.utilization, 100)}%` }}></div></div></div></td><td className="px-8 py-6 text-center"><span className={`inline-flex px-2 py-1 rounded text-[10px] font-black uppercase tracking-wide border ${member.activeCount > 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>{member.activeCount > 0 ? 'Ativo' : 'Disponível'}</span></td><td className="px-8 py-6 text-right"><div className="flex items-center justify-end gap-2"><button onClick={(e) => { e.stopPropagation(); handleViewMemberQueue(member.id); }} className="p-2 bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 rounded-xl transition-all shadow-sm" title="Ver Fila"><List size={16}/></button><button onClick={(e) => { e.stopPropagation(); setRedistributionSourceId(member.id); }} className="p-2 bg-white border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 rounded-xl transition-all shadow-sm" title="Redistribuir Carga"><ArrowRightLeft size={16}/></button></div></td></tr>))}</tbody></table>
      </div>
    </div>
  );

  const renderProcessList = () => {
    let filteredTasks = tasks;
    let config = { title: 'Caixa de Entrada', color: 'text-rose-600', icon: Inbox };
    if (listFilter === 'INBOX') filteredTasks = tasks.filter(t => t.status === 'PENDING' && !t.assignedTo);
    else if (listFilter === 'MY_TASKS') { config = { title: 'Minha Fila de Trabalho', color: 'text-purple-600', icon: UserCog }; filteredTasks = tasks.filter(t => t.assignedTo === CURRENT_USER_ID && t.status === 'PENDING'); }
    else if (listFilter === 'PROCESSED') { config = { title: 'Histórico de Processados', color: 'text-emerald-600', icon: CheckSquare }; filteredTasks = tasks.filter(t => t.status === 'PROCESSED'); }
    else if (listFilter === 'TEAM_MEMBER' && selectedMemberId) { const member = SGP_TEAM.find(m => m.id === selectedMemberId); config = { title: `Fila de ${member?.name.split(' ')[0]}`, color: 'text-blue-600', icon: Users }; filteredTasks = tasks.filter(t => t.assignedTo === selectedMemberId && t.status === 'PENDING'); }

    return (
      <div className="p-8 max-w-[1400px] mx-auto animate-in slide-in-from-right-4">
        <div className="flex justify-between items-center mb-8"><div className="flex items-center gap-4"><button onClick={() => setViewMode('DASHBOARD')} className="p-3 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-rose-600 hover:shadow-md transition-all"><ArrowLeft size={20} /></button><div><h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3"><config.icon className={config.color} size={28}/> {config.title}</h2><p className="text-slate-500 text-sm font-medium">Gestão de averbações e descontos em folha.</p></div></div><div className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold border border-slate-200 shadow-sm">{filteredTasks.length} Registros</div></div>
        <div className="bg-white rounded-[24px] shadow-lg border border-slate-200 overflow-hidden"><table className="w-full text-left"><thead className="bg-slate-50 border-b border-slate-200"><tr><th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Servidor / Matrícula</th><th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Decisão / Origem</th><th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Tipo / Valor</th><th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th><th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Ação</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredTasks.length === 0 ? (<tr><td colSpan={5} className="px-6 py-20 text-center text-slate-400"><div className="flex flex-col items-center gap-3"><FileSearch size={48} className="text-slate-200"/><p className="font-medium text-sm">Nenhum processo encontrado nesta fila.</p></div></td></tr>) : (filteredTasks.map(task => { const assignedStaff = SGP_TEAM.find(s => s.id === task.assignedTo); return (<tr key={task.id} className="hover:bg-slate-50 transition-colors group"><td className="px-6 py-4"><div className="font-bold text-slate-700 text-sm">{task.serverName}</div><div className="text-[10px] font-mono text-slate-400 flex items-center gap-1"><User size={10}/> {task.matricula}</div></td><td className="px-6 py-4"><div className="text-xs font-medium text-slate-600">{task.decisionNumber}</div><div className="text-[10px] text-slate-400 mt-0.5">Origem: {task.origin}</div></td><td className="px-6 py-4"><div className="flex items-center gap-2"><span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${task.type === 'GLOSA' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{task.type}</span><span className="font-bold text-slate-700 text-sm">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(task.value)}</span></div></td><td className="px-6 py-4"><div className="flex flex-col"><span className={`text-xs font-bold ${task.status === 'PROCESSED' ? 'text-emerald-600' : 'text-slate-600'}`}>{task.status === 'PROCESSED' ? 'Averbado' : 'Pendente'}</span>{assignedStaff ? (<span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5"><img src={assignedStaff.avatar} className="w-4 h-4 rounded-full"/>{assignedStaff.name.split(' ')[0]}</span>) : (<span className="text-[10px] text-slate-400 italic">Não atribuído</span>)}</div></td><td className="px-6 py-4 text-right relative">{listFilter === 'TEAM_MEMBER' ? (<><button onClick={() => setAssigningId(assigningId === task.id ? null : task.id)} className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-all shadow-sm"><UserPlus size={14}/> Reatribuir</button>{assigningId === task.id && (<div className="absolute right-6 top-12 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 animate-in zoom-in-95 origin-top-right overflow-hidden text-left"><div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex justify-between items-center"><span className="text-[10px] font-black text-slate-500 uppercase">Novo Responsável</span><button onClick={() => setAssigningId(null)}><X size={14} className="text-slate-400 hover:text-slate-600"/></button></div><div className="max-h-64 overflow-y-auto">{SGP_TEAM.map(member => { if (member.id === task.assignedTo) return null; const load = teamLoad.find(t => t.id === member.id); return (<button key={member.id} onClick={() => handleAssign(task.id, member.id)} className="w-full text-left px-4 py-3 hover:bg-rose-50 flex items-center gap-3 border-b border-slate-50 last:border-0 group/item transition-colors"><img src={member.avatar} className="w-8 h-8 rounded-full border border-slate-100"/><div className="flex-1"><p className="text-xs font-bold text-slate-700 group-hover/item:text-rose-700">{member.name}</p><span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${load && load.utilization > 80 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>{load?.activeCount} ativos</span></div></button>); })}</div></div>)}</>) : !task.assignedTo ? (<button onClick={() => handleAssign(task.id, CURRENT_USER_ID)} className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 transition-all shadow-sm"><UserPlus size={14}/> Assumir</button>) : task.assignedTo === CURRENT_USER_ID ? (<button onClick={() => { setSelectedTask(task); setViewMode('WORKSTATION'); }} className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-600 text-white border border-rose-600 rounded-lg text-xs font-bold hover:bg-rose-700 transition-all shadow-sm"><Calculator size={14}/> Averbar</button>) : (<span className="text-xs font-bold text-slate-400 italic">Atribuído</span>)}</td></tr>); }))}</tbody></table></div>
      </div>
    );
  };

  const renderWorkstation = () => {
    if (!selectedTask) return null;
    return (
      <div className="flex h-full animate-in slide-in-from-right-10 duration-300 bg-slate-50 overflow-hidden">
        <div className="w-[55%] flex flex-col h-full border-r border-slate-200 bg-slate-100">
          <div className="p-6 border-b border-slate-200 bg-white flex justify-between items-center"><div className="flex items-center gap-4"><button onClick={() => { setSelectedTask(null); setViewMode('LIST'); }} className="p-2 bg-slate-100 text-slate-500 rounded-xl hover:text-rose-600 hover:shadow-sm transition-all"><ArrowLeft size={20} /></button><h2 className="text-lg font-black text-slate-800">Dossiê Digital</h2></div><div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200"><button onClick={() => setActiveDocTab('DECISAO')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeDocTab === 'DECISAO' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Decisão SEPLAN</button><button onClick={() => setActiveDocTab('DESPACHO')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeDocTab === 'DESPACHO' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Despacho SOSFU</button></div></div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-10 flex justify-center"><div className="w-full max-w-2xl bg-white shadow-xl rounded-sm p-16 min-h-[800px] relative text-slate-800 font-serif leading-relaxed"><div className="opacity-10 absolute inset-0 flex items-center justify-center pointer-events-none"><img src={BRASAO_TJPA_URL} className="w-64 grayscale" /></div><div className="text-center mb-10 border-b-2 border-slate-800 pb-6"><img src={BRASAO_TJPA_URL} className="w-16 mx-auto mb-4" /><h3 className="font-bold uppercase tracking-widest text-sm">Poder Judiciário - TJPA</h3>{activeDocTab === 'DECISAO' ? (<h1 className="font-black uppercase text-xl mt-2">{selectedTask.decisionNumber}</h1>) : (<h1 className="font-black uppercase text-xl mt-2">DESPACHO DE ENCAMINHAMENTO</h1>)}</div>{activeDocTab === 'DECISAO' ? (<div className="space-y-6 text-justify"><p><strong>ASSUNTO:</strong> Determinação de desconto em folha de pagamento.</p><p>O <strong>SECRETÁRIO DE PLANEJAMENTO</strong>, no uso de suas atribuições legais, e considerando a decisão proferida nos autos do processo administrativo <strong>{selectedTask.protocol}</strong>, que julgou irregulares as contas apresentadas/identificou despesas não elegíveis:</p><p><strong>DETERMINA</strong> à Secretaria de Gestão de Pessoas (SGP) que proceda a averbação de desconto na folha de pagamento do servidor <strong>{selectedTask.serverName}</strong> (Matrícula: {selectedTask.matricula}), no valor total de <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedTask.value)}</strong>.</p><p>O montante refere-se a <strong>{selectedTask.type}</strong> identificada na prestação de contas de suprimento de fundos. O desconto deve observar os limites da margem consignável prevista em lei.</p><p>Após a efetivação, restituam-se os autos a esta Secretaria para baixa da responsabilidade.</p><div className="mt-20 pt-10 border-t border-slate-300 text-center"><div className="font-bold uppercase">Ordenador de Despesas</div><div className="text-xs uppercase text-slate-500">Assinado Digitalmente</div></div></div>) : (<div className="space-y-6 text-justify"><p><strong>PARA:</strong> Secretaria de Gestão de Pessoas (SGP)</p><p><strong>DE:</strong> Serviço de Suprimento de Fundos (SOSFU)</p><p>Senhor(a) Secretário(a),</p><p>Encaminhamos o presente processo administrativo (<strong>{selectedTask.protocol}</strong>), devidamente instruído, contendo a Decisão do Ordenador de Despesas que determinou a glosa de valores na prestação de contas do servidor <strong>{selectedTask.serverName}</strong>.</p><p>Certificamos que o prazo recursal transcorreu sem manifestação do interessado (Certidão de Trânsito em Julgado Administrativo anexa às fls. XX).</p><p>Solicitamos, portanto, o cumprimento da decisão, com a implantação do desconto em folha e a emissão da respectiva certidão de averbação para fins de baixa da responsabilidade contábil.</p><div className="mt-20 pt-10 border-t border-slate-300 text-center"><div className="font-bold uppercase">Chefe da SOSFU</div><div className="text-xs uppercase text-slate-500">Assinado Digitalmente</div></div></div>)}</div></div>
        </div>
        <div className="flex-1 bg-white flex flex-col h-full shadow-2xl z-10">
          <div className="p-8 border-b border-slate-100 bg-rose-50/30"><h3 className="text-lg font-black text-rose-800 uppercase tracking-tight flex items-center gap-3"><Calculator size={20}/> Terminal de Averbação</h3><p className="text-xs text-rose-600 mt-1">Integração Folha de Pagamento (MentorH)</p></div>
          <div className="flex-1 p-8 space-y-8 overflow-y-auto">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex items-start gap-4"><div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center border border-slate-100 shadow-sm"><UserMinus size={24} className="text-slate-400" /></div><div><h4 className="font-black text-slate-800">{selectedTask.serverName}</h4><p className="text-xs font-medium text-slate-500 uppercase tracking-widest mt-1">Matrícula: {selectedTask.matricula}</p><p className="text-xs font-medium text-slate-500 flex items-center gap-1 mt-1"><Building size={10}/> {selectedTask.lotacao}</p></div></div>
            <div className="space-y-6"><div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rubrica de Desconto</label><select className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-50 transition-all text-sm" value={deductionForm.rubrica} onChange={e => setDeductionForm({...deductionForm, rubrica: e.target.value})}><option>9201 - RESTITUIÇÃO AO ERÁRIO</option><option>9202 - INDENIZAÇÃO DANO AO PATRIMÔNIO</option><option>9205 - DEVOLUÇÃO SUPRIMENTO DE FUNDOS</option></select></div><div className="grid grid-cols-2 gap-6"><div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mês de Referência</label><div className="relative"><Calendar className="absolute left-4 top-3.5 text-slate-400" size={16} /><input type="text" value={deductionForm.refMonth} onChange={e => setDeductionForm({...deductionForm, refMonth: e.target.value})} className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-50 transition-all text-sm"/></div></div><div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Parcelas</label><input type="number" min="1" max="12" value={deductionForm.installments} onChange={e => setDeductionForm({...deductionForm, installments: parseInt(e.target.value)})} className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-50 transition-all text-sm"/></div></div><div className="bg-rose-50 border border-rose-100 p-6 rounded-2xl space-y-4"><div className="flex justify-between items-center text-rose-800"><span className="text-xs font-bold uppercase">Valor Total</span><span className="text-xl font-black">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedTask.value)}</span></div><div className="w-full h-px bg-rose-200"></div><div className="flex justify-between items-center text-rose-600"><span className="text-xs font-medium uppercase">Desconto Mensal Est.</span><span className="text-sm font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedTask.value / deductionForm.installments)}</span></div></div></div>
          </div>
          <div className="p-8 border-t border-slate-100 bg-slate-50"><button onClick={handleProcessDeduction} disabled={isProcessing} className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-rose-700 shadow-xl shadow-rose-200 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">{isProcessing ? (<>Processando Averbação...</>) : (<><Save size={18} /> Confirmar Averbação e Retornar à SOSFU</>)}</button><p className="text-[10px] text-slate-400 text-center mt-4 mx-8 leading-relaxed">Ao confirmar, o sistema gerará automaticamente a <strong>Certidão de Averbação</strong> e tramitará o processo de volta à origem para baixa da responsabilidade.</p></div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full bg-[#f8fafc] overflow-hidden flex flex-col">
      {viewMode !== 'WORKSTATION' && (<header className="bg-white border-b border-slate-200 px-8 py-6 flex justify-between items-center shadow-sm z-20"><div><h1 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3">Gestão de Pessoas <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-lg text-xs font-medium tracking-normal border border-rose-200">SGP</span></h1><p className="text-slate-500 font-medium mt-2 flex items-center gap-2"><Users size={16} className="text-rose-500" /> Módulo de Averbação de Descontos e Ressarcimentos</p></div><div className="flex items-center gap-4"><div className="flex -space-x-3 mr-4">{SGP_TEAM.map(member => (<img key={member.id} src={member.avatar} className="w-10 h-10 rounded-full border-2 border-white shadow-sm cursor-help hover:z-10 transition-all hover:scale-110" title={member.name} />))}</div></div></header>)}
      <div className="flex-1 overflow-hidden relative">{viewMode === 'DASHBOARD' && (<div className="h-full overflow-y-auto custom-scrollbar">{renderDashboard()}</div>)}{viewMode === 'LIST' && (<div className="h-full overflow-y-auto custom-scrollbar">{renderProcessList()}</div>)}{viewMode === 'WORKSTATION' && (<div className="absolute inset-0 z-30">{renderWorkstation()}</div>)}{renderRedistributionModal()}</div>
    </div>
  );
};