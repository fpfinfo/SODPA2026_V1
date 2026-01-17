import React, { useState, useEffect } from 'react';
import { 
  FileSearch, 
  CheckCircle2, 
  Clock, 
  ArrowLeft, 
  Gavel, 
  BadgeCheck, 
  Send, 
  Save, 
  Eye, 
  Plus, 
  ChevronLeft, 
  BookOpen, 
  FileCode, 
  FileText,
  History as HistoryIcon,
  TableOfContents,
  FileSearch as FileSearchIcon,
  LayoutList,
  Scale,
  Signature,
  Printer,
  FileDown,
  RefreshCw,
  X,
  File as FileIcon,
  Info,
  ChevronDown,
  PieChart,
  BarChart3,
  AlertCircle,
  CheckSquare,
  ThumbsDown,
  Send as SendIcon,
  Edit,
  Trash2,
  Loader2
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { TramitarModal } from '../TramitarModal';
import { DocumentCreationWizard } from '../DocumentCreationWizard';
import { useToast } from '../ui/ToastProvider';
import { TimelineHistory } from '../TimelineHistory';

const BRASAO_TJPA_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/217479058_brasao-tjpa.png';

type GestorView = 'LIST' | 'DETAILS' | 'EDIT_DOC' | 'HISTORY';
type SubViewMode = 'DETAILS' | 'DOSSIER' | 'COVER' | 'REQUEST' | 'HISTORY';

interface DocPiece {
  id: string;
  num: string;
  title: string;
  desc: string;
  icon: any;
  key: string;
  content?: string;
  type?: string;
  author?: string;
  date?: string;
}

export const GestorDashboard: React.FC = () => {
  const [view, setView] = useState<GestorView>('LIST');
  const [subView, setSubView] = useState<SubViewMode>('DETAILS');
  const [selectedProcess, setSelectedProcess] = useState<any>(null);
  const [editingDoc, setEditingDoc] = useState<Partial<DocPiece> | null>(null);
  
  // UX State
  const [filterType, setFilterType] = useState<'ALL' | 'JURI' | 'EXTRA'>('ALL');
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'SOSFU' | 'SUPRIDO'>('ALL');
  
  // Compliance Checklist State
  const [checklist, setChecklist] = useState({
    budgetAvailable: false,
    publicInterest: false,
    emergencyJustified: false,
    itemsReviewed: false
  });

  // Tramitar Modal state
  const [showTramitarModal, setShowTramitarModal] = useState(false);
  const [tramitationType, setTramitationType] = useState<'forward' | 'return'>('forward');

  // Real processes from Supabase
  const [pendingProcesses, setPendingProcesses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // KPI Counts
  const [atestadosNoMes, setAtestadosNoMes] = useState(0);
  const [devolucoes, setDevolucoes] = useState(0);
  
  // History data
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  // Document Wizard state
  const [showDocumentWizard, setShowDocumentWizard] = useState(false);
  
  // Dossier documents from Supabase
  const [dossierDocs, setDossierDocs] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  
  // Document viewer state
  const [viewingDoc, setViewingDoc] = useState<any>(null);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // Toast hook
  const { showToast } = useToast();
  
  // Tramitacao History state (for audit log)
  const [tramitacaoHistory, setTramitacaoHistory] = useState<any[]>([]);
  
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
      
      if (data) setTramitacaoHistory(data);
    } catch (err) {
      console.error('Error in fetchTramitacaoHistory:', err);
    }
  };
  
  // Expense Elements for description lookup
  const [expenseElements, setExpenseElements] = useState<{code: string; label: string}[]>([]);
  
  // Helper: Get element description from code
  const getElementDescription = (code: string, fallbackDesc?: string) => {
    const element = expenseElements.find(el => el.code === code);
    return element?.label || fallbackDesc || code || 'Item';
  };

  // Fetch pending processes from Supabase
  const fetchPendingProcesses = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('solicitacoes')
        .select(`
          id,
          nup,
          tipo,
          valor_solicitado,
          status,
          descricao,
          created_at,
          itens_despesa,
          juri_participantes,
          user_id,
          profiles!solicitacoes_user_id_fkey (
            nome
          )
        `)
        .eq('status', 'PENDENTE ATESTO')
        .eq('destino_atual', 'GESTOR')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data for display
      const transformed = ((data || []) as any[]).map(s => {
        const profileName = Array.isArray(s.profiles) 
          ? s.profiles[0]?.nome 
          : s.profiles?.nome;
        return {
          id: s.id,
          nup: s.nup,
          type: s.tipo === 'JURI' ? 'SESSÃO DE JÚRI' : 'EXTRA-EMERGENCIAL',
          interested: profileName || 'N/A',
          val: s.valor_solicitado || 0,
          date: new Date(s.created_at).toLocaleDateString('pt-BR'),
          status: s.status,
          desc: s.descricao || 'Sem descrição',
          // Store full item objects for display
          items: s.itens_despesa || [],
          rawData: s // Keep raw data for debugging
        };
      });

      setPendingProcesses(transformed);
    } catch (error) {
      console.error('Error fetching pending processes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch KPI counts for Atestados no Mês and Devoluções
  const fetchKPICounts = async () => {
    try {
      // Get first day of current month
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // Count processes that passed through GESTOR and moved to SOSFU (Atestados)
      const { count: atestadosCount, error: atestadosError } = await supabase
        .from('historico_tramitacao')
        .select('*', { count: 'exact', head: true })
        .eq('origem', 'GESTOR')
        .eq('destino', 'SOSFU')
        .gte('data_tramitacao', firstDayOfMonth);

      if (!atestadosError && atestadosCount !== null) {
        setAtestadosNoMes(atestadosCount);
      }

      // Count devolutions (processes returned from GESTOR to SUPRIDO)
      const { count: devolucoesCount, error: devolucoesError } = await supabase
        .from('historico_tramitacao')
        .select('*', { count: 'exact', head: true })
        .eq('origem', 'GESTOR')
        .eq('destino', 'SUPRIDO')
        .gte('data_tramitacao', firstDayOfMonth);

      if (!devolucoesError && devolucoesCount !== null) {
        setDevolucoes(devolucoesCount);
      }
    } catch (error) {
      console.error('Error fetching KPI counts:', error);
    }
  };

  // Fetch history of tramitations from GESTOR
  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('historico_tramitacao')
        .select(`
          id,
          origem,
          destino,
          status_anterior,
          status_novo,
          observacao,
          data_tramitacao,
          solicitacao_id,
          solicitacoes!historico_tramitacao_solicitacao_id_fkey (
            nup,
            tipo,
            valor_solicitado,
            profiles!solicitacoes_user_id_fkey (
              nome
            )
          )
        `)
        .eq('origem', 'GESTOR')
        .order('data_tramitacao', { ascending: false })
        .limit(50);

      if (error) throw error;

      const transformed = ((data || []) as any[]).map(h => ({
        id: h.id,
        nup: h.solicitacoes?.nup || 'N/A',
        tipo: h.solicitacoes?.tipo || 'N/A',
        valor: h.solicitacoes?.valor_solicitado || 0,
        interessado: h.solicitacoes?.profiles?.nome || 'N/A',
        destino: h.destino,
        statusNovo: h.status_novo,
        observacao: h.observacao,
        data: new Date(h.data_tramitacao).toLocaleDateString('pt-BR'),
        hora: new Date(h.data_tramitacao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      }));

      setHistoryData(transformed);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Combined refresh function for ATUALIZAR button
  const refreshAll = () => {
    fetchPendingProcesses();
    fetchKPICounts();
  };

  // Fetch expense elements for description lookup
  const fetchExpenseElements = async () => {
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
    }
  };

  // Fetch dossier documents from Supabase
  const fetchDossierDocs = async (processId: string) => {
    if (!processId) return;
    try {
      const { data, error } = await supabase
        .from('documentos')
        .select('*, profiles:created_by(nome, cargo)')
        .eq('solicitacao_id', processId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      if (data) setDossierDocs(data);
    } catch (error) {
      console.error('Error fetching dossier docs:', error);
    }
  };

  // Fetch current user on mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    };
    fetchCurrentUser();
  }, []);

  // Check if current user owns the document
  const isDocOwner = (doc: any) => doc.created_by === currentUserId;

  // Delete document with audit logging
  const handleDeleteDocument = async (docId: string) => {
    setDeletingDocId(docId);
    try {
      const docToDelete = dossierDocs.find(d => d.id === docId);
      
      // Log to audit trail
      await supabase.from('historico_documentos').insert({
        documento_id: docId,
        acao: 'DELETE',
        usuario_id: currentUserId,
        dados_anteriores: docToDelete
      });

      // Delete the document
      const { error } = await supabase
        .from('documentos')
        .delete()
        .eq('id', docId);

      if (error) throw error;
      
      // Refresh documents
      if (selectedProcess?.id) fetchDossierDocs(selectedProcess.id);
      showToast({ type: 'success', title: 'Documento excluído', message: 'Documento removido com sucesso.' });
    } catch (error) {
      console.error('Error deleting document:', error);
      showToast({ type: 'error', title: 'Erro', message: 'Não foi possível excluir o documento.' });
    } finally {
      setDeletingDocId(null);
    }
  };

  // Refresh dossier when switching to DOSSIER subview
  useEffect(() => {
    if (subView === 'DOSSIER' && selectedProcess?.id) {
      fetchDossierDocs(selectedProcess.id);
    }
    if (subView === 'HISTORY' && selectedProcess?.id) {
      fetchTramitacaoHistory(selectedProcess.id);
    }
  }, [subView, selectedProcess?.id]);
  
  // Also fetch tramitacao on process selection
  useEffect(() => {
    if (selectedProcess?.id) {
      fetchTramitacaoHistory(selectedProcess.id);
    }
  }, [selectedProcess?.id]);

  useEffect(() => {
    refreshAll();
    fetchExpenseElements();
  }, []);

  // Base static pieces + dynamic documents from dossierDocs
  const baseStaticPieces: DocPiece[] = [
    { id: '1', num: '01', title: 'Capa do Processo', desc: 'Identificação oficial.', icon: FileCode, key: 'COVER', 
      content: `PODER JUDICIÁRIO\nTRIBUNAL DE JUSTIÇA DO ESTADO DO PARÁ\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nNÚMERO ÚNICO DE PROTOCOLO\n${selectedProcess?.nup || 'N/A'}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nInteressado: ${selectedProcess?.interested || selectedProcess?.suprido_nome || 'N/A'}\nModalidade: ${selectedProcess?.type || selectedProcess?.tipo || 'EXTRA-EMERGENCIAL'}\nValor: R$ ${((selectedProcess?.value || selectedProcess?.valor_total || 0) / 100).toFixed(2).replace('.', ',')}\nData: ${selectedProcess?.date || new Date().toLocaleDateString('pt-BR')}`
    },
    { id: '2', num: '02', title: 'Requerimento Inicial', desc: 'Solicitação do servidor.', icon: FileText, key: 'REQUEST',
      content: `REQUERIMENTO DE SUPRIMENTO DE FUNDOS\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n1. DADOS DA SOLICITAÇÃO\n\nTipo: ${selectedProcess?.type || selectedProcess?.tipo || 'EXTRA-EMERGENCIAL'}\nNUP: ${selectedProcess?.nup || 'N/A'}\nData: ${selectedProcess?.date || new Date().toLocaleDateString('pt-BR')}\nValor Solicitado: R$ ${((selectedProcess?.value || selectedProcess?.valor_total || 0) / 100).toFixed(2).replace('.', ',')}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n2. JUSTIFICATIVA\n\n${selectedProcess?.descricao || selectedProcess?.description || 'Despesas emergenciais de pequeno vulto conforme regulamento interno.'}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n3. INTERESSADO\n\nNome: ${selectedProcess?.interested || selectedProcess?.suprido_nome || 'N/A'}\nUnidade: ${selectedProcess?.unit || selectedProcess?.unidade || 'N/A'}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nAssinado eletronicamente pelo servidor interessado.\nDocumento gerado pelo Sistema SISUP - TJPA.`
    }
  ];
  
  // Combine static pieces with dynamic dossier docs
  const processPieces = [
    ...baseStaticPieces,
    ...dossierDocs.map((doc, idx) => ({
      id: doc.id,
      num: String(baseStaticPieces.length + idx + 1).padStart(2, '0'),
      title: doc.nome || doc.titulo || 'Documento',
      desc: `${doc.tipo || 'DOCUMENTO'} - ${doc.status || 'MINUTA'}`,
      icon: doc.tipo === 'DECISAO' ? Gavel : FileText,
      key: 'DB_DOC',
      content: doc.conteudo,
      type: doc.tipo,
      author: doc.created_by,
      authorName: doc.profiles?.nome || 'Usuário',
      authorCargo: doc.profiles?.cargo || 'Servidor',
      date: doc.created_at ? new Date(doc.created_at).toLocaleDateString('pt-BR') : '',
      time: doc.created_at ? new Date(doc.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '',
      status: doc.status || 'MINUTA',
      signatureStatus: doc.signature_status,
      isOwner: doc.created_by === currentUserId
    }))
  ];

  // Check if process has Certidão de Atesto (enables Tramitar button)
  const hasAtesto = dossierDocs.some(doc => 
    doc.tipo === 'CERTIDAO_ATESTO' || 
    doc.tipo === 'CERTIDAO' ||
    doc.nome?.toLowerCase().includes('atesto') ||
    doc.titulo?.toLowerCase().includes('atesto')
  );
  const isChecklistComplete = Object.values(checklist).every(Boolean);

  const handleGenerateAtesto = () => {
    const template = {
      type: 'Certidão de Atesto',
      title: `Certidão de Atesto do Gestor Nº ${Math.floor(Math.random() * 100)}/2026`,
      content: `CERTIDÃO DE ATESTO DA CHEFIA IMEDIATA\n\nCERTIFICO, no uso das minhas atribuições legais e em conformidade com o Regulamento de Suprimento de Fundos do TJPA, que a despesa pretendida pelo servidor ${selectedProcess.interested} no processo ${selectedProcess.nup} reveste-se de interesse público e atende aos critérios de conveniência e oportunidade desta unidade judiciária.\n\nDeclaro que verifiquei a disponibilidade orçamentária da unidade e a adequação dos itens solicitados.\n\nAtesto, ainda, a impossibilidade de atendimento da demanda via fluxo normal de compras/licitação em tempo hábil.\n\nEncaminhe-se ao Serviço de Suprimento de Fundos (SOSFU) para análise técnica.`,
      icon: BadgeCheck
    };

    setEditingDoc({
      id: 'atesto-' + Date.now(),
      ...template,
      num: String(processPieces.length + 1).padStart(2, '0'),
      key: 'CUSTOM',
      author: 'Diogo Bonfim Fernandez (Gestor)',
      date: new Date().toLocaleDateString('pt-BR')
    });
    setView('EDIT_DOC');
  };

  const handleSaveAtesto = async () => {
    if (editingDoc && selectedProcess) {
      try {
        // Save the Atesto document to Supabase
        const { data: { user } } = await supabase.auth.getUser();
        
        const { error } = await supabase.from('documentos').insert({
          solicitacao_id: selectedProcess.id,
          nome: editingDoc.title,
          titulo: editingDoc.title,
          tipo: 'CERTIDAO_ATESTO',
          status: 'ASSINADO',
          conteudo: editingDoc.content,
          created_by: user?.id
        });

        if (error) throw error;

        // Refresh dossier docs to show the new document
        await fetchDossierDocs(selectedProcess.id);
        
        setView('DETAILS');
        setSubView('DOSSIER');
        setEditingDoc(null);
        
        showToast({ type: 'success', title: 'Certidão salva!', message: 'Certidão de Atesto salva com sucesso.' });
      } catch (error) {
        console.error('Error saving atesto:', error);
        showToast({ type: 'error', title: 'Erro ao salvar', message: 'Não foi possível salvar a Certidão de Atesto.' });
      }
    }
  };

  const handleForwardToSosfu = () => {
    if (!hasAtesto) {
      alert('É necessário gerar e assinar a Certidão de Atesto antes de tramitar para a SOSFU.');
      return;
    }
    setTramitationType('forward');
    setShowTramitarModal(true);
  };

  const handleReturnToSuprido = () => {
    setTramitationType('return');
    setShowTramitarModal(true);
  };

  const handleTramitacaoSuccess = () => {
    fetchPendingProcesses(); // Refetch from database
    fetchKPICounts(); // Update KPI counts
    setView('LIST');
    setSelectedProcess(null);
  };

  const toggleCheck = (key: keyof typeof checklist) => {
      setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderKPIs = () => (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div 
            onClick={() => { setView('LIST'); setHistoryFilter('ALL'); }}
            className={`p-6 rounded-[28px] border shadow-sm flex items-center justify-between group transition-all cursor-pointer relative overflow-hidden ${view === 'LIST' ? 'bg-blue-600 border-blue-600 ring-4 ring-blue-100' : 'bg-white border-slate-200 hover:border-blue-300'}`}
          >
              <div className="relative z-10">
                  <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${view === 'LIST' ? 'text-blue-200' : 'text-slate-400'}`}>Pendentes de Atesto</p>
                  <p className={`text-3xl font-black ${view === 'LIST' ? 'text-white' : 'text-slate-800'}`}>{pendingProcesses.length}</p>
              </div>
              <div className={`p-4 rounded-2xl transition-transform group-hover:scale-110 ${view === 'LIST' ? 'bg-blue-500/30 text-white' : 'bg-blue-50 text-blue-600'}`}><Clock size={24}/></div>
          </div>

          <div 
            onClick={() => { setView('HISTORY'); setHistoryFilter('SOSFU'); fetchHistory(); }}
            className={`p-6 rounded-[28px] border shadow-sm flex items-center justify-between group transition-all cursor-pointer relative overflow-hidden ${view === 'HISTORY' && historyFilter === 'SOSFU' ? 'bg-emerald-600 border-emerald-600 ring-4 ring-emerald-100' : 'bg-white border-slate-200 hover:border-emerald-300'}`}
          >
              <div className="relative z-10">
                  <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${view === 'HISTORY' && historyFilter === 'SOSFU' ? 'text-emerald-200' : 'text-slate-400'}`}>Atestados no Mês</p>
                  <p className={`text-3xl font-black ${view === 'HISTORY' && historyFilter === 'SOSFU' ? 'text-white' : 'text-slate-800'}`}>{atestadosNoMes}</p>
              </div>
              <div className={`p-4 rounded-2xl transition-transform group-hover:scale-110 ${view === 'HISTORY' && historyFilter === 'SOSFU' ? 'bg-emerald-500/30 text-white' : 'bg-emerald-50 text-emerald-600'}`}><BadgeCheck size={24}/></div>
          </div>

          <div 
            onClick={() => { setView('HISTORY'); setHistoryFilter('SUPRIDO'); fetchHistory(); }}
            className={`p-6 rounded-[28px] border shadow-sm flex items-center justify-between group transition-all cursor-pointer relative overflow-hidden ${view === 'HISTORY' && historyFilter === 'SUPRIDO' ? 'bg-red-600 border-red-600 ring-4 ring-red-100' : 'bg-white border-slate-200 hover:border-red-300'}`}
          >
              <div className="relative z-10">
                  <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${view === 'HISTORY' && historyFilter === 'SUPRIDO' ? 'text-red-200' : 'text-slate-400'}`}>Devoluções</p>
                  <p className={`text-3xl font-black ${view === 'HISTORY' && historyFilter === 'SUPRIDO' ? 'text-white' : 'text-slate-800'}`}>{devolucoes}</p>
              </div>
              <div className={`p-4 rounded-2xl transition-transform group-hover:scale-110 ${view === 'HISTORY' && historyFilter === 'SUPRIDO' ? 'bg-red-500/30 text-white' : 'bg-red-50 text-red-600'}`}><ThumbsDown size={24}/></div>
          </div>
      </div>
  );

  // Render History View
  const renderHistory = () => (
    <div className="p-10 max-w-[1400px] mx-auto space-y-8 animate-in fade-in pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Histórico de Tramitações</h1>
          <p className="text-slate-500 text-sm font-medium mt-1 flex items-center gap-2">
             <HistoryIcon size={16} className="text-blue-600"/> Processos atestados e devolvidos
          </p>
        </div>
        <div className="flex gap-3">
            <button onClick={() => setView('LIST')} className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                <ArrowLeft size={16}/> Voltar
            </button>
            <button onClick={fetchHistory} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center gap-2">
                <RefreshCw size={16} className={isLoadingHistory ? 'animate-spin' : ''}/> Atualizar
            </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-emerald-50 p-6 rounded-[28px] border border-emerald-200 flex items-center justify-between">
              <div>
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Enviados para SOSFU</p>
                  <p className="text-3xl font-black text-emerald-700">{historyData.filter(h => h.destino === 'SOSFU').length}</p>
              </div>
              <div className="p-4 bg-emerald-100 text-emerald-600 rounded-2xl"><BadgeCheck size={24}/></div>
          </div>
          <div className="bg-red-50 p-6 rounded-[28px] border border-red-200 flex items-center justify-between">
              <div>
                  <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Devolvidos ao Suprido</p>
                  <p className="text-3xl font-black text-red-700">{historyData.filter(h => h.destino === 'SUPRIDO').length}</p>
              </div>
              <div className="p-4 bg-red-100 text-red-600 rounded-2xl"><ThumbsDown size={24}/></div>
          </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Registro de Tramitações</h3>
        </div>
        {isLoadingHistory ? (
          <div className="p-20 text-center">
            <RefreshCw size={32} className="mx-auto text-blue-500 animate-spin mb-4" />
            <p className="text-sm text-slate-500">Carregando histórico...</p>
          </div>
        ) : historyData.length === 0 ? (
          <div className="p-20 text-center opacity-50">
            <HistoryIcon size={64} className="mx-auto text-slate-400 mb-4" />
            <p className="text-xl font-black uppercase text-slate-900">Sem Registros</p>
            <p className="text-sm">Nenhuma tramitação realizada ainda.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {historyData
              .filter(h => {
                if (historyFilter === 'ALL') return true;
                return h.destino === historyFilter;
              })
              .map(h => (
              <div key={h.id} className="p-6 hover:bg-slate-50 transition-all">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${h.destino === 'SOSFU' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                      {h.destino === 'SOSFU' ? <BadgeCheck size={20}/> : <ThumbsDown size={20}/>}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase">{h.nup}</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded ${h.destino === 'SOSFU' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {h.destino === 'SOSFU' ? 'ATESTADO' : 'DEVOLVIDO'}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">{h.tipo}</h4>
                      <p className="text-xs text-slate-500">{h.interessado}</p>
                      {h.observacao && (
                        <p className="text-xs text-slate-400 italic mt-2">"{h.observacao}"</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-800">{h.data}</p>
                    <p className="text-[10px] text-slate-400">{h.hora}</p>
                    <p className="text-sm font-black text-slate-700 mt-2">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(h.valor)}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* HISTORY SubView - Histórico / Auditoria */}
            {subView === 'HISTORY' && (
               <div className="max-w-5xl mx-auto pb-32 animate-in fade-in space-y-8">
                  <div className="bg-slate-900 rounded-[48px] p-10 text-white shadow-2xl flex items-center justify-between relative overflow-hidden group">
                     <div className="relative z-10">
                        <h3 className="text-3xl font-black tracking-tighter">Histórico de Tramitação</h3>
                        <p className="text-slate-400 text-sm font-medium mt-1">Audit log completo das alterações de estado.</p>
                     </div>
                     <button className="relative z-10 flex items-center gap-3 px-10 py-5 bg-white text-slate-900 rounded-[24px] text-[10px] font-black uppercase tracking-widest shadow-xl">
                        <Printer size={18} /> Imprimir Relatório
                     </button>
                     <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000"><Clock size={200}/></div>
                  </div>

                  <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
                     <TimelineHistory events={tramitacaoHistory} />
                  </div>
               </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderList = () => {
    const filteredProcesses = pendingProcesses.filter(p => {
      if (filterType === 'ALL') return true;
      if (filterType === 'JURI') return p.type === 'SESSÃO DE JÚRI';
      if (filterType === 'EXTRA') return p.type === 'EXTRA-EMERGENCIAL';
      return true;
    });

    return (
    <div className="p-10 max-w-[1400px] mx-auto space-y-8 animate-in fade-in pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Módulo do Gestor</h1>
          <p className="text-slate-500 text-sm font-medium mt-1 flex items-center gap-2">
             <BadgeCheck size={16} className="text-blue-600"/> Homologação e Controle de Suprimentos
          </p>
        </div>
        <div className="flex gap-3">
            <button onClick={() => { fetchHistory(); setView('HISTORY'); setHistoryFilter('ALL'); }} className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                <HistoryIcon size={16}/> Histórico
            </button>
            <button 
              onClick={() => setShowDocumentWizard(true)} 
              disabled={!selectedProcess}
              className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Plus size={16}/> Novo
            </button>
            <button onClick={refreshAll} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center gap-2">
                <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''}/> Atualizar
            </button>
        </div>
      </div>

      {renderKPIs()}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest ml-1">Fila de Homologação</h3>
          
          {/* Filter Pills */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
             <button 
                onClick={() => setFilterType('ALL')}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${filterType === 'ALL' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
                Todos
             </button>
             <button 
                onClick={() => setFilterType('JURI')}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${filterType === 'JURI' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
                Júri
             </button>
             <button 
                onClick={() => setFilterType('EXTRA')}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${filterType === 'EXTRA' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
                Emergencial
             </button>
          </div>
        </div>

        {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm h-64 animate-pulse">
                     <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 bg-slate-200 rounded-xl"></div>
                        <div className="w-20 h-6 bg-slate-100 rounded-lg"></div>
                     </div>
                     <div className="space-y-3 mb-8">
                        <div className="w-3/4 h-6 bg-slate-200 rounded-lg"></div>
                        <div className="w-1/2 h-4 bg-slate-100 rounded-lg"></div>
                     </div>
                     <div className="flex gap-2">
                        <div className="w-16 h-5 bg-slate-100 rounded-md"></div>
                        <div className="w-16 h-5 bg-slate-100 rounded-md"></div>
                     </div>
                  </div>
               ))}
            </div>
        ) : filteredProcesses.length === 0 ? (
            <div className="bg-white rounded-[32px] border border-slate-200 p-20 text-center opacity-50 border-dashed animate-in zoom-in-95 duration-500">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={40} className="text-emerald-500" />
                </div>
                <p className="text-xl font-black uppercase text-slate-900">Tudo Limpo!</p>
                <p className="text-sm text-slate-500 max-w-xs mx-auto mt-2">Você zerou sua fila de homologação. Bom trabalho!</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
              {filteredProcesses.map(p => (
                <div key={p.id} onClick={() => { setSelectedProcess(p); setView('DETAILS'); }} className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-300 hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden flex flex-col h-full">
                    <div className={`absolute top-0 left-0 w-full h-1 ${p.type === 'SESSÃO DE JÚRI' ? 'bg-amber-400' : 'bg-blue-500'}`}></div>
                    
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-xl ${p.type === 'SESSÃO DE JÚRI' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                              {p.type === 'SESSÃO DE JÚRI' ? <Gavel size={20}/> : <Clock size={20}/>}
                        </div>
                        <span className="text-[10px] font-black bg-slate-50 text-slate-400 px-2 py-1 rounded-lg border border-slate-100">{p.nup}</span>
                    </div>

                    <div className="mb-6 flex-1">
                        <h3 className="text-base font-black text-slate-800 leading-tight mb-1 line-clamp-2">{p.type}</h3>
                        <p className="text-xs text-slate-500 font-medium mb-3">{p.interested}</p>
                        
                        <div className="flex gap-1 flex-wrap">
                            {Array.isArray(p.items) && p.items.length > 0 ? p.items.slice(0, 2).map((item: any, i: number) => (
                                <span key={i} className="text-[10px] font-bold bg-slate-50 border border-slate-100 text-slate-400 px-2 py-0.5 rounded-md truncate max-w-[100px]">
                                    {item.element || item.code || 'Item'}
                                </span>
                            )) : null}
                             {Array.isArray(p.items) && p.items.length > 2 && (
                                <span className="text-[10px] font-bold text-slate-300 px-1">+ {p.items.length - 2}</span>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-50 flex items-center justify-between mt-auto">
                        <div>
                           <p className="text-[10px] font-black text-slate-300 uppercase tracking-wider">Valor</p>
                           <p className="text-lg font-black text-slate-800">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.val)}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                           <ArrowLeft className="rotate-180" size={14}/>
                        </div>
                    </div>
                </div>
            ))}
            </div>
        )}
      </div>
    </div>
  );
  };

  const renderDetails = () => (
    <div className="flex h-full animate-in fade-in overflow-hidden bg-[#f8fafc]">
      {/* Navigation Rail */}
      <aside className="w-20 lg:w-72 bg-white border-r border-slate-200 flex flex-col h-full shadow-sm z-20 transition-all duration-300">
         <div className="p-6 flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <Gavel size={20} />
            </div>
            <div className="hidden lg:block">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Processo</p>
              <p className="text-sm font-black text-slate-800 uppercase tracking-tighter">{selectedProcess.nup}</p>
            </div>
         </div>

         <div className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
            <p className="hidden lg:block px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 mt-4">Navegação</p>
            
            <button onClick={() => setSubView('DETAILS')} className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all group ${subView === 'DETAILS' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>
               <div className={`p-2 rounded-lg ${subView === 'DETAILS' ? 'bg-white shadow-sm' : 'bg-slate-100 group-hover:bg-white'}`}><FileSearch size={18}/></div>
               <span className="hidden lg:block text-xs font-bold">Detalhes</span>
            </button>

            <button onClick={() => setSubView('COVER')} className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all group ${subView === 'COVER' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>
               <div className={`p-2 rounded-lg ${subView === 'COVER' ? 'bg-white shadow-sm' : 'bg-slate-100 group-hover:bg-white'}`}><FileCode size={18}/></div>
               <span className="hidden lg:block text-xs font-bold">Capa</span>
            </button>

            <button onClick={() => setSubView('REQUEST')} className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all group ${subView === 'REQUEST' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>
               <div className={`p-2 rounded-lg ${subView === 'REQUEST' ? 'bg-white shadow-sm' : 'bg-slate-100 group-hover:bg-white'}`}><FileText size={18}/></div>
               <span className="hidden lg:block text-xs font-bold">Requerimento</span>
            </button>

            <div className="py-2">
              <div className="w-full h-px bg-slate-100 my-2"></div>
            </div>

            <button onClick={() => setSubView('DOSSIER')} className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all group ${subView === 'DOSSIER' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
               <div className={`p-2 rounded-lg ${subView === 'DOSSIER' ? 'bg-white/10' : 'bg-slate-100 group-hover:bg-white'}`}><BookOpen size={18}/></div>
               <span className="hidden lg:block text-xs font-bold">Dossiê Digital</span>
            </button>

            <button onClick={() => setSubView('HISTORY')} className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all group ${subView === 'HISTORY' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>
               <div className={`p-2 rounded-lg ${subView === 'HISTORY' ? 'bg-white shadow-sm' : 'bg-slate-100 group-hover:bg-white'}`}><Clock size={18}/></div>
               <span className="hidden lg:block text-xs font-bold">Auditoria</span>
            </button>
         </div>

         <div className="p-4 mt-auto border-t border-slate-100">
            <button onClick={() => setView('LIST')} className="w-full py-4 bg-slate-50 text-slate-500 rounded-2xl hover:bg-slate-100 hover:text-slate-700 transition-all flex items-center justify-center gap-3">
              <ArrowLeft size={18} />
              <span className="hidden lg:block text-xs font-bold uppercase tracking-wider">Voltar</span>
            </button>
         </div>
      </aside>

      <main className="flex-1 overflow-hidden flex flex-col relative bg-[#f8fafc]">
        {/* Header Actions Stripe */}
        <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm z-10">
           <div className="flex items-center gap-6">
              <div>
                <h2 className="text-xl font-black text-slate-800">{
                  subView === 'DETAILS' ? 'Análise do Processo' :
                  subView === 'COVER' ? 'Capa Oficial' :
                  subView === 'REQUEST' ? 'Requerimento Inicial' :
                  subView === 'DOSSIER' ? 'Autos Digitais' :
                  'Histórico & Auditoria'
                }</h2>
                <div className="flex items-center gap-2 mt-1">
                   <span className={`w-2 h-2 rounded-full ${selectedProcess.type === 'SESSÃO DE JÚRI' ? 'bg-amber-500' : 'bg-blue-500'}`}></span>
                   <span className="text-xs font-medium text-slate-500">{selectedProcess.type}</span>
                </div>
              </div>
           </div>

           <div className="flex items-center gap-3">
              <div className="h-8 w-px bg-slate-200 mx-2"></div>
              
              <button 
                onClick={() => setShowDocumentWizard(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
              >
                  <Plus size={16}/> <span className="hidden sm:inline">Adicionar Documento</span>
              </button>

              <button 
                onClick={handleReturnToSuprido}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-red-600 bg-red-50 hover:bg-red-100 transition-all border border-red-100"
              >
                  <ThumbsDown size={16}/> Devolver
              </button>

              {hasAtesto ? (
                  <button onClick={handleForwardToSosfu} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
                      <Send size={16}/> Enviar p/ SOSFU
                  </button>
              ) : (
                  <button 
                      onClick={handleGenerateAtesto} 
                      disabled={!isChecklistComplete}
                      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 ${
                        isChecklistComplete 
                          ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20 ring-4 ring-blue-500/10' 
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                  >
                      <BadgeCheck size={16}/> {isChecklistComplete ? 'Gerar Atesto' : 'Complete o Checklist'}
                  </button>
              )}
           </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
           {subView === 'DETAILS' && (
              <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-3 gap-8 pb-32">
                 {/* Left Column: Process Data */}
                 <div className="xl:col-span-2 space-y-8">
                    <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-300 transition-all">
                        <div className="flex items-start justify-between mb-8">
                           <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Requerente</p>
                              <h3 className="text-2xl font-black text-slate-800">{selectedProcess.interested}</h3>
                           </div>
                           <div className="bg-slate-100 p-3 rounded-2xl text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                              <FileSearch size={24}/>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                           <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Justificativa</p>
                              <p className="text-sm font-medium text-slate-600 italic leading-relaxed">"{selectedProcess.desc}"</p>
                           </div>
                           <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Valor Total</p>
                             <p className="text-3xl font-black text-slate-800">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedProcess.val || 0)}</p>
                           </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-4">
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Itens Requisitados</label>
                               <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-lg">{selectedProcess.items?.length || 0} Itens</span>
                            </div>
                            <div className="space-y-3">
                                {selectedProcess.items && selectedProcess.items.length > 0 ? (
                                    selectedProcess.items.map((item: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between px-5 py-4 bg-white rounded-xl border border-slate-100 hover:border-blue-200 hover:shadow-sm transition-all group/item">
                                            <div className="flex items-center gap-4">
                                                <span className="w-8 h-8 bg-slate-50 text-slate-500 group-hover/item:bg-blue-100 group-hover/item:text-blue-600 rounded-lg flex items-center justify-center text-xs font-black transition-colors">{i + 1}</span>
                                                <div>
                                                   <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-0.5">{item.element || item.codigo || '3.3.90.30'}</p>
                                                   <p className="text-sm font-bold text-slate-700">{item.desc || item.descricao || item.description || 'Item sem descrição'}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-slate-400 font-medium">{item.qty || 1}x</p>
                                                <p className="text-sm font-black text-slate-800">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.val || item.value || 0)}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-4 py-8 bg-slate-50 rounded-2xl border border-slate-100 border-dashed text-center">
                                        <p className="text-sm text-slate-400 font-medium">Nenhum item de despesa cadastrado</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                 </div>

                 {/* Right Column: Interactive Checklist */}
                 <div className="space-y-6">
                    <div className="bg-[#0f172a] p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden ring-4 ring-slate-900/5">
                        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none"><CheckSquare size={140}/></div>
                        
                        <div className="relative z-10">
                            <h3 className="text-xl font-black uppercase tracking-tight mb-2">Checklist de Homologação</h3>
                            <p className="text-slate-400 text-xs font-medium mb-8">Confirme os requisitos para liberar o atesto.</p>

                            {/* Progress Bar */}
                            <div className="mb-8">
                               <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                                  <span className="text-blue-400">Progresso</span>
                                  <span>{Object.values(checklist).filter(Boolean).length}/4</span>
                               </div>
                               <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-blue-500 transition-all duration-500 ease-out"
                                    style={{ width: `${(Object.values(checklist).filter(Boolean).length / 4) * 100}%` }}
                                  ></div>
                               </div>
                            </div>

                            <div className="space-y-3">
                                {[
                                    { key: 'budgetAvailable', label: 'Dotação Orçamentária' },
                                    { key: 'publicInterest', label: 'Interesse Público' },
                                    { key: 'emergencyJustified', label: 'Justificativa Válida' },
                                    { key: 'itemsReviewed', label: 'Itens Conferidos' }
                                ].map((item) => (
                                    <label key={item.key} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer group select-none ${checklist[item.key as keyof typeof checklist] ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-900/50' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${checklist[item.key as keyof typeof checklist] ? 'bg-white border-white' : 'border-slate-500 group-hover:border-blue-400'}`}>
                                            {checklist[item.key as keyof typeof checklist] && <CheckCircle2 size={16} className="text-white"/>}
                                        </div>
                                        <input type="checkbox" className="hidden" checked={checklist[item.key as keyof typeof checklist]} onChange={() => toggleCheck(item.key as keyof typeof checklist)} />
                                        <span className={`text-sm font-bold ${checklist[item.key as keyof typeof checklist] ? 'text-white' : 'text-slate-400 group-hover:text-blue-200'}`}>{item.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {hasAtesto && (
                        <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-[32px] flex items-center gap-5 shadow-sm animate-in zoom-in duration-300">
                            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 shadow-inner">
                                <Signature size={24}/>
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-emerald-800 uppercase">Pronto para Envio</h4>
                                <p className="text-xs text-emerald-700 font-medium mt-0.5">Certidão assinada eletronicamente.</p>
                            </div>
                        </div>
                    )}
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
                       <button 
                         onClick={() => setShowPdfViewer(true)}
                         className="flex items-center gap-3 px-8 py-5 bg-white text-slate-900 rounded-[24px] text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 transition-all shadow-xl"
                       >
                          <FileSearchIcon size={18} />
                          Visualizar PDF Consolidado
                       </button>
                    </div>
                    <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-110 transition-transform duration-1000"><TableOfContents size={200}/></div>
                 </div>

                 <div className="space-y-6">
                    {processPieces.map(piece => (
                       <div key={piece.id} className="group flex items-center gap-8 bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm hover:shadow-2xl hover:border-blue-300 transition-all">
                          <div className={`w-20 h-20 rounded-3xl flex flex-col items-center justify-center shadow-inner ${
                            piece.status === 'ASSINADO' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400 group-hover:bg-blue-600 group-hover:text-white'
                          }`}>
                            <span className="text-[10px] font-black uppercase opacity-40 mb-1">Fls.</span>
                            <span className="text-2xl font-black">{piece.num}</span>
                          </div>
                          <div className="flex-1">
                             <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight leading-none mb-2">{piece.title}</h4>
                             <p className="text-xs text-slate-400 font-medium">{piece.desc}</p>
                             {/* Show signature info for DB documents */}
                             {piece.key === 'DB_DOC' && (
                               <div className="flex items-center gap-3 mt-2">
                                 {piece.status === 'ASSINADO' ? (
                                   <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 text-[9px] font-black rounded-full border border-emerald-100 uppercase tracking-widest">
                                     <CheckCircle2 size={12}/> Assinado
                                   </span>
                                 ) : (
                                   <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-700 text-[9px] font-black rounded-full border border-amber-100 uppercase tracking-widest">
                                     <Clock size={12}/> Minuta
                                   </span>
                                 )}
                                 {piece.authorName && (
                                   <span className="text-[10px] text-slate-400">
                                     por <strong className="text-slate-600">{piece.authorName}</strong>
                                   </span>
                                 )}
                                 {piece.isOwner && (
                                   <span className="text-[10px] text-blue-500 font-bold">• Você criou</span>
                                 )}
                               </div>
                             )}
                          </div>
                          
                          {/* Action buttons */}
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => {
                                if (piece.key === 'COVER' || piece.key === 'REQUEST') {
                                  setSubView(piece.key as SubViewMode);
                                } else if (piece.content || piece.key === 'DB_DOC') {
                                  setViewingDoc(piece);
                                }
                              }}
                              className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-blue-50 hover:text-blue-600 transition-all" title="Visualizar"
                            >
                              <Eye size={20}/>
                            </button>
                            
                            {/* Edit/Delete only for document owner */}
                            {piece.key === 'DB_DOC' && piece.isOwner && (
                              <>
                                <button 
                                  className="p-4 bg-amber-50 text-amber-600 rounded-2xl hover:bg-amber-100 transition-all" 
                                  title="Editar"
                                >
                                  <Edit size={20}/>
                                </button>
                                <button 
                                  onClick={() => handleDeleteDocument(piece.id)}
                                  disabled={deletingDocId === piece.id}
                                  className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-all disabled:opacity-50" 
                                  title="Excluir"
                                >
                                  {deletingDocId === piece.id ? <Loader2 size={20} className="animate-spin"/> : <Trash2 size={20}/>}
                                </button>
                              </>
                            )}
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           )}

           {/* COVER SubView - Capa do Processo */}
           {subView === 'COVER' && (
              <div className="max-w-4xl mx-auto pb-32 animate-in fade-in">
                 <button 
                   onClick={() => setSubView('DOSSIER')} 
                   className="mb-6 flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
                 >
                   <ArrowLeft size={16}/> Voltar aos Autos
                 </button>
                 <div className="bg-white shadow-2xl rounded-sm p-24 flex flex-col items-center min-h-[800px] relative border border-slate-200">
                    <img src={BRASAO_TJPA_URL} alt="Brasão" className="w-32 mb-12 opacity-90" />
                    <h1 className="text-2xl font-black tracking-[0.3em] uppercase text-slate-900 mb-2">Poder Judiciário</h1>
                    <p className="text-lg font-bold uppercase tracking-[0.2em] text-slate-500 mb-16 border-b-2 border-slate-100 pb-4">Tribunal de Justiça do Pará</p>
                    
                    <div className="w-full bg-slate-50 p-12 rounded-3xl border border-slate-100 text-center mb-16">
                       <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] mb-4">Número Único de Protocolo</h2>
                       <p className="text-5xl font-black text-slate-900 font-mono tracking-tighter">{selectedProcess?.nup || 'N/A'}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-12 w-full text-left border-t border-slate-100 pt-16">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Interessado</label>
                          <p className="text-lg font-black text-slate-800 uppercase leading-none">{selectedProcess?.interested || 'N/A'}</p>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Modalidade</label>
                          <p className="text-lg font-black text-slate-800 uppercase leading-none">{selectedProcess?.type || 'N/A'}</p>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data de Entrada</label>
                          <p className="text-lg font-black text-slate-800 uppercase leading-none">{selectedProcess?.date || 'N/A'}</p>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Requisitado</label>
                          <p className="text-lg font-black text-blue-600 uppercase leading-none">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedProcess?.val || 0)}</p>
                       </div>
                    </div>
                 </div>
              </div>
           )}

           {/* REQUEST SubView - Requerimento Inicial */}
           {subView === 'REQUEST' && (
              <div className="max-w-4xl mx-auto pb-32 animate-in fade-in">
                 <button 
                   onClick={() => setSubView('DOSSIER')} 
                   className="mb-6 flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
                 >
                   <ArrowLeft size={16}/> Voltar aos Autos
                 </button>
                 <div className="bg-white shadow-2xl rounded-sm p-20 min-h-[900px] flex flex-col relative border-t-8 border-slate-900">
                    {/* Institutional Header */}
                    <div className="text-center mb-16 space-y-2">
                       <img src={BRASAO_TJPA_URL} alt="Brasão TJPA" className="w-24 mx-auto mb-6 opacity-90" />
                       <h1 className="text-2xl font-bold tracking-tight uppercase">TRIBUNAL DE JUSTIÇA DO ESTADO DO PARÁ</h1>
                       <h2 className="text-lg font-medium text-slate-700">Solicitação de Suprimento de Fundos</h2>
                       <h3 className="text-base font-black tracking-widest font-mono mt-4">NUP: {selectedProcess?.nup || 'N/A'}</h3>
                    </div>

                    <div className="w-full h-px bg-slate-900/20 mb-12"></div>

                    {/* Section 1: Dados da Solicitação */}
                    <div className="space-y-6 mb-12">
                       <h4 className="text-base font-black uppercase tracking-tight border-l-4 border-slate-900 pl-4 bg-slate-50 py-2">1. DADOS DA SOLICITAÇÃO</h4>
                       <div className="grid grid-cols-1 gap-3 pl-5">
                          <p className="text-sm"><strong>Tipo:</strong> {selectedProcess?.type}</p>
                          <p className="text-sm"><strong>Data de Entrada:</strong> {selectedProcess?.date}</p>
                          <p className="text-sm"><strong>Interessado:</strong> {selectedProcess?.interested}</p>
                          <p className="text-sm"><strong>Valor:</strong> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedProcess?.val || 0)}</p>
                       </div>
                    </div>

                    {/* Section 2: Justificativa */}
                    <div className="space-y-6 mb-12">
                       <h4 className="text-base font-black uppercase tracking-tight border-l-4 border-slate-900 pl-4 bg-slate-50 py-2">2. JUSTIFICATIVA</h4>
                       <div className="pl-5 text-sm leading-relaxed text-justify">
                          <p className="italic text-slate-600">"{selectedProcess?.desc || 'Sem descrição.'}"</p>
                       </div>
                    </div>

                    {/* Section 3: Itens de Despesa */}
                    <div className="space-y-6 mb-16">
                       <h4 className="text-base font-black uppercase tracking-tight border-l-4 border-slate-900 pl-4 bg-slate-50 py-2">3. ELEMENTOS DE DESPESA</h4>
                       <div className="overflow-hidden border border-slate-200 rounded-lg">
                          <table className="w-full text-xs text-left">
                             <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                   <th className="px-4 py-3 font-black uppercase">Código</th>
                                   <th className="px-4 py-3 font-black uppercase">Descrição</th>
                                   <th className="px-4 py-3 font-black uppercase text-center">Qtd</th>
                                   <th className="px-4 py-3 font-black uppercase text-right">Valor</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-slate-100">
                                {selectedProcess?.items && selectedProcess.items.length > 0 ? (
                                   selectedProcess.items.map((item: any, idx: number) => (
                                      <tr key={idx}>
                                         <td className="px-4 py-3 font-mono">{item.element || item.codigo || '3.3.90.30'}</td>
                                         <td className="px-4 py-3">{item.desc || item.descricao || 'Item'}</td>
                                         <td className="px-4 py-3 text-center">{item.qty || item.quantity || 1}</td>
                                         <td className="px-4 py-3 text-right font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.val || item.value || 0)}</td>
                                      </tr>
                                   ))
                                ) : (
                                   <tr>
                                      <td colSpan={4} className="px-4 py-3 text-center text-slate-400">Nenhum item cadastrado</td>
                                   </tr>
                                )}
                                <tr className="bg-slate-50 font-black">
                                   <td colSpan={3} className="px-4 py-3 text-right uppercase tracking-widest text-slate-500">TOTAL:</td>
                                   <td className="px-4 py-3 text-right">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedProcess?.val || 0)}</td>
                                </tr>
                             </tbody>
                          </table>
                       </div>
                    </div>

                    {/* Electronic Signatures */}
                    <div className="mt-auto space-y-6">
                       <div className="p-6 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assinaturas Eletrônicas:</p>
                          <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-slate-100">
                             <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={16}/>
                             <div>
                                <p className="text-xs font-bold text-slate-700">ASSINADO ELETRONICAMENTE POR: <span className="text-blue-600">{selectedProcess?.interested || 'Suprido'}</span> (Requerente) em {selectedProcess?.date || new Date().toLocaleDateString('pt-BR')}</p>
                                <p className="text-[10px] text-slate-400 mt-1">A autenticidade deste documento pode ser conferida no sistema SISUP através do NUP {selectedProcess?.nup}</p>
                             </div>
                          </div>
                       </div>
                       
                       <div className="h-px bg-slate-100"></div>
                       
                       <div className="text-center text-[10px] text-slate-400 space-y-1">
                          <p>DOCUMENTO GERADO AUTOMATICAMENTE PELO SISTEMA SISUP - TJPA</p>
                          <p>DATA DE GERAÇÃO: {new Date().toLocaleDateString('pt-BR')}, {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                       </div>
                    </div>
                 </div>
              </div>
           )}

           {/* HISTORY SubView - Histórico / Auditoria */}
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
        </div>
      </main>
    </div>
  );

  const renderEditor = () => (
    <div className="flex h-full bg-[#f1f5f9] animate-in slide-in-from-bottom-6 duration-500 overflow-hidden">
       <aside className="w-80 bg-white border-r border-slate-200 flex flex-col h-full shadow-sm z-10 p-8">
          <div className="flex items-center gap-4 mb-12">
             <button onClick={() => setView('DETAILS')} className="p-3 bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-200 transition-all"><ChevronLeft size={20}/></button>
             <div><p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Edição Oficial</p><h3 className="text-sm font-black text-slate-800 uppercase leading-none mt-1">Certidão</h3></div>
          </div>
          <div className="space-y-6">
             <div className="bg-amber-50 p-6 rounded-[32px] border border-amber-100 space-y-3">
                <div className="flex items-center gap-3 text-amber-700 font-black text-[10px] uppercase"><Info size={16}/> Atenção</div>
                <p className="text-[11px] text-amber-800 leading-relaxed font-medium italic">Esta certidão de atesto vincula a responsabilidade da chefia imediata sobre a necessidade da despesa solicitada.</p>
             </div>
             <button onClick={handleSaveAtesto} className="w-full py-5 bg-emerald-600 text-white rounded-[24px] text-xs font-black uppercase tracking-widest hover:bg-emerald-700 shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3"><Signature size={18}/> Assinar e Salvar</button>
             <button onClick={() => setView('DETAILS')} className="w-full py-5 bg-slate-100 text-slate-500 rounded-[24px] text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Cancelar</button>
          </div>
       </aside>
       <main className="flex-1 overflow-y-auto p-12 flex justify-center custom-scrollbar bg-slate-200/50">
          <div className="w-[820px] bg-white shadow-2xl min-h-[1160px] p-24 flex flex-col relative border-t-[16px] border-slate-900">
             <div className="text-center mb-16 space-y-4">
                <img src={BRASAO_TJPA_URL} className="w-20 mx-auto mb-6 opacity-90" />
                <h1 className="text-xl font-bold tracking-tight uppercase">TRIBUNAL DE JUSTIÇA DO ESTADO DO PARÁ</h1>
                <h2 className="text-md font-medium text-slate-600 uppercase tracking-widest">CERTIDÃO DE ATESTO DO GESTOR</h2>
                <div className="w-1/2 h-px bg-slate-200 mx-auto mt-4"></div>
             </div>
             <div className="flex-1 font-serif text-lg leading-relaxed text-slate-800 text-justify">
                <textarea 
                   value={editingDoc?.content} 
                   onChange={e => setEditingDoc({...editingDoc, content: e.target.value})}
                   className="w-full h-full outline-none bg-transparent resize-none leading-relaxed"
                />
             </div>
             <div className="pt-24 text-center space-y-1">
                <div className="w-64 h-px bg-slate-300 mx-auto mb-6"></div>
                <p className="text-sm font-bold text-slate-800 uppercase tracking-tight">Diogo Bonfim Fernandez</p>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Secretário de Planejamento (Interino)</p>
             </div>
             <div className="absolute inset-0 flex items-center justify-center opacity-[0.015] pointer-events-none select-none"><img src={BRASAO_TJPA_URL} className="w-[500px] grayscale" /></div>
          </div>
       </main>
    </div>
  );

  return (
    <div className="h-full bg-[#f8fafc] overflow-hidden">
      {view === 'LIST' && renderList()}
      {view === 'DETAILS' && renderDetails()}
      {view === 'EDIT_DOC' && renderEditor()}
      {view === 'HISTORY' && renderHistory()}

      {/* Tramitar Modal */}
      {selectedProcess && (
        <TramitarModal
          isOpen={showTramitarModal}
          onClose={() => setShowTramitarModal(false)}
          processId={selectedProcess.id}
          processNup={selectedProcess.nup}
          currentStatus={selectedProcess.status || 'PENDENTE ATESTO'}
          currentModule="GESTOR"
          onSuccess={handleTramitacaoSuccess}
        />
      )}
      {/* Document Creation Wizard */}
      {selectedProcess && (
        <DocumentCreationWizard
          isOpen={showDocumentWizard}
          onClose={() => setShowDocumentWizard(false)}
          processId={selectedProcess.id}
          processNup={selectedProcess.nup}
          onDocumentCreated={() => {
            setShowDocumentWizard(false);
            // Refresh dossier to show the new document
            fetchDossierDocs(selectedProcess.id);
          }}
        />
      )}

      {/* Document Viewer Modal */}
      {viewingDoc && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-0 md:p-8 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-[#333]/90 backdrop-blur-md" onClick={() => setViewingDoc(null)}></div>
          
          <div className="relative w-full h-full max-w-6xl bg-[#525659] rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-500">
             {/* Dark Reader Header */}
             <div className="bg-[#2a2a2a] px-6 py-4 flex items-center justify-between shadow-md z-10 border-b border-black/20">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center text-white shadow-inner">
                      <FileText size={20}/>
                   </div>
                   <div>
                      <h2 className="text-sm font-bold text-white uppercase tracking-wider">{viewingDoc.title}</h2>
                      <p className="text-[10px] font-medium text-white/50">{viewingDoc.type || viewingDoc.desc} • {viewingDoc.date}</p>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                   <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2">
                      <Printer size={16}/> Imprimir
                   </button>
                   <div className="w-px h-6 bg-white/10 mx-2"></div>
                   <button onClick={() => setViewingDoc(null)} className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all">
                      <X size={24}/>
                   </button>
                </div>
             </div>

             {/* Reader Content Area */}
             <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12 flex justify-center bg-[#525659]">
                <div className="w-full max-w-3xl bg-white shadow-[0_0_50px_rgba(0,0,0,0.5)] min-h-[1000px] p-16 md:p-24 relative animate-in zoom-in-95 duration-300">
                   {/* Standard Document Header */}
                   <div className="text-center mb-16 space-y-4">
                      <img src={BRASAO_TJPA_URL} className="w-20 mx-auto mb-6 opacity-90" />
                      <h1 className="text-lg font-bold tracking-tight uppercase text-slate-900">TRIBUNAL DE JUSTIÇA DO ESTADO DO PARÁ</h1>
                      <div className="w-32 h-px bg-slate-900 mx-auto opacity-20"></div>
                   </div>

                   {/* Title */}
                   <h2 className="text-xl font-black text-slate-900 mb-12 text-center uppercase tracking-wide border-b-2 border-slate-900 pb-4">
                      {viewingDoc.type || 'DOCUMENTO'} {viewingDoc.num && `• Fls. ${viewingDoc.num}`}
                   </h2>

                   {/* Content Body */}
                   <div className="font-serif text-lg leading-loose text-slate-800 text-justify whitespace-pre-wrap">
                      {viewingDoc.content || 'Conteúdo do documento não disponível para visualização.'}
                   </div>

                   {/* Footer Signature */}
                   {viewingDoc.key === 'DB_DOC' && (
                      <div className="mt-32 pt-8 border-t-2 border-slate-200 break-inside-avoid">
                        {viewingDoc.status === 'ASSINADO' ? (
                          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full mx-auto flex items-center justify-center mb-4">
                              <CheckCircle2 size={32} className="text-emerald-600"/>
                            </div>
                            <p className="text-lg font-black text-emerald-800 uppercase tracking-wider">Assinado Eletronicamente</p>
                            <div className="w-48 h-px bg-emerald-300 mx-auto my-4"></div>
                            <p className="text-base font-bold text-emerald-900 uppercase">{viewingDoc.authorName || 'Usuário'}</p>
                            <p className="text-xs text-emerald-700 mt-1">{viewingDoc.authorCargo || 'Servidor'}</p>
                            <div className="mt-4 text-xs text-emerald-600">
                              <p>Data: <strong>{viewingDoc.date}</strong> às <strong>{viewingDoc.time}</strong></p>
                              <p className="text-[10px] text-emerald-500 mt-2 font-mono">Documento assinado nos termos da Lei nº 14.063/2020</p>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
                            <div className="w-16 h-16 bg-amber-100 rounded-full mx-auto flex items-center justify-center mb-4">
                              <Clock size={32} className="text-amber-600"/>
                            </div>
                            <p className="text-lg font-black text-amber-800 uppercase tracking-wider">Minuta - Pendente de Assinatura</p>
                            <div className="w-48 h-px bg-amber-300 mx-auto my-4"></div>
                            <p className="text-xs text-amber-600">Criado por: <strong>{viewingDoc.authorName || 'Usuário'}</strong></p>
                            <p className="text-xs text-amber-500 mt-1">{viewingDoc.date} às {viewingDoc.time}</p>
                          </div>
                        )}
                      </div>
                   )}
                </div>
             </div>
          </div>
        </div>
      )}

      {/* PDF Viewer Modal */}
      {showPdfViewer && selectedProcess && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 md:p-10">
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl" onClick={() => setShowPdfViewer(false)}></div>
          <div className="relative bg-[#333] w-full h-full rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
            <div className="p-4 bg-[#2a2a2a] border-b border-white/5 flex items-center justify-between shadow-2xl">
               <div className="flex items-center gap-4">
                  <div className="p-2 bg-red-600 text-white rounded-lg shadow-lg"><FileIcon size={18}/></div>
                  <div>
                     <h3 className="text-sm font-bold text-white uppercase tracking-tight">Consolidado_{selectedProcess.nup}.pdf</h3>
                     <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">SISUP - Tribunal de Justiça do Pará</p>
                  </div>
               </div>
               <div className="flex items-center gap-2">
                  <button 
                    onClick={() => { setIsExporting(true); setTimeout(() => { setIsExporting(false); showToast({ type: 'success', title: 'PDF Exportado!', message: 'Documento salvo com sucesso.' }); }, 2000); }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase rounded-lg transition-all flex items-center gap-2"
                  >
                    {isExporting ? <><RefreshCw size={16} className="animate-spin"/> Gerando...</> : <><FileDown size={16}/> Baixar PDF</>}
                  </button>
                  <div className="w-px h-6 bg-white/10 mx-2"></div>
                  <button onClick={() => setShowPdfViewer(false)} className="p-2 text-white/60 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"><X size={18}/></button>
               </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-12 flex flex-col items-center gap-16 custom-scrollbar bg-[#525659]">
               {/* Cover Page */}
               <div className="w-[820px] bg-white shadow-2xl p-24 min-h-[1160px] flex flex-col items-center border-t-8 border-slate-900">
                  <img src={BRASAO_TJPA_URL} alt="Brasão" className="w-32 mb-12 opacity-90" />
                  <h1 className="text-2xl font-black tracking-[0.3em] uppercase text-slate-900 mb-2">Poder Judiciário</h1>
                  <p className="text-lg font-bold uppercase tracking-[0.2em] text-slate-500 mb-16 border-b-2 border-slate-100 pb-4">Tribunal de Justiça do Pará</p>
                  
                  <div className="w-full bg-slate-50 p-12 rounded-3xl border border-slate-100 text-center mb-16">
                     <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] mb-4">Número Único de Protocolo</h2>
                     <p className="text-6xl font-black text-slate-900 font-mono tracking-tighter">{selectedProcess.nup}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-12 w-full text-left border-t border-slate-100 pt-16 mt-auto">
                     <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Interessado</label><p className="text-lg font-black text-slate-800 uppercase">{selectedProcess.interested || 'N/A'}</p></div>
                     <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Modalidade</label><p className="text-lg font-black text-slate-800 uppercase">{selectedProcess.type || 'Suprimento'}</p></div>
                     <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</label><p className="text-lg font-black text-blue-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedProcess.value || 0)}</p></div>
                     <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</label><p className="text-lg font-black text-slate-800">{selectedProcess.date || new Date().toLocaleDateString('pt-BR')}</p></div>
                  </div>
               </div>

               {/* Document List */}
               {processPieces.map((piece, idx) => piece.key !== 'COVER' && (
                  <div key={piece.id} className="w-[820px] bg-white shadow-2xl p-24 min-h-[1160px] flex flex-col border-t-8 border-slate-900">
                     <div className="flex flex-col items-center justify-center mb-16 space-y-4">
                        <img src={BRASAO_TJPA_URL} alt="Brasão" className="w-20 opacity-90"/>
                        <h1 className="text-lg font-bold text-slate-900 uppercase tracking-widest text-center">TRIBUNAL DE JUSTIÇA DO ESTADO DO PARÁ</h1>
                     </div>
                     <h2 className="text-2xl font-black text-slate-900 mb-8 uppercase tracking-tight text-center">{piece.title}</h2>
                     <div className="flex-1 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                        {piece.content || piece.desc || 'Conteúdo do documento não disponível para visualização.'}
                     </div>
                     <div className="mt-16 pt-8 border-t border-slate-100 flex flex-col items-center">
                        <div className="w-48 h-px bg-slate-800 mb-4"></div>
                        <p className="font-bold text-slate-900 uppercase text-sm">{selectedProcess.interested || 'Signatário'}</p>
                        <p className="text-xs text-slate-500 uppercase tracking-widest">{piece.date || new Date().toLocaleDateString('pt-BR')}</p>
                     </div>
                  </div>
               ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};