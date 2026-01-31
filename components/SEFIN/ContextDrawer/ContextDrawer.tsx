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
  Loader2,
  Maximize2,
  Minimize2
} from 'lucide-react'
import { SefinTask } from '../../../hooks/useSefinCockpit'
import { supabase } from '../../../lib/supabaseClient'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

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
  const documentContentRef = useRef<HTMLDivElement>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [realDocumentData, setRealDocumentData] = useState<any>(null)
  const [isDownloading, setIsDownloading] = useState(false)
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
        // Fetch document data - try documento_id first, then fallback to solicitacao_id + tipo
        let documento = null;
        
        if (task?.documento_id) {
          const { data, error } = await supabase
            .from('documentos')
            .select('*')
            .eq('id', task.documento_id)
            .single()
          
          if (!error && data) {
            documento = data;
          }
        }
        
        // Fallback: buscar por solicitacao_id + tipo (para tasks SEFIN que podem não ter documento_id)
        if (!documento && task?.solicitacao_id && task?.tipo) {
          console.log('🔍 Fallback: buscando documento por solicitacao_id + tipo:', task.solicitacao_id, task.tipo);
          const { data, error } = await supabase
            .from('documentos')
            .select('*')
            .eq('solicitacao_id', task.solicitacao_id)
            .eq('tipo', task.tipo)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
          
          if (!error && data) {
            documento = data;
            console.log('✅ Documento encontrado via fallback:', data.tipo, data.source_type, data.file_url);
          }
        }

        if (documento) {
          if (typeof documento.metadata === 'string') {
            try {
              documento.metadata = JSON.parse(documento.metadata)
            } catch {
              documento.metadata = {}
            }
          }
          console.log('✅ Document data loaded for preview:', documento.tipo, 'source_type:', documento.source_type, 'file_url:', documento.file_url ? 'YES' : 'NO')
          setRealDocumentData(documento)
        } else {
          console.log('⚠️ Nenhum documento encontrado')
          setRealDocumentData(null)
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
      'ORDEM_BANCARIA': 'Ordem Bancária',
      'DECISAO': 'Decisão AJSEFIN',
      'PARECER': 'Parecer Jurídico',
      'AUTORIZACAO_ORDENADOR': 'Autorização do Ordenador'
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
    }
  ]

  // Handle Print - Improved Margins
  const handlePrint = () => {
    if (!documentContentRef.current) return

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Imprimir Documento - SISUP</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @page { size: A4; margin: 10mm; } /* Standard margin for printing */
              body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; }
              /* Ensure formatting is preserved */
              .print-content { transform: none !important; margin: 0 auto !important; box-shadow: none !important; }
              /* Hide scrollbars in print */
              ::-webkit-scrollbar { display: none; }
            </style>
          </head>
          <body>
            <div class="print-content" style="width: 100%; max-width: 210mm; padding: 10mm;">
              ${documentContentRef.current.innerHTML}
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.focus()
      // Wait for images/styles to load
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 500)
    }
  }

  // Handle Download PDF - Fix for distorted text (clone strategy)
  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleDownload = async () => {
    if (!documentContentRef.current) return;
    
    setIsDownloading(true);
    
    try {
      // 1. Clone the content to a "clean" container (no transforms, full width)
      const original = documentContentRef.current;
      const clone = original.cloneNode(true) as HTMLElement;
      
      // 2. Setup container - invisible but rendered
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.top = '-9999px';
      container.style.left = '0';
      container.style.width = '210mm'; // A4 width
      container.style.minHeight = '297mm'; // A4 height
      container.style.backgroundColor = 'white';
      container.style.zIndex = '-1';
      container.appendChild(clone);
      document.body.appendChild(container);

      // 3. Wait for images in clone to load (if any)
      const images = Array.from(clone.querySelectorAll('img'));
      await Promise.all(images.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }));

      // 4. Update Header in Clone (Specific for Portaria)
      // We want the PDF to be crisp, so we might force some styles or rely on the clone
      // The clone inherits classes, so Tailwind works if styles are loaded.

      // 5. Generate Canvas from Clone
      const canvas = await html2canvas(clone, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794 // A4 width in px at 96 DPI
      });

      // 6. Generate PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${task.processo?.nup || 'documento'}_${task.tipo}.pdf`);

      // 7. Cleanup
      document.body.removeChild(container);

    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      showToast({
        title: 'Erro no Download',
        message: 'Não foi possível gerar o PDF. Tente novamente.',
        type: 'error'
      });
    } finally {
      setIsDownloading(false);
    }
  };



  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40 transition-opacity duration-300" />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`
          fixed right-0 top-0 h-full w-full bg-white shadow-2xl z-50
          transform transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          ${isExpanded ? 'max-w-5xl' : 'max-w-lg'}
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-500 hover:text-blue-600"
              title={isExpanded ? 'Restaurar Tamanho' : 'Expandir Visualização'}
            >
              {isExpanded ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <X size={20} className="text-slate-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(100%-140px)] p-5">
          {/* Status Badge */}
          <div className="flex items-center justify-between mb-4">
            {getStatusBadge(task.status)}
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="p-1.5 hover:bg-slate-100 rounded text-slate-500 disabled:opacity-50"
                title="Baixar PDF"
              >
                {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              </button>
              <button
                onClick={handlePrint}
                className="p-1.5 hover:bg-slate-100 rounded text-slate-500"
                title="Imprimir"
              >
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
                  <div ref={documentContentRef} className="w-[820px] bg-white p-12 min-h-[500px] text-[#000] font-sans">
                    {/* Unified Header with Brasão - like Dossiê Digital */}
                    <div className="flex flex-col items-center justify-center mb-8 space-y-2">
                      <img src={BRASAO_TJPA_URL} alt="Brasão" className="w-16 opacity-90" />
                      <div className="text-center">
                        <h1 className="text-lg font-bold text-slate-900 tracking-wider">TRIBUNAL DE JUSTIÇA DO ESTADO DO PARÁ</h1>
                        <h2 className="text-sm text-slate-600 font-medium">Secretaria de Planejamento, Coordenação e Finanças</h2>
                      </div>
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
                      /* Check if it's an external document (PDF from SIAFE) */
                      realDocumentData?.file_url && realDocumentData?.source_type === 'EXTERNAL_ERP' ? (
                        <div className="flex-1 flex flex-col items-center justify-start">
                          <div className="text-center mb-6">
                            <h2 className="text-xl font-black uppercase tracking-widest">
                              NOTA DE EMPENHO
                            </h2>
                            <p className="text-xs text-slate-500 mt-2 flex items-center justify-center gap-2">
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-bold">
                                PDF Externo (SIAFE)
                              </span>
                            </p>
                          </div>
                          <iframe
                            src={realDocumentData.file_url}
                            className="w-full flex-1 min-h-[700px] border border-slate-200 rounded-lg"
                            title="Nota de Empenho - SIAFE"
                          />
                        </div>
                      ) : (
                        /* Fallback to internal template */
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
                      )
                    ) : (
                      /* Render REAL document content from database when available */
                      <div className="py-8">
                        {/* Document Header - Use real titulo if available */}
                        <h2 className="text-xl font-bold uppercase tracking-widest text-center mb-8">
                          {realDocumentData?.titulo || getTypeLabel(task.tipo)}
                        </h2>
                        
                        {/* Document Body - Use real conteudo if available */}
                        {realDocumentData?.conteudo ? (
                          <div className="text-sm leading-relaxed whitespace-pre-wrap text-justify">
                            {realDocumentData.conteudo}
                          </div>
                        ) : (task.tipo === 'DECISAO' || task.tipo === 'PARECER' || task.tipo === 'AUTORIZACAO_ORDENADOR') ? (
                          <div className="text-sm leading-relaxed space-y-4 text-justify">
                            <p className="font-medium">
                              <strong>Processo nº:</strong> {task.processo?.nup || 'N/A'}
                            </p>
                            <p>
                              <strong>Interessado:</strong> {task.processo?.suprido_nome || 'N/A'}
                            </p>
                            <p>
                              <strong>Lotação:</strong> {task.processo?.lotacao_nome || 'N/A'}
                            </p>
                            <p>
                              <strong>Valor:</strong> {formatCurrency(task.processo?.valor_total || 0)}
                            </p>
                            
                            <div className="border-t border-slate-300 pt-4 mt-6">
                              <p className="font-medium uppercase text-center mb-4">
                                {task.tipo === 'DECISAO' ? 'DECISÃO' : task.tipo === 'PARECER' ? 'PARECER JURÍDICO' : 'AUTORIZAÇÃO'}
                              </p>
                              <p className="text-xs text-slate-600 mt-4">
                                {task.tipo === 'DECISAO' 
                                  ? 'A Assessoria Jurídica da SEFIN, após análise do processo acima identificado, DECIDE pela autorização do pagamento, nos termos da legislação vigente.'
                                  : task.tipo === 'PARECER'
                                  ? 'A Assessoria Jurídica da SEFIN, após análise do processo acima identificado, OPINA pelo deferimento do pedido, nos termos da legislação vigente.'
                                  : 'O Ordenador de Despesas, após análise do processo acima identificado, AUTORIZA a realização da despesa nos termos da legislação vigente.'
                                }
                              </p>
                            </div>
                            
                            <div className="text-right text-xs text-slate-500 mt-8">
                              Belém-PA, {formatDate(task.created_at)}
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-600 text-center">
                            Processo: {task.processo?.nup || 'N/A'}<br/>
                            Suprido: {task.processo?.suprido_nome || 'N/A'}<br/>
                            Valor: {formatCurrency(task.processo?.valor_total || 0)}
                          </p>
                        )}
                        
                        {/* Document Footer from metadata if available */}
                        {realDocumentData?.metadata?.footer && (
                          <div className="mt-8 pt-4 border-t border-slate-200 text-center">
                            <p className="text-xs text-slate-500 mb-4">
                              {realDocumentData.metadata.footer.location}, {realDocumentData.metadata.footer.date}
                            </p>
                            <p className="font-bold text-sm text-slate-800">
                              {realDocumentData.metadata.footer.signerName}
                            </p>
                            <p className="text-xs text-slate-600">
                              {realDocumentData.metadata.footer.signerRole}
                            </p>
                          </div>
                        )}
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
