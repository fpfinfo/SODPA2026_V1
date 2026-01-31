'use client'

import React, { useState } from 'react'
import { 
  Clock, 
  Gavel, 
  Eye,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  BadgeCheck,
  Zap,
  Calendar,
  Sparkles,
  Award,
  TrendingUp,
  Bell
} from 'lucide-react'
import { useGestorProcesses } from '../../../hooks/useGestorProcesses'
import { GestorProcessDetailsPage } from '../../ProcessDetails'
import { TramitarModal } from '../../TramitarModal'
import { DocumentCreationWizard } from '../../DocumentCreationWizard'
import { supabase } from '../../../lib/supabaseClient'
import { useToast } from '../../ui/ToastProvider'
import { StaticCertidaoAtesto } from '../../ProcessDetails/StaticDocuments/StaticCertidaoAtesto'
import { SignatureModal } from '../../ui/SignatureModal'
import { useUserProfile } from '../../../hooks/useUserProfile'
import { PrestacaoAtestoTab } from '../PrestacaoAtestoTab'
import { SolicitacaoAtestoModal } from '../SolicitacaoAtestoModal'

interface GestorInboxViewProps {
  searchQuery: string
}

const PREVIEW_DOCUMENT_DATA = {
  status: 'MINUTA',
  metadata: {
    numero_certidao: 'PREVIEW'
  }
};

