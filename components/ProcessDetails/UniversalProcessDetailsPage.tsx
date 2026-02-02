import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Eye,
  FolderOpen,
  Receipt,
  Search,
  BadgeCheck,
  Plus,
  Loader2,
  Send,
  RefreshCw,
  Scale,
  AlertTriangle,
  FileText,
  Database,
  Briefcase
} from 'lucide-react';
import { useProcessDetails } from '../../hooks/useProcessDetails';
import { DetailsTab } from './Tabs/DetailsTab';
import { ExecutionTab } from './Tabs/ExecutionTab';
import { TechnicalAnalysisTab } from './Tabs/TechnicalAnalysisTab';
import { JuriAdjustmentTab } from './Tabs/JuriAdjustmentTab';
import { UniversalDossierPanel } from './UniversalDossierPanel';
import { supabase } from '../../lib/supabaseClient';
import { JuriExceptionInlineAlert } from '../ui/JuriExceptionInlineAlert';
import { DocumentCreationWizard } from '../DocumentCreationWizard';
import { TramitarModal } from '../TramitarModal';
import { useToast } from '../ui/ToastProvider';
import { PrestacaoContasTab } from '../SOSFU/PrestacaoContasTab';
import { BaixaSiafeModal } from '../SOSFU/BaixaSiafeModal';
import { useExecutionDocuments } from '../../hooks/useExecutionDocuments';
import { AccountStatus, ProcessType } from '../../types';


type TabType = 'overview' | 'dossier' | 'execution' | 'analysis' | 'juriAdjust' | 'prestacao';

// Helper to detect Júri/Extra-Júri processes
const isJuriProcess = (processData: any): boolean => {
  const tipo = (processData?.tipo || '').toLowerCase();
  const subtipo = (processData?.subtipo || '').toLowerCase();
  
  return (
    tipo.includes('júri') || 
    tipo.includes('juri') ||
    subtipo.includes('júri') ||
    subtipo.includes('juri') ||
    tipo.includes('extra-júri') ||
    tipo.includes('extra-juri') ||
    tipo.includes('sessão de júri') ||
    tipo.includes('sessao de juri')
  );
};

interface ProcessDetailsPageProps {
  processId: string;
  onClose: () => void;
  initialTab?: TabType;
  
  // Control which tabs are visible (for role-based UI)
  // Defaults to all tabs if not specified
  visibleTabs?: TabType[];
  
  // Optional: Pass current user ID (will fetch if not provided)
  currentUserId?: string;
  
  // Role of the user viewing the process (for contextual banners)
  viewerRole?: 'USER' | 'SUPRIDO' | 'GESTOR' | 'SOSFU' | 'AJSEFIN' | 'SEFIN' | 'SODPA' | 'SGP' | 'PRESIDENCIA';
  
  // Action capabilities (role-dependent)
  canTramitar?: boolean;
  isTramitarDisabled?: boolean;
  canGenerateAtesto?: boolean;
  canCreateDocument?: boolean;
  isLoadingAtesto?: boolean;
  
  // Optional action callbacks
  onTramitar?: () => void;
  onGenerateAtesto?: () => void;
  onCreateDocument?: () => void;
  
  // Custom action (e.g., "Analisar PC")
  customActionLabel?: string;
  onCustomAction?: () => void;
}

