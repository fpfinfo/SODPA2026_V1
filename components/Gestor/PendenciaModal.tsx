import React, { useState } from 'react';
import { X, MessageSquare, BookOpen, AlertCircle } from 'lucide-react';
import { GLOSA_SUGGESTIONS } from '../../lib/glosaSuggestions';

interface PendenciaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (motivo: string) => Promise<void>;
  title?: string;
}

export const PendenciaModal: React.FC<PendenciaModalProps> = ({ 
  isOpen, onClose, onConfirm, title = "Solicitar Correção ao Suprido" 
}) => {
  const [motivo, setMotivo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!motivo.trim()) return;
    setIsSubmitting(true);
    try {
      await onConfirm(motivo);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                <AlertCircle size={24} />
             </div>
             <div>
                <h3 className="text-lg font-black text-slate-800">{title}</h3>
                <p className="text-sm text-slate-500">O processo retornará ao suprido para ajustes.</p>
             </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
           {/* Assistente de Glosa */}
           <div className="mb-4">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
                 <BookOpen size={14} className="text-blue-500" />
                 Assistente Legal (Sugestões Rápidas)
              </label>
              <div className="flex flex-wrap gap-2">
                 {GLOSA_SUGGESTIONS.map(sug => (
                    <button
                       key={sug.id}
                       onClick={() => setMotivo(prev => (prev ? prev + '\n\n' : '') + sug.text)}
                       className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors text-left"
                    >
                       {sug.label}
                    </button>
                 ))}
              </div>
           </div>

           <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Descreva o motivo da devolução</label>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="w-full h-40 p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none text-slate-700 leading-relaxed"
                placeholder="Explicite o que precisa ser corrigido..."
              />
              <p className="text-xs text-slate-400 text-right">
                 {motivo.length} caracteres
              </p>
           </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
           <button 
             onClick={onClose}
             className="px-6 py-3 font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
           >
             Cancelar
           </button>
           <button 
             onClick={handleSubmit}
             disabled={!motivo.trim() || isSubmitting}
             className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-lg shadow-amber-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
           >
             {isSubmitting ? <MessageSquare className="animate-spin" /> : <MessageSquare />}
             Confirmar Devolução
           </button>
        </div>
      </div>
    </div>
  );
};
