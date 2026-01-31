import React, { useState, useEffect } from 'react';
import { X, Save, DollarSign, Calendar, FileText, Briefcase, Map } from 'lucide-react';
import { AllowanceRate, AllowanceUserType, TravelScope } from '../types';

interface AllowanceRateModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: AllowanceRate | null;
  onSave: (rate: AllowanceRate) => void;
}

const USER_TYPE_OPTIONS: { value: AllowanceUserType; label: string }[] = [
    { value: 'desembargador_corregedor_juiz_auxiliar', label: 'Desembargador / Corregedor' },
    { value: 'juiz_direito', label: 'Juiz de Direito' },
    { value: 'cargos_comissionados_cjs', label: 'Cargo Comissionado (CJS)' },
    { value: 'cargos_comissionados_cji', label: 'Cargo Comissionado (CJI)' },
    { value: 'analista_judiciario', label: 'Analista Judiciário' },
    { value: 'oficial_justica_avaliador', label: 'Oficial de Justiça Avaliador' },
    { value: 'cargos_nivel_medio', label: 'Nível Médio' },
    { value: 'cargos_nivel_fundamental', label: 'Nível Fundamental' }
];

const TRAVEL_TYPE_OPTIONS: { value: TravelScope; label: string }[] = [
    { value: 'NO_ESTADO', label: 'No Estado' },
    { value: 'NO_PAIS', label: 'No País (Fora do Estado)' },
    { value: 'INTERNACIONAL', label: 'Internacional' }
];

const AllowanceRateModal: React.FC<AllowanceRateModalProps> = ({ isOpen, onClose, initialData, onSave }) => {
  const [formData, setFormData] = useState<Partial<AllowanceRate>>({
    userType: 'analista_judiciario',
    travelType: 'NO_ESTADO',
    value: 0,
    validFrom: new Date().toISOString().split('T')[0],
    validTo: '',
    active: true,
    notes: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
          ...initialData,
          // Ensure validTo is empty string if null for input
          validTo: initialData.validTo || '' 
      });
    } else {
        // Reset for new entry
        setFormData({
            userType: 'analista_judiciario',
            travelType: 'NO_ESTADO',
            value: 0,
            validFrom: new Date().toISOString().split('T')[0],
            validTo: '',
            active: true,
            notes: ''
        });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create the object to save
    const rateToSave: AllowanceRate = {
        id: initialData?.id || `rate_${Date.now()}`, // Keep ID if editing, generate if new
        userType: formData.userType as AllowanceUserType,
        travelType: formData.travelType as TravelScope,
        value: Number(formData.value),
        validFrom: formData.validFrom || new Date().toISOString(),
        validTo: formData.validTo || null, // Convert empty string back to null
        active: formData.active || false,
        notes: formData.notes
    };

    onSave(rateToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900 bg-opacity-60 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        
        <div className="bg-blue-600 px-6 py-4 flex justify-between items-center text-white">
          <h3 className="text-lg font-bold flex items-center gap-2">
             <DollarSign size={20} className="text-blue-200" />
             {initialData ? 'Editar Valor de Diária' : 'Novo Valor de Diária'}
          </h3>
          <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full transition-colors"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
           
           {/* User Type */}
           <div className="space-y-1">
               <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                   <Briefcase size={14} /> Cargo / Função
               </label>
               <select
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                   value={formData.userType}
                   onChange={e => setFormData({...formData, userType: e.target.value as AllowanceUserType})}
               >
                   {USER_TYPE_OPTIONS.map(opt => (
                       <option key={opt.value} value={opt.value}>{opt.label}</option>
                   ))}
               </select>
           </div>

           {/* Travel Type & Value Row */}
           <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                   <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                       <Map size={14} /> Tipo de Viagem
                   </label>
                   <select
                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                       value={formData.travelType}
                       onChange={e => setFormData({...formData, travelType: e.target.value as TravelScope})}
                   >
                       {TRAVEL_TYPE_OPTIONS.map(opt => (
                           <option key={opt.value} value={opt.value}>{opt.label}</option>
                       ))}
                   </select>
               </div>
               <div className="space-y-1">
                   <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                       <DollarSign size={14} /> Valor (R$)
                   </label>
                   <input 
                       type="number" 
                       step="0.01"
                       min="0"
                       required
                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                       value={formData.value}
                       onChange={e => setFormData({...formData, value: parseFloat(e.target.value)})}
                   />
               </div>
           </div>

           {/* Dates Row */}
           <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                   <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                       <Calendar size={14} /> Vigência Início
                   </label>
                   <input 
                       type="date" 
                       required
                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                       value={formData.validFrom}
                       onChange={e => setFormData({...formData, validFrom: e.target.value})}
                   />
               </div>
               <div className="space-y-1">
                   <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                       <Calendar size={14} /> Vigência Fim (Opcional)
                   </label>
                   <input 
                       type="date" 
                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                       value={formData.validTo || ''}
                       onChange={e => setFormData({...formData, validTo: e.target.value})}
                   />
               </div>
           </div>

           {/* Notes */}
           <div className="space-y-1">
               <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                   <FileText size={14} /> Observações
               </label>
               <textarea 
                   rows={3}
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                   value={formData.notes || ''}
                   onChange={e => setFormData({...formData, notes: e.target.value})}
               />
           </div>

           {/* Active Toggle */}
           <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
               <input 
                   type="checkbox" 
                   id="activeToggle"
                   checked={formData.active}
                   onChange={e => setFormData({...formData, active: e.target.checked})}
                   className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
               />
               <label htmlFor="activeToggle" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
                   Valor Ativo para novos cálculos
               </label>
           </div>

           <div className="pt-2 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={onClose}
                className="px-4 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="px-6 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-md flex items-center gap-2 transition-transform active:scale-95"
              >
                <Save size={18} />
                Salvar Valor
              </button>
           </div>
        </form>
      </div>
    </div>
  );
};

export default AllowanceRateModal;
