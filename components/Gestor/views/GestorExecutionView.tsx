'use client'

import React, { useState, useEffect } from 'react'
import { 
  Zap,
  Lock,
  CheckCircle2,
  Send,
  Plus,
  RefreshCw,
  FileText,
  DollarSign,
  Calendar,
  Sparkles,
  Eye,
  Trash2,
  ChevronDown,
  Save,
  Loader2,
  ArrowLeft,
  Info,
  X
} from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'
import { useToast } from '../../ui/ToastProvider'
import { UniversalProcessDetailsPage } from '../../ProcessDetails'

interface GestorExecutionViewProps {
  searchQuery: string
}

interface FormItem {
  id: string
  desc: string
  qty: number
  val: number
  element: string
}

interface ExpenseElement {
  code: string
  label: string
}

interface EmergencyRequest {
  id: string
  nup: string
  status: string
  valor_solicitado: number
  descricao: string
  created_at: string
  auto_atesto?: boolean
}

// Fallback if DB fetch fails
const FALLBACK_EXPENSE_ELEMENTS: ExpenseElement[] = [
  { code: '3.3.90.30.01', label: 'Material de Consumo' },
  { code: '3.3.90.30.02', label: 'Combustível' },
  { code: '3.3.90.33', label: 'Passagens e Despesas com Locomoção' },
  { code: '3.3.90.36', label: 'Outros Serv. Terceiros - Pessoa Física' },
  { code: '3.3.90.39', label: 'Outros Serv. Terceiros - Pessoa Jurídica' },
]

