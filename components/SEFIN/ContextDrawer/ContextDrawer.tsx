'use client'

import React, { useEffect, useRef, useState } from 'react'
import { 
  X, 
  FileText, 
  Calendar,
  User,
  Building2,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Download,
  Printer,
  Edit3,
  Send,
  RotateCcw,
  KeyRound,
  Search,
  Loader2
} from 'lucide-react'
import { SefinTask } from '../../../hooks/useSefinCockpit'
import { supabase } from '../../../lib/supabaseClient'

// Import Static Document Components for unified rendering
import { StaticPortaria } from '../../ProcessDetails/StaticDocuments/StaticPortaria'
import { StaticCertidao } from '../../ProcessDetails/StaticDocuments/StaticCertidao'
import { StaticNE } from '../../ProcessDetails/StaticDocuments/StaticNE'

const BRASAO_TJPA_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/217479058_brasao-tjpa.png';

export type SimilarSearchType = 'comarca' | 'suprido'

interface ContextDrawerProps {
  task: SefinTask | null
  isOpen: boolean
  onClose: () => void
  onSign?: (taskId: string) => void
  onReturn?: (taskId: string, reason: string) => void
  onViewSimilar?: (searchType: SimilarSearchType, value: string) => void
}

// Timeline Event Component
interface TimelineEventProps {
  date: string
  time: string
  action: string
  actor?: string
  isFirst?: boolean
  isLast?: boolean
  status?: 'completed' | 'current' | 'pending'
}

