'use client'

import React, { useState } from 'react'
import { 
  Clock, 
  Gavel, 
  Eye,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  BadgeCheck
} from 'lucide-react'
import { useGestorProcesses } from '../../../hooks/useGestorProcesses'
import { UniversalProcessDetailsPage } from '../../ProcessDetails'
import { TramitarModal } from '../../TramitarModal'
import { DocumentCreationWizard } from '../../DocumentCreationWizard'
import { supabase } from '../../../lib/supabaseClient'
import { useToast } from '../../ui/ToastProvider'
import { StaticCertidaoAtesto } from '../../ProcessDetails/StaticDocuments/StaticCertidaoAtesto'

interface GestorInboxViewProps {
  searchQuery: string
}

export function GestorInboxView({ searchQuery }: GestorInboxViewProps) {
  const { data: pendingProcesses = [], isLoading, refetch } = useGestorProcesses()
  const { showToast } = useToast()
  
  const [selectedProcess, setSelectedProcess] = useState<any>(null)
  const [filterType, setFilterType] = useState<'ALL' | 'JURI' | 'EXTRA'>('ALL')
  const [showTramitarModal, setShowTramitarModal] = useState(false)
  const [showDocumentWizard, setShowDocumentWizard] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [isGeneratingAtesto, setIsGeneratingAtesto] = useState(false)
  
  // NEW: Preview modal state
  const [showAtestoPreview, setShowAtestoPreview] = useState(false)

  // Fetch current user
  React.useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setCurrentUserId(user.id)
    }
    fetchUser()
  }, [])

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  // Step 1: Open preview modal (triggered by button click)
  const handleOpenAtestoPreview = () => {
    if (!selectedProcess) return
    setShowAtestoPreview(true)
  }

  // Step 2: Actually generate and save the atesto (only after reviewing)
  const handleConfirmAtesto = async () => {
    if (!selectedProcess || !currentUserId) return

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

Declaro que verifiquei a disponibilidade orçamentária da unidade e a adequação dos itens solicitados.

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
        created_by: currentUserId
      })

      if (error) throw error

      setShowAtestoPreview(false)
      showToast({ 
        type: 'success', 
        title: 'Atesto Gerado!', 
        message: 'Certidão de Atesto salva com sucesso. Agora você pode tramitar.' 
      })

      // Refresh to show updated data
      refetch()

    } catch (error) {
      console.error('Error generating atesto:', error)
      showToast({ 
        type: 'error', 
        title: 'Erro', 
        message: 'Não foi possível gerar a Certidão de Atesto.' 
      })
    } finally {
      setIsGeneratingAtesto(false)
    }
  }

  // Filter processes
  const filteredProcesses = pendingProcesses.filter(p => {
    // Type filter
    if (filterType === 'JURI' && p.type !== 'SESSÃO DE JÚRI') return false
    if (filterType === 'EXTRA' && p.type !== 'EXTRA-EMERGENCIAL') return false
    
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

  // If a process is selected, show the Universal Process Details
  if (selectedProcess) {
    return (
      <>
        <UniversalProcessDetailsPage
          processId={selectedProcess.id}
          currentUserId={currentUserId}
          onClose={() => setSelectedProcess(null)}
          canTramitar={true}
          canGenerateAtesto={true}
          canCreateDocument={true}
          isLoadingAtesto={isGeneratingAtesto}
          onTramitar={() => setShowTramitarModal(true)}
          onGenerateAtesto={handleOpenAtestoPreview}
          onCreateDocument={() => setShowDocumentWizard(true)}
        />

        {/* ATESTO PREVIEW MODAL */}
        {showAtestoPreview && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 text-white flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  <BadgeCheck size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-black">Certidão de Atesto do Gestor</h3>
                  <p className="text-blue-100 text-sm font-medium">Revise o documento antes de assinar</p>
                </div>
              </div>
              
              {/* Document Preview - Using StaticCertidaoAtesto for WYSIWYG parity with Dossiê */}
              <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                  <StaticCertidaoAtesto 
                    processData={selectedProcess} 
                    documentData={{ status: 'MINUTA' }} 
                  />
                </div>
              </div>
              
              {/* Footer Actions */}
              <div className="border-t border-slate-200 bg-white px-8 py-5 flex items-center justify-between">
                <p className="text-xs text-slate-500 flex items-center gap-2">
                  <AlertCircle size={14} className="text-amber-500" />
                  Ao assinar, você confirma a veracidade das informações
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowAtestoPreview(false)}
                    className="px-6 py-3 bg-slate-100 font-bold text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleConfirmAtesto}
                    disabled={isGeneratingAtesto}
                    className="px-8 py-3 bg-blue-600 font-black text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isGeneratingAtesto ? (
                      <>
                        <RefreshCw size={18} className="animate-spin" />
                        Assinando...
                      </>
                    ) : (
                      <>
                        <BadgeCheck size={18} />
                        Assinar Certidão
                      </>
                    )}
                  </button>
                </div>
              </div>
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
      </>
    )
  }


  return (
    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar animate-in fade-in pb-32">
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
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <span className="text-lg font-black text-slate-800">
                  {formatCurrency(p.val || 0)}
                </span>
                <button className="flex items-center gap-1 text-xs font-bold text-blue-600 group-hover:underline">
                  <Eye size={14} /> Ver Detalhes
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