export function GestorExecutionView({ searchQuery }: GestorExecutionViewProps) {
  const { showToast } = useToast()
  
  const [myRequests, setMyRequests] = useState<EmergencyRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showNewRequestForm, setShowNewRequestForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [expenseElements, setExpenseElements] = useState<ExpenseElement[]>(FALLBACK_EXPENSE_ELEMENTS)
  
  // Ver Detalhes state
  const [selectedRequest, setSelectedRequest] = useState<EmergencyRequest | null>(null)
  
  // AI Modal state
  const [showAiModal, setShowAiModal] = useState(false)
  const [isGeneratingAi, setIsGeneratingAi] = useState(false)
  
  // Form state - matching SupridoDashboard FormState
  const [formState, setFormState] = useState({
    startDate: '',
    endDate: '',
    desc: '',
    urgency: 'Alta',
    items: [] as FormItem[]
  })

  const [currentUser, setCurrentUser] = useState<any>(null)

  // Fetch expense elements from DB
  const fetchExpenseElements = async () => {
    try {
      const { data } = await supabase
        .from('elementos_despesa')
        .select('codigo, descricao')
        .eq('ativo', true)
        .order('codigo', { ascending: true })

      if (data && data.length > 0) {
        setExpenseElements(data.map(el => ({
          code: el.codigo,
          label: el.descricao || el.codigo
        })))
      }
    } catch (error) {
      console.error('Error fetching expense elements:', error)
    }
  }

  // Fetch current user and their emergency requests
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        setCurrentUser({ ...user, ...profile })

        // Fetch my emergency requests
        const { data: requests, error } = await supabase
          .from('solicitacoes')
          .select('*')
          .eq('user_id', user.id)
          .eq('tipo', 'Extra-Emergencial')
          .order('created_at', { ascending: false })

        if (error) throw error
        setMyRequests(requests || [])
        
        await fetchExpenseElements()
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  // Form handlers
  const handleAddItem = () => {
    const newItem: FormItem = {
      id: Math.random().toString(),
      desc: '',
      element: '',
      qty: 1,
      val: 0
    }
    setFormState({ ...formState, items: [...formState.items, newItem] })
  }

  const handleRemoveItem = (index: number) => {
    const newItems = [...formState.items]
    newItems.splice(index, 1)
    setFormState({ ...formState, items: newItems })
  }

  const updateItem = (index: number, field: keyof FormItem, value: any) => {
    const newItems = [...formState.items]
    newItems[index] = { ...newItems[index], [field]: value }
    setFormState({ ...formState, items: newItems })
  }

  const totalValue = formState.items.reduce((acc, item) => acc + (item.val * item.qty), 0)

  const handleSubmit = async () => {
    // Validation
    if (formState.items.length === 0) {
      showToast({ type: 'warning', title: 'Campos obrigatórios', message: 'Adicione pelo menos um item de despesa.' })
      return
    }
    if (!formState.desc) {
      showToast({ type: 'warning', title: 'Campos obrigatórios', message: 'Preencha a justificativa.' })
      return
    }
    if (!formState.startDate) {
      showToast({ type: 'warning', title: 'Campos obrigatórios', message: 'Informe a data do evento.' })
      return
    }

    setIsSubmitting(true)
    try {
      // Generate NUP
      const year = new Date().getFullYear()
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
      const nup = `TJPA-EXT-${year}-${random}`

      // Payload matching SupridoDashboard handleCreateRequest
      // Note: auto_atesto columns need migration - see migrations/20260120_add_auto_atesto_columns.sql
      const payload: any = {
        user_id: currentUser.id,
        nup,
        tipo: 'Extra-Emergencial', // LOCKED
        status: 'AGUARDANDO SOSFU', // Skip atesto, go directly to SOSFU
        valor_solicitado: totalValue,
        valor_aprovado: 0,
        descricao: formState.desc,
        data_inicio: formState.startDate || null,
        data_fim: formState.endDate || null,
        urgencia: formState.urgency,
        itens_despesa: formState.items, // Same as Suprido
        destino_atual: 'SOSFU' // Direct to SOSFU
      }

      const { data: insertedData, error } = await supabase
        .from('solicitacoes')
        .insert(payload)
        .select('id')
        .single()

      if (error) throw error

      // Register auto-atesto in tramitacao history
      if (insertedData?.id) {
        await supabase.from('historico_tramitacao').insert({
          solicitacao_id: insertedData.id,
          origem: 'GESTOR',
          destino: 'SOSFU',
          status_anterior: 'RASCUNHO',
          status_novo: 'AGUARDANDO SOSFU',
          observacao: 'Auto-atesto: Gestor é o executor da despesa emergencial',
          usuario_id: currentUser.id
        })
      }

      showToast({ 
        type: 'success', 
        title: 'Solicitação Enviada!', 
        message: `Pedido ${nup} enviado para análise da SOSFU com auto-atesto.` 
      })

      // Reset form
      setFormState({ startDate: '', endDate: '', desc: '', urgency: 'Alta', items: [] })
      setShowNewRequestForm(false)
      
      // Refresh requests
      const { data } = await supabase
        .from('solicitacoes')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('tipo', 'Extra-Emergencial')
        .order('created_at', { ascending: false })
      
      setMyRequests(data || [])
    } catch (error: any) {
      console.error('Error submitting request:', error)
      showToast({ type: 'error', title: 'Erro', message: error.message || 'Não foi possível enviar a solicitação.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filter by search
  const filteredRequests = myRequests.filter(r => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      r.nup?.toLowerCase().includes(query) ||
      r.descricao?.toLowerCase().includes(query)
    )
  })

  // AI Justification Generator
  const handleAiJustification = async () => {
    setIsGeneratingAi(true)
    try {
      // Get expense element descriptions
      const elementDescriptions = formState.items
        .map(item => {
          const el = expenseElements.find(e => e.code === item.element)
          return el ? `${el.label} (R$ ${(item.val * item.qty).toFixed(2)})` : ''
        })
        .filter(Boolean)
        .join(', ')

      // Generate professional justification
      const justification = `Solicito a concessão de suprimento de fundos para atendimento de despesas extraordinárias/emergenciais no valor de ${formatCurrency(totalValue)}. Os recursos serão destinados para: ${elementDescriptions || 'despesas urgentes da unidade'}. O período de aplicação será ${formState.startDate ? `de ${new Date(formState.startDate).toLocaleDateString('pt-BR')}` : 'conforme necessidade'}${formState.endDate ? ` a ${new Date(formState.endDate).toLocaleDateString('pt-BR')}` : ''}. A presente solicitação se justifica pela urgência e imprevisibilidade da despesa, que não pode aguardar o trâmite normal de licitação ou dispensa, conforme previsto na Resolução CNJ nº 169/2013 e normativos internos do TJPA.`

      setFormState({ ...formState, desc: justification })
      setShowAiModal(false)
      showToast({ type: 'success', title: 'Justificativa Gerada!', message: 'Texto gerado com sucesso. Revise antes de enviar.' })
    } catch (error) {
      showToast({ type: 'error', title: 'Erro', message: 'Não foi possível gerar a justificativa.' })
    } finally {
      setIsGeneratingAi(false)
    }
  }

  // Ver Detalhes - render UniversalProcessDetailsPage
  if (selectedRequest) {
    return (
      <UniversalProcessDetailsPage
        processId={selectedRequest.id}
        currentUserId={currentUser?.id}
        onClose={() => setSelectedRequest(null)}
        canTramitar={false}
        canGenerateAtesto={false}
        canCreateDocument={false}
      />
    )
  }

  // If showing form, render the full form
  if (showNewRequestForm) {
    return (
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar animate-in fade-in pb-32">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500 text-white rounded-xl shadow-lg shadow-amber-200">
              <Zap size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">Nova Solicitação Emergencial</h1>
              <p className="text-slate-500 text-sm font-medium">Preencha os dados para criar sua solicitação</p>
            </div>
          </div>
          <button 
            onClick={() => setShowNewRequestForm(false)} 
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
          >
            <ArrowLeft size={16} /> Voltar
          </button>
        </div>

        {/* Info Box */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 mb-6">
          <Info className="text-amber-600 mt-0.5 shrink-0" size={18} />
          <div className="space-y-1">
            <p className="text-sm font-bold text-amber-800">Modo Executor Emergencial:</p>
            <p className="text-xs text-amber-600 leading-relaxed">
              Como Gestor, você pode solicitar fundos emergenciais diretamente. O processo possui 
              <strong> Auto-Atesto</strong> e será enviado diretamente para análise da SOSFU.
            </p>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Dados da Solicitação</h3>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold">
              <Lock size={14} />
              Extra-Emergencial
            </div>
          </div>
          
          <div className="p-8 space-y-8">
            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Data do Evento (Início) <span className="text-red-500">*</span>
                </label>
                <input 
                  type="date" 
                  value={formState.startDate} 
                  onChange={e => setFormState({...formState, startDate: e.target.value})}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 focus:ring-2 focus:ring-amber-100 focus:border-amber-400 outline-none transition-all" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Data do Evento (Fim)</label>
                <input 
                  type="date" 
                  value={formState.endDate} 
                  onChange={e => setFormState({...formState, endDate: e.target.value})}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 focus:ring-2 focus:ring-amber-100 focus:border-amber-400 outline-none transition-all" 
                />
              </div>
            </div>

            {/* Expense Elements */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Elementos de Despesa <span className="text-red-500">*</span>
                </label>
                <button 
                  onClick={handleAddItem} 
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                >
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
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:ring-2 focus:ring-amber-100 focus:border-amber-400 outline-none transition-all"
                      >
                        <option value="">Selecione o Elemento...</option>
                        {expenseElements.map(el => (
                          <option key={el.code} value={el.code}>{el.code} - {el.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24">
                      <input 
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={e => updateItem(index, 'qty', parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-center text-slate-700 focus:ring-2 focus:ring-amber-100 focus:border-amber-400 outline-none transition-all"
                        placeholder="Qtd"
                      />
                    </div>
                    <div className="w-32 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">R$</span>
                      <input 
                        type="number" 
                        value={item.val || ''}
                        placeholder="0,00"
                        onChange={e => updateItem(index, 'val', parseFloat(e.target.value) || 0)}
                        className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-right text-slate-700 focus:ring-2 focus:ring-amber-100 focus:border-amber-400 outline-none transition-all"
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
                <p className="text-sm font-bold text-slate-600">
                  Total: <span className="text-lg font-black text-amber-600 ml-2">{formatCurrency(totalValue)}</span>
                </p>
              </div>
            </div>

            {/* Justification */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Justificativa <span className="text-red-500">*</span>
                </label>
                <button 
                  onClick={() => setShowAiModal(true)}
                  className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border border-indigo-200/50"
                >
                  <Sparkles size={14} /> Gerar com IA
                </button>
              </div>
              <textarea 
                value={formState.desc}
                onChange={e => setFormState({...formState, desc: e.target.value})}
                className="w-full h-32 p-4 bg-white border border-slate-300 rounded-xl text-sm leading-relaxed text-slate-700 outline-none focus:ring-4 focus:ring-amber-50 focus:border-amber-400 transition-all resize-none shadow-inner"
                placeholder="Descreva a necessidade urgente da solicitação..."
              />
            </div>

            {/* Urgency */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Urgência</label>
              <div className="relative">
                <select 
                  value={formState.urgency} 
                  onChange={e => setFormState({...formState, urgency: e.target.value})}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 focus:ring-2 focus:ring-amber-100 focus:border-amber-400 outline-none transition-all appearance-none"
                >
                  <option value="Normal">Normal</option>
                  <option value="Alta">Alta</option>
                  <option value="Urgente">Urgente</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              </div>
            </div>

            {/* Stepper Preview */}
            <div className="bg-slate-50 rounded-2xl p-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Fluxo da Solicitação</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                  <span className="text-xs font-bold text-slate-700">Preenchimento</span>
                </div>
                <div className="h-0.5 w-8 bg-amber-300" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-emerald-600">Auto-Atesto</span>
                    <p className="text-[10px] text-slate-400">Homologado pelo Gestor</p>
                  </div>
                </div>
                <div className="h-0.5 w-8 bg-slate-200" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-slate-200 text-slate-500 rounded-full flex items-center justify-center text-xs font-bold">3</div>
                  <span className="text-xs font-bold text-slate-500">Análise SOSFU</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
            <button 
              onClick={() => setShowNewRequestForm(false)}
              className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50 transition-all shadow-sm"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-amber-500 text-white rounded-lg text-sm font-black hover:bg-amber-600 shadow-lg shadow-amber-200 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {isSubmitting ? 'Enviando...' : 'Enviar para SOSFU'}
            </button>
          </div>
        </div>

        {/* AI Modal - Must be inside this return block to render when form is visible */}
        {showAiModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowAiModal(false)}></div>
            <div className="relative bg-white w-full max-w-xl rounded-[32px] p-8 shadow-2xl space-y-6 text-center animate-in zoom-in-95">
              <button 
                onClick={() => setShowAiModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X size={20} />
              </button>
              <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl w-fit mx-auto shadow-inner">
                <Sparkles size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Gerador de Justificativa</h3>
                <p className="text-slate-500 text-sm font-medium">
                  A IA irá gerar um texto profissional baseado nos elementos de despesa selecionados.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleAiJustification} 
                  disabled={isGeneratingAi}
                  className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold uppercase text-xs tracking-wider hover:bg-indigo-700 flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 transition-all disabled:opacity-50"
                >
                  {isGeneratingAi ? <RefreshCw size={18} className="animate-spin" /> : <><Sparkles size={18}/> Gerar Texto</>}
                </button>
                <button 
                  onClick={() => setShowAiModal(false)} 
                  className="w-full py-3 text-slate-400 font-bold text-xs hover:bg-slate-50 rounded-xl transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }


  // Main view - list of requests
  return (
    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar animate-in fade-in pb-32">
      {/* Alert Banner */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-[32px] p-6 mb-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/20 rounded-2xl">
              <Zap size={28} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Modo Executor Emergencial</h2>
              <p className="text-amber-100 text-sm">
                Solicitações criadas aqui possuem <strong>Auto-Atesto</strong> e vão direto para a SOSFU.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-xl">
            <CheckCircle2 size={18} className="text-white" />
            <span className="text-sm font-bold text-white">Auto-Atesto Ativo</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Minhas Solicitações Emergenciais</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Fundos exclusivos para despesas urgentes da unidade
          </p>
        </div>
        <button 
          onClick={() => setShowNewRequestForm(true)}
          className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-xl text-sm font-black hover:bg-amber-600 shadow-lg shadow-amber-200 transition-all"
        >
          <Plus size={18} />
          Novo Pedido Emergencial
        </button>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
            Minhas Solicitações
          </h3>
          <span className="text-xs font-bold text-slate-400">
            {filteredRequests.length} registro(s)
          </span>
        </div>

        {isLoading ? (
          <div className="p-20 text-center">
            <RefreshCw size={32} className="mx-auto text-amber-500 animate-spin mb-4" />
            <p className="text-sm text-slate-500">Carregando...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-20 text-center">
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap size={40} className="text-amber-400" />
            </div>
            <p className="text-xl font-black text-slate-900">Nenhuma Solicitação</p>
            <p className="text-sm text-slate-500 mt-2">
              Clique em "Novo Pedido Emergencial" para começar.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredRequests.map(r => (
              <div key={r.id} className="p-6 hover:bg-slate-50 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                      <Zap size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase">
                          {r.nup}
                        </span>
                        {r.auto_atesto && (
                          <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded flex items-center gap-1">
                            <CheckCircle2 size={10} /> Auto-Atesto
                          </span>
                        )}
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                          r.status === 'AGUARDANDO SOSFU' ? 'bg-blue-100 text-blue-700' :
                          r.status === 'APROVADO' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {r.status}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-800 line-clamp-1">{r.descricao}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        <Calendar size={12} className="inline mr-1" />
                        {new Date(r.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-slate-800">
                      {formatCurrency(r.valor_solicitado)}
                    </p>
                    <button 
                      onClick={() => setSelectedRequest(r)}
                      className="flex items-center gap-1 text-xs font-bold text-amber-600 hover:underline mt-2"
                    >
                      <Eye size={14} /> Ver Detalhes
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowAiModal(false)}></div>
          <div className="relative bg-white w-full max-w-xl rounded-[32px] p-8 shadow-2xl space-y-6 text-center animate-in zoom-in-95">
            <button 
              onClick={() => setShowAiModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X size={20} />
            </button>
            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl w-fit mx-auto shadow-inner">
              <Sparkles size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Gerador de Justificativa</h3>
              <p className="text-slate-500 text-sm font-medium">
                A IA irá gerar um texto profissional baseado nos elementos de despesa selecionados.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleAiJustification} 
                disabled={isGeneratingAi}
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold uppercase text-xs tracking-wider hover:bg-indigo-700 flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 transition-all disabled:opacity-50"
              >
                {isGeneratingAi ? <RefreshCw size={18} className="animate-spin" /> : <><Sparkles size={18}/> Gerar Texto</>}
              </button>
              <button 
                onClick={() => setShowAiModal(false)} 
                className="w-full py-3 text-slate-400 font-bold text-xs hover:bg-slate-50 rounded-xl transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
