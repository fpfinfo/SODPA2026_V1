import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { FilterTab, ViewMode, ProcessType, Process, ProcessStatus, ConcessionStatus, AccountStatus, SupplyCategory, AnnualBudget, BudgetDistribution, AdminBudget, BudgetRule } from '../types';
import { MOCK_PROCESSES, CURRENT_USER_ID, INITIAL_BUDGET, MOCK_BUDGET_MATRIX, MOCK_ADMIN_BUDGETS, MOCK_BUDGET_RULES } from '../constants';
import { KPIHeader } from './KPIHeader';
import { KanbanBoard } from './KanbanBoard';
import { ListView } from './ListView';
import { FinancialRegistry } from './FinancialRegistry';
import { INSSTableManager } from './INSSTableManager';
import { SentinelaAudit } from './SentinelaAudit';
import { SystemSettings } from './SystemSettings';
import { ProcessDetailsModal } from './ProcessDetailsModal';
import { UniversalProcessDetailsPage } from './ProcessDetails';
import { TramitarModal } from './TramitarModal';
import { DocumentCreationWizard } from './DocumentCreationWizard';
import { AssignmentModal } from './AssignmentModal';
import { BudgetManager } from './BudgetManager';
import { BudgetDistributionMatrix } from './BudgetDistributionMatrix';
import { BudgetMatrixConfig } from './BudgetMatrixConfig';
import { SupridoManager } from './SupridoManager';
import { SiafeManager } from './SiafeManager';
import { ConcessionManager } from './ConcessionManager';
import { BudgetPlanningDashboard } from './BudgetPlanningDashboard';
import { useSOSFUProcesses, SOSFUStats } from '../hooks/useSOSFUProcesses';
import { useRoleRequests, ROLE_LABELS, RoleRequest } from '../hooks/useRoleRequests';
import { useTeamMembers, TeamMember } from '../hooks/useTeamMembers';
import { 
  LayoutGrid, 
  List as ListIcon, 
  Briefcase,
  Search,
  ShieldCheck,
  Settings,
  Filter,
  BarChart3,
  Table,
  Inbox,
  Zap,
  Users,
  CheckSquare,
  UserCog,
  FileText,
  AlertCircle,
  MoreHorizontal,
  ArrowLeft,
  ArrowRightLeft,
  UserMinus,
  X,
  UserPlus,
  FileSearch,
  Layout,
  Wallet,
  PiggyBank,
  Table as TableIcon,
  Database,
  Landmark,
  Undo2,
  UserCheck,
  Building2,
  CalendarRange,
  ShieldAlert
} from 'lucide-react';

interface DashboardSOSFUProps {
  forceTab?: FilterTab | null;
  onInternalTabChange?: () => void;
  onProcessesChange?: (processes: Process[]) => void;
}

type SosfuViewMode = 'DASHBOARD' | 'LIST' | 'KANBAN';
type ListFilterType = 'INBOX' | 'MY_TASKS' | 'ANALYSIS' | 'FINANCE' | 'TEAM_MEMBER';

