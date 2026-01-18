import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Flag, 
  MoreHorizontal, 
  Play, 
  Eye,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X
} from 'lucide-react';
import { createPortal } from 'react-dom';

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

const DAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS_PT = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

// Full Calendar Component
const FullCalendar: React.FC<{
  selectedDate: string;
  onSelect: (date: string) => void;
  onClose: () => void;
  onClear: () => void;
  anchorRect: DOMRect | null;
}> = ({ selectedDate, onSelect, onClose, onClear, anchorRect }) => {
  const [viewDate, setViewDate] = useState(() => {
    if (selectedDate) {
      const d = new Date(selectedDate + 'T00:00:00');
      return { month: d.getMonth(), year: d.getFullYear() };
    }
    const now = new Date();
    return { month: now.getMonth(), year: now.getFullYear() };
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewDate.year, viewDate.month, 1);
    const lastDay = new Date(viewDate.year, viewDate.month + 1, 0);
    const startPadding = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const days: { date: Date; dateStr: string; isCurrentMonth: boolean; isToday: boolean; isSelected: boolean; isPast: boolean }[] = [];

    // Previous month padding
    for (let i = startPadding - 1; i >= 0; i--) {
      const d = new Date(viewDate.year, viewDate.month, -i);
      days.push({
        date: d,
        dateStr: d.toISOString().split('T')[0],
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
        isPast: d < today,
      });
    }

    // Current month
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(viewDate.year, viewDate.month, i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({
        date: d,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
        isPast: d < today,
      });
    }

    // Next month padding
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(viewDate.year, viewDate.month + 1, i);
      days.push({
        date: d,
        dateStr: d.toISOString().split('T')[0],
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
        isPast: false,
      });
    }

    return days;
  }, [viewDate, selectedDate, todayStr]);

  const prevMonth = () => {
    setViewDate(prev => {
      if (prev.month === 0) return { month: 11, year: prev.year - 1 };
      return { ...prev, month: prev.month - 1 };
    });
  };

  const nextMonth = () => {
    setViewDate(prev => {
      if (prev.month === 11) return { month: 0, year: prev.year + 1 };
      return { ...prev, month: prev.month + 1 };
    });
  };

  // Calculate position
  const style: React.CSSProperties = {
    position: 'fixed',
    zIndex: 9999,
    top: anchorRect ? Math.min(anchorRect.bottom + 8, window.innerHeight - 420) : '50%',
    left: anchorRect ? Math.min(anchorRect.right - 320, window.innerWidth - 340) : '50%',
  };

  return createPortal(
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[9998] bg-black/20"
        onClick={onClose}
      />
      {/* Calendar */}
      <div 
        style={style}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 w-[320px]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-black text-slate-800">
            {MONTHS_PT[viewDate.month]} {viewDate.year}
          </span>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Quick Options */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => onSelect(todayStr)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
              selectedDate === todayStr 
                ? 'bg-blue-600 text-white' 
                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
            }`}
          >
            Hoje
          </button>
          <button
            onClick={() => onSelect(tomorrowStr)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
              selectedDate === tomorrowStr 
                ? 'bg-purple-600 text-white' 
                : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
            }`}
          >
            Amanhã
          </button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS_PT.map(day => (
            <div key={day} className="text-center text-[10px] font-bold text-slate-400 uppercase">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, idx) => (
            <button
              key={idx}
              onClick={() => !day.isPast && onSelect(day.dateStr)}
              disabled={day.isPast && !day.isSelected}
              className={`
                aspect-square rounded-lg text-xs font-medium flex items-center justify-center transition-all
                ${!day.isCurrentMonth ? 'text-slate-300' : ''}
                ${day.isPast && !day.isSelected ? 'text-slate-300 cursor-not-allowed' : ''}
                ${day.isToday && !day.isSelected ? 'bg-blue-100 text-blue-700 font-bold' : ''}
                ${day.isSelected ? 'bg-blue-600 text-white font-black shadow-lg scale-110' : ''}
                ${!day.isSelected && !day.isPast && day.isCurrentMonth ? 'hover:bg-slate-100' : ''}
              `}
            >
              {day.date.getDate()}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
          {selectedDate && (
            <button
              onClick={onClear}
              className="flex-1 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              Remover data
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </>,
    document.body
  );
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
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const dateButtonRef = useRef<HTMLButtonElement>(null);

  const priorityConfig = PRIORITY_CONFIG[currentPriority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG[2];

  const handleOpenCalendar = () => {
    if (dateButtonRef.current) {
      setAnchorRect(dateButtonRef.current.getBoundingClientRect());
    }
    setShowDatePicker(true);
  };

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

  const handleClearDate = async () => {
    setIsScheduling(true);
    try {
      await onSchedule(process.id, null, currentPriority);
      setSelectedDate('');
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
    <div className="group bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 relative">
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
            <>
              <div className="fixed inset-0 z-[100]" onClick={() => setShowPriorityMenu(false)} />
              <div className="absolute top-12 left-0 z-[101] bg-white rounded-xl shadow-2xl border border-slate-200 p-2 min-w-[140px]">
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
            </>
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

        {/* Date Scheduler Button */}
        <button
          ref={dateButtonRef}
          onClick={handleOpenCalendar}
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

        {/* Full Calendar Portal */}
        {showDatePicker && (
          <FullCalendar
            selectedDate={selectedDate}
            onSelect={handleDateChange}
            onClose={() => setShowDatePicker(false)}
            onClear={handleClearDate}
            anchorRect={anchorRect}
          />
        )}

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
    </div>
  );
};
