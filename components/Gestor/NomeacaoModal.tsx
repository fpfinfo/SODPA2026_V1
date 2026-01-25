'use client'

import React, { useState } from 'react'
import { 
  X, 
  UserPlus, 
  FileText, 
  PenTool, 
  CheckCircle2, 
  AlertTriangle,
  Loader2,
  Eye
} from 'lucide-react'
import { useNomeacao } from '../../hooks/useNomeacao'
import { generatePortariaText } from '../../utils/PortariaTemplate'
import { useToast } from '../ui/ToastProvider'

interface NomeacaoModalProps {
  isOpen: boolean
  onClose: () => void
  currentUser: any
  currentUnidade: any
}

export function NomeacaoModal({ isOpen, onClose, currentUser, currentUnidade }: NomeacaoModalProps) {
  const { createAndSignNomeacao, isLoading } = useNomeacao()
  const { showToast } = useToast()
  
  const [step, setStep] = useState<'FORM' | 'PREVIEW' | 'SIGN'>('FORM')
  
  // Form State
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    matricula: '',
    cargo: 'Analista Judiciário',
    email: '',
    motivo: 'Rotação periódica de responsabilidade',
    dataEfeito: new Date().toISOString().split('T')[0]
  })

  // PIN State
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')

  if (!isOpen) return null

  const handleNext = () => {
    if (step === 'FORM') {
      if (!formData.nome || !formData.cpf || !formData.matricula) {
        showToast({ title: 'Campos obrigatórios', message: 'Preencha todos os dados do servidor.', type: 'error' })
        return
      }
      setStep('PREVIEW')
    } else if (step === 'PREVIEW') {
      setStep('SIGN')
    }
  }

  const handleSignAndSubmit = async () => {
    // Validate PIN (Mock validation for now, or match with profile if available)
    if (pin.length < 4) {
      setPinError('PIN inválido')
      return
    }

    const res = await createAndSignNomeacao(
      {
        novoSuprido: {
          nome: formData.nome,
          cpf: formData.cpf,
          matricula: formData.matricula,
          cargo: formData.cargo,
          email: formData.email
        },
        motivo: formData.motivo,
        dataEfeito: formData.dataEfeito
      },
      currentUser,
      currentUnidade
    )

    if (res.success) {
      showToast({
        title: 'Portaria Emitida!',
        message: 'A nomeação foi assinada e enviada para processamento da SOSFU.',
        type: 'success'
      })
      onClose()
    } else {
      showToast({
        title: 'Erro ao emitir portaria',
        message: res.error || 'Tente novamente.',
        type: 'error'
      })
    }
  }

  // Generate preview text on the fly
  const previewText = generatePortariaText({
    portariaNumero: 'PENDENTE/2026',
    dataEmissao: new Date().toISOString(),
    cidadeComarca: currentUnidade?.nome || 'Comarca',
    gestorNome: currentUser?.nome || 'Gestor',
    gestorCargo: 'Juiz de Direito e Diretor do Fórum',
    unidadeNome: currentUnidade?.nome || 'Unidade',
    novoSupridoNome: formData.nome.toUpperCase() || 'NOVO SERVIDOR',
    novoSupridoCargo: formData.cargo,
    novoSupridoMatricula: formData.matricula,
    novoSupridoCPF: formData.cpf,
    antigoSupridoNome: currentUnidade?.suprido_nome,
    ptres: ['8193', '8163'],
    dataEfeito: formData.dataEfeito
  })

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
              <UserPlus size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Nomear Novo Suprido</h2>
              <p className="text-xs text-slate-400">Emissão de Portaria de Designação</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          
          {/* Progress Steps */}
          <div className="flex items-center justify-between px-8 mb-8">
            <div className={`flex flex-col items-center gap-2 ${step === 'FORM' ? 'text-blue-600' : 'text-emerald-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step === 'FORM' ? 'bg-blue-100' : 'bg-emerald-100'}`}>1</div>
              <span className="text-[10px] font-bold uppercase">Dados</span>
            </div>
            <div className="flex-1 h-0.5 bg-slate-100 mx-4" />
            <div className={`flex flex-col items-center gap-2 ${step === 'PREVIEW' ? 'text-blue-600' : step === 'SIGN' ? 'text-emerald-600' : 'text-slate-300'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step === 'PREVIEW' ? 'bg-blue-100' : step === 'SIGN' ? 'bg-emerald-100' : 'bg-slate-100'}`}>2</div>
              <span className="text-[10px] font-bold uppercase">Portaria</span>
            </div>
            <div className="flex-1 h-0.5 bg-slate-100 mx-4" />
            <div className={`flex flex-col items-center gap-2 ${step === 'SIGN' ? 'text-blue-600' : 'text-slate-300'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step === 'SIGN' ? 'bg-blue-100' : 'bg-slate-100'}`}>3</div>
              <span className="text-[10px] font-bold uppercase">Assinar</span>
            </div>
          </div>

          {/* STEP 1: FORM */}
          {step === 'FORM' && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Nome Completo</label>
                  <input
                    value={formData.nome}
                    onChange={e => setFormData({...formData, nome: e.target.value})}
                    placeholder="Nome do servidor"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">CPF</label>
                  <input
                    value={formData.cpf}
                    onChange={e => setFormData({...formData, cpf: e.target.value})} // Use input masking lib ideally
                    placeholder="000.000.000-00"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Matrícula</label>
                  <input
                    value={formData.matricula}
                    onChange={e => setFormData({...formData, matricula: e.target.value})}
                    placeholder="123456"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Cargo</label>
                  <input
                    value={formData.cargo}
                    onChange={e => setFormData({...formData, cargo: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">E-mail Institucional</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  placeholder="servidor@tjpa.jus.br"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                   <label className="text-xs font-bold text-slate-500 uppercase">Motivo da Troca</label>
                    <select
                      value={formData.motivo}
                      onChange={e => setFormData({...formData, motivo: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    >
                      <option>Rotação periódica</option>
                      <option>Férias/Licença do titular</option>
                      <option>Aposentadoria/Exoneração</option>
                      <option>Outros</option>
                    </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Data de Efeito</label>
                  <input
                    type="date"
                    value={formData.dataEfeito}
                    onChange={e => setFormData({...formData, dataEfeito: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-3 text-amber-800 text-xs">
                 <AlertTriangle size={16} className="shrink-0" />
                 <p>O servidor indicado deve possuir vínculo efetivo com o TJPA e estar lotado na comarca para assumir a função.</p>
              </div>
            </div>
          )}

          {/* STEP 2: PREVIEW */}
          {step === 'PREVIEW' && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300 h-full flex flex-col">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <FileText size={16} /> Minuta da Portaria
                </h3>
              </div>
              
              <div className="bg-slate-100 p-8 rounded-xl border border-slate-200 shadow-inner flex-1 overflow-y-auto max-h-[400px]">
                <div className="bg-white shadow-lg p-8 min-h-[500px] text-justify font-serif text-sm leading-relaxed whitespace-pre-wrap">
                  {previewText}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SIGN */}
          {step === 'SIGN' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 text-center py-8">
               <div className="w-16 h-16 bg-blue-100 rounded-2xl mx-auto flex items-center justify-center text-blue-600 mb-4">
                 <PenTool size={32} />
               </div>
               
               <div>
                 <h3 className="text-xl font-black text-slate-800">Assinatura Digital</h3>
                 <p className="text-slate-500 text-sm mt-1">Confirme sua identidade para emitir a portaria</p>
               </div>

               <div className="max-w-xs mx-auto space-y-4">
                 <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">Resumo da Ação</p>
                    <p className="font-medium text-slate-700">Nomeação de {formData.nome}</p>
                    <p className="text-xs text-slate-500">PTRES 8193 e 8163</p>
                 </div>

                 <div className="space-y-2 text-left">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">PIN de Assinatura</label>
                    <input
                      type="password"
                      maxLength={6}
                      value={pin}
                      onChange={e => {
                        setPin(e.target.value.replace(/\D/g, ''))
                        setPinError('')
                      }}
                      placeholder="• • • •"
                      className="w-full text-center text-2xl tracking-widest px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                    {pinError && <p className="text-xs text-red-500 text-center font-bold animate-pulse">{pinError}</p>}
                 </div>
               </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
          <button
            onClick={step === 'FORM' ? onClose : () => setStep(step === 'SIGN' ? 'PREVIEW' : 'FORM')}
            className="px-4 py-2 text-slate-600 font-bold hover:bg-white hover:shadow-sm rounded-lg transition-all text-sm"
          >
            Voltar
          </button>
          
          {step !== 'SIGN' ? (
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-all text-sm flex items-center gap-2"
            >
              {step === 'FORM' ? 'Gerar Portaria' : 'Assinar Documento'}
              <CheckCircle2 size={16} />
            </button>
          ) : (
            <button
              onClick={handleSignAndSubmit}
              disabled={isLoading || pin.length < 4}
              className="px-8 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin"/> : <PenTool size={16} />}
              Confirmar Assinatura
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
