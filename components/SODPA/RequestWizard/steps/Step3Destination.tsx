import React from 'react';
import { ArrowLeft, ArrowRight, MapPin, Calendar, FileText, Globe, Map } from 'lucide-react';
import { DestinationData, DestinationType, DESTINATION_TYPE_LABELS } from '../types';

interface Step3Props {
  value: DestinationData;
  onChange: (data: DestinationData) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step3Destination: React.FC<Step3Props> = ({ value, onChange, onNext, onBack }) => {
  const handleChange = (field: keyof DestinationData, fieldValue: string) => {
    onChange({ ...value, [field]: fieldValue });
  };

  // Calculate number of days
  const calculateDays = () => {
    if (value.dataInicio && value.dataFim) {
      const start = new Date(value.dataInicio);
      const end = new Date(value.dataFim);
      const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return diff > 0 ? diff : 0;
    }
    return 0;
  };

  const days = calculateDays();

  const destinationTypes: { type: DestinationType; icon: React.ReactNode; color: string }[] = [
    { type: 'ESTADO', icon: <Map size={24} />, color: 'green' },
    { type: 'PAIS', icon: <MapPin size={24} />, color: 'blue' },
    { type: 'INTERNACIONAL', icon: <Globe size={24} />, color: 'purple' }
  ];

  const inputClass = "w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-medium text-gray-800";
  const labelClass = "text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5 mb-1.5";

  const isValid = value.tipoDestino && value.origem && value.destino && value.dataInicio && value.dataFim && value.motivo;

  return (
    <div className="py-6 max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Destino da Viagem</h2>
        <p className="text-gray-500">Informe os detalhes do seu deslocamento</p>
      </div>

      {/* Tipo de Destino */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-6">
          <MapPin className="text-blue-600" size={20} />
          Tipo de Destino
        </h3>
        
        <div className="grid grid-cols-3 gap-4">
          {destinationTypes.map(({ type, icon, color }) => {
            const isSelected = value.tipoDestino === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => handleChange('tipoDestino', type)}
                className={`
                  p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2
                  ${isSelected 
                    ? `border-${color}-500 bg-${color}-50 text-${color}-700` 
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }
                `}
              >
                {icon}
                <span className="text-sm font-medium text-center">{DESTINATION_TYPE_LABELS[type]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Origem e Destino */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-6">
          <Map className="text-green-600" size={20} />
          Trajeto
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}><MapPin size={14} /> Origem</label>
            <input 
              type="text" 
              placeholder="Ex: Belém - PA"
              className={inputClass}
              value={value.origem}
              onChange={e => handleChange('origem', e.target.value)}
            />
          </div>
          
          <div>
            <label className={labelClass}><MapPin size={14} /> Destino</label>
            <input 
              type="text" 
              placeholder="Ex: São Paulo - SP"
              className={inputClass}
              value={value.destino}
              onChange={e => handleChange('destino', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Datas */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-6">
          <Calendar className="text-amber-600" size={20} />
          Período
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className={labelClass}><Calendar size={14} /> Data de Início</label>
            <input 
              type="date" 
              className={inputClass}
              value={value.dataInicio}
              onChange={e => handleChange('dataInicio', e.target.value)}
            />
          </div>
          
          <div>
            <label className={labelClass}><Calendar size={14} /> Data de Término</label>
            <input 
              type="date" 
              className={inputClass}
              value={value.dataFim}
              onChange={e => handleChange('dataFim', e.target.value)}
            />
          </div>
          
          <div className="flex items-end">
            <div className={`
              w-full px-4 py-3 rounded-xl font-bold text-center
              ${days > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'}
            `}>
              {days > 0 ? `${days} dia${days > 1 ? 's' : ''}` : 'Selecione as datas'}
            </div>
          </div>
        </div>
      </div>

      {/* Motivo */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-6">
          <FileText className="text-purple-600" size={20} />
          Objetivo da Viagem
        </h3>
        
        <textarea 
          rows={4}
          placeholder="Descreva o motivo e objetivo da viagem..."
          className={`${inputClass} resize-none`}
          value={value.motivo}
          onChange={e => handleChange('motivo', e.target.value)}
        />
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 rounded-xl font-bold flex items-center gap-2 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
        >
          <ArrowLeft size={20} /> Voltar
        </button>
        
        <button
          type="button"
          onClick={onNext}
          disabled={!isValid}
          className={`
            px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg
            ${isValid 
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
            }
          `}
        >
          Próximo <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default Step3Destination;
