import React from 'react';
import { Check } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  totalSteps,
  stepLabels
}) => {
  return (
    <div className="w-full py-6 px-4">
      <div className="flex items-center justify-between relative">
        {/* Progress Line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 -z-10" />
        <div 
          className="absolute top-5 left-0 h-0.5 bg-blue-600 transition-all duration-500 -z-10"
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        />
        
        {stepLabels.map((label, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isPending = stepNumber > currentStep;
          
          return (
            <div key={stepNumber} className="flex flex-col items-center">
              {/* Step Circle */}
              <div 
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                  transition-all duration-300 border-2
                  ${isCompleted 
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : isCurrent 
                      ? 'bg-white border-blue-600 text-blue-600 shadow-lg ring-4 ring-blue-100' 
                      : 'bg-white border-gray-300 text-gray-400'
                  }
                `}
              >
                {isCompleted ? <Check size={18} /> : stepNumber}
              </div>
              
              {/* Step Label */}
              <span 
                className={`
                  mt-2 text-xs font-medium text-center max-w-[80px]
                  ${isCurrent ? 'text-blue-600 font-bold' : isPending ? 'text-gray-400' : 'text-gray-600'}
                `}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StepIndicator;
