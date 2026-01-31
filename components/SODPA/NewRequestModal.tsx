import React, { useState, useEffect } from 'react';
import { X, Save, FileText, Plane, Briefcase, MapPin, DollarSign } from 'lucide-react';

// Local types or import from ../../types if they exist globally
export type RequestType = 'DIARIA' | 'PASSAGEM';

export interface NewRequestData {
  requesterName: string;
  requesterSector: string;
  destination: string;
  date: string;
  category: 'ORDINÁRIO' | 'MAGISTRADO' | 'TÉCNICO' | 'EXTRAORDINÁRIO';
  description: string;
  value: number;
  type: RequestType;
  status: string;
  dateCreated: string;
  deadline: string;
}

interface NewRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NewRequestData) => void;
  type?: RequestType;
}

const NewRequestModal: React.FC<NewRequestModalProps> = ({ isOpen, onClose, onSubmit, type }) => {
  const [selectedType, setSelectedType] = useState<RequestType>(type || 'DIARIA');
  
  // Sync if prop changes
  useEffect(() => {
    if (type) setSelectedType(type);
  }, [type]);

  const [formData, setFormData] = useState({
    requesterName: '',
    requesterSector: '',
    destination: '',
    date: '',
    category: 'ORDINÁRIO' as NewRequestData['category'],
    description: '',
    value: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      value: Number(formData.value) || 0,
      type: selectedType,
      status: 'NOVO',
      dateCreated: new Date().toISOString(),
      deadline: formData.date
    });
    onClose();
    // Reset form
    setFormData({
        requesterName: '',
        requesterSector: '',
        destination: '',
        date: '',
        category: 'ORDINÁRIO',
        description: '',
        value: ''
    });
  };

  const isTicket = selectedType === 'PASSAGEM';
  
  // Color configuration map to avoid dynamic class interpolation issues
  const colors = {
    DIARIA: {
      gradient: 'bg-gradient-to-r from-blue-600 to-blue-800',
      button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
      ring: 'focus:ring-blue-500',
      border: 'focus:border-blue-500',
      text: 'text-blue-700',
      bgLight: 'bg-blue-50',
      borderLight: 'border-blue-500',
      ringLight: 'ring-blue-500'
    },
    PASSAGEM: {
      gradient: 'bg-gradient-to-r from-purple-600 to-purple-800',
      button: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500',
      ring: 'focus:ring-purple-500',
      border: 'focus:border-purple-500',
      text: 'text-purple-700',
      bgLight: 'bg-purple-50',
      borderLight: 'border-purple-500',
      ringLight: 'ring-purple-500'
    }
  };

  const currentColors = colors[selectedType];

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900 bg-opacity-50 backdrop-blur-sm animate-fade-in p-4"
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all scale-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className={`${currentColors.gradient} px-6 py-4 flex justify-between items-center flex-shrink-0 transition-colors duration-300`}>
          <div className="flex items-center gap-3 text-white">
            {isTicket ? <Plane size={24} /> : <FileText size={24} />}
            <h3 className="text-lg font-bold">Nova Solicitação {type ? '' : '(Unificada)'}</h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="overflow-y-auto p-6">
            <form id="newRequestForm" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Type Selector if no fixed type provided */}
            {!type && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <label className="block text-sm font-bold text-gray-700 mb-3">Selecione o Tipo de Processo</label>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => setSelectedType('DIARIA')}
                            className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                                selectedType === 'DIARIA' 
                                ? `${colors.DIARIA.bgLight} ${colors.DIARIA.borderLight} ${colors.DIARIA.text} ring-1 ${colors.DIARIA.ringLight}` 
                                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            <Briefcase size={20} />
                            <span className="font-bold">Diária</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedType('PASSAGEM')}
                            className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                                selectedType === 'PASSAGEM' 
                                ? `${colors.PASSAGEM.bgLight} ${colors.PASSAGEM.borderLight} ${colors.PASSAGEM.text} ring-1 ${colors.PASSAGEM.ringLight}` 
                                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            <Plane size={20} />
                            <span className="font-bold">Passagem</span>
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Nome do Interessado <span className="text-red-500">*</span></label>
                <input 
                    required
                    type="text" 
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg outline-none transition-all focus:ring-2 focus:ring-opacity-50 ${currentColors.ring} ${currentColors.border}`}
                    placeholder="Ex: João da Silva"
                    value={formData.requesterName}
                    onChange={e => setFormData({...formData, requesterName: e.target.value})}
                />
                </div>
                
                <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Setor / Unidade <span className="text-red-500">*</span></label>
                <input 
                    required
                    type="text" 
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg outline-none transition-all focus:ring-2 focus:ring-opacity-50 ${currentColors.ring} ${currentColors.border}`}
                    placeholder="Ex: Secretaria Geral"
                    value={formData.requesterSector}
                    onChange={e => setFormData({...formData, requesterSector: e.target.value})}
                />
                </div>

                <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Categoria</label>
                <select 
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg outline-none transition-all bg-white focus:ring-2 focus:ring-opacity-50 ${currentColors.ring} ${currentColors.border}`}
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value as any})}
                >
                    <option value="ORDINÁRIO">Ordinário</option>
                    <option value="MAGISTRADO">Magistrado</option>
                    <option value="TÉCNICO">Técnico/Analista</option>
                    <option value="EXTRAORDINÁRIO">Extraordinário</option>
                </select>
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700">Destino <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <MapPin size={18} />
                        </div>
                        <input 
                            required
                            type="text" 
                            className={`w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg outline-none transition-all focus:ring-2 focus:ring-opacity-50 ${currentColors.ring} ${currentColors.border}`}
                            placeholder="Ex: Brasília - DF"
                            value={formData.destination}
                            onChange={e => setFormData({...formData, destination: e.target.value})}
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700">Data da Viagem / Prazo <span className="text-red-500">*</span></label>
                    <input 
                        required
                        type="date" 
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg outline-none transition-all focus:ring-2 focus:ring-opacity-50 ${currentColors.ring} ${currentColors.border}`}
                        value={formData.date}
                        onChange={e => setFormData({...formData, date: e.target.value})}
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700">Valor Estimado (R$)</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <DollarSign size={18} />
                        </div>
                        <input 
                            type="number" 
                            className={`w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg outline-none transition-all focus:ring-2 focus:ring-opacity-50 ${currentColors.ring} ${currentColors.border}`}
                            placeholder="0,00"
                            value={formData.value}
                            onChange={e => setFormData({...formData, value: e.target.value})}
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Motivo / Descrição <span className="text-red-500">*</span></label>
                <textarea 
                required
                rows={3}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg outline-none transition-all resize-none focus:ring-2 focus:ring-opacity-50 ${currentColors.ring} ${currentColors.border}`}
                placeholder="Descreva o motivo da solicitação..."
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                />
            </div>
            </form>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50 flex-shrink-0">
            <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-colors"
            >
            Cancelar
            </button>
            <button 
            type="submit"
            form="newRequestForm"
            className={`px-4 py-2 text-sm font-bold text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all shadow-md flex items-center gap-2 ${currentColors.button}`}
            >
            <Save size={18} />
            Salvar Solicitação
            </button>
        </div>
      </div>
    </div>
  );
};

export default NewRequestModal;