function TimelineEvent({ date, time, action, actor, isFirst, isLast, status = 'completed' }: TimelineEventProps) {
  const statusColors = {
    completed: 'bg-emerald-500',
    current: 'bg-amber-500 animate-pulse',
    pending: 'bg-slate-300'
  }

  return (
    <div className="flex gap-3">
      {/* Timeline Line */}
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full ${statusColors[status]} flex-shrink-0`} />
        {!isLast && <div className="w-0.5 h-12 bg-slate-200 -mt-0.5" />}
      </div>

      {/* Content */}
      <div className="pb-4 -mt-1">
        <div className="text-xs text-slate-400">{date} às {time}</div>
        <div className="text-sm font-medium text-slate-800">{action}</div>
        {actor && <div className="text-xs text-slate-500">Por: {actor}</div>}
      </div>
    </div>
  )
}

// Document Info Row
function InfoRow({ icon: Icon, label, value }: { 
  icon: React.ElementType
  label: string
  value: string | number 
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <Icon size={16} className="text-slate-400 flex-shrink-0" />
      <span className="text-sm text-slate-500 w-24">{label}</span>
      <span className="text-sm font-medium text-slate-800">{value}</span>
    </div>
  )
}

export function ContextDrawer({ task, isOpen, onClose, onSign, onReturn, onViewSimilar }: ContextDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null)
  const [realDocumentData, setRealDocumentData] = useState<any>(null)
  const [enrichedProcessData, setEnrichedProcessData] = useState<any>(null)
  const [isLoadingDocument, setIsLoadingDocument] = useState(false)

  // Fetch real document data AND enriched process data from database
  useEffect(() => {
    const fetchData = async () => {
      if (!task?.documento_id && !task?.solicitacao_id) {
        setRealDocumentData(null)
        setEnrichedProcessData(null)
        return
      }

      setIsLoadingDocument(true)
      try {
        // Fetch document data
        if (task?.documento_id) {
          const { data: documento, error } = await supabase
            .from('documentos')
            .select('*')
            .eq('id', task.documento_id)
            .single()

          if (!error && documento) {
            if (typeof documento.metadata === 'string') {
              try {
                documento.metadata = JSON.parse(documento.metadata)
              } catch {
                documento.metadata = {}
              }
            }
            console.log('✅ Document data loaded for preview:', documento.tipo)
            setRealDocumentData(documento)
          } else {
            setRealDocumentData(null)
          }
        }

        // Fetch enriched process data from solicitacoes + servidores_tj
        if (task?.solicitacao_id) {
          const { data: sol } = await supabase
            .from('solicitacoes')
            .select(`
              *,
              profiles:user_id (nome, cargo, email, cpf, banco, agencia, conta_corrente)
            `)
            .eq('id', task.solicitacao_id)
            .single()

          if (sol) {
            const profile = sol.profiles as any
            let lotacao = null
            let servidor_cpf = null
            let servidor_cargo = null
            let servidor_banco = null
            let servidor_agencia = null
            let servidor_conta = null

            // Get enriched data from servidores_tj
            if (profile?.email) {
              const { data: servidor } = await supabase
                .from('servidores_tj')
                .select('lotacao, cargo, banco, agencia, conta_corrente, cpf')
                .eq('email', profile.email)
                .maybeSingle()

              if (servidor) {
                lotacao = servidor.lotacao
                servidor_cpf = servidor.cpf
                servidor_cargo = servidor.cargo
                servidor_banco = servidor.banco
                servidor_agencia = servidor.agencia
                servidor_conta = servidor.conta_corrente
              }
            }

            setEnrichedProcessData({
              nup: sol.nup,
              valor_total: sol.valor_solicitado || sol.valor_total,
              suprido_nome: profile?.nome,
              suprido_cpf: profile?.cpf || servidor_cpf,
              suprido_cargo: profile?.cargo || servidor_cargo,
              lotacao: lotacao,
              banco: profile?.banco || servidor_banco,
              agencia: profile?.agencia || servidor_agencia,
              conta_corrente: profile?.conta_corrente || servidor_conta,
              itens_despesa: sol.itens_despesa,
              created_at: sol.created_at,
            })
            console.log('✅ Enriched process data loaded')
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err)
        setRealDocumentData(null)
        setEnrichedProcessData(null)
      } finally {
        setIsLoadingDocument(false)
      }
    }

    if (isOpen && task) {
      fetchData()
    }
  }, [task?.documento_id, task?.solicitacao_id, isOpen])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  if (!isOpen || !task) return null

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('pt-BR')
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  const getTypeLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      'PORTARIA': 'Portaria de Concessão',
      'CERTIDAO_REGULARIDADE': 'Certidão de Regularidade',
      'NOTA_EMPENHO': 'Nota de Empenho',
      'NOTA_LIQUIDACAO': 'Nota de Liquidação',
      'ORDEM_BANCARIA': 'Ordem Bancária'
    }
    return labels[tipo] || tipo
  }

  // Generate document preview based on type and data
  const generateDocumentPreview = () => {
    const suprido = task.processo?.suprido_nome || 'N/A'
    const nup = task.processo?.nup || 'N/A'
    const valor = formatCurrency(task.processo?.valor_total || 0)
    const lotacao = task.processo?.lotacao_nome || 'N/A'
    const data = formatDate(task.created_at)

    switch (task.tipo) {
      case 'PORTARIA':
        return `
          <div style="text-align: center; margin-bottom: 16px;">
            <strong style="font-size: 11px;">TRIBUNAL DE JUSTIÇA DO ESTADO DO PARÁ</strong><br/>
            <span style="font-size: 10px;">Secretaria de Finanças - SEFIN</span>
          </div>
          <h2 style="text-align: center; font-size: 12px; font-weight: bold; margin: 12px 0;">
            PORTARIA DE CONCESSÃO DE SUPRIMENTO DE FUNDOS
          </h2>
          <p style="font-size: 10px; text-align: justify; margin: 8px 0;">
            <strong>Processo:</strong> ${nup}<br/>
            <strong>Suprido:</strong> ${suprido}<br/>
            <strong>Lotação:</strong> ${lotacao}<br/>
            <strong>Valor Concedido:</strong> ${valor}
          </p>
          <p style="font-size: 10px; text-align: justify; margin: 8px 0;">
            O Ordenador de Despesas do Tribunal de Justiça do Estado do Pará, no uso de suas atribuições legais, 
            <strong>RESOLVE</strong> conceder suprimento de fundos ao servidor acima identificado, conforme 
            Resolução CNJ nº 169/2013.
          </p>
          <p style="font-size: 9px; text-align: right; margin-top: 20px;">
            Belém-PA, ${data}
          </p>
        `
      
      case 'CERTIDAO_REGULARIDADE':
        return `
          <div style="text-align: center; margin-bottom: 16px;">
            <strong style="font-size: 11px;">TRIBUNAL DE JUSTIÇA DO ESTADO DO PARÁ</strong><br/>
            <span style="font-size: 10px;">Seção de Suprimento de Fundos - SOSFU</span>
          </div>
          <h2 style="text-align: center; font-size: 12px; font-weight: bold; margin: 12px 0;">
            CERTIDÃO DE REGULARIDADE
          </h2>
          <p style="font-size: 10px; text-align: justify; margin: 8px 0;">
            <strong>CERTIFICO</strong>, para os devidos fins, que o(a) servidor(a) 
            <strong>${suprido}</strong>, lotado(a) em <strong>${lotacao}</strong>, 
            encontra-se <strong>REGULAR</strong> perante esta Seção de Suprimento de Fundos, 
            não possuindo pendências de prestação de contas anteriores.
          </p>
          <p style="font-size: 10px; margin: 8px 0;">
            <strong>Processo:</strong> ${nup}<br/>
            <strong>Valor da Solicitação:</strong> ${valor}
          </p>
          <p style="font-size: 9px; text-align: right; margin-top: 20px;">
            Belém-PA, ${data}
          </p>
        `
      
      case 'NOTA_EMPENHO':
        return `
          <div style="text-align: center; margin-bottom: 12px;">
            <strong style="font-size: 11px;">NOTA DE EMPENHO</strong>
          </div>
          <table style="width: 100%; font-size: 9px; border-collapse: collapse;">
            <tr>
              <td style="border: 1px solid #ccc; padding: 4px;"><strong>NUP:</strong></td>
              <td style="border: 1px solid #ccc; padding: 4px;">${nup}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ccc; padding: 4px;"><strong>Credor:</strong></td>
              <td style="border: 1px solid #ccc; padding: 4px;">${suprido}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ccc; padding: 4px;"><strong>Unidade:</strong></td>
              <td style="border: 1px solid #ccc; padding: 4px;">${lotacao}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ccc; padding: 4px;"><strong>Valor:</strong></td>
              <td style="border: 1px solid #ccc; padding: 4px; font-weight: bold;">${valor}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ccc; padding: 4px;"><strong>Elemento:</strong></td>
              <td style="border: 1px solid #ccc; padding: 4px;">3.3.90.39 - Outros Serv. Terceiros PJ</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ccc; padding: 4px;"><strong>Data:</strong></td>
              <td style="border: 1px solid #ccc; padding: 4px;">${data}</td>
            </tr>
          </table>
        `
      
      case 'NOTA_LIQUIDACAO':
        return `
          <div style="text-align: center; margin-bottom: 12px;">
            <strong style="font-size: 11px;">DOCUMENTO DE LIQUIDAÇÃO</strong>
          </div>
          <table style="width: 100%; font-size: 9px; border-collapse: collapse;">
            <tr>
              <td style="border: 1px solid #ccc; padding: 4px;"><strong>Processo:</strong></td>
              <td style="border: 1px solid #ccc; padding: 4px;">${nup}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ccc; padding: 4px;"><strong>Favorecido:</strong></td>
              <td style="border: 1px solid #ccc; padding: 4px;">${suprido}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ccc; padding: 4px;"><strong>Valor Liquidado:</strong></td>
              <td style="border: 1px solid #ccc; padding: 4px; font-weight: bold;">${valor}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ccc; padding: 4px;"><strong>Data:</strong></td>
              <td style="border: 1px solid #ccc; padding: 4px;">${data}</td>
            </tr>
          </table>
          <p style="font-size: 9px; margin-top: 8px;">
            Atesto que os serviços/materiais foram prestados/entregues conforme documentação anexa.
          </p>
        `
      
      case 'ORDEM_BANCARIA':
        return `
          <div style="text-align: center; margin-bottom: 12px;">
            <strong style="font-size: 11px;">ORDEM BANCÁRIA</strong>
          </div>
          <table style="width: 100%; font-size: 9px; border-collapse: collapse;">
            <tr>
              <td style="border: 1px solid #ccc; padding: 4px;"><strong>NUP:</strong></td>
              <td style="border: 1px solid #ccc; padding: 4px;">${nup}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ccc; padding: 4px;"><strong>Beneficiário:</strong></td>
              <td style="border: 1px solid #ccc; padding: 4px;">${suprido}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ccc; padding: 4px;"><strong>Valor:</strong></td>
              <td style="border: 1px solid #ccc; padding: 4px; font-weight: bold; color: #059669;">${valor}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ccc; padding: 4px;"><strong>Data Emissão:</strong></td>
              <td style="border: 1px solid #ccc; padding: 4px;">${data}</td>
            </tr>
          </table>
          <p style="font-size: 9px; margin-top: 8px; text-align: center; font-weight: bold;">
            AUTORIZAÇÃO DE PAGAMENTO
          </p>
        `
      
      default:
        return `
          <div style="text-align: center; padding: 20px;">
            <p style="font-size: 10px; color: #666;">
              <strong>${getTypeLabel(task.tipo)}</strong><br/>
              Processo: ${nup}<br/>
              Suprido: ${suprido}<br/>
              Valor: ${valor}
            </p>
          </div>
        `
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string, text: string, label: string }> = {
      'PENDING': { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pendente' },
      'SIGNED': { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Assinado' },
      'REJECTED': { bg: 'bg-red-100', text: 'text-red-700', label: 'Devolvido' },
      'SENT': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Enviado' }
    }
    const config = statusConfig[status] || statusConfig['PENDING']
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  // Mock timeline events (in production, fetch from historico_tramitacao)
  const timelineEvents = [
    { 
      date: formatDate(task.created_at), 
      time: formatTime(task.created_at), 
      action: 'Enviado para SEFIN', 
      actor: 'SOSFU',
      status: 'completed' as const
    },
    { 
      date: formatDate(task.created_at), 
      time: formatTime(new Date(new Date(task.created_at).getTime() - 3600000).toISOString()), 
      action: `${getTypeLabel(task.tipo)} gerada`, 
      actor: 'Sistema',
      status: 'completed' as const
    },
    { 
      date: formatDate(new Date(new Date(task.created_at).getTime() - 86400000).toISOString()), 
      time: '16:45', 
      action: 'Solicitação aprovada pelo Gestor', 
      actor: 'Gestor',
      status: 'completed' as const
    }
  ]

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40 transition-opacity duration-300" />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`
          fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <FileText size={20} className="text-amber-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800">{getTypeLabel(task.tipo)}</h2>
              <p className="text-xs text-slate-500">{task.processo?.nup || 'N/A'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(100%-140px)] p-5">
          {/* Status Badge */}
          <div className="flex items-center justify-between mb-4">
            {getStatusBadge(task.status)}
            <div className="flex items-center gap-2">
              <button className="p-1.5 hover:bg-slate-100 rounded text-slate-500">
                <Download size={16} />
              </button>
              <button className="p-1.5 hover:bg-slate-100 rounded text-slate-500">
                <Printer size={16} />
              </button>
            </div>
          </div>

          {/* Document Preview - Using Static Components for visual parity with Dossiê Digital */}
          <div className="bg-slate-100 rounded-xl p-2 mb-6 border border-slate-200 overflow-hidden">
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-y-auto max-h-[500px]" style={{ minHeight: '400px' }}>
              {isLoadingDocument ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 py-20">
                  <Loader2 size={24} className="animate-spin mb-2" />
                  <span className="text-xs">Carregando documento...</span>
                </div>
              ) : (
                /* Render using SAME Static components as Dossiê Digital */
                <div 
                  className="origin-top-left"
                  style={{ transform: 'scale(0.5)', transformOrigin: 'top left', width: '200%' }}
                >
                  <div className="w-[820px] bg-white p-12 min-h-[500px] text-[#000] font-sans">
                    {/* Unified Header with Brasão - like Dossiê Digital */}
                    <div className="flex flex-col items-center justify-center mb-8 space-y-2">
                      <img src={BRASAO_TJPA_URL} alt="Brasão" className="w-16 opacity-90" />
                      <h1 className="text-sm font-bold text-slate-900 uppercase tracking-widest text-center">
                        TRIBUNAL DE JUSTIÇA DO ESTADO DO PARÁ
                      </h1>
                      <p className="text-xs text-slate-500">Secretaria de Finanças - SEFIN</p>
                    </div>

                    {/* Render Content Based on Document Type */}
                    {task.tipo === 'PORTARIA' ? (
                      <StaticPortaria 
                        processData={enrichedProcessData || {
                          nup: task.processo?.nup,
                          valor_total: task.processo?.valor_total,
                          suprido_nome: task.processo?.suprido_nome,
                          lotacao: task.processo?.lotacao_nome,
                          created_at: task.processo?.created_at
                        }} 
                        documentData={realDocumentData || {
                          tipo: 'PORTARIA',
                          created_at: task.created_at
                        }} 
                      />
                    ) : task.tipo === 'CERTIDAO_REGULARIDADE' ? (
                      <StaticCertidao 
                        processData={enrichedProcessData || {
                          nup: task.processo?.nup,
                          valor_total: task.processo?.valor_total,
                          suprido_nome: task.processo?.suprido_nome,
                          lotacao: task.processo?.lotacao_nome,
                          created_at: task.processo?.created_at
                        }} 
                        documentData={realDocumentData || {
                          tipo: 'CERTIDAO_REGULARIDADE',
                          created_at: task.created_at
                        }} 
                      />
                    ) : task.tipo === 'NOTA_EMPENHO' ? (
                      <StaticNE 
                        processData={enrichedProcessData || {
                          nup: task.processo?.nup,
                          valor_total: task.processo?.valor_total,
                          suprido_nome: task.processo?.suprido_nome,
                          lotacao: task.processo?.lotacao_nome,
                          created_at: task.processo?.created_at
                        }} 
                        documentData={realDocumentData || {
                          tipo: 'NOTA_EMPENHO',
                          created_at: task.created_at
                        }} 
                      />
                    ) : (
                      /* Fallback for other document types */
                      <div className="text-center py-8">
                        <h2 className="text-xl font-bold uppercase tracking-widest mb-4">
                          {getTypeLabel(task.tipo)}
                        </h2>
                        <p className="text-sm text-slate-600">
                          Processo: {task.processo?.nup || 'N/A'}<br/>
                          Suprido: {task.processo?.suprido_nome || 'N/A'}<br/>
                          Valor: {formatCurrency(task.processo?.valor_total || 0)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Document Info */}
          <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-200">
            <h3 className="font-semibold text-slate-800 text-sm mb-3">Informações</h3>
            <div className="divide-y divide-slate-200">
              <InfoRow icon={User} label="Suprido" value={enrichedProcessData?.suprido_nome || task.processo?.suprido_nome || 'N/A'} />
              <InfoRow icon={Building2} label="Lotação" value={enrichedProcessData?.lotacao || task.processo?.lotacao_nome || 'N/A'} />
              <InfoRow icon={DollarSign} label="Valor" value={formatCurrency(enrichedProcessData?.valor_total || task.processo?.valor_total || 0)} />
              <InfoRow icon={Calendar} label="Criado em" value={formatDate(task.created_at)} />
              <InfoRow icon={Clock} label="Horário" value={formatTime(task.created_at)} />
            </div>
          </div>

          {/* Timeline */}
          <div className="mb-6">
            <h3 className="font-semibold text-slate-800 text-sm mb-4 flex items-center gap-2">
              <Calendar size={16} className="text-blue-500" />
              Histórico do Processo
            </h3>
            <div className="pl-2">
              {timelineEvents.map((event, index) => (
                <TimelineEvent
                  key={index}
                  {...event}
                  isFirst={index === 0}
                  isLast={index === timelineEvents.length - 1}
                />
              ))}
            </div>
          </div>

          {/* View Similar Section */}
          {onViewSimilar && (
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <h3 className="font-semibold text-slate-800 text-sm mb-3 flex items-center gap-2">
                <Search size={16} className="text-blue-500" />
                Ver Similares
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                Buscar documentos relacionados para comparação
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => onViewSimilar('comarca', task.processo?.lotacao_nome || '')}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-blue-200 rounded-lg text-blue-700 text-sm font-medium hover:bg-blue-50 transition-colors"
                >
                  <Building2 size={14} />
                  Mesma Comarca
                </button>
                <button
                  onClick={() => onViewSimilar('suprido', task.processo?.suprido_nome || '')}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-blue-200 rounded-lg text-blue-700 text-sm font-medium hover:bg-blue-50 transition-colors"
                >
                  <User size={14} />
                  Mesmo Suprido
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {task.status === 'PENDING' && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200">
            <div className="flex gap-3">
              <button
                onClick={() => onReturn?.(task.id, 'Motivo da devolução')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
              >
                <RotateCcw size={18} />
                Devolver
              </button>
              <button
                onClick={() => onSign?.(task.id)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 rounded-lg text-white font-medium hover:bg-emerald-700 transition-colors"
              >
                <KeyRound size={18} />
                Assinar
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default ContextDrawer
