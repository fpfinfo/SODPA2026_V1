import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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
  // Fix: Added missing icons
  BookOpen,
  Zap,
  ShieldCheck,
  Calculator,
  Upload,
  Users,
  Scale,
  Calendar,
  Save,
  Trash2,
  Loader2,
  CreditCard,
  UserCheck,
  Building2,
  Search,
  Gavel,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { DocumentCreationWizard } from '../DocumentCreationWizard';
import { TramitarModal } from '../TramitarModal';
import { TimelineHistory } from '../TimelineHistory';

const BRASAO_TJPA_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/217479058_brasao-tjpa.png';

type SupridoView = 'DASHBOARD' | 'SELECT_TYPE' | 'FORM' | 'VIEW_DETAILS' | 'EDIT_DRAFT' | 'PROFILE' | 'EDIT_FORM';
type SubViewMode = 'DETAILS' | 'COVER' | 'REQUEST' | 'HISTORY' | 'DOSSIER' | 'TIMELINE' | 'EDIT_DOC' | 'VIEW_DOC';

interface FormItem {
  id: string;
  desc: string;
  qty: number;
  val: number;
  element: string;
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

// Fallback estático caso a busca falhe
const FALLBACK_EXPENSE_ELEMENTS = [
  { code: '3.3.90.30.01', label: 'Material de Consumo' },
  { code: '3.3.90.30.02', label: 'Combustível' },
  { code: '3.3.90.33', label: 'Passagens e Despesas com Locomoção' },
  { code: '3.3.90.36', label: 'Outros Serv. Terceiros - Pessoa Física' },
  { code: '3.3.90.39', label: 'Outros Serv. Terceiros - Pessoa Jurídica' },
];

const DEFAULT_JURI_ITEMS: ProjectionItem[] = [
  { id: 'almoco', description: 'Refeição - Almoço', element: '3.3.90.39.01', unitValue: 30, quantity: 0, total: 0, isAuto: true, freqType: 'almocos' },
  { id: 'jantar', description: 'Refeição - Jantar', element: '3.3.90.39.01', unitValue: 25, quantity: 0, total: 0, isAuto: true, freqType: 'jantares' },
  { id: 'lanche', description: 'Lanches', element: '3.3.90.30.01', unitValue: 10, quantity: 0, total: 0, isAuto: true, freqType: 'lanches' },
  { id: 'agua', description: 'Água Mineral 20L', element: '3.3.90.30.01', unitValue: 0, quantity: 0, total: 0, isAuto: false },
  { id: 'biscoito', description: 'Biscoito / Bolacha', element: '3.3.90.30.01', unitValue: 0, quantity: 0, total: 0, isAuto: false },
  { id: 'suco', description: 'Suco - Polpa KG', element: '3.3.90.30.01', unitValue: 0, quantity: 0, total: 0, isAuto: false },
  { id: 'cafe', description: 'Café KG', element: '3.3.90.30.01', unitValue: 0, quantity: 0, total: 0, isAuto: false },
  { id: 'acucar', description: 'Açúcar KG', element: '3.3.90.30.01', unitValue: 0, quantity: 0, total: 0, isAuto: false },
  { id: 'descartaveis', description: 'Descartáveis', element: '3.3.90.30.01', unitValue: 0, quantity: 0, total: 0, isAuto: false },
  { id: 'material', description: 'Material de Expediente', element: '3.3.90.30.01', unitValue: 0, quantity: 0, total: 0, isAuto: false },
  { id: 'combustivel', description: 'Combustível', element: '3.3.90.30.02', unitValue: 0, quantity: 0, total: 0, isAuto: false },
  { id: 'xerox', description: 'Foto Cópia (Xerox)', element: '3.3.90.39.01', unitValue: 0, quantity: 0, total: 0, isAuto: false },
  { id: 'som', description: 'Serviço de Som', element: '3.3.90.39.01', unitValue: 0, quantity: 0, total: 0, isAuto: false },
  { id: 'locacao', description: 'Locação de Equipamentos Diversos', element: '3.3.90.39.01', unitValue: 0, quantity: 0, total: 0, isAuto: false },
  { id: 'outros', description: 'Outros (Especificar)', element: '3.3.90.30.01', unitValue: 0, quantity: 0, total: 0, isAuto: false },
];

interface SupridoDashboardProps {
  forceView: string | null;
  onInternalViewChange: () => void;
  onProfileUpdate?: () => void;
}

export const SupridoDashboard: React.FC<SupridoDashboardProps> = ({ forceView, onInternalViewChange, onProfileUpdate }) => {
  const [currentView, setCurrentView] = useState<SupridoView>('DASHBOARD');
  const [subView, setSubView] = useState<SubViewMode>('DETAILS');
  const [selectedProcess, setSelectedProcess] = useState<any>(null);
  const [wizardStep, setWizardStep] = useState(1);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [profileTab, setProfileTab] = useState<'DADOS' | 'DOCS'>('DADOS');
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showDocumentWizard, setShowDocumentWizard] = useState(false);
  
  // Estados para Paginação e Filtros
  const [currentPage, setCurrentPage] = useState(1);
  const [historyFilter, setHistoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const itemsPerPage = 5;

  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [dossierDocs, setDossierDocs] = useState<any[]>([]);
  const [selectedPreviewDoc, setSelectedPreviewDoc] = useState<any>(null);
  
  // Document CRUD state
  const [editingDoc, setEditingDoc] = useState<any>(null);
  const [deleteConfirmDocId, setDeleteConfirmDocId] = useState<string | null>(null);
  const [editDocContent, setEditDocContent] = useState('');
  const [editDocTitle, setEditDocTitle] = useState('');
  const [isSavingDoc, setIsSavingDoc] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [expenseElements, setExpenseElements] = useState<{code: string; label: string}[]>(FALLBACK_EXPENSE_ELEMENTS);
  
  // Dynamic Jury Configuration from Supabase
  const [juriLimits, setJuriLimits] = useState({
    participantes: { servidores: 7, defensor: 2, promotor: 2, policias: 5 },
    refeicoes: { almoco: 30, jantar: 25, lanche: 10 }
  });

  // Notification for limit exceeded
  const [showLimitExceededAlert, setShowLimitExceededAlert] = useState(false);
  const [limitExceededType, setLimitExceededType] = useState<'participante' | 'refeicao'>('participante');

  // Tramitar Modal state
  const [showTramitarModal, setShowTramitarModal] = useState(false);
  
  // Tramitacao History state (for audit log)
  const [tramitacaoHistory, setTramitacaoHistory] = useState<any[]>([]);
  const [lastDevolutionReason, setLastDevolutionReason] = useState<string | null>(null);
  
  // Edit mode for returned processes - Suprido can edit when true, blocks after resubmit
  const [isInEditMode, setIsInEditMode] = useState(false);
  
  // Fetch tramitacao history for process
  const fetchTramitacaoHistory = async (processId: string) => {
    if (!processId) return;
    try {
      const { data, error } = await supabase
        .from('historico_tramitacao')
        .select('*')
        .eq('solicitacao_id', processId)
        .order('data_tramitacao', { ascending: false });
      
      if (error) {
        console.error('Error fetching tramitacao history:', error);
        return;
      }
      
      if (data) {
        setTramitacaoHistory(data);
        // Check for last devolution reason
        const lastDevolution = data.find((h: any) => h.status_novo === 'DEVOLVIDO');
        if (lastDevolution?.observacao) {
          setLastDevolutionReason(lastDevolution.observacao);
        } else {
          setLastDevolutionReason(null);
        }
      }
    } catch (err) {
      console.error('Error in fetchTramitacaoHistory:', err);
    }
  };
  
  // KPI States - calculated from history data
  const kpiData = useMemo(() => {
    // Calculate values based on solicitações history
    const aprovadas = history.filter((s: any) => s.status === 'CONCEDIDO' || s.status === 'PRESTANDO CONTAS');
    const pendentes = history.filter((s: any) => s.status === 'PENDENTE' || s.status === 'PENDENTE ANÁLISE' || s.status === 'PENDENTE ATESTO');
    const prestando = history.filter((s: any) => s.status === 'PRESTANDO CONTAS');
    const rascunhos = history.filter((s: any) => s.status === 'RASCUNHO');
    
    // Saldo Disponível: Sum of approved values
    const saldoDisponivel = aprovadas.reduce((acc: number, s: any) => acc + (s.value || 0), 0);
    
    // A Prestar Contas: Sum of values in 'PRESTANDO CONTAS' status
    const aPrestarContas = prestando.reduce((acc: number, s: any) => acc + (s.value || 0), 0);
    
    // Adiantamentos Ativos
    const adiantamentosAtivos = aprovadas.length;
    
    // Dias restantes (simulated - 30 days from last approval, or 30 if none)
    const diasRestantes = prestando.length > 0 ? 30 : 0;
    
    // Pendências
    const pendencias = pendentes.length + rascunhos.length;
    
    return {
      saldoDisponivel,
      aPrestarContas,
      adiantamentosAtivos,
      diasRestantes,
      pendencias,
      statusGeral: pendencias === 0 ? 'Regular' : `${pendencias} Pendência${pendencias > 1 ? 's' : ''}`
    };
  }, [history]);

  const handleExportPdf = async () => {
    const container = document.getElementById('pdf-content-container');
    if (!container) {
      alert('Erro: Container de documentos não encontrado.');
      return;
    }

    setIsGeneratingPdf(true);
    try {
      const pages = container.querySelectorAll('.print-page');
      if (pages.length === 0) {
        alert('Erro: Nenhum documento encontrado para exportar.');
        setIsGeneratingPdf(false);
        return;
      }

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i] as HTMLElement;
        
        // Temporarily reset zoom transform if any
        const originalTransform = page.parentElement?.style.transform || '';
        if (page.parentElement) {
          page.parentElement.style.transform = 'none';
        }

        const canvas = await html2canvas(page, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: page.scrollWidth,
          windowHeight: page.scrollHeight
        });

        // Restore transform
        if (page.parentElement) {
          page.parentElement.style.transform = originalTransform;
        }

        const imgData = canvas.toDataURL('image/jpeg', 0.9);
        const imgWidth = pdfWidth;
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;

        // Scale to fit page if needed
        const scaleFactor = imgHeight > pdfHeight ? pdfHeight / imgHeight : 1;
        const finalWidth = imgWidth * scaleFactor;
        const finalHeight = imgHeight * scaleFactor;
        
        // Center on page
        const xOffset = (pdfWidth - finalWidth) / 2;
        const yOffset = (pdfHeight - finalHeight) / 2;

        if (i > 0) {
          pdf.addPage();
        }
        pdf.addImage(imgData, 'JPEG', xOffset, yOffset, finalWidth, finalHeight);
      }

      // Generate filename
      const filename = selectedProcess?.nup 
        ? `${selectedProcess.nup.replace(/[^a-zA-Z0-9-_]/g, '_')}.pdf`
        : `Documento_${new Date().toISOString().slice(0, 10)}.pdf`;