export const DashboardSOSFU: React.FC<DashboardSOSFUProps> = ({ forceTab, onInternalTabChange, onProcessesChange }) => {
  // Real data fetched from hook
  const { 
    processes, 
    stats: sosfuStats, 
    isLoading: isProcessesLoading, 
    refresh: refreshProcesses,
    getCategory,
    assignToUser,
    updateExecutionNumbers,
    tramitToSefin,
    completeExecution
  } = useSOSFUProcesses();

  // Propagate process changes to parent for cross-module integration (e.g., SEFIN inbox)
  React.useEffect(() => {
    onProcessesChange?.(processes);
  }, [processes, onProcessesChange]);

  const [budget, setBudget] = useState<AnnualBudget>(INITIAL_BUDGET);
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [viewMode, setViewMode] = useState<SosfuViewMode>('DASHBOARD');
  const [listFilter, setListFilter] = useState<ListFilterType>('INBOX');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<SupplyCategory | 'ALL'>('ALL');
  const [auditFilter, setAuditFilter] = useState<'ALL' | 'CRITICAL' | 'PENDING'>('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);
  const [detailsModalTab, setDetailsModalTab] = useState<'DETAILS' | 'ANALYSIS' | 'DOSSIER'>('DETAILS');
  const [assigningProcessId, setAssigningProcessId] = useState<string | null>(null);
  const [redistributionSourceId, setRedistributionSourceId] = useState<string | null>(null);
  const [auditProcess, setAuditProcess] = useState<Process | null>(null);
  
  // Budget configuration state (moved from BudgetManager)
  const [distributions, setDistributions] = useState<BudgetDistribution[]>(MOCK_BUDGET_MATRIX);
  const [adminBudgets, setAdminBudgets] = useState<AdminBudget[]>(MOCK_ADMIN_BUDGETS);
  const [budgetRules, setBudgetRules] = useState<BudgetRule[]>(MOCK_BUDGET_RULES);
  const [showMatrix, setShowMatrix] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [financeSubTab, setFinanceSubTab] = useState<'TAX_INSS' | 'GDR_CONTROL'>('TAX_INSS');
  
  // States for UniversalProcessDetailsPage integration
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showTramitarModal, setShowTramitarModal] = useState(false);
  const [showDocumentWizard, setShowDocumentWizard] = useState(false);
  const [viewProcessDetails, setViewProcessDetails] = useState(false);
  
  // Fetch current user ID on mount
  React.useEffect(() => {
    const fetchUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) setCurrentUserId(user.id);
    };
    fetchUserId();
  }, []);

  useEffect(() => { 
    if (forceTab) { 
      setActiveTab(forceTab); 
      // Delay the callback to ensure the tab change has rendered
      if (onInternalTabChange) {
        setTimeout(() => onInternalTabChange(), 100);
      }
    } 
  }, [forceTab, onInternalTabChange]);
  useEffect(() => { setIsLoading(true); const timer = setTimeout(() => setIsLoading(false), 400); return () => clearTimeout(timer); }, [activeTab, listFilter, viewMode]);

  const stats = sosfuStats;

  const auditStats = useMemo(() => {
      const accountabilityProcesses = processes.filter(p => getCategory(p) === 'PRESTACAO');
      return {
          critical: accountabilityProcesses.filter(p => p.sentinelaRisk === 'CRITICAL').length,
          pending: accountabilityProcesses.filter(p => !p.sentinelaRisk || p.sentinelaRisk === 'PENDING').length,
          total: accountabilityProcesses.length
      };
  }, [processes, getCategory]);

  // Fetch real team members from database
  const { teamMembers: realTeamMembers, isLoading: isLoadingTeam, refresh: refreshTeamMembers } = useTeamMembers();

  // Transform teamMembers to match STAFF_MEMBERS interface for backwards compatibility
  const STAFF_MEMBERS = useMemo(() => 
    realTeamMembers.map(m => ({
      id: m.id,
      name: m.nome,
      role: m.role,
      avatarUrl: m.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(m.nome)}`,
      email: m.email,
      cargo: m.cargo,
      lotacao: m.lotacao,
    })), [realTeamMembers]);

  const teamLoad = useMemo(() => {
    const BASE_CAPACITY = 10;
    // Use real team members if available, fallback to mock for backwards compatibility
    const members = realTeamMembers.length > 0 ? realTeamMembers : STAFF_MEMBERS.map(m => ({
      id: m.id,
      servidor_id: m.id,
      role: m.role as any,
      ativo: true,
      nome: m.name,
      email: null,
      cargo: m.role,
      lotacao: null,
      avatar_url: m.avatarUrl,
      matricula: null
    }));
    return members.map(member => {
      const memberProcesses = processes.filter(p => p.assignedToId === member.id || p.assignedToId === member.servidor_id);
      const activeCount = memberProcesses.length;
      const utilization = (activeCount / BASE_CAPACITY) * 100;
      const lateCount = memberProcesses.filter(p => p.slaDeadline && new Date(p.slaDeadline) < new Date()).length;
      return { 
        ...member, 
        name: member.nome, 
        avatarUrl: member.avatar_url,
        activeCount, 
        lateCount, 
        utilization 
      };
    });
  }, [processes, realTeamMembers]);

  const handleCardClick = (mode: SosfuViewMode, filter?: ListFilterType) => { setViewMode(mode); if (filter) setListFilter(filter); };
  const handleAction = (action: string, id: string) => { 
    const p = processes.find(pr => pr.id === id);
    if (!p) return;
    if (action === 'assume') setAssigningProcessId(id); 
    else if (action === 'sentinela') setAuditProcess(p);
    else if (action === 'details') { setSelectedProcess(p); setDetailsModalTab('DETAILS'); }
    else if (action === 'analysis') handleMoveProcess(id, ConcessionStatus.ANALYSIS);
  };
  const handleViewMemberQueue = (memberId: string) => { setSelectedMemberId(memberId); setListFilter('TEAM_MEMBER'); setViewMode('LIST'); };
  const handleAssignUser = async (processId: string, staffId: string) => { 
    try {
      await assignToUser(processId, staffId); 
      setAssigningProcessId(null); 
    } catch (err) {
      alert('Erro ao atribuir processo: ' + (err as Error).message);
    }
  };
  const handleBulkRedistribute = async (targetMemberId: string) => { 
    if (!redistributionSourceId) return; 
    try {
      for (const p of processes.filter(p => p.assignedToId === redistributionSourceId)) {
        await assignToUser(p.id, targetMemberId);
      }
      setRedistributionSourceId(null); 
      alert('Carga de trabalho redistribuída com sucesso!'); 
    } catch (err) {
      alert('Erro ao redistribuir carga: ' + (err as Error).message);
    }
  };
  
  // Handler for ConcessionManager status updates - Updates process state which propagates to SefinDashboard
  const handleMoveProcess = async (processId: string, newStatus: string) => {
    console.log('[DashboardSOSFU] handleMoveProcess called:', processId, newStatus);
    const { error } = await supabase.from('solicitacoes').update({ status: newStatus }).eq('id', processId);
    if (error) alert('Erro ao mover processo: ' + error.message);
    else refreshProcesses();
  };
  
  const handlePriorityChange = async (processId: string, newPriority: 'NORMAL' | 'HIGH' | 'CRITICAL') => { 
    const { error } = await supabase.from('solicitacoes').update({ priority: newPriority }).eq('id', processId);
    if (error) alert('Erro ao alterar prioridade: ' + error.message);
    else refreshProcesses();
  };
  const handleBatchLaunch = (newProcesses: Process[], totalValue: number) => { 
    // This is still local for now as it maps to MOCK in parent, but should ideally refresh from DB
    refreshProcesses();
    setBudget(prev => ({ ...prev, executedOrdinary: prev.executedOrdinary + totalValue })); 
  };

  const getFilteredList = () => {
    let result = processes;
    if (categoryFilter !== 'ALL') result = result.filter(p => p.supplyCategory === categoryFilter);
    if (searchQuery) { const lowerQ = searchQuery.toLowerCase(); result = result.filter(p => p.protocolNumber.toLowerCase().includes(lowerQ) || p.interestedParty?.toLowerCase().includes(lowerQ)); }
    // Audit filter for Accountability tab
    if (activeTab === 'ACCOUNTABILITY') {
        result = result.filter(p => p.type === ProcessType.ACCOUNTABILITY);
        if (auditFilter === 'CRITICAL') result = result.filter(p => p.sentinelaRisk === 'CRITICAL');
        else if (auditFilter === 'PENDING') result = result.filter(p => !p.sentinelaRisk || p.sentinelaRisk === 'PENDING');
    }
    switch (listFilter) {
      case 'INBOX': return result.filter(p => !p.assignedToId);
      case 'MY_TASKS': return result.filter(p => p.assignedToId === CURRENT_USER_ID);
      case 'ANALYSIS': return result.filter(p => p.status === ConcessionStatus.ANALYSIS || p.status === AccountStatus.AUDIT);
      case 'FINANCE': return result.filter(p => p.status === ConcessionStatus.FINANCE);
      case 'TEAM_MEMBER': return result.filter(p => p.assignedToId === selectedMemberId);
      default: return result;
    }
  };

  const renderRedistributionModal = () => {
    if (!redistributionSourceId) return null;
    const sourceMember = STAFF_MEMBERS.find(m => m.id === redistributionSourceId);
    const taskCount = processes.filter(p => p.assignedToId === redistributionSourceId).length;
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center"><h3 className="font-black text-slate-800 flex items-center gap-2"><ArrowRightLeft className="text-blue-600" size={20}/> Redistribuir Carga</h3><button onClick={() => setRedistributionSourceId(null)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button></div>
          <div className="p-6">
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl mb-6 flex items-start gap-3"><UserMinus size={20} className="text-amber-600 shrink-0 mt-0.5"/><div><p className="text-sm font-bold text-amber-800">Origem: {sourceMember?.name}</p><p className="text-xs text-amber-700 mt-1">Este analista possui <strong>{taskCount} processos</strong> ativos.</p></div></div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Selecione o Destino</p>
            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
              {STAFF_MEMBERS.filter(m => m.id !== redistributionSourceId).map(member => { const load = teamLoad.find(t => t.id === member.id); return (<button key={member.id} onClick={() => handleBulkRedistribute(member.id)} className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all group text-left"><div className="flex items-center gap-3"><img src={member.avatarUrl} className="w-8 h-8 rounded-full"/><div><p className="text-sm font-bold text-slate-700 group-hover:text-blue-700">{member.name}</p><p className="text-[10px] text-slate-400">{member.role}</p></div></div><span className={`text-[10px] font-bold px-2 py-1 rounded ${load && load.utilization > 80 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>{load?.activeCount} ativos</span></button>); })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDashboardCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {/* 📥 NOVOS RECEBIDOS (SOL + PC) */}
      <div 
        onClick={() => {
          setListFilter('INBOX');
          setViewMode('LIST');
        }} 
        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"
      >
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 group-hover:w-2 transition-all"></div>
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
            <Inbox size={20}/>
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">Caixa de Entrada</span>
        </div>
        <div>
          <h3 className="text-3xl font-black text-slate-800 mb-1">{sosfuStats.inbox.total}</h3>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide group-hover:text-blue-600">Novos Recebidos</p>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              <span className="text-[10px] font-bold text-slate-400">{sosfuStats.inbox.solicitacoes} Sol.</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
              <span className="text-[10px] font-bold text-slate-400">{sosfuStats.inbox.prestacoes} PC</span>
            </div>
          </div>
        </div>
      </div>

      {/* 👤 MINHA MESA */}
      <div 
        onClick={() => {
          setListFilter('MY_TASKS');
          setViewMode('LIST');
        }} 
        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group hover:border-purple-400 hover:shadow-md transition-all cursor-pointer"
      >
        <div className="absolute top-0 left-0 w-1 h-full bg-purple-500 group-hover:w-2 transition-all"></div>
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition-transform">
            <UserCog size={20}/>
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">Minha Mesa</span>
        </div>
        <div>
          <h3 className="text-3xl font-black text-slate-800 mb-1">{sosfuStats.myTasks}</h3>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide group-hover:text-purple-600">Atribuídos a Mim</p>
          <p className="text-[10px] text-slate-400 mt-1">Sua fila de trabalho</p>
        </div>
      </div>

      {/* 📤 AGUARDANDO ASSINATURA */}
      <div 
        onClick={() => {
          setListFilter('ANALYSIS'); // Reuse analysis filter or create a new one
          setViewMode('LIST');
        }} 
        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group hover:border-amber-400 hover:shadow-md transition-all cursor-pointer"
      >
        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 group-hover:w-2 transition-all"></div>
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform">
            <ShieldCheck size={20}/>
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">Fluxo SEFIN</span>
        </div>
        <div>
          <h3 className="text-3xl font-black text-slate-800 mb-1">{stats.awaitingSignature}</h3>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide group-hover:text-amber-600">Aguard. Assinatura</p>
          <div className="flex items-center gap-1.5 mt-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
            <span className="text-[10px] font-bold text-slate-400">{stats.solicitacoesAnalysis} em Análise Técnica</span>
          </div>
        </div>
      </div>

      {/* ✅ AGUARDANDO PRESTAÇÃO DE CONTAS */}
      <div 
        onClick={() => {
          setListFilter('FINANCE'); // Reuse finance filter or create a new one
          setViewMode('LIST');
        }} 
        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer"
      >
        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 group-hover:w-2 transition-all"></div>
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
            <CheckSquare size={20}/>
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">Execuções</span>
        </div>
        <div>
          <h3 className="text-3xl font-black text-slate-800 mb-1">{stats.awaitingPC}</h3>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide group-hover:text-emerald-600">Aguard. PC</p>
          <div className="flex items-center gap-1.5 mt-2">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
            <span className="text-[10px] font-bold text-slate-400">{stats.prestacoesAudit} em Auditoria Sentinela</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Role approval queue for SOSFU admins
  const { pendingRequests, approveRequest, rejectRequest, refreshRequests, isLoading: isLoadingRoles } = useRoleRequests();
  const [rejectingUserId, setRejectingUserId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  
  const renderRoleApprovalQueue = () => {
    if (pendingRequests.length === 0) return null;
    
    return (
      <div className="bg-white rounded-[32px] shadow-lg border border-slate-200 overflow-hidden mb-8">
        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-indigo-50 flex justify-between items-center">
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
            <Users size={20} className="text-purple-600"/>
            Solicitações de Acesso
            <span className="ml-2 px-2.5 py-1 bg-purple-600 text-white rounded-full text-xs font-black">{pendingRequests.length}</span>
          </h3>
          <button onClick={() => refreshRequests()} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:text-purple-700 hover:border-purple-200 transition-all shadow-sm">
            Atualizar
          </button>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Usuário</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Perfil Atual</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Perfil Solicitado</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Data</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pendingRequests.map((req: RoleRequest) => (
              <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={req.avatar_url || '/default-avatar.png'} className="w-10 h-10 rounded-xl border-2 border-white shadow" />
                    <div>
                      <p className="text-sm font-bold text-slate-800">{req.nome}</p>
                      <p className="text-xs text-slate-500">{req.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold">{ROLE_LABELS[req.role] || req.role}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-black">{ROLE_LABELS[req.requested_role] || req.requested_role}</span>
                </td>
                <td className="px-6 py-4 text-xs text-slate-500">
                  {req.role_request_date ? new Date(req.role_request_date).toLocaleDateString('pt-BR') : '-'}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={async () => {
                        if (confirm(`Aprovar ${req.nome} como ${ROLE_LABELS[req.requested_role]}?`)) {
                          await approveRequest(req.id);
                        }
                      }}
                      className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all"
                    >
                      Aprovar
                    </button>
                    <button 
                      onClick={() => setRejectingUserId(req.id)}
                      className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-xl text-xs font-bold hover:bg-red-50 transition-all"
                    >
                      Rejeitar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Rejection Modal */}
        {rejectingUserId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <h3 className="text-lg font-black text-slate-800 mb-4">Rejeitar Solicitação</h3>
              <textarea 
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Motivo da rejeição (obrigatório)..."
                className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 h-24"
              />
              <div className="flex gap-3 mt-4">
                <button 
                  onClick={() => { setRejectingUserId(null); setRejectReason(''); }}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold"
                >
                  Cancelar
                </button>
                <button 
                  onClick={async () => {
                    if (!rejectReason.trim()) {
                      alert('Informe o motivo da rejeição.');
                      return;
                    }
                    await rejectRequest(rejectingUserId, rejectReason);
                    setRejectingUserId(null);
                    setRejectReason('');
                  }}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600"
                >
                  Confirmar Rejeição
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTeamManagement = () => (
    <div className="bg-white rounded-[32px] shadow-lg border border-slate-200 overflow-hidden mb-8">
      <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center"><h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-3"><Users size={20} className="text-slate-400"/> Gestão da Equipe Técnica</h3><button onClick={() => setViewMode('KANBAN')} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:text-blue-700 hover:border-blue-200 transition-all shadow-sm"><Layout size={16}/> Ver Quadro Kanban</button></div>
      <table className="w-full text-left border-collapse"><thead className="bg-slate-50 border-b border-slate-200"><tr><th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 w-1/3">Analista / Função</th><th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Carga de Trabalho</th><th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Alertas SLA</th><th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Ações</th></tr></thead>
      <tbody className="divide-y divide-slate-100">{teamLoad.map(member => (<tr key={member.id} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => handleViewMemberQueue(member.id)}><td className="px-8 py-6"><div className="flex items-center gap-4"><div className="relative"><img src={member.avatarUrl ? `${member.avatarUrl}?t=${Date.now()}` : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(member.name || member.nome)}`} className="w-12 h-12 rounded-2xl border-2 border-white shadow-md group-hover:scale-105 transition-transform bg-slate-100" /><div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full ${member.activeCount > 8 ? 'bg-amber-500' : 'bg-emerald-500'}`}></div></div><div><p className="text-sm font-black text-slate-800">{member.name || member.nome}</p><p className="text-[11px] font-medium text-slate-500 mt-0.5">{member.role || member.cargo}</p></div></div></td><td className="px-8 py-6"><div className="max-w-xs"><div className="flex justify-between text-xs font-bold mb-2"><span className="text-slate-600">{member.activeCount} Processos</span><span className="text-slate-400">{Math.round(member.utilization)}% Cap.</span></div><div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${member.utilization > 90 ? 'bg-red-500' : member.utilization > 70 ? 'bg-amber-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(member.utilization, 100)}%` }}></div></div></div></td><td className="px-8 py-6 text-center">{member.lateCount > 0 ? (<span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-[10px] font-black uppercase tracking-wide border border-red-100"><AlertCircle size={12}/> {member.lateCount} Atrasados</span>) : (<span className="text-slate-300 font-bold text-xs">-</span>)}</td><td className="px-8 py-6 text-right"><div className="flex items-center justify-end gap-2"><button onClick={(e) => { e.stopPropagation(); handleViewMemberQueue(member.id); }} className="p-2 bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 rounded-xl transition-all shadow-sm" title="Ver Fila"><ListIcon size={16}/></button><button onClick={(e) => { e.stopPropagation(); setRedistributionSourceId(member.id); }} className="p-2 bg-white border border-slate-200 text-slate-500 hover:text-purple-600 hover:border-purple-200 rounded-xl transition-all shadow-sm" title="Redistribuir Carga"><ArrowRightLeft size={16}/></button></div></td></tr>))}</tbody></table>
    </div>
  );

  const renderProcessList = () => {
    const listData = getFilteredList();
    let config = { title: 'Caixa de Entrada', desc: 'Processos aguardando distribuição e triagem.', color: 'text-blue-600', bg: 'bg-blue-50', icon: Inbox };
    if (listFilter === 'MY_TASKS') config = { title: 'Minha Mesa de Trabalho', desc: 'Processos sob sua responsabilidade.', color: 'text-purple-600', bg: 'bg-purple-50', icon: UserCog };
    else if (listFilter === 'ANALYSIS') config = { title: 'Em Análise Técnica', desc: 'Processos em fase de instrução e análise.', color: 'text-amber-600', bg: 'bg-amber-50', icon: FileText };
    else if (listFilter === 'FINANCE') config = { title: 'Fase Financeira', desc: 'Processos em empenho ou pagamento.', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: Wallet };
    else if (listFilter === 'TEAM_MEMBER' && selectedMemberId) { const member = STAFF_MEMBERS.find(m => m.id === selectedMemberId); config = { title: `Fila: ${member?.name.split(' ')[0]}`, desc: `Processos atribuídos a ${member?.name}.`, color: 'text-slate-600', bg: 'bg-slate-100', icon: Users }; }
    return (
      <div className="p-8 max-w-[1400px] mx-auto animate-in slide-in-from-right-4">
        <div className="flex justify-between items-center mb-8"><div className="flex items-center gap-4"><button onClick={() => setViewMode('DASHBOARD')} className="p-3 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-blue-600 hover:shadow-md transition-all"><ArrowLeft size={20} /></button><div><h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3"><config.icon className={config.color} size={28}/> {config.title}</h2><p className="text-slate-500 text-sm font-medium">{config.desc}</p></div></div><div className={`px-4 py-2 ${config.bg} ${config.color} rounded-lg text-xs font-bold border border-slate-100 shadow-sm`}>{listData.length} Processos</div></div>
        <div className="bg-white rounded-[24px] shadow-lg border border-slate-200 overflow-hidden"><table className="w-full text-left"><thead className="bg-slate-50 border-b border-slate-200"><tr><th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Protocolo / Interessado</th><th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Tipo / Categoria</th><th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Valor / Prazo</th><th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th><th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Ação</th></tr></thead><tbody className="divide-y divide-slate-100">{listData.length === 0 ? (<tr><td colSpan={5} className="px-6 py-20 text-center text-slate-400"><div className="flex flex-col items-center gap-3"><FileSearch size={48} className="text-slate-200"/><p className="font-medium text-sm">Nenhum processo encontrado nesta fila.</p></div></td></tr>) : (listData.map(p => { const isLate = p.slaDeadline && new Date(p.slaDeadline) < new Date(); const assignedStaff = STAFF_MEMBERS.find(s => s.id === p.assignedToId); return (<tr key={p.id} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => { setSelectedProcess(p); setDetailsModalTab('DETAILS'); }}><td className="px-6 py-4"><div className="font-bold text-slate-700 text-sm">{p.interestedParty}</div><div className="text-[10px] font-mono text-slate-400">{p.protocolNumber}</div></td><td className="px-6 py-4"><div className="flex flex-col gap-1"><span className="text-xs font-medium text-slate-600">{p.type === ProcessType.CONCESSION ? 'Concessão' : 'Prestação de Contas'}</span><span className={`text-[9px] font-black uppercase tracking-wider ${p.supplyCategory === 'EXTRAORDINARY' ? 'text-amber-600' : 'text-blue-600'}`}>{p.supplyCategory === 'ORDINARY' ? 'Ordinário' : 'Extraordinário'}</span></div></td><td className="px-6 py-4"><div className="flex flex-col gap-1"><span className="font-bold text-slate-700 text-sm">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.value)}</span>{p.slaDeadline && (<span className={`text-[10px] font-bold ${isLate ? 'text-red-600 bg-red-50 px-1 rounded w-fit' : 'text-slate-400'}`}>Vence: {new Date(p.slaDeadline).toLocaleDateString('pt-BR')}</span>)}</div></td><td className="px-6 py-4"><div className="flex flex-col"><span className="text-xs font-bold text-slate-600">{p.status}</span>{assignedStaff ? (<span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5"><img src={assignedStaff.avatarUrl} className="w-4 h-4 rounded-full"/>{assignedStaff.name.split(' ')[0]}</span>) : (<span className="text-[10px] text-slate-400 italic">Não atribuído</span>)}</div></td><td className="px-6 py-4 text-right relative"><div className="flex items-center justify-end gap-2">{/* Detalhes button - always visible */}<button onClick={(e) => { e.stopPropagation(); setSelectedProcess(p); setDetailsModalTab('DETAILS'); }} className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all shadow-sm"><MoreHorizontal size={14}/> Detalhes</button>{/* Atribuir button - for unassigned or TEAM_MEMBER view */}{listFilter === 'TEAM_MEMBER' ? (<><button onClick={(e) => { e.stopPropagation(); setAssigningProcessId(assigningProcessId === p.id ? null : p.id); }} className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 transition-all shadow-sm"><UserPlus size={14}/> Reatribuir</button>{assigningProcessId === p.id && (<div className="absolute right-6 top-12 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 animate-in zoom-in-95 origin-top-right overflow-hidden text-left"><div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex justify-between items-center"><span className="text-[10px] font-black text-slate-500 uppercase">Novo Responsável</span><button onClick={(e) => { e.stopPropagation(); setAssigningProcessId(null); }}><X size={14} className="text-slate-400 hover:text-slate-600"/></button></div><div className="max-h-64 overflow-y-auto">{STAFF_MEMBERS.filter(m => m.id !== p.assignedToId).map(member => { const load = teamLoad.find(t => t.id === member.id); return (<button key={member.id} onClick={(e) => { e.stopPropagation(); handleAssignUser(p.id, member.id); }} className="w-full text-left px-4 py-3 hover:bg-purple-50 flex items-center gap-3 border-b border-slate-50 last:border-0 group/item transition-colors"><img src={member.avatarUrl} className="w-8 h-8 rounded-full border border-slate-100"/><div className="flex-1"><p className="text-xs font-bold text-slate-700 group-hover/item:text-purple-700">{member.name}</p><span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${load && load.utilization > 80 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>{load?.activeCount} ativos</span></div></button>); })}</div></div>)}</>) : !p.assignedToId && (<button onClick={(e) => { e.stopPropagation(); handleAction('assume', p.id); }} className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 transition-all shadow-sm"><UserPlus size={14}/> Atribuir</button>)}</div></td></tr>); }))}</tbody></table></div>
      </div>
    );
  };

  const isOperationalView = ['ALL', 'CONCESSION', 'ACCOUNTABILITY'].includes(activeTab);
  const isFinancialTab = activeTab === 'FINANCEIRO';
  const isTableManager = activeTab === 'INSS_TABLES';
  const isSentinelaView = activeTab === 'SENTINELA';
  const isSettingsView = activeTab === 'SETTINGS';
  const isBudgetTab = activeTab === 'ORCAMENTO';
  const isSupridoManagement = activeTab === 'SUPRIDO_MANAGEMENT';
  const isOrdinaryManagement = activeTab === 'ORDINARY_MANAGEMENT';
  const isSiafeTab = activeTab === 'SIAFE';
  const isConcessionTab = activeTab === 'CONCESSION';

  const handleSiafeUpdate = async (processId: string, nl: string, date: string) => {
    const { error } = await supabase
      .from('solicitacoes')
      .update({ 
        status: 'SIAFE_DONE', // Or AccountStatus.SIAFE_DONE if mapped correctly
        updated_at: new Date().toISOString()
      })
      .eq('id', processId);
    
    if (error) alert('Erro ao atualizar SIAFE: ' + error.message);
    else refreshProcesses();
  };

  if (auditProcess) return <SentinelaAudit process={auditProcess} onClose={() => setAuditProcess(null)} />;

  return (
    <div className="h-full flex flex-col bg-slate-50/50">
      <div className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm z-20">
        <div className="flex flex-col gap-4">
          {!isSettingsView && !isTableManager && (
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3"><div className="p-2 bg-blue-600 rounded-lg text-white shadow-lg shadow-blue-200"><Briefcase size={20} /></div><div><h1 className="text-xl font-bold text-slate-800 tracking-tight">Mesa Técnica SOSFU</h1><p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest">{activeTab === 'ALL' ? 'Visão Geral Unificada' : activeTab === 'ACCOUNTABILITY' ? 'Auditoria & Prestação de Contas' : activeTab}</p></div></div>
              <div className="flex items-center gap-3">
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0"><button onClick={() => setCategoryFilter('ALL')} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${categoryFilter === 'ALL' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}>Todos</button><button onClick={() => setCategoryFilter('ORDINARY')} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${categoryFilter === 'ORDINARY' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Ordinário</button><button onClick={() => setCategoryFilter('EXTRAORDINARY')} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1 ${categoryFilter === 'EXTRAORDINARY' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-400'}`}><Zap size={10} className={categoryFilter === 'EXTRAORDINARY' ? 'fill-amber-600' : ''}/> Extra</button></div>
                <div className="relative w-64 group"><Search className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={14} /><input type="text" placeholder="Buscar protocolo ou interessado..." className="w-full pl-9 pr-4 py-2 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-slate-50 focus:bg-white transition-all shadow-inner" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}/></div>
              </div>
            </div>
          )}
          {!isSettingsView && (
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 mt-2">
              <div className="flex overflow-x-auto pb-1 gap-1 no-scrollbar w-full md:w-auto"><button onClick={() => setActiveTab('ALL')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'ALL' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}>Painel de Controle</button><div className="w-px h-6 bg-slate-200 mx-1 self-center"></div><button onClick={() => setActiveTab('CONCESSION')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'CONCESSION' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'text-slate-500 hover:bg-slate-100'}`}>Concessão</button><button onClick={() => setActiveTab('ACCOUNTABILITY')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'ACCOUNTABILITY' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'text-slate-500 hover:bg-slate-100'}`}><ShieldCheck size={14}/> Auditoria & PC</button><div className="w-px h-6 bg-slate-200 mx-1 self-center"></div><button onClick={() => setActiveTab('FINANCEIRO')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${isFinancialTab ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'text-slate-500 hover:bg-slate-100'}`}><BarChart3 size={14}/> Financeiro</button><button onClick={() => setActiveTab('ORCAMENTO')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${isBudgetTab ? 'bg-violet-50 text-violet-700 border border-violet-100' : 'text-slate-500 hover:bg-slate-100'}`}><PiggyBank size={14}/> Orçamento</button><button onClick={() => setActiveTab('SUPRIDO_MANAGEMENT')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${isSupridoManagement ? 'bg-orange-50 text-orange-700 border border-orange-100' : 'text-slate-500 hover:bg-slate-100'}`}><UserCheck size={14}/> Gestão de Supridos</button><div className="w-px h-6 bg-slate-200 mx-1 self-center"></div><button onClick={() => setActiveTab('SIAFE')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${isSiafeTab ? 'bg-sky-50 text-sky-700 border border-sky-100' : 'text-slate-500 hover:bg-slate-100'}`}><Building2 size={14}/> Integração SIAFE</button><button onClick={() => setActiveTab('ORDINARY_MANAGEMENT')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${isOrdinaryManagement ? 'bg-purple-50 text-purple-700 border border-purple-100' : 'text-slate-500 hover:bg-slate-100'}`}><CalendarRange size={14}/> Gestão Ordinário</button></div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative p-6">
        {isSettingsView ? (<SystemSettings onBack={() => setActiveTab('ALL')} />) : isTableManager ? (<INSSTableManager onBack={() => setActiveTab('FINANCEIRO')} />) : isFinancialTab ? (
          <div className="h-full overflow-y-auto custom-scrollbar pb-10">
            {/* Sub-navigation for Financeiro */}
            <div className="flex gap-2 mb-6">
              <button onClick={() => setFinanceSubTab('TAX_INSS')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${financeSubTab === 'TAX_INSS' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-emerald-50'}`}><Landmark size={14}/> Gestão de INSS</button>
              <button onClick={() => setFinanceSubTab('GDR_CONTROL')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${financeSubTab === 'GDR_CONTROL' ? 'bg-teal-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-teal-50'}`}><Undo2 size={14}/> Gestão de Devoluções</button>
            </div>
            <FinancialRegistry processes={getFilteredList()} type={financeSubTab} isLoading={isLoading} onManageTables={() => setActiveTab('INSS_TABLES')}/>
          </div>
                ) : isConcessionTab ? (
          <ConcessionManager 
            processes={processes} 
            onUpdateStatus={handleMoveProcess} 
            onUpdateExecutionNumbers={updateExecutionNumbers}
            onTramitToSefin={tramitToSefin}
            onCompleteExecution={completeExecution}
            refresh={refreshProcesses}
            budgetCap={budget.totalCap} 
          />
        ) : isBudgetTab ? (
          <div className="h-full overflow-y-auto custom-scrollbar p-6">
            <BudgetPlanningDashboard />
          </div>
        ) : activeTab === 'ALL' ? (
          <div className="h-full overflow-y-auto custom-scrollbar">
            {isOrdinaryManagement && <div className="mb-8"><BudgetManager budget={budget} onLaunchBatch={handleBatchLaunch} /></div>}
            {viewMode === 'DASHBOARD' && (<>{renderDashboardCards()}{renderRoleApprovalQueue()}{renderTeamManagement()}</>)}
            {viewMode === 'LIST' && renderProcessList()}
            {viewMode === 'KANBAN' && (<><div className="mb-4 flex justify-end"><button onClick={() => setViewMode('DASHBOARD')} className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase hover:text-blue-700"><Layout size={16}/> Voltar ao Painel</button></div><div className="h-[600px]"><KanbanBoard processes={getFilteredList()} activeTab={activeTab} onViewDetails={(p) => { setSelectedProcess(p); setDetailsModalTab('DETAILS'); }} onAction={(action, id) => { if(action === 'assume') setAssigningProcessId(id); else handleMoveProcess(id, ConcessionStatus.ANALYSIS); }} staffWorkload={{}} isLoading={isLoading} onMoveProcess={handleMoveProcess}/></div></>)}
          </div>
        ) : (
          <div className="h-full flex flex-col">
             {activeTab === 'ACCOUNTABILITY' && (
               <div className="bg-indigo-900 rounded-2xl p-6 mb-6 shadow-xl flex items-center justify-between text-white relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><ShieldCheck size={120} /></div>
                 <div className="relative z-10">
                   <h3 className="text-lg font-black uppercase tracking-tight mb-1 flex items-center gap-2">Sentinela <span className="bg-indigo-800 text-indigo-200 text-[10px] px-2 py-0.5 rounded">IA Ativa</span></h3>
                   <p className="text-xs text-indigo-300">Análise automatizada de conformidade e riscos.</p>
                 </div>
                 <div className="flex gap-4 relative z-10">
                   <button onClick={() => setAuditFilter('CRITICAL')} className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-all ${auditFilter === 'CRITICAL' ? 'bg-red-500/20 border-red-400' : 'border-white/10 hover:bg-white/5'}`}>
                     <ShieldAlert className="text-red-400" size={20} />
                     <div className="text-left"><p className="text-[10px] font-bold text-red-300 uppercase">Risco Crítico</p><p className="text-xl font-black leading-none">{auditStats.critical}</p></div>
                   </button>
                   <button onClick={() => setAuditFilter('PENDING')} className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-all ${auditFilter === 'PENDING' ? 'bg-blue-500/20 border-blue-400' : 'border-white/10 hover:bg-white/5'}`}>
                     <ShieldCheck className="text-blue-400" size={20} />
                     <div className="text-left"><p className="text-[10px] font-bold text-blue-300 uppercase">A Verificar</p><p className="text-xl font-black leading-none">{auditStats.pending}</p></div>
                   </button>
                   {auditFilter !== 'ALL' && (<button onClick={() => setAuditFilter('ALL')} className="p-2 hover:bg-white/10 rounded-full transition-colors text-indigo-300" title="Limpar Filtros"><X size={16}/></button>)}
                 </div>
               </div>
             )}
            <div className="flex justify-end mb-4"><div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0"><button onClick={() => setViewMode('LIST')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'LIST' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><ListIcon size={16} /></button><button onClick={() => setViewMode('KANBAN')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'KANBAN' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid size={16} /></button></div></div>
            <div className="flex-1 overflow-hidden">{viewMode === 'KANBAN' ? (<KanbanBoard processes={getFilteredList()} activeTab={activeTab} onViewDetails={(p) => { setSelectedProcess(p); setDetailsModalTab('DETAILS'); }} onAction={(action, id) => handleAction(action, id)} staffWorkload={{}} isLoading={isLoading} onMoveProcess={handleMoveProcess} onPriorityChange={handlePriorityChange}/>) : (<div className="h-full overflow-y-auto custom-scrollbar bg-white rounded-2xl border border-slate-200 shadow-sm"><ListView processes={getFilteredList()} onViewDetails={(p) => { setSelectedProcess(p); setDetailsModalTab('DETAILS'); }} onAction={(action, id) => handleAction(action, id)} staffWorkload={{}} isLoading={isLoading} /></div>)}</div>
          </div>
        )}
      </div>

      {/* Universal Process Details Page - replaces ProcessDetailsModal */}
      {selectedProcess && (
        <div className="fixed inset-0 z-[100] bg-white">
          <UniversalProcessDetailsPage
            processId={selectedProcess.id}
            currentUserId={currentUserId || ''}
            onClose={() => setSelectedProcess(null)}
            canTramitar={true}
            canGenerateAtesto={true}
            canCreateDocument={true}
            onTramitar={() => setShowTramitarModal(true)}
            onGenerateAtesto={() => alert('Atesto gerado com sucesso!')}
            onCreateDocument={() => setShowDocumentWizard(true)}
          />
        </div>
      )}

      {/* Tramitar Modal */}
      {showTramitarModal && selectedProcess && (
        <TramitarModal
          isOpen={true}
          onClose={() => setShowTramitarModal(false)}
          processId={selectedProcess.id}
          processNup={selectedProcess.protocolNumber}
          currentStatus={selectedProcess.status || 'INBOX'}
          currentModule="SOSFU"
          onSuccess={() => {
            setShowTramitarModal(false);
            setSelectedProcess(null);
            refreshProcesses();
          }}
        />
      )}

      {/* Document Creation Wizard */}
      {showDocumentWizard && selectedProcess && (
        <DocumentCreationWizard
          isOpen={true}
          processId={selectedProcess.id}
          nup={selectedProcess.protocolNumber}
          currentUser={null}
          onClose={() => setShowDocumentWizard(false)}
          onSuccess={() => {
            setShowDocumentWizard(false);
          }}
        />
      )}

      {assigningProcessId && <AssignmentModal staffMembers={STAFF_MEMBERS} processesCount={{}} onSelect={(staffId) => handleAssignUser(assigningProcessId, staffId)} onClose={() => setAssigningProcessId(null)} />}
      {auditProcess && <SentinelaAudit process={auditProcess} onClose={() => setAuditProcess(null)} />}
      {renderRedistributionModal()}
    </div>
  );
};
