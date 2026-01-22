import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ServiceProviderData, TaxCalculation } from '../types/taxIntegration';
import { isPFElement, calculateTaxes, validateCPF, formatCPF } from '../lib/taxCalculations';
import TaxCalculatorWidget from './TaxCalculatorWidget';
import ServiceProviderForm from './ServiceProviderForm';
import { PrestacaoContasWizard } from './Suprido/PrestacaoContasWizard';
import { supabase } from '../lib/supabaseClient';
import { useToast } from './ui/ToastProvider';

import { 
  PlusCircle, 
  FileText, 
  Clock, 
  ChevronRight, 
  CheckCircle2, 
  Wallet, 
  ArrowLeft, 
  Plus, 
  ChevronDown, 
  X, 
  UserCircle, 
  Info, 
  History as HistoryIcon, 
  Eye, 
  FileCode, 
  LayoutList, 
  Edit, 
  Utensils, 
  RefreshCw, 
  DollarSign, 
  Signature, 
  UploadCloud, 
  File as FileIcon, 
  Files, 
  FileDown, 
  TableOfContents, 
  GitCommit, 
  ArrowUpRight, 
  FileSearch as FileSearchIcon,
  ChevronLeft,
  MapPin,
  Sparkles,
  ArrowRight,
  Send,
  BadgeCheck,
  Printer,
  BookOpen,
  Zap,
  ShieldCheck,
  Calculator,
  Upload,
  UserCheck,
  Gavel,
  CreditCard,
  Building2,
  Trash2,
  Users,
  Scale,
  Calendar,
  Save,
  Search,
  Filter,
  Lock,
  ClipboardCheck
} from 'lucide-react';

const BRASAO_TJPA_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/217479058_brasao-tjpa.png';

type SupridoView = 'DASHBOARD' | 'SELECT_TYPE' | 'FORM' | 'VIEW_DETAILS' | 'EDIT_DRAFT' | 'PROFILE' | 'PROCESS_DETAILS' | 'PRESTACAO_CONTAS';
type SubViewMode = 'DETAILS' | 'COVER' | 'REQUEST' | 'HISTORY' | 'DOSSIER' | 'TIMELINE' | 'EDIT_DOC' | 'VIEW_DOC';

interface FormItem {
  id: string;
  desc: string;
  qty: number;
  val: number;
  element: string;
  // PF Tax fields (3.3.90.36)
  providerData?: Partial<ServiceProviderData>;
  taxes?: TaxCalculation;
  isPFService?: boolean;
}

interface JuriParticipants {
  [key: string]: number;
  servidores: number;
  reus: number;
  jurados: number;
  testemunhas: number;
  defensor: number;
  promotor: number;
  policias: number;
}

interface ProjectionItem {
  id: string;
  description: string;
  element: string;
  unitValue: number;
  quantity: number;
  total: number;
  isAuto?: boolean;
  freqType?: 'almocos' | 'jantares' | 'lanches';
}

interface FormState {
  nup: string;
  type: string;
  startDate: string;
  endDate: string;
  desc: string;
  urgency: string;
  items: FormItem[];
  // Campos do Gestor
  managerName: string;
  managerEmail: string;
  isSelfManager: boolean;
  // Campos Juri
  juriParticipants: JuriParticipants;
  juriComarca: string;
  juriProcessNumber: string;
  juriMealFreq: {
    almocos: number;
    jantares: number;
    lanches: number;
  };
  juriDays: number;
  juriProjectionItems: ProjectionItem[];
}

const EXPENSE_ELEMENTS = [
  { code: '3.3.90.30.01', label: 'Material de Consumo' },
  { code: '3.3.90.30.02', label: 'Combustível' },
  { code: '3.3.90.33.01', label: 'Passagens e Despesas com Locomoção' },
  { code: '3.3.90.36.01', label: 'Outros Serv. Terceiros - Pessoa Física' },
  { code: '3.3.90.39.01', label: 'Outros Serv. Terceiros - Pessoa Jurídica' },
];

const DEFAULT_JURI_ITEMS: ProjectionItem[] = [
  { id: 'almoco', description: 'Refeição - Almoço', element: '3.3.90.39.01', unitValue: 30, quantity: 0, total: 0, isAuto: true, freqType: 'almocos' },
  { id: 'jantar', description: 'Refeição - Jantar', element: '3.3.90.39.01', unitValue: 25, quantity: 0, total: 0, isAuto: true, freqType: 'jantares' },
  { id: 'lanche', description: 'Lanches', element: '3.3.90.30.01', unitValue: 10, quantity: 0, total: 0, isAuto: true, freqType: 'lanches' },
  { id: 'agua', description: 'Água Mineral 20L', element: '3.3.90.30.01', unitValue: 16, quantity: 1, total: 16, isAuto: false },
  { id: 'biscoito', description: 'Biscoito / Bolacha', element: '3.3.90.30.01', unitValue: 5, quantity: 5, total: 25, isAuto: false },
  { id: 'suco', description: 'Suco - Polpa KG', element: '3.3.90.30.01', unitValue: 0, quantity: 0, total: 0, isAuto: false },
  { id: 'cafe', description: 'Café KG', element: '3.3.90.30.01', unitValue: 10, quantity: 1, total: 10, isAuto: false },
  { id: 'acucar', description: 'Açúcar KG', element: '3.3.90.30.01', unitValue: 4, quantity: 4, total: 16, isAuto: false },
  { id: 'descartaveis', description: 'Descartáveis', element: '3.3.90.30.01', unitValue: 10, quantity: 1, total: 10, isAuto: false },
  { id: 'material', description: 'Material de Expediente', element: '3.3.90.30.01', unitValue: 0, quantity: 0, total: 0, isAuto: false },
  { id: 'combustivel', description: 'Combustível', element: '3.3.90.30.02', unitValue: 0, quantity: 0, total: 0, isAuto: false },
  { id: 'xerox', description: 'Foto Cópia (Xerox)', element: '3.3.90.39.01', unitValue: 0, quantity: 0, total: 0, isAuto: false },
  { id: 'som', description: 'Serviço de Som', element: '3.3.90.39.01', unitValue: 0, quantity: 0, total: 0, isAuto: false },
  { id: 'locacao', description: 'Locação de Equipamentos Diversos', element: '3.3.90.39.01', unitValue: 0, quantity: 0, total: 0, isAuto: false },
  { id: 'outros', description: 'Outros (Especificar)', element: '3.3.90.30.01', unitValue: 0, quantity: 0, total: 0, isAuto: false },
];