      // Use blob for better compatibility
      const pdfBlob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up blob URL after a delay
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Erro ao gerar PDF: ' + (error as Error).message);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const fetchDossierDocs = async (processId: string) => {
    if (!processId) return;
    const { data } = await supabase.from('documentos').select('*').eq('solicitacao_id', processId).order('created_at', { ascending: true });
    if (data) setDossierDocs(data);
  };

  // Document CRUD Handlers
  const handleOpenEditDoc = (doc: any) => {
    setEditingDoc(doc);
    setEditDocTitle(doc.nome || '');
    setEditDocContent(doc.conteudo || '');
  };

  const handleSaveDocEdit = async () => {
    if (!editingDoc) return;
    setIsSavingDoc(true);
    try {
      const { error } = await supabase.from('documentos').update({
        nome: editDocTitle,
        conteudo: editDocContent,
        updated_at: new Date().toISOString()
      }).eq('id', editingDoc.id);
      
      if (error) throw error;
      
      // Refresh dossier docs using the document's solicitacao_id
      const processId = editingDoc.solicitacao_id || selectedProcess?.id;
      if (processId) {
        await fetchDossierDocs(processId);
      }
      setEditingDoc(null);
      alert('Documento atualizado com sucesso!');
    } catch (e) {
      console.error('Error updating document:', e);
      alert('Erro ao atualizar documento.');
    } finally {
      setIsSavingDoc(false);
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    try {
      // First, get the document to know its solicitacao_id
      const { data: docData } = await supabase.from('documentos').select('solicitacao_id').eq('id', docId).single();
      const processId = docData?.solicitacao_id || selectedProcess?.id;
      
      const { error } = await supabase.from('documentos').delete().eq('id', docId);
      if (error) throw error;
      
      // Refresh dossier docs
      if (processId) {
        await fetchDossierDocs(processId);
      }
      setDeleteConfirmDocId(null);
      alert('Documento excluído com sucesso!');
    } catch (e) {
      console.error('Error deleting document:', e);
      alert('Erro ao excluir documento.');
    }
  };

  // Effect to handle external view changes (e.g. from TopBar)
  useEffect(() => {
    if (forceView) {
      setCurrentView(forceView as SupridoView);
      // Reset the forceView prop in parent to avoid stuck state
      if (onInternalViewChange) {
        onInternalViewChange();
      }
    }
  }, [forceView, onInternalViewChange]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      // 1. Fetch Profile
      try {
        const { data: { user } } = await supabase.auth.getUser();
        let query = supabase.from('profiles').select('*');
        if (user) {
            query = query.eq('id', user.id);
        } else {
            // For testing/preview: fetch the seed user
            query = query.eq('id', '00000000-0000-0000-0000-000000000000');
        }

        const { data: profiles, error: profileError } = await query;
        
        if (profileError) throw profileError;

        const profile = profiles?.[0];
        
        if (profile) { 
            setProfileData({
                id: profile.id,
                role: profile.role,
                nome: profile.nome || 'Usuário Supabase',
                cpf: profile.cpf || '000.000.000-00',
                matricula: profile.matricula || '00000',
                email: profile.email || 'user@tjpa.jus.br',
                cargo: profile.cargo || 'Servidor',
                lotacao: profile.lotacao || 'Tribunal',
                municipio: 'Belém',
                banco: profile.banco || 'Banpará',
                bancoCod: '037',
                agencia: profile.agencia || '0001',
                conta: profile.conta_corrente || '0000-0',
                gestorNome: profile.gestor_nome || 'Gestor Responsável',
                gestorEmail: profile.gestor_email || 'gestor@tjpa.jus.br'
            });
        } else {
            throw new Error('No profile found');
        }
      } catch (error: any) {
        console.error("Error fetching profile:", error);
        setProfileData({
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
      }

       // 1.5 Fetch Expense Elements from Sistema Configurações
       try {
         const { data: elementos } = await supabase
           .from('elementos_despesa')
           .select('codigo, descricao')
           .eq('ativo', true)
           .order('codigo', { ascending: true });

         if (elementos && elementos.length > 0) {
           setExpenseElements(elementos.map(el => ({
             code: el.codigo,
             label: el.descricao || el.codigo
           })));
         }
       } catch (error) {
         console.error('Error fetching expense elements:', error);
         // Mantém o fallback
       }

       // 1.6 Fetch Jury Configuration Limits
       try {
         const { data: juriConfigData } = await supabase
           .from('sistema_configuracoes')
           .select('chave, valor')
           .in('chave', ['juri_limites_participantes', 'juri_valores_refeicoes']);
         
         if (juriConfigData && juriConfigData.length > 0) {
           const newLimits = { ...juriLimits };
           juriConfigData.forEach((cfg: any) => {
             if (cfg.chave === 'juri_limites_participantes') {
               newLimits.participantes = cfg.valor;
             } else if (cfg.chave === 'juri_valores_refeicoes') {
               newLimits.refeicoes = cfg.valor;
             }
           });
           setJuriLimits(newLimits);
         }
       } catch (error) {
         console.error('Error fetching jury config:', error);
       }

       // 2. Fetch History
      try {
        const { data: solicitacoes, error: historyError } = await supabase
            .from('solicitacoes')
            .select('*')
            .order('created_at', { ascending: false });

        if (historyError) throw historyError;

        if (solicitacoes && solicitacoes.length > 0) {
            const mappedHistory = solicitacoes.map((s: any) => ({
                id: s.id, 
                nup: s.nup || `TJPA-SOL-${s.id}`,
                type: s.tipo || 'Geral', 
                desc: s.descricao || 'Sem descrição', 
                date: new Date(s.created_at).toLocaleDateString('pt-BR'), 
                val: s.valor_total || s.valor_solicitado || 0,
                status: s.status || 'PENDENTE',
                items: s.itens_despesa || []
            }));
            setHistory(mappedHistory);
        } else {
            setHistory([]); 
        }
      } catch (error) {
        console.error("Error fetching history:", error);
        setHistory([
             { id: '1', nup: 'TJPA-SOL-00010-2026', type: 'SESSÃO DE JÚRI', desc: 'Solicitação para 3 dias de Júri Popular...', date: '25/01/2026', val: 1800, status: 'PENDENTE' },
             { id: '2', nup: 'TJPA-SOL-00009-2026', type: 'EXTRA-EMERGENCIAL', desc: 'Diligência urgente na Comarca de Mãe do Rio...', date: '22/01/2026', val: 450, status: 'CONCEDIDO' },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Refresh history function - can be called after save/submit
  const refreshHistory = async () => {
    try {
      const { data: solicitacoes, error: historyError } = await supabase
          .from('solicitacoes')
          .select('*')
          .order('created_at', { ascending: false });

      if (historyError) throw historyError;

      if (solicitacoes && solicitacoes.length > 0) {
          const mappedHistory = solicitacoes.map((s: any) => ({
              id: s.id, 
              nup: s.nup || `TJPA-SOL-${s.id}`,
              type: s.tipo || 'Geral', 
              desc: s.descricao || 'Sem descrição', 
              date: new Date(s.created_at).toLocaleDateString('pt-BR'), 
              val: s.valor_total || s.valor_solicitado || 0,
              status: s.status || 'PENDENTE',
              items: s.itens_despesa || []
          }));
          setHistory(mappedHistory);
      }
    } catch (error) {
      console.error("Error refreshing history:", error);
    }
  };

  useEffect(() => {
    if (subView === 'DOSSIER' && selectedProcess) {
        fetchDossierDocs(selectedProcess.id);
    }
    if (subView === 'HISTORY' && selectedProcess) {
        fetchTramitacaoHistory(selectedProcess.id);
    }
  }, [subView, selectedProcess]);
  
  // Also fetch tramitacao on process selection to get devolution reason
  useEffect(() => {
    if (selectedProcess) {
      fetchTramitacaoHistory(selectedProcess.id);
    }
  }, [selectedProcess]);

  const totalPages = Math.max(1, Math.ceil(history.length / itemsPerPage));
  const currentItems = history.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const [formState, setFormState] = useState<FormState>({
    nup: 'TJPA-SOL-2026-0001',
    type: 'Extra-Emergencial',
    startDate: '',
    endDate: '',
    desc: '',
    urgency: 'Normal',
    items: [],
    // Novos campos
    managerName: '',
    managerEmail: '',
    isSelfManager: false,
    juriParticipants: { servidores: 0, reus: 0, jurados: 0, testemunhas: 0, defensor: 0, promotor: 0, policias: 0 },
    juriComarca: 'Mãe do Rio',
    juriProcessNumber: '',
    juriMealFreq: { almocos: 1, jantares: 0, lanches: 1 },
    juriDays: 1,
    juriProjectionItems: DEFAULT_JURI_ITEMS
  });

  // Auto-populate manager fields from profile data
  useEffect(() => {
    if (profileData?.gestorNome || profileData?.gestorEmail) {
      setFormState(prev => ({
        ...prev,
        managerName: profileData.gestorNome || prev.managerName,
        managerEmail: profileData.gestorEmail || prev.managerEmail
      }));
    }
  }, [profileData?.gestorNome, profileData?.gestorEmail]);

  // Cálculo Automático de Dias e Itens do Júri
  useEffect(() => {
    if (formState.type === 'Sessão de Júri') {
      // Calcular Dias
      let safeDays = 1;
      if (formState.startDate && formState.endDate) {
          const start = new Date(formState.startDate);
          const end = new Date(formState.endDate);
          const diffTime = Math.abs(end.getTime() - start.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
          safeDays = isNaN(diffDays) ? 1 : diffDays;
      }

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

  // Update meal unit values when juriLimits config is loaded from DB
  useEffect(() => {
    setFormState(prev => ({
      ...prev,
      juriProjectionItems: prev.juriProjectionItems.map(item => {
        if (item.id === 'almoco') {
          return { ...item, unitValue: juriLimits.refeicoes.almoco, total: item.quantity * juriLimits.refeicoes.almoco };
        }
        if (item.id === 'jantar') {
          return { ...item, unitValue: juriLimits.refeicoes.jantar, total: item.quantity * juriLimits.refeicoes.jantar };
        }
        if (item.id === 'lanche') {
          return { ...item, unitValue: juriLimits.refeicoes.lanche, total: item.quantity * juriLimits.refeicoes.lanche };
        }
        return item;
      })
    }));
  }, [juriLimits.refeicoes]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Helper: Get element description from code
  const getElementDescription = (code: string, fallbackDesc?: string) => {
    const element = expenseElements.find(el => el.code === code);
    return element?.label || fallbackDesc || code || 'Item';
  };

  // Signature state for Jury form
  const [isJuriSigned, setIsJuriSigned] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handler: Save Draft
  const handleSaveJuriDraft = async () => {
    setIsSavingDraft(true);
    try {
      const totalValue = Math.round(formState.juriProjectionItems.reduce((acc, item) => acc + item.total, 0));
      const nupNumber = `TJPA-SOL-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      
      const { data, error } = await supabase.from('solicitacoes').insert([{
        user_id: profileData?.id,
        nup: nupNumber,
        tipo: 'Sessão de Júri',
        status: 'rascunho',
        valor_solicitado: totalValue,
        descricao: formState.desc,
        data_inicio: formState.startDate || null,
        data_fim: formState.endDate || null,
        urgencia: formState.urgency,
        juri_participantes: formState.juriParticipants,
        comarca_destino: formState.juriComarca,
        processo_judicial: formState.juriProcessNumber,
        juri_dias: formState.juriDays,
        juri_frequencia_refeicoes: formState.juriMealFreq,
        juri_projecao_custos: formState.juriProjectionItems
      }]).select();

      if (error) throw error;
      
      alert(`Rascunho salvo com sucesso! NUP: ${nupNumber}`);
      await refreshHistory();
      setCurrentView('DASHBOARD');
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Erro ao salvar rascunho: ' + (error as Error).message);
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Handler: Submit to Atesto
  const handleSubmitJuriToAtesto = async () => {
    if (!isJuriSigned) {
      alert('Por favor, assine a justificativa antes de enviar para atesto.');
      return;
    }
    if (!formState.desc.trim()) {
      alert('Por favor, preencha a justificativa antes de enviar.');
      return;
    }

    setIsSubmitting(true);
    try {
      const totalValue = Math.round(formState.juriProjectionItems.reduce((acc, item) => acc + item.total, 0));
      const nupNumber = `TJPA-SOL-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      
      const { data, error } = await supabase.from('solicitacoes').insert([{
        user_id: profileData?.id,
        nup: nupNumber,
        tipo: 'Sessão de Júri',
        status: 'pendente_atesto',
        valor_solicitado: totalValue,
        descricao: formState.desc,
        data_inicio: formState.startDate || null,
        data_fim: formState.endDate || null,
        urgencia: formState.urgency,
        juri_participantes: formState.juriParticipants,
        comarca_destino: formState.juriComarca,
        processo_judicial: formState.juriProcessNumber,
        juri_dias: formState.juriDays,
        juri_frequencia_refeicoes: formState.juriMealFreq,
        juri_projecao_custos: formState.juriProjectionItems
      }]).select();

      if (error) throw error;
      
      alert(`Solicitação enviada para atesto com sucesso! NUP: ${nupNumber}`);
      setCurrentView('DASHBOARD');
      await refreshHistory();
      // Reset form
      setWizardStep(1);
      setIsJuriSigned(false);
    } catch (error) {
      console.error('Error submitting:', error);
      alert('Erro ao enviar solicitação: ' + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAiJustification = () => {
    setIsGeneratingAi(true);
    setTimeout(() => {
      let text = '';
      
      // Check if we're editing an existing process or creating a new one
      const isEditMode = currentView === 'EDIT_FORM' && selectedProcess;
      const sourceData = isEditMode ? {
        type: selectedProcess.type,
        items: selectedProcess.items || [],
        startDate: selectedProcess.startDate,
        endDate: selectedProcess.endDate,
        val: selectedProcess.val
      } : formState;
      
      if (sourceData.type === 'Sessão de Júri' || sourceData.type === 'SESSÃO DE JÚRI') {
        // Júri form - use jury-specific data
        const total = formState.juriProjectionItems?.reduce((acc: number, item: any) => acc + item.total, 0) || sourceData.val || 0;
        text = `Solicito a concessão de suprimento de fundos para a Comarca de ${formState.juriComarca || '[NÃO INFORMADO]'}, visando atender a Sessão de Júri referente ao Processo Nº ${formState.juriProcessNumber || '[NÃO INFORMADO]'}. O dimensionamento contempla a alimentação para ${formState.juriParticipants ? (Object.values(formState.juriParticipants) as number[]).reduce((a,b)=>a+b,0) : 0} participantes, totalizando uma projeção estimada de ${formatCurrency(total)}. O período da missão compreende de ${sourceData.startDate || '[DATA INÍCIO]'} a ${sourceData.endDate || '[DATA FIM]'}.`;
      } else {
        // Extra-Emergencial form - use expense elements
        const items = sourceData.items || [];
        const itemsWithValue = items.filter((item: any) => (item.val || 0) > 0);
        const totalValue = items.reduce((acc: number, item: any) => acc + ((item.qty || 1) * (item.val || 0)), 0) || sourceData.val || 0;
        
        // Get element descriptions from the expenseElements list
        const elementDescriptions = itemsWithValue.map((item: any) => {
          const element = expenseElements.find(el => el.code === item.element);
          const itemTotal = (item.qty || 1) * (item.val || 0);
          return element ? `${element.label} (${formatCurrency(itemTotal)})` : `${item.element} (${formatCurrency(itemTotal)})`;
        }).join(', ');
        
        text = `Solicito a concessão de suprimento de fundos para atendimento de despesas extraordinárias/emergenciais no valor de ${formatCurrency(totalValue)}. Os recursos serão destinados para: ${elementDescriptions || '[NENHUM ELEMENTO SELECIONADO]'}. O período de aplicação compreende de ${sourceData.startDate || '[DATA INÍCIO]'} a ${sourceData.endDate || '[DATA FIM]'}.`;
      }
      
      // Update the correct state based on mode
      if (isEditMode) {
        setSelectedProcess((prev: any) => ({ ...prev, desc: text }));
      } else {
        setFormState(prev => ({ ...prev, desc: text }));
      }
      
      setIsGeneratingAi(false);
      setShowAiModal(false);
    }, 1500);
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
          { 
            label: 'SALDO DISPONÍVEL', 
            val: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(kpiData.saldoDisponivel), 
            sub: `${kpiData.adiantamentosAtivos} ADIANTAMENTO${kpiData.adiantamentosAtivos !== 1 ? 'S' : ''} ATIVO${kpiData.adiantamentosAtivos !== 1 ? 'S' : ''}`, 
            icon: Wallet 
          },
          { 
            label: 'A PRESTAR CONTAS', 
            val: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(kpiData.aPrestarContas), 
            sub: kpiData.diasRestantes > 0 ? `PRAZO: ${kpiData.diasRestantes} DIAS RESTANTES` : 'SEM PRESTAÇÕES PENDENTES', 
            icon: Clock 
          },
          { 
            label: 'STATUS GERAL', 
            val: kpiData.statusGeral, 
            sub: kpiData.pendencias === 0 ? 'SEM PENDÊNCIAS IMPEDITIVAS' : `${kpiData.pendencias} SOLICITAÇÕES PENDENTES`, 
            icon: CheckCircle2, 
            border: kpiData.pendencias === 0 
          },
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

      {/* Histórico de Solicitações - Premium Card Layout */}
      {(() => {
        // Filtered and paginated data
        const filteredHistory = history.filter((req: any) => {
          const matchesSearch = req.nup?.toLowerCase().includes(historyFilter.toLowerCase()) || 
                                req.object?.toLowerCase().includes(historyFilter.toLowerCase());
          const matchesStatus = statusFilter === 'TODOS' || req.status === statusFilter;
          return matchesSearch && matchesStatus;
        });
        const totalPages = Math.ceil(filteredHistory.length / itemsPerPage) || 1;
        const currentItems = filteredHistory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

        return (
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
                          onChange={(e) => { setHistoryFilter(e.target.value); setCurrentPage(1); }}
                      />
                  </div>
                  <div className="h-8 w-px bg-white/10 mx-1"></div>
                  <select 
                      className="bg-slate-900/50 text-white text-xs font-bold py-3 pl-4 pr-10 rounded-xl border border-transparent hover:bg-slate-800 focus:outline-none appearance-none cursor-pointer"
                      value={statusFilter}
                      onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  >
                      <option value="TODOS">Todos os Status</option>
                      <option value="PENDENTE">Pendente</option>
                      <option value="CONCEDIDO">Concedido</option>
                      <option value="PRESTANDO CONTAS">Prestando Contas</option>
                      <option value="RASCUNHO">Rascunho</option>
                      <option value="ARQUIVADO">Arquivado</option>
                  </select>
               </div>
            </div>

            <div className="bg-[#f8fafc] mx-2 mb-2 rounded-[52px] p-8 min-h-[600px] flex flex-col relative">
               {/* Decorative Top Shadow/Gradient */}
               <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black/5 to-transparent rounded-t-[52px] pointer-events-none"></div>

               <div className="flex-1 space-y-3">
                  {currentItems.length > 0 ? currentItems.map((p: any) => (
                    <div key={p.id} onClick={() => { setSelectedProcess(p); setCurrentView('VIEW_DETAILS'); setSubView('DETAILS'); }} className="group relative bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer overflow-hidden">
                        {/* Hover Accent */}
                        <div className="absolute left-0 top-0 bottom-0 w-2 bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        
                        <div className="flex items-center gap-6">
                            {/* Icon Box */}
                            <div className={`w-16 h-16 rounded-[20px] flex items-center justify-center shrink-0 transition-colors ${
                                p.type === 'SESSÃO DE JÚRI' ? 'bg-amber-50 text-amber-600 group-hover:bg-amber-100' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100'
                            }`}>
                                {p.type === 'SESSÃO DE JÚRI' ? <Scale size={28} strokeWidth={1.5} /> : <Zap size={28} strokeWidth={1.5} />}
                            </div>

                            {/* Main Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="text-base font-black text-slate-800 tracking-tight truncate">{p.nup}</h3>
                                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-wider">{p.type}</span>
                                </div>
                                <p className="text-xs font-medium text-slate-500 truncate pr-4">{p.object || p.desc || 'Sem descrição'}</p>
                            </div>

                            {/* Date & Value */}
                            <div className="text-right px-4 border-l border-slate-100 hidden md:block">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Solicitado em</p>
                                <div className="flex items-center justify-end gap-2 text-slate-700 font-bold text-sm">
                                    <Calendar size={14} className="text-slate-400"/> {p.date || new Date(p.created_at).toLocaleDateString('pt-BR')}
                                </div>
                            </div>

                            <div className="text-right px-4 border-l border-slate-100 hidden md:block w-32">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Valor</p>
                                <p className="text-base font-black text-slate-900">{formatCurrency(Math.round(p.val || 0))}</p>
                            </div>

                            {/* Status & Action */}
                            <div className="pl-2">
                                <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-colors ${
                                     p.status === 'CONCEDIDO' ? 'bg-emerald-100 text-emerald-700' :
                                     p.status === 'PENDENTE' ? 'bg-amber-100 text-amber-700' :
                                     p.status === 'RASCUNHO' ? 'bg-slate-100 text-slate-600' :
                                     p.status === 'PRESTANDO CONTAS' ? 'bg-purple-100 text-purple-700' :
                                     p.status === 'ARQUIVADO' ? 'bg-gray-100 text-gray-600' :
                                     'bg-blue-50 text-blue-600'
                                }`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${
                                        p.status === 'CONCEDIDO' ? 'bg-emerald-500' :
                                        p.status === 'PENDENTE' ? 'bg-amber-500' :
                                        p.status === 'PRESTANDO CONTAS' ? 'bg-purple-500' :
                                        'bg-slate-400'
                                    }`}></div>
                                    {p.status}
                                </span>
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
        );
      })()}
    </div>
  );

  const renderProcessDetails = () => {
    if (!selectedProcess) return null;
    const p = selectedProcess;

    return (
      <div className="flex h-full bg-[#f8fafc] overflow-hidden animate-in fade-in">
        <aside className="w-80 bg-white border-r border-slate-200 flex flex-col h-full shadow-sm z-10">
          <div className="p-8 border-b border-slate-100 bg-slate-50/50">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"><LayoutList size={14} /> Árvore do Processo</p>
             <div className="space-y-3">
                <button onClick={() => setSubView('DETAILS')} className={`w-full flex items-center gap-3 p-4 rounded-2xl text-xs font-bold transition-all ${subView === 'DETAILS' ? 'bg-blue-50 text-blue-600 shadow-sm border border-blue-100' : 'text-slate-400 hover:bg-slate-50'}`}><FileSearchIcon size={18} /> Detalhes do Processo</button>
                <button onClick={() => setSubView('COVER')} className={`w-full flex items-center gap-3 p-4 rounded-2xl text-xs font-bold transition-all ${subView === 'COVER' ? 'bg-blue-50 text-blue-600 shadow-sm border border-blue-100' : 'text-slate-400 hover:bg-slate-50'}`}><FileCode size={18} /> Capa do Processo</button>
                <button onClick={() => setSubView('REQUEST')} className={`w-full flex items-center gap-3 p-4 rounded-2xl text-xs font-bold transition-all ${subView === 'REQUEST' ? 'bg-blue-50 text-blue-600 shadow-sm border border-blue-100' : 'text-slate-400 hover:bg-slate-50'}`}><FileText size={18} /> Requerimento Inicial</button>
                <div className="h-px bg-slate-100 my-4"></div>
                <button onClick={() => setSubView('DOSSIER')} className={`w-full flex items-center gap-3 p-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${subView === 'DOSSIER' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}><BookOpen size={18}/> Dossiê Digital</button>
                <button onClick={() => setSubView('HISTORY')} className={`w-full flex items-center gap-3 p-4 rounded-2xl text-xs font-bold transition-all ${subView === 'HISTORY' ? 'bg-blue-50 text-blue-600 shadow-sm border border-blue-100' : 'text-slate-400 hover:bg-slate-50'}`}><HistoryIcon size={18}/> Histórico / Auditoria</button>
             </div>
          </div>
          <div className="p-8 mt-auto">
             <button onClick={() => setCurrentView('DASHBOARD')} className="w-full py-5 bg-slate-100 text-slate-600 rounded-3xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2"><ArrowLeft size={16} /> Voltar ao Painel</button>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-8 bg-[#f1f5f9]">
           <div className="bg-white/80 backdrop-blur-xl p-4 rounded-[32px] shadow-2xl border border-white flex flex-col md:flex-row items-center justify-between sticky top-0 z-[100] gap-4">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><Zap size={24} /></div>
                 <div>
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">SCS • {p.nup}</span>
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mt-1">Painel de Controle</h2>
                 </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 bg-slate-100/50 p-2 rounded-2xl border border-slate-200/50">
                 <button onClick={() => setSubView('DETAILS')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${subView === 'DETAILS' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}><FileSearchIcon size={14}/> Detalhes</button>
                 <button onClick={() => setShowDocumentWizard(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-white/50 transition-all"><Plus size={14}/> Novo</button>
                 <button onClick={() => setShowTramitarModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-white/50 transition-all"><ArrowUpRight size={14}/> Tramitar</button>
              </div>
           </div>

           {/* Devolution Alert Banner - shows ONLY when process status is actually DEVOLVIDO */}
           {selectedProcess?.status === 'DEVOLVIDO' && (
             <div className={`rounded-[32px] p-6 flex items-start gap-4 animate-in slide-in-from-top-4 duration-300 shadow-lg ${isInEditMode ? 'bg-amber-50 border-2 border-amber-300' : 'bg-red-50 border-2 border-red-300'}`}>
               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isInEditMode ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>
                 {isInEditMode ? <Edit size={24} /> : <AlertTriangle size={24} />}
               </div>
               <div className="flex-1">
                 <h4 className={`text-lg font-black uppercase tracking-tight ${isInEditMode ? 'text-amber-800' : 'text-red-800'}`}>
                   {isInEditMode ? 'Modo de Edição Ativo' : 'Processo Devolvido'}
                 </h4>
                 <p className={`text-sm font-medium mt-1 ${isInEditMode ? 'text-amber-700' : 'text-red-700'}`}>
                   {isInEditMode 
                     ? 'Você pode editar os dados da solicitação. Após concluir, clique em "Reencaminhar" para enviar novamente ao Gestor.'
                     : 'O Gestor devolveu este processo para correção. Verifique o motivo abaixo e faça os ajustes necessários.'}
                 </p>
                 {lastDevolutionReason && !isInEditMode && (
                   <div className="mt-4 p-4 bg-red-100 border border-red-200 rounded-xl">
                     <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Motivo da Devolução:</p>
                     <p className="text-sm font-bold text-red-900">{lastDevolutionReason}</p>
                   </div>
                 )}
               </div>
               <div className="flex flex-col gap-2">
                 {!isInEditMode ? (
                   <button 
                     onClick={() => {
                       setIsInEditMode(true);
                       setCurrentView('EDIT_FORM');
                     }}
                     className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-amber-700 shadow-lg transition-all"
                   >
                     <Edit size={16} /> Reabrir para Edição
                   </button>
                 ) : (
                   <>
                     <button 
                       onClick={() => {
                         setIsInEditMode(false);
                         setShowTramitarModal(true);
                       }}
                       className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 shadow-lg transition-all"
                     >
                       <Send size={16} /> Reencaminhar ao Gestor
                     </button>
                     <button 
                       onClick={() => setIsInEditMode(false)}
                       className="flex items-center gap-2 px-4 py-2 bg-white border border-amber-300 text-amber-700 rounded-xl text-xs font-bold hover:bg-amber-50 transition-all"
                     >
                       <X size={14} /> Cancelar Edição
                     </button>
                   </>
                 )}
               </div>
             </div>
           )}

           {subView === 'DETAILS' && (
             <div className="space-y-10 animate-in fade-in duration-500 pb-32">
                <div className="bg-[#0f172a] rounded-[48px] p-10 text-white shadow-2xl relative overflow-hidden group">
                   <div className="relative z-10">
                      <div className="flex items-center justify-between mb-12">
                         <div>
                            <h3 className="text-2xl font-black uppercase tracking-tight">Timeline do Processo</h3>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest opacity-60 mt-1">Status e evolução cronológica</p>
                         </div>
                         <div className="px-5 py-2 bg-blue-600/20 border border-blue-500/30 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Em análise</div>
                      </div>

                      <div className="relative pt-8 pb-12">
                         <div className="absolute top-[52px] left-0 w-full h-1 bg-slate-800 rounded-full"></div>
                         <div className="absolute top-[52px] left-0 w-1/4 h-1 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                         
                         <div className="relative flex justify-between">
                            {[
                               { label: 'Criação', date: '10/01', active: true, done: true, icon: Plus },
                               { label: 'Atesto', date: '---', active: true, done: false, icon: UserCircle },
                               { label: 'Auditoria', date: '---', active: false, done: false, icon: ShieldCheck },
                               { label: 'Empenho', date: '---', active: false, done: false, icon: Calculator },
                               { label: 'Pagamento', date: '---', active: false, done: false, icon: DollarSign }
                            ].map((step, i) => (
                               <div key={i} className="flex flex-col items-center gap-4 relative">
                                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-700 z-10 ${step.done ? 'bg-blue-600 text-white shadow-lg' : step.active ? 'bg-slate-800 text-blue-400 border-2 border-blue-500' : 'bg-slate-900 text-slate-600 border border-slate-800'}`}>
                                     <step.icon size={20} />
                                  </div>
                                  <div className="text-center">
                                     <p className={`text-[10px] font-black uppercase tracking-widest ${step.active ? 'text-white' : 'text-slate-600'}`}>{step.label}</p>
                                     <p className="text-[9px] font-bold text-slate-500 mt-1">{step.date}</p>
                                  </div>
                               </div>
                            ))}
                         </div>
                      </div>
                   </div>
                   <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000"><Clock size={240}/></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                   <div className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-sm space-y-8">
                      <div className="flex items-center gap-4 border-b border-slate-50 pb-6"><div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Info size={24}/></div><h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Informações Básicas</h3></div>
                      <div className="grid grid-cols-2 gap-8">
                         <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Protocolo</label><p className="text-lg font-black text-slate-800">{p.nup}</p></div>
                         <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo</label><p className="text-lg font-black text-slate-800 uppercase">{p.type}</p></div>
                         <div className="col-span-2 space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Interessado</label><p className="text-lg font-black text-slate-800 uppercase">{profileData.nome}</p></div>
                         <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor</label><p className="text-2xl font-black text-blue-600">{formatCurrency(p.val)}</p></div>
                         <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data Criação</label><p className="text-lg font-black text-slate-800">{p.date}</p></div>
                      </div>
                   </div>

                   <div className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-sm space-y-8">
                      <div className="flex items-center gap-4 border-b border-slate-50 pb-6"><div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><Edit size={24}/></div><h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Objeto e Finalidade</h3></div>
                      <p className="text-sm text-slate-500 font-medium leading-relaxed italic">"{p.desc}"</p>
                      <div className="pt-6 border-t border-slate-50">
                         <button className="flex items-center gap-2 text-xs font-black text-blue-600 uppercase tracking-widest hover:underline"><Edit size={14}/> Editar Justificativa</button>
                      </div>
                   </div>
                </div>
             </div>
           )}

           {subView === 'COVER' && (
             <div className="flex flex-col items-center py-10 animate-in zoom-in-95 duration-500">
                <div className="w-[800px] bg-white shadow-2xl rounded-sm p-24 flex flex-col items-center min-h-[1100px] relative border border-slate-200">
                   <img src={BRASAO_TJPA_URL} alt="Brasão" className="w-32 mb-12 opacity-90" />
                   <h1 className="text-2xl font-black tracking-[0.3em] uppercase text-slate-900 mb-2">Poder Judiciário</h1>
                   <p className="text-lg font-bold uppercase tracking-[0.2em] text-slate-500 mb-16 border-b-2 border-slate-100 pb-4">Tribunal de Justiça do Pará</p>
                   
                   <div className="w-full bg-slate-50 p-12 rounded-3xl border border-slate-100 text-center mb-16">
                      <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] mb-4">Número Único de Protocolo</h2>
                      <p className="text-6xl font-black text-slate-900 font-mono tracking-tighter">{p.nup}</p>
                   </div>

                   <div className="grid grid-cols-2 gap-12 w-full text-left border-t border-slate-100 pt-16 font-serif">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Interessado</label>
                         <p className="text-lg font-black text-slate-800 uppercase leading-none">{profileData.nome}</p>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Modalidade</label>
                         <p className="text-lg font-black text-slate-800 uppercase leading-none">{p.type}</p>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Matrícula</label>
                         <p className="text-lg font-black text-slate-800 uppercase leading-none">{profileData.matricula}</p>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Requisitado</label>
                         <p className="text-lg font-black text-blue-600 uppercase leading-none">{formatCurrency(p.val)}</p>
                      </div>
                   </div>
                </div>
             </div>
           )}

           {subView === 'REQUEST' && (
             <div className="flex flex-col items-center py-10 animate-in zoom-in-95 duration-500">
                <div className="w-[820px] bg-white shadow-2xl rounded-sm p-20 min-h-[1160px] flex flex-col text-[#000] font-sans relative border-t-8 border-slate-900">
                   {/* Institutional Header */}
                   <div className="text-center mb-16 space-y-2">
                      <img src={BRASAO_TJPA_URL} alt="Brasão TJPA" className="w-24 mx-auto mb-6 opacity-90" />
                      <h1 className="text-2xl font-bold tracking-tight uppercase">TRIBUNAL DE JUSTIÇA DO ESTADO DO PARÁ</h1>
                      <h2 className="text-lg font-medium text-slate-700">Solicitação de Suprimento de Fundos {p.type}</h2>
                      <h3 className="text-base font-black tracking-widest font-mono mt-4">NUP: {p.nup}</h3>
                   </div>


                   <div className="w-full h-px bg-slate-900/20 mb-12"></div>

                   {/* Section 1: Dados da Solicitação */}
                   <div className="space-y-6 mb-12">
                      <h4 className="text-base font-black uppercase tracking-tight border-l-4 border-slate-900 pl-4 bg-slate-50 py-2">1. DADOS DA SOLICITAÇÃO</h4>
                      <div className="grid grid-cols-1 gap-3 pl-5">
                         <p className="text-sm"><strong>Tipo:</strong> {p.type}</p>
                         <p className="text-sm"><strong>Data Início:</strong> {p.date || '30/01/2026'}</p>
                         <p className="text-sm"><strong>Data Fim:</strong> {p.date || '30/01/2026'}</p>
                         <p className="text-sm"><strong>Gestor:</strong> {profileData.gestorNome} ({profileData.gestorEmail})</p>
                      </div>
                   </div>

                   {/* Section 2: Justificativa */}
                   <div className="space-y-6 mb-12">
                      <h4 className="text-base font-black uppercase tracking-tight border-l-4 border-slate-900 pl-4 bg-slate-50 py-2">2. JUSTIFICATIVA</h4>
                      <div className="pl-5 text-sm leading-relaxed text-justify">
                         <p>Considerando a necessidade urgente de atender demandas emergenciais na Unidade no período de {p.date || '30/01/2026'}, solicita-se a liberação de suprimento de fundos extraordinário para cobertura de despesas inadiáveis, conforme previsto no Regulamento Interno do TJPA.</p>
                         <p className="mt-4 italic text-slate-600">"{p.desc}"</p>
                      </div>
                   </div>

                   {/* Section 3: Elementos de Despesa */}
                   <div className="space-y-6 mb-16">
                      <h4 className="text-base font-black uppercase tracking-tight border-l-4 border-slate-900 pl-4 bg-slate-50 py-2">3. ELEMENTOS DE DESPESA</h4>
                      <div className="overflow-hidden border border-slate-200 rounded-lg">
                         <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                               <tr>
                                  <th className="px-4 py-3 font-black uppercase">Código</th>
                                  <th className="px-4 py-3 font-black uppercase">Descrição</th>
                                  <th className="px-4 py-3 font-black uppercase text-center">Qtd</th>
                                  <th className="px-4 py-3 font-black uppercase text-right">Valor Unit.</th>
                                  <th className="px-4 py-3 font-black uppercase text-right">Valor Total</th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                               {p.items && p.items.length > 0 ? (
                                  p.items.map((item: any, idx: number) => (
                                     <tr key={idx}>
                                        <td className="px-4 py-3 font-mono">{item.element || item.codigo || '3.3.90.30'}</td>
                                        <td className="px-4 py-3">{getElementDescription(item.element || item.codigo || '', item.desc || item.descricao || item.description)}</td>
                                        <td className="px-4 py-3 text-center">{item.qty || item.quantity || 1}</td>
                                        <td className="px-4 py-3 text-right">{formatCurrency(item.val || item.unitValue || item.value || 0)}</td>
                                        <td className="px-4 py-3 text-right font-bold">{formatCurrency((item.qty || item.quantity || 1) * (item.val || item.unitValue || item.value || 0))}</td>
                                     </tr>
                                  ))
                               ) : (
                                  <tr>
                                     <td className="px-4 py-3 font-mono">3.3.90.30</td>
                                     <td className="px-4 py-3">Despesas Gerais</td>
                                     <td className="px-4 py-3 text-center">1</td>
                                     <td className="px-4 py-3 text-right">{formatCurrency(p.val)}</td>
                                     <td className="px-4 py-3 text-right font-bold">{formatCurrency(p.val)}</td>
                                  </tr>
                               )}
                               <tr className="bg-slate-50 font-black">
                                  <td colSpan={4} className="px-4 py-3 text-right uppercase tracking-widest text-slate-500">TOTAL:</td>
                                  <td className="px-4 py-3 text-right">{formatCurrency(p.items && p.items.length > 0 ? p.items.reduce((acc: number, item: any) => acc + ((item.qty || item.quantity || 1) * (item.val || item.unitValue || item.value || 0)), 0) : p.val)}</td>
                               </tr>
                            </tbody>
                         </table>
                      </div>
                   </div>

                   {/* Electronic Signatures */}
                   <div className="mt-auto space-y-6">
                      <div className="p-6 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
                         <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">ASSINATURAS ELETRÔNICAS:</h5>
                         <div className="flex items-center gap-3 text-[11px] font-medium text-slate-700">
                            <div className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-black text-[9px]">OK</div>
                            <p>ASSINADO ELETRONICAMENTE POR: <strong>{profileData.nome}</strong> ({profileData.cargo}) em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}. IP: 127.0.0.1</p>
                         </div>
                         <p className="text-[9px] text-slate-400 mt-4 leading-relaxed">
                            A autenticidade deste documento pode be conferida no sistema SISUP através do NUP {p.nup}.
                         </p>
                      </div>

                      <div className="text-center pt-8 border-t border-slate-100 text-[9px] text-slate-400 uppercase tracking-widest">
                         Documento gerado automaticamente pelo Sistema SISUP - TJPA <br/>
                         Data de geração: {new Date().toLocaleDateString('pt-BR')}, {new Date().toLocaleTimeString('pt-BR')}
                      </div>
                   </div>

                   {/* Watermark */}
                   <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none select-none">
                      <img src={BRASAO_TJPA_URL} className="w-[500px] grayscale" alt="TJPA Watermark" />
                   </div>
                </div>
             </div>
           )}

           {subView === 'HISTORY' && (
             <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-500 pb-32">
                <div className="bg-slate-900 rounded-[48px] p-10 text-white shadow-2xl flex items-center justify-between relative overflow-hidden group">
                   <div className="relative z-10">
                      <h3 className="text-3xl font-black tracking-tighter">Histórico de Tramitação</h3>
                      <p className="text-slate-400 text-sm font-medium mt-1">Audit log completo das alterações de estado.</p>
                   </div>
                   <button className="relative z-10 flex items-center gap-3 px-10 py-5 bg-white text-slate-900 rounded-[24px] text-[10px] font-black uppercase tracking-widest shadow-xl"><Printer size={18} /> Imprimir Relatório</button>
                   <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000"><HistoryIcon size={200}/></div>
                </div>

                <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
                   <TimelineHistory events={tramitacaoHistory} />
                </div>
             </div>
           )}

           {subView === 'DOSSIER' && (
             <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-500 pb-32">
                <div className="bg-[#0f172a] rounded-[48px] p-10 text-white shadow-2xl flex flex-col md:flex-row items-center justify-between relative overflow-hidden group gap-6">
                   <div className="relative z-10">
                      <h3 className="text-3xl font-black tracking-tighter">Inventário de Peças Processuais</h3>
                      <p className="text-slate-400 text-sm font-medium mt-1">Volume consolidado para auditoria e prestação de contas.</p>
                   </div>
                   <div className="relative z-10 flex items-center gap-4">
                      <button onClick={() => { setSelectedPreviewDoc(null); setShowPdfViewer(true); }} className="flex items-center gap-3 px-8 py-5 bg-white text-slate-900 rounded-[24px] text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 transition-all shadow-xl">
                         <FileSearchIcon size={18} />
                         Visualizar PDF Consolidado
                      </button>
                      <button onClick={() => {setIsExporting(true); setTimeout(()=>setIsExporting(false), 2000)}} className="flex items-center gap-3 px-8 py-5 bg-white text-slate-900 rounded-[24px] text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 transition-all shadow-xl">
                         {isExporting ? <RefreshCw size={18} className="animate-spin" /> : <FileDown size={18} />}
                         Exportar PDF Consolidado
                      </button>
                   </div>
                   <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-110 transition-transform duration-1000"><TableOfContents size={200}/></div>
                </div>

                <div className="space-y-6">
                   {/* Static Items + Dynamic Items */}
                   {[
                      { id: '1', num: '01', title: 'Capa do Processo', desc: 'Identificação oficial do protocolo e metadados estruturais.', icon: FileCode, type: 'STATIC_CAPA' },
                      { id: '2', num: '02', title: 'Requerimento Inicial', desc: 'Justificativa e plano de aplicação assinado digitalmente.', icon: FileText, type: 'STATIC_REQ' },
                      { id: '3', num: '03', title: 'Certidão de Regularidade', desc: 'Validação automática de adimplência do suprido.', icon: BadgeCheck, type: 'STATIC_CERT' },
                      ...dossierDocs.map((doc, idx) => ({
                          id: doc.id,
                          num: (idx + 4).toString().padStart(2, '0'),
                          title: doc.nome || 'Documento Anexo',
                          desc: `Documento do tipo ${doc.tipo} - Status: ${doc.status}`,
                          icon: FileText,
                          type: 'DYNAMIC',
                          originalDoc: doc
                      }))
                   ].map((item) => (
                      <div key={item.id} className="group flex items-center gap-8 bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm hover:shadow-2xl hover:border-blue-200 transition-all cursor-pointer">
                         <div className="w-20 h-20 bg-slate-50 rounded-3xl flex flex-col items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                            <span className="text-[10px] font-black uppercase opacity-40 mb-1">Fls.</span>
                            <span className="text-2xl font-black">{item.num}</span>
                         </div>
                         <div className="flex-1">
                            <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight leading-none mb-2">{item.title}</h4>
                            <p className="text-xs text-slate-400 font-medium">{item.desc}</p>
                         </div>
                         <button onClick={() => {
                             setSelectedPreviewDoc(item);
                             setShowPdfViewer(true);
                         }} className="p-4 bg-slate-50 text-slate-300 rounded-2xl group-hover:bg-blue-50 group-hover:text-blue-600 transition-all" title="Visualizar"><Eye size={24}/></button>
                         
                         {/* Edit/Delete buttons for DYNAMIC docs only */}
                         {item.type === 'DYNAMIC' && (item as any).originalDoc && (
                           <>
                             <button 
                               onClick={(e) => {
                                 e.stopPropagation();
                                 handleOpenEditDoc((item as any).originalDoc);
                               }} 
                               className="p-4 bg-slate-50 text-slate-300 rounded-2xl hover:bg-amber-50 hover:text-amber-600 transition-all" 
                               title="Editar"
                             >
                               <Edit size={24}/>
                             </button>
                             <button 
                               onClick={(e) => {
                                 e.stopPropagation();
                                 setDeleteConfirmDocId((item as any).originalDoc.id);
                               }} 
                               className="p-4 bg-slate-50 text-slate-300 rounded-2xl hover:bg-red-50 hover:text-red-600 transition-all" 
                               title="Excluir"
                             >
                               <Trash2 size={24}/>
                             </button>
                           </>
                         )}
                      </div>
                   ))}
                </div>

                {/* Simulated Institutional PDF Viewer Modal */}
                {showPdfViewer && (
                  <div id="pdf-modal-wrapper" className="fixed inset-0 z-[300] flex items-center justify-center p-6 md:p-10">
                    <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl no-print" onClick={() => setShowPdfViewer(false)}></div>
                    <div className="relative bg-[#333] w-full h-full rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95" id="pdf-print-root">
                      <div className="p-4 bg-[#2a2a2a] border-b border-white/5 flex items-center justify-between shadow-2xl no-print">
                         <div className="flex items-center gap-4">
                            <div className="p-2 bg-red-600 text-white rounded-lg shadow-lg"><FileIcon size={18}/></div>
                            <div>
                               <h3 className="text-sm font-bold text-white uppercase tracking-tight">{selectedPreviewDoc?.title || `Consolidado_${p.nup}.pdf`}</h3>
                               <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">SISUP - Tribunal de Justiça do Pará</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-2">
                            <div className="flex items-center bg-black/40 rounded-lg p-1 mr-4">
                               <button onClick={() => setZoomLevel(prev => Math.max(50, prev - 10))} className="px-3 py-1.5 text-white/60 hover:text-white transition-colors text-xs font-bold">-</button>
                               <span className="px-4 py-1.5 text-white text-xs font-mono bg-white/10 rounded min-w-[60px] text-center">{zoomLevel}%</span>
                               <button onClick={() => setZoomLevel(prev => Math.min(200, prev + 10))} className="px-3 py-1.5 text-white/60 hover:text-white transition-colors text-xs font-bold">+</button>
                            </div>
                            <button onClick={handleExportPdf} disabled={isGeneratingPdf} title="Baixar PDF" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase rounded-lg transition-all disabled:opacity-50 flex items-center gap-2">
                              {isGeneratingPdf ? <><Loader2 size={16} className="animate-spin"/> Gerando...</> : <><FileDown size={16}/> Baixar PDF</>}
                            </button>
                            <div className="w-px h-6 bg-white/10 mx-2"></div>
                            <button onClick={() => setShowPdfViewer(false)} className="p-2 text-white/60 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"><X size={18}/></button>
                         </div>
                      </div>
                      
                      <div id="pdf-scroll-container" className="flex-1 overflow-y-auto p-12 flex flex-col items-center gap-16 custom-scrollbar bg-[#525659] print:p-0 print:bg-white print:block">
                         {/* Dynamic Document View */}
                         {(() => {
                             const docsToRender = selectedPreviewDoc ? [selectedPreviewDoc] : [
                                { id: '1', title: 'Capa do Processo', type: 'STATIC_CAPA' },
                                { id: '2', title: 'Requerimento Inicial', type: 'STATIC_REQ' },
                                { id: '3', title: 'Certidão de Regularidade', type: 'STATIC_CERT' },
                                ...dossierDocs.map((doc, idx) => ({
                                    id: doc.id,
                                    title: doc.nome || 'Documento Anexo',
                                    type: 'DYNAMIC',
                                    originalDoc: doc
                                }))
                             ];
                             
                             return (
                                 <div id="pdf-content-container" className="flex flex-col gap-16 w-full items-center pb-24 transition-transform duration-200 ease-out print:w-full print:block print:p-0 print:gap-0" style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}>
                                     {docsToRender.map((docItem, index) => (
                                         <div key={docItem.id} className="w-[820px] bg-white shadow-2xl p-24 min-h-[1160px] flex flex-col text-[#000] font-sans relative border-t-8 border-slate-900 shrink-0 print-page">
                                            
                                            {/* Unified Header (ONLY if NOT Capa) */}
                                            {docItem.type !== 'STATIC_CAPA' && (
                                                <div className="flex flex-col items-center justify-center mb-16 space-y-4">
                                                    <img src={BRASAO_TJPA_URL} alt="Brasão" className="w-20 opacity-90"/>
                                                    <h1 className="text-lg font-bold text-slate-900 uppercase tracking-widest text-center">TRIBUNAL DE JUSTIÇA DO ESTADO DO PARÁ</h1>
                                                </div>
                                            )}

                                            {docItem.type === 'STATIC_CAPA' ? (
                                                <div className="flex flex-col items-center h-full">
                                                    <img src={BRASAO_TJPA_URL} alt="Brasão" className="w-32 mb-12 opacity-90" />
                                                    <h1 className="text-2xl font-black tracking-[0.3em] uppercase text-slate-900 mb-2">Poder Judiciário</h1>
                                                    <p className="text-lg font-bold uppercase tracking-[0.2em] text-slate-500 mb-16 border-b-2 border-slate-100 pb-4">Tribunal de Justiça do Pará</p>
                                                    
                                                    <div className="w-full bg-slate-50 p-12 rounded-3xl border border-slate-100 text-center mb-16">
                                                        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] mb-4">Número Único de Protocolo</h2>
                                                        <p className="text-6xl font-black text-slate-900 font-mono tracking-tighter">{p.nup}</p>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-12 w-full text-left border-t border-slate-100 pt-16 font-serif mt-auto">
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Interessado</label>
                                                            <p className="text-lg font-black text-slate-800 uppercase leading-none">{profileData.nome}</p>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Modalidade</label>
                                                            <p className="text-lg font-black text-slate-800 uppercase leading-none">{p.type}</p>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Matrícula</label>
                                                            <p className="text-lg font-black text-slate-800 uppercase leading-none">{profileData.matricula}</p>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Requisitado</label>
                                                            <p className="text-lg font-black text-blue-600 uppercase leading-none">{formatCurrency(p.val)}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : docItem.type === 'STATIC_REQ' ? (
                                                <>
                                                    {/* Specific Sub-Header for Requerimento */}
                                                    <div className="text-center mb-12 space-y-2">
                                                        <h2 className="text-lg font-medium text-slate-700">Solicitação de Suprimento de Fundos {p.type}</h2>
                                                        <h3 className="text-base font-black tracking-widest font-mono mt-4">NUP: {p.nup}</h3>
                                                    </div>
                        
                                                    <div className="w-full h-px bg-slate-900/20 mb-12"></div>
                        
                                                    {/* Section 1: Dados da Solicitação */}
                                                    <div className="space-y-6 mb-12">
                                                        <h4 className="text-base font-black uppercase tracking-tight border-l-4 border-slate-900 pl-4 bg-slate-50 py-2">1. DADOS DA SOLICITAÇÃO</h4>
                                                        <div className="grid grid-cols-1 gap-3 pl-5">
                                                            <p className="text-sm"><strong>Tipo:</strong> {p.type}</p>
                                                            <p className="text-sm"><strong>Data Início:</strong> {p.date || '30/01/2026'}</p>
                                                            <p className="text-sm"><strong>Data Fim:</strong> {p.date || '30/01/2026'}</p>
                                                            <p className="text-sm"><strong>Gestor:</strong> {profileData.gestorNome} ({profileData.gestorEmail})</p>
                                                        </div>
                                                    </div>
                        
                                                    {/* Section 2: Justificativa */}
                                                    <div className="space-y-6 mb-12">
                                                        <h4 className="text-base font-black uppercase tracking-tight border-l-4 border-slate-900 pl-4 bg-slate-50 py-2">2. JUSTIFICATIVA</h4>
                                                        <div className="pl-5 text-sm leading-relaxed text-justify">
                                                            <p>Considerando a necessidade urgente de atender demandas emergenciais na Unidade no período de {p.date || '30/01/2026'}, solicita-se a liberação de suprimento de fundos extraordinário para cobertura de despesas inadiáveis, conforme previsto no Regulamento Interno do TJPA.</p>
                                                            <p className="mt-4 italic text-slate-600">"{p.desc}"</p>
                                                        </div>
                                                    </div>
                        
                                                    {/* Section 3: Elementos de Despesa */}
                                                    <div className="space-y-6 mb-16">
                                                        <h4 className="text-base font-black uppercase tracking-tight border-l-4 border-slate-900 pl-4 bg-slate-50 py-2">3. ELEMENTOS DE DESPESA</h4>
                                                        <div className="overflow-hidden border border-slate-200 rounded-lg">
                                                            <table className="w-full text-xs text-left">
                                                                <thead className="bg-slate-50 border-b border-slate-200">
                                                                    <tr>
                                                                        <th className="px-4 py-3 font-black uppercase">Código</th>
                                                                        <th className="px-4 py-3 font-black uppercase">Descrição</th>
                                                                        <th className="px-4 py-3 font-black uppercase text-center">Qtd</th>
                                                                        <th className="px-4 py-3 font-black uppercase text-right">Valor Unit.</th>
                                                                        <th className="px-4 py-3 font-black uppercase text-right">Valor Total</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-slate-100">
                                                                    <tr>
                                                                        <td className="px-4 py-3 font-mono">3.3.90.33</td>
                                                                        <td className="px-4 py-3">Transporte e Locomoção</td>
                                                                        <td className="px-4 py-3 text-center">1</td>
                                                                        <td className="px-4 py-3 text-right">{formatCurrency(p.val)}</td>
                                                                        <td className="px-4 py-3 text-right font-bold">{formatCurrency(p.val)}</td>
                                                                    </tr>
                                                                    <tr className="bg-slate-50 font-black">
                                                                        <td colSpan={4} className="px-4 py-3 text-right uppercase tracking-widest text-slate-500">TOTAL:</td>
                                                                        <td className="px-4 py-3 text-right">{formatCurrency(p.val)}</td>
                                                                    </tr>
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                        
                                                    {/* Electronic Signatures */}
                                                    <div className="mt-auto space-y-6">
                                                        <div className="p-6 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
                                                            <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">ASSINATURAS ELETRÔNICAS:</h5>
                                                            <div className="flex items-center gap-3 text-[11px] font-medium text-slate-700">
                                                                <div className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-black text-[9px]">OK</div>
                                                                <p>ASSINADO ELETRONICAMENTE POR: <strong>{profileData.nome}</strong> ({profileData.cargo}) em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}. IP: 127.0.0.1</p>
                                                            </div>
                                                            <p className="text-[9px] text-slate-400 mt-4 leading-relaxed">
                                                                A autenticidade deste documento pode be conferida no sistema SISUP através do NUP {p.nup}.
                                                            </p>
                                                        </div>
                        
                                                        <div className="text-center pt-8 border-t border-slate-100 text-[9px] text-slate-400 uppercase tracking-widest">
                                                            Documento gerado automaticamente pelo Sistema SISUP - TJPA <br/>
                                                            Data de geração: {new Date().toLocaleDateString('pt-BR')}, {new Date().toLocaleTimeString('pt-BR')}
                                                        </div>
                                                    </div>
                                                </>
                                            ) : docItem.type === 'STATIC_CERT' ? (
                                                <>
                                                    {/* Certidão de Regularidade */}
                                                    <div className="text-center mb-12">
                                                        <h2 className="text-2xl font-black uppercase tracking-widest">CERTIDÃO DE REGULARIDADE</h2>
                                                        <p className="text-sm text-slate-500 mt-2">Certidão Automática</p>
                                                    </div>
                                                    
                                                    <div className="w-full h-px bg-slate-900/20 mb-8"></div>
                                                    
                                                    {/* Certificate Body */}
                                                    <div className="space-y-8 text-sm leading-relaxed text-justify">
                                                        <p className="indent-8">
                                                            <strong>CERTIFICO</strong>, para os devidos fins e a requerimento do(a) interessado(a), que consultando o 
                                                            banco de dados do Sistema de Concessão de Suprimentos - SISUP do Tribunal de Justiça do Estado do Pará, 
                                                            verifiquei que o(a) servidor(a) abaixo identificado(a) <strong>NÃO POSSUI</strong> prestações de contas 
                                                            pendentes de aprovação ou valores em atraso, encontrando-se em situação <strong>REGULAR</strong> perante 
                                                            este serviço.
                                                        </p>
                                                        
                                                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">DADOS DO SUPRIDO:</h4>
                                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                                <p><strong>Nome:</strong> {profileData.nome}</p>
                                                                <p><strong>Matrícula:</strong> {profileData.matricula}</p>
                                                                <p><strong>Cargo:</strong> {profileData.cargo}</p>
                                                                <p><strong>Lotação:</strong> {profileData.lotacao}</p>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-200">
                                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-700 mb-4">SITUAÇÃO:</h4>
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center">
                                                                    <span className="text-lg font-black">✓</span>
                                                                </div>
                                                                <div>
                                                                    <p className="font-black text-emerald-800 uppercase tracking-wider">SITUAÇÃO REGULAR</p>
                                                                    <p className="text-[11px] text-emerald-700">Nenhuma pendência encontrada no sistema.</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        <p className="indent-8">
                                                            A presente certidão foi emitida automaticamente pelo sistema SISUP com base nos registros constantes 
                                                            na data de sua expedição, não tendo validade como prova de quitação definitiva de obrigações.
                                                        </p>
                                                        
                                                        <p className="text-center text-slate-600">
                                                            Belém-PA, {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}.
                                                        </p>
                                                    </div>
        
                                                    {/* Electronic Validation */}
                                                    <div className="mt-auto space-y-6">
                                                        <div className="p-6 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
                                                            <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">VALIDAÇÃO AUTOMÁTICA:</h5>
                                                            <div className="flex items-center gap-3 text-[11px] font-medium text-slate-700">
                                                                <div className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-black text-[9px]">AI</div>
                                                                <p>VALIDADO AUTOMATICAMENTE PELO SISTEMA SISUP em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}.</p>
                                                            </div>
                                                            <p className="text-[9px] text-slate-400 mt-4 leading-relaxed">
                                                                Documento digital com assinatura automática do sistema. A autenticidade pode ser conferida através do NUP {p.nup}.
                                                            </p>
                                                        </div>
        
                                                        <div className="text-center pt-8 border-t border-slate-100 text-[9px] text-slate-400 uppercase tracking-widest">
                                                            Documento gerado automaticamente pelo Sistema SISUP - TJPA <br/>
                                                            Data de geração: {new Date().toLocaleDateString('pt-BR')}, {new Date().toLocaleTimeString('pt-BR')} - Página {index + 1}
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    {/* Generic / Dynamic Header Content */}
                                                    <div className="text-center mb-12">
                                                        <h2 className="text-2xl font-bold uppercase">{docItem.title}</h2>
                                                        {docItem.type === 'DYNAMIC' && <p className="text-sm text-slate-500 mt-2">Documento Digital</p>}
                                                    </div>
                                                    
                                                    <div className="flex-1 text-slate-800">
                                                        {docItem.type === 'DYNAMIC' && (docItem as any).originalDoc?.conteudo ? (
                                                            <div className="whitespace-pre-wrap font-serif text-base leading-relaxed text-justify">
                                                                {(docItem as any).originalDoc.conteudo}
                                                            </div>
                                                        ) : docItem.type === 'DYNAMIC' ? (
                                                            <div className="text-center text-slate-400 flex flex-col items-center justify-center h-full">
                                                                <div className="border border-slate-200 p-8 rounded-full mb-4">
                                                                    <FileText size={48} />
                                                                </div>
                                                                <p className="font-serif italic text-slate-500 mb-2">"Documento digital assinado e armazenado."</p>
                                                                <p className="text-xs uppercase">Hash: {docItem.id}</p>
                                                            </div>
                                                        ) : (
                                                            <div className="border border-slate-200 p-8 rounded-full flex items-center justify-center">
                                                                <FileText size={48} />
                                                            </div>
                                                        )}
                                                    </div>
        
                                                    <div className="mt-auto pt-8 border-t border-slate-100 text-center text-[9px] text-slate-400 uppercase tracking-widest">
                                                        Documento gerado pelo Sistema SISUP - TJPA <br/>
                                                        Data de geração: {new Date().toLocaleDateString('pt-BR')}, {new Date().toLocaleTimeString('pt-BR')} - Página {index + 1}
                                                    </div>
                                                </>
                                            )}
        
                                            {/* Watermark for all (except Capa maybe? No, Capa usually has no watermark if it's white, but the extracted code has none. Let's keep it consistent or removing it for Capa if user complains. For now, keep it for all as per previous requirement) */}
                                            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                                                <img src={BRASAO_TJPA_URL} className="w-[500px] grayscale" alt="TJPA Watermark" />
                                            </div>
                                         </div>
                                     ))}
                                 </div>
                             );
                         })()}
                      </div>
                    </div>
                  </div>
                )}
             </div>
           )}
           {showDocumentWizard && (
               <DocumentCreationWizard 
                  processId={p.id}
                  nup={p.nup}
                  currentUser={profileData}
                  onClose={() => setShowDocumentWizard(false)}
                  onSuccess={() => {
                      alert('Documento adicionado ao processo!');
                      fetchDossierDocs(p.id);
                  }}
               />
           )}
           
           {/* Edit Document Modal */}
           {editingDoc && (
             <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-slate-900/70 backdrop-blur-md">
               <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
                 <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                   <div>
                     <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Editar Documento</h2>
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">ID: {editingDoc.id?.slice(0, 8)}...</p>
                   </div>
                   <button onClick={() => setEditingDoc(null)} className="p-2 hover:bg-slate-200 rounded-full transition-all"><X size={20} className="text-slate-500"/></button>
                 </div>
                 <div className="flex-1 p-8 space-y-6 overflow-y-auto">
                   <div>
                     <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Título do Documento</label>
                     <input 
                       type="text" 
                       value={editDocTitle} 
                       onChange={(e) => setEditDocTitle(e.target.value)}
                       className="w-full p-4 border border-slate-200 rounded-xl text-lg font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                     />
                   </div>
                   <div className="flex-1">
                     <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Conteúdo</label>
                     <textarea 
                       value={editDocContent} 
                       onChange={(e) => setEditDocContent(e.target.value)}
                       className="w-full h-96 p-4 border border-slate-200 rounded-xl font-serif text-base leading-relaxed focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                       placeholder="Digite o conteúdo do documento..."
                     />
                   </div>
                 </div>
                 <div className="px-8 py-6 border-t border-slate-100 flex justify-end gap-4 bg-slate-50">
                   <button onClick={() => setEditingDoc(null)} className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-black uppercase hover:bg-slate-50 transition-all">
                     Cancelar
                   </button>
                   <button 
                     onClick={handleSaveDocEdit} 
                     disabled={isSavingDoc}
                     className="px-8 py-3 bg-blue-600 text-white rounded-xl text-sm font-black uppercase hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50"
                   >
                     {isSavingDoc ? <><Loader2 size={16} className="animate-spin"/> Salvando...</> : <><Save size={16}/> Salvar Alterações</>}
                   </button>
                 </div>
               </div>
             </div>
           )}
           
           {/* Delete Confirmation Modal */}
           {deleteConfirmDocId && (
             <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-slate-900/70 backdrop-blur-md">
               <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95">
                 <div className="flex items-center gap-4 mb-6">
                   <div className="p-4 bg-red-100 text-red-600 rounded-full"><AlertTriangle size={28}/></div>
                   <div>
                     <h2 className="text-xl font-black text-slate-800">Confirmar Exclusão</h2>
                     <p className="text-sm text-slate-500">Esta ação não pode ser desfeita.</p>
                   </div>
                 </div>
                 <p className="text-slate-600 mb-8">Tem certeza que deseja excluir este documento permanentemente?</p>
                 <div className="flex justify-end gap-4">
                   <button onClick={() => setDeleteConfirmDocId(null)} className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-black uppercase hover:bg-slate-50 transition-all">
                     Cancelar
                   </button>
                   <button 
                     onClick={() => handleDeleteDoc(deleteConfirmDocId)}
                     className="px-8 py-3 bg-red-600 text-white rounded-xl text-sm font-black uppercase hover:bg-red-700 transition-all flex items-center gap-2"
                   >
                     <Trash2 size={16}/> Excluir
                   </button>
                 </div>
               </div>
             </div>
           )}
        </main>
      </div>
    );
  };

  const renderExtraForm = () => {
    const handleAddItem = () => {
      const newItem: FormItem = {
        id: Math.random().toString(),
        desc: '',
        element: '',
        qty: 1,
        val: 0
      };
      setFormState({ ...formState, items: [...formState.items, newItem] });
    };

    const handleRemoveItem = (index: number) => {
      const newItems = [...formState.items];
      newItems.splice(index, 1);
      setFormState({ ...formState, items: newItems });
    };

    const updateItem = (index: number, field: keyof FormItem, value: any) => {
      const newItems = [...formState.items];
      newItems[index] = { ...newItems[index], [field]: value };
      setFormState({ ...formState, items: newItems });
    };

    const totalValue = formState.items.reduce((acc, item) => acc + (item.val * item.qty), 0);

    return (
      <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in pb-32">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200">
               <FileText size={24} />
             </div>
             <div>
               <h1 className="text-2xl font-black text-slate-800 tracking-tight">Nova Solicitação de Suprimento Extraordinário</h1>
               <p className="text-slate-500 text-sm font-medium">Preencha os dados para criar sua solicitação</p>
             </div>
          </div>
          <button onClick={() => setCurrentView('SELECT_TYPE')} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
             <ArrowLeft size={16} /> Voltar
          </button>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
           <Info className="text-blue-600 mt-0.5 shrink-0" size={18} />
           <div className="space-y-1">
              <p className="text-sm font-bold text-blue-800">Suprimento Extraordinário:</p>
              <p className="text-xs text-blue-600 leading-relaxed">Solicitado diretamente pelo Suprido para necessidades especiais (Júri ou Emergencial) que fogem ao fluxo ordinário.</p>
           </div>
        </div>

        {/* Main Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
           <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Dados da Solicitação Extra-Emergencial</h3>
              <button className="text-xs font-bold text-blue-600 hover:underline" onClick={() => setCurrentView('SELECT_TYPE')}>Trocar tipo</button>
           </div>
           
           <div className="p-8 space-y-8">
              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Data do Evento (Início) <span className="text-red-500">*</span></label>
                    <input 
                      type="date" 
                      value={formState.startDate} 
                      onChange={e => setFormState({...formState, startDate: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all" 
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Data do Evento (Fim)</label>
                    <input 
                      type="date" 
                      value={formState.endDate} 
                      onChange={e => setFormState({...formState, endDate: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all" 
                    />
                 </div>
              </div>

              {/* Elements */}
              <div className="space-y-4">
                 <div className="flex justify-between items-end">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Elementos de Despesa <span className="text-red-500">*</span></label>
                    <button onClick={handleAddItem} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5">
                       <Plus size={14} /> Adicionar Item
                    </button>
                 </div>
                 
                 <div className="space-y-3">
                    {formState.items.map((item, index) => (
                       <div key={item.id} className="flex gap-4 items-center animate-in slide-in-from-left-2 duration-300">
                          <div className="flex-1">
                             <select 
                                value={item.element} 
                                onChange={e => updateItem(index, 'element', e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                             >
                                 <option value="">Selecione o Elemento...</option>
                                 {expenseElements.map(el => (
                                    <option key={el.code} value={el.code}>{el.code} - {el.label}</option>
                                 ))}
                             </select>
                          </div>
                          <div className="w-32 relative">
                             <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">R$</span>
                             <input 
                                type="number" 
                                value={item.val || ''}
                                placeholder="0,00"
                                onChange={e => updateItem(index, 'val', parseFloat(e.target.value))}
                                className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-right text-slate-700 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                             />
                          </div>
                           <button 
                             onClick={() => handleRemoveItem(index)}
                             className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                             title="Remover item"
                           >
                             <Trash2 size={16} />
                           </button>
                       </div>
                    ))}
                    {formState.items.length === 0 && (
                       <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-sm">
                          Nenhum item adicionado. Clique em "Adicionar Item" para começar.
                       </div>
                    )}
                 </div>
                 
                 <div className="flex justify-end pt-2">
                    <p className="text-sm font-bold text-slate-600">Total: <span className="text-lg font-black text-red-600 ml-2">{formatCurrency(totalValue)}</span></p>
                 </div>
              </div>

              {/* Justification */}
              <div className="space-y-2">
                 <div className="flex justify-between items-center">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Justificativa <span className="text-red-500">*</span></label>
                    <button onClick={() => setShowAiModal(true)} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border border-indigo-200/50">
                       <Sparkles size={14} /> Gerar com IA
                    </button>
                 </div>
                 <textarea 
                    value={formState.desc}
                    onChange={e => setFormState({...formState, desc: e.target.value})}
                    className="w-full h-32 p-4 bg-white border border-slate-300 rounded-xl text-sm leading-relaxed text-slate-700 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all resize-none shadow-inner"
                    placeholder="Descreva a necessidade da solicitação..."
                 />
              </div>

               {/* Urgency */}
               <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Urgência</label>
                  <div className="relative">
                      <select 
                        value={formState.urgency} 
                        onChange={e => setFormState({...formState, urgency: e.target.value})}
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all appearance-none"
                      >
                         <option value="Normal">Normal</option>
                         <option value="Alta">Alta</option>
                         <option value="Urgente">Urgente</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  </div>
               </div>

              {/* Manager */}
              <div className="pt-4 border-t border-slate-100 space-y-6">
                 <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer" />
                    <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">Sou meu próprio gestor</span>
                 </label>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Nome do Gestor <span className="text-red-500">*</span></label>
                       <input 
                         type="text" 
                         value={profileData?.gestorNome || ''} 
                         readOnly
                         className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-500" 
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Email do Gestor <span className="text-red-500">*</span></label>
                       <input 
                         type="text" 
                         value={profileData?.gestorEmail || ''} 
                         readOnly
                         className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-500" 
                       />
                    </div>
                 </div>
              </div>
           </div>
           
           {/* Footer */}
           <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button 
                 onClick={() => setCurrentView('SELECT_TYPE')}
                 className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50 transition-all shadow-sm"
              >
                 Cancelar
              </button>
              <button 
                 onClick={handleCreateRequest}
                 disabled={isCreating}
                 className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                 {isCreating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} 
                 {isCreating ? 'Criando...' : 'Criar Solicitação'}
              </button>
           </div>
        </div>

        {/* AI Modal Reuse */}
         {showAiModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
             <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowAiModal(false)}></div>
             <div className="relative bg-white w-full max-w-xl rounded-[32px] p-8 shadow-2xl space-y-6 text-center animate-in zoom-in-95">
                <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl w-fit mx-auto shadow-inner"><Sparkles size={32} /></div>
                <div className="space-y-2">
                   <h3 className="text-xl font-black text-slate-900 tracking-tight">Gerador de Justificativa</h3>
                   <p className="text-slate-500 text-sm font-medium">Descreva brevemente e a IA irá expandir.</p>
                </div>
                <div className="flex flex-col gap-3">
                   <button onClick={handleAiJustification} disabled={isGeneratingAi} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold uppercase text-xs tracking-wider hover:bg-indigo-700 flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 transition-all">
                      {isGeneratingAi ? <RefreshCw size={18} className="animate-spin" /> : <><Sparkles size={18}/> Gerar Texto</>}
                   </button>
                   <button onClick={() => setShowAiModal(false)} className="w-full py-3 text-slate-400 font-bold text-xs hover:bg-slate-50 rounded-xl transition-all">Cancelar</button>
                </div>
             </div>
          </div>
        )}
      </div>
    );
  };

  const renderForm = () => {
    const isJuri = formState.type === 'Sessão de Júri';
    
    // Redirect to new Extra-Emergencial Layout
    if (!isJuri) {
       return renderExtraForm();
    }

    // Wizard para Sessão de Júri (Layout Novo)
    return (
      <div className="p-10 max-w-[1200px] mx-auto animate-in fade-in pb-32">
         {/* Wizard Header */}
         <div className="bg-[#0f172a] rounded-[24px] p-8 text-white mb-8 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between relative z-10">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/10 rounded-xl"><Scale size={24}/></div>
                  <div>
                     <h1 className="text-2xl font-black tracking-tight">Nova Solicitação Extra-Júri</h1>
                     <p className="text-xs text-slate-400 font-medium">Preencha o wizard para criar a solicitação</p>
                  </div>
               </div>
               <div className="flex items-center gap-4">
                  {['Pessoas', 'Projeção', 'Justificativa'].map((label, idx) => {
                     const step = idx + 1;
                     const isActive = wizardStep === step;
                     const isDone = wizardStep > step;
                     return (
                        <div key={label} className="flex flex-col items-center gap-2">
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all ${isActive ? 'bg-blue-600 text-white shadow-lg scale-110' : isDone ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                              {isDone ? <CheckCircle2 size={18}/> : (idx === 0 ? <Users size={18}/> : idx === 1 ? <Calculator size={18}/> : <FileText size={18}/>)}
                           </div>
                           <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-blue-400' : 'text-slate-600'}`}>{label}</span>
                        </div>
                     );
                  })}
               </div>
            </div>
            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 h-1.5 bg-slate-800 w-full">
               <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${(wizardStep / 3) * 100}%` }}></div>
            </div>
         </div>

         {/* Steps Content */}
         <div className="space-y-8">
            
            {/* Step 1: Quantitativos */}
            {wizardStep === 1 && (
               <div className="animate-in slide-in-from-right-4 duration-300 space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                     <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Users size={20}/></div>
                     <div><h3 className="text-lg font-bold text-slate-800">Pessoas Envolvidas</h3><p className="text-xs text-slate-500">Informe a quantidade de participantes por categoria</p></div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                     <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                        <h4 className="text-xs font-bold text-slate-700">Categorias de Participantes</h4>
                        <p className="text-[10px] text-slate-500 mt-1">Preencha a quantidade solicitada. A aprovada será definida pela SOSFU.</p>
                     </div>
                     <div className="p-6 space-y-4">
                        {[
                           { key: 'servidores', label: 'Servidor do Fórum', max: juriLimits.participantes.servidores },
                           { key: 'reus', label: 'Réus' },
                           { key: 'jurados', label: 'Jurados' },
                           { key: 'testemunhas', label: 'Testemunhas' },
                           { key: 'defensor', label: 'Defensor Público', max: juriLimits.participantes.defensor },
                           { key: 'promotor', label: 'Promotor', max: juriLimits.participantes.promotor },
                           { key: 'policias', label: 'Polícias', max: juriLimits.participantes.policias },
                        ].map((cat) => (
                           <div key={cat.key} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                              <div className="flex items-center gap-2 w-1/3">
                                 <span className="text-sm font-bold text-slate-700">{cat.label}</span>
                                 {cat.max && <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">Máx: {cat.max}</span>}
                              </div>
                              <div className="flex items-center gap-8">
                                 <div className="text-center">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">QTD SOLICITADA</p>
                                    <input 
                                       type="number" 
                                       min="0"
                                       max={cat.max}
                                       className={`w-24 p-2 text-center text-sm font-bold border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${cat.max ? 'border-amber-200 bg-amber-50/50' : 'border-slate-200'}`}
                                       value={formState.juriParticipants[cat.key as keyof JuriParticipants]}
                                       onChange={(e) => {
                                          let newValue = parseInt(e.target.value) || 0;
                                          // Check if max limit exceeded
                                          if (cat.max && newValue > cat.max) {
                                             // Only show notification for policias
                                             if (cat.key === 'policias') {
                                                setLimitExceededType('participante');
                                                setShowLimitExceededAlert(true);
                                             }
                                             newValue = cat.max;
                                          }
                                          setFormState({
                                             ...formState,
                                             juriParticipants: { ...formState.juriParticipants, [cat.key]: newValue }
                                          });
                                       }}
                                    />
                                 </div>
                                 <div className="text-center opacity-50 pointer-events-none">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">QTD APROVADA</p>
                                    <input type="number" disabled className="w-24 p-2 text-center text-sm font-bold bg-slate-100 border border-slate-200 rounded-lg text-slate-500" value="0" />
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                     <div className="bg-blue-50 p-6 border-t border-blue-100 flex justify-between items-center text-blue-900">
                        <div className="flex items-center gap-3">
                           <Users size={24}/>
                           <div><p className="text-xs font-bold uppercase tracking-widest">Total de Pessoas</p><p className="text-[10px] opacity-70">Este valor será usado para calcular refeições e lanches</p></div>
                        </div>
                        <p className="text-3xl font-black">{(Object.values(formState.juriParticipants) as number[]).reduce((a, b) => a + b, 0)} <span className="text-xs font-bold">participantes</span></p>
                     </div>
                  </div>
               </div>
            )}

            {/* Step 2: Projeção */}
            {wizardStep === 2 && (
               <div className="animate-in slide-in-from-right-4 duration-300 space-y-8">
                  {/* Section: Datas */}
                  <div className="space-y-4">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Calendar size={20}/></div>
                        <div><h3 className="text-lg font-bold text-slate-800">Datas e Projeção de Gastos</h3><p className="text-xs text-slate-500">Defina o período e configure a frequência das refeições</p></div>
                     </div>
                     
                     <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                        <h4 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2"><Calendar size={14}/> Período do Evento (Sessão de Júri)</h4>
                        <div className="grid grid-cols-3 gap-6">
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-500 uppercase">Data Início *</label>
                              <input type="date" value={formState.startDate} onChange={e => setFormState({...formState, startDate: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700" />
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-500 uppercase">Data Fim *</label>
                              <input type="date" value={formState.endDate} onChange={e => setFormState({...formState, endDate: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700" />
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-500 uppercase">Dias de Júri</label>
                              <div className="w-full p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-sm font-black text-blue-700 text-center">{formState.juriDays} dia(s)</div>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Section: Frequência Alimentação */}
                  <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-6 space-y-4">
                     <h4 className="text-xs font-bold text-amber-700 uppercase tracking-widest flex items-center gap-2"><Utensils size={14}/> Painel de Frequência de Alimentação</h4>
                     <p className="text-[10px] text-amber-600 mb-4">Defina quantas vezes cada refeição será servida <strong>por pessoa</strong> durante o evento</p>
                     
                     <div className="grid grid-cols-3 gap-4">
                        {[
                           { key: 'almocos', label: 'Almoços', icon: Utensils, color: 'text-orange-500', bg: 'bg-orange-100' },
                           { key: 'jantares', label: 'Jantares', icon: Utensils, color: 'text-indigo-500', bg: 'bg-indigo-100' }, // Moon icon substitute
                           { key: 'lanches', label: 'Lanches', icon: Utensils, color: 'text-emerald-500', bg: 'bg-emerald-100' }, // Coffee icon substitute
                        ].map((meal) => (
                           <div key={meal.key} className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                              <div className="flex items-center gap-3 mb-3">
                                 <div className={`p-2 rounded-lg ${meal.bg} ${meal.color}`}><meal.icon size={16}/></div>
                                 <div><p className="text-sm font-bold text-slate-800">{meal.label}</p><p className="text-[9px] text-slate-400">por pessoa</p></div>
                              </div>
                              <div className="flex items-center justify-between bg-slate-50 rounded-lg p-1">
                                 <button onClick={() => setFormState(prev => ({...prev, juriMealFreq: {...prev.juriMealFreq, [meal.key]: Math.max(0, prev.juriMealFreq[meal.key as keyof typeof prev.juriMealFreq] - 1)}}))} className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm text-slate-500 hover:text-slate-800 font-bold">-</button>
                                 <span className="font-black text-slate-800">{formState.juriMealFreq[meal.key as keyof typeof formState.juriMealFreq]}</span>
                                 <button onClick={() => setFormState(prev => ({...prev, juriMealFreq: {...prev.juriMealFreq, [meal.key]: prev.juriMealFreq[meal.key as keyof typeof prev.juriMealFreq] + 1}}))} className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm text-slate-500 hover:text-slate-800 font-bold">+</button>
                              </div>
                              <div className="mt-2 text-[9px] font-medium text-slate-400 text-center bg-slate-100 rounded px-2 py-1">
                                 Total: {formState.juriMealFreq[meal.key as keyof typeof formState.juriMealFreq] * (Object.values(formState.juriParticipants) as number[]).reduce((a, b) => a + b, 0) * formState.juriDays} unid.
                              </div>
                           </div>
                        ))}
                     </div>
                     <div className="bg-white border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                        <Sparkles size={14} className="text-amber-500 mt-0.5"/>
                        <p className="text-[10px] text-amber-700 font-medium"><strong>Dica:</strong> Ao selecionar as datas, os valores são automaticamente preenchidos com 1 almoço(s) e 1 lanche(s) por pessoa. Ajuste conforme necessário.</p>
                     </div>
                  </div>

                  {/* Section: Process Data */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                     <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2"><FileText size={14}/> Dados do Processo</h4>
                     <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-slate-500 uppercase">Comarca *</label>
                           <select value={formState.juriComarca} onChange={e => setFormState({...formState, juriComarca: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700">
                              <option>Mãe do Rio</option>
                              <option>Belém</option>
                              <option>Ananindeua</option>
                           </select>
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-slate-500 uppercase">Número do Processo Judicial *</label>
                           <input type="text" value={formState.juriProcessNumber} onChange={e => setFormState({...formState, juriProcessNumber: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700" />
                        </div>
                     </div>
                  </div>

                  {/* Section: Table Items */}
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                     <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Itens da Projeção</h4>
                        <p className="text-[10px] text-slate-500 mt-1">Quantidades de refeições calculadas automaticamente com base no painel acima. Outros itens são editáveis manualmente.</p>
                     </div>
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                           <thead className="bg-slate-50 border-b border-slate-200">
                              <tr>
                                 <th className="p-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Descrição</th>
                                 <th className="p-4 text-[9px] font-black uppercase tracking-widest text-slate-400 w-64">Elemento de Despesa</th>
                                 <th className="p-4 text-[9px] font-black uppercase tracking-widest text-slate-400 w-24">Vl. Unit</th>
                                 <th className="p-4 text-[9px] font-black uppercase tracking-widest text-slate-400 text-center w-24">Qtd Solic.</th>
                                 <th className="p-4 text-[9px] font-black uppercase tracking-widest text-slate-400 text-center w-24">Qtd Aprov.</th>
                                 <th className="p-4 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right w-32">Total Solic.</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100 text-xs">
                              {formState.juriProjectionItems.map((item, idx) => (
                                 <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4 font-bold text-slate-700">
                                       <div className="flex items-center gap-2">
                                          {item.id === 'outros' ? (
                                             <div className="flex items-center gap-2 flex-1">
                                                <span className="whitespace-nowrap">Outros:</span>
                                                <input 
                                                   type="text"
                                                   placeholder="Especificar item..."
                                                   className="flex-1 p-1.5 bg-white border border-slate-200 rounded text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                                                   value={item.description === 'Outros (Especificar)' ? '' : item.description.replace('Outros: ', '')}
                                                   onChange={(e) => {
                                                      const newItems = [...formState.juriProjectionItems];
                                                      newItems[idx].description = e.target.value ? `Outros: ${e.target.value}` : 'Outros (Especificar)';
                                                      setFormState({...formState, juriProjectionItems: newItems});
                                                   }}
                                                />
                                             </div>
                                          ) : (
                                             <>
                                                {item.description}
                                                {item.isAuto && <span className="bg-blue-50 text-blue-600 text-[8px] font-black px-1.5 py-0.5 rounded border border-blue-100">AUTO</span>}
                                                {item.isAuto && item.unitValue > 0 && <span className="bg-amber-50 text-amber-600 text-[8px] font-black px-1.5 py-0.5 rounded border border-amber-100">Máx R${item.unitValue}</span>}
                                             </>
                                          )}
                                       </div>
                                    </td>
                                    <td className="p-4">
                                       <select 
                                          className="w-full bg-white border border-slate-200 rounded p-1 text-[10px]"
                                          value={item.element}
                                          onChange={(e) => {
                                             const newItems = [...formState.juriProjectionItems];
                                             newItems[idx].element = e.target.value;
                                             setFormState({...formState, juriProjectionItems: newItems});
                                          }}
                                       >
                                          {expenseElements.map(el => (
                                             <option key={el.code} value={el.code}>{el.code} - {el.label}</option>
                                          ))}
                                       </select>
                                    </td>
                                    <td className="p-4">
                                       <div className="relative">
                                          <span className="absolute left-2 top-1.5 text-slate-400 font-medium">R$</span>
                                          <input 
                                             type="number" 
                                             className={`w-full pl-6 p-1 border rounded text-right font-medium ${item.isAuto ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}
                                             value={item.unitValue}
                                             onChange={(e) => {
                                                const newItems = [...formState.juriProjectionItems];
                                                let newValue = parseFloat(e.target.value) || 0;
                                                let exceeded = false;
                                                
                                                // Enforce max value for auto items (meals)
                                                if (item.isAuto && item.id === 'almoco' && newValue > juriLimits.refeicoes.almoco) {
                                                   newValue = juriLimits.refeicoes.almoco;
                                                   exceeded = true;
                                                } else if (item.isAuto && item.id === 'jantar' && newValue > juriLimits.refeicoes.jantar) {
                                                   newValue = juriLimits.refeicoes.jantar;
                                                   exceeded = true;
                                                } else if (item.isAuto && item.id === 'lanche' && newValue > juriLimits.refeicoes.lanche) {
                                                   newValue = juriLimits.refeicoes.lanche;
                                                   exceeded = true;
                                                }
                                                
                                                if (exceeded) {
                                                   setLimitExceededType('refeicao');
                                                   setShowLimitExceededAlert(true);
                                                }
                                                
                                                newItems[idx].unitValue = newValue;
                                                newItems[idx].total = newItems[idx].quantity * newItems[idx].unitValue;
                                                setFormState({...formState, juriProjectionItems: newItems});
                                             }}
                                          />
                                       </div>
                                    </td>
                                    <td className="p-4 text-center">
                                       <input 
                                          type="number" 
                                          className={`w-full p-1 text-center font-bold border rounded ${item.isAuto ? 'bg-blue-50 border-blue-100 text-blue-700' : 'bg-white border-slate-200 text-slate-700'}`}
                                          value={item.quantity}
                                          readOnly={item.isAuto}
                                          onChange={(e) => {
                                             if(item.isAuto) return;
                                             const newItems = [...formState.juriProjectionItems];
                                             newItems[idx].quantity = parseFloat(e.target.value) || 0;
                                             newItems[idx].total = newItems[idx].quantity * newItems[idx].unitValue;
                                             setFormState({...formState, juriProjectionItems: newItems});
                                          }}
                                       />
                                    </td>
                                    <td className="p-4 text-center">
                                       <input type="number" disabled className="w-full p-1 text-center bg-slate-100 border border-slate-200 rounded text-slate-400" value="0" />
                                    </td>
                                    <td className="p-4 text-right font-black text-slate-800">
                                       {formatCurrency(Math.round(item.total))}
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                     
                     <div className="bg-emerald-50 p-6 flex justify-between items-center text-emerald-800 border-t border-emerald-100">
                        <div className="flex items-center gap-3">
                           <DollarSign size={24}/>
                           <div><p className="text-xs font-bold uppercase tracking-widest">Total Geral Solicitado</p><p className="text-[10px] opacity-70">{(Object.values(formState.juriParticipants) as number[]).reduce((a, b) => a + b, 0)} pessoas | {formState.juriDays} dia(s)</p></div>
                        </div>
                        <p className="text-3xl font-black">{formatCurrency(Math.round(formState.juriProjectionItems.reduce((acc, item) => acc + item.total, 0)))}</p>
                     </div>
                  </div>
               </div>
            )}

            {/* Step 3: Finalização */}
            {wizardStep === 3 && (
               <div className="animate-in slide-in-from-right-4 duration-300 space-y-8">
                  {/* Financial Summary */}
                  <div className="bg-[#0f172a] rounded-xl p-6 text-white shadow-lg">
                     <h4 className="text-xs font-bold uppercase tracking-widest border-b border-slate-700 pb-2 mb-4 flex items-center gap-2"><DollarSign size={14}/> Resumo Financeiro por Elemento de Despesa</h4>
                     <div className="space-y-3">
                        {Array.from(new Set(formState.juriProjectionItems.map(i => i.element.split(' - ')[0]))).map(code => {
                           const total = formState.juriProjectionItems.filter(i => i.element.startsWith(code)).reduce((acc, i) => acc + i.total, 0);
                           if (total === 0) return null;
                           return (
                              <div key={code} className="flex justify-between items-center text-sm">
                                 <span className="font-medium bg-slate-800 px-2 py-0.5 rounded text-slate-300">{code}</span>
                                 <span className="font-bold">{formatCurrency(total)}</span>
                              </div>
                           );
                        })}
                        <div className="border-t border-slate-700 pt-3 flex justify-between items-center text-lg text-emerald-400 font-black">
                           <span>TOTAL GERAL</span>
                           <span>{formatCurrency(Math.round(formState.juriProjectionItems.reduce((acc, item) => acc + item.total, 0)))}</span>
                        </div>
                     </div>
                  </div>

                  {/* Urgency & Manager */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 uppercase">Urgência da Solicitação</label>
                        <div className="flex gap-4">
                           {['Normal', 'Urgente'].map(opt => (
                              <button 
                                 key={opt}
                                 onClick={() => setFormState({...formState, urgency: opt})}
                                 className={`flex-1 p-3 rounded-lg border text-sm font-bold transition-all ${formState.urgency === opt ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                              >
                                 {opt}
                                 {opt === 'Normal' && <p className="text-[9px] font-medium opacity-60">Tramitação padrão</p>}
                                 {opt === 'Urgente' && <p className="text-[9px] font-medium opacity-60">Prioridade alta</p>}
                              </button>
                           ))}
                        </div>
                     </div>

                     <div className="space-y-2 pt-4 border-t border-slate-100">
                        <h4 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-2"><UserCheck size={14}/> Dados do Gestor</h4>
                        <div className="grid grid-cols-2 gap-6">
                           <input type="text" placeholder="Nome do Gestor *" value={formState.managerName} disabled className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-600" />
                           <input type="text" placeholder="Email do Gestor *" value={formState.managerEmail} disabled className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-600" />
                        </div>
                     </div>
                  </div>

                  {/* Justification & AI */}
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 shadow-sm relative group">
                     <div className="flex justify-between items-center mb-4">
                        <h4 className="text-xs font-bold text-purple-800 uppercase flex items-center gap-2"><Sparkles size={14}/> Justificativa do Pedido *</h4>
                        <button onClick={() => setShowAiModal(true)} className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-purple-700 shadow-lg shadow-purple-200 transition-all flex items-center gap-2">
                           {isGeneratingAi ? <RefreshCw size={12} className="animate-spin"/> : <Sparkles size={12}/>} Gerar com IA
                        </button>
                     </div>
                     <textarea 
                        className="w-full h-40 p-4 bg-white border border-purple-100 rounded-lg text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-slate-300"
                        placeholder="Digite a justificativa do pedido de suprimento extraordinário ou clique em 'Gerar com IA' para criar automaticamente..."
                        value={formState.desc}
                        onChange={e => setFormState({...formState, desc: e.target.value})}
                     />
                  </div>

                  {/* Document Signed Stub */}
                  <div className={`border rounded-xl p-6 shadow-sm ${isJuriSigned ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                     <h4 className={`text-xs font-bold uppercase flex items-center gap-2 mb-4 ${isJuriSigned ? 'text-emerald-800' : 'text-amber-800'}`}>
                        <Signature size={14}/> Assinatura do Solicitante
                        {isJuriSigned && <span className="ml-2 bg-emerald-600 text-white text-[8px] px-2 py-0.5 rounded-full">✓ ASSINADO</span>}
                     </h4>
                     <div className={`bg-white border rounded-lg p-4 flex items-start gap-4 ${isJuriSigned ? 'border-emerald-100' : 'border-amber-100'}`}>
                        <div className={`p-2 rounded-full ${isJuriSigned ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}><UserCheck size={16}/></div>
                        <div>
                           <p className="text-xs text-slate-600 leading-relaxed font-medium">Declaro, sob as penas da lei, que as informações prestadas neste requerimento são verdadeiras e que os recursos serão utilizados exclusivamente para os fins descritos na justificativa acima.</p>
                           <div className="mt-3 flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-800">{profileData.nome}</span>
                              <span className="text-[10px] text-slate-400">Mat. {profileData.matricula}</span>
                              {isJuriSigned && <span className="text-[10px] text-emerald-600 font-bold ml-2">• Assinado em {new Date().toLocaleDateString('pt-BR')}</span>}
                           </div>
                        </div>
                     </div>
                     <button 
                        onClick={() => setIsJuriSigned(!isJuriSigned)}
                        className={`w-full mt-4 py-3 rounded-lg text-xs font-black uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 ${
                           isJuriSigned 
                              ? 'bg-slate-200 text-slate-600 hover:bg-slate-300 shadow-slate-100' 
                              : 'bg-amber-600 text-white hover:bg-amber-700 shadow-amber-200'
                        }`}
                     >
                        <Signature size={14}/> {isJuriSigned ? 'Remover Assinatura' : 'Assinar Justificativa'}
                     </button>
                  </div>
               </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-8 border-t border-slate-200 bg-white sticky bottom-0 p-4 -mx-10 px-10 shadow-up z-20">
               {wizardStep > 1 ? (
                  <button onClick={() => setWizardStep(prev => prev - 1)} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2">
                     <ArrowLeft size={14}/> Voltar
                  </button>
               ) : (
                  <button onClick={() => setCurrentView('SELECT_TYPE')} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2">
                     Cancelar
                  </button>
               )}

               <div className="flex gap-3">
                  {wizardStep === 3 && (
                     <button 
                        onClick={handleSaveJuriDraft}
                        disabled={isSavingDraft}
                        className="px-6 py-2.5 bg-white border border-amber-200 text-amber-600 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-amber-50 transition-all flex items-center gap-2 disabled:opacity-50"
                     >
                        {isSavingDraft ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>} 
                        {isSavingDraft ? 'Salvando...' : 'Salvar Rascunho'}
                     </button>
                  )}
                  <button 
                     onClick={() => wizardStep < 3 ? setWizardStep(prev => prev + 1) : handleSubmitJuriToAtesto()}
                     disabled={isSubmitting}
                     className={`px-8 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 ${
                        wizardStep === 3 
                           ? (isJuriSigned ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200' : 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none')
                           : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
                     }`}
                  >
                     {wizardStep === 3 ? (
                        isSubmitting ? <><Loader2 size={14} className="animate-spin"/> Enviando...</> : <><Send size={14}/> Enviar para Atesto</>
                     ) : (
                        <><span className="mr-1">Próximo</span> <ArrowRight size={14}/></>
                     )}
                  </button>
               </div>
            </div>
         </div>

         {/* AI Modal */}
         {showAiModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
               <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative">
                  <button onClick={() => setShowAiModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={20}/></button>
                  <div className="flex items-center gap-3 mb-4 text-purple-600">
                     <Sparkles size={24}/>
                     <h3 className="text-lg font-black">Gerar Justificativa com IA</h3>
                  </div>
                  <p className="text-sm text-slate-500 mb-6">A IA irá gerar uma justificativa baseada nos dados: <strong>{(Object.values(formState.juriParticipants) as number[]).reduce((a, b) => a + b, 0)} pessoas × {formState.juriDays} dia(s)</strong>, incluindo: {formState.juriProjectionItems.filter(i => i.total > 0).length} itens selecionados.</p>
                  
                  {isGeneratingAi ? (
                     <div className="py-8 flex flex-col items-center gap-4 text-purple-600">
                        <RefreshCw size={32} className="animate-spin"/>
                        <p className="text-xs font-bold uppercase tracking-widest animate-pulse">Escrevendo fundamentação...</p>
                     </div>
                  ) : (
                     <div className="space-y-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-slate-600 italic">
                           "O evento está programado para o período de... visam garantir a alimentação adequada..."
                        </div>
                        <button onClick={handleAiJustification} className="w-full py-3 bg-purple-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-purple-700 shadow-lg shadow-purple-200 transition-all flex items-center justify-center gap-2">
                           <Sparkles size={16}/> Gerar Agora
                        </button>
                     </div>
                  )}
               </div>
            </div>
         )}
      </div>
    );
  };

  // State for Editing Profile
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleCreateRequest = async () => {
    setIsCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let userId = user?.id;
      if (!userId) { 
         userId = '00000000-0000-0000-0000-000000000000';
      }

      const isJuri = formState.type === 'Sessão de Júri';

      let totalValue = 0;
      let generatedNUP = '';

      if (isJuri) {
           totalValue = formState.juriProjectionItems.reduce((acc, item) => acc + item.total, 0);
           generatedNUP = `TJPA-JURI-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      } else {
           totalValue = formState.items.reduce((acc, item) => acc + (item.val * item.qty), 0);
           generatedNUP = `TJPA-EXT-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      }

      const payload: any = {
        user_id: userId,
        nup: generatedNUP,
        tipo: formState.type,
        status: 'Pendente Análise',
        valor_solicitado: totalValue,
        valor_aprovado: 0,
        descricao: formState.desc,
        data_inicio: formState.startDate || null,
        data_fim: formState.endDate || null,
        urgencia: formState.urgency,
      };

      if (isJuri) {
          payload.juri_participantes = formState.juriParticipants;
          payload.comarca_destino = formState.juriComarca;
          payload.processo_judicial = formState.juriProcessNumber;
          payload.juri_dias = formState.juriDays;
          payload.juri_frequencia_refeicoes = formState.juriMealFreq;
          payload.juri_projecao_custos = formState.juriProjectionItems;
      } else {
          payload.itens_despesa = formState.items;
      }

      const { error } = await supabase.from('solicitacoes').insert(payload);

      if (error) throw error;

      alert(`Solicitação ${generatedNUP} criada com sucesso!`);
      await refreshHistory();
      setCurrentView('DASHBOARD');

    } catch (error) {
      console.error('Erro ao criar solicitação:', error);
      alert('Erro ao criar solicitação. Verifique os dados e tente novamente.');
    } finally {
      setIsCreating(false);
    }
  };



  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }
      setIsUploading(true);
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `public/${fileName}`;

      const { data: { user } } = await supabase.auth.getUser();
      let userId = user?.id;
      if (!userId) userId = '00000000-0000-0000-0000-000000000000'; // Fallback

      // Upload to Supabase
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      console.log('Avatar uploaded:', publicUrl);

      // Update Profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl, updated_at: new Date() })
        .eq('id', userId);

      if (updateError) throw updateError;
      
      // Update Local State directly for immediate feedback
      setProfileData({ ...profileData, avatar_url: publicUrl });
      
      // Notify parent to refresh global state
      if (onProfileUpdate) onProfileUpdate();

      alert('Foto de perfil atualizada!');

    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Erro ao fazer upload da imagem. Verifique se o arquivo é menor que 2MB.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      console.log('DEBUG: handleSaveProfile started');
      const { data: { user } } = await supabase.auth.getUser();
      console.log('DEBUG: Auth User:', user);
      
      let userId = user?.id;
      if (!userId) {
          console.warn('DEBUG: No user found, using fallback ID');
          // Fallback for preview/testing
          userId = '00000000-0000-0000-0000-000000000000';
      }
      console.log('DEBUG: Target User ID:', userId);

      const updates = {
          telefone: profileData.telefone,
          banco: profileData.banco,
          agencia: profileData.agencia,
          conta_corrente: profileData.conta, // mapped to conta_corrente in DB
          updated_at: new Date(),
      };
      
      console.log('DEBUG: Updates payload:', updates);

      const { error, count, data } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select(); // Select to see returned data

      console.log('DEBUG: Update Result:', { error, count, data });

      if (error) throw error;
      
      if (data && data.length === 0) {
          console.warn('DEBUG: Update succeeded but no rows returned. RLS might be blocking access or ID mismatch.');
          alert('Atenção: Dados salvos mas não confirmados (RLS?). Recarregue para verificar.');
      } else {
          // Notify parent to refresh global state
          if (onProfileUpdate) onProfileUpdate();
          alert('Dados atualizados com sucesso!');
      }
      
      setIsEditing(false);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      alert('Erro ao atualizar dados. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderProfile = () => (
    <div className="p-10 max-w-[1400px] mx-auto space-y-8 animate-in fade-in pb-32">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">
            {profileTab === 'DADOS' ? 'Dados Cadastrais' : 'Documentação e Ajuda'}
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-3 flex items-center gap-2 italic">
            <Info size={14} className="text-blue-500" /> 
            {profileTab === 'DADOS' 
              ? 'Mantenha seus dados sempre atualizados para emissão de documentos.' 
              : 'Manuais, guias e orientações para servidores supridos.'}
          </p>
        </div>
        <button onClick={() => setCurrentView('DASHBOARD')} className="flex items-center gap-2 px-8 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 shadow-sm transition-all">
          <ArrowLeft size={16} /> Voltar ao Painel
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 flex mb-8 overflow-x-auto">
        <button 
          onClick={() => setProfileTab('DADOS')} 
          className={`flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${profileTab === 'DADOS' ? 'bg-slate-100 text-slate-900 shadow-inner' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
        >
          <UserCircle size={18} className={profileTab === 'DADOS' ? 'text-blue-600' : ''} /> Meus Dados
        </button>
        <button 
          onClick={() => setProfileTab('DOCS')} 
          className={`flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${profileTab === 'DOCS' ? 'bg-slate-100 text-slate-900 shadow-inner' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
        >
          <BookOpen size={18} className={profileTab === 'DOCS' ? 'text-blue-600' : ''} /> Documentação
        </button>
      </div>

      {/* DOCS Tab Content */}
      {profileTab === 'DOCS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: 'Como Criar uma Solicitação', desc: 'Passo a passo para registrar uma nova solicitação de suprimento de fundos', icon: PlusCircle, color: 'blue' },
              { title: 'Prestação de Contas', desc: 'Como realizar a prestação de contas corretamente e evitar pendências', icon: FileText, color: 'emerald' },
              { title: 'Sessão de Júri', desc: 'Guia completo para solicitações de suprimento em sessões de júri popular', icon: Gavel, color: 'amber' },
              { title: 'Prazos e SLAs', desc: 'Entenda os prazos para cada etapa do processo de suprimento', icon: Clock, color: 'purple' },
              { title: 'Elementos de Despesa', desc: 'Conheça os códigos e tipos de despesas aceitos no sistema', icon: DollarSign, color: 'indigo' },
              { title: 'Perguntas Frequentes', desc: 'Respostas para as dúvidas mais comuns dos servidores supridos', icon: ShieldCheck, color: 'slate' },
            ].map((doc, i) => (
              <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group">
                <div className={`p-3 bg-${doc.color}-50 rounded-xl text-${doc.color}-600 w-fit mb-4 group-hover:scale-110 transition-transform`}>
                  <doc.icon size={24} />
                </div>
                <h4 className="font-bold text-slate-800 text-sm mb-1">{doc.title}</h4>
                <p className="text-xs text-slate-500">{doc.desc}</p>
              </div>
            ))}
          </div>
          
          {/* Quick Links Section */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl text-white shadow-xl">
            <h3 className="text-xl font-black mb-4">Links Úteis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a href="#" className="flex items-center gap-3 p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-all">
                <Scale size={20} />
                <div>
                  <h4 className="font-bold text-sm">Lei 4.320/64</h4>
                  <p className="text-xs text-white/70">Normas de Direito Financeiro</p>
                </div>
              </a>
              <a href="#" className="flex items-center gap-3 p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-all">
                <Building2 size={20} />
                <div>
                  <h4 className="font-bold text-sm">Regulamento Interno TJPA</h4>
                  <p className="text-xs text-white/70">Normas para Suprimento de Fundos</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* DADOS Tab Content */}
      {profileTab === 'DADOS' && (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Status & Photo */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex flex-col items-center text-center">
             {/* Photo */}
             <div className="relative mb-6">
               <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleAvatarUpload} 
                  accept="image/*" 
                  className="hidden" 
               />
               <img 
                  src={profileData.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileData.nome}`} 
                  className="w-48 h-48 rounded-[40px] border-4 border-white shadow-2xl bg-blue-50 object-cover" 
                  alt="Avatar"
               />
               <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="absolute bottom-2 right-2 p-3 bg-slate-900 text-white rounded-2xl shadow-lg border-2 border-white hover:bg-blue-600 transition-colors disabled:opacity-50"
               >
                  {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
               </button>
             </div>
             <h3 className="text-lg font-black text-slate-800">{profileData.nome}</h3>
             <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{profileData.cargo}</p>
          </div>
          
          <div className="bg-blue-600 p-10 rounded-[40px] text-white shadow-2xl shadow-blue-200 relative overflow-hidden group">
            <div className="flex items-center gap-4 mb-6"><div className="p-3 bg-white/20 rounded-2xl"><ShieldCheck size={24}/></div><h4 className="text-xs font-black uppercase tracking-widest">Status Cadastral</h4></div>
            <h3 className="text-3xl font-black tracking-tight mb-2">Regular</h3>
            <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Última Validação: {profileData.updated_at ? new Date(profileData.updated_at).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>

        {/* Right Column: Forms */}
        <div className="lg:col-span-8 space-y-8">
          {/* Personal Info */}
          <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm space-y-8">
             <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-100 text-slate-600 rounded-2xl"><UserCircle size={24}/></div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Informações Pessoais</h3>
                </div>
                {!isEditing ? (
                    <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 hover:text-blue-600 transition-all">
                        <Edit size={16} /> Editar
                    </button>
                ) : (
                    <div className="flex items-center gap-2">
                        <button onClick={() => setIsEditing(false)} className="px-6 py-3 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">
                           Cancelar
                        </button>
                        <button onClick={handleSaveProfile} disabled={isSaving} className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 shadow-lg shadow-emerald-200 transition-all disabled:opacity-50">
                           {isSaving ? <Loader2 className="animate-spin" size={16}/> : <CheckCircle2 size={16} />} Salvar
                        </button>
                    </div>
                )}
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 opacity-60">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CPF (Somente Leitura)</label>
                   <div className="relative">
                      <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input type="text" readOnly value={profileData.cpf} className="w-full pl-12 pr-4 py-4 bg-slate-100 border border-slate-200 rounded-2xl font-bold text-slate-500 text-sm focus:outline-none cursor-not-allowed" />
                   </div>
                </div>
                <div className="space-y-2 opacity-60">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Matrícula (Somente Leitura)</label>
                   <div className="relative">
                      <BadgeCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input type="text" readOnly value={profileData.matricula} className="w-full pl-12 pr-4 py-4 bg-slate-100 border border-slate-200 rounded-2xl font-bold text-slate-500 text-sm focus:outline-none cursor-not-allowed" />
                   </div>
                </div>
                <div className="col-span-2 space-y-2 opacity-60">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Institucional</label>
                   <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Send size={16} /></div>
                      <input type="text" readOnly value={profileData.email} className="w-full pl-12 pr-4 py-4 bg-slate-100 border border-slate-200 rounded-2xl font-bold text-slate-500 text-sm focus:outline-none cursor-not-allowed" />
                   </div>
                </div>
                <div className="col-span-2 space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Telefone / WhatsApp</label>
                   <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><UserCheck size={16} /></div>
                      <input 
                        type="text" 
                        readOnly={!isEditing}
                        value={profileData.telefone || ''} 
                        onChange={(e) => setProfileData({...profileData, telefone: e.target.value})}
                        className={`w-full pl-12 pr-4 py-4 border rounded-2xl font-bold text-sm focus:outline-none transition-all ${isEditing ? 'bg-white border-blue-300 ring-4 ring-blue-50 text-slate-800' : 'bg-slate-50 border-slate-200 text-slate-700'}`} 
                        placeholder="(00) 00000-0000"
                      />
                   </div>
                </div>
                <div className="col-span-2 space-y-2 opacity-60">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lotação</label>
                   <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input type="text" readOnly value={profileData.lotacao} className="w-full pl-12 pr-4 py-4 bg-slate-100 border border-slate-200 rounded-2xl font-bold text-slate-500 text-sm focus:outline-none cursor-not-allowed" />
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
                      <input 
                        type="text" 
                        readOnly={!isEditing}
                        value={profileData.banco} 
                        onChange={(e) => setProfileData({...profileData, banco: e.target.value})}
                        className={`w-full pl-12 pr-4 py-4 border rounded-2xl font-bold text-sm focus:outline-none transition-all ${isEditing ? 'bg-white border-emerald-300 ring-4 ring-emerald-50 text-slate-800' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                      />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Agência</label>
                   <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="text" 
                        readOnly={!isEditing}
                        value={profileData.agencia} 
                        onChange={(e) => setProfileData({...profileData, agencia: e.target.value})}
                        className={`w-full pl-12 pr-4 py-4 border rounded-2xl font-bold text-sm focus:outline-none transition-all ${isEditing ? 'bg-white border-emerald-300 ring-4 ring-emerald-50 text-slate-800' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                      />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Conta Corrente</label>
                   <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="text" 
                        readOnly={!isEditing}
                        value={profileData.conta} 
                        onChange={(e) => setProfileData({...profileData, conta: e.target.value})}
                        className={`w-full pl-12 pr-4 py-4 border rounded-2xl font-bold text-sm focus:outline-none transition-all ${isEditing ? 'bg-white border-emerald-300 ring-4 ring-emerald-50 text-slate-800' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                      />
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
        </div>

        {/* Action Button - Only show if not editing, or keep as separate action? 
            Original logic had this button. Since we added Edit button in header, 
            maybe we hide this one or keep it for "request update" flow?
            Let's keep it but maybe conditional. Ideally, if editing, we hide it.
        */}
       
      </div>
      )}
    </div>
  );

  // Edit form for returned processes - allows editing values, dates, description
  const renderEditForm = () => {
    if (!selectedProcess) return null;
    const p = selectedProcess;
    
    return (
      <div className="p-10 max-w-[1200px] mx-auto space-y-8 animate-in fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => { setCurrentView('VIEW_DETAILS'); setIsInEditMode(false); }} 
              className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-blue-600 transition-all shadow-sm"
            >
              <ArrowLeft size={28} />
            </button>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">Editar Solicitação</h1>
              <p className="text-slate-500 text-sm font-medium mt-1 flex items-center gap-2">
                <Edit size={14} className="text-amber-600" /> Modo de edição - {p.nup}
              </p>
            </div>
          </div>
          <span className="px-4 py-2 bg-amber-100 text-amber-700 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <AlertTriangle size={14} /> Processo Devolvido
          </span>
        </div>

        {/* Devolution Reason Banner */}
        {lastDevolutionReason && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h4 className="text-sm font-black text-red-800 uppercase tracking-tight">Motivo da Devolução:</h4>
                <p className="text-sm font-bold text-red-900 mt-1">{lastDevolutionReason}</p>
              </div>
            </div>
          </div>
        )}

        {/* Editable Form Fields */}
        <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm p-10 space-y-8">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><Edit size={24}/></div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Dados da Solicitação</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Value */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor Solicitado (R$)</label>
              <input 
                type="number" 
                step="0.01"
                value={p.val || 0}
                onChange={(e) => setSelectedProcess({...p, val: parseFloat(e.target.value) || 0})}
                className="w-full px-6 py-4 border border-amber-200 rounded-2xl font-bold text-lg bg-amber-50 focus:outline-none focus:ring-4 focus:ring-amber-100 focus:border-amber-400 transition-all"
              />
            </div>

            {/* Type (readonly) */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo</label>
              <input 
                type="text" 
                value={p.type || 'Extra-Emergencial'}
                readOnly
                className="w-full px-6 py-4 border border-slate-200 rounded-2xl font-bold text-lg bg-slate-50 text-slate-600"
              />
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data Início</label>
              <input 
                type="date" 
                value={p.startDate || ''}
                onChange={(e) => setSelectedProcess({...p, startDate: e.target.value})}
                className="w-full px-6 py-4 border border-amber-200 rounded-2xl font-bold text-sm bg-amber-50 focus:outline-none focus:ring-4 focus:ring-amber-100 focus:border-amber-400 transition-all"
              />
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data Fim</label>
              <input 
                type="date" 
                value={p.endDate || ''}
                onChange={(e) => setSelectedProcess({...p, endDate: e.target.value})}
                className="w-full px-6 py-4 border border-amber-200 rounded-2xl font-bold text-sm bg-amber-50 focus:outline-none focus:ring-4 focus:ring-amber-100 focus:border-amber-400 transition-all"
              />
            </div>
          </div>

          {/* Expense Items Section */}
          <div className="space-y-4 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Elementos de Despesa</label>
              <button 
                onClick={() => {
                  const newItem = { id: Date.now().toString(), element: '3.3.90.30.01', desc: '', qty: 1, val: 0 };
                  setSelectedProcess({...p, items: [...(p.items || []), newItem]});
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 transition-all"
              >
                <Plus size={14} /> Adicionar Item
              </button>
            </div>
            
            {(p.items && p.items.length > 0) ? (
              <div className="space-y-3">
                {p.items.map((item: any, idx: number) => (
                  <div key={item.id || idx} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <select 
                      value={item.element || '3.3.90.30.01'}
                      onChange={(e) => {
                        const updated = [...p.items];
                        updated[idx] = {...item, element: e.target.value};
                        setSelectedProcess({...p, items: updated});
                      }}
                      className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {expenseElements.map(el => (
                        <option key={el.code} value={el.code}>{el.code} - {el.label}</option>
                      ))}
                    </select>
                    <input 
                      type="text"
                      placeholder="Descrição"
                      value={item.desc || ''}
                      onChange={(e) => {
                        const updated = [...p.items];
                        updated[idx] = {...item, desc: e.target.value};
                        setSelectedProcess({...p, items: updated});
                      }}
                      className="w-40 px-4 py-3 border border-slate-200 rounded-xl text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input 
                      type="number"
                      placeholder="Qtd"
                      value={item.qty || 1}
                      onChange={(e) => {
                        const updated = [...p.items];
                        updated[idx] = {...item, qty: parseInt(e.target.value) || 1};
                        setSelectedProcess({...p, items: updated});
                      }}
                      className="w-20 px-4 py-3 border border-slate-200 rounded-xl text-xs font-bold bg-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input 
                      type="number"
                      step="0.01"
                      placeholder="Valor"
                      value={item.val || 0}
                      onChange={(e) => {
                        const updated = [...p.items];
                        updated[idx] = {...item, val: parseFloat(e.target.value) || 0};
                        // Recalculate total
                        const newTotal = updated.reduce((acc, i) => acc + ((i.qty || 1) * (i.val || 0)), 0);
                        setSelectedProcess({...p, items: updated, val: newTotal});
                      }}
                      className="w-28 px-4 py-3 border border-slate-200 rounded-xl text-xs font-bold bg-white text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="w-28 text-right font-black text-sm text-slate-700">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((item.qty || 1) * (item.val || 0))}
                    </span>
                    <button 
                      onClick={() => {
                        const updated = p.items.filter((_: any, i: number) => i !== idx);
                        const newTotal = updated.reduce((acc: number, i: any) => acc + ((i.qty || 1) * (i.val || 0)), 0);
                        setSelectedProcess({...p, items: updated, val: newTotal});
                      }}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {/* Total Row */}
                <div className="flex justify-end items-center gap-4 p-4 bg-blue-50 rounded-2xl border border-blue-200">
                  <span className="text-xs font-black text-blue-600 uppercase tracking-widest">Total:</span>
                  <span className="text-lg font-black text-blue-700">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.val || 0)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center">
                <p className="text-sm text-slate-400">Nenhum item de despesa adicionado.</p>
                <p className="text-xs text-slate-300 mt-1">Clique em "Adicionar Item" para incluir elementos de despesa.</p>
              </div>
            )}
          </div>

          {/* Description/Justification with AI Button */}
          <div className="space-y-2 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Justificativa / Descrição</label>
              <button 
                disabled={isGeneratingAi}
                onClick={() => handleAiJustification()}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl text-xs font-bold hover:from-purple-600 hover:to-indigo-700 shadow-lg transition-all disabled:opacity-50"
              >
                {isGeneratingAi ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} 
                {isGeneratingAi ? 'Gerando...' : 'Gerar com IA'}
              </button>
            </div>
            <textarea 
              value={p.desc || ''}
              onChange={(e) => setSelectedProcess({...p, desc: e.target.value})}
              rows={5}
              className="w-full px-6 py-4 border border-amber-200 rounded-2xl font-medium text-sm bg-amber-50 focus:outline-none focus:ring-4 focus:ring-amber-100 focus:border-amber-400 transition-all resize-none"
              placeholder="Descreva a justificativa para esta solicitação..."
            />
          </div>

          {/* Urgency */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Urgência</label>
            <select 
              value={p.urgency || 'NORMAL'}
              onChange={(e) => setSelectedProcess({...p, urgency: e.target.value})}
              className="w-full px-6 py-4 border border-amber-200 rounded-2xl font-bold text-sm bg-amber-50 focus:outline-none focus:ring-4 focus:ring-amber-100 focus:border-amber-400 transition-all cursor-pointer"
            >
              <option value="NORMAL">Normal</option>
              <option value="URGENTE">Urgente</option>
              <option value="EMERGENCIAL">Emergencial</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4">
          <button 
            onClick={() => { setCurrentView('VIEW_DETAILS'); setIsInEditMode(false); }}
            className="flex items-center gap-2 px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-50 transition-all"
          >
            <X size={18} /> Cancelar
          </button>
          
          <div className="flex items-center gap-4">
            <button 
              disabled={isSavingDoc}
              onClick={async () => {
                setIsSavingDoc(true);
                try {
                  console.log('[SAVE] Saving process:', p.id, p);
                  
                  // Prepare update data
                  const updateData: any = {
                    valor_solicitado: p.val || 0,
                    descricao: p.desc || '',
                    urgencia: p.urgency || 'NORMAL'
                  };
                  
                  // Only add dates if they exist and are valid
                  if (p.startDate) updateData.data_inicio = p.startDate;
                  if (p.endDate) updateData.data_fim = p.endDate;
                  
                  // Add items if they exist (stored as JSON)
                  if (p.items && p.items.length > 0) {
                    updateData.itens_despesa = JSON.stringify(p.items);
                  }
                  
                  console.log('[SAVE] Update data:', updateData);
                  
                  const { data, error } = await supabase
                    .from('solicitacoes')
                    .update(updateData)
                    .eq('id', p.id)
                    .select();
                  
                  console.log('[SAVE] Result:', { data, error });
                  
                  if (error) {
                    console.error('[SAVE] Error:', error);
                    alert('Erro ao salvar: ' + error.message);
                  } else {
                    alert('✅ Alterações salvas com sucesso!');
                    await refreshHistory();
                  }
                } catch (err) {
                  console.error('[SAVE] Exception:', err);
                  alert('Erro inesperado: ' + (err as Error).message);
                } finally {
                  setIsSavingDoc(false);
                }
              }}
              className="flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSavingDoc ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} 
              {isSavingDoc ? 'Salvando...' : 'Salvar Alterações'}
            </button>
            
            <button 
              onClick={() => {
                setIsInEditMode(false);
                setCurrentView('VIEW_DETAILS');
                setShowTramitarModal(true);
              }}
              className="flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-emerald-700 shadow-lg transition-all"
            >
              <Send size={18} /> Reencaminhar ao Gestor
            </button>
          </div>
        </div>
      </div>
    );
  };

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

  return (
    <div className="h-full bg-[#f8fafc] overflow-y-auto custom-scrollbar overflow-x-hidden">
      {(isLoading || !profileData) ? (
          <div className="flex h-screen items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600" size={48} /></div>
      ) : (
          <>
            {currentView === 'DASHBOARD' && renderDashboard()}
            {currentView === 'SELECT_TYPE' && renderSelectType()}
            {currentView === 'FORM' && renderForm()}
            {currentView === 'EDIT_FORM' && renderEditForm()}
            {currentView === 'PROFILE' && renderProfile()}
            {currentView === 'VIEW_DETAILS' && renderProcessDetails()}
          </>
      )}

      {/* Limit Exceeded Notification Modal */}
      {showLimitExceededAlert && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-xl">
                  <AlertTriangle size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Limite Máximo Atingido</h3>
                  <p className="text-amber-100 text-sm">
                    {limitExceededType === 'participante' ? 'Quantidade de participantes' : 'Valor de refeição'}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-amber-800 text-sm leading-relaxed">
                  O valor ou quantidade informada <strong>excede o limite máximo</strong> estabelecido para solicitações de Sessão de Júri.
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                  <FileText size={16} className="text-blue-600" />
                  Para solicitar quantidade/valor superior:
                </h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  O <strong>Magistrado (Gestor Responsável pela Comarca)</strong> deverá encaminhar, junto com a Solicitação normal, um <strong>pedido complementar formal</strong> contendo justificativa detalhada, endereçado para:
                </p>
                <ul className="mt-3 space-y-2">
                  <li className="flex items-center gap-2 text-sm text-slate-700">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <strong>SOSFU</strong> – Seção de Suprimento de Fundos
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-700">
                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    <strong>Ordenador de Despesa da SEPLAN</strong>
                  </li>
                </ul>
              </div>
            </div>
            <div className="p-6 pt-0 flex justify-end">
              <button 
                onClick={() => setShowLimitExceededAlert(false)}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tramitar Modal */}
      {selectedProcess && (
        <TramitarModal
          isOpen={showTramitarModal}
          onClose={() => setShowTramitarModal(false)}
          processId={selectedProcess.id}
          processNup={selectedProcess.nup}
          currentStatus={selectedProcess.status || 'RASCUNHO'}
          currentModule="SUPRIDO"
          onSuccess={() => {
            refreshHistory();
            setCurrentView('DASHBOARD');
            setSelectedProcess(null);
          }}
        />
      )}
    </div>
  );
};