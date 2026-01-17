import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { UniversalProcessDetailsPage } from './ProcessDetails';
import { TramitarModal } from './TramitarModal';
import { DocumentCreationWizard } from './DocumentCreationWizard';
import { 
  Scale, 
  Gavel, 
  FileText, 
  Users, 
  Clock, 
  Search, 
  Filter, 
  ChevronRight, 
  ArrowLeft, 
  Save, 
  Send, 
  Layout, 
  List, 
  UserCheck, 
  BookOpen, 
  Edit3, 
  MessageSquare, 
  Sparkles,
  Paperclip,
  Printer,
  Plus,
  Inbox,
  UserCog,
  FileClock,
  CheckSquare,
  CornerUpLeft,
  AlertCircle,
  MoreHorizontal,
  BarChart2,
  UserPlus,
  X,
  FileSearch,
  ArrowRightLeft,
  UserMinus,
  Check
} from 'lucide-react';

const BRASAO_TJPA_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/217479058_brasao-tjpa.png';

type AjsefinView = 'DASHBOARD' | 'KANBAN' | 'EDITOR' | 'INBOX' | 'LIST';
type ListFilterType = 'MY_TASKS' | 'DRAFTS' | 'AWAITING_SIG' | 'RETURNED' | 'TEAM_MEMBER';
type ProcessStatus = 'TRIAGEM' | 'REDACAO' | 'REVISAO' | 'AGUARDANDO_ASSINATURA' | 'DEVOLVIDO' | 'ENVIADO';

interface LegalProcess {
  id: string;
  protocol: string;
  interested: string;
  subject: string;
  origin: 'SOSFU' | 'SEFIN' | 'GESTOR' | 'SGP';
  value: number;
  entryDate: string;
  deadline: string;
  status: ProcessStatus;
  assignedTo: string | null;
  draftType?: 'DECISAO' | 'DESPACHO' | 'PARECER';
  isLate?: boolean;
}

const AJSEFIN_TEAM = [
  { id: '1', name: 'Dr. Carlos Mendes', role: 'Assessor Chefe', avatar: 'https://i.pravatar.cc/150?u=carlos', capacity: 10 },
  { id: '2', name: 'Dra. Ana Paula', role: 'Assessora Sênior', avatar: 'https://i.pravatar.cc/150?u=ana', capacity: 15 },
  { id: '3', name: 'Dr. Pedro Santos', role: 'Assessor', avatar: 'https://i.pravatar.cc/150?u=pedro', capacity: 12 },
  { id: '4', name: 'Dra. Mariana Costa', role: 'Assessora', avatar: 'https://i.pravatar.cc/150?u=mariana', capacity: 12 },
  { id: '5', name: 'Dr. Roberto Lima', role: 'Assessor Júnior', avatar: 'https://i.pravatar.cc/150?u=roberto', capacity: 8 },
];

const CURRENT_USER_ID = '1';

const MOCK_LEGAL_PROCESSES: LegalProcess[] = [
  { id: '1', protocol: 'TJPA-PROC-2026-0001', interested: 'Ademário Silva', subject: 'Solicitação de Suprimento - Sessão de Júri', origin: 'SOSFU', value: 1400.00, entryDate: '10/01/2026', deadline: '12/01/2026', status: 'REDACAO', assignedTo: '1', draftType: 'DECISAO' },
  { id: '2', protocol: 'TJPA-PROC-2026-0045', interested: 'Sec. Informática', subject: 'Aquisição Emergencial de Nobreaks', origin: 'SEFIN', value: 15000.00, entryDate: '09/01/2026', deadline: '11/01/2026', status: 'TRIAGEM', assignedTo: null },
  { id: '3', protocol: 'TJPA-PROC-2026-0089', interested: 'Comarca Santarém', subject: 'Reembolso de Despesas', origin: 'GESTOR', value: 850.00, entryDate: '08/01/2026', deadline: '13/01/2026', status: 'AGUARDANDO_ASSINATURA', assignedTo: '1', draftType: 'DESPACHO' },
  { id: '4', protocol: 'TJPA-PROC-2026-0102', interested: 'SGP', subject: 'Folha de Pagamento Suplementar', origin: 'SGP', value: 125000.00, entryDate: '12/01/2026', deadline: '14/01/2026', status: 'DEVOLVIDO', assignedTo: '1' },
  { id: '5', protocol: 'TJPA-PROC-2026-0115', interested: 'Comarca Marabá', subject: 'Manutenção Predial Urgente', origin: 'SOSFU', value: 5400.00, entryDate: '11/01/2026', deadline: '15/01/2026', status: 'REDACAO', assignedTo: '2' },
  { id: '6', protocol: 'TJPA-PROC-2026-0120', interested: 'Engenharia', subject: 'Laudo Técnico - Reforma', origin: 'SEFIN', value: 0, entryDate: '05/01/2026', deadline: '10/01/2026', status: 'REDACAO', assignedTo: '3', isLate: true },
  { id: '7', protocol: 'TJPA-PROC-2026-0133', interested: 'Presidência', subject: 'Ajuste Orçamentário', origin: 'SEFIN', value: 500000.00, entryDate: '12/01/2026', deadline: '12/01/2026', status: 'TRIAGEM', assignedTo: null },
];

