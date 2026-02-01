import React from 'react';
import { Briefcase, Plane, ArrowRight } from 'lucide-react';
import { RequestType } from '../types';

interface Step1Props {
  value: RequestType | '';
  onChange: (type: RequestType) => void;
  onNext: () => void;
}

export const Step1TypeSelection: React.FC<Step1Props> = ({ value, onChange, onNext }) => {
  const options = [
    {
      type: 'DIARIA' as RequestType,
      icon: Briefcase,
      title: 'Diárias',
      description: 'Solicitação de diárias para missões oficiais',
      color: 'blue',
      gradient: 'from-blue-500 to-blue-700'
    },
    {
      type: 'PASSAGEM' as RequestType,
      icon: Plane,
      title: 'Passagens Aéreas',
      description: 'Solicitação de passagens para deslocamento aéreo',
      color: 'purple',
      gradient: 'from-purple-500 to-purple-700'
    }
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] py-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Tipo de Solicitação</h2>
      <p className="text-gray-500 mb-8">Selecione o tipo de solicitação que deseja realizar</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl w-full">
        {options.map((option) => {
          const Icon = option.icon;
          const isSelected = value === option.type;
          
          return (
            <button
              key={option.type}
              type="button"
              onClick={() => onChange(option.type)}
              className={`
                relative p-6 rounded-2xl border-2 transition-all duration-300
                flex flex-col items-center text-center group
                ${isSelected 
                  ? `border-${option.color}-500 bg-${option.color}-50 shadow-lg ring-4 ring-${option.color}-100` 
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                }
              `}
            >
              {/* Selected indicator */}
              {isSelected && (
                <div className={`absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r ${option.gradient} rounded-full flex items-center justify-center shadow-md`}>
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              
              {/* Icon */}
              <div className={`
                w-16 h-16 rounded-2xl flex items-center justify-center mb-4
                transition-all duration-300
                ${isSelected 
                  ? `bg-gradient-to-r ${option.gradient} text-white shadow-lg` 
                  : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                }
              `}>
                <Icon size={32} />
              </div>
              
              {/* Title */}
              <h3 className={`text-lg font-bold mb-1 ${isSelected ? `text-${option.color}-700` : 'text-gray-700'}`}>
                {option.title}
              </h3>
              
              {/* Description */}
              <p className={`text-sm ${isSelected ? `text-${option.color}-600` : 'text-gray-500'}`}>
                {option.description}
              </p>
            </button>
          );
        })}
      </div>
      
      {/* Next Button */}
      <button
        type="button"
        onClick={onNext}
        disabled={!value}
        className={`
          mt-8 px-8 py-3 rounded-xl font-bold flex items-center gap-2
          transition-all duration-300 shadow-lg
          ${value 
            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200' 
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }
        `}
      >
        Próximo <ArrowRight size={20} />
      </button>
    </div>
  );
};

export default Step1TypeSelection;