export const SupridoDashboard: React.FC<{ forceView?: string | null; onInternalViewChange?: () => void }> = ({ forceView, onInternalViewChange }) => {
  const { showToast } = useToast();
  const [currentView, setCurrentView] = useState<SupridoView>('DASHBOARD');
  const [subView, setSubView] = useState<SubViewMode>('DETAILS');
  const [selectedProcess, setSelectedProcess] = useState<any>(null);
  const [wizardStep, setWizardStep] = useState(1);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  
  // Estados para Paginação e Filtros
  const [currentPage, setCurrentPage] = useState(1);
  const [historyFilter, setHistoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const itemsPerPage = 5;

  // Estados para Confirmação de Recebimento
  const [pendingConfirmations, setPendingConfirmations] = useState<any[]>([]);
  const [isConfirmingReceipt, setIsConfirmingReceipt] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Estados para Prestação de Contas
  const [pendingPC, setPendingPC] = useState<any[]>([]);

  // Buscar usuário atual e processos pendentes de confirmação
  useEffect(() => {
    const fetchPendingConfirmations = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('🔍 [SupridoDashboard] Current user:', user?.id);
      if (!user) {
        console.warn('⚠️ [SupridoDashboard] No user logged in');
        return;
      }
      setCurrentUserId(user.id);

      // Primeiro buscar TODOS os processos com status AWAITING_SUPRIDO_CONFIRMATION para debug
      const { data: allPending, error: allError } = await supabase
        .from('solicitacoes')
        .select('id, nup, valor_total, data_credito, user_id, status_workflow')
        .eq('status_workflow', 'AWAITING_SUPRIDO_CONFIRMATION');
      
      console.log('📋 [SupridoDashboard] ALL pending confirmations:', allPending);
      console.log('📋 [SupridoDashboard] Query error:', allError);

      // Agora buscar apenas os do usuário atual
      const { data, error } = await supabase
        .from('solicitacoes')
        .select('id, nup, valor_total, data_credito')
        .eq('user_id', user.id)
        .eq('status_workflow', 'AWAITING_SUPRIDO_CONFIRMATION');
      
      console.log('👤 [SupridoDashboard] User pending confirmations:', data);
      console.log('👤 [SupridoDashboard] User query error:', error);

      if (!error && data) {
        setPendingConfirmations(data);
      } else if (allPending && allPending.length > 0) {
        // Fallback: mostrar todos os pendentes se o filtro por user_id falhar
        console.log('ℹ️ [SupridoDashboard] Using fallback - showing all pending');
        setPendingConfirmations(allPending);
      }
    };
    fetchPendingConfirmations();

    // Buscar processos aguardando prestação de contas
    const fetchPendingPC = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('solicitacoes')
        .select('id, nup, valor_solicitado, valor_aprovado, data_fim, prazo_prestacao, portaria_sf_numero')
        .eq('user_id', user.id)
        .eq('status_workflow', 'AWAITING_ACCOUNTABILITY');
      
      console.log('📋 [SupridoDashboard] Pending PC query error:', error);

      console.log('📋 [SupridoDashboard] Pending PC:', data);
      if (!error && data) {
        setPendingPC(data);
      }
    };
    fetchPendingPC();
  }, [currentView]); // Refetch when view changes (e.g., returning to dashboard)

  // Handler para confirmar recebimento
  const handleConfirmReceipt = async (processId: string) => {
    setIsConfirmingReceipt(true);
    try {
      // Buscar data_fim do evento para calcular prazo conforme Art. 4° da Portaria
      const { data: solicitacao } = await supabase
        .from('solicitacoes')
        .select('data_fim, nup')
        .eq('id', processId)
        .single();

      // Prazo = data_fim do evento + 7 dias (Art. 4° da Portaria)
      let prazoDate: Date;
      if (solicitacao?.data_fim) {
        prazoDate = new Date(new Date(solicitacao.data_fim).getTime() + 7 * 24 * 60 * 60 * 1000);
      } else {
        // Fallback: 30 dias a partir de hoje se não houver data_fim
        prazoDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        console.warn('[SupridoDashboard] Sem data_fim, usando fallback de 30 dias');
      }
      
      await supabase.from('solicitacoes').update({
        status_workflow: 'AWAITING_ACCOUNTABILITY',
        data_confirmacao_recebimento: new Date().toISOString(),
        prazo_prestacao: prazoDate.toISOString(),
        updated_at: new Date().toISOString()
      }).eq('id', processId);

      // Registrar no histórico com prazo correto
      const prazoFormatado = prazoDate.toLocaleDateString('pt-BR');
      await supabase.from('historico_tramitacao').insert({
        solicitacao_id: processId,
        origem: 'SUPRIDO',
        destino: 'PRESTAÇÃO DE CONTAS',
        status_anterior: 'AWAITING_SUPRIDO_CONFIRMATION',
        status_novo: 'AWAITING_ACCOUNTABILITY',
        observacao: `Suprido confirmou recebimento. Prazo para prestação de contas: ${prazoFormatado} (data fim evento + 7 dias, Art. 4°).`,
        created_at: new Date().toISOString()
      });


      // Remover da lista de pendentes de confirmação
      setPendingConfirmations(prev => prev.filter(p => p.id !== processId));

      // IMPORTANTE: Adicionar à lista de pendentes de Prestação de Contas
      // para que o banner apareça imediatamente
      const confirmedProcess = pendingConfirmations.find(p => p.id === processId);
      if (confirmedProcess) {
        setPendingPC(prev => [...prev, {
          ...confirmedProcess,
          prazo_prestacao: prazoDate.toISOString()
        }]);
      }

      showToast({
        title: 'Recebimento Confirmado!',
        message: `Prazo para prestação de contas: ${prazoDate.toLocaleDateString('pt-BR')}`,
        type: 'success'
      });
    } catch (error: any) {
      console.error('Error confirming receipt:', error);
      showToast({
        title: 'Erro ao confirmar',
        message: error.message || 'Tente novamente',
        type: 'error'
      });
    } finally {
      setIsConfirmingReceipt(false);
    }
  };


  const [profileData] = useState({
    nome: 'Ademário Silva De Jesus',
    cpf: '793.050.832-32',
    matricula: '10001',
    email: 'suprido@tjpa.jus.br',
    telefone: '91982188691',
    cargo: 'Técnico Judiciário',
    lotacao: 'Central De Mandados Da Comarca De Mãe Do Rio',
    municipio: 'Mãe Do Rio',
    banco: 'Banpará',
    bancoCod: '037',
    agencia: '0026',
    conta: '1212-1',
    gestorNome: 'Diogo Bonfim Fernandez',
    gestorEmail: 'chefe@tjpa.jus.br'
  });

  const [requestHistory, setRequestHistory] = useState<any[]>([]);

  // Buscar histórico de solicitações do usuário logado
  useEffect(() => {
    const fetchRequestHistory = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('solicitacoes')
        .select('id, nup, tipo, descricao, created_at, valor_solicitado, valor_aprovado, status, status_workflow, data_fim, prazo_prestacao, portaria_sf_numero')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [SupridoDashboard] Error fetching solicitações:', error);
        return;
      }

      console.log('📋 [SupridoDashboard] Solicitações carregadas:', data?.length);

      // Map database columns to display format
      const mappedData = (data || []).map(s => {
        // Map status_workflow to Portuguese display status
        const getDisplayStatus = (statusWorkflow: string | null, status: string | null): string => {
          if (statusWorkflow === 'AWAITING_ACCOUNTABILITY') return 'PRESTANDO CONTAS';
          if (statusWorkflow === 'ACCOUNTABILITY_OPEN') return 'PRESTANDO CONTAS';
          if (statusWorkflow === 'PC_DRAFT' || statusWorkflow === 'PC_SUBMITTED') return 'PRESTANDO CONTAS';
          if (statusWorkflow === 'AWAITING_SUPRIDO_CONFIRMATION') return 'AGUARDANDO CONFIRMAÇÃO';
          if (statusWorkflow === 'SIGNED_BY_SEFIN') return 'ASSINADO SEFIN';
          if (statusWorkflow === 'WAITING_SEFIN') return 'AGUARDANDO SEFIN';
          if (status === 'APROVADO') return 'CONCEDIDO';
          if (status === 'PENDENTE') return 'PENDENTE';
          if (status === 'RASCUNHO') return 'RASCUNHO';
          return status || 'PENDENTE';
        };

        return {
          id: s.id,
          nup: s.nup,
          type: s.tipo?.toUpperCase() || 'EXTRA-EMERGENCIAL',
          desc: s.descricao || 'Solicitação de suprimento de fundos',
          date: new Date(s.created_at).toLocaleDateString('pt-BR'),
          val: s.valor_aprovado || s.valor_solicitado || 0,
          status: getDisplayStatus(s.status_workflow, s.status),
          status_workflow: s.status_workflow,
          data_fim: s.data_fim,
          prazo_prestacao: s.prazo_prestacao,
          portaria_sf_numero: s.portaria_sf_numero,
          valor_aprovado: s.valor_aprovado,
          valor_solicitado: s.valor_solicitado
        };
      });

      setRequestHistory(mappedData);
    };

    fetchRequestHistory();
  }, [currentView]); // Refetch when returning to dashboard

  const filteredHistory = requestHistory.filter(req => {
    const matchesSearch = req.nup.toLowerCase().includes(historyFilter.toLowerCase()) || 
                          req.desc.toLowerCase().includes(historyFilter.toLowerCase());
    const matchesStatus = statusFilter === 'TODOS' || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const currentItems = filteredHistory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const [formState, setFormState] = useState<FormState>({
    nup: 'TJPA-SOL-2026-0001',
    type: 'Extra-Emergencial',
    startDate: '2026-01-20',
    endDate: '2026-01-22',
    desc: 'Requerimento de suprimento de fundos para custeio de despesas com alimentação durante Sessão do Tribunal do Júri.',
    urgency: 'Normal',
    items: [{ id: '1', element: '3.3.90.30.02', desc: '', qty: 1, val: 120 }],
    managerName: '',
    managerEmail: '',
    isSelfManager: false,
    juriParticipants: { servidores: 0, reus: 0, jurados: 0, testemunhas: 0, defensor: 0, promotor: 0, policias: 0 },
    juriComarca: 'Mãe do Rio',
    juriProcessNumber: '0002451-76.2025.8.14.0900',
    juriMealFreq: { almocos: 1, jantares: 0, lanches: 1 },
    juriDays: 3,
    juriProjectionItems: DEFAULT_JURI_ITEMS
  });

  useEffect(() => {
    if (forceView) {
      setCurrentView(forceView as SupridoView);
      if (onInternalViewChange) onInternalViewChange();
    }
  }, [forceView, onInternalViewChange]);

  // Cálculo Automático de Dias e Itens do Júri
  useEffect(() => {
    if (formState.type === 'Sessão de Júri') {
      // Calcular Dias
      const start = new Date(formState.startDate);
      const end = new Date(formState.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
      
      const safeDays = isNaN(diffDays) ? 1 : diffDays;

      // Calcular Total Participantes
      const totalParticipants = (Object.values(formState.juriParticipants) as number[]).reduce((a, b) => a + b, 0);

      const updatedProjection = formState.juriProjectionItems.map(item => {
        if (!item.isAuto) return item;
        
        let freq = 0;
        if (item.freqType === 'almocos') freq = formState.juriMealFreq.almocos;
        if (item.freqType === 'jantares') freq = formState.juriMealFreq.jantares;
        if (item.freqType === 'lanches') freq = formState.juriMealFreq.lanches;
        
        const qty = totalParticipants * freq * safeDays;
        return { ...item, quantity: qty, total: qty * item.unitValue };
      });

      setFormState(prev => ({ 
          ...prev, 
          juriDays: safeDays,
          juriProjectionItems: updatedProjection 
      }));
    }
  }, [formState.juriParticipants, formState.juriMealFreq, formState.startDate, formState.endDate, formState.type]);

  useEffect(() => {
    if (formState.isSelfManager) {
      setFormState(prev => ({
        ...prev,
        managerName: profileData.nome,
        managerEmail: profileData.email
      }));
    } else {
      setFormState(prev => ({
        ...prev,
        managerName: profileData.gestorNome,
        managerEmail: profileData.gestorEmail
      }));
    }
  }, [formState.isSelfManager, profileData]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const addItem = () => {
    const newItem: FormItem = { id: Date.now().toString(), element: '3.3.90.30.01', desc: '', qty: 1, val: 0 };
    setFormState(prev => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const removeItem = (id: string) => {
    setFormState(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }));
  };

  const updateItem = (id: string, field: keyof FormItem, value: any) => {
    setFormState(prev => ({
      ...prev,
      items: prev.items.map(i => {
        if (i.id !== id) return i;
        
        const updated = { ...i, [field]: value };
        
        // Detect if element is PF (3.3.90.36) and calculate taxes
        if (field === 'element') {
          updated.isPFService = isPFElement(value);
          if (updated.isPFService && !updated.providerData) {
            updated.providerData = {};
          }
          if (updated.isPFService && updated.val > 0) {
            updated.taxes = calculateTaxes(updated.val);
          }
        }
        
        // Recalculate taxes when value changes for PF items
        if (field === 'val' && updated.isPFService) {
          updated.taxes = calculateTaxes(value);
        }
        
        return updated;
      })
    }));
  };

  // Update provider data for a PF service item
  const updateItemProvider = (id: string, providerData: Partial<ServiceProviderData>) => {
    setFormState(prev => ({
      ...prev,
      items: prev.items.map(i => i.id === id ? { ...i, providerData } : i)
    }));
  };

  const handleAiJustification = () => {
    setIsGeneratingAi(true);
    setTimeout(() => {
      const text = `REQUERIMENTO DE SUPRIMENTO EXTRAORDINÁRIO - SESSÃO DE JÚRI\n\nSenhor(a) Ordenador(a) de Despesas,\n\nVenho, por meio desta, solicitar a autorização para liberação de Suprimento de Fundos Extraordinário, no valor de R$ ${formatCurrency(formState.juriProjectionItems.reduce((acc, i) => acc + i.total, 0))}, destinado à realização de Sessão de Júri Popular na Comarca de ${formState.juriComarca}, referente ao Processo nº ${formState.juriProcessNumber}.\n\nO evento está programado para o período de ${new Date(formState.startDate).toLocaleDateString('pt-BR')} a ${new Date(formState.endDate).toLocaleDateString('pt-BR')}, totalizando ${formState.juriDays} dia(s) de sessão. As despesas solicitadas visam garantir a alimentação adequada e demais necessidades de ${(Object.values(formState.juriParticipants) as number[]).reduce((a, b) => a + b, 0)} participantes, distribuídos da seguinte forma: ${formState.juriParticipants.servidores} Servidores do Fórum, ${formState.juriParticipants.reus} Réus, ${formState.juriParticipants.jurados} Jurados, ${formState.juriParticipants.testemunhas} Testemunhas, ${formState.juriParticipants.defensor} Defensores Públicos, ${formState.juriParticipants.promotor} Promotores, ${formState.juriParticipants.policias} Policiais.`;
      setFormState(prev => ({ ...prev, desc: text }));
      setIsGeneratingAi(false);
      setShowAiModal(false);
    }, 1500);
  };

  const handleCreateRequest = () => {
    let totalVal = 0;
    if (formState.type === 'Extra-Emergencial') {
       totalVal = formState.items.reduce((acc, item) => acc + item.val, 0);
    } else {
       totalVal = formState.juriProjectionItems.reduce((acc, item) => acc + item.total, 0);
    }

    const newReq = {
        id: String(Date.now()),
        nup: `TJPA-SOL-2026-${Math.floor(Math.random() * 9000) + 1000}`,
        type: formState.type.toUpperCase(),
        desc: formState.desc.length > 50 ? formState.desc.substring(0, 50) + '...' : formState.desc,
        date: new Date().toLocaleDateString('pt-BR'),
        val: totalVal,
        status: 'PENDENTE'
    };
    
    setRequestHistory(prev => [newReq, ...prev]);
    alert('Solicitação Criada com Sucesso! Acompanhe no painel.');
    setCurrentView('DASHBOARD');
  };

  const renderDashboard = () => (
    <div className="p-10 max-w-[1400px] mx-auto space-y-16 animate-in fade-in pb-32">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Meu Painel de Suprido</h1>
           <p className="text-slate-500 text-sm font-medium mt-1 flex items-center gap-2 italic">
              <Info size={14} className="text-blue-500" /> Gerencie suas solicitações e acompanhe o fluxo processual.
           </p>
        </div>
        <button onClick={() => setCurrentView('SELECT_TYPE')} className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-[24px] text-sm font-black hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all hover:-translate-y-1 active:scale-95">
          <PlusCircle size={22} /> Nova Solicitação
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: 'SALDO DISPONÍVEL', val: 'R$ 4.500,00', sub: '2 ADIANTAMENTOS ATIVOS', icon: Wallet },
          { label: 'A PRESTAR CONTAS', val: 'R$ 12.500,00', sub: 'PRAZO: 15 DIAS RESTANTES', icon: Clock },
          { label: 'STATUS GERAL', val: 'Regular', sub: 'SEM PENDÊNCIAS IMPEDITIVAS', icon: CheckCircle2, border: true },
        ].map((kpi, i) => (
          <div key={i} className={`bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex flex-col justify-between h-48 group transition-all hover:shadow-xl ${kpi.border ? 'border-l-[12px] border-l-emerald-400' : ''}`}>
             <div className="flex justify-between items-start">
                <div className="p-4 bg-slate-50 text-slate-400 rounded-2xl group-hover:text-blue-600 transition-all"><kpi.icon size={28} /></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{kpi.label}</span>
             </div>
             <div>
                <h3 className="text-4xl font-black text-slate-800 tracking-tighter leading-none">{kpi.val}</h3>
                <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase">{kpi.sub}</p>
             </div>
          </div>
        ))}
      </div>

      {/* === CONFIRMATION PENDING BANNER === */}
      {pendingConfirmations.length > 0 && pendingConfirmations.map(process => (
        <div key={process.id} className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-[32px] p-6 shadow-xl animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center animate-pulse">
                <BadgeCheck size={28} className="text-white" />
              </div>
              <div className="text-white">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-100">🔔 Confirmação Pendente</p>
                <h3 className="text-xl font-black">{process.nup}</h3>
                <p className="text-sm text-amber-100">
                  Valor creditado: <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(process.valor_total || 0)}</strong>
                  {process.data_credito && ` • Data: ${new Date(process.data_credito).toLocaleDateString('pt-BR')}`}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleConfirmReceipt(process.id)}
              disabled={isConfirmingReceipt}
              className="flex items-center gap-2 px-6 py-3 bg-white text-amber-700 rounded-xl font-black text-sm hover:bg-amber-50 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConfirmingReceipt ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  Confirmando...
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  Confirmar Recebimento
                </>
              )}
            </button>
          </div>
        </div>
      ))}

      {/* === BATCH NOTIFICATION BANNER === */}

      {/* === PRESTAÇÃO DE CONTAS PENDING BANNER === */}
      {pendingPC.length > 0 && pendingPC.map(process => {
        const prazoDias = process.prazo_prestacao 
          ? Math.ceil((new Date(process.prazo_prestacao).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : null;
        const isUrgent = prazoDias !== null && prazoDias <= 3;
        
        return (
          <div 
            key={process.id} 
            className={`rounded-[32px] p-6 shadow-xl animate-in slide-in-from-top-2 ${
              isUrgent 
                ? 'bg-gradient-to-r from-red-500 to-rose-600' 
                : 'bg-gradient-to-r from-purple-500 to-indigo-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  <ClipboardCheck size={28} className="text-white" />
                </div>
                <div className="text-white">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/70">
                    {isUrgent ? '🚨 Prestação Urgente' : '📋 Prestação de Contas Pendente'}
                  </p>
                  <h3 className="text-xl font-black">{process.nup}</h3>
                  <p className="text-sm text-white/80">
                    Valor: <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(process.valor_aprovado || process.valor_solicitado || 0)}</strong>
                    {prazoDias !== null && (
                      <> • {prazoDias > 0 ? `Prazo: ${prazoDias} dia(s)` : 'Prazo vencido!'}</>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedProcess(process);
                  setCurrentView('PRESTACAO_CONTAS');
                }}
                className="flex items-center gap-2 px-6 py-3 bg-white text-purple-700 rounded-xl font-black text-sm hover:bg-purple-50 transition-colors shadow-lg"
              >
                <ClipboardCheck size={18} />
                Prestar Contas
              </button>
            </div>
          </div>
        );
      })}

      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-[32px] p-6 shadow-xl animate-in slide-in-from-top-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
              <Wallet size={28} className="text-white" />
            </div>
            <div className="text-white">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-100">🎉 Recurso Creditado</p>
              <h3 className="text-xl font-black">Suprimento Ordinário - 1º Quadrimestre/2026</h3>
              <p className="text-sm text-emerald-100">Valor disponível para execução: <strong>R$ 16.000,00</strong></p>
            </div>
          </div>
          <button
            onClick={() => setCurrentView('PROCESS_DETAILS')}
            className="flex items-center gap-2 px-6 py-3 bg-white text-emerald-700 rounded-xl font-black text-sm hover:bg-emerald-50 transition-colors shadow-lg"
          >
            <Eye size={18} />
            Ver Detalhes
          </button>
        </div>
      </div>

      <div className="bg-[#0f172a] rounded-[56px] shadow-2xl overflow-hidden relative group">
        <div className="px-12 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex items-center gap-6 text-white">
              <div className="w-16 h-16 bg-blue-600/20 text-blue-400 rounded-3xl flex items-center justify-center shadow-inner ring-1 ring-white/10"><HistoryIcon size={32} /></div>
              <div><h2 className="text-2xl font-black uppercase tracking-tight">Histórico de Solicitações</h2><p className="text-slate-400 text-xs font-bold uppercase opacity-60 tracking-widest">Gestão de Processos</p></div>
           </div>
           
           {/* Filters Toolbar */}
           <div className="flex items-center gap-3 bg-slate-800/50 p-2 rounded-2xl border border-white/5 backdrop-blur-sm">
              <div className="relative group/search">
                  <Search className="absolute left-4 top-3 text-slate-500 group-focus-within/search:text-blue-400 transition-colors" size={16} />
                  <input 
                      type="text" 
                      placeholder="Buscar NUP ou objeto..." 
                      className="pl-12 pr-6 py-3 bg-slate-900/50 border border-transparent focus:border-blue-500/50 rounded-xl text-sm font-bold text-white placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all w-64"
                      value={historyFilter}
                      onChange={(e) => setHistoryFilter(e.target.value)}
                  />
              </div>
              <div className="h-8 w-px bg-white/10 mx-1"></div>
              <select 
                  className="bg-slate-900/50 text-white text-xs font-bold py-3 pl-4 pr-10 rounded-xl border border-transparent hover:bg-slate-800 focus:outline-none appearance-none cursor-pointer"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
              >
                  <option value="TODOS">Todos os Status</option>
                  <option value="PENDENTE">Pendente</option>
                  <option value="CONCEDIDO">Concedido</option>
                  <option value="RASCUNHO">Rascunho</option>
                  <option value="ARQUIVADO">Arquivado</option>
              </select>
           </div>
        </div>

        <div className="bg-[#f8fafc] mx-2 mb-2 rounded-[52px] p-8 min-h-[600px] flex flex-col relative">
           {/* Decorative Top Shadow/Gradient */}
           <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black/5 to-transparent rounded-t-[52px] pointer-events-none"></div>

           <div className="flex-1 space-y-3">
              {currentItems.length > 0 ? currentItems.map((p) => (
                <div key={p.id} onClick={() => { setSelectedProcess(p); setCurrentView('VIEW_DETAILS'); setSubView('DETAILS'); }} className={`group relative bg-white p-5 rounded-[28px] border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer overflow-hidden ${p.origin === 'AUTOMATIC' ? 'border-l-[6px] border-l-purple-500' : 'border-slate-100'}`}>
                    {/* Hover Accent */}
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="flex items-center gap-6">
                        {/* Icon Box */}
                        <div className={`w-16 h-16 rounded-[20px] flex items-center justify-center shrink-0 transition-colors ${
                            p.type === 'SESSÃO DE JÚRI' ? 'bg-amber-50 text-amber-600 group-hover:bg-amber-100' : 
                            p.type === 'ORDINÁRIO' ? 'bg-purple-50 text-purple-600 group-hover:bg-purple-100' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100'
                        }`}>
                            {p.type === 'SESSÃO DE JÚRI' ? <Gavel size={28} strokeWidth={1.5} /> : p.type === 'ORDINÁRIO' ? <Building2 size={28} strokeWidth={1.5}/> : <Zap size={28} strokeWidth={1.5} />}
                        </div>

                        {/* Main Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                                <h3 className="text-base font-black text-slate-800 tracking-tight truncate">{p.nup}</h3>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${p.origin === 'AUTOMATIC' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-400'}`}>{p.type}</span>
                            </div>
                            <p className="text-xs font-medium text-slate-500 truncate pr-4">{p.desc}</p>
                        </div>

                        {/* Date & Value */}
                        <div className="text-right px-4 border-l border-slate-100 hidden md:block">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{p.origin === 'AUTOMATIC' ? 'Recebido em' : 'Solicitado em'}</p>
                            <div className="flex items-center justify-end gap-2 text-slate-700 font-bold text-sm">
                                <Calendar size={14} className="text-slate-400"/> {p.date}
                            </div>
                        </div>

                        <div className="text-right px-4 border-l border-slate-100 hidden md:block w-32">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Valor</p>
                            <p className="text-base font-black text-slate-900">{formatCurrency(p.val)}</p>
                        </div>

                        {/* Status & Action */}
                        <div className="pl-2">
                            <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-colors ${
                                 p.status === 'CONCEDIDO' ? 'bg-emerald-100 text-emerald-700' :
                                 p.status === 'PENDENTE' ? 'bg-amber-100 text-amber-700' :
                                 p.status === 'RASCUNHO' ? 'bg-slate-100 text-slate-600' :
                                 p.status === 'A PRESTAR CONTAS' ? 'bg-blue-100 text-blue-700' :
                                 'bg-blue-50 text-blue-600'
                            }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${
                                    p.status === 'CONCEDIDO' ? 'bg-emerald-500' :
                                    p.status === 'PENDENTE' ? 'bg-amber-500' :
                                    p.status === 'A PRESTAR CONTAS' ? 'bg-blue-500' :
                                    'bg-slate-400'
                                }`}></div>
                                {p.status}
                            </span>
                            
                            {/* Botão de Prestar Contas quando status apropriado */}
                            {(p.status === 'PRESTANDO CONTAS' || p.status === 'A PRESTAR CONTAS') && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent card click
                                  setSelectedProcess(p);
                                  setCurrentView('PRESTACAO_CONTAS');
                                }}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-black rounded-xl flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
                              >
                                <ClipboardCheck size={14} />
                                PRESTAR CONTAS
                              </button>
                            )}
                        </div>
                        
                        <div className="text-slate-300 group-hover:text-blue-600 transition-colors">
                            <ChevronRight size={24} />
                        </div>
                    </div>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center h-full py-20 text-slate-400 opacity-60">
                    <FileSearchIcon size={64} strokeWidth={1} />
                    <p className="mt-4 font-bold text-sm uppercase tracking-widest">Nenhum registro encontrado</p>
                </div>
              )}
           </div>

           {/* Barra de Paginação */}
           <div className="flex items-center justify-between pt-8 border-t border-slate-100 mt-auto">
              <div className="flex items-center gap-2">
                 <button 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-blue-600 hover:border-blue-200 disabled:opacity-30 disabled:pointer-events-none transition-all"
                 >
                   <ChevronLeft size={20} />
                 </button>
                 <div className="flex items-center gap-1.5 px-4">
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button 
                        key={i} 
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${currentPage === i + 1 ? 'bg-blue-600 text-white shadow-lg' : 'bg-white border border-slate-100 text-slate-400 hover:bg-slate-50'}`}
                      >
                        {i + 1}
                      </button>
                    ))}
                 </div>
                 <button 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-blue-600 hover:border-blue-200 disabled:opacity-30 disabled:pointer-events-none transition-all"
                 >
                   <ChevronRight size={20} />
                 </button>
              </div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Página {currentPage} de {totalPages}
              </div>
           </div>
        </div>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="p-10 max-w-[1400px] mx-auto space-y-8 animate-in fade-in pb-32">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">Dados Cadastrais</h1>
          <p className="text-slate-500 text-sm font-medium mt-3 flex items-center gap-2 italic">
            <Info size={14} className="text-blue-500" /> Mantenha seus dados sempre atualizados para emissão de documentos.
          </p>
        </div>
        <button onClick={() => setCurrentView('DASHBOARD')} className="flex items-center gap-2 px-8 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 shadow-sm transition-all">
          <ArrowLeft size={16} /> Voltar ao Painel
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Status & Photo */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex flex-col items-center text-center">
             {/* Photo */}
             <div className="relative mb-6">
               <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Ademario" className="w-48 h-48 rounded-[40px] border-4 border-white shadow-2xl bg-blue-50" />
               <button className="absolute bottom-2 right-2 p-3 bg-slate-900 text-white rounded-2xl shadow-lg border-2 border-white hover:bg-blue-600 transition-colors">
                  <Upload size={18} />
               </button>
             </div>
             <h3 className="text-lg font-black text-slate-800">{profileData.nome}</h3>
             <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{profileData.cargo}</p>
          </div>
          
          <div className="bg-blue-600 p-10 rounded-[40px] text-white shadow-2xl shadow-blue-200 relative overflow-hidden group">
            <div className="flex items-center gap-4 mb-6"><div className="p-3 bg-white/20 rounded-2xl"><ShieldCheck size={24}/></div><h4 className="text-xs font-black uppercase tracking-widest">Status Cadastral</h4></div>
            <h3 className="text-3xl font-black tracking-tight mb-2">Regular</h3>
            <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Última Validação: 15/12/2025</p>
          </div>
        </div>

        {/* Right Column: Forms */}
        <div className="lg:col-span-8 space-y-8">
          {/* Personal Info */}
          <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm space-y-8">
             <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                <div className="p-3 bg-slate-100 text-slate-600 rounded-2xl"><UserCircle size={24}/></div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Informações Pessoais</h3>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CPF</label>
                   <div className="relative">
                      <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input type="text" readOnly value={profileData.cpf} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Matrícula</label>
                   <div className="relative">
                      <BadgeCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input type="text" readOnly value={profileData.matricula} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                   </div>
                </div>
                <div className="col-span-2 space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Institucional</label>
                   <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Send size={16} /></div>
                      <input type="text" readOnly value={profileData.email} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                   </div>
                </div>
                <div className="col-span-2 space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lotação</label>
                   <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input type="text" readOnly value={profileData.lotacao} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                   </div>
                </div>
             </div>
          </div>

          {/* Banking Info */}
          <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm space-y-8">
             <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Wallet size={24}/></div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Dados Bancários</h3>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Banco</label>
                   <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input type="text" readOnly value={profileData.banco} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Agência</label>
                   <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input type="text" readOnly value={profileData.agencia} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Conta Corrente</label>
                   <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input type="text" readOnly value={profileData.conta} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                   </div>
                </div>
             </div>
          </div>

          {/* Manager Info */}
          <div className="bg-slate-900 p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
             <div className="relative z-10 flex items-center justify-between">
                <div>
                   <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Chefia Imediata</h4>
                   <h3 className="text-xl font-bold">{profileData.gestorNome}</h3>
                   <p className="text-sm text-slate-400 mt-1">{profileData.gestorEmail}</p>
                </div>
                <div className="p-4 bg-white/10 rounded-2xl"><UserCheck size={24}/></div>
             </div>
          </div>

          <button onClick={() => { alert('Solicitação de atualização enviada para SGP!'); setCurrentView('DASHBOARD'); }} className="w-full py-6 bg-blue-600 text-white rounded-[32px] font-black uppercase text-xs tracking-widest hover:bg-blue-700 shadow-2xl shadow-blue-100 transition-all flex items-center justify-center gap-3">
             <RefreshCw size={20}/> Solicitar Atualização Cadastral
          </button>
        </div>
      </div>
    </div>
  );

  const renderSelectType = () => (
    <div className="p-10 max-w-[1000px] mx-auto space-y-16 animate-in fade-in">
      <div className="flex items-center gap-6">
        <button onClick={() => setCurrentView('DASHBOARD')} className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-blue-600 transition-all shadow-sm"><ArrowLeft size={28} /></button>
        <div><h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">Nova Solicitação</h1><p className="text-slate-500 text-sm font-medium mt-2">Selecione a modalidade de suprimento para iniciar o processo digital.</p></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {[
          { id: 'Extra-Emergencial', title: 'Extra-Emergencial', icon: HistoryIcon, bg: 'bg-blue-50', color: 'text-blue-600', desc: 'Despesas imprevisíveis e inadiáveis que não podem aguardar o fluxo normal.' },
          { id: 'Sessão de Júri', title: 'Sessão de Júri', icon: Gavel, bg: 'bg-amber-50', color: 'text-amber-600', desc: 'Suprimento específico para alimentação e logística de sessões do tribunal do júri.' }
        ].map(type => (
          <button key={type.id} onClick={() => { setFormState({...formState, type: type.title}); setCurrentView('FORM'); setWizardStep(1); }} className="group bg-white p-12 rounded-[56px] border border-slate-200 shadow-sm hover:shadow-2xl hover:border-blue-400 transition-all text-left flex flex-col justify-between h-[400px]">
            <div className={`p-8 ${type.bg} ${type.color} rounded-[32px] w-fit group-hover:scale-110 transition-transform`}><type.icon size={48} /></div>
            <div><h3 className="text-3xl font-black text-slate-800 uppercase tracking-tight leading-none mb-4">{type.title}</h3><p className="text-sm font-medium text-slate-400 leading-relaxed">{type.desc}</p></div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderForm = () => {
    if (formState.type === 'Extra-Emergencial') {
       const totalAmount = formState.items.reduce((acc, item) => acc + item.val, 0);
       return (
        <div className="p-8 max-w-[1200px] mx-auto animate-in fade-in pb-32">
          {/* Header com Botão Voltar */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <FileIcon className="text-blue-600" size={32} />
              <div>
                 <h1 className="text-xl font-bold text-slate-900">Nova Solicitação de Suprimento Extraordinário</h1>
                 <p className="text-slate-500 text-sm">Preencha os dados para criar sua solicitação</p>
              </div>
            </div>
            <button onClick={() => setCurrentView('SELECT_TYPE')} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 shadow-sm transition-all">
              <ArrowLeft size={16} /> Voltar
            </button>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm space-y-8">
             <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                <button onClick={() => setCurrentView('DASHBOARD')} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50 transition-all">
                   Cancelar
                </button>
                <button onClick={handleCreateRequest} className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-md transition-all flex items-center gap-2">
                   <Plus size={16} /> Criar Solicitação
                </button>
             </div>
          </div>
        </div>
       );
    }
    // Wizard Juri Logic...
    return <div>Wizard Juri Placeholder (Use existing code)</div>;
  };

  const renderProcessDetails = () => {
    const isTimeline = subView === 'TIMELINE';
    const isAutomatic = selectedProcess?.origin === 'AUTOMATIC';
    const isPrestacaoContas = selectedProcess?.status === 'PRESTANDO CONTAS' || 
                              selectedProcess?.status === 'A PRESTAR CONTAS' ||
                              selectedProcess?.status_workflow === 'AWAITING_ACCOUNTABILITY' ||
                              selectedProcess?.status_workflow === 'ACCOUNTABILITY_OPEN';

    return (
    <div className="p-10 max-w-[1200px] mx-auto animate-in fade-in pb-32 space-y-8">
       {/* Alert for Automatic Process */}
       {isAutomatic && (
           <div className="bg-purple-50 border border-purple-200 p-6 rounded-2xl flex items-start gap-4 mb-6">
               <Lock className="text-purple-600 shrink-0 mt-1" size={24} />
               <div>
                   <h3 className="text-sm font-black text-purple-800 uppercase tracking-wide">Processo Gerado Automaticamente (SOSFU)</h3>
                   <p className="text-xs text-purple-700 mt-1 leading-relaxed">
                       Este suprimento ordinário faz parte da programação quadrimestral. Os valores e itens foram definidos pela área técnica. 
                       Você não pode alterar a solicitação, apenas anexar comprovantes e realizar a Prestação de Contas.
                   </p>
               </div>
           </div>
       )}

       <div className="flex justify-between items-start">
           <div className="flex items-center gap-6">
              <button 
                onClick={() => isTimeline ? setSubView('DETAILS') : setCurrentView('DASHBOARD')} 
                className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-blue-600 transition-all shadow-sm"
              >
                <ArrowLeft size={28} />
              </button>
              <div>
                 <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
                    {isTimeline ? 'Rastreamento' : 'Detalhes do Processo'}
                 </p>
                 <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{selectedProcess?.nup}</h1>
              </div>
           </div>
           <div className="flex items-center gap-3">
              <button className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-blue-600 transition-all shadow-sm"><Printer size={20} /></button>
              {!isTimeline && (
                  <button 
                    onClick={() => setSubView('TIMELINE')}
                    className="px-6 py-4 bg-blue-50 text-blue-600 rounded-2xl text-xs font-black uppercase tracking-widest border border-blue-100 flex items-center gap-2 hover:bg-blue-100 transition-all"
                  >
                    <FileSearchIcon size={16} /> Acompanhar Fluxo
                  </button>
              )}
           </div>
       </div>

       {isTimeline ? (
           <div className="bg-white p-12 rounded-[40px] border border-slate-200 shadow-sm animate-in slide-in-from-right-8 duration-500">
               {/* Timeline Content (Same as before) */}
               <div className="text-center text-slate-400">Timeline View</div>
           </div>
       ) : (
           <>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Status Atual</p>
                     <div className={`text-2xl font-black uppercase ${
                        selectedProcess?.status === 'CONCEDIDO' ? 'text-emerald-600' : 
                        selectedProcess?.status === 'PENDENTE' ? 'text-amber-600' : 
                        selectedProcess?.status === 'A PRESTAR CONTAS' ? 'text-blue-600' :
                        'text-slate-600'
                     }`}>
                        {selectedProcess?.status}
                     </div>
                  </div>
                  <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Valor Total</p>
                     <div className="text-2xl font-black text-slate-800">{selectedProcess ? formatCurrency(selectedProcess.val) : '-'}</div>
                  </div>
                  <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Data {isAutomatic ? 'Recebimento' : 'Solicitação'}</p>
                     <div className="text-2xl font-black text-slate-800">{selectedProcess?.date}</div>
                  </div>
               </div>

               <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm space-y-8">
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Resumo da Solicitação</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo</label>
                        <p className="text-lg font-bold text-slate-800">{selectedProcess?.type}</p>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição</label>
                        <p className="text-sm font-medium text-slate-600 leading-relaxed">{selectedProcess?.desc}</p>
                     </div>
                  </div>
                  
                  {(isAutomatic || isPrestacaoContas) && (
                      <div className="mt-8 pt-8 border-t border-slate-100 flex justify-end">
                          <button 
                            className="px-8 py-4 bg-purple-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-purple-200 hover:bg-purple-700 transition-all flex items-center gap-3"
                            onClick={() => setCurrentView('PRESTACAO_CONTAS')}
                          >
                              <ClipboardCheck size={18}/> Iniciar Prestação de Contas
                          </button>
                      </div>
                  )}
               </div>
           </>
       )}
    </div>
  );
  };

  return (
    <div className="h-full bg-[#f8fafc] overflow-y-auto custom-scrollbar overflow-x-hidden">
      {currentView === 'DASHBOARD' && renderDashboard()}
      {currentView === 'SELECT_TYPE' && renderSelectType()}
      {currentView === 'FORM' && renderForm()}
      {currentView === 'PROFILE' && renderProfile()}
      {currentView === 'VIEW_DETAILS' && renderProcessDetails()}
      {currentView === 'PRESTACAO_CONTAS' && selectedProcess && (
        <PrestacaoContasWizard
          solicitacaoId={selectedProcess.id}
          processData={{
            nup: selectedProcess.nup || selectedProcess.protocolNumber,
            valorConcedido: selectedProcess.valor_aprovado || selectedProcess.valor_solicitado || selectedProcess.value,
            supridoNome: selectedProcess.suprido_nome || selectedProcess.interestedParty || 'Suprido',
            dataFim: selectedProcess.data_fim,
            prazoPrestacao: selectedProcess.prazo_prestacao,
            portariaNumero: selectedProcess.portaria_sf_numero || selectedProcess.portaria_numero
          }}
          onClose={() => {
            setCurrentView('DASHBOARD');
            setSelectedProcess(null);
          }}
          onSuccess={() => {
            setCurrentView('DASHBOARD');
            setSelectedProcess(null);
          }}
        />
      )}
    </div>
  );
};
