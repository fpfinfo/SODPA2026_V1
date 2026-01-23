'use client'

import React, { useState, useRef, useEffect } from 'react'
import { 
  KeyRound, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Lock
} from 'lucide-react'

interface SignatureModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (pin: string) => Promise<{ success: boolean; error?: string }>
  title?: string
  description?: string
  documentsCount?: number
}

export function SignatureModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirmar Assinatura",
  description = "Digite seu PIN para assinar digitalmente",
  documentsCount
}: SignatureModalProps) {
  const [pin, setPin] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setPin(['', '', '', '', '', ''])
      setError(null)
      setSuccess(false)
      setIsLoading(false)
      setTimeout(() => {
        inputRefs.current[0]?.focus()
      }, 100)
    }
  }, [isOpen])

  // Handle input change
  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, '').slice(0, 6).split('')
      const newPin = [...pin]
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newPin[index + i] = digit
        }
      })
      setPin(newPin)
      const nextIndex = Math.min(index + digits.length, 5)
      inputRefs.current[nextIndex]?.focus()
      return
    }

    if (!/^\d*$/.test(value)) return

    const newPin = [...pin]
    newPin[index] = value
    setPin(newPin)

    // Move to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === 'Enter') {
      handleSubmit()
    }
    if (e.key === 'Escape') {
      onClose()
    }
  }

  const handleSubmit = async () => {
    const pinString = pin.join('')
    if (pinString.length !== 6) {
      setError('Digite todos os 6 dígitos do PIN')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await onConfirm(pinString)

      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          onClose()
        }, 1500)
      } else {
        setError(result.error || 'Erro ao assinar documento')
        setIsLoading(false)
        setPin(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      }
    } catch (err) {
      setError('Erro inesperado ao validar PIN')
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Lock size={20} />
              </div>
              <div>
                <h2 className="font-semibold">{title}</h2>
                <p className="text-sm text-emerald-100">
                  {description}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {documentsCount && documentsCount > 0 && (
            <div className="bg-emerald-50 text-emerald-700 px-4 py-3 rounded-lg mb-6 text-sm flex items-center gap-2">
              <KeyRound size={16} />
              Assinando {documentsCount} documento(s)
            </div>
          )}

          {/* Success State */}
          {success ? (
            <div className="text-center py-8 animate-in fade-in zoom-in duration-300">
              <CheckCircle2 size={64} className="mx-auto text-emerald-500 mb-4" />
              <h3 className="text-xl font-semibold text-slate-800 mb-2">Assinatura Confirmada!</h3>
              <p className="text-slate-500">
                Operação realizada com sucesso.
              </p>
            </div>
          ) : (
            <>
              {/* PIN Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-3 text-center">
                  Digite seu PIN de 6 dígitos
                </label>
                <div className="flex justify-center gap-2">
                  {pin.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el }}
                      type="password"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className={`
                        w-12 h-14 text-center text-2xl font-bold
                        border-2 rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-emerald-500
                        transition-all
                        ${error 
                          ? 'border-red-300 bg-red-50 text-red-600' 
                          : 'border-slate-200 bg-slate-50 focus:border-emerald-500 text-slate-800'
                        }
                      `}
                      disabled={isLoading}
                    />
                  ))}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg p-3 mb-4 animate-in slide-in-from-top-2">
                  <AlertCircle size={18} />
                  <span className="text-sm font-medium">{error}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                  disabled={isLoading}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isLoading || pin.join('').length !== 6}
                  className={`
                    flex-1 px-4 py-3 rounded-lg font-medium
                    flex items-center justify-center gap-2
                    transition-all
                    ${pin.join('').length === 6 && !isLoading
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }
                  `}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Validando...
                    </>
                  ) : (
                    <>
                      <KeyRound size={18} />
                      Assinar
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 text-center border-t border-slate-100">
          <p className="text-xs text-slate-500 flex items-center justify-center gap-1.5">
             <Lock size={12} />
             Ambiente seguro | Assinatura Digital Interna
          </p>
        </div>
      </div>
    </div>
  )
}
