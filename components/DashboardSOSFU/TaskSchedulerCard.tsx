import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Flag, 
  MoreHorizontal, 
  Play, 
  Eye,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';

interface TaskSchedulerCardProps {
  process: {
    id: string;
    nup: string;
    tipo: string;
    valor_total?: number;
    suprido_nome?: string;
    status?: string;
    data_planejada?: string | null;
    prioridade_usuario?: number;
    notas_planejamento?: string;
  };
  onSchedule: (processId: string, date: string | null, priority?: number, notes?: string) => Promise<void>;
  onViewDetails: (processId: string) => void;
  onStart?: (processId: string) => void;
}

const PRIORITY_CONFIG = {
  1: { label: 'Alta', color: 'bg-red-500', textColor: 'text-red-600', bgLight: 'bg-red-50', icon: '🔴' },
  2: { label: 'Média', color: 'bg-amber-500', textColor: 'text-amber-600', bgLight: 'bg-amber-50', icon: '🟡' },
  3: { label: 'Baixa', color: 'bg-green-500', textColor: 'text-green-600', bgLight: 'bg-green-50', icon: '🟢' },
};

export const TaskSchedulerCard: React.FC<TaskSchedulerCardProps> = ({
  process,
  onSchedule,
  onViewDetails,
  onStart,
}) => {
  const [isScheduling, setIsScheduling] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(process.data_planejada || '');
  const [currentPriority, setCurrentPriority] = useState(process.prioridade_usuario || 2);

  const priorityConfig = PRIORITY_CONFIG[currentPriority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG[2];

  const handleDateChange = async (date: string) => {
    setIsScheduling(true);
    try {
      await onSchedule(process.id, date || null, currentPriority);
      setSelectedDate(date);
      setShowDatePicker(false);
    } finally {
      setIsScheduling(false);
    }
  };

  const handlePriorityChange = async (priority: number) => {
    setIsScheduling(true);
    try {
      await onSchedule(process.id, selectedDate || null, priority);
      setCurrentPriority(priority);
      setShowPriorityMenu(false);
    } finally {
      setIsScheduling(false);
    }
  };

  const formatCurrency = (value?: number) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Sem data';
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.getTime() === today.getTime()) return 'Hoje';
    if (date.getTime() === tomorrow.getTime()) return 'Amanhã';
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="group bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 overflow-hidden">
      <div className="p-4 flex items-center gap-4">
        {/* Priority Indicator */}
        <div className="relative">
          <button
            onClick={() => setShowPriorityMenu(!showPriorityMenu)}
            className={`w-10 h-10 rounded-xl ${priorityConfig.bgLight} flex items-center justify-center hover:scale-110 transition-transform`}
            title={`Prioridade: ${priorityConfig.label}`}
          >
            <span className="text-lg">{priorityConfig.icon}</span>
          </button>
          
          {/* Priority Dropdown */}
          {showPriorityMenu && (
            <div className="absolute top-12 left-0 z-50 bg-white rounded-xl shadow-2xl border border-slate-200 p-2 min-w-[140px] animate-in slide-in-from-top-2">
              {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => handlePriorityChange(parseInt(key))}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors ${
                    currentPriority === parseInt(key) ? 'bg-slate-100' : ''
                  }`}
                >
                  <span>{config.icon}</span>
                  <span className="text-sm font-medium">{config.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Process Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              {process.nup}
            </span>
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
              process.tipo === 'EXTRAORDINARIO' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
            }`}>
              {process.tipo === 'EXTRAORDINARIO' ? 'EXTRA' : 'ORD'}
            </span>
          </div>
          <p className="text-sm font-medium text-slate-700 truncate">
            {process.suprido_nome || 'Suprido'}
          </p>
          <p className="text-xs text-slate-400">
            {formatCurrency(process.valor_total)}
          </p>
        </div>

        {/* Date Scheduler */}
        <div className="relative">
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            disabled={isScheduling}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
              selectedDate 
                ? 'bg-blue-50 border-blue-200 text-blue-700' 
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
            }`}
          >
            {isScheduling ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Calendar size={14} />
            )}
            <span className="text-xs font-bold">{formatDate(selectedDate)}</span>
            <ChevronDown size={12} />
          </button>

          {/* Date Picker Dropdown */}
          {showDatePicker && (
            <div className="absolute top-12 right-0 z-50 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 min-w-[280px] animate-in slide-in-from-top-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Agendar para</p>
              
              {/* Quick Options */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => handleDateChange(new Date().toISOString().split('T')[0])}
                  className="flex-1 py-2 text-xs font-bold rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                >
                  Hoje
                </button>
                <button
                  onClick={() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    handleDateChange(tomorrow.toISOString().split('T')[0]);
                  }}
                  className="flex-1 py-2 text-xs font-bold rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Amanhã
                </button>
              </div>

              {/* Calendar Input */}
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Remove Date */}
              {selectedDate && (
                <button
                  onClick={() => handleDateChange('')}
                  className="w-full mt-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Remover data
                </button>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onViewDetails(process.id)}
            className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors"
            title="Ver detalhes"
          >
            <Eye size={16} />
          </button>
          {onStart && (
            <button
              onClick={() => onStart(process.id)}
              className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-colors"
              title="Iniciar análise"
            >
              <Play size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(showDatePicker || showPriorityMenu) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setShowDatePicker(false);
            setShowPriorityMenu(false);
          }}
        />
      )}
    </div>
  );
};
