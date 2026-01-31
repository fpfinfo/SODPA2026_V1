import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { FilterTab, ViewMode, ProcessType, Process, ProcessStatus, ConcessionStatus, AccountStatus, SupplyCategory, AnnualBudget, BudgetDistribution, AdminBudget, BudgetRule } from '../types';
import { CURRENT_USER_ID, INITIAL_BUDGET } from '../constants';
import { KPIHeader } from './KPIHeader';
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
import { SupridoMasterTable } from './SOSFU/SupridoMasterTable';
import { OrdinaryProcessFactory } from './SOSFU/OrdinaryProcessFactory';
import { GestaoINSSTab } from './SOSFU/GestaoINSSTab';
import { GestaoDevolucoesTab } from './SOSFU/GestaoDevolucoesTab';
import { SiafeManager } from './SiafeManager';
import { ExpenseExecutionWizard } from './Execution/ExpenseExecutionWizard';
import { BudgetPlanningDashboard } from './BudgetPlanningDashboard';
import { JuriReviewPanel } from './JuriReviewPanel';
import { useSOSFUProcesses, SOSFUStats } from '../hooks/useSOSFUProcesses';
import { useFinancialAnalytics } from '../hooks/useFinancialAnalytics';
import { useRoleRequests, ROLE_LABELS, RoleRequest } from '../hooks/useRoleRequests';
import { useTeamMembers, TeamMember } from '../hooks/useTeamMembers';
import { DashboardCardsPanel, CardMode } from './DashboardSOSFU/DashboardCardsPanel';
import { RoleApprovalQueue } from './DashboardSOSFU/RoleApprovalQueue';
import { TaskSchedulerPanel } from './DashboardSOSFU/TaskSchedulerPanel';
import { useToast } from './ui/ToastProvider';
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
  CheckCircle,
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
  CalendarRange,
  ShieldAlert,
  CheckCircle2,
  ArrowUpDown,
  Keyboard,
  PartyPopper,
  Mailbox
} from 'lucide-react';

interface DashboardSOSFUProps {
  forceTab?: FilterTab | null;
  onInternalTabChange?: () => void;
  onProcessesChange?: (processes: Process[]) => void;
  onOpenProcess?: (processId: string) => void;
}

type SosfuViewMode = 'DASHBOARD' | 'LIST';
type ListFilterType = 'INBOX' | 'MY_TASKS' | 'MY_TASKS_SOL' | 'MY_TASKS_PC' | 'ANALYSIS' | 'FINANCE' | 'TEAM_MEMBER' | 'AWAITING_SIGN';
type TeamSortOrder = 'name' | 'active' | 'late';

// LocalStorage keys for persistent filters
const STORAGE_KEYS = {
  LIST_FILTER: 'sosfu_list_filter',
  CATEGORY_FILTER: 'sosfu_category_filter',
  SEARCH_QUERY: 'sosfu_search_query',
  TEAM_SORT: 'sosfu_team_sort'
} as const;

