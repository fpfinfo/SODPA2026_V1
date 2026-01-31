/**
 * GestorProcessDetailsPage
 * 
 * Componente específico para visualização de detalhes de processo pelo Gestor.
 * O Gestor só pode ver: Visão Geral e Dossiê Digital.
 * NÃO tem acesso a: Execução da Despesa, Análise Técnica (são funções do SOSFU).
 */
import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Eye,
  FolderOpen,
  BadgeCheck,
  Plus,
  Loader2,
  Send,
  RefreshCw,
  Search,
  AlertTriangle
} from 'lucide-react';
import { JuriExceptionInlineAlert } from '../ui/JuriExceptionInlineAlert';
import { useProcessDetails } from '../../hooks/useProcessDetails';
import { DetailsTab } from './Tabs/DetailsTab';
import { UniversalDossierPanel } from './UniversalDossierPanel';
import { supabase } from '../../lib/supabaseClient';

type TabType = 'overview' | 'dossier';

interface GestorProcessDetailsPageProps {
  processId: string;
  onClose: () => void;
  currentUserId?: string;
  onProcessUpdated?: () => void; // New callback
  
  // Action capabilities
  canTramitar?: boolean;
  isTramitarDisabled?: boolean;
  canGenerateAtesto?: boolean;
  canCreateDocument?: boolean;
  isLoadingAtesto?: boolean;
  
  // Action callbacks
  onTramitar?: () => void;
  onGenerateAtesto?: () => void;
  onCreateDocument?: () => void;
  
  // Custom action (e.g., "Analisar PC")
  customActionLabel?: string;
  onCustomAction?: () => void;

  // Exceção de Júri (policiais acima do limite)
  hasExcepcaoPoliciais?: boolean;
  qtdPoliciais?: number;
  limitePoliciais?: number;
  hasOficioJustificativa?: boolean;
}

