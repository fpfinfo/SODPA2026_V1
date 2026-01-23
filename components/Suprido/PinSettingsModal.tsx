import React, { useState } from 'react';
import { X, Lock, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../ui/ToastProvider';

interface PinSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPin?: string; // If set, user must enter old pin (unless we trust session)
  userId: string;
  onSuccess: (newPin: string) => void;
}

export const PinSettingsModal: React.FC<PinSettingsModalProps> = ({
  isOpen,
  onClose,
  currentPin,
  userId,
  onSuccess
}) => {
  const { showToast } = useToast();
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    // Validations
    if (newPin.length < 4 || newPin.length > 6) {
      showToast({ type: 'error', title: 'PIN Inválido', message: 'O PIN deve ter entre 4 e 6 dígitos.' });
      return;
    }
    if (!/^\d+$/.test(newPin)) {
      showToast({ type: 'error', title: 'PIN Inválido', message: 'O PIN deve conter apenas números.' });
      return;
    }
    if (newPin !== confirmPin) {
      showToast({ type: 'error', title: 'Erro', message: 'Os PINs não conferem.' });
      return;
    }

    // Verify old PIN if strictly required (optional for MVP if authorized by session)
    // For better UX, if currentPin exists, we should ask for it.
    if (currentPin && oldPin !== currentPin) {
       showToast({ type: 'error', title: 'Erro', message: 'PIN atual incorreto.' });
       return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ signature_pin: newPin })
        .eq('id', userId);

      if (error) throw error;

      showToast({ type: 'success', title: 'Sucesso', message: 'PIN de assinatura atualizado!' });
      onSuccess(newPin);
      onClose();
    } catch (error: any) {
      console.error('Error saving PIN:', error);
      showToast({ type: 'error', title: 'Erro', message: 'Falha ao salvar PIN.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
               <Lock size={24} />
             </div>
             <div>
               <h3 className="text-lg font-black text-slate-800">PIN de Assinatura</h3>
               <p className="text-xs text-slate-500 font-medium">Segurança para seus documentos</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          {currentPin && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">PIN Atual</label>
              <input 
                type="password" 
                maxLength={6}
                value={oldPin}
                onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-2xl tracking-[0.5em] font-black focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="••••"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Novo PIN (4-6 dígitos)</label>
            <input 
              type="password"
              maxLength={6}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-2xl tracking-[0.5em] font-black focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="••••"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Confirmar Novo PIN</label>
            <input 
              type="password"
              maxLength={6}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-center text-2xl tracking-[0.5em] font-black focus:outline-none focus:ring-2 transition-all ${
                confirmPin && confirmPin !== newPin ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500'
              }`}
              placeholder="••••"
            />
            {confirmPin && confirmPin !== newPin && (
              <p className="text-xs text-red-500 font-bold text-center">Os PINs não conferem</p>
            )}
          </div>

          <div className="bg-blue-50 p-4 rounded-xl text-blue-700 text-xs leading-relaxed">
             <InfoIcon />
             Este PIN será solicitado sempre que você assinar eletronicamente um documento ou solicitação. Guarde-o em segurança.
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-3 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving || !newPin || newPin !== confirmPin || (!!currentPin && !oldPin)}
            className="px-8 py-3 bg-blue-600 text-white text-sm font-black rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Salvar PIN
          </button>
        </div>
      </div>
    </div>
  );
};

const InfoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block mr-2 mb-0.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
);