export const AjsefinDashboard: React.FC = () => {
  const [processes, setProcesses] = useState<LegalProcess[]>(MOCK_LEGAL_PROCESSES);
  const [viewMode, setViewMode] = useState<AjsefinView>('DASHBOARD');
  const [listFilter, setListFilter] = useState<ListFilterType>('MY_TASKS');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [activeProcess, setActiveProcess] = useState<LegalProcess | null>(null);
  const [draftContent, setDraftContent] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [redistributionSourceId, setRedistributionSourceId] = useState<string | null>(null);
  
  // States for UniversalProcessDetailsPage integration
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showTramitarModal, setShowTramitarModal] = useState(false);
  const [showDocumentWizard, setShowDocumentWizard] = useState(false);
  const [selectedProcessForDetails, setSelectedProcessForDetails] = useState<LegalProcess | null>(null);
  
  // Fetch current user ID on mount
  useEffect(() => {
    const fetchUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) setCurrentUserId(user.id);
    };
    fetchUserId();
  }, []);

  const stats = useMemo(() => ({
    newInbox: processes.filter(p => p.status === 'TRIAGEM' && !p.assignedTo).length,
    myTasks: processes.filter(p => p.assignedTo === CURRENT_USER_ID && p.status !== 'AGUARDANDO_ASSINATURA').length,
    drafting: processes.filter(p => p.assignedTo === CURRENT_USER_ID && p.status === 'REDACAO').length,
    awaitingSig: processes.filter(p => p.assignedTo === CURRENT_USER_ID && p.status === 'AGUARDANDO_ASSINATURA').length,
    returned: processes.filter(p => p.assignedTo === CURRENT_USER_ID && p.status === 'DEVOLVIDO').length,
  }), [processes]);

  const teamLoad = useMemo(() => AJSEFIN_TEAM.map(member => {
    const memberProcesses = processes.filter(p => p.assignedTo === member.id);
    return { ...member, activeCount: memberProcesses.length, lateCount: memberProcesses.filter(p => p.isLate).length, utilization: (memberProcesses.length / member.capacity) * 100 };
  }), [processes]);

  const getAssignee = (id: string | null) => AJSEFIN_TEAM.find(m => m.id === id);

  const handleOpenEditor = (process: LegalProcess) => {
    setActiveProcess(process);
    setDraftContent(process.draftType === 'DECISAO' ? `DECISÃO ADMINISTRATIVA Nº ___/2026\n\nProcesso: ${process.protocol}\nInteressado: ${process.interested}\nAssunto: ${process.subject}\n\n1. RELATÓRIO\nTrata-se de solicitação de concessão de suprimento de fundos...\n\n2. FUNDAMENTAÇÃO\nConsiderando a manifestação técnica da SOSFU...` : '');
    setViewMode('EDITOR');
  };

  const handleAiSuggest = () => {
    setIsAiGenerating(true);
    setTimeout(() => { setDraftContent(prev => prev + "\n\n[SUGESTÃO IA]:\nDiante do exposto, e considerando a regularidade formal atestada pela unidade técnica (SOSFU), DEFIRO o pedido de concessão, condicionando a liberação do numerário à existência de saldo na dotação orçamentária, conforme art. 68 da Lei 4.320/64."); setIsAiGenerating(false); }, 1500);
  };

  const handleAssign = (processId: string, memberId: string) => {
    setProcesses(prev => prev.map(p => p.id === processId ? { ...p, assignedTo: memberId, status: 'REDACAO' } : p));
    setAssigningId(null);
  };

  const handleBulkRedistribute = (targetMemberId: string) => {
    if (!redistributionSourceId) return;
    setProcesses(prev => prev.map(p => p.assignedTo === redistributionSourceId ? { ...p, assignedTo: targetMemberId } : p));
    setRedistributionSourceId(null);
    alert('Processos redistribuídos com sucesso!');
  };

  const handleCardClick = (view: AjsefinView, filter?: ListFilterType) => { setViewMode(view); if (filter) setListFilter(filter); };
  const handleViewMemberQueue = (memberId: string) => { setSelectedMemberId(memberId); setListFilter('TEAM_MEMBER'); setViewMode('LIST'); };

  const renderRedistributionModal = () => {
    if (!redistributionSourceId) return null;
    const sourceMember = AJSEFIN_TEAM.find(m => m.id === redistributionSourceId);
    const taskCount = processes.filter(p => p.assignedTo === redistributionSourceId).length;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="font-black text-slate-800 flex items-center gap-2"><ArrowRightLeft className="text-purple-600" size={20}/> Redistribuir Carga</h3>
            <button onClick={() => setRedistributionSourceId(null)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
          </div>
          <div className="p-6">
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl mb-6 flex items-start gap-3">
              <UserMinus size={20} className="text-amber-600 shrink-0 mt-0.5"/>
              <div><p className="text-sm font-bold text-amber-800">Origem: {sourceMember?.name}</p><p className="text-xs text-amber-700 mt-1">Este assessor possui <strong>{taskCount} processos</strong> ativos. Selecione o destino para transferir todos os itens.</p></div>
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Selecione o Destino</p>
            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
              {AJSEFIN_TEAM.filter(m => m.id !== redistributionSourceId).map(member => {
                const load = teamLoad.find(t => t.id === member.id);
                return (
                  <button key={member.id} onClick={() => handleBulkRedistribute(member.id)} className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50 transition-all group text-left">
                    <div className="flex items-center gap-3"><img src={member.avatar} className="w-8 h-8 rounded-full"/><div><p className="text-sm font-bold text-slate-700 group-hover:text-purple-700">{member.name}</p><p className="text-[10px] text-slate-400">{member.role}</p></div></div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded ${load && load.utilization > 80 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>{load?.activeCount} ativos</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDashboard = () => (
    <div className="p-8 max-w-[1600px] mx-auto space-y-10 animate-in fade-in">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div onClick={() => handleCardClick('INBOX')} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"><div className="absolute top-0 left-0 w-1 h-full bg-blue-500 group-hover:w-2 transition-all"></div><div className="flex justify-between items-start mb-4"><div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform"><Inbox size={20}/></div><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">Geral</span></div><div><h3 className="text-3xl font-black text-slate-800 mb-1">{stats.newInbox}</h3><p className="text-xs font-bold text-slate-500 uppercase tracking-wide group-hover:text-blue-600">Novos Recebidos</p><p className="text-[10px] text-slate-400 mt-1">Aguardando distribuição</p></div></div>
        <div onClick={() => handleCardClick('LIST', 'MY_TASKS')} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group hover:border-purple-400 hover:shadow-md transition-all cursor-pointer"><div className="absolute top-0 left-0 w-1 h-full bg-purple-500 group-hover:w-2 transition-all"></div><div className="flex justify-between items-start mb-4"><div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition-transform"><UserCog size={20}/></div><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">Minha Fila</span></div><div><h3 className="text-3xl font-black text-slate-800 mb-1">{stats.myTasks}</h3><p className="text-xs font-bold text-slate-500 uppercase tracking-wide group-hover:text-purple-600">Atribuídos a Mim</p><p className="text-[10px] text-slate-400 mt-1">Processos na sua mesa</p></div></div>
        <div onClick={() => handleCardClick('LIST', 'DRAFTS')} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group hover:border-amber-400 hover:shadow-md transition-all cursor-pointer"><div className="absolute top-0 left-0 w-1 h-full bg-amber-500 group-hover:w-2 transition-all"></div><div className="flex justify-between items-start mb-4"><div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform"><FileClock size={20}/></div></div><div><h3 className="text-3xl font-black text-slate-800 mb-1">{stats.drafting}</h3><p className="text-xs font-bold text-slate-500 uppercase tracking-wide group-hover:text-amber-600">Em Minuta</p><p className="text-[10px] text-slate-400 mt-1">Pareceres em elaboração</p></div></div>
        <div onClick={() => handleCardClick('LIST', 'AWAITING_SIG')} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer"><div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 group-hover:w-2 transition-all"></div><div className="flex justify-between items-start mb-4"><div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform"><CheckSquare size={20}/></div><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">SEFIN</span></div><div><h3 className="text-3xl font-black text-slate-800 mb-1">{stats.awaitingSig}</h3><p className="text-xs font-bold text-slate-500 uppercase tracking-wide group-hover:text-emerald-600">Aguard. Assinatura</p><p className="text-[10px] text-slate-400 mt-1">Enviados ao Ordenador</p></div></div>
        <div onClick={() => handleCardClick('LIST', 'RETURNED')} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group hover:border-red-400 hover:shadow-md transition-all cursor-pointer"><div className="absolute top-0 left-0 w-1 h-full bg-red-500 group-hover:w-2 transition-all"></div><div className="flex justify-between items-start mb-4"><div className="p-3 bg-red-50 text-red-600 rounded-xl group-hover:scale-110 transition-transform"><CornerUpLeft size={20}/></div><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">Atenção</span></div><div><h3 className="text-3xl font-black text-slate-800 mb-1">{stats.returned}</h3><p className="text-xs font-bold text-slate-500 uppercase tracking-wide group-hover:text-red-600">Devolvidos</p><p className="text-[10px] text-slate-400 mt-1">Correções solicitadas</p></div></div>
      </div>
      <div className="bg-white rounded-[32px] shadow-lg border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center"><h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-3"><Users size={20} className="text-slate-400"/> Gestão de Atribuições</h3><button onClick={() => setViewMode('KANBAN')} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:text-purple-700 hover:border-purple-200 transition-all shadow-sm"><Layout size={16}/> Ver Quadro Kanban</button></div>
        <table className="w-full text-left border-collapse"><thead className="bg-slate-50 border-b border-slate-200"><tr><th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 w-1/3">Assessor / Cargo</th><th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Carga de Trabalho</th><th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Alertas</th><th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Ações</th></tr></thead>
        <tbody className="divide-y divide-slate-100">{teamLoad.map(member => (<tr key={member.id} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => handleViewMemberQueue(member.id)}><td className="px-8 py-6"><div className="flex items-center gap-4"><div className="relative"><img src={member.avatar} className="w-12 h-12 rounded-2xl border-2 border-white shadow-md group-hover:scale-105 transition-transform" /><div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full ${member.activeCount > 8 ? 'bg-amber-500' : 'bg-emerald-500'}`}></div></div><div><p className="text-sm font-black text-slate-800">{member.name}</p><p className="text-[11px] font-medium text-slate-500 mt-0.5">{member.role}</p></div></div></td><td className="px-8 py-6"><div className="max-w-xs"><div className="flex justify-between text-xs font-bold mb-2"><span className="text-slate-600">{member.activeCount} Processos</span><span className="text-slate-400">{Math.round(member.utilization)}% Cap.</span></div><div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${member.utilization > 90 ? 'bg-red-500' : member.utilization > 70 ? 'bg-amber-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(member.utilization, 100)}%` }}></div></div></div></td><td className="px-8 py-6 text-center">{member.lateCount > 0 ? (<span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-[10px] font-black uppercase tracking-wide border border-red-100"><AlertCircle size={12}/> {member.lateCount} Atrasados</span>) : (<span className="text-slate-300 font-bold text-xs">-</span>)}</td><td className="px-8 py-6 text-right"><div className="flex items-center justify-end gap-2"><button onClick={(e) => { e.stopPropagation(); handleViewMemberQueue(member.id); }} className="p-2 bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 rounded-xl transition-all shadow-sm" title="Ver Fila de Processos"><List size={16}/></button><button onClick={(e) => { e.stopPropagation(); setRedistributionSourceId(member.id); }} className="p-2 bg-white border border-slate-200 text-slate-500 hover:text-purple-600 hover:border-purple-200 rounded-xl transition-all shadow-sm" title="Redistribuir Carga"><ArrowRightLeft size={16}/></button></div></td></tr>))}</tbody></table>
      </div>
    </div>
  );

  const renderProcessList = () => {
    let config = { title: 'Minha Fila de Trabalho', desc: 'Processos ativos atribuídos a você.', color: 'text-purple-600', bg: 'bg-purple-50', icon: UserCog };
    let filteredProcesses = processes;
    if (listFilter === 'MY_TASKS') { filteredProcesses = processes.filter(p => p.assignedTo === CURRENT_USER_ID && p.status !== 'AGUARDANDO_ASSINATURA'); }
    else if (listFilter === 'DRAFTS') { config = { title: 'Rascunhos e Minutas', desc: 'Documentos em fase de redação.', color: 'text-amber-600', bg: 'bg-amber-50', icon: FileClock }; filteredProcesses = processes.filter(p => p.assignedTo === CURRENT_USER_ID && p.status === 'REDACAO'); }
    else if (listFilter === 'AWAITING_SIG') { config = { title: 'Aguardando Assinatura', desc: 'Enviados para o Ordenador de Despesa.', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckSquare }; filteredProcesses = processes.filter(p => p.assignedTo === CURRENT_USER_ID && p.status === 'AGUARDANDO_ASSINATURA'); }
    else if (listFilter === 'RETURNED') { config = { title: 'Processos Devolvidos', desc: 'Requer atenção imediata para correção.', color: 'text-red-600', bg: 'bg-red-50', icon: CornerUpLeft }; filteredProcesses = processes.filter(p => p.assignedTo === CURRENT_USER_ID && p.status === 'DEVOLVIDO'); }
    else if (listFilter === 'TEAM_MEMBER' && selectedMemberId) { const member = AJSEFIN_TEAM.find(m => m.id === selectedMemberId); config = { title: `Fila: ${member?.name.split('Dr. ')[1] || 'Assessor'}`, desc: `Processos sob responsabilidade de ${member?.name}.`, color: 'text-blue-600', bg: 'bg-blue-50', icon: Users }; filteredProcesses = processes.filter(p => p.assignedTo === selectedMemberId); }
    return (
      <div className="p-8 max-w-[1200px] mx-auto animate-in slide-in-from-right-4">
        <div className="flex justify-between items-center mb-8"><div className="flex items-center gap-4"><button onClick={() => setViewMode('DASHBOARD')} className="p-3 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-blue-600 hover:shadow-md transition-all"><ArrowLeft size={20} /></button><div><h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3"><config.icon className={config.color} size={28}/> {config.title}</h2><p className="text-slate-500 text-sm font-medium">{config.desc}</p></div></div><div className={`px-4 py-2 ${config.bg} ${config.color} rounded-lg text-xs font-bold border border-slate-100 shadow-sm`}>{filteredProcesses.length} Registros</div></div>
        <div className="bg-white rounded-[24px] shadow-lg border border-slate-200 overflow-hidden"><table className="w-full text-left"><thead className="bg-slate-50 border-b border-slate-200"><tr><th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Protocolo / Interessado</th><th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Assunto</th><th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Origem / Status</th><th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Prazo</th><th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Ação</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredProcesses.length === 0 ? (<tr><td colSpan={5} className="px-6 py-20 text-center text-slate-400"><div className="flex flex-col items-center gap-3"><FileSearch size={48} className="text-slate-200"/><p className="font-medium text-sm">Nenhum processo encontrado nesta fila.</p></div></td></tr>) : (filteredProcesses.map(p => (<tr key={p.id} className="hover:bg-slate-50 transition-colors group"><td className="px-6 py-4"><div className="font-bold text-slate-700 text-sm">{p.interested}</div><div className="text-[10px] font-mono text-slate-400">{p.protocol}</div></td><td className="px-6 py-4"><div className="text-xs font-medium text-slate-600 max-w-xs truncate" title={p.subject}>{p.subject}</div><div className="text-[10px] text-slate-400 mt-0.5">{p.draftType || 'Parecer'}</div></td><td className="px-6 py-4"><div className="flex flex-col items-start gap-1"><span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${p.origin === 'SOSFU' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{p.origin}</span><span className="text-[10px] text-slate-500 font-bold">{p.status}</span></div></td><td className="px-6 py-4"><span className={`text-xs font-bold ${p.isLate ? 'text-red-600 bg-red-50 px-2 py-1 rounded' : 'text-slate-500'}`}>{p.deadline}</span></td><td className="px-6 py-4 text-right relative">{listFilter === 'AWAITING_SIG' ? (<span className="text-xs font-bold text-slate-400 italic">Em análise externa</span>) : listFilter === 'TEAM_MEMBER' ? (<><button onClick={() => setAssigningId(assigningId === p.id ? null : p.id)} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 transition-all shadow-sm"><UserPlus size={14}/> Reatribuir</button>{assigningId === p.id && (<div className="absolute right-6 top-12 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 animate-in zoom-in-95 origin-top-right overflow-hidden text-left"><div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex justify-between items-center"><span className="text-[10px] font-black text-slate-500 uppercase">Novo Responsável</span><button onClick={() => setAssigningId(null)}><X size={14} className="text-slate-400 hover:text-slate-600"/></button></div><div className="max-h-64 overflow-y-auto">{AJSEFIN_TEAM.filter(m => m.id !== p.assignedTo).map(member => { const load = teamLoad.find(t => t.id === member.id); return (<button key={member.id} onClick={() => handleAssign(p.id, member.id)} className="w-full text-left px-4 py-3 hover:bg-purple-50 flex items-center gap-3 border-b border-slate-50 last:border-0 group/item transition-colors"><img src={member.avatar} className="w-8 h-8 rounded-full border border-slate-100"/><div className="flex-1"><p className="text-xs font-bold text-slate-700 group-hover/item:text-purple-700">{member.name}</p><div className="flex justify-between items-center mt-1"><span className="text-[9px] text-slate-400">{member.role}</span><span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${load && load.utilization > 80 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>{load?.activeCount} ativos</span></div></div></button>); })}</div></div>)}</>) : (<button onClick={() => handleOpenEditor(p)} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 transition-all shadow-sm"><Edit3 size={14}/> {listFilter === 'RETURNED' ? 'Corrigir' : 'Abrir'}</button>)}</td></tr>)))}</tbody></table></div>
      </div>
    );
  };

  const renderInbox = () => {
    const unassignedProcesses = processes.filter(p => p.status === 'TRIAGEM' && !p.assignedTo);
    return (
      <div className="p-8 max-w-[1200px] mx-auto animate-in slide-in-from-right-4">
        <div className="flex justify-between items-center mb-8"><div className="flex items-center gap-4"><button onClick={() => setViewMode('DASHBOARD')} className="p-3 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-blue-600 hover:shadow-md transition-all"><ArrowLeft size={20} /></button><div><h2 className="text-2xl font-black text-slate-800 tracking-tight">Caixa de Entrada</h2><p className="text-slate-500 text-sm font-medium">Distribuição de processos novos para a equipe.</p></div></div><div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold border border-blue-100">{unassignedProcesses.length} Pendentes</div></div>
        <div className="bg-white rounded-[24px] shadow-lg border border-slate-200 overflow-hidden"><table className="w-full text-left"><thead className="bg-slate-50 border-b border-slate-200"><tr><th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Protocolo / Interessado</th><th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Assunto</th><th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Origem</th><th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Entrada</th><th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Ação</th></tr></thead><tbody className="divide-y divide-slate-100">{unassignedProcesses.length === 0 ? (<tr><td colSpan={5} className="px-6 py-20 text-center text-slate-400"><div className="flex flex-col items-center gap-3"><CheckSquare size={48} className="text-emerald-200"/><p className="font-medium text-sm">Tudo limpo! Não há novos processos para distribuir.</p></div></td></tr>) : (unassignedProcesses.map(p => (<tr key={p.id} className="hover:bg-slate-50 transition-colors group"><td className="px-6 py-4"><div className="font-bold text-slate-700 text-sm">{p.interested}</div><div className="text-[10px] font-mono text-slate-400">{p.protocol}</div></td><td className="px-6 py-4"><div className="text-xs font-medium text-slate-600 max-w-xs truncate" title={p.subject}>{p.subject}</div></td><td className="px-6 py-4"><span className={`text-[9px] font-black px-2 py-1 rounded uppercase tracking-wider ${p.origin === 'SOSFU' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{p.origin}</span></td><td className="px-6 py-4 text-xs font-medium text-slate-500">{p.entryDate}</td><td className="px-6 py-4 text-right relative"><button onClick={() => setAssigningId(assigningId === p.id ? null : p.id)} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 transition-all shadow-sm"><UserPlus size={14}/> Atribuir</button>{assigningId === p.id && (<div className="absolute right-6 top-14 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 animate-in zoom-in-95 origin-top-right overflow-hidden"><div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex justify-between items-center"><span className="text-[10px] font-black text-slate-500 uppercase">Selecione o Assessor</span><button onClick={() => setAssigningId(null)}><X size={14} className="text-slate-400 hover:text-slate-600"/></button></div><div className="max-h-64 overflow-y-auto">{AJSEFIN_TEAM.map(member => { const load = teamLoad.find(t => t.id === member.id); return (<button key={member.id} onClick={() => handleAssign(p.id, member.id)} className="w-full text-left px-4 py-3 hover:bg-purple-50 flex items-center gap-3 border-b border-slate-50 last:border-0 group/item transition-colors"><img src={member.avatar} className="w-8 h-8 rounded-full border border-slate-100"/><div className="flex-1"><p className="text-xs font-bold text-slate-700 group-hover/item:text-purple-700">{member.name}</p><div className="flex justify-between items-center mt-1"><span className="text-[9px] text-slate-400">{member.role}</span><span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${load && load.utilization > 80 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>{load?.activeCount} ativos</span></div></div></button>); })}</div></div>)}</td></tr>)))}</tbody></table></div>
      </div>
    );
  };

  const renderKanban = () => {
    const columns: { id: ProcessStatus; label: string; color: string }[] = [{ id: 'TRIAGEM', label: 'Triagem / Distribuição', color: 'border-slate-300' }, { id: 'REDACAO', label: 'Em Redação', color: 'border-purple-300' }, { id: 'REVISAO', label: 'Revisão Chefia', color: 'border-amber-300' }, { id: 'AGUARDANDO_ASSINATURA', label: 'Aguard. Assinatura', color: 'border-emerald-300' }];
    return (<div className="flex gap-6 h-full overflow-x-auto pb-4 p-6">{columns.map(col => (<div key={col.id} className="min-w-[320px] flex flex-col h-full bg-slate-100/50 rounded-2xl p-4 border border-slate-200"><div className={`flex justify-between items-center mb-4 pb-2 border-b-2 ${col.color}`}><h3 className="font-bold text-slate-700 uppercase text-xs tracking-widest">{col.label}</h3><span className="bg-white text-slate-600 text-[10px] font-black px-2 py-1 rounded-lg shadow-sm">{processes.filter(p => p.status === col.id).length}</span></div><div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-2">{processes.filter(p => p.status === col.id).map(process => { const assignee = getAssignee(process.assignedTo); return (<div key={process.id} onClick={() => handleOpenEditor(process)} className={`bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-purple-300 transition-all cursor-pointer group ${process.isLate ? 'border-l-4 border-l-red-500' : ''}`}><div className="flex justify-between items-start mb-2"><span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${process.origin === 'SOSFU' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{process.origin}</span><span className={`text-[10px] font-mono ${process.isLate ? 'text-red-600 font-bold' : 'text-slate-400'}`}>{process.deadline}</span></div><h4 className="text-sm font-bold text-slate-800 leading-tight mb-1 line-clamp-2">{process.subject}</h4><p className="text-xs text-slate-500 font-medium mb-3">{process.protocol}</p><div className="flex justify-between items-center pt-3 border-t border-slate-50"><div className="flex items-center gap-2">{assignee ? (<><img src={assignee.avatar} className="w-6 h-6 rounded-full border border-slate-100" title={assignee.name} /><span className="text-[10px] font-bold text-slate-600 truncate max-w-[80px]">{assignee.name.split(' ')[1]}</span></>) : (<span className="text-[10px] italic text-slate-400 flex items-center gap-1"><UserCheck size={10}/> A Distribuir</span>)}</div><button className="text-purple-600 hover:bg-purple-50 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Edit3 size={14} /></button></div></div>); })}</div></div>))}</div>);
  };

  const renderEditor = () => {
    if (!activeProcess) return null;
    return (
      <div className="flex h-full animate-in slide-in-from-right-4 duration-300 bg-slate-50">
        <aside className="w-[400px] bg-white border-r border-slate-200 flex flex-col z-10 shadow-lg"><div className="p-6 border-b border-slate-100 bg-slate-50/50"><button onClick={() => setViewMode('DASHBOARD')} className="flex items-center gap-2 text-slate-500 hover:text-purple-700 text-xs font-bold uppercase tracking-widest mb-4 transition-colors"><ArrowLeft size={14} /> Voltar ao Painel</button><h2 className="text-xl font-black text-slate-800 leading-tight">{activeProcess.subject}</h2><p className="text-sm text-purple-600 font-mono font-bold mt-1">{activeProcess.protocol}</p></div><div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar"><div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3"><div className="flex justify-between text-xs"><span className="text-slate-500 font-medium">Interessado</span><span className="font-bold text-slate-800 text-right w-1/2 truncate">{activeProcess.interested}</span></div><div className="flex justify-between text-xs"><span className="text-slate-500 font-medium">Valor</span><span className="font-bold text-slate-800">R$ {activeProcess.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div><div className="flex justify-between text-xs"><span className="text-slate-500 font-medium">Prazo Legal</span><span className="font-bold text-red-600">{activeProcess.deadline}</span></div></div><div className="space-y-4"><h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><BookOpen size={14} /> Peças dos Autos</h3><div className="space-y-2">{[{ title: 'Solicitação Inicial', page: '02', author: 'Gestor' }, { title: 'Análise Técnica SOSFU', page: '05', author: 'Analista Jaires', highlight: true }, { title: 'Consulta Saldo SIAFE', page: '06', author: 'Sistema' }].map((doc, i) => (<button key={i} className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 group ${doc.highlight ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200 hover:border-purple-300'}`}><div className="w-8 h-8 bg-white border border-slate-100 rounded-lg flex items-center justify-center text-[10px] font-bold text-slate-400 shadow-sm">{doc.page}</div><div><p className={`text-xs font-bold ${doc.highlight ? 'text-blue-700' : 'text-slate-700'}`}>{doc.title}</p><p className="text-[10px] text-slate-400">Por: {doc.author}</p></div>{doc.highlight && <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></div>}</button>))}</div></div><div className="bg-purple-50 border border-purple-100 p-4 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-purple-100 transition-colors"><div className="p-2 bg-purple-200 text-purple-700 rounded-lg"><Paperclip size={16}/></div><div><p className="text-xs font-bold text-purple-900">Anexar Novo Documento</p><p className="text-[10px] text-purple-600">PDF, Imagens ou Planilhas</p></div></div></div></aside>
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100 relative"><div className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm z-20"><div className="flex items-center gap-4"><div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200"><button className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white rounded shadow-sm">Edição</button><button className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700">Visualizar PDF</button></div><div className="h-6 w-px bg-slate-200"></div><button onClick={handleAiSuggest} disabled={isAiGenerating} className="flex items-center gap-2 text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg hover:bg-purple-100 transition-all border border-purple-100">{isAiGenerating ? <Sparkles size={14} className="animate-spin" /> : <Sparkles size={14} />} IA: Sugerir Fundamentação</button></div><div className="flex items-center gap-3"><button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all"><Save size={16} /> Salvar Rascunho</button><button onClick={() => { alert('Minuta tramitada para o Ordenador de Despesa (SEFIN)!'); setViewMode('DASHBOARD'); }} className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 shadow-lg shadow-purple-200 transition-all"><Send size={16} /> Finalizar e Tramitar</button></div></div><div className="flex-1 overflow-y-auto p-12 flex justify-center custom-scrollbar"><div className="w-[800px] min-h-[1000px] bg-white shadow-2xl p-20 relative animate-in zoom-in-95 duration-300"><div className="text-center mb-10 opacity-80"><img src={BRASAO_TJPA_URL} className="w-20 mx-auto mb-4 grayscale" /><h3 className="font-bold text-slate-900 uppercase text-sm">Poder Judiciário do Estado do Pará</h3><p className="text-xs text-slate-500 uppercase tracking-widest">Assessoria Jurídica da SEFIN</p></div><textarea className="w-full h-full resize-none outline-none font-serif text-lg leading-relaxed text-slate-800 bg-transparent placeholder-slate-300" value={draftContent} onChange={(e) => setDraftContent(e.target.value)} placeholder="Comece a redigir sua minuta aqui..."/><div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.02]"><Scale size={400} /></div></div></div></main>
      </div>
    );
  };

  return (
    <div className="h-full bg-[#f8fafc] flex flex-col overflow-hidden">
      {viewMode !== 'EDITOR' && (<header className="bg-white border-b border-slate-200 px-8 py-6 flex justify-between items-center shadow-sm z-20"><div><h1 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3">Módulo Jurídico <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium tracking-normal border border-purple-200">AJSEFIN</span></h1><p className="text-slate-500 font-medium mt-2 flex items-center gap-2"><Scale size={16} className="text-purple-500" /> Painel de Controle e Minutas Jurídicas</p></div><div className="flex items-center gap-4"><div className="flex -space-x-3 mr-4">{AJSEFIN_TEAM.map(member => (<img key={member.id} src={member.avatar} className="w-10 h-10 rounded-full border-2 border-white shadow-sm cursor-help hover:z-10 transition-all hover:scale-110" title={member.name} />))}</div><button className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg"><Plus size={16} /> Novo Processo</button></div></header>)}
      <div className="flex-1 overflow-hidden relative">
        {viewMode === 'DASHBOARD' && <div className="h-full overflow-y-auto custom-scrollbar">{renderDashboard()}</div>}
        {viewMode === 'INBOX' && <div className="h-full overflow-y-auto custom-scrollbar">{renderInbox()}</div>}
        {viewMode === 'LIST' && <div className="h-full overflow-y-auto custom-scrollbar">{renderProcessList()}</div>}
        {viewMode === 'KANBAN' && <><div className="p-6 pb-0 flex justify-end"><button onClick={() => setViewMode('DASHBOARD')} className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase hover:text-purple-700"><BarChart2 size={16}/> Voltar ao Painel</button></div>{renderKanban()}</>}
        {viewMode === 'EDITOR' && <div className="absolute inset-0 z-30">{renderEditor()}</div>}
        {renderRedistributionModal()}
      </div>

      {/* Universal Process Details Page */}
      {selectedProcessForDetails && (
        <div className="fixed inset-0 z-[100] bg-white">
          <UniversalProcessDetailsPage
            processId={selectedProcessForDetails.id}
            currentUserId={currentUserId || ''}
            onClose={() => setSelectedProcessForDetails(null)}
            canTramitar={true}
            canGenerateAtesto={false}
            canCreateDocument={true}
            onTramitar={() => setShowTramitarModal(true)}
            onGenerateAtesto={undefined}
            onCreateDocument={() => setShowDocumentWizard(true)}
          />
        </div>
      )}

      {/* Tramitar Modal */}
      {showTramitarModal && selectedProcessForDetails && (
        <TramitarModal
          isOpen={true}
          onClose={() => setShowTramitarModal(false)}
          processId={selectedProcessForDetails.id}
          processNup={selectedProcessForDetails.protocol}
          currentStatus={selectedProcessForDetails.status || 'TRIAGEM'}
          currentModule="AJSEFIN"
          onSuccess={() => {
            setShowTramitarModal(false);
            setSelectedProcessForDetails(null);
          }}
        />
      )}

      {/* Document Creation Wizard */}
      {showDocumentWizard && selectedProcessForDetails && (
        <DocumentCreationWizard
          isOpen={true}
          processId={selectedProcessForDetails.id}
          nup={selectedProcessForDetails.protocol}
          currentUser={null}
          onClose={() => setShowDocumentWizard(false)}
          onSuccess={() => {
            setShowDocumentWizard(false);
          }}
        />
      )}
    </div>
  );
};