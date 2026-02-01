import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Camera, Save, User, Briefcase, Hash, Loader2, Phone, Building, 
  CreditCard, Mail, MapPin, Users, Shield, CheckCircle 
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useToast } from './ui/ToastProvider';
import { useAvatarUpload } from '../hooks/useAvatarUpload';

interface ProfilePageProps {
  userProfile: any;
  onClose: () => void;
  onProfileUpdate: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ 
  userProfile, 
  onClose,
  onProfileUpdate 
}) => {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [formData, setFormData] = useState({
    // Dados Pessoais
    nome: '',
    email: '',
    cpf: '',
    matricula: '',
    cargo: '',
    vinculo: '',
    telefone: '',
    // Localização
    lotacao: '',
    municipio: '',
    // Gestor
    gestor_nome: '',
    gestor_email: '',
    // Dados Bancários
    banco: '',
    agencia: '',
    conta_corrente: '',
    // Avatar
    avatar_url: ''
  });

  const { uploadAvatar, isUploading: isUploadingAvatar } = useAvatarUpload({
    bucket: 'avatars',
    onSuccess: (publicUrl) => {
      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
      setHasChanges(true);
      showToast({ type: 'success', title: 'Foto atualizada!', message: 'A imagem foi enviada com sucesso.' });
    },
    onError: (error) => {
      console.error('Avatar upload error:', error);
      showToast({ type: 'error', title: 'Erro no upload', message: error.message || 'Não foi possível enviar a imagem.' });
    }
  });

  useEffect(() => {
    if (userProfile) {
      setFormData({
        nome: userProfile.nome || '',
        email: userProfile.email || '',
        cpf: userProfile.cpf || '',
        matricula: userProfile.matricula || '',
        cargo: userProfile.cargo || '',
        vinculo: userProfile.vinculo || '',
        telefone: userProfile.telefone || '',
        lotacao: userProfile.lotacao || '',
        municipio: userProfile.municipio || '',
        gestor_nome: userProfile.gestor_nome || '',
        gestor_email: userProfile.gestor_email || '',
        banco: userProfile.banco || '',
        agencia: userProfile.agencia || '',
        conta_corrente: userProfile.conta_corrente || '',
        avatar_url: userProfile.avatar_url || ''
      });
    }
  }, [userProfile]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && userProfile?.id) {
      const localPreview = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, avatar_url: localPreview }));
      
      const publicUrl = await uploadAvatar(file, userProfile.id);
      if (publicUrl) {
        setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
        setHasChanges(true);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const isValidAvatarUrl = formData.avatar_url && 
        (formData.avatar_url.startsWith('https://') || formData.avatar_url.startsWith('http://')) &&
        !formData.avatar_url.startsWith('blob:');
      
      const avatarToSave = isValidAvatarUrl ? formData.avatar_url : null;
      const now = new Date().toISOString();

      // PRIMARY: Update or Insert in servidores_tj
      if (userProfile?.email && userProfile?.id) {
        const { data: existingRecord, error: selectError } = await supabase
          .from('servidores_tj')
          .select('id')
          .or(`id.eq.${userProfile.id},email.ilike.${userProfile.email}`)
          .maybeSingle();

        const servidorPayload = {
          nome: formData.nome,
          email: userProfile.email.toLowerCase(),
          cpf: formData.cpf || null,
          cargo: formData.cargo || null,
          vinculo: formData.vinculo || null,
          telefone: formData.telefone || null,
          lotacao: formData.lotacao || null,
          municipio: formData.municipio || null,
          gestor_nome: formData.gestor_nome || null,
          gestor_email: formData.gestor_email || null,
          banco: formData.banco || null,
          agencia: formData.agencia || null,
          conta_corrente: formData.conta_corrente || null,
          ...(avatarToSave && { avatar_url: avatarToSave }),
          updated_at: now,
          ativo: true
        };

        if (existingRecord?.id) {
          const { error: servidoresError } = await supabase
            .from('servidores_tj')
            .update(servidorPayload)
            .eq('id', existingRecord.id);

          if (servidoresError) {
            console.error('[ProfilePage] Error updating servidores_tj:', servidoresError);
          }
        } else {
          const { error: insertError } = await supabase
            .from('servidores_tj')
            .insert({
              id: userProfile.id,
              ...servidorPayload,
              matricula: formData.matricula ? parseInt(formData.matricula) : null,
              created_at: now
            });

          if (insertError) {
            console.error('[ProfilePage] Error inserting servidores_tj:', insertError);
          }
        }
      }

      // SECONDARY: Sync to profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          nome: formData.nome,
          cargo: formData.cargo,
          telefone: formData.telefone,
          ...(avatarToSave && { avatar_url: avatarToSave }),
          updated_at: now
        })
        .eq('id', userProfile?.id);

      if (profileError) throw profileError;

      showToast({ type: 'success', title: 'Perfil atualizado!', message: 'Suas informações foram salvas com sucesso.' });
      setHasChanges(false);
      onProfileUpdate();
    } catch (error: any) {
      console.error('Error saving profile:', error);
      showToast({ type: 'error', title: 'Erro ao salvar', message: error.message || 'Tente novamente.' });
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-medium text-gray-800 shadow-sm";
  const inputDisabledClass = "w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl font-medium text-gray-500 cursor-not-allowed";
  const labelClass = "text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5 mb-1.5";

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <User className="text-blue-600" size={24} />
              Meu Perfil
            </h1>
            <p className="text-sm text-gray-500">Gerencie suas informações pessoais e configurações</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {hasChanges && (
            <span className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full font-medium">
              Alterações não salvas
            </span>
          )}
          <button
            onClick={handleSubmit}
            disabled={saving || !hasChanges}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-blue-200 transition-all"
          >
            {saving ? (
              <><Loader2 size={18} className="animate-spin" /> Salvando...</>
            ) : (
              <><Save size={18} /> Salvar Alterações</>
            )}
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Avatar Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-6">
                <div className="relative group cursor-pointer">
                  <div className="w-28 h-28 rounded-2xl border-4 border-blue-100 shadow-lg overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100">
                    <img 
                      src={formData.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.nome}`} 
                      alt="Avatar" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <label className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="text-white" size={28} />
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                  </label>
                  <div className="absolute -bottom-1 -right-1 bg-blue-600 p-2 rounded-xl text-white border-2 border-white shadow-md">
                    <Camera size={14} />
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900">{formData.nome || 'Usuário'}</h2>
                  <p className="text-gray-500 flex items-center gap-2 mt-1">
                    <Mail size={14} /> {formData.email}
                  </p>
                  {formData.cargo && (
                    <p className="text-gray-500 flex items-center gap-2 mt-1">
                      <Briefcase size={14} /> {formData.cargo}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-3">
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1">
                      <CheckCircle size={12} /> Conta Verificada
                    </span>
                    {userProfile?.role && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold flex items-center gap-1">
                        <Shield size={12} /> {userProfile.role}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Dados Pessoais */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-6">
                <User className="text-blue-600" size={20} />
                Dados Pessoais
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className={labelClass}>Nome Completo</label>
                  <input 
                    type="text" 
                    className={inputClass}
                    value={formData.nome}
                    onChange={e => handleChange('nome', e.target.value)}
                  />
                </div>

                <div>
                  <label className={labelClass}><Mail size={14} /> E-mail</label>
                  <input 
                    type="email" 
                    disabled
                    className={inputDisabledClass}
                    value={formData.email}
                  />
                </div>
                
                <div>
                  <label className={labelClass}><Hash size={14} /> CPF</label>
                  <input 
                    type="text" 
                    placeholder="000.000.000-00"
                    className={inputClass}
                    value={formData.cpf}
                    onChange={e => handleChange('cpf', e.target.value)}
                  />
                </div>

                <div>
                  <label className={labelClass}><Hash size={14} /> Matrícula</label>
                  <input 
                    type="text" 
                    disabled
                    className={inputDisabledClass}
                    value={formData.matricula}
                  />
                </div>
                
                <div>
                  <label className={labelClass}><Briefcase size={14} /> Cargo / Função</label>
                  <input 
                    type="text" 
                    className={inputClass}
                    value={formData.cargo}
                    onChange={e => handleChange('cargo', e.target.value)}
                  />
                </div>

                <div>
                  <label className={labelClass}><Briefcase size={14} /> Tipo de Vínculo</label>
                  <select 
                    className={inputClass}
                    value={formData.vinculo}
                    onChange={e => handleChange('vinculo', e.target.value)}
                  >
                    <option value="">Selecione...</option>
                    <option value="Efetivo">Efetivo</option>
                    <option value="Requisitado">Requisitado</option>
                    <option value="Colaborador">Colaborador</option>
                  </select>
                </div>
                
                <div>
                  <label className={labelClass}><Phone size={14} /> Telefone</label>
                  <input 
                    type="tel" 
                    placeholder="(91) 99999-9999"
                    className={inputClass}
                    value={formData.telefone}
                    onChange={e => handleChange('telefone', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Localização */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-6">
                <MapPin className="text-green-600" size={20} />
                Localização
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}><Building size={14} /> Lotação</label>
                  <input 
                    type="text" 
                    placeholder="Comarca ou Setor"
                    className={inputClass}
                    value={formData.lotacao}
                    onChange={e => handleChange('lotacao', e.target.value)}
                  />
                </div>
                
                <div>
                  <label className={labelClass}><MapPin size={14} /> Município</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Belém"
                    className={inputClass}
                    value={formData.municipio}
                    onChange={e => handleChange('municipio', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Gestor Imediato */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-6">
                <Users className="text-purple-600" size={20} />
                Gestor Imediato
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}><User size={14} /> Nome do Gestor</label>
                  <input 
                    type="text" 
                    placeholder="Nome completo"
                    className={inputClass}
                    value={formData.gestor_nome}
                    onChange={e => handleChange('gestor_nome', e.target.value)}
                  />
                </div>
                
                <div>
                  <label className={labelClass}><Mail size={14} /> E-mail do Gestor</label>
                  <input 
                    type="email" 
                    placeholder="gestor@tjpa.jus.br"
                    className={inputClass}
                    value={formData.gestor_email}
                    onChange={e => handleChange('gestor_email', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Dados Bancários */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-6">
                <CreditCard className="text-amber-600" size={20} />
                Dados Bancários
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className={labelClass}>Banco</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Banco do Brasil"
                    className={inputClass}
                    value={formData.banco}
                    onChange={e => handleChange('banco', e.target.value)}
                  />
                </div>
                
                <div>
                  <label className={labelClass}>Agência</label>
                  <input 
                    type="text" 
                    placeholder="0000-0"
                    className={inputClass}
                    value={formData.agencia}
                    onChange={e => handleChange('agencia', e.target.value)}
                  />
                </div>
                
                <div>
                  <label className={labelClass}>Conta Corrente</label>
                  <input 
                    type="text" 
                    placeholder="00000-0"
                    className={inputClass}
                    value={formData.conta_corrente}
                    onChange={e => handleChange('conta_corrente', e.target.value)}
                  />
                </div>
              </div>
            </div>

          </form>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