export const DashboardSOSFU: React.FC<DashboardSOSFUProps> = ({ forceTab, onInternalTabChange, onProcessesChange, onOpenProcess }) => {
  // Real data fetched from hook
  const { 
    processes, 
    stats: sosfuStats, 
    isLoading: isProcessesLoading, 
    refresh: refreshProcesses,
    currentUserId,
    getCategory,
    // Card filter functions
    getCaixaEntrada,
    getMinhaMesa,
    getFluxoSefin,
    getAguardPC,
    // Archive filter functions
    getSolicitacoesConcluidas,
    getPCConcluidas,
    // Action functions
    assignToUser,
    updateExecutionNumbers,
    tramitToSefin,
    completeExecution
  } = useSOSFUProcesses();

  const { showToast } = useToast();

  // Propagate process changes to parent for cross-module integration (e.g., SEFIN inbox)
  React.useEffect(() => {
    onProcessesChange?.(processes);
  }, [processes, onProcessesChange]);

  const { budget: analyticsBudget, isLoading: isBudgetLoading } = useFinancialAnalytics();
  const [budget, setBudget] = useState<AnnualBudget>(INITIAL_BUDGET);

  // Sync budget from analytics
  useEffect(() => {
    if (analyticsBudget && !isBudgetLoading) {
      setBudget({
        year: 2026,
        totalCap: analyticsBudget.total,
        executedOrdinary: analyticsBudget.executedOrdinary || 0,
        executedExtraordinary: analyticsBudget.executedExtraordinary || 0,
        actions: []
      });
    }
  }, [analyticsBudget, isBudgetLoading]);

  // Initialize states from localStorage for persistence
  const getStoredValue = <T,>(key: string, defaultValue: T): T => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch { return defaultValue; }
  };

  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [viewMode, setViewMode] = useState<SosfuViewMode>('DASHBOARD');
  const [listFilter, setListFilter] = useState<ListFilterType>(() => 
    getStoredValue(STORAGE_KEYS.LIST_FILTER, 'INBOX' as ListFilterType)
  );
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(() => 
    getStoredValue(STORAGE_KEYS.SEARCH_QUERY, '')
  );
  const [categoryFilter, setCategoryFilter] = useState<SupplyCategory | 'ALL'>(() => 
    getStoredValue(STORAGE_KEYS.CATEGORY_FILTER, 'ALL' as SupplyCategory | 'ALL')
  );
  const [auditFilter, setAuditFilter] = useState<'ALL' | 'CRITICAL' | 'PENDING'>('ALL');
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);
  const [detailsModalTab, setDetailsModalTab] = useState<'OVERVIEW' | 'ANALYSIS' | 'DOSSIER'>('OVERVIEW');
  const [assigningProcessId, setAssigningProcessId] = useState<string | null>(null);
  const [redistributionSourceId, setRedistributionSourceId] = useState<string | null>(null);
  const [auditProcess, setAuditProcess] = useState<Process | null>(null);
  const [reviewingProcessId, setReviewingProcessId] = useState<string | null>(null);
  
  // Team sorting state
  const [teamSortOrder, setTeamSortOrder] = useState<TeamSortOrder>(() => 
    getStoredValue(STORAGE_KEYS.TEAM_SORT, 'name' as TeamSortOrder)
  );
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  
  // User capacity for task scheduling
  const [userCapacity, setUserCapacity] = useState<number>(20);
  
  // Persist filters to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.LIST_FILTER, JSON.stringify(listFilter));
    }
  }, [listFilter]);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.CATEGORY_FILTER, JSON.stringify(categoryFilter));
    }
  }, [categoryFilter]);
  
  useEffect(() => {
    if (typeof window !== 'undefined' && searchQuery) {
      localStorage.setItem(STORAGE_KEYS.SEARCH_QUERY, JSON.stringify(searchQuery));
    }
  }, [searchQuery]);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.TEAM_SORT, JSON.stringify(teamSortOrder));
    }
  }, [teamSortOrder]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      switch (e.key.toLowerCase()) {
        case 'e': setListFilter('INBOX'); setViewMode('LIST'); break;
        case 'm': setListFilter('MY_TASKS'); setViewMode('LIST'); break;
        case 'r': refreshProcesses(); break;
        case '?': setShowKeyboardHelp(prev => !prev); break;
        case 'escape': setShowKeyboardHelp(false); setViewMode('DASHBOARD'); break;
      }
    };
    
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [refreshProcesses]);
  
  // Fetch user capacity from profile
  useEffect(() => {
    const fetchUserCapacity = async () => {
      if (!currentUserId) return;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('capacidade_diaria')
          .eq('id', currentUserId)
          .single();
        if (error) {
          console.warn('[DashboardSOSFU] capacidade_diaria not found, using default:', error.code);
          return; // Use default capacity
        }
        if (data?.capacidade_diaria) {
          setUserCapacity(data.capacidade_diaria);
        }
      } catch (err) {
        console.warn('[DashboardSOSFU] Error fetching capacity, using default:', err);
      }
    };
    fetchUserCapacity();
  }, [currentUserId]);
  
  // Handler to update user capacity
  const handleCapacityChange = async (newCapacity: number) => {
    if (!currentUserId) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ capacidade_diaria: newCapacity })
        .eq('id', currentUserId);
      if (error) {
        console.warn('[DashboardSOSFU] Error updating capacity:', error.message);
        return;
      }
      setUserCapacity(newCapacity);
    } catch (err) {
      console.warn('[DashboardSOSFU] Error updating capacity:', err);
    }
  };
  
  // Budget configuration state (moved from BudgetManager)
  // MOCK states removed - data is now fetched inside BudgetManager via useBudgetData hook or passed appropriately
  const [showMatrix, setShowMatrix] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [financeSubTab, setFinanceSubTab] = useState<'TAX_INSS' | 'GDR_CONTROL'>('TAX_INSS');
  
  // States for UniversalProcessDetailsPage integration
  const [showTramitarModal, setShowTramitarModal] = useState(false);
  const [showDocumentWizard, setShowDocumentWizard] = useState(false);
  const [viewProcessDetails, setViewProcessDetails] = useState(false);
  
  // State for Expense Execution Wizard
  const [showExecutionWizard, setShowExecutionWizard] = useState(false);
  const [executionProcess, setExecutionProcess] = useState<Process | null>(null);


  useEffect(() => { 
    if (forceTab) { 
      setActiveTab(forceTab); 
      // Delay the callback to ensure the tab change has rendered
      if (onInternalTabChange) {
        setTimeout(() => onInternalTabChange(), 100);
      }
    } 
  }, [forceTab, onInternalTabChange]);


  const stats = sosfuStats;

  const auditStats = useMemo(() => {
      const accountabilityProcesses = processes.filter(p => getCategory(p) === 'PRESTACAO');
      return {
          critical: accountabilityProcesses.filter(p => p.sentinelaRisk === 'CRITICAL').length,
          pending: accountabilityProcesses.filter(p => !p.sentinelaRisk || p.sentinelaRisk === 'PENDING').length,
          total: accountabilityProcesses.length
      };
  }, [processes, getCategory]);

  // Calculate card mode based on majority of processes in user's tasks
  const cardMode: CardMode = useMemo(() => {
    const myProcesses = getMinhaMesa();
    if (myProcesses.length === 0) return 'CONCESSION';
    const pcCount = myProcesses.filter(p => 
      getCategory(p) === 'PRESTACAO' || 
      (p.status as string)?.toUpperCase().includes('PRESTAÇÃO') ||
      (p.status as string)?.toUpperCase().includes('PC')
    ).length;
    return pcCount > myProcesses.length / 2 ? 'PC' : 'CONCESSION';
  }, [getMinhaMesa, getCategory]);

  // Fetch real team members from database
  const { teamMembers: realTeamMembers, isLoading: isLoadingTeam, refresh: refreshTeamMembers } = useTeamMembers();
  
  // Role approval queue for SOSFU admins
  const { pendingRequests, approveRequest, rejectRequest, refreshRequests, isLoading: isLoadingRoles } = useRoleRequests();

  const teamLoad = useMemo(() => {
    const BASE_CAPACITY = 10;
    const members = realTeamMembers;
    const loadData = members.map(member => {
      const memberProcesses = processes.filter(p => p.assignedToId === member.id || p.assignedToId === member.servidor_id);
      const activeCount = memberProcesses.length;
      const utilization = (activeCount / BASE_CAPACITY) * 100;
      const lateCount = memberProcesses.filter(p => p.slaDeadline && new Date(p.slaDeadline) < new Date()).length;
      return { 
        ...member, 
        nome: member.nome, 
        avatar_url: member.avatar_url,
        activeCount, 
        lateCount, 
        utilization 
      };
    });
    
    // Sort based on teamSortOrder
    return loadData.sort((a, b) => {
      switch (teamSortOrder) {
        case 'name': return a.nome.localeCompare(b.nome);
        case 'active': return b.activeCount - a.activeCount;
        case 'late': return b.lateCount - a.lateCount;
        default: return 0;
      }
    });
  }, [processes, realTeamMembers, teamSortOrder]);

  const handleCardClick = (mode: SosfuViewMode, filter?: ListFilterType) => { setViewMode(mode); if (filter) setListFilter(filter); };
  const handleAction = (action: string, id: string) => { 
    const p = processes.find(pr => pr.id === id);
    if (!p) return;
    if (action === 'assume') setAssigningProcessId(id); 
    else if (action === 'sentinela') setAuditProcess(p);
    else if (action === 'adjustQty') setReviewingProcessId(id);
    else if (action === 'details') { 
      if (onOpenProcess) {
        onOpenProcess(id);
      } else {
        setSelectedProcess(p); 
        setDetailsModalTab('OVERVIEW'); 
      }
    }
    else if (action === 'analysis') handleMoveProcess(id, ConcessionStatus.ANALYSIS);
  };

  // Helper function to open process details (uses page navigation if available, otherwise modal)
  const openProcessDetails = (processOrId: Process | string) => {
    const processId = typeof processOrId === 'string' ? processOrId : processOrId.id;
    if (onOpenProcess) {
      onOpenProcess(processId);
    } else {
      const p = typeof processOrId === 'string' ? processes.find(pr => pr.id === processOrId) : processOrId;
      if (p) {
        setSelectedProcess(p);
        setDetailsModalTab('OVERVIEW');
      }
    }
  };

  const handleViewMemberQueue = (memberId: string) => { setSelectedMemberId(memberId); setListFilter('TEAM_MEMBER'); setViewMode('LIST'); };
  const handleAssignUser = async (processId: string, staffId: string) => { 
    try {
      await assignToUser(processId, staffId); 
      setAssigningProcessId(null); 
    } catch (err) {
      showToast({ type: 'error', title: 'Erro de Atribuição', message: (err as Error).message });
    }
  };
  const handleBulkRedistribute = async (targetMemberId: string) => { 
    if (!redistributionSourceId) return; 
    try {
      for (const p of processes.filter(p => p.assignedToId === redistributionSourceId)) {
        await assignToUser(p.id, targetMemberId);
      }
      setRedistributionSourceId(null); 
      showToast({ type: 'success', title: 'Sucesso', message: 'Carga de trabalho redistribuída com sucesso!' }); 
    } catch (err) {
      showToast({ type: 'error', title: 'Erro de Redistribuição', message: (err as Error).message });
    }
  };
  
  // Handler for ConcessionManager status updates - Updates process state which propagates to SefinDashboard
  const handleMoveProcess = async (processId: string, newStatus: string) => {
    console.log('[DashboardSOSFU] handleMoveProcess called:', processId, newStatus);
    const { error } = await supabase.from('solicitacoes').update({ status: newStatus }).eq('id', processId);
    if (error) showToast({ type: 'error', title: 'Erro de Movimentação', message: error.message });
    else refreshProcesses();
  };
  
  const handlePriorityChange = async (processId: string, newPriority: 'NORMAL' | 'HIGH' | 'CRITICAL') => { 
    const { error } = await supabase.from('solicitacoes').update({ priority: newPriority }).eq('id', processId);
    if (error) showToast({ type: 'error', title: 'Erro de Prioridade', message: error.message });
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
      case 'INBOX': return getCaixaEntrada().filter(p => 
        (!categoryFilter || categoryFilter === 'ALL' || p.supplyCategory === categoryFilter) &&
        (!searchQuery || p.protocolNumber.toLowerCase().includes(searchQuery.toLowerCase()) || p.interestedParty?.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      case 'MY_TASKS': return getMinhaMesa().filter(p => 
        (!categoryFilter || categoryFilter === 'ALL' || p.supplyCategory === categoryFilter) &&
        (!searchQuery || p.protocolNumber.toLowerCase().includes(searchQuery.toLowerCase()) || p.interestedParty?.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      case 'MY_TASKS_SOL': return getMinhaMesa().filter(p => 
        getCategory(p) === 'SOLICITACAO' &&
        (!categoryFilter || categoryFilter === 'ALL' || p.supplyCategory === categoryFilter) &&
        (!searchQuery || p.protocolNumber.toLowerCase().includes(searchQuery.toLowerCase()) || p.interestedParty?.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      case 'MY_TASKS_PC': return getMinhaMesa().filter(p => 
        getCategory(p) === 'PRESTACAO' &&
        (!categoryFilter || categoryFilter === 'ALL' || p.supplyCategory === categoryFilter) &&
        (!searchQuery || p.protocolNumber.toLowerCase().includes(searchQuery.toLowerCase()) || p.interestedParty?.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      case 'ANALYSIS': return result.filter(p => p.status === ConcessionStatus.ANALYSIS || p.status === AccountStatus.AUDIT);
      case 'FINANCE': return result.filter(p => p.status === ConcessionStatus.FINANCE);
      case 'AWAITING_SIGN': return getFluxoSefin().filter(p => 
        (!categoryFilter || categoryFilter === 'ALL' || p.supplyCategory === categoryFilter) &&
        (!searchQuery || p.protocolNumber.toLowerCase().includes(searchQuery.toLowerCase()) || p.interestedParty?.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      case 'TEAM_MEMBER': return result.filter(p => p.assignedToId === selectedMemberId);
      default: return result;
    }
  };

  const renderRedistributionModal = () => {
    if (!redistributionSourceId) return null;
    const sourceMember = realTeamMembers.find(m => m.id === redistributionSourceId);
    const taskCount = processes.filter(p => p.assignedToId === redistributionSourceId).length;
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center"><h3 className="font-black text-slate-800 flex items-center gap-2"><ArrowRightLeft className="text-blue-600" size={20}/> Redistribuir Carga</h3><button onClick={() => setRedistributionSourceId(null)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button></div>
          <div className="p-6">
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl mb-6 flex items-start gap-3"><UserMinus size={20} className="text-amber-600 shrink-0 mt-0.5"/><div><p className="text-sm font-bold text-amber-800">Origem: {sourceMember?.nome}</p><p className="text-xs text-amber-700 mt-1">Este analista possui <strong>{taskCount} processos</strong> ativos.</p></div></div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Selecione o Destino</p>
            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
              {realTeamMembers.filter(m => m.id !== redistributionSourceId).map(member => { const load = teamLoad.find(t => t.id === member.id); return (<button key={member.id} onClick={() => handleBulkRedistribute(member.id)} className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all group text-left"><div className="flex items-center gap-3"><img src={member.avatar_url || 'https://www.gravatar.com/avatar?d=mp'} className="w-8 h-8 rounded-full border border-slate-200 object-cover"/><div><p className="text-sm font-bold text-slate-700 group-hover:text-blue-700">{member.nome}</p><p className="text-[10px] text-slate-400">{member.role}</p></div></div><span className={`text-[10px] font-bold px-2 py-1 rounded ${load && load.utilization > 80 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>{load?.activeCount} ativos</span></button>); })}
            </div>
          </div>
        </div>
      </div>
    );
  };


  const renderTeamManagement = () => {
    const SortHeader = ({ sortKey, label, className = '' }: { sortKey: TeamSortOrder; label: string; className?: string }) => (
      <th 
        className={`px-8 py-5 text-[10px] font-black uppercase tracking-widest cursor-pointer hover:text-blue-600 transition-colors select-none ${teamSortOrder === sortKey ? 'text-blue-600' : 'text-slate-400'} ${className}`}
        onClick={() => setTeamSortOrder(sortKey)}
      >
        <div className="flex items-center gap-1.5">
          {label}
          <ArrowUpDown size={10} className={teamSortOrder === sortKey ? 'text-blue-600' : 'text-slate-300'} />
        </div>
      </th>
    );
    
    return (
    <div className="bg-white rounded-[32px] shadow-lg border border-slate-200 overflow-hidden mb-8">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center"><h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-3"><Users size={20} className="text-slate-400"/> Gestão da Equipe Técnica</h3></div>
      <table className="w-full text-left border-collapse"><thead className="bg-slate-50 border-b border-slate-200"><tr>
        <SortHeader sortKey="name" label="Analista / Função" className="w-1/3" />
        <SortHeader sortKey="active" label="Carga de Trabalho" />
        <SortHeader sortKey="late" label="Alertas SLA" className="text-center" />
        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Ações</th>
      </tr></thead>
      <tbody className="divide-y divide-slate-100">{teamLoad.length === 0 ? (
        <tr><td colSpan={4} className="px-8 py-16 text-center">
          <div className="flex flex-col items-center gap-3">
            <Users size={48} className="text-slate-200"/>
            <p className="font-medium text-sm text-slate-400">Nenhum analista na equipe.</p>
          </div>
        </td></tr>
      ) : teamLoad.map(member => (<tr key={member.id} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => handleViewMemberQueue(member.id)}><td className="px-8 py-6"><div className="flex items-center gap-4"><div className="relative"><img src={member.avatar_url || 'https://www.gravatar.com/avatar?d=mp'} className="w-12 h-12 rounded-2xl border-2 border-white shadow-md group-hover:scale-105 transition-transform bg-slate-100 object-cover" /><div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full ${member.activeCount > 8 ? 'bg-amber-500' : 'bg-emerald-500'}`}></div></div><div><p className="text-sm font-black text-slate-800">{member.nome}</p><p className="text-[11px] font-medium text-slate-500 mt-0.5">{member.role || member.cargo}</p></div></div></td><td className="px-8 py-6"><div className="max-w-xs"><div className="flex justify-between text-xs font-bold mb-2"><span className="text-slate-600">{member.activeCount} Processos</span><span className="text-slate-400">{Math.round(member.utilization)}% Cap.</span></div><div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${member.utilization > 90 ? 'bg-red-500' : member.utilization > 70 ? 'bg-amber-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(member.utilization, 100)}%` }}></div></div></div></td><td className="px-8 py-6 text-center">{member.lateCount > 0 ? (<span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-[10px] font-black uppercase tracking-wide border border-red-100"><AlertCircle size={12}/> {member.lateCount} Atrasados</span>) : (<span className="text-slate-300 font-bold text-xs">-</span>)}</td><td className="px-8 py-6 text-right"><div className="flex items-center justify-end gap-2"><button onClick={(e) => { e.stopPropagation(); handleViewMemberQueue(member.id); }} className="p-2 bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 rounded-xl transition-all shadow-sm" title="Ver Fila"><ListIcon size={16}/></button><button onClick={(e) => { e.stopPropagation(); setRedistributionSourceId(member.id); }} className="p-2 bg-white border border-slate-200 text-slate-500 hover:text-purple-600 hover:border-purple-200 rounded-xl transition-all shadow-sm" title="Redistribuir Carga"><ArrowRightLeft size={16}/></button></div></td></tr>))}</tbody></table>
    </div>
  )};


  const renderProcessList = () => {
    const listData = getFilteredList();
    let config = { title: 'Caixa de Entrada', desc: 'Processos aguardando distribuição e triagem.', color: 'text-blue-600', bg: 'bg-blue-50', icon: Inbox };
    if (listFilter === 'MY_TASKS') config = { title: 'Minha Mesa de Trabalho', desc: 'Processos sob sua responsabilidade.', color: 'text-purple-600', bg: 'bg-purple-50', icon: UserCog };
    else if (listFilter === 'MY_TASKS_SOL') config = { title: 'Minha Mesa: Solicitações', desc: 'Concessões de suprimento atribuídas a você.', color: 'text-purple-600', bg: 'bg-purple-50', icon: FileText };
    else if (listFilter === 'MY_TASKS_PC') config = { title: 'Minha Mesa: Prestações de Contas', desc: 'Prestações de contas atribuídas a você.', color: 'text-orange-600', bg: 'bg-orange-50', icon: UserCog };
    else if (listFilter === 'ANALYSIS') config = { title: 'Em Análise Técnica', desc: 'Processos em fase de instrução e análise.', color: 'text-amber-600', bg: 'bg-amber-50', icon: FileText };
    else if (listFilter === 'FINANCE') config = { title: 'Fase Financeira', desc: 'Processos em empenho ou pagamento.', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: Wallet };
    else if (listFilter === 'TEAM_MEMBER' && selectedMemberId) { const member = realTeamMembers.find(m => m.id === selectedMemberId); config = { title: `Fila: ${member?.nome.split(' ')[0]}`, desc: `Processos atribuídos a ${member?.nome}.`, color: 'text-slate-600', bg: 'bg-slate-100', icon: Users }; }
    
    // Transform Process to format expected by TaskSchedulerPanel
    const schedulerProcesses = listData.map(p => ({
      id: p.id,
      nup: p.protocolNumber,
      tipo: (p as any).supplyCategory === 'EXTRAORDINARY' ? 'EXTRAORDINARIO' : 'ORDINARIO',
      valor_total: p.value,
      suprido_nome: p.interestedParty,
      status: p.status as string,
      data_planejada: (p as any).data_planejada || null,
      prioridade_usuario: (p as any).prioridade_usuario || 2,
      notas_planejamento: (p as any).notas_planejamento || '',
    }));

    // Handler for scheduling process
    const handleScheduleProcess = async (processId: string, date: string | null, priority?: number, notes?: string) => {
      console.log('Scheduling process:', { processId, date, priority, notes });
      try {
        const { data, error } = await supabase
          .from('solicitacoes')
          .update({
            data_planejada: date,
            prioridade_usuario: priority,
            notas_planejamento: notes,
          })
          .eq('id', processId)
          .select();
        
        console.log('Schedule update result:', { data, error });
        
        if (error) throw error;
        refreshProcesses();
      } catch (err) {
        console.error('Error scheduling process:', err);
      }
    };

    // Use TaskSchedulerPanel for MY_TASKS, MY_TASKS_SOL, MY_TASKS_PC views
    if (listFilter === 'MY_TASKS' || listFilter === 'MY_TASKS_SOL' || listFilter === 'MY_TASKS_PC') {
      return (
        <div className="p-8 max-w-[1400px] mx-auto animate-in slide-in-from-right-4">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <button onClick={() => setViewMode('DASHBOARD')} className="p-3 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-blue-600 hover:shadow-md transition-all">
                <ArrowLeft size={20} />
              </button>
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                  <config.icon className={config.color} size={28}/> {config.title}
                </h2>
                <p className="text-slate-500 text-sm font-medium">{config.desc}</p>
              </div>
            </div>
            <div className={`px-4 py-2 ${config.bg} ${config.color} rounded-lg text-xs font-bold border border-slate-100 shadow-sm`}>
              {listData.length} Processos
            </div>
          </div>
          
          <TaskSchedulerPanel
            processes={schedulerProcesses}
            capacity={userCapacity}
            onSchedule={handleScheduleProcess}
            onCapacityChange={handleCapacityChange}
            onViewDetails={(processId) => openProcessDetails(processId)}
            onAdjustQty={(processId) => setReviewingProcessId(processId)}
          />
        </div>
      );
    }
    
    // Default table view for other filters
    return (
      <div className="p-8 max-w-[1400px] mx-auto animate-in slide-in-from-right-4">
        <div className="flex justify-between items-center mb-8"><div className="flex items-center gap-4"><button onClick={() => setViewMode('DASHBOARD')} className="p-3 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-blue-600 hover:shadow-md transition-all"><ArrowLeft size={20} /></button><div><h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3"><config.icon className={config.color} size={28}/> {config.title}</h2><p className="text-slate-500 text-sm font-medium">{config.desc}</p></div></div><div className={`px-4 py-2 ${config.bg} ${config.color} rounded-lg text-xs font-bold border border-slate-100 shadow-sm`}>{listData.length} Processos</div></div>
        <div className="bg-white rounded-[24px] shadow-lg border border-slate-200 overflow-hidden"><table className="w-full text-left"><thead className="bg-slate-50 border-b border-slate-200"><tr><th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Protocolo / Interessado</th><th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Tipo / Categoria</th><th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Valor / Prazo</th><th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th><th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Ação</th></tr></thead><tbody className="divide-y divide-slate-100">{listData.length === 0 ? (<tr><td colSpan={5} className="px-6 py-20 text-center">
          <div className="flex flex-col items-center gap-4">
            {listFilter === 'INBOX' ? (
              <><PartyPopper size={48} className="text-emerald-300"/><p className="font-bold text-emerald-600 text-lg">🎉 Parabéns!</p><p className="text-sm text-slate-500">Nenhum processo aguarda triagem. Caixa vazia!</p></>
            ) : searchQuery ? (
              <><FileSearch size={48} className="text-slate-200"/><p className="font-medium text-sm text-slate-400">Nenhum processo encontrado para "{searchQuery}"</p><button onClick={() => setSearchQuery('')} className="text-xs text-blue-600 font-bold hover:underline">Limpar busca</button></>
            ) : (
              <><Inbox size={48} className="text-slate-200"/><p className="font-medium text-sm text-slate-400">Nenhum processo encontrado nesta fila.</p></>
            )}
          </div>
        </td></tr>) : (listData.map(p => { 
            const statusUpper = (p.status as string)?.toUpperCase() || '';
            const isFinished = statusUpper.includes('BAIXADO') || statusUpper.includes('SIAFE') || statusUpper.includes('CONCLU') || statusUpper.includes('ARQUIVADO');
            const isLate = !isFinished && p.slaDeadline && new Date(p.slaDeadline) < new Date(); 
            const assignedStaff = realTeamMembers.find(s => s.id === p.assignedToId); 
            const canCompleteExecution = p.assignedToId === currentUserId && (statusUpper.includes('ASSINADO') || statusUpper.includes('RETORNO')); 
            
            return (<tr key={p.id} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => openProcessDetails(p)}><td className="px-6 py-4"><div className="font-bold text-slate-700 text-sm">{p.interestedParty}</div><div className="text-[10px] font-mono text-slate-400">{p.protocolNumber}</div></td><td className="px-6 py-4"><div className="flex flex-col gap-1"><span className="text-xs font-medium text-slate-600">{p.type === ProcessType.CONCESSION ? 'Concessão' : 'Prestação de Contas'}</span><span className={`text-[9px] font-black uppercase tracking-wider ${p.supplyCategory === 'EXTRAORDINARY' ? 'text-amber-600' : 'text-blue-600'}`}>{p.supplyCategory === 'ORDINARY' ? 'Ordinário' : 'Extraordinário'}</span></div></td><td className="px-6 py-4"><div className="flex flex-col gap-1"><span className="font-bold text-slate-700 text-sm">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.value)}</span>
            {isFinished ? (
                 <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded w-fit flex items-center gap-1"><CheckCircle2 size={10}/> Baixado</span>
            ) : p.slaDeadline && (
                 <span className={`text-[10px] font-bold ${isLate ? 'text-red-600 bg-red-50 px-1 rounded w-fit' : 'text-slate-400'}`}>Vence: {new Date(p.slaDeadline).toLocaleDateString('pt-BR')}</span>
            )}
            </div></td><td className="px-6 py-4"><div className="flex flex-col"><span className="text-xs font-bold text-slate-600">{p.status}</span>{assignedStaff ? (<span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5"><img src={assignedStaff.avatar_url || 'https://www.gravatar.com/avatar?d=mp'} className="w-4 h-4 rounded-full object-cover"/>{assignedStaff.nome.split(' ')[0]}</span>) : (<span className="text-[10px] text-slate-400 italic">Não atribuído</span>)}</div></td><td className="px-6 py-4 text-right relative"><div className="flex items-center justify-end gap-2"><button onClick={(e) => { e.stopPropagation(); openProcessDetails(p); }} className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all shadow-sm"><MoreHorizontal size={14}/> Detalhes</button>{canCompleteExecution && (<button onClick={async (e) => { e.stopPropagation(); try { await completeExecution(p.id); } catch (err) { console.error('Error completing execution:', err); }}} className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 transition-all shadow-sm"><CheckCircle size={14}/> Concluir</button>)}{listFilter === 'TEAM_MEMBER' ? (<><button onClick={(e) => { e.stopPropagation(); setAssigningProcessId(assigningProcessId === p.id ? null : p.id); }} className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 transition-all shadow-sm"><UserPlus size={14}/> Reatribuir</button>{assigningProcessId === p.id && (<div className="absolute right-6 top-12 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 animate-in zoom-in-95 origin-top-right overflow-hidden text-left"><div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex justify-between items-center"><span className="text-[10px] font-black text-slate-500 uppercase">Novo Responsável</span><button onClick={(e) => { e.stopPropagation(); setAssigningProcessId(null); }}><X size={14} className="text-slate-400 hover:text-slate-600"/></button></div><div className="max-h-64 overflow-y-auto">{realTeamMembers.filter(m => m.id !== p.assignedToId).map(member => { const load = teamLoad.find(t => t.id === member.id); return (<button key={member.id} onClick={(e) => { e.stopPropagation(); handleAssignUser(p.id, member.id); }} className="w-full text-left px-4 py-3 hover:bg-purple-50 flex items-center gap-3 border-b border-slate-50 last:border-0 group/item transition-colors"><img src={member.avatar_url || 'https://www.gravatar.com/avatar?d=mp'} className="w-8 h-8 rounded-full border border-slate-100 object-cover"/><div className="flex-1"><p className="text-xs font-bold text-slate-700 group-hover/item:text-purple-700">{member.nome}</p><span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${load && load.utilization > 80 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>{load?.activeCount} ativos</span></div></button>); })}</div></div>)}</>) : !p.assignedToId && (<button onClick={(e) => { e.stopPropagation(); handleAction('assume', p.id); }} className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 transition-all shadow-sm"><UserPlus size={14}/> Atribuir</button>)}</div></td></tr>); }))}</tbody></table></div>
      </div>
    );
  };

  const isOperationalView = ['ALL', 'CONCESSION', 'ACCOUNTABILITY'].includes(activeTab);
  const isFinancialTab = activeTab === 'FINANCEIRO';
  const isTableManager = activeTab === 'INSS_TABLES';
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
        status: 'Baixado no SIAFE', // AccountStatus.SIAFE_DONE value
        status_workflow: 'PC_SIAFE_DONE',
        siafe_nl: nl,
        siafe_date: date,
        updated_at: new Date().toISOString()
      })
      .eq('id', processId);
    
    if (error) showToast({ type: 'error', title: 'Erro SIAFE', message: error.message });
    else refreshProcesses();
  };

  if (auditProcess) return <SentinelaAudit process={auditProcess} onClose={() => setAuditProcess(null)} />;

  return (
    <div className="h-full flex flex-col bg-slate-50/50">
      <div className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm z-20">
        <div className="flex flex-col gap-4">
          {!isSettingsView && !isTableManager && (
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3"><div className="p-2 bg-blue-600 rounded-lg text-white shadow-lg shadow-blue-200"><Briefcase size={20} /></div><div><h1 className="text-xl font-bold text-slate-800 tracking-tight">Mesa Técnica SOSFU</h1><p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest">{activeTab === 'ALL' ? 'Visão Geral Unificada' : activeTab === 'ACCOUNTABILITY' ? 'Prestação de Contas' : activeTab}</p></div></div>
            </div>
          )}
          {!isSettingsView && (
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 mt-2">
              <div className="flex overflow-x-auto pb-1 gap-2 no-scrollbar w-full md:w-auto">
                {/* Painel Principal */}
                <button onClick={() => setActiveTab('ALL')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'ALL' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}>
                  Painel de Controle
                </button>
                
                <div className="w-px h-6 bg-slate-200 mx-1 self-center" />
                
                {/* GRUPO OPERACIONAL */}
                <div className="flex items-center gap-1 bg-blue-50/50 rounded-lg px-2 py-1 border border-blue-100">
                  <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest mr-1 hidden lg:block">Operacional</span>
                  <button onClick={() => setActiveTab('CONCESSION')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'CONCESSION' ? 'bg-blue-600 text-white shadow-sm' : 'text-blue-600 hover:bg-blue-100'}`}>
                    Concessão
                  </button>
                  <button onClick={() => setActiveTab('ACCOUNTABILITY')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'ACCOUNTABILITY' ? 'bg-indigo-600 text-white shadow-sm' : 'text-indigo-600 hover:bg-indigo-100'}`}>
                    <ShieldCheck size={12}/> PC
                  </button>
                </div>
                
                {/* GRUPO FINANCEIRO */}
                <div className="flex items-center gap-1 bg-emerald-50/50 rounded-lg px-2 py-1 border border-emerald-100">
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mr-1 hidden lg:block">Financeiro</span>
                  <button onClick={() => setActiveTab('FINANCEIRO')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${isFinancialTab ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-600 hover:bg-emerald-100'}`}>
                    <BarChart3 size={12}/> INSS/Dev
                  </button>
                  <button onClick={() => setActiveTab('ORCAMENTO')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${isBudgetTab ? 'bg-violet-600 text-white shadow-sm' : 'text-violet-600 hover:bg-violet-100'}`}>
                    <PiggyBank size={12}/> Orçamento
                  </button>
                  <button onClick={() => setActiveTab('SIAFE')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${isSiafeTab ? 'bg-sky-600 text-white shadow-sm' : 'text-sky-600 hover:bg-sky-100'}`}>
                    <Database size={12}/> SIAFE
                  </button>
                </div>
                
                {/* GRUPO GESTÃO */}
                <div className="flex items-center gap-1 bg-orange-50/50 rounded-lg px-2 py-1 border border-orange-100">
                  <span className="text-[9px] font-black text-orange-400 uppercase tracking-widest mr-1 hidden lg:block">Gestão</span>
                  <button onClick={() => setActiveTab('SUPRIDO_MANAGEMENT')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${isSupridoManagement ? 'bg-orange-600 text-white shadow-sm' : 'text-orange-600 hover:bg-orange-100'}`}>
                    <UserCheck size={12}/> Supridos
                  </button>
                  <button onClick={() => setActiveTab('ORDINARY_MANAGEMENT')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${isOrdinaryManagement ? 'bg-purple-600 text-white shadow-sm' : 'text-purple-600 hover:bg-purple-100'}`}>
                    <CalendarRange size={12}/> Ordinário
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative p-6">
        {isSettingsView ? (<SystemSettings onBack={() => setActiveTab('ALL')} />) : isTableManager ? (<INSSTableManager onBack={() => setActiveTab('FINANCEIRO')} />) : isFinancialTab ? (
          <div className="h-full overflow-y-auto custom-scrollbar pb-10">
            {/* Sub-navigation for Financeiro */}
            <div className="flex gap-2 mb-6">
              <button onClick={() => setFinanceSubTab('TAX_INSS')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${financeSubTab === 'TAX_INSS' ? 'bg-purple-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-purple-50'}`}><Landmark size={14}/> Gestão de INSS</button>
              <button onClick={() => setFinanceSubTab('GDR_CONTROL')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${financeSubTab === 'GDR_CONTROL' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-emerald-50'}`}><Undo2 size={14}/> Gestão de Devoluções</button>
            </div>
            {financeSubTab === 'TAX_INSS' ? (
              <GestaoINSSTab 
                onSelectProcess={(id) => openProcessDetails(id)}
              />
            ) : (
              <GestaoDevolucoesTab 
                onSelectProcess={(id) => openProcessDetails(id)}
              />
            )}
          </div>
                ) : isConcessionTab ? (
          /* Aba Concessão - Arquivo de Solicitações Concluídas */
          <div className="h-full overflow-y-auto custom-scrollbar">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-600 rounded-lg text-white"><CheckSquare size={20} /></div>
                <div>
                  <h3 className="text-lg font-bold text-blue-800">Solicitações Concluídas</h3>
                  <p className="text-xs text-blue-600">Processos com execução da despesa finalizada, aguardando prestação de contas</p>
                </div>
              </div>
              <div className="text-2xl font-black text-blue-700">{getSolicitacoesConcluidas().length} processos</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <ListView 
                processes={getSolicitacoesConcluidas()} 
                onViewDetails={(p) => openProcessDetails(p)} 
                onAction={(action, id) => handleAction(action, id)} 
                staffWorkload={{}} 
                isLoading={isProcessesLoading} 
                teamMembers={realTeamMembers}
              />
            </div>
          </div>
        ) : isBudgetTab ? (
          <div className="h-full overflow-y-auto custom-scrollbar p-6">
            <BudgetPlanningDashboard />
          </div>
        ) : isSiafeTab ? (
          <SiafeManager 
            processes={getPCConcluidas()}
            onUpdateStatus={handleSiafeUpdate}
            isLoading={isProcessesLoading}
          />
        ) : isSupridoManagement ? (
          <div className="h-full overflow-y-auto custom-scrollbar">
            <SupridoMasterTable 
              onEditTitular={(unidade) => console.log('Edit:', unidade)}
              onViewHistory={(id) => console.log('History:', id)}
            />
          </div>
        ) : isOrdinaryManagement ? (
          <div className="h-full overflow-y-auto custom-scrollbar">
            <OrdinaryProcessFactory 
              onProcessComplete={() => refreshProcesses()}
            />
          </div>
        ) : activeTab === 'ALL' ? (
          <div className="h-full overflow-y-auto custom-scrollbar">
            {isOrdinaryManagement && <div className="mb-8"><BudgetManager budget={budget} onLaunchBatch={handleBatchLaunch} /></div>}
            {viewMode === 'DASHBOARD' && (<>
                            <DashboardCardsPanel
                sosfuStats={sosfuStats}
                mode={cardMode}
                isLoading={isProcessesLoading}
                onInboxClick={() => { setListFilter('INBOX'); setViewMode('LIST'); }}
                onMyTasksSolicitacoesClick={() => { setListFilter('MY_TASKS_SOL'); setViewMode('LIST'); }}
                onMyTasksPrestacoesClick={() => { setListFilter('MY_TASKS_PC'); setViewMode('LIST'); }}
                onAwaitingSignClick={() => { setListFilter('AWAITING_SIGN'); setViewMode('LIST'); }}
                onMyTasksClick={() => { setListFilter('MY_TASKS'); setViewMode('LIST'); }}
                onFinanceClick={() => { setListFilter('FINANCE'); setViewMode('LIST'); }}
              />
              <RoleApprovalQueue
                pendingRequests={pendingRequests}
                onApprove={approveRequest}
                onReject={rejectRequest}
                onRefresh={refreshRequests}
              />
              {renderTeamManagement()}
            </>)}
            {viewMode === 'LIST' && renderProcessList()}
            
          </div>
        ) : (
          /* Aba Prestação de Contas - Arquivo de PCs Concluídas */
          <div className="h-full overflow-y-auto custom-scrollbar">
            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-indigo-600 rounded-lg text-white"><ShieldCheck size={20} /></div>
                <div>
                  <h3 className="text-lg font-bold text-indigo-800">Prestações de Contas Concluídas</h3>
                  <p className="text-xs text-indigo-600">Processos com PC finalizada, aguardando baixa SIAFE</p>
                </div>
              </div>
              <div className="text-2xl font-black text-indigo-700">{getPCConcluidas().length} processos</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <ListView 
                processes={getPCConcluidas()} 
                onViewDetails={(p) => openProcessDetails(p)} 
                onAction={(action, id) => handleAction(action, id)} 
                staffWorkload={{}} 
                isLoading={isProcessesLoading} 
                teamMembers={realTeamMembers}
              />
            </div>
          </div>
        )}
      </div>

      {/* Universal Process Details Page - replaces ProcessDetailsModal */}
      {selectedProcess && detailsModalTab && (
        <ProcessDetailsModal 
          process={selectedProcess} 
          onClose={() => setSelectedProcess(null)} 
          initialTab={detailsModalTab} 
          teamMembers={realTeamMembers}
        />
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

      {assigningProcessId && <AssignmentModal staffMembers={realTeamMembers} processesCount={{}} onSelect={(staffId) => handleAssignUser(assigningProcessId, staffId)} onClose={() => setAssigningProcessId(null)} />}
      {auditProcess && <SentinelaAudit process={auditProcess} onClose={() => setAuditProcess(null)} />}
      {renderRedistributionModal()}
      
      {/* Juri Review Panel - Ajuste de Quantidades Aprovadas */}
      {reviewingProcessId && (
        <JuriReviewPanel
          solicitacaoId={reviewingProcessId}
          onClose={() => setReviewingProcessId(null)}
          onSave={() => {
            setReviewingProcessId(null);
            refreshProcesses();
          }}
        />
      )}
      
      {/* Expense Execution Wizard */}
      {showExecutionWizard && executionProcess && (
        <ExpenseExecutionWizard
          isOpen={showExecutionWizard}
          onClose={() => {
            setShowExecutionWizard(false);
            setExecutionProcess(null);
          }}
          process={{
            id: executionProcess.id,
            nup: executionProcess.protocolNumber,
            protocolNumber: executionProcess.protocolNumber,
            interestedParty: executionProcess.interestedParty,
            value: executionProcess.value,
            tipo: executionProcess.type,
            itens_despesa: (executionProcess as any).itens_despesa,
            ptres_code: (executionProcess as any).ptres_code,
            dotacao_code: (executionProcess as any).dotacao_code,
            ne_numero: executionProcess.neNumber,
            dl_numero: executionProcess.dlNumber,
            ob_numero: executionProcess.obNumber,
            portaria_sf_numero: (executionProcess as any).portaria_sf_numero
          }}
          onSuccess={() => {
            refreshProcesses();
            setShowExecutionWizard(false);
            setExecutionProcess(null);
          }}
        />
      )}
      
      {/* Keyboard Shortcuts Help Modal */}
      {showKeyboardHelp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowKeyboardHelp(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-black text-slate-800 flex items-center gap-2">
                <Keyboard className="text-blue-600" size={20}/> Atalhos de Teclado
              </h3>
              <button onClick={() => setShowKeyboardHelp(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20}/>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { key: 'E', label: 'Ir para Caixa de Entrada' },
                { key: 'M', label: 'Ir para Minha Mesa' },
                { key: 'R', label: 'Atualizar dados' },
                { key: '?', label: 'Mostrar/ocultar ajuda' },
                { key: 'Esc', label: 'Voltar ao painel' }
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">{label}</span>
                  <kbd className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 shadow-sm">
                    {key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
