import React, { useState } from 'react';
import { 
  Gauge, 
  Settings, 
  AlertTriangle, 
  CheckCircle2,
  TrendingUp,
  Calendar,
  X
} from 'lucide-react';

interface WorkloadCapacityIndicatorProps {
  todayCount: number;
  capacity: number;
  onCapacityChange?: (newCapacity: number) => Promise<void>;
  totalAssigned: number;
  unscheduledCount: number;
}

export const WorkloadCapacityIndicator: React.FC<WorkloadCapacityIndicatorProps> = ({
  todayCount,
  capacity,
  onCapacityChange,
  totalAssigned,
  unscheduledCount,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [tempCapacity, setTempCapacity] = useState(capacity);
  const [isSaving, setIsSaving] = useState(false);

  const percentage = Math.min((todayCount / capacity) * 100, 100);
  const isOverCapacity = todayCount > capacity;
  const isNearCapacity = percentage >= 80 && !isOverCapacity;

  const getStatusColor = () => {
    if (isOverCapacity) return 'text-red-600';
    if (isNearCapacity) return 'text-amber-600';
    return 'text-emerald-600';
  };

  const getProgressColor = () => {
    if (isOverCapacity) return 'bg-red-500';
    if (isNearCapacity) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const handleSaveCapacity = async () => {
    if (!onCapacityChange) return;
    setIsSaving(true);
    try {
      await onCapacityChange(tempCapacity);
      setShowSettings(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${isOverCapacity ? 'bg-red-50' : isNearCapacity ? 'bg-amber-50' : 'bg-emerald-50'}`}>
            <Gauge className={getStatusColor()} size={24} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Capacidade do Dia</h3>
            <p className="text-xs text-slate-400">Processos agendados para hoje</p>
          </div>
        </div>
        
        {onCapacityChange && (
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            title="Configurar capacidade"
          >
            <Settings size={18} />
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-3">
        <div className="flex items-end justify-between">
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-black ${getStatusColor()}`}>{todayCount}</span>
            <span className="text-xl font-bold text-slate-300">/</span>
            <span className="text-xl font-bold text-slate-400">{capacity}</span>
          </div>
          <div className="text-right">
            {isOverCapacity ? (
              <div className="flex items-center gap-1 text-red-600">
                <AlertTriangle size={14} />
                <span className="text-xs font-bold">Acima da capacidade</span>
              </div>
            ) : isNearCapacity ? (
              <div className="flex items-center gap-1 text-amber-600">
                <TrendingUp size={14} />
                <span className="text-xs font-bold">Quase cheio</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 size={14} />
                <span className="text-xs font-bold">Disponível</span>
              </div>
            )}
          </div>
        </div>

        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={`h-full ${getProgressColor()} transition-all duration-500 rounded-full`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-6 pt-2">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-blue-500" />
            <span className="text-xs text-slate-500">
              <span className="font-bold text-slate-700">{totalAssigned}</span> atribuídos
            </span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-amber-500" />
            <span className="text-xs text-slate-500">
              <span className="font-bold text-slate-700">{unscheduledCount}</span> sem data
            </span>
          </div>
        </div>
      </div>

      {/* Capacity Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-lg font-black text-slate-800">Capacidade Diária</h4>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-slate-500">
                Defina quantos processos você consegue atender por dia em média.
              </p>

              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={tempCapacity}
                  onChange={(e) => setTempCapacity(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <span className="text-2xl font-black text-slate-800 w-12 text-center">{tempCapacity}</span>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 py-3 text-sm font-bold rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveCapacity}
                  disabled={isSaving}
                  className="flex-1 py-3 text-sm font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
