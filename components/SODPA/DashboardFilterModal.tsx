import React, { useState } from 'react';
import { X, Filter, Calendar, CheckSquare } from 'lucide-react';

interface FilterState {
  status: string[]; // List of selected statuses
  dateRange: {
    start: string;
    end: string;
  };
  setor: string;
}

interface DashboardFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterState) => void;
  currentFilters: FilterState; // To populate initial state
}

const STATUS_OPTIONS = [
  { value: 'SOLICITADA', label: 'Solicitada' },
  { value: 'EM_ANALISE', label: 'Em Análise' },
  { value: 'APROVADA', label: 'Aprovada' },
  { value: 'EMITIDA', label: 'Emitida' },
  { value: 'CONCLUIDA', label: 'Concluída' },
  { value: 'REJEITADO', label: 'Rejeitada' },
  { value: 'DEVOLVIDA', label: 'Devolvida' },
  { value: 'PRESTACAO_CONTAS', label: 'Prestação de Contas' },
];

export function DashboardFilterModal({ 
  isOpen, 
  onClose, 
  onApplyFilters,
  currentFilters 
}: DashboardFilterModalProps) {
  
  const [localFilters, setLocalFilters] = useState<FilterState>(currentFilters);

  if (!isOpen) return null;

  const handleStatusToggle = (status: string) => {
    setLocalFilters(prev => {
      const exists = prev.status.includes(status);
      if (exists) {
        return { ...prev, status: prev.status.filter(s => s !== status) };
      } else {
        return { ...prev, status: [...prev.status, status] };
      }
    });
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleClear = () => {
    const emptyFilters: FilterState = {
      status: [],
      dateRange: { start: '', end: '' },
      setor: ''
    };
    setLocalFilters(emptyFilters);
    // Optional: Auto apply clear or wait for user to click Apply
    // onApplyFilters(emptyFilters); 
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-900">
                <Filter className="h-5 w-5 text-blue-600" />
                <h3 className="font-bold text-lg">Filtrar Resultados</h3>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={24} />
            </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
            
            {/* Status Section */}
            <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Status do Processo</h4>
                <div className="grid grid-cols-2 gap-2">
                    {STATUS_OPTIONS.map(option => {
                        const isSelected = localFilters.status.includes(option.value);
                        return (
                            <button
                                key={option.value}
                                onClick={() => handleStatusToggle(option.value)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-all ${
                                    isSelected 
                                    ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium' 
                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                                    isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                                }`}>
                                    {isSelected && <CheckSquare size={10} className="text-white" />}
                                </div>
                                {option.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Date Range Section */}
            <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Período (Criação)</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Data Inicial</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input 
                                type="date"
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={localFilters.dateRange.start}
                                onChange={e => setLocalFilters({...localFilters, dateRange: {...localFilters.dateRange, start: e.target.value}})}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Data Final</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                             <input 
                                type="date"
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={localFilters.dateRange.end}
                                onChange={e => setLocalFilters({...localFilters, dateRange: {...localFilters.dateRange, end: e.target.value}})}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Sector Section */}
            <div>
                 <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Setor / Unidade</h4>
                 <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    value={localFilters.setor}
                    onChange={e => setLocalFilters({...localFilters, setor: e.target.value})}
                 >
                     <option value="">Todos os Setores</option>
                     <option value="Gabinete da Presidência">Gabinete da Presidência</option>
                     <option value="Corregedoria">Corregedoria</option>
                     <option value="Escola Judicial">Escola Judicial</option>
                     <option value="Secretaria de Informática">Secretaria de Informática</option>
                     <option value="Secretaria Geral">Secretaria Geral</option>
                 </select>
            </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between">
            <button 
                onClick={handleClear}
                className="text-sm text-gray-500 hover:text-gray-700 font-medium px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
                Limpar Filtros
            </button>
            <div className="flex gap-3">
                 <button 
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-white transition-colors"
                >
                    Cancelar
                </button>
                <button 
                    onClick={handleApply}
                    className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-sm shadow-blue-600/20 transition-colors"
                >
                    Aplicar Filtros
                </button>
            </div>
        </div>

      </div>
    </div>
  );
}