// Destructuring
export const GestorProcessDetailsPage: React.FC<GestorProcessDetailsPageProps> = ({
  processId,
  onClose,
  currentUserId: passedUserId,
  onProcessUpdated, // Destructured
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
  hasExcepcaoPoliciais,
  qtdPoliciais,
  limitePoliciais = 5,
  hasOficioJustificativa: propHasOficioJustificativa,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [currentUserId, setCurrentUserId] = useState<string | null>(passedUserId || null);
  const { processData, isLoading, error, refetch } = useProcessDetails(processId);
  
  // LOCAL: State for dossier documents to check for Ofício
  const [localHasOficio, setLocalHasOficio] = useState<boolean | null>(null);

  // Fetch current user ID if not passed
  useEffect(() => {
    if (!passedUserId) {
      supabase.auth.getUser().then(({ data }) => {
        if (data.user) setCurrentUserId(data.user.id);
      });
    }
  }, [passedUserId]);

  // LOCAL: Fetch dossier documents to check for Ofício de Justificativa
  useEffect(() => {
    const fetchAndCheckOficio = async () => {
      if (!processId) return;
      
      const { data: docs } = await supabase
        .from('documentos')
        .select('tipo, titulo, nome')
        .eq('solicitacao_id', processId);
      
      if (docs) {
        const hasOficio = docs.some((doc: any) => {
          const tipo = (doc.tipo || '').toUpperCase();
          const titulo = (doc.titulo || '').toUpperCase();
          const nome = (doc.nome || '').toUpperCase();
          
          return (
            tipo.includes('OFICIO') || tipo.includes('OFÍCIO') ||
            tipo.includes('JUSTIFICATIVA') ||
            titulo.includes('OFICIO') || titulo.includes('OFÍCIO') ||
            titulo.includes('JUSTIFICATIVA') ||
            nome.includes('OFICIO') || nome.includes('OFÍCIO') ||
            nome.includes('JUSTIFICATIVA')
          );
        });
        setLocalHasOficio(hasOficio);
        console.log('[DEBUG] Ofício check:', { processId, docsCount: docs.length, hasOficio, docs: docs.map(d => ({ tipo: d.tipo, titulo: d.titulo })) });
      }
    };
    
    fetchAndCheckOficio();
  }, [processId, activeTab]); // Re-check when tab changes (after creating new doc)

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

  // GESTOR TABS: Apenas Visão Geral e Dossiê Digital
  const tabs = [
    { id: 'overview' as TabType, label: 'Visão Geral', icon: Eye },
    { id: 'dossier' as TabType, label: 'Dossiê Digital', icon: FolderOpen },
  ];

  // =========================================================================
  // DETECÇÃO DE EXCEÇÃO JÚRI - Limite de Policiais (LOCAL)
  // =========================================================================
  const LIMITE_POLICIAIS = 5;
  
  const localJuriParticipantes = (() => {
    try {
      const participantes = processData.juri_participantes;
      if (!participantes) return { policiais: 0, jurados: 0 };
      
      // Handle different formats: string JSON, object, or number
      let parsed: any;
      if (typeof participantes === 'string') {
        parsed = JSON.parse(participantes);
      } else if (typeof participantes === 'object') {
        parsed = participantes;
      } else if (typeof participantes === 'number') {
        return { policiais: participantes, jurados: 0 };
      } else {
        return { policiais: 0, jurados: 0 };
      }
      
      // Extract policiais from different possible keys - NOTE: banco usa 'policias' (sem 'i')
      const policiais = Number(parsed.policias) || Number(parsed.policiais) || Number(parsed.policia) || Number(parsed.qtd_policiais) || 0;
      const jurados = Number(parsed.jurados) || Number(parsed.qtd_jurados) || 0;
      
      return { policiais, jurados };
    } catch { return { policiais: 0, jurados: 0 }; }
  })();

  // Case-insensitive comparison for process type
  const tipoUpperCase = (processData.tipo || '').toUpperCase();
  const localIsJuriProcess = tipoUpperCase.includes('JÚRI') || tipoUpperCase.includes('JURI');
  const localHasExcepcaoPoliciais = localIsJuriProcess && localJuriParticipantes.policiais > LIMITE_POLICIAIS;
  const localQtdPoliciais = localJuriParticipantes.policiais;

  // Use local detection if props are not provided
  const effectiveHasExcepcao = hasExcepcaoPoliciais ?? localHasExcepcaoPoliciais;
  const effectiveQtdPoliciais = qtdPoliciais ?? localQtdPoliciais;
  
  // Use local ofício detection (prefers local over prop as it's more up-to-date)
  const effectiveHasOficio = localHasOficio ?? propHasOficioJustificativa ?? false;
  
  // Botão Tramitar deve estar HABILITADO quando:
  // 1. Não há exceção de policiais, OU
  // 2. Há exceção MAS há ofício anexado
  const canTramitarByException = !effectiveHasExcepcao || (effectiveHasExcepcao && effectiveHasOficio);
  
  console.log('[DEBUG] GestorProcessDetailsPage - Exceção Júri:', {
    processDataTipo: processData.tipo,
    tipoUpperCase,
    localIsJuriProcess,
    localHasExcepcaoPoliciais,
    localQtdPoliciais: effectiveQtdPoliciais,
    effectiveHasExcepcao,
    localHasOficio,
    effectiveHasOficio,
    canTramitarByException
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const processValue = processData.valor_total || 0;

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
                  
                  {canTramitar && onTramitar && (() => {
                    // Combina disabled original com exceção de policiais (considerando ofício)
                    // Se tem exceção MAS tem ofício, pode tramitar
                    const hasExceptionWithoutOficio = effectiveHasExcepcao && !effectiveHasOficio;
                    const isButtonDisabled = isTramitarDisabled || hasExceptionWithoutOficio;
                    const buttonReason = hasExceptionWithoutOficio 
                      ? "Anexe Ofício de Justificativa para exceção de policiais" 
                      : isTramitarDisabled 
                        ? "Gere a Certidão de Atesto primeiro" 
                        : "Enviar para SOSFU";
                    const buttonLabel = hasExceptionWithoutOficio 
                      ? 'Aguardando Ofício' 
                      : isTramitarDisabled 
                        ? 'Aguardando Atesto' 
                        : 'Tramitar';
                    
                    return (
                    <button
                      onClick={onTramitar}
                      disabled={isButtonDisabled}
                      title={buttonReason}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg 
                        ${isButtonDisabled 
                          ? hasExceptionWithoutOficio 
                            ? 'bg-amber-100 text-amber-700 cursor-not-allowed shadow-none border-2 border-amber-300'
                            : 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none border border-slate-400' 
                          : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200'}
                      `}
                    >
                      {isButtonDisabled ? <AlertTriangle size={16}/> : <Send size={16} />}
                      {buttonLabel}
                    </button>
                    );
                  })()}
                  
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
            </div>
          </div>
        </div>
      </header>

      {/* Banner de Exceção de Júri - Policiais Acima do Limite */}
      {effectiveHasExcepcao && (
        <div className="max-w-7xl mx-auto px-6 py-4">
          <JuriExceptionInlineAlert
            policiais={effectiveQtdPoliciais}
            userRole="GESTOR"
          />
        </div>
      )}

      {/* Tab Navigation - APENAS 2 TABS PARA GESTOR */}
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
          {activeTab === 'overview' && (
            <DetailsTab process={processData} />
          )}
          
          {activeTab === 'dossier' && currentUserId && (
            <UniversalDossierPanel
              processId={processId}
              processData={processData}
              currentUserId={currentUserId}
              onDocumentDeleted={() => {
                refetch();
                if (onProcessUpdated) onProcessUpdated();
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default GestorProcessDetailsPage;
