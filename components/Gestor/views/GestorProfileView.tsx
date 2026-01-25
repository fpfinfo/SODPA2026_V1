'use client'

import React, { useState, useEffect } from 'react'
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Hash,
  Shield,
  Save,
  Loader2,
  Key,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'

interface GestorProfileViewProps {
  onClose: () => void
  onProfileUpdate?: () => Promise<void>
}

interface ProfileData {
  id: string
  nome: string
  email: string
  cpf?: string
  matricula?: string
  cargo?: string
  lotacao?: string
  telefone?: string
  avatar_url?: string | null
  role?: string
  signature_pin?: string
}

export function GestorProfileView({ onClose, onProfileUpdate }: GestorProfileViewProps) {
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'dados' | 'seguranca'>('dados')
  
  // PIN states
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [pinSuccess, setPinSuccess] = useState(false)

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Usuário não autenticado')

        const userEmail = user.email

        // Try servidores_tj first (source of truth)
        if (userEmail) {
          const { data: servidorData } = await supabase
            .from('servidores_tj')
            .select('*')
            .ilike('email', userEmail)
            .eq('ativo', true)
            .maybeSingle()

          // Also get profile for PIN
          const { data: profileRow } = await supabase
            .from('profiles')
            .select('signature_pin, role')
            .eq('id', user.id)
            .maybeSingle()

          if (servidorData) {
            setProfileData({
              id: user.id,
              nome: servidorData.nome || 'Gestor',
              email: servidorData.email || userEmail,
              cpf: servidorData.cpf || '',
              matricula: servidorData.matricula || '',
              cargo: servidorData.cargo || 'Servidor',
              lotacao: servidorData.lotacao || '',
              telefone: servidorData.telefone || '',
              avatar_url: servidorData.avatar_url || null,
              role: profileRow?.role || 'GESTOR',
              signature_pin: profileRow?.signature_pin || ''
            })
          } else {
            // Fallback to profiles table
            const { data: fallbackProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single()

            if (fallbackProfile) {
              setProfileData({
                id: fallbackProfile.id,
                nome: fallbackProfile.nome || 'Gestor',
                email: fallbackProfile.email || userEmail || '',
                cpf: fallbackProfile.cpf || '',
                matricula: fallbackProfile.matricula || '',
                cargo: fallbackProfile.cargo || 'Servidor',
                lotacao: fallbackProfile.lotacao || '',
                telefone: fallbackProfile.telefone || '',
                avatar_url: fallbackProfile.avatar_url || null,
                role: fallbackProfile.role || 'GESTOR',
                signature_pin: fallbackProfile.signature_pin || ''
              })
            }
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [])

  // Handle PIN save
  const handleSavePin = async () => {
    setPinError('')
    setPinSuccess(false)

    // Validation
    if (!newPin || newPin.length < 4) {
      setPinError('O PIN deve ter pelo menos 4 dígitos.')
      return
    }
    if (newPin !== confirmPin) {
      setPinError('Os PINs não coincidem.')
      return
    }
    if (!/^\d+$/.test(newPin)) {
      setPinError('O PIN deve conter apenas números.')
      return
    }

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          signature_pin: newPin,
          updated_at: new Date().toISOString()
        })
        .eq('id', profileData?.id)

      if (error) throw error

      setProfileData(prev => prev ? { ...prev, signature_pin: newPin } : null)
      setNewPin('')
      setConfirmPin('')
      setPinSuccess(true)
      
      if (onProfileUpdate) {
        await onProfileUpdate()
      }

      setTimeout(() => setPinSuccess(false), 3000)
    } catch (error) {
      console.error('Error saving PIN:', error)
      setPinError('Erro ao salvar o PIN. Tente novamente.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Carregando perfil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900">Meu Perfil</h1>
            <p className="text-sm text-slate-500">Gestor - Dados Cadastrais</p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-6">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('dados')}
            className={`px-4 py-3 text-sm font-bold transition-colors border-b-2 -mb-[2px] ${
              activeTab === 'dados'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <User size={16} className="inline mr-2" />
            Dados Pessoais
          </button>
          <button
            onClick={() => setActiveTab('seguranca')}
            className={`px-4 py-3 text-sm font-bold transition-colors border-b-2 -mb-[2px] ${
              activeTab === 'seguranca'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Key size={16} className="inline mr-2" />
            Segurança
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto">
          {activeTab === 'dados' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Profile Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-8">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center text-white">
                    {profileData?.avatar_url ? (
                      <img 
                        src={profileData.avatar_url} 
                        alt="Avatar" 
                        className="w-full h-full rounded-2xl object-cover"
                      />
                    ) : (
                      <User size={40} />
                    )}
                  </div>
                  <div className="text-white">
                    <h2 className="text-2xl font-black">{profileData?.nome || 'Gestor'}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <Shield size={14} className="text-blue-200" />
                      <span className="text-blue-100 font-medium">
                        {profileData?.role === 'GESTOR' ? 'Gestor de Unidade' : profileData?.role}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Fields */}
              <div className="p-8 space-y-6">
                {/* Identificação */}
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                    Identificação
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">Nome Completo</label>
                      <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200">
                        <User size={16} className="text-slate-400" />
                        <span className="text-sm font-medium text-slate-700">{profileData?.nome || '-'}</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">CPF</label>
                      <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200">
                        <Hash size={16} className="text-slate-400" />
                        <span className="text-sm font-medium text-slate-700">{profileData?.cpf || '-'}</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">Matrícula</label>
                      <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200">
                        <Hash size={16} className="text-slate-400" />
                        <span className="text-sm font-medium text-slate-700">{profileData?.matricula || '-'}</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">Cargo</label>
                      <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200">
                        <Briefcase size={16} className="text-slate-400" />
                        <span className="text-sm font-medium text-slate-700">{profileData?.cargo || '-'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lotação */}
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                    Lotação
                  </h3>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Unidade de Lotação</label>
                    <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200">
                      <Building2 size={16} className="text-slate-400" />
                      <span className="text-sm font-medium text-slate-700">{profileData?.lotacao || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Contato */}
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                    Contato
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">E-mail Institucional</label>
                      <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200">
                        <Mail size={16} className="text-slate-400" />
                        <span className="text-sm font-medium text-slate-700">{profileData?.email || '-'}</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">Telefone</label>
                      <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200">
                        <Phone size={16} className="text-slate-400" />
                        <span className="text-sm font-medium text-slate-700">{profileData?.telefone || '-'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info Note */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle size={18} className="text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-blue-800">Dados sincronizados do sistema RH</p>
                    <p className="text-xs text-blue-600 mt-1">
                      Seus dados cadastrais são importados automaticamente do sistema de Recursos Humanos do TJPA. 
                      Para alterações, entre em contato com a SEFAP.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'seguranca' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                    <Key size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800">PIN de Assinatura Digital</h3>
                    <p className="text-sm text-slate-500">
                      Use este PIN para assinar documentos eletronicamente
                    </p>
                  </div>
                </div>

                {/* Current PIN Status */}
                <div className="bg-slate-50 rounded-xl p-4 mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {profileData?.signature_pin ? (
                      <>
                        <CheckCircle2 size={20} className="text-emerald-500" />
                        <span className="text-sm font-bold text-emerald-700">PIN configurado</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={20} className="text-amber-500" />
                        <span className="text-sm font-bold text-amber-700">PIN não configurado</span>
                      </>
                    )}
                  </div>
                  {profileData?.signature_pin && (
                    <span className="text-xs text-slate-400">••••</span>
                  )}
                </div>

                {/* PIN Form */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">
                      {profileData?.signature_pin ? 'Novo PIN' : 'Definir PIN'}
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="Digite 4-6 dígitos"
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Confirmar PIN</label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="Confirme o PIN"
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                    />
                  </div>

                  {/* Error/Success Messages */}
                  {pinError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
                      <AlertCircle size={16} />
                      {pinError}
                    </div>
                  )}
                  {pinSuccess && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
                      <CheckCircle2 size={16} />
                      PIN atualizado com sucesso!
                    </div>
                  )}

                  <button
                    onClick={handleSavePin}
                    disabled={isSaving || !newPin || !confirmPin}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        Salvar PIN
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
