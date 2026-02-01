import React, { useState, useEffect } from 'react';
import { X, Camera, Save, User, Briefcase, Hash, Loader2, Phone, Building, CreditCard, Mail, MapPin, Users } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useToast } from './ui/ToastProvider';
import { useAvatarUpload } from '../hooks/useAvatarUpload';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: any;
  onProfileUpdate: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ 
  isOpen, 
  onClose, 
  userProfile, 
  onProfileUpdate 
}) => {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    // Dados Pessoais
    nome: '',
    email: '',
    cpf: '',
    matricula: '',
    cargo: '',
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

  // Use the centralized avatar upload hook
  const { uploadAvatar, isUploading: isUploadingAvatar } = useAvatarUpload({
    bucket: 'avatars',
    onSuccess: (publicUrl) => {
      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
      showToast({ type: 'success', title: 'Foto atualizada!', message: 'A imagem foi enviada com sucesso.' });
    },
    onError: (error) => {
      console.error('Avatar upload error:', error);
      showToast({ type: 'error', title: 'Erro no upload', message: error.message || 'Não foi possível enviar a imagem.' });
    }
  });

  useEffect(() => {
    if (isOpen && userProfile) {
      setFormData({
        nome: userProfile.nome || '',
        email: userProfile.email || '',
        cpf: userProfile.cpf || '',
        matricula: userProfile.matricula || '',
        cargo: userProfile.cargo || '',
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
  }, [isOpen, userProfile]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && userProfile?.id) {
      const localPreview = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, avatar_url: localPreview }));
      
      const publicUrl = await uploadAvatar(file, userProfile.id);
      if (publicUrl) {
        setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
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

      // PRIMARY: Update servidores_tj (source of truth)
      if (userProfile?.email) {
        const { error: servidoresError } = await supabase
          .from('servidores_tj')
          .update({
            nome: formData.nome,
            cpf: formData.cpf || null,
            cargo: formData.cargo,
            telefone: formData.telefone || null,
            lotacao: formData.lotacao || null,
            municipio: formData.municipio || null,
            gestor_nome: formData.gestor_nome || null,
            gestor_email: formData.gestor_email || null,
            banco: formData.banco || null,
            agencia: formData.agencia || null,
            conta_corrente: formData.conta_corrente || null,
            ...(avatarToSave && { avatar_url: avatarToSave }),
            updated_at: now
          })
          .ilike('email', userProfile.email);

        if (servidoresError) {
          console.error('Error updating servidores_tj:', servidoresError);
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

      showToast({ type: 'success', title: 'Perfil atualizado!', message: 'Suas informações foram salvas.' });
      onProfileUpdate();
      onClose();
    } catch (error: any) {
      console.error('Error saving profile:', error);
      showToast({ type: 'error', title: 'Erro ao salvar', message: error.message || 'Tente novamente.' });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  // Common input styles
  const inputClass = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none font-medium text-gray-800";
  const inputDisabledClass = "w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-lg font-medium text-gray-500 cursor-not-allowed";
  const labelClass = "text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm animate-in fade-in p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 flex justify-between items-center text-white shrink-0">
          <h3 className="text-lg font-bold flex items-center gap-2">
             <User size={20} className="text-blue-400" />
             Editar Meu Perfil
          </h3>
          <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
           
           {/* Avatar Section */}
           <div className="flex flex-col items-center justify-center gap-2 pb-4 border-b border-gray-100">
              <div className="relative group cursor-pointer">
                  <div className="w-20 h-20 rounded-full border-4 border-slate-100 shadow-md overflow-hidden bg-blue-50">
                      <img 
                        src={formData.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.nome}`} 
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                      />
                  </div>
                  <label className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Camera className="text-white" size={24} />
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                  </label>
                  <div className="absolute bottom-0 right-0 bg-blue-600 p-1.5 rounded-full text-white border-2 border-white shadow-sm">
                     <Camera size={10} />
                  </div>
              </div>
              <p className="text-xs text-gray-400">Clique para alterar</p>
           </div>

           {/* SEÇÃO 1: DADOS PESSOAIS */}
           <div className="space-y-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <User size={14} /> Dados Pessoais
              </p>
              
              <div className="space-y-1">
                  <label className={labelClass}>Nome Completo</label>
                  <input 
                    type="text" 
                    className={inputClass}
                    value={formData.nome}
                    onChange={e => setFormData({...formData, nome: e.target.value})}
                  />
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                      <label className={labelClass}><Mail size={14} /> E-mail</label>
                      <input 
                        type="email" 
                        disabled
                        className={inputDisabledClass}
                        value={formData.email}
                      />
                  </div>
                  <div className="space-y-1">
                      <label className={labelClass}><Hash size={14} /> CPF</label>
                      <input 
                        type="text" 
                        placeholder="000.000.000-00"
                        className={inputClass}
                        value={formData.cpf}
                        onChange={e => setFormData({...formData, cpf: e.target.value})}
                      />
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                      <label className={labelClass}><Hash size={14} /> Matrícula</label>
                      <input 
                        type="text" 
                        disabled
                        className={inputDisabledClass}
                        value={formData.matricula}
                      />
                  </div>
                  <div className="space-y-1">
                      <label className={labelClass}><Briefcase size={14} /> Cargo / Função</label>
                      <input 
                        type="text" 
                        className={inputClass}
                        value={formData.cargo}
                        onChange={e => setFormData({...formData, cargo: e.target.value})}
                      />
                  </div>
              </div>

              <div className="space-y-1">
                  <label className={labelClass}><Phone size={14} /> Telefone</label>
                  <input 
                    type="tel" 
                    placeholder="(91) 99999-9999"
                    className={inputClass}
                    value={formData.telefone}
                    onChange={e => setFormData({...formData, telefone: e.target.value})}
                  />
              </div>
           </div>

           {/* SEÇÃO 2: LOCALIZAÇÃO */}
           <div className="pt-4 border-t border-gray-200 space-y-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin size={14} /> Localização
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                      <label className={labelClass}><Building size={14} /> Lotação</label>
                      <input 
                        type="text" 
                        placeholder="Comarca ou Setor"
                        className={inputClass}
                        value={formData.lotacao}
                        onChange={e => setFormData({...formData, lotacao: e.target.value})}
                      />
                  </div>
                  <div className="space-y-1">
                      <label className={labelClass}><MapPin size={14} /> Município</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Belém"
                        className={inputClass}
                        value={formData.municipio}
                        onChange={e => setFormData({...formData, municipio: e.target.value})}
                      />
                  </div>
              </div>
           </div>

           {/* SEÇÃO 3: GESTOR IMEDIATO */}
           <div className="pt-4 border-t border-gray-200 space-y-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users size={14} /> Gestor Imediato
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                      <label className={labelClass}><User size={14} /> Nome do Gestor</label>
                      <input 
                        type="text" 
                        placeholder="Nome completo"
                        className={inputClass}
                        value={formData.gestor_nome}
                        onChange={e => setFormData({...formData, gestor_nome: e.target.value})}
                      />
                  </div>
                  <div className="space-y-1">
                      <label className={labelClass}><Mail size={14} /> E-mail do Gestor</label>
                      <input 
                        type="email" 
                        placeholder="gestor@tjpa.jus.br"
                        className={inputClass}
                        value={formData.gestor_email}
                        onChange={e => setFormData({...formData, gestor_email: e.target.value})}
                      />
                  </div>
              </div>
           </div>

           {/* SEÇÃO 4: DADOS BANCÁRIOS */}
           <div className="pt-4 border-t border-gray-200 space-y-4">
             <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
               <CreditCard size={14} /> Dados Bancários
             </p>
             <div className="grid grid-cols-3 gap-3">
                 <input 
                   type="text" 
                   placeholder="Banco"
                   className={inputClass}
                   value={formData.banco}
                   onChange={e => setFormData({...formData, banco: e.target.value})}
                 />
                 <input 
                   type="text" 
                   placeholder="Agência"
                   className={inputClass}
                   value={formData.agencia}
                   onChange={e => setFormData({...formData, agencia: e.target.value})}
                 />
                 <input 
                   type="text" 
                   placeholder="Conta"
                   className={inputClass}
                   value={formData.conta_corrente}
                   onChange={e => setFormData({...formData, conta_corrente: e.target.value})}
                 />
             </div>
           </div>

           {/* Actions */}
           <div className="pt-4 flex gap-3">
              <button 
                type="button" 
                onClick={onClose}
                disabled={saving}
                className="flex-1 py-3 text-sm font-bold text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                disabled={saving}
                className="flex-1 py-3 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
              >
                {saving ? (
                  <><Loader2 size={18} className="animate-spin" /> Salvando...</>
                ) : (
                  <><Save size={18} /> Salvar Alterações</>
                )}
              </button>
           </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