export const ProcessDetailsPage: React.FC<ProcessDetailsPageProps> = ({
  processId,
  onClose,
  initialTab = 'overview',
  visibleTabs,
  currentUserId: passedUserId,
  viewerRole = 'SOSFU',
  canTramitar,
  isTramitarDisabled,
  canGenerateAtesto,
  canCreateDocument,
  isLoadingAtesto,
  onTramitar,
  onGenerateAtesto,
  onCreateDocument,
  customActionLabel,
  onCustomAction,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [currentUserId, setCurrentUserId] = useState<string | null>(passedUserId || null);
  const { processData, isLoading, error, refetch } = useProcessDetails(processId);
  const { showToast } = useToast();
  
  // States for exception workflow modals
  const [showDocumentWizard, setShowDocumentWizard] = useState(false);
  const [showTramitarModal, setShowTramitarModal] = useState(false);
  const [hasDespacho, setHasDespacho] = useState(false);
  const [isTramiting, setIsTramiting] = useState(false);
  const [showBaixaSiafeModal, setShowBaixaSiafeModal] = useState(false);

  // Fetch execution documents for Portaria date (like in ProcessDetailsModal)
  const { documents: executionDocuments } = useExecutionDocuments(processId);

  // Robust PC Phase Check
  const statusWorkflow = (processData as any)?.status_workflow || '';
  const isPCPhase = statusWorkflow.startsWith('PC_') || 
    statusWorkflow.startsWith('TCE_') ||
    statusWorkflow === 'AWAITING_ACCOUNTABILITY' ||
    statusWorkflow === 'AGUARDANDO_ATESTO_GESTOR' ||
    processData?.status === AccountStatus.AUDIT ||
    (processData as any)?.tipo === 'ACCOUNTABILITY' || 
    (processData?.status as string)?.includes('PRESTA') || 
    (processData?.status as string)?.toUpperCase().includes('PC') ||
    (viewerRole === 'SOSFU' && activeTab === 'prestacao'); // Allow viewing if explicitly navigated

  // Fetch current user ID if not passed
  useEffect(() => {
    if (!passedUserId) {
      supabase.auth.getUser().then(({ data }) => {
        if (data.user) setCurrentUserId(data.user.id);
      });
    }
  }, [passedUserId]);
  
  // Check if DESPACHO exists for exception workflow
  useEffect(() => {
    const checkDespacho = async () => {
      if (!processId) return;
      const { data } = await supabase
        .from('documentos')
        .select('id')
        .eq('solicitacao_id', processId)
        .ilike('tipo', '%despacho%')
        .limit(1);
      setHasDespacho(!!data && data.length > 0);
    };
    checkDespacho();
  }, [processId, showDocumentWizard]); // Refresh after creating document


  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Carregando processo...</p>
        </div>
      </div>
    );
  }

  if (error || !processData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-3xl p-12 shadow-xl max-w-md text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="text-red-600" size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Erro ao carregar</h2>
          <p className="text-slate-600 mb-6">Não foi possível carregar os detalhes do processo.</p>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  // All possible tabs
  const allTabs = [
    { id: 'overview' as TabType, label: 'Visão Geral', icon: Eye },
    { id: 'dossier' as TabType, label: 'Dossiê Digital', icon: FolderOpen },
    ...(isJuriProcess(processData) ? [
      { id: 'juriAdjust' as TabType, label: 'Ajuste Extra-Júri', icon: Scale }
    ] : []),
    { id: 'execution' as TabType, label: 'Execução da Despesa', icon: Receipt },
    { id: 'analysis' as TabType, label: 'Análise Técnica', icon: Search },
    // Add PC Tab if applicable
    ...(isPCPhase ? [{ id: 'prestacao' as TabType, label: 'Prestação de Contas', icon: Database }] : [])
  ];

  // Filter tabs based on visibleTabs prop (default: show all)
  // CRÍTICO: SUPRIDO não deve ver as abas "Execução da Despesa" e "Análise Técnica"
  const hiddenTabsForRole: Record<string, TabType[]> = {
    'USER': ['execution', 'analysis'],  // USER é o mesmo que SUPRIDO (renomeado)
    'SUPRIDO': ['execution', 'analysis'],  // Compatibilidade legado
  };
  
  const tabs = (() => {
    let filteredTabs = visibleTabs 
      ? allTabs.filter(tab => visibleTabs.includes(tab.id))
      : allTabs;
    
    // Aplicar restrições por role
    const hiddenTabs = hiddenTabsForRole[viewerRole] || [];
    if (hiddenTabs.length > 0) {
      filteredTabs = filteredTabs.filter(tab => !hiddenTabs.includes(tab.id));
    }
    
    return filteredTabs;
  })();

  // Format currency helper
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Calculate approved value for Juri processes
  const calculateApprovedValue = () => {
    // If we have approved projection data, calculate from it
    const projecaoAprovada = processData.juri_projecao_aprovados;
    if (projecaoAprovada && Array.isArray(projecaoAprovada) && projecaoAprovada.length > 0) {
      return projecaoAprovada.reduce((acc: number, item: any) => {
        const qty = item.approvedQty ?? item.quantity ?? 0;
        const unitVal = item.approvedUnitValue ?? item.unitValue ?? 0;
        return acc + (qty * unitVal);
      }, 0);
    }
    // Fallback to original valor_total
    return processData.valor_total || 0;
  };

  const processValue = calculateApprovedValue();

  // =========================================================================
  // DETECÇÃO DE EXCEÇÃO JÚRI - Limite de Policiais para SOSFU
  // =========================================================================
  const LIMITE_POLICIAIS = 5;
  
  const localJuriParticipantes = (() => {
    // Check both possible field names
    const rawData = processData.juri_participantes || processData.juri_participants;
    if (!rawData) return { policiais: 0, jurados: 0 };
    try {
      const parsed = typeof rawData === 'string' 
        ? JSON.parse(rawData) 
        : rawData;
      
      // Handle different key names for policiais
      const policiais = Number(parsed.policias) || Number(parsed.policiais) || Number(parsed.policia) || Number(parsed.qtd_policiais) || 0;
      const jurados = Number(parsed.jurados) || Number(parsed.qtd_jurados) || 0;
      
      return { policiais, jurados };
    } catch { return { policiais: 0, jurados: 0 }; }
  })();

  const localIsJuriProcess = isJuriProcess(processData);
  const hasExcepcaoPoliciais = localIsJuriProcess && localJuriParticipantes.policiais > LIMITE_POLICIAIS;
  const qtdPoliciais = localJuriParticipantes.policiais;
  
  // SOSFU Exception Workflow - show buttons when SOSFU and has exception
  // Normalize status: remove accents and use uppercase for matching
  const statusUpper = (processData.status || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents
    .toUpperCase();
  const isAwaitingException = statusUpper.includes('ANALISE SOSFU') || statusUpper.includes('AGUARDANDO AUTORIZACAO');
  const showExceptionButtons = viewerRole === 'SOSFU' && hasExcepcaoPoliciais && isAwaitingException;
  
  // DEBUG: Log exception detection
  console.log('[SOSFU Exception Flow]', {
    viewerRole,
    hasExcepcaoPoliciais,
    localIsJuriProcess,
    policiais: localJuriParticipantes.policiais,
    statusUpper,
    isAwaitingException,
    showExceptionButtons
  });
  
  // Handler to tramitar process to AJSEFIN
  const handleTramitarToAJSEFIN = async () => {
    if (!hasDespacho) {
      showToast({
        type: 'warning',
        title: 'Despacho Necessário',
        message: 'Crie um Despacho antes de tramitar para AJSEFIN.'
      });
      return;
    }
    
    setIsTramiting(true);
    try {
      const { error } = await supabase
        .from('solicitacoes')
        .update({
          status: 'EM ANALISE AJSEFIN',
          destino_atual: 'AJSEFIN',
          updated_at: new Date().toISOString()
        })
        .eq('id', processId);
      
      if (error) throw error;
      
      showToast({
        type: 'success',
        title: 'Processo Tramitado',
        message: 'Processo enviado para AJSEFIN para análise.'
      });
      
      refetch?.();
    } catch (e) {
      console.error('Error tramiting to AJSEFIN:', e);
      showToast({
        type: 'error',
        title: 'Erro ao Tramitar',
        message: 'Não foi possível tramitar o processo.'
      });
    } finally {
      setIsTramiting(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Back button + NUP */}
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all text-slate-700 font-bold text-sm"
              >
                <ArrowLeft size={18} />
                <span className="hidden sm:inline">Voltar</span>
              </button>
              
              <div className="border-l border-slate-300 pl-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">NUP</p>
                <p className="text-lg font-black text-slate-900">{processData.nup}</p>
              </div>

              {/* Process Type Badge */}
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase">
                {processData.tipo || 'Concessão'}
              </span>
            </div>

            {/* Right: Value, Status and Actions */}
            <div className="flex items-center gap-4">
              <div className="text-right hidden md:block">
                <p className="text-xs text-slate-500">Valor Total</p>
                <p className="text-lg font-black text-emerald-600">{formatCurrency(processValue)}</p>
              </div>
              
              <div className="px-4 py-2 bg-slate-100 rounded-xl">
                <p className="text-xs text-slate-500">Status</p>
                <p className="text-sm font-bold text-slate-800">{processData.status || 'Em Andamento'}</p>
              </div>

              {/* Action Buttons */}
              {(canGenerateAtesto || canTramitar || canCreateDocument || customActionLabel) && (
                <div className="flex items-center gap-2 ml-2 pl-4 border-l border-slate-200">
                  {canGenerateAtesto && onGenerateAtesto && (
                    <button
                      onClick={onGenerateAtesto}
                      disabled={isLoadingAtesto}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
                    >
                      {isLoadingAtesto ? <RefreshCw size={16} className="animate-spin" /> : <BadgeCheck size={16} />}
                      Gerar Atesto
                    </button>
                  )}
                  
                  {canTramitar && onTramitar && (
                    <button
                      onClick={onTramitar}
                      disabled={isTramitarDisabled}
                      title={isTramitarDisabled ? "Gere a Certidão de Atesto primeiro" : "Enviar para SOSFU"}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg 
                        ${isTramitarDisabled 
                          ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none border border-slate-400' 
                          : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200'}
                      `}
                    >
                      {isTramitarDisabled ? <Search size={16}/> : <Send size={16} />}
                      {isTramitarDisabled ? 'Aguardando Atesto' : 'Tramitar'}
                    </button>
                  )}
                  
                  {canCreateDocument && onCreateDocument && (
                    <button
                      onClick={onCreateDocument}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
                    >
                      <Plus size={16} />
                      Novo Doc
                    </button>
                  )}
                  
                  {customActionLabel && onCustomAction && (
                    <button
                      onClick={onCustomAction}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-200"
                    >
                      {customActionLabel}
                    </button>
                  )}
                </div>
              )}
              
              {/* SOSFU Exception Workflow Buttons */}
              {showExceptionButtons && (
                <div className="flex items-center gap-2 ml-2 pl-4 border-l border-amber-300">
                  <button
                    onClick={() => setShowDocumentWizard(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all shadow-sm"
                  >
                    <Plus size={16} />
                    Novo Doc
                  </button>
                  
                  <button
                    onClick={handleTramitarToAJSEFIN}
                    disabled={isTramiting || !hasDespacho}
                    title={!hasDespacho ? 'Crie um Despacho primeiro' : 'Enviar para AJSEFIN'}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg 
                      ${!hasDespacho 
                        ? 'bg-amber-100 text-amber-600 cursor-not-allowed shadow-none border border-amber-300' 
                        : 'bg-amber-500 text-white hover:bg-amber-600 shadow-amber-200'}
                    `}
                  >
                    {isTramiting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    {!hasDespacho ? 'Aguardando Despacho' : 'Tramitar para AJSEFIN'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-5 py-4 font-bold text-sm transition-all relative whitespace-nowrap
                    ${isActive 
                      ? 'text-blue-600 bg-blue-50/50' 
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                    }
                  `}
                >
                  <Icon size={18} />
                  {tab.label}
                  
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6">
          {/* Banner de Exceção de Policiais para Júri */}
          {hasExcepcaoPoliciais && (
            <JuriExceptionInlineAlert
              policiais={qtdPoliciais}
              userRole={viewerRole}
            />
          )}
          
          {activeTab === 'overview' && (
            <DetailsTab process={processData} />
          )}
          
          {activeTab === 'dossier' && currentUserId && (
            <UniversalDossierPanel
              processId={processId}
              processData={processData}
              currentUserId={currentUserId}
            />
          )}
          
          {activeTab === 'execution' && (
            <ExecutionTab 
              processData={processData}
              enrichedProcessData={processData}
            />
          )}
          
          {activeTab === 'analysis' && (
            <TechnicalAnalysisTab 
              processData={processData}
              enrichedProcessData={processData}
            />
          )}

          {activeTab === 'prestacao' && isPCPhase && (
             <div className="animate-in fade-in">
               <PrestacaoContasTab
                 solicitacaoId={processId}
                 processData={{
                   nup: processData.nup,
                   valorConcedido: processData.valor_total || 0,
                   supridoNome: processData.suprido_nome || (processData as any).profiles?.nome || 'Suprido',
                   dataFim: (processData as any)?.data_fim,
                   portariaData: executionDocuments.find(d => d.tipo === 'PORTARIA')?.generated_at  
                     || executionDocuments.find(d => d.tipo === 'PORTARIA')?.created_at,
                   prazoPrestacao: (processData as any)?.prazo_prestacao
                 }}
                 onBaixaSiafe={() => setShowBaixaSiafeModal(true)}
                 onDevolver={() => refetch()}
               />
             </div>
          )}
          
          {/* Modal de Baixa SIAFE */}
          {showBaixaSiafeModal && (
            <BaixaSiafeModal
              solicitacaoId={processId}
              processData={{
                nup: processData.nup,
                supridoNome: processData.suprido_nome || 'Suprido',
                valorConcedido: processData.valor_total || 0,
                portariaNumero: (processData as any)?.portaria_numero
              }}
              onClose={() => setShowBaixaSiafeModal(false)}
              onSuccess={() => {
                setShowBaixaSiafeModal(false);
                refetch();
              }}
            />
          )}
          
          {activeTab === 'juriAdjust' && isJuriProcess(processData) && (
            <JuriAdjustmentTab 
              processData={processData}
              viewerRole={viewerRole}
            />
          )}
        </div>
      </div>
      
      {/* SOSFU Exception - Document Creation Wizard */}
      {showDocumentWizard && (
        <DocumentCreationWizard
          isOpen={true}
          processId={processId}
          nup={processData.nup || ''}
          currentUser={null}
          onClose={() => setShowDocumentWizard(false)}
          onSuccess={() => {
            setShowDocumentWizard(false);
            refetch?.();
          }}
        />
      )}
    </div>
  );
};

export default ProcessDetailsPage;
