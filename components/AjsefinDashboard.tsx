import React, { useState, useMemo, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useToast } from './ui/ToastProvider';
import { UniversalProcessDetailsPage } from './ProcessDetails';
import { TramitarModal } from './TramitarModal';
import { DocumentCreationWizard } from './DocumentCreationWizard';
import { AutorizacaoExcepcionalView } from './Ajsefin/AutorizacaoExcepcionalView';
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
  Check,
  ArrowRight,
  Zap,
  Calendar,
  Timer,
  CheckCircle2
} from 'lucide-react';

const BRASAO_TJPA_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/217479058_brasao-tjpa.png';

type AjsefinView = 'DASHBOARD' | 'KANBAN' | 'EDITOR' | 'INBOX' | 'LIST' | 'AUTORIZACAO_JURI';
type ListFilterType = 'MY_TASKS' | 'DRAFTS' | 'AWAITING_SIG' | 'SIGNED' | 'RETURNED' | 'TEAM_MEMBER';
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

// Tipo para membro da equipe AJSEFIN
interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  capacity: number;
}

export const AjsefinDashboard: React.FC = () => {
  const [processes, setProcesses] = useState<LegalProcess[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
  const [currentUserName, setCurrentUserName] = useState<string>('Assessor');
  const [showTramitarModal, setShowTramitarModal] = useState(false);
  const [showDocumentWizard, setShowDocumentWizard] = useState(false);
  const [selectedProcessForDetails, setSelectedProcessForDetails] = useState<LegalProcess | null>(null);
  const [filterPeriod, setFilterPeriod] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');
  
  // Sprint 3: Animation and notification states
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const prevProcessCountRef = useRef<number>(0);
  const { showToast } = useToast();
  
  // Fetch current user ID and data on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // 1. Fetch current user
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          setCurrentUserId(user.id);
          // Fetch user name for Welcome Card
          const { data: profile } = await supabase
            .from('profiles')
            .select('nome')
            .eq('id', user.id)
            .single();
          if (profile?.nome) {
            setCurrentUserName(profile.nome.split(' ')[0]);
          }
        }

        // 2. Fetch AJSEFIN team members from profiles
        const { data: ajsefinProfiles, error: teamError } = await supabase
          .from('profiles')
          .select('id, nome, cargo, avatar_url')
          .eq('role', 'AJSEFIN');
        
        if (teamError) console.error('Error fetching AJSEFIN team:', teamError);
        else if (ajsefinProfiles) {
          const team: TeamMember[] = ajsefinProfiles.map((p, index) => {
            // Generate initials-based fallback avatar
            const initials = (p.nome || 'U').split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
            const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=7c3aed&color=fff&bold=true&size=128`;
            
            return {
              id: p.id,
              name: p.nome || `Assessor ${index + 1}`,
              role: p.cargo || 'Assessor Jurídico',
              avatar: p.avatar_url || fallbackAvatar, // Use avatar_url from profile, or initials-based fallback
              capacity: 10 // Capacidade padrão
            };
          });
          setTeamMembers(team);
          console.log('[AJSEFIN] Team members loaded:', team.length, team.map(t => ({ name: t.name, hasAvatar: !!ajsefinProfiles.find(p => p.id === t.id)?.avatar_url })));
        }

        // 3. Fetch real processes destined to AJSEFIN
        // Simplified query for debugging - just use destino_atual
        const { data: solicitacoes, error: processError } = await supabase
          .from('solicitacoes')
          .select(`
            id,
            nup,
            user_id,
            descricao,
            tipo,
            valor_solicitado,
            created_at,
            sla_internal,
            status,
            destino_atual,
            ajsefin_responsavel_id,
            profiles:user_id(nome)
          `)
          .eq('destino_atual', 'AJSEFIN')
          .order('created_at', { ascending: false });

        console.log('[AJSEFIN] Query result - solicitacoes:', solicitacoes, 'error:', processError);

        if (processError) console.error('Error fetching processes:', processError);
        else if (solicitacoes) {
          const mappedProcesses: LegalProcess[] = solicitacoes.map((s: any) => {
            // Determine status based on solicitacao status and assignment
            let mappedStatus: ProcessStatus = 'TRIAGEM';
            const statusUpper = (s.status || '').toUpperCase();
            const hasResponsavel = !!s.ajsefin_responsavel_id;
            
            // If has responsible, it's in REDACAO (drafting)
            // If no responsible, it's in TRIAGEM (new inbox)
            if (statusUpper.includes('ANALISE AJSEFIN')) {
              mappedStatus = hasResponsavel ? 'REDACAO' : 'TRIAGEM';
            } else if (statusUpper.includes('DOCUMENTO ASSINADO')) {
              // Returned from SEFIN after Ordenador signature - ready for tramitation to SOSFU
              mappedStatus = 'ENVIADO'; // Use ENVIADO status for docs signed by Ordenador and ready to tramitate
            } else if (statusUpper.includes('AGUARDANDO ASSINATURA')) {
              // Still waiting for SEFIN signature - only match explicit 'AGUARDANDO ASSINATURA'
              mappedStatus = 'AGUARDANDO_ASSINATURA';
            } else if (statusUpper.includes('DEVOLVIDO')) {
              mappedStatus = 'DEVOLVIDO';
            }

            // Get suprido name from joined profiles
            const supridoName = s.profiles?.nome || 'Suprido';

            return {
              id: s.id,
              protocol: s.nup || `TJPA-${s.id.substring(0,8)}`,
              interested: supridoName,
              subject: s.descricao || s.tipo || 'N/A',
              origin: 'SOSFU' as const,
              value: s.valor_solicitado || 0,
              entryDate: s.created_at ? new Date(s.created_at).toLocaleDateString('pt-BR') : '-',
              deadline: s.sla_internal ? new Date(s.sla_internal).toLocaleDateString('pt-BR') : '-',
              status: mappedStatus,
              assignedTo: s.ajsefin_responsavel_id || null,
              draftType: 'DECISAO' as const,
              isLate: s.sla_internal ? new Date(s.sla_internal) < new Date() : false
            };
          });
          setProcesses(mappedProcesses);
          console.log('[AJSEFIN] Loaded processes:', mappedProcesses.length, mappedProcesses.map(p => ({ 
            id: p.id.substring(0,8), 
            status: p.status, 
            assignedTo: p.assignedTo ? p.assignedTo.substring(0,8) : null 
          })));
        }
      } catch (err) {
        console.error('Error loading AJSEFIN data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Sprint 3: Notify when new processes arrive
  useEffect(() => {
    const newInboxCount = processes.filter(p => p.status === 'TRIAGEM' && !p.assignedTo).length;
    
    if (prevProcessCountRef.current > 0 && newInboxCount > prevProcessCountRef.current) {
      const diff = newInboxCount - prevProcessCountRef.current;
      showToast({
        type: 'info',
        title: `📥 ${diff} novo${diff > 1 ? 's' : ''} processo${diff > 1 ? 's' : ''}!`,
        message: 'Novos processos chegaram na sua caixa de entrada.'
      });
    }
    
    prevProcessCountRef.current = newInboxCount;
  }, [processes, showToast]);

  const stats = useMemo(() => ({
    newInbox: processes.filter(p => p.status === 'TRIAGEM' && !p.assignedTo).length,
    myTasks: processes.filter(p => p.assignedTo === currentUserId && !['AGUARDANDO_ASSINATURA', 'ENVIADO'].includes(p.status)).length,
    drafting: processes.filter(p => p.assignedTo === currentUserId && p.status === 'REDACAO').length,
    awaitingSig: processes.filter(p => p.status === 'AGUARDANDO_ASSINATURA').length, // Global - all processes waiting SEFIN sig
    signed: processes.filter(p => p.status === 'ENVIADO').length, // Documents signed by SEFIN, ready to tramitate
    returned: processes.filter(p => p.assignedTo === currentUserId && p.status === 'DEVOLVIDO').length,
  }), [processes, currentUserId]);

  const teamLoad = useMemo(() => teamMembers.map(member => {
    const memberProcesses = processes.filter(p => p.assignedTo === member.id);
    return { ...member, activeCount: memberProcesses.length, lateCount: memberProcesses.filter(p => p.isLate).length, utilization: (memberProcesses.length / member.capacity) * 100 };
  }), [processes, teamMembers]);

  // Keyboard shortcut: Esc to go back
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedProcessForDetails) {
          setSelectedProcessForDetails(null);
        } else if (viewMode !== 'DASHBOARD') {
          setViewMode('DASHBOARD');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, selectedProcessForDetails]);

  // Calculate upcoming deadlines for Radar
  const upcomingDeadlines = useMemo(() => {
    const myProcesses = processes.filter(p => p.assignedTo === currentUserId);
    return myProcesses
      .filter(p => p.deadline !== '-')
      .map(p => {
        const deadlineDate = new Date(p.deadline.split('/').reverse().join('-'));
        const now = new Date();
        const daysUntil = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return { ...p, daysUntil };
      })
      .filter(p => p.daysUntil <= 7) // Only show next 7 days
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 5); // Max 5 items
  }, [processes, currentUserId]);

  const getAssignee = (id: string | null) => teamMembers.find(m => m.id === id);

  const handleOpenEditor = (process: LegalProcess) => {
    console.log('[AJSEFIN] handleOpenEditor called with process:', process?.id, process?.protocol, process?.subject);
    if (!process) {
      console.error('[AJSEFIN] handleOpenEditor: process is undefined!');
      return;
    }
    // CRITICAL: Clear any open details modal first
    setSelectedProcessForDetails(null);
    setActiveProcess(process);
    setDraftContent(process.draftType === 'DECISAO' ? `DECISÃO ADMINISTRATIVA Nº ___/2026\n\nProcesso: ${process.protocol}\nInteressado: ${process.interested}\nAssunto: ${process.subject}\n\n1. RELATÓRIO\nTrata-se de solicitação de concessão de suprimento de fundos...\n\n2. FUNDAMENTAÇÃO\nConsiderando a manifestação técnica da SOSFU...` : '');
    setViewMode('EDITOR');
  };

  const handleAiSuggest = () => {
    setIsAiGenerating(true);
    setTimeout(() => { setDraftContent(prev => prev + "\n\n[SUGESTÃO IA]:\nDiante do exposto, e considerando a regularidade formal atestada pela unidade técnica (SOSFU), DEFIRO o pedido de concessão, condicionando a liberação do numerário à existência de saldo na dotação orçamentária, conforme art. 68 da Lei 4.320/64."); setIsAiGenerating(false); }, 1500);
  };

  const handleAssign = async (processId: string, memberId: string) => {
    console.log('[AJSEFIN] handleAssign called:', { processId, memberId, teamMembersCount: teamMembers.length });
    try {
      // Persist assignment to database
      const { error, data } = await supabase
        .from('solicitacoes')
        .update({ ajsefin_responsavel_id: memberId })
        .eq('id', processId)
        .select();
      
      console.log('[AJSEFIN] Assignment result:', { error, data });
      
      if (error) {
        console.error('Error assigning process:', error);
        alert('Erro ao atribuir processo. Tente novamente.');
        return;
      }
      
      // Update local state
      setProcesses(prev => prev.map(p => p.id === processId ? { ...p, assignedTo: memberId, status: 'REDACAO' } : p));
      setAssigningId(null);
      alert('Processo atribuído com sucesso!');
    } catch (err) {
      console.error('Error in handleAssign:', err);
      alert('Erro ao atribuir processo.');
    }
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
    const sourceMember = teamMembers.find(m => m.id === redistributionSourceId);
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
              {teamMembers.filter(m => m.id !== redistributionSourceId).map(member => {
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
      
      {/* Welcome Card */}
      {stats.myTasks > 0 && (
        <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 p-6 rounded-2xl shadow-xl relative overflow-hidden group">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <Scale className="absolute top-4 right-4 text-white/10" size={48} />
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <span className="text-2xl">⚖️</span>
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Olá, {currentUserName}!</h2>
                <p className="text-purple-100 text-sm font-medium mt-0.5">
                  Você tem <span className="font-black text-white">{stats.myTasks} processo{stats.myTasks !== 1 ? 's' : ''}</span> aguardando sua análise.
                </p>
              </div>
            </div>
            <button 
              onClick={() => handleCardClick('LIST', 'MY_TASKS')}
              className="flex items-center gap-2 px-6 py-3 bg-white text-purple-700 rounded-xl font-black text-sm hover:bg-purple-50 shadow-lg transition-all transform hover:scale-105 active:scale-95"
            >
              <UserCog size={18} />
              Ver Minha Fila
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-6 gap-5">
        <div onClick={() => handleCardClick('INBOX')} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"><div className="absolute top-0 left-0 w-1 h-full bg-blue-500 group-hover:w-2 transition-all"></div><div className="flex justify-between items-start mb-4"><div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform"><Inbox size={20}/></div><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">Geral</span></div><div><h3 className="text-3xl font-black text-slate-800 mb-1">{stats.newInbox}</h3><p className="text-xs font-bold text-slate-500 uppercase tracking-wide group-hover:text-blue-600">Novos Recebidos</p><p className="text-[10px] text-slate-400 mt-1">Aguardando distribuição</p></div></div>
        <div onClick={() => handleCardClick('LIST', 'MY_TASKS')} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group hover:border-purple-400 hover:shadow-md transition-all cursor-pointer"><div className="absolute top-0 left-0 w-1 h-full bg-purple-500 group-hover:w-2 transition-all"></div><div className="flex justify-between items-start mb-4"><div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition-transform"><UserCog size={20}/></div><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">Minha Fila</span></div><div><h3 className="text-3xl font-black text-slate-800 mb-1">{stats.myTasks}</h3><p className="text-xs font-bold text-slate-500 uppercase tracking-wide group-hover:text-purple-600">Atribuídos a Mim</p><p className="text-[10px] text-slate-400 mt-1">Processos na sua mesa</p></div></div>
        <div onClick={() => handleCardClick('LIST', 'DRAFTS')} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group hover:border-amber-400 hover:shadow-md transition-all cursor-pointer"><div className="absolute top-0 left-0 w-1 h-full bg-amber-500 group-hover:w-2 transition-all"></div><div className="flex justify-between items-start mb-4"><div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform"><FileClock size={20}/></div></div><div><h3 className="text-3xl font-black text-slate-800 mb-1">{stats.drafting}</h3><p className="text-xs font-bold text-slate-500 uppercase tracking-wide group-hover:text-amber-600">Em Minuta</p><p className="text-[10px] text-slate-400 mt-1">Pareceres em elaboração</p></div></div>
        <div onClick={() => handleCardClick('LIST', 'AWAITING_SIG')} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer"><div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 group-hover:w-2 transition-all"></div><div className="flex justify-between items-start mb-4"><div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform"><CheckSquare size={20}/></div><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">SEFIN</span></div><div><h3 className="text-3xl font-black text-slate-800 mb-1">{stats.awaitingSig}</h3><p className="text-xs font-bold text-slate-500 uppercase tracking-wide group-hover:text-emerald-600">Aguard. Assinatura</p><p className="text-[10px] text-slate-400 mt-1">Enviados ao Ordenador</p></div></div>
        <div onClick={() => handleCardClick('LIST', 'SIGNED')} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group hover:border-teal-400 hover:shadow-md transition-all cursor-pointer"><div className="absolute top-0 left-0 w-1 h-full bg-teal-500 group-hover:w-2 transition-all"></div><div className="flex justify-between items-start mb-4"><div className="p-3 bg-teal-50 text-teal-600 rounded-xl group-hover:scale-110 transition-transform"><Send size={20}/></div><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">Tramitação</span></div><div><h3 className="text-3xl font-black text-slate-800 mb-1">{stats.signed || 0}</h3><p className="text-xs font-bold text-slate-500 uppercase tracking-wide group-hover:text-teal-600">Tramitar p/ SOSFU</p><p className="text-[10px] text-slate-400 mt-1">Assinados pelo Ordenador</p></div></div>
        <div onClick={() => handleCardClick('LIST', 'RETURNED')} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group hover:border-red-400 hover:shadow-md transition-all cursor-pointer"><div className="absolute top-0 left-0 w-1 h-full bg-red-500 group-hover:w-2 transition-all"></div><div className="flex justify-between items-start mb-4"><div className="p-3 bg-red-50 text-red-600 rounded-xl group-hover:scale-110 transition-transform"><CornerUpLeft size={20}/></div><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">Atenção</span></div><div><h3 className="text-3xl font-black text-slate-800 mb-1">{stats.returned}</h3><p className="text-xs font-bold text-slate-500 uppercase tracking-wide group-hover:text-red-600">Devolvidos</p><p className="text-[10px] text-slate-400 mt-1">Correções solicitadas</p></div></div>
      </div>
      
      {/* Radar de Prazos */}
      {upcomingDeadlines.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <Timer size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Radar de Prazos</h3>
                <p className="text-[10px] text-slate-400">Próximos 7 dias • Meus processos</p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {upcomingDeadlines.map(p => (
              <div 
                key={p.id}
                onClick={() => setSelectedProcessForDetails(p)}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-amber-200 hover:bg-amber-50/50 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <span className={`text-lg font-black ${
                    p.daysUntil <= 0 ? 'text-red-600' : 
                    p.daysUntil <= 2 ? 'text-amber-600' : 
                    'text-emerald-600'
                  }`}>
                    {p.daysUntil <= 0 ? '🔴' : p.daysUntil <= 2 ? '🟡' : '🟢'}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-700 group-hover:text-amber-700">{p.subject}</p>
                    <p className="text-[10px] text-slate-400">{p.protocol}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-black ${
                    p.daysUntil <= 0 ? 'text-red-600' : 
                    p.daysUntil <= 2 ? 'text-amber-600' : 
                    'text-slate-600'
                  }`}>
                    {p.daysUntil <= 0 ? 'Vencido!' : p.daysUntil === 1 ? 'Amanhã' : `${p.daysUntil} dias`}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">{p.deadline}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Special Card: Autorização Excepcional de Júri */}
      {processes.length > 0 && (
        <div 
          onClick={() => setViewMode('AUTORIZACAO_JURI')} 
          className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-2xl shadow-sm border border-purple-200 relative overflow-hidden group hover:border-purple-400 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center gap-6">
            <div className="p-4 bg-purple-100 text-purple-700 rounded-2xl group-hover:scale-110 transition-transform">
              <Gavel size={32} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-black text-slate-800 mb-1">Autorizações Excepcionais de Júri</h3>
              <p className="text-sm text-slate-500">
                {processes.length} {processes.length === 1 ? 'processo' : 'processos'} com valores acima dos limites regulamentares aguardando análise jurídica.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold border border-amber-200">
                {processes.length} Pendente{processes.length !== 1 ? 's' : ''}
              </span>
              <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-xl text-sm font-bold border border-purple-200 group-hover:bg-purple-200 transition-colors">
                Acessar →
              </span>
            </div>
          </div>
        </div>
      )}

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
    if (listFilter === 'MY_TASKS') { filteredProcesses = processes.filter(p => p.assignedTo === currentUserId && !['AGUARDANDO_ASSINATURA', 'ENVIADO'].includes(p.status)); }
    else if (listFilter === 'DRAFTS') { config = { title: 'Rascunhos e Minutas', desc: 'Documentos em fase de redação.', color: 'text-amber-600', bg: 'bg-amber-50', icon: FileClock }; filteredProcesses = processes.filter(p => p.assignedTo === currentUserId && p.status === 'REDACAO'); }
    else if (listFilter === 'AWAITING_SIG') { config = { title: 'Aguardando Assinatura SEFIN', desc: 'Enviados para o Ordenador de Despesa.', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckSquare }; filteredProcesses = processes.filter(p => p.status === 'AGUARDANDO_ASSINATURA'); }
    else if (listFilter === 'SIGNED') { config = { title: 'Prontos para Tramitação', desc: 'Assinados pelo Ordenador - encaminhar ao SOSFU.', color: 'text-teal-600', bg: 'bg-teal-50', icon: Send }; filteredProcesses = processes.filter(p => p.status === 'ENVIADO'); }
    else if (listFilter === 'RETURNED') { config = { title: 'Processos Devolvidos', desc: 'Requer atenção imediata para correção.', color: 'text-red-600', bg: 'bg-red-50', icon: CornerUpLeft }; filteredProcesses = processes.filter(p => p.assignedTo === currentUserId && p.status === 'DEVOLVIDO'); }
    else if (listFilter === 'TEAM_MEMBER' && selectedMemberId) { const member = teamMembers.find(m => m.id === selectedMemberId); config = { title: `Fila: ${member?.name.split('Dr. ')[1] || member?.name || 'Assessor'}`, desc: `Processos sob responsabilidade de ${member?.name}.`, color: 'text-blue-600', bg: 'bg-blue-50', icon: Users }; filteredProcesses = processes.filter(p => p.assignedTo === selectedMemberId); }
    return (
      <div className="p-8 max-w-[1200px] mx-auto animate-in slide-in-from-right-4">
        <div className="flex justify-between items-center mb-8"><div className="flex items-center gap-4"><button onClick={() => setViewMode('DASHBOARD')} className="p-3 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-blue-600 hover:shadow-md transition-all"><ArrowLeft size={20} /></button><div><h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3"><config.icon className={config.color} size={28}/> {config.title}</h2><p className="text-slate-500 text-sm font-medium">{config.desc}</p></div></div><div className={`px-4 py-2 ${config.bg} ${config.color} rounded-lg text-xs font-bold border border-slate-100 shadow-sm`}>{filteredProcesses.length} Registros</div></div>
        <div className="bg-white rounded-[24px] shadow-lg border border-slate-200 overflow-hidden"><table className="w-full text-left"><thead className="bg-slate-50 border-b border-slate-200"><tr><th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Protocolo / Interessado</th><th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Assunto</th><th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Origem / Status</th><th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Prazo</th><th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Ação</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredProcesses.length === 0 ? (<tr><td colSpan={5} className="px-6 py-20 text-center text-slate-400"><div className="flex flex-col items-center gap-3"><FileSearch size={48} className="text-slate-200"/><p className="font-medium text-sm">Nenhum processo encontrado nesta fila.</p></div></td></tr>) : (filteredProcesses.map(p => (<tr key={p.id} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => setSelectedProcessForDetails(p)}><td className="px-6 py-4"><div className="font-bold text-slate-700 text-sm">{p.interested}</div><div className="text-[10px] font-mono text-slate-400">{p.protocol}</div></td><td className="px-6 py-4"><div className="text-xs font-medium text-slate-600 max-w-xs truncate" title={p.subject}>{p.subject}</div><div className="text-[10px] text-slate-400 mt-0.5">{p.draftType || 'Parecer'}</div></td><td className="px-6 py-4"><div className="flex flex-col items-start gap-1"><span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${p.origin === 'SOSFU' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{p.origin}</span><span className="text-[10px] text-slate-500 font-bold">{p.status}</span></div></td><td className="px-6 py-4"><span className={`text-xs font-bold ${p.isLate ? 'text-red-600 bg-red-50 px-2 py-1 rounded' : 'text-slate-500'}`}>{p.deadline}</span></td><td className="px-6 py-4 text-right relative"><div className="flex items-center justify-end gap-2"><button onClick={(e) => { e.stopPropagation(); setSelectedProcessForDetails(p); }} className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all shadow-sm"><MoreHorizontal size={14}/> Detalhes</button>{listFilter === 'TEAM_MEMBER' && (<><button onClick={(e) => { e.stopPropagation(); setAssigningId(assigningId === p.id ? null : p.id); }} className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 transition-all shadow-sm"><UserPlus size={14}/> Reatribuir</button>{assigningId === p.id && (<div className="absolute right-6 top-12 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 animate-in zoom-in-95 origin-top-right overflow-hidden text-left"><div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex justify-between items-center"><span className="text-[10px] font-black text-slate-500 uppercase">Novo Responsável</span><button onClick={(e) => { e.stopPropagation(); setAssigningId(null); }}><X size={14} className="text-slate-400 hover:text-slate-600"/></button></div><div className="max-h-64 overflow-y-auto">{teamMembers.filter(m => m.id !== p.assignedTo).map(member => { const load = teamLoad.find(t => t.id === member.id); return (<button key={member.id} onClick={(e) => { e.stopPropagation(); handleAssign(p.id, member.id); }} className="w-full text-left px-4 py-3 hover:bg-purple-50 flex items-center gap-3 border-b border-slate-50 last:border-0 group/item transition-colors"><img src={member.avatar} className="w-8 h-8 rounded-full border border-slate-100"/><div className="flex-1"><p className="text-xs font-bold text-slate-700 group-hover/item:text-purple-700">{member.name}</p><div className="flex justify-between items-center mt-1"><span className="text-[9px] text-slate-400">{member.role}</span><span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${load && load.utilization > 80 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>{load?.activeCount} ativos</span></div></div></button>); })}</div></div>)}</>)}</div></td></tr>)))}</tbody></table></div>
      </div>
    );
  };

  const renderInbox = () => {
    let unassignedProcesses = processes.filter(p => p.status === 'TRIAGEM' && !p.assignedTo);
    
    // Apply period filter
    if (filterPeriod !== 'ALL') {
      unassignedProcesses = unassignedProcesses.filter(p => {
        if (p.entryDate === '-') return true;
        const entryDate = new Date(p.entryDate.split('/').reverse().join('-'));
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
        if (filterPeriod === 'TODAY' && daysDiff > 0) return false;
        if (filterPeriod === 'WEEK' && daysDiff > 7) return false;
        if (filterPeriod === 'MONTH' && daysDiff > 30) return false;
        return true;
      });
    }
    
    console.log('[AJSEFIN] renderInbox - Total processes:', processes.length, 'Filtered:', unassignedProcesses.length);
    return (
      <div className="p-8 max-w-[1200px] mx-auto animate-in slide-in-from-right-4">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => setViewMode('DASHBOARD')} className="p-3 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-blue-600 hover:shadow-md transition-all"><ArrowLeft size={20} /></button>
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Caixa de Entrada</h2>
              <p className="text-slate-500 text-sm font-medium">Distribuição de processos novos para a equipe.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Period Filter */}
            <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
              {(['ALL', 'TODAY', 'WEEK', 'MONTH'] as const).map(period => (
                <button
                  key={period}
                  onClick={() => setFilterPeriod(period)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    filterPeriod === period 
                      ? 'bg-white text-blue-700 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {period === 'ALL' ? 'Todos' : period === 'TODAY' ? 'Hoje' : period === 'WEEK' ? 'Semana' : 'Mês'}
                </button>
              ))}
            </div>
            <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold border border-blue-100">{unassignedProcesses.length} Pendentes</div>
          </div>
        </div>
        <div className="bg-white rounded-[24px] shadow-lg border border-slate-200"><table className="w-full text-left"><thead className="bg-slate-50 border-b border-slate-200"><tr><th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Protocolo / Interessado</th><th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Assunto</th><th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Origem</th><th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Prazo</th><th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Ação</th></tr></thead><tbody className="divide-y divide-slate-100">{unassignedProcesses.length === 0 ? (<tr><td colSpan={5} className="px-6 py-20 text-center text-slate-400"><div className="flex flex-col items-center gap-3"><CheckSquare size={48} className="text-emerald-200"/><p className="font-medium text-sm">Tudo limpo! Não há novos processos para distribuir.</p></div></td></tr>) : (unassignedProcesses.map(p => {
          // Calculate SLA badge
          const deadlineDate = p.deadline !== '-' ? new Date(p.deadline.split('/').reverse().join('-')) : null;
          const now = new Date();
          const daysUntilDeadline = deadlineDate ? Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 999;
          
          let slaBadge = null;
          if (p.isLate || daysUntilDeadline < 0) {
            slaBadge = <span className="px-2 py-0.5 text-[9px] font-black bg-red-100 text-red-700 rounded-full border border-red-200 animate-pulse">🔴 Atrasado</span>;
          } else if (daysUntilDeadline <= 2) {
            slaBadge = <span className="px-2 py-0.5 text-[9px] font-black bg-amber-100 text-amber-700 rounded-full border border-amber-200 animate-pulse">🟡 {daysUntilDeadline}d</span>;
          } else if (daysUntilDeadline <= 5) {
            slaBadge = <span className="px-2 py-0.5 text-[9px] font-black bg-emerald-100 text-emerald-700 rounded-full border border-emerald-200">🟢 {daysUntilDeadline}d</span>;
          }
          
          return (
            <tr key={p.id} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => setSelectedProcessForDetails(p)}>
              <td className="px-6 py-4"><div className="font-bold text-slate-700 text-sm">{p.interested}</div><div className="text-[10px] font-mono text-slate-400">{p.protocol}</div></td>
              <td className="px-6 py-4"><div className="text-xs font-medium text-slate-600 max-w-xs truncate" title={p.subject}>{p.subject}</div></td>
              <td className="px-6 py-4"><span className={`text-[9px] font-black px-2 py-1 rounded uppercase tracking-wider ${p.origin === 'SOSFU' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{p.origin}</span></td>
              <td className="px-6 py-4">
                <div className="flex flex-col gap-1">
                  <span className={`text-xs font-bold ${p.isLate ? 'text-red-600' : 'text-slate-500'}`}>{p.deadline}</span>
                  {slaBadge}
                </div>
              </td>
              <td className="px-6 py-4 text-right relative">
                <div className="flex items-center justify-end gap-2">
                  {/* Quick Action: Assumir para Mim */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); if (currentUserId) handleAssign(p.id, currentUserId); }} 
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 transition-all shadow-md hover:shadow-lg"
                    title="Assumir este processo para minha fila"
                  >
                    <Zap size={14} className="text-amber-300" /> Assumir
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setAssigningId(assigningId === p.id ? null : p.id); }} className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-blue-50 hover:text-blue-700 transition-all shadow-sm"><UserPlus size={14}/> Atribuir</button>
                </div>
                {assigningId === p.id && (<div className="absolute right-0 top-12 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 z-[100]"><div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center rounded-t-xl"><span className="text-xs font-bold text-slate-600">Selecione o Assessor</span><button onClick={(e) => { e.stopPropagation(); setAssigningId(null); }} className="p-1 hover:bg-slate-200 rounded"><X size={14} className="text-slate-400 hover:text-slate-600"/></button></div><div className="max-h-80 overflow-y-auto">{teamMembers.map(member => { const load = teamLoad.find(t => t.id === member.id); return (<button key={member.id} onClick={(e) => { e.stopPropagation(); handleAssign(p.id, member.id); }} className="w-full text-left px-4 py-3 hover:bg-purple-50 flex items-center gap-3 border-b border-slate-100 last:border-0 transition-colors"><img src={member.avatar} className="w-10 h-10 rounded-full border-2 border-slate-100"/><div className="flex-1"><p className="text-sm font-bold text-slate-700 hover:text-purple-700">{member.name}</p><div className="flex justify-between items-center mt-1"><span className="text-[10px] text-slate-400">{member.role}</span><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${load && load.utilization > 80 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>{load?.activeCount || 0} ativos</span></div></div></button>); })}</div></div>)}
              </td>
            </tr>
          );
        }))}</tbody></table></div>
      </div>
    );
  };

  const renderKanban = () => {
    const columns: { id: ProcessStatus; label: string; color: string }[] = [{ id: 'TRIAGEM', label: 'Triagem / Distribuição', color: 'border-slate-300' }, { id: 'REDACAO', label: 'Em Redação', color: 'border-purple-300' }, { id: 'REVISAO', label: 'Revisão Chefia', color: 'border-amber-300' }, { id: 'AGUARDANDO_ASSINATURA', label: 'Aguard. Assinatura', color: 'border-emerald-300' }];
    return (<div className="flex gap-6 h-full overflow-x-auto pb-4 p-6">{columns.map(col => (<div key={col.id} className="min-w-[320px] flex flex-col h-full bg-slate-100/50 rounded-2xl p-4 border border-slate-200"><div className={`flex justify-between items-center mb-4 pb-2 border-b-2 ${col.color}`}><h3 className="font-bold text-slate-700 uppercase text-xs tracking-widest">{col.label}</h3><span className="bg-white text-slate-600 text-[10px] font-black px-2 py-1 rounded-lg shadow-sm">{processes.filter(p => p.status === col.id).length}</span></div><div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-2">{processes.filter(p => p.status === col.id).map(process => { const assignee = getAssignee(process.assignedTo); return (<div key={process.id} onClick={() => handleOpenEditor(process)} className={`bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-purple-300 transition-all cursor-pointer group ${process.isLate ? 'border-l-4 border-l-red-500' : ''}`}><div className="flex justify-between items-start mb-2"><span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${process.origin === 'SOSFU' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{process.origin}</span><span className={`text-[10px] font-mono ${process.isLate ? 'text-red-600 font-bold' : 'text-slate-400'}`}>{process.deadline}</span></div><h4 className="text-sm font-bold text-slate-800 leading-tight mb-1 line-clamp-2">{process.subject}</h4><p className="text-xs text-slate-500 font-medium mb-3">{process.protocol}</p><div className="flex justify-between items-center pt-3 border-t border-slate-50"><div className="flex items-center gap-2">{assignee ? (<><img src={assignee.avatar} className="w-6 h-6 rounded-full border border-slate-100" title={assignee.name} /><span className="text-[10px] font-bold text-slate-600 truncate max-w-[80px]">{assignee.name.split(' ')[1]}</span></>) : (<span className="text-[10px] italic text-slate-400 flex items-center gap-1"><UserCheck size={10}/> A Distribuir</span>)}</div><button className="text-purple-600 hover:bg-purple-50 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Edit3 size={14} /></button></div></div>); })}</div></div>))}</div>);
  };

  const renderEditor = () => {
    console.log('[AJSEFIN] renderEditor called, activeProcess:', activeProcess?.id, activeProcess?.protocol);
    if (!activeProcess) {
      console.error('[AJSEFIN] renderEditor: activeProcess is null, returning empty!');
      return (
        <div className="flex h-full items-center justify-center bg-slate-50">
          <div className="text-center">
            <p className="text-slate-500 text-lg">Nenhum processo selecionado</p>
            <button 
              onClick={() => setViewMode('DASHBOARD')} 
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700"
            >
              Voltar ao Painel
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="flex h-full animate-in slide-in-from-right-4 duration-300 bg-slate-50">
        <aside className="w-[400px] bg-white border-r border-slate-200 flex flex-col z-10 shadow-lg"><div className="p-6 border-b border-slate-100 bg-slate-50/50"><button onClick={() => setViewMode('DASHBOARD')} className="flex items-center gap-2 text-slate-500 hover:text-purple-700 text-xs font-bold uppercase tracking-widest mb-4 transition-colors"><ArrowLeft size={14} /> Voltar ao Painel</button><h2 className="text-xl font-black text-slate-800 leading-tight">{activeProcess.subject}</h2><p className="text-sm text-purple-600 font-mono font-bold mt-1">{activeProcess.protocol}</p></div><div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar"><div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3"><div className="flex justify-between text-xs"><span className="text-slate-500 font-medium">Interessado</span><span className="font-bold text-slate-800 text-right w-1/2 truncate">{activeProcess.interested}</span></div><div className="flex justify-between text-xs"><span className="text-slate-500 font-medium">Valor</span><span className="font-bold text-slate-800">R$ {activeProcess.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div><div className="flex justify-between text-xs"><span className="text-slate-500 font-medium">Prazo Legal</span><span className="font-bold text-red-600">{activeProcess.deadline}</span></div></div><div className="space-y-4"><h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><BookOpen size={14} /> Peças dos Autos</h3><div className="space-y-2">{[{ title: 'Solicitação Inicial', page: '02', author: 'Gestor' }, { title: 'Análise Técnica SOSFU', page: '05', author: 'Analista Jaires', highlight: true }, { title: 'Consulta Saldo SIAFE', page: '06', author: 'Sistema' }].map((doc, i) => (<button key={i} className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 group ${doc.highlight ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200 hover:border-purple-300'}`}><div className="w-8 h-8 bg-white border border-slate-100 rounded-lg flex items-center justify-center text-[10px] font-bold text-slate-400 shadow-sm">{doc.page}</div><div><p className={`text-xs font-bold ${doc.highlight ? 'text-blue-700' : 'text-slate-700'}`}>{doc.title}</p><p className="text-[10px] text-slate-400">Por: {doc.author}</p></div>{doc.highlight && <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></div>}</button>))}</div></div><div className="bg-purple-50 border border-purple-100 p-4 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-purple-100 transition-colors"><div className="p-2 bg-purple-200 text-purple-700 rounded-lg"><Paperclip size={16}/></div><div><p className="text-xs font-bold text-purple-900">Anexar Novo Documento</p><p className="text-[10px] text-purple-600">PDF, Imagens ou Planilhas</p></div></div></div></aside>
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100 relative"><div className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm z-20"><div className="flex items-center gap-4"><div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200"><button className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white rounded shadow-sm">Edição</button><button className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700">Visualizar PDF</button></div><div className="h-6 w-px bg-slate-200"></div><button onClick={handleAiSuggest} disabled={isAiGenerating} className="flex items-center gap-2 text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg hover:bg-purple-100 transition-all border border-purple-100">{isAiGenerating ? <Sparkles size={14} className="animate-spin" /> : <Sparkles size={14} />} IA: Sugerir Fundamentação</button></div><div className="flex items-center gap-3"><button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all"><Save size={16} /> Salvar Rascunho</button><button onClick={() => { alert('Minuta tramitada para o Ordenador de Despesa (SEFIN)!'); setViewMode('DASHBOARD'); }} className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 shadow-lg shadow-purple-200 transition-all"><Send size={16} /> Finalizar e Tramitar</button></div></div><div className="flex-1 overflow-y-auto p-12 flex justify-center custom-scrollbar"><div className="w-[800px] min-h-[1000px] bg-white shadow-2xl p-20 relative animate-in zoom-in-95 duration-300"><div className="text-center mb-10 opacity-80"><img src={BRASAO_TJPA_URL} className="w-20 mx-auto mb-4 grayscale" /><h3 className="font-bold text-slate-900 uppercase text-sm">Poder Judiciário do Estado do Pará</h3><p className="text-xs text-slate-500 uppercase tracking-widest">Assessoria Jurídica da SEFIN</p></div><textarea className="w-full h-full resize-none outline-none font-serif text-lg leading-relaxed text-slate-800 bg-transparent placeholder-slate-300" value={draftContent} onChange={(e) => setDraftContent(e.target.value)} placeholder="Comece a redigir sua minuta aqui..."/><div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.02]"><Scale size={400} /></div></div></div></main>
      </div>
    );
  };

  return (
    <div className="h-full bg-[#f8fafc] flex flex-col overflow-hidden">
      {viewMode !== 'EDITOR' && (<header className="bg-white border-b border-slate-200 px-8 py-6 flex justify-between items-center shadow-sm z-20"><div><h1 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3">Módulo Jurídico <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium tracking-normal border border-purple-200">AJSEFIN</span></h1><p className="text-slate-500 font-medium mt-2 flex items-center gap-2"><Scale size={16} className="text-purple-500" /> Painel de Controle e Minutas Jurídicas</p></div><div className="flex items-center gap-4"><div className="flex -space-x-3">{teamMembers.map(member => (<img key={member.id} src={member.avatar} className="w-10 h-10 rounded-full border-2 border-white shadow-sm cursor-help hover:z-10 transition-all hover:scale-110" title={member.name} />))}</div></div></header>)}
      <div className="flex-1 overflow-hidden relative">
        {viewMode === 'DASHBOARD' && <div className="h-full overflow-y-auto custom-scrollbar">{renderDashboard()}</div>}
        {viewMode === 'INBOX' && <div className="h-full overflow-y-auto custom-scrollbar">{renderInbox()}</div>}
        {viewMode === 'LIST' && <div className="h-full overflow-y-auto custom-scrollbar">{renderProcessList()}</div>}
        {viewMode === 'KANBAN' && <><div className="p-6 pb-0 flex justify-end"><button onClick={() => setViewMode('DASHBOARD')} className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase hover:text-purple-700"><BarChart2 size={16}/> Voltar ao Painel</button></div>{renderKanban()}</>}
        {viewMode === 'EDITOR' && <div className="absolute inset-0 z-30">{renderEditor()}</div>}
        {viewMode === 'AUTORIZACAO_JURI' && (
          <div className="h-full overflow-y-auto custom-scrollbar">
            <AutorizacaoExcepcionalView
              onBack={() => setViewMode('DASHBOARD')}
              onViewProcess={(id) => {
                const process = processes.find(p => p.id === id);
                if (process) setSelectedProcessForDetails(process);
              }}
              currentUserId={currentUserId || ''}
            />
          </div>
        )}
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
            visibleTabs={['overview', 'dossier']}
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
            // Trigger success animation
            setShowSuccessAnimation(true);
            setTimeout(() => setShowSuccessAnimation(false), 3000);
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

      {/* Success Animation Overlay */}
      {showSuccessAnimation && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none">
          {/* Confetti/Sparkles */}
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${10 + Math.random() * 80}%`,
                top: `${10 + Math.random() * 80}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${0.5 + Math.random() * 0.5}s`,
                fontSize: `${16 + Math.random() * 16}px`,
              }}
            >
              {['✨', '🎉', '⭐', '💜', '✓'][Math.floor(Math.random() * 5)]}
            </div>
          ))}
          
          {/* Success Modal */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-300 flex flex-col items-center gap-4 border-4 border-purple-200">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center animate-pulse">
              <CheckCircle2 className="text-purple-600" size={48} />
            </div>
            <h2 className="text-2xl font-black text-slate-800">Tramitação Concluída!</h2>
            <p className="text-slate-500 text-center max-w-xs">
              O processo foi encaminhado com sucesso ao destino selecionado.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};