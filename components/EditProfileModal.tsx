import React, { useState, useEffect } from 'react';
import { X, Camera, Save, User, Briefcase, Hash, Loader2, Phone, Building, CreditCard } from 'lucide-react';
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
    nome: '',
    matricula: '',
    cargo: '',
    telefone: '',
    banco: '',
    agencia: '',
    conta_corrente: '',
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
        matricula: userProfile.matricula || '',
        cargo: userProfile.cargo || '',
        telefone: userProfile.telefone || '',
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
      // Show local preview immediately while uploading
      const localPreview = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, avatar_url: localPreview }));
      
      // Upload using the centralized hook
      const publicUrl = await uploadAvatar(file, userProfile.id);
      
      // If upload failed, keep the local preview so user can try to save anyway
      if (publicUrl) {
        setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Validate avatar URL - only save if it's a valid HTTPS URL (not blob)
      const isValidAvatarUrl = formData.avatar_url && 
        (formData.avatar_url.startsWith('https://') || formData.avatar_url.startsWith('http://')) &&
        !formData.avatar_url.startsWith('blob:');
      
      // Update profiles table (only columns that exist in profiles)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          nome: formData.nome,
          cargo: formData.cargo,
          telefone: formData.telefone,
          // Only update avatar_url if it's a valid URL
          ...(isValidAvatarUrl && { avatar_url: formData.avatar_url }),
          updated_at: new Date().toISOString()
        })
        .eq('id', userProfile?.id);

      if (profileError) throw profileError;

      // Also update servidores_tj if exists (includes banking data)
      if (userProfile?.email) {
        await supabase
          .from('servidores_tj')
          .update({
            nome: formData.nome,
            cargo: formData.cargo,
            telefone: formData.telefone,
            avatar_url: formData.avatar_url,
            banco: formData.banco,
            agencia: formData.agencia,
            conta_corrente: formData.conta_corrente
          })
          .ilike('email', userProfile.email);
      }

      showToast({ type: 'success', title: 'Perfil atualizado!', message: 'Suas informações foram salvas.' });
      onProfileUpdate();
      onClose();
    } catch (error) {
      console.error('Error saving profile:', error);
      showToast({ type: 'error', title: 'Erro ao salvar', message: 'Tente novamente.' });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm animate-in fade-in p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
           
           {/* Avatar Section */}
           <div className="flex flex-col items-center justify-center gap-3">
              <div className="relative group cursor-pointer">
                  <div className="w-24 h-24 rounded-full border-4 border-slate-100 shadow-md overflow-hidden bg-blue-50">
                      <img 
                        src={formData.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.nome}`} 
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                      />
                  </div>
                  <label className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Camera className="text-white" size={28} />
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                  </label>
                  <div className="absolute bottom-0 right-0 bg-blue-600 p-1.5 rounded-full text-white border-2 border-white shadow-sm">
                     <Camera size={12} />
                  </div>
              </div>
              <p className="text-xs text-gray-500">Clique na foto para alterar</p>
           </div>

           {/* Form Fields */}
           <div className="space-y-4">
              <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                      <User size={14} /> Nome Completo
                  </label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none font-medium text-gray-800"
                    value={formData.nome}
                    onChange={e => setFormData({...formData, nome: e.target.value})}
                  />
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                          <Hash size={14} /> Matrícula
                      </label>
                      <input 
                        type="text" 
                        disabled
                        className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-lg font-medium text-gray-500 cursor-not-allowed"
                        value={formData.matricula}
                      />
                  </div>
                  <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                          <Briefcase size={14} /> Cargo / Função
                      </label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none font-medium text-gray-800"
                        value={formData.cargo}
                        onChange={e => setFormData({...formData, cargo: e.target.value})}
                      />
                  </div>
              </div>

              <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                      <Phone size={14} /> Telefone
                  </label>
                  <input 
                    type="tel" 
                    placeholder="(91) 99999-9999"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none font-medium text-gray-800"
                    value={formData.telefone}
                    onChange={e => setFormData({...formData, telefone: e.target.value})}
                  />
              </div>

              {/* Banking Info */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <CreditCard size={14} /> Dados Bancários
                </p>
                <div className="grid grid-cols-3 gap-3">
                    <input 
                      type="text" 
                      placeholder="Banco"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm outline-none"
                      value={formData.banco}
                      onChange={e => setFormData({...formData, banco: e.target.value})}
                    />
                    <input 
                      type="text" 
                      placeholder="Agência"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm outline-none"
                      value={formData.agencia}
                      onChange={e => setFormData({...formData, agencia: e.target.value})}
                    />
                    <input 
                      type="text" 
                      placeholder="Conta"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm outline-none"
                      value={formData.conta_corrente}
                      onChange={e => setFormData({...formData, conta_corrente: e.target.value})}
                    />
                </div>
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
