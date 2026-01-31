'use client'

import React, { useState, useEffect } from 'react'
import { 
  X, BadgeCheck, AlertCircle, RefreshCw, CheckCircle2, 
  FileText, TrendingUp, AlertTriangle, ShieldCheck, Wallet 
} from 'lucide-react'
import { StaticCertidaoAtesto } from '../ProcessDetails/StaticDocuments/StaticCertidaoAtesto'
import { SignatureModal } from '../ui/SignatureModal'
import { useToast } from '../ui/ToastProvider'

interface SolicitacaoAtestoModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (pin: string) => Promise<{ success: boolean; error?: string }>
  process: any
  isLoading: boolean
}

const PREVIEW_DOCUMENT_DATA = {
  status: 'MINUTA',
  metadata: {
    numero_certidao: 'PREVIEW'
  }
}

export function SolicitacaoAtestoModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  process, 
  isLoading 
}: SolicitacaoAtestoModalProps) {
  const [showSignature, setShowSignature] = useState(false)
  const [checklist, setChecklist] = useState({
    budget: false,
    interest: false,
    items: false,
    noBidding: false
  })
  
  const { showToast } = useToast()

  // Reset checklsit on open
  useEffect(() => {
    if (isOpen) {
      setChecklist({
        budget: false,
        interest: false,
        items: false,
        noBidding: false
      })
      setShowSignature(false)
    }
  }, [isOpen])

  if (!isOpen || !process) return null

  const isChecklistComplete = Object.values(checklist).every(Boolean)
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  
  // Rule Checks
  const LIMIT_VALUE = 4000 // Exemplo de limite
  const isHighValue = process.val > LIMIT_VALUE
  const isJuri = process.type === 'SESSÃO DE JÚRI'

  const handleSignClick = () => {
    if (!isChecklistComplete) {
      showToast({ 
        type: 'error', 
        title: 'Confirmação Necessária', 
        message: 'Por favor, confirme todos os itens do checklist de análise antes de prosseguir.' 
      })
      return
    }
    setShowSignature(true)
  }

  return (
    <>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 text-white flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <BadgeCheck size={28} />
              </div>
              <div>
                <h3 className="text-xl font-black">Análise da Solicitação & Atesto</h3>
                <p className="text-blue-100 text-sm font-medium">NUP: {process.nup}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
              <X size={24} />
            </button>
          </div>
          
          {/* Content Check + Preview */}
          <div className="flex-1 overflow-hidden flex flex-col lg:flex-row bg-slate-50">
            
            {/* Left: Analysis Panel */}
            <div className="flex-1 lg:max-w-md p-6 overflow-y-auto border-r border-slate-200 space-y-6">
              
              {/* Financial Check Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h4 className="text-sm font-black text-slate-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <Wallet size={16} className="text-emerald-500" />
                  Parâmetros Financeiros
                </h4>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-sm text-slate-500 font-medium">Valor Solicitado</span>
                    <span className="text-lg font-black text-slate-800">{formatCurrency(process.val || 0)}</span>
                  </div>

                  <div className={`p-3 rounded-xl border flex items-start gap-3 text-xs leading-relaxed
                    ${isHighValue ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}
                  `}>
                    {isHighValue ? <AlertTriangle size={16} className="shrink-0 mt-0.5" /> : <CheckCircle2 size={16} className="shrink-0 mt-0.5" />}
                    <div>
                      <p className="font-bold mb-1">{isHighValue ? 'Valor Elevado' : 'Dentro do Limite Usual'}</p>
                      <p>
                        {isHighValue 
                          ? `O valor excede a média de R$ ${formatCurrency(LIMIT_VALUE)}. Verifique a justificativa.` 
                          : 'Valor compatível com suprimentos de fundos rotineiros.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Checklist Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                 <h4 className="text-sm font-black text-slate-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-blue-500" />
                  Atesto de Regularidade
                </h4>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  Confirme os itens abaixo para habilitar a assinatura da certidão.
                </p>

                <div className="space-y-3">
                  <label className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 cursor-pointer transition-all">
                    <div className="relative flex items-center mt-0.5">
                      <input 
                        type="checkbox" 
                        checked={checklist.budget}
                        onChange={e => setChecklist(prev => ({ ...prev, budget: e.target.checked }))}
                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                      />
                    </div>
                    <span className="text-sm text-slate-700 font-medium">
                      Verifiquei e confirmo a <strong>disponibilidade orçamentária</strong> da unidade.
                    </span>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 cursor-pointer transition-all">
                    <div className="relative flex items-center mt-0.5">
                      <input 
                        type="checkbox" 
                        checked={checklist.items}
                        onChange={e => setChecklist(prev => ({ ...prev, items: e.target.checked }))}
                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                      />
                    </div>
                    <span className="text-sm text-slate-700 font-medium">
                      Os itens solicitados são <strong>adequados</strong> e compatíveis com a natureza da despesa.
                    </span>
                  </label>
                  
                  <label className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 cursor-pointer transition-all">
                    <div className="relative flex items-center mt-0.5">
                      <input 
                        type="checkbox" 
                        checked={checklist.interest}
                        onChange={e => setChecklist(prev => ({ ...prev, interest: e.target.checked }))}
                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                      />
                    </div>
                    <span className="text-sm text-slate-700 font-medium">
                       Atesto o <strong>interesse público</strong> e a oportunidade da despesa.
                    </span>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 cursor-pointer transition-all">
                    <div className="relative flex items-center mt-0.5">
                      <input 
                        type="checkbox" 
                        checked={checklist.noBidding}
                        onChange={e => setChecklist(prev => ({ ...prev, noBidding: e.target.checked }))}
                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                      />
                    </div>
                    <span className="text-sm text-slate-700 font-medium">
                      Confirmo a <strong>impossibilidade de licitação</strong> via fluxo normal em tempo hábil.
                    </span>
                  </label>
                </div>
              </div>

            </div>

            {/* Right: Document Preview */}
            <div className="flex-1 p-8 overflow-y-auto flex flex-col items-center bg-slate-100/50">
              <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl p-8 shadow-sm scale-[0.9] origin-top">
                <StaticCertidaoAtesto 
                  processData={process} 
                  documentData={PREVIEW_DOCUMENT_DATA} 
                />
              </div>
            </div>
            
          </div>

          {/* Footer Actions */}
          <div className="border-t border-slate-200 bg-white px-8 py-5 flex items-center justify-between shrink-0">
            <p className="text-xs text-slate-500 flex items-center gap-2">
              <AlertCircle size={14} className="text-amber-500" />
              Certifique-se de validar todos os itens antes de assinar
            </p>
            <div className="flex gap-3">
              <button 
                onClick={onClose}
                className="px-6 py-3 bg-slate-100 font-bold text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSignClick}
                disabled={isLoading || !isChecklistComplete}
                className={`
                  px-8 py-3 rounded-xl font-black text-white shadow-lg transition-all flex items-center gap-2
                  ${isLoading || !isChecklistComplete 
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none transform-none' 
                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 hover:scale-105 active:scale-95'}
                `}
              >
                {isLoading ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    Validando...
                  </>
                ) : (
                  <>
                    <BadgeCheck size={18} />
                    Validar e Assinar
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>

      <SignatureModal
        isOpen={showSignature}
        onClose={() => setShowSignature(false)}
        onConfirm={onConfirm}
        title="Assinar Certidão"
        description="Digite seu PIN para assinar digitalmente a certidão de atesto."
      />
    </>
  )
}