export function GestorInboxView({ searchQuery }: GestorInboxViewProps) {
  const { data: pendingProcesses = [], isLoading, refetch } = useGestorProcesses()
  const { showToast } = useToast()
  
  const [selectedProcess, setSelectedProcess] = useState<any>(null)
  const [filterType, setFilterType] = useState<'ALL' | 'JURI' | 'EXTRA'>('ALL')
  const [filterPeriod, setFilterPeriod] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL')
  const [showTramitarModal, setShowTramitarModal] = useState(false)
  const [showDocumentWizard, setShowDocumentWizard] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [isGeneratingAtesto, setIsGeneratingAtesto] = useState(false)
  const [quickAtestoProcessId, setQuickAtestoProcessId] = useState<string | null>(null)
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)
  const [supridoStats, setSupridoStats] = useState<Record<string, { total: number; approved: number }>>({})
  const [lastProcessCount, setLastProcessCount] = useState<number>(0)
  
  // NEW: Preview modal state
  const [showAtestoPreview, setShowAtestoPreview] = useState(false)
  
  // Signature Modal State
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const { userProfile } = useUserProfile({ id: currentUserId });

  // PC Atesto View State - when process has an AGUARDANDO_ATESTO_GESTOR PC
  const [showPCAtestoView, setShowPCAtestoView] = useState(false);

  // Fetch current user
  React.useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setCurrentUserId(user.id)
    }
    fetchUser()
  }, [])

  // Fetch suprido stats for each unique user in pending processes
  React.useEffect(() => {
    const fetchSupridoStats = async () => {
      const uniqueUserIds = [...new Set(pendingProcesses.map(p => p.rawData?.user_id).filter(Boolean))]
      
      if (uniqueUserIds.length === 0) return
      
      const newStats: Record<string, { total: number; approved: number }> = {}
      
      for (const userId of uniqueUserIds) {
        const { count: total } = await supabase
          .from('solicitacoes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
        
        const { count: approved } = await supabase
          .from('solicitacoes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .in('status', ['ATESTADO', 'CONCLUIDO', 'APROVADO', 'CONCEDIDO'])
        
        newStats[userId as string] = { total: total || 0, approved: approved || 0 }
      }
      
      setSupridoStats(newStats)
    }
    
    if (pendingProcesses.length > 0) {
      fetchSupridoStats()
    }
  }, [pendingProcesses])

  // Detect new processes and show notification
  React.useEffect(() => {
    if (lastProcessCount > 0 && pendingProcesses.length > lastProcessCount) {
      const newCount = pendingProcesses.length - lastProcessCount
      showToast({
        type: 'info',
        title: `${newCount} nova${newCount > 1 ? 's' : ''} solicitação${newCount > 1 ? 'ões' : ''}!`,
        message: 'Verifique sua caixa de entrada.'
      })
    }
    setLastProcessCount(pendingProcesses.length)
  }, [pendingProcesses.length])

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  // Step 1: Open preview modal (triggered by button click)
  // Detect if it's a PC attestation based on status_workflow
  const handleOpenAtestoPreview = () => {
    if (!selectedProcess) return
    
    // Check if this is a PC attestation (status_workflow indicates AGUARDANDO_ATESTO_GESTOR)
    const isPCProcess = selectedProcess.rawData?.status_workflow === 'AGUARDANDO_ATESTO_GESTOR' ||
                        selectedProcess.rawData?.status_workflow === 'PC_SUBMITTED' ||
                        selectedProcess.status === 'AGUARDANDO_ATESTO_GESTOR';
    
    if (isPCProcess) {
      // Open PC Atesto view instead of generic atesto
      setShowPCAtestoView(true);
    } else {
      // Open generic atesto preview
      setShowAtestoPreview(true);
    }
  }

  // Step 2: Initiate signature (opens PIN modal)
  const handleInitiateAtesto = () => {
    if (!userProfile?.signature_pin) {
      showToast({
        title: 'PIN não configurado',
        message: 'Configure seu PIN de assinatura no perfil para prosseguir.',
        type: 'error'
      })
      return
    }
    setIsSignatureModalOpen(true)
  }

  // Step 3: Actually generate and save the atesto (after PIN validation)
  const handleConfirmAtestoWithPin = async (pin: string): Promise<{ success: boolean; error?: string }> => {
    if (!selectedProcess || !currentUserId) return { success: false, error: 'Erro de sessão' }

    // Validate PIN
    if (pin !== userProfile?.signature_pin) {
        return { success: false, error: 'PIN incorreto.' }
    }

    setIsGeneratingAtesto(true)
    try {
      // Get current user profile for name
      const { data: profile } = await supabase
        .from('profiles')
        .select('nome, cargo')
        .eq('id', currentUserId)
        .single()

      const gestor = profile?.nome || 'Gestor'
      const cargo = profile?.cargo || 'Chefia Imediata'
      
      // Generate the Certidão de Atesto document
      const atestoContent = `CERTIDÃO DE ATESTO DA CHEFIA IMEDIATA

CERTIFICO, no uso das minhas atribuições legais e em conformidade com o Regulamento de Suprimento de Fundos do TJPA, que a despesa pretendida pelo servidor ${selectedProcess.interested} no processo ${selectedProcess.nup} reveste-se de interesse público e atende aos critérios de conveniência e oportunidade desta unidade judiciária.

Declaro que verifiquei a adequação dos itens solicitados.

Atesto, ainda, a impossibilidade de atendimento da demanda via fluxo normal de compras/licitação em tempo hábil.

Encaminhe-se ao Serviço de Suprimento de Fundos (SOSFU) para análise técnica.

${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}

${gestor}
${cargo}`

      // Save the Atesto document to Supabase
      const { error } = await supabase.from('documentos').insert({
        solicitacao_id: selectedProcess.id,
        nome: `Certidão de Atesto do Gestor - ${selectedProcess.nup}`,
        titulo: 'Certidão de Atesto do Gestor',
        tipo: 'CERTIDAO_ATESTO',
        status: 'ASSINADO',
        conteudo: atestoContent,
        created_by: currentUserId,
        // Add metadata about signature
        metadata: {
            signed_at: new Date().toISOString(),
            signer_id: currentUserId,
            signer_role: userProfile?.role
        }
      })

      if (error) throw error

      // UPDATE STATUS: Change process status to ATESTADO after signing
      const { error: updateError } = await supabase
        .from('solicitacoes')
        .update({ 
          status: 'ATESTADO', // Processo atestado, pronto para tramitação
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedProcess.id)
      
      if (updateError) {
        console.error('Error updating process status:', updateError)
        // Continue even if status update fails - document was saved
      }

      setShowAtestoPreview(false)
      
      // Trigger success animation
      setShowSuccessAnimation(true)
      setTimeout(() => setShowSuccessAnimation(false), 3000)
      
      showToast({ 
        type: 'success', 
        title: 'Atesto Gerado!', 
        message: 'Certidão de Atesto salva com sucesso. Agora você pode tramitar.' 
      })

      // Refresh to show updated data
      refetch()
      return { success: true }

    } catch (error) {
      console.error('Error generating atesto:', error)
      return { success: false, error: 'Não foi possível gerar a Certidão de Atesto.' }
    } finally {
      setIsGeneratingAtesto(false)
    }
  }

  // Quick Atesto - atesta processo diretamente do card sem abrir detalhes
  const handleQuickAtesto = async (e: React.MouseEvent, process: any) => {
    e.stopPropagation() // Prevent opening process details
    
    // Check if this is a PC attestation
    const isPCProcess = process.rawData?.status_workflow === 'AGUARDANDO_ATESTO_GESTOR' ||
                        process.rawData?.status_workflow === 'PC_SUBMITTED' ||
                        (process.status as string)?.toUpperCase().includes('AGUARDANDO ATESTO'); // Robust string check

    if (isPCProcess) {
        setSelectedProcess(process);
        setShowPCAtestoView(true);
        return;
    }

    if (!userProfile?.signature_pin) {
      showToast({
        title: 'PIN não configurado',
        message: 'Configure seu PIN de assinatura no perfil para usar o atesto rápido.',
        type: 'error'
      })
      return
    }
    
    setQuickAtestoProcessId(process.id)
    setSelectedProcess(process)
    setIsSignatureModalOpen(true)
  }

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Esc to go back
      if (e.key === 'Escape') {
        if (showAtestoPreview) setShowAtestoPreview(false)
        else if (showPCAtestoView) setShowPCAtestoView(false)
        else if (showTramitarModal) setShowTramitarModal(false)
        else if (selectedProcess) setSelectedProcess(null)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showAtestoPreview, showPCAtestoView, showTramitarModal, selectedProcess])

  // Filter processes
  const filteredProcesses = pendingProcesses.filter(p => {
    // Type filter
    if (filterType === 'JURI' && p.type !== 'SESSÃO DE JÚRI') return false
    if (filterType === 'EXTRA' && p.type !== 'EXTRA-EMERGENCIAL') return false
    
    // Period filter
    if (filterPeriod !== 'ALL' && p.rawData?.created_at) {
      const createdAt = new Date(p.rawData.created_at)
      const now = new Date()
      const daysDiff = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
      
      if (filterPeriod === 'TODAY' && daysDiff > 0) return false
      if (filterPeriod === 'WEEK' && daysDiff > 7) return false
      if (filterPeriod === 'MONTH' && daysDiff > 30) return false
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        p.nup?.toLowerCase().includes(query) ||
        p.interested?.toLowerCase().includes(query) ||
        p.type?.toLowerCase().includes(query)
      )
    }
    return true
  })

  // Check for Atesto document
  const [hasAtesto, setHasAtesto] = useState(false)
  const [checkingAtesto, setCheckingAtesto] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0) // Helper to force refresh

  React.useEffect(() => {
    let isMounted = true;
    const checkDocs = async () => {
      if (!selectedProcess) return;
      setCheckingAtesto(true);
      const { data } = await supabase
        .from('documentos')
        .select('id')
        .eq('solicitacao_id', selectedProcess.id)
        .eq('tipo', 'CERTIDAO_ATESTO')
        .maybeSingle(); // Use maybeSingle for efficiency
      
      if (isMounted) {
        setHasAtesto(!!data);
        setCheckingAtesto(false);
      }
    };
    checkDocs();
    return () => { isMounted = false };
  }, [selectedProcess, isGeneratingAtesto, refreshTrigger]); // Re-run when trigger changes

  // If a process is selected, show the Universal Process Details
  if (selectedProcess) {
    return (
      <>
        <GestorProcessDetailsPage
          processId={selectedProcess.id}
          currentUserId={currentUserId}
          onClose={() => setSelectedProcess(null)}
          onProcessUpdated={() => {
            refetch();
            setRefreshTrigger(prev => prev + 1);
          }}
          canTramitar={true}
          isTramitarDisabled={!hasAtesto} // Block if no atesto
          canGenerateAtesto={!hasAtesto} // Show generate if no atesto
          canCreateDocument={true}
          isLoadingAtesto={isGeneratingAtesto || checkingAtesto}
          onTramitar={() => setShowTramitarModal(true)}
          onGenerateAtesto={handleOpenAtestoPreview}
          onCreateDocument={() => setShowDocumentWizard(true)}
        />

        {/* ATESTO PREVIEW / ANALYSIS MODAL */}
        {showAtestoPreview && (
          <SolicitacaoAtestoModal
            isOpen={showAtestoPreview}
            onClose={() => setShowAtestoPreview(false)}
            onConfirm={handleConfirmAtestoWithPin}
            process={selectedProcess}
            isLoading={isGeneratingAtesto}
          />
        )}

        {/* PC ATESTO VIEW - Full screen modal for Prestação de Contas attestation */}
        {showPCAtestoView && (
          <div className="fixed inset-0 z-[300] flex flex-col bg-white animate-in fade-in duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-8 py-6 text-white flex items-center gap-4">
              <button 
                onClick={() => setShowPCAtestoView(false)}
                className="p-2 hover:bg-white/20 rounded-xl transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              </button>
              <div className="flex-1">
                <h3 className="text-xl font-black">Análise de Prestação de Contas</h3>
                <p className="text-emerald-100 text-sm font-medium">NUP: {selectedProcess.nup}</p>
              </div>
            </div>
            
            {/* Content - PrestacaoAtestoTab */}
            <div className="flex-1 overflow-auto p-6 max-w-7xl mx-auto w-full">
              <PrestacaoAtestoTab 
                processId={selectedProcess.id} 
                processData={selectedProcess.rawData || selectedProcess}
                onBack={() => setShowPCAtestoView(false)}
                onSuccess={() => {
                  setShowPCAtestoView(false);
                  refetch();
                  showToast({ type: 'success', title: 'Sucesso', message: 'Prestação de Contas atestada e enviada.' });
                }}
              />
            </div>
          </div>
        )}

        {showTramitarModal && (
          <TramitarModal
            isOpen={true}
            onClose={() => setShowTramitarModal(false)}
            processId={selectedProcess.id}
            processNup={selectedProcess.nup}
            currentStatus={selectedProcess.status || 'PENDENTE ATESTO'}
            currentModule="GESTOR"
            onSuccess={() => {
              setShowTramitarModal(false)
              refetch()
              setSelectedProcess(null)
            }}
          />
        )}

        {showDocumentWizard && (
          <DocumentCreationWizard
            isOpen={showDocumentWizard}
            processId={selectedProcess.id}
            processNup={selectedProcess.nup}
            onClose={() => setShowDocumentWizard(false)}
            onDocumentCreated={() => {
              setShowDocumentWizard(false)
            }}
          />
        )}
        
        <SignatureModal
           isOpen={isSignatureModalOpen}
           onClose={() => setIsSignatureModalOpen(false)}
           onConfirm={handleConfirmAtestoWithPin}
           title="Assinar Certidão"
           description="Digite seu PIN para assinar digitalmente a certidão de atesto."
        />
      </>
    )
  }


  return (
    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar animate-in fade-in pb-32 relative">
      
      {/* Success Animation Overlay */}
      {showSuccessAnimation && (
        <div className="fixed inset-0 z-[500] pointer-events-none flex items-center justify-center">
          {/* Confetti particles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-bounce"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 0.5}s`,
                  animationDuration: `${0.5 + Math.random() * 1}s`
                }}
              >
                <Sparkles 
                  size={16 + Math.random() * 16} 
                  className={`${['text-amber-400', 'text-emerald-400', 'text-blue-400', 'text-pink-400'][Math.floor(Math.random() * 4)]}`}
                />
              </div>
            ))}
          </div>
          
          {/* Central success message */}
          <div className="bg-white/95 backdrop-blur-sm px-12 py-8 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col items-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
              <CheckCircle2 size={48} className="text-emerald-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">Atesto Concluído!</h2>
            <p className="text-sm text-slate-500 mt-2">O processo foi atestado com sucesso.</p>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Fila de Homologação</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Solicitações aguardando seu atesto
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Filter Pills */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setFilterType('ALL')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterType === 'ALL' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Todos
            </button>
            <button 
              onClick={() => setFilterType('JURI')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterType === 'JURI' 
                  ? 'bg-white text-amber-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Júri
            </button>
            <button 
              onClick={() => setFilterType('EXTRA')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterType === 'EXTRA' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Emergencial
            </button>
          </div>

          {/* Period Filter */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setFilterPeriod('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                filterPeriod === 'ALL' 
                  ? 'bg-white text-slate-700 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Calendar size={12} /> Todos
            </button>
            <button 
              onClick={() => setFilterPeriod('TODAY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterPeriod === 'TODAY' 
                  ? 'bg-white text-emerald-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Hoje
            </button>
            <button 
              onClick={() => setFilterPeriod('WEEK')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterPeriod === 'WEEK' 
                  ? 'bg-white text-amber-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Semana
            </button>
            <button 
              onClick={() => setFilterPeriod('MONTH')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterPeriod === 'MONTH' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Mês
            </button>
          </div>

          <button 
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Process Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm h-64 animate-pulse">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-slate-200 rounded-xl" />
                <div className="w-20 h-6 bg-slate-100 rounded-lg" />
              </div>
              <div className="space-y-3 mb-8">
                <div className="w-3/4 h-6 bg-slate-200 rounded-lg" />
                <div className="w-1/2 h-4 bg-slate-100 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredProcesses.length === 0 ? (
        <div className="bg-white rounded-[32px] border border-slate-200 p-20 text-center border-dashed">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-emerald-500" />
          </div>
          <p className="text-xl font-black text-slate-900">Fila Zerada!</p>
          <p className="text-sm text-slate-500 max-w-xs mx-auto mt-2">
            Não há solicitações pendentes de atesto no momento.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProcesses.map(p => (
            <div
              key={p.id}
              onClick={() => setSelectedProcess(p)}
              className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-300 hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden"
            >
              {/* Top Accent */}
              <div className={`absolute top-0 left-0 w-full h-1 ${
                p.type === 'SESSÃO DE JÚRI' ? 'bg-amber-400' : 'bg-blue-500'
              }`} />

              {/* Quick Atesto Button - Appears on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-blue-600/90 via-blue-600/70 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-4 z-10">
                <button
                  onClick={(e) => handleQuickAtesto(e, p)}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-blue-700 rounded-xl font-black text-sm shadow-xl hover:bg-blue-50 transition-all transform hover:scale-105 active:scale-95"
                >
                  <Zap size={18} className="text-amber-500" />
                  Atestar Rápido
                </button>
              </div>

              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${
                  p.type === 'SESSÃO DE JÚRI' 
                    ? 'bg-amber-50 text-amber-600' 
                    : 'bg-blue-50 text-blue-600'
                }`}>
                  {p.type === 'SESSÃO DE JÚRI' ? <Gavel size={20} /> : <Clock size={20} />}
                </div>
                <span className="text-[10px] font-black bg-slate-50 text-slate-400 px-2 py-1 rounded-lg border border-slate-100">
                  {p.nup}
                </span>
              </div>

              <div className="mb-4">
                <h3 className="text-base font-black text-slate-800 leading-tight mb-1 line-clamp-2">
                  {p.type}
                </h3>
                <p className="text-xs text-slate-500 font-medium">{p.interested}</p>
                {/* Suprido Stats Badge */}
                {p.rawData?.user_id && supridoStats[p.rawData.user_id] && (
                  <div className="flex items-center gap-2 mt-2">
                    {supridoStats[p.rawData.user_id].total > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold bg-slate-100 text-slate-600 rounded-full">
                        <TrendingUp size={10} />
                        {supridoStats[p.rawData.user_id].total} solicitações
                      </span>
                    )}
                    {supridoStats[p.rawData.user_id].approved > 0 && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold rounded-full ${
                        supridoStats[p.rawData.user_id].approved / supridoStats[p.rawData.user_id].total >= 0.8
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        <Award size={10} />
                        {Math.round((supridoStats[p.rawData.user_id].approved / supridoStats[p.rawData.user_id].total) * 100)}% aprovado
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <span className="text-lg font-black text-slate-800">
                  {formatCurrency(p.val || 0)}
                </span>
                <div className="flex items-center gap-2">
                  {/* SLA Badge */}
                  {(() => {
                    // Calculate days since creation
                    const createdAt = p.rawData?.created_at ? new Date(p.rawData.created_at) : new Date();
                    const daysSince = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
                    
                    if (daysSince <= 2) {
                      return (
                        <span className="px-2 py-0.5 text-[10px] font-black bg-emerald-100 text-emerald-700 rounded-full border border-emerald-200">
                          🟢 OK
                        </span>
                      );
                    } else if (daysSince <= 5) {
                      return (
                        <span className="px-2 py-0.5 text-[10px] font-black bg-amber-100 text-amber-700 rounded-full border border-amber-200 animate-pulse">
                          🟡 {daysSince}d
                        </span>
                      );
                    } else {
                      return (
                        <span className="px-2 py-0.5 text-[10px] font-black bg-red-100 text-red-700 rounded-full border border-red-200 animate-pulse">
                          🔴 {daysSince}d
                        </span>
                      );
                    }
                  })()}
                  <span className="flex items-center gap-1 text-xs font-bold text-blue-600 group-hover:hidden">
                    <Eye size={14} /> Ver
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
