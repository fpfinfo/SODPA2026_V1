import React, { useState, useEffect } from 'react'
import { 
  X, 
  BadgeCheck, 
  ArrowRight, 
  FileText, 
  BookOpen,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Lock,
  Loader2
} from 'lucide-react'
import { StaticCover } from '../ProcessDetails/StaticDocuments/StaticCover'
import { StaticRequest } from '../ProcessDetails/StaticDocuments/StaticRequest'
import { useToast } from '../ui/ToastProvider'

interface DocumentSigningModalProps {
  isOpen: boolean
  processData: any
  profileData: any
  onComplete: () => void
  onCancel: () => void
  isSubmitting?: boolean
}

const BRASAO_TJPA_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/217479058_brasao-tjpa.png'

export const DocumentSigningModal: React.FC<DocumentSigningModalProps> = ({
  isOpen,
  processData,
  profileData,
  onComplete,
  onCancel,
  isSubmitting = false
}) => {
  const { showToast } = useToast()
  const [currentStep, setCurrentStep] = useState<'CAPA' | 'REQUERIMENTO'>('CAPA')
  const [isCasSigned, setIsCapaSigned] = useState(false)
  const [isRequerimentoSigned, setIsRequerimentoSigned] = useState(false)
  
  // PIN Verification State
  const [signingTarget, setSigningTarget] = useState<'CAPA' | 'REQUERIMENTO' | null>(null)
  const [pinInput, setPinInput] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)

  // Reset states when modal opens to ensure fresh signing flow
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('CAPA')
      setIsCapaSigned(false)
      setIsRequerimentoSigned(false)
      setSigningTarget(null)
      setPinInput('')
    }
  }, [isOpen])

  if (!isOpen) return null

  // Initiate signing process
  const handleStartSign = (target: 'CAPA' | 'REQUERIMENTO') => {
    if (!profileData?.signature_pin) {
      showToast({
        type: 'error',
        title: 'Assinatura Indisponível',
        message: 'Você precisa configurar seu PIN de Assinatura no perfil antes de assinar documentos.'
      })
      return
    }
    setSigningTarget(target)
    setPinInput('')
  }

  const handleConfirmSign = () => {
    if (!pinInput || pinInput.length < 4) return

    setIsVerifying(true)
    
    // Simulate API delay for UX
    setTimeout(() => {
      if (pinInput === profileData.signature_pin) {
        // Success
        if (signingTarget === 'CAPA') {
            setIsCapaSigned(true)
            showToast({ type: 'success', title: 'Sucesso', message: 'Capa assinada com sucesso!' })
            // Auto-advance
            setTimeout(() => {
                setCurrentStep('REQUERIMENTO')
                setSigningTarget(null) 
                setPinInput('') 
            }, 500)
        } else {
            setIsRequerimentoSigned(true)
            showToast({ type: 'success', title: 'Sucesso', message: 'Requerimento assinado com sucesso!' })
            setSigningTarget(null)
            setPinInput('')
        }
      } else {
        showToast({ type: 'error', title: 'PIN Incorreto', message: 'PIN de assinatura inválido.' })
      }
      setIsVerifying(false)
    }, 600)
  }

  const canSubmit = isCasSigned && isRequerimentoSigned

  // Prepare process data for static components
  const formattedProcessData = {
    nup: processData.nup || `TJPA-SOL-${new Date().getFullYear()}-XXXX`,
    tipo: processData.type || processData.tipo || 'Extra-Emergencial',
    type: processData.type || processData.tipo || 'Extra-Emergencial',
    valor_total: processData.totalValue || processData.valor_total || 0,
    valor_solicitado: processData.totalValue || processData.valor_solicitado || 0,
    suprido_nome: profileData?.nome || 'Servidor',
    interested: profileData?.nome || 'Servidor',
    lotacao: profileData?.lotacao || processData.unit || 'Unidade Judiciária',
    unidade: profileData?.lotacao || processData.unit || 'Unidade Judiciária',
    descricao: processData.desc || processData.descricao || '',
    data_inicio: processData.startDate,
    data_fim: processData.endDate,
    created_at: new Date().toISOString(),
    itens_despesa: processData.items || processData.juriProjectionItems?.map((item: any) => ({
      element: item.id,
      desc: item.name,
      qty: item.quantity,
      val: item.total
    })) || []
  }

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
              <BookOpen size={28} />
            </div>
            <div>
              <h3 className="text-xl font-black">Visualização e Assinatura</h3>
              <p className="text-blue-100 text-sm font-medium">
                Revise e assine os documentos antes de enviar
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Progress Tabs */}
        <div className="bg-slate-50 border-b border-slate-200 px-8 py-4">
          <div className="flex items-center gap-4">
            {/* Step 1: Capa */}
            <button
              onClick={() => setCurrentStep('CAPA')}
              className={`flex items-center gap-3 px-6 py-3 rounded-xl transition-all ${
                currentStep === 'CAPA' 
                  ? 'bg-white shadow-md border border-slate-200' 
                  : 'hover:bg-white/50'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black ${
                isCasSigned 
                  ? 'bg-emerald-100 text-emerald-600' 
                  : currentStep === 'CAPA' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-200 text-slate-500'
              }`}>
                {isCasSigned ? <CheckCircle2 size={18} /> : '1'}
              </div>
              <div className="text-left">
                <p className={`text-sm font-bold ${currentStep === 'CAPA' ? 'text-slate-900' : 'text-slate-600'}`}>
                  Capa do Processo
                </p>
                <p className="text-xs text-slate-500">
                  {isCasSigned ? 'Assinado ✓' : 'Pendente'}
                </p>
              </div>
            </button>

            <ArrowRight size={20} className="text-slate-300" />

            {/* Step 2: Requerimento */}
            <button
              onClick={() => isCasSigned && setCurrentStep('REQUERIMENTO')}
              disabled={!isCasSigned}
              className={`flex items-center gap-3 px-6 py-3 rounded-xl transition-all ${
                currentStep === 'REQUERIMENTO' 
                  ? 'bg-white shadow-md border border-slate-200' 
                  : isCasSigned 
                    ? 'hover:bg-white/50' 
                    : 'opacity-50 cursor-not-allowed'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black ${
                isRequerimentoSigned 
                  ? 'bg-emerald-100 text-emerald-600' 
                  : currentStep === 'REQUERIMENTO' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-200 text-slate-500'
              }`}>
                {isRequerimentoSigned ? <CheckCircle2 size={18} /> : '2'}
              </div>
              <div className="text-left">
                <p className={`text-sm font-bold ${currentStep === 'REQUERIMENTO' ? 'text-slate-900' : 'text-slate-600'}`}>
                  Requerimento Inicial
                </p>
                <p className="text-xs text-slate-500">
                  {isRequerimentoSigned ? 'Assinado ✓' : 'Pendente'}
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Document Preview */}
        <div className="flex-1 overflow-y-auto bg-[#525659] p-8">
          <div 
            className="bg-white shadow-2xl mx-auto p-16 min-h-[900px] border-t-8 border-slate-900"
            style={{ width: '820px' }}
          >
            {/* Document Header */}
            {currentStep !== 'CAPA' && (
              <div className="flex flex-col items-center justify-center mb-12 space-y-4">
                <img src={BRASAO_TJPA_URL} alt="Brasão" className="w-20 opacity-90" />
                <h1 className="text-lg font-bold text-slate-900 uppercase tracking-widest text-center">
                  TRIBUNAL DE JUSTIÇA DO ESTADO DO PARÁ
                </h1>
              </div>
            )}

            {/* Content based on step */}
            {currentStep === 'CAPA' ? (
              <StaticCover processData={formattedProcessData} isSigned={isCasSigned} />
            ) : (
              <StaticRequest processData={formattedProcessData} isSigned={isRequerimentoSigned} />
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-200 bg-white px-8 py-5 flex items-center justify-between">
          <p className="text-xs text-slate-500 flex items-center gap-2">
            <AlertCircle size={14} className="text-amber-500" />
            {currentStep === 'CAPA' 
              ? 'Revise a Capa do Processo e clique em Assinar'
              : 'Revise o Requerimento Inicial e clique em Assinar'}
          </p>
          
          <div className="flex gap-3">
            <button 
              onClick={onCancel}
              className="px-6 py-3 bg-slate-100 font-bold text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>

            {/* If verifying PIN, show input instead of buttons */}
            {signingTarget ? (
                <div className="flex items-center gap-2 animate-in slide-in-from-right">
                    <div className="relative">
                        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="password"
                            autoFocus
                            placeholder="PIN de Assinatura"
                            value={pinInput}
                            onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            onKeyDown={(e) => e.key === 'Enter' && handleConfirmSign()}
                            className="pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <button
                        onClick={handleConfirmSign}
                        disabled={isVerifying || pinInput.length < 4}
                        className="px-6 py-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {isVerifying ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                        Confirmar
                    </button>
                    <button
                        onClick={() => { setSigningTarget(null); setPinInput(''); }}
                        className="p-3 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200"
                    >
                        <X size={18} />
                    </button>
                </div>
            ) : (
                <>
                    {/* Sign Button - based on current step */}
                    {currentStep === 'CAPA' && !isCasSigned && (
                    <button 
                        onClick={() => handleStartSign('CAPA')}
                        className="px-8 py-3 bg-blue-600 font-black text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all transform active:scale-95 flex items-center gap-2"
                    >
                        <BadgeCheck size={18} />
                        Assinar Capa
                    </button>
                    )}

                    {currentStep === 'REQUERIMENTO' && !isRequerimentoSigned && (
                    <button 
                        onClick={() => handleStartSign('REQUERIMENTO')}
                        className="px-8 py-3 bg-blue-600 font-black text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all transform active:scale-95 flex items-center gap-2"
                    >
                        <BadgeCheck size={18} />
                        Assinar Requerimento
                    </button>
                    )}

                    {/* Submit Button - only when both are signed */}
                    {canSubmit && (
                    <button 
                        onClick={onComplete}
                        disabled={isSubmitting}
                        className="px-8 py-3 bg-emerald-600 font-black text-white rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all transform active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                        <>
                            <RefreshCw size={18} className="animate-spin" />
                            Enviando...
                        </>
                        ) : (
                        <>
                            <ArrowRight size={18} />
                            Enviar para Atesto
                        </>
                        )}
                    </button>
                    )}
                </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
