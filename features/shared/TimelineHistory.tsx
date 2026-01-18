import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  PenTool, 
  RotateCcw, 
  Clock,
  Send,
  FileCheck,
  Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface TramitationEvent {
  id: string;
  origem: string;
  destino: string;
  status_anterior: string;
  status_novo: string;
  observacao?: string;
  tramitado_por?: string;
  data_tramitacao: string;
}

interface TimelineHistoryProps {
  events?: TramitationEvent[];
  processId?: string;
  compactMode?: boolean;
}

// Visual styles per action type
const getEventStyle = (statusNovo: string) => {
  if (statusNovo.includes('DEVOLVIDO')) {
    return { 
      bg: 'bg-red-50', 
      border: 'border-red-400', 
      dot: 'bg-red-500', 
      iconColor: 'text-red-600',
      Icon: RotateCcw,
      label: 'Devolvido'
    };
  }
  if (statusNovo.includes('ASSINADO') || statusNovo.includes('APROVADO')) {
    return { 
      bg: 'bg-emerald-50', 
      border: 'border-emerald-400', 
      dot: 'bg-emerald-500', 
      iconColor: 'text-emerald-600',
      Icon: CheckCircle2,
      label: 'Aprovado'
    };
  }
  if (statusNovo.includes('PENDENTE ASSINATURA')) {
    return { 
      bg: 'bg-purple-50', 
      border: 'border-purple-400', 
      dot: 'bg-purple-500', 
      iconColor: 'text-purple-600',
      Icon: PenTool,
      label: 'Para Assinatura'
    };
  }
  // Default: regular tramitation
  return { 
    bg: 'bg-blue-50', 
    border: 'border-blue-200', 
    dot: 'bg-blue-500', 
    iconColor: 'text-blue-600',
    Icon: Send,
    label: 'Tramitado'
  };
};

const formatDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
};

export const TimelineHistory: React.FC<TimelineHistoryProps> = ({ events: propEvents, processId, compactMode = false }) => {
  const [fetchedEvents, setFetchedEvents] = useState<TramitationEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch history from database if processId is provided and events are not
  useEffect(() => {
    if (processId && !propEvents) {
      const fetchHistory = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const { data, error: fetchError } = await supabase
            .from('historico_tramitacao')
            .select('*')
            .eq('solicitacao_id', processId)
            .order('data_tramitacao', { ascending: false });

          if (fetchError) throw fetchError;
          setFetchedEvents(data || []);
        } catch (err) {
          console.error('Error fetching tramitacao history:', err);
          setError((err as Error).message);
          setFetchedEvents([]);
        } finally {
          setIsLoading(false);
        }
      };
      fetchHistory();
    }
  }, [processId, propEvents]);

  // Use provided events or fetched events
  const events = propEvents || fetchedEvents;

  if (isLoading) {
    return (
      <div className="text-center py-8 text-slate-400">
        <Loader2 size={32} className="mx-auto mb-2 animate-spin text-blue-500" />
        <p className="text-sm">Carregando histórico...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-400">
        <AlertTriangle size={32} className="mx-auto mb-2" />
        <p className="text-sm">Erro ao carregar histórico: {error}</p>
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <Clock size={32} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm">Nenhuma movimentação registrada.</p>
      </div>
    );
  }

  // Sort by date descending (most recent first)
  const sortedEvents = [...events].sort((a, b) => 
    new Date(b.data_tramitacao).getTime() - new Date(a.data_tramitacao).getTime()
  );

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 top-6 bottom-6 w-0.5 bg-slate-200" />

      <div className="space-y-4">
        {sortedEvents.map((event, idx) => {
          const style = getEventStyle(event.status_novo);
          const Icon = style.Icon;
          const isReturn = event.status_novo.includes('DEVOLVIDO');

          return (
            <div 
              key={event.id || idx} 
              className={`relative flex gap-4 animate-in slide-in-from-left-2 duration-300 ${isReturn ? 'pl-1' : ''}`}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              {/* Timeline dot */}
              <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${style.bg} border-2 ${style.border} shadow-sm`}>
                <Icon size={14} className={style.iconColor} />
              </div>

              {/* Event content */}
              <div className={`flex-1 ${style.bg} border ${style.border} rounded-2xl p-4 ${isReturn ? 'shadow-lg' : 'shadow-sm'}`}>
                {/* Header */}
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${style.iconColor}`}>
                      {style.label}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-bold text-slate-600">{event.origem}</span>
                      <ArrowRight size={12} className="text-slate-400" />
                      <span className="text-xs font-bold text-slate-800">{event.destino}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {formatDate(event.data_tramitacao)}
                  </span>
                </div>

                {/* Status change */}
                {!compactMode && (
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-2 mb-2">
                    <span className="px-1.5 py-0.5 bg-slate-100 rounded">{event.status_anterior}</span>
                    <ArrowRight size={10} className="text-slate-400" />
                    <span className={`px-1.5 py-0.5 rounded ${isReturn ? 'bg-red-100 text-red-700' : 'bg-slate-100'}`}>
                      {event.status_novo}
                    </span>
                  </div>
                )}

                {/* Observation - especially important for returns */}
                {event.observacao && (
                  <div className={`mt-3 p-3 rounded-xl text-xs ${isReturn ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-white text-slate-600 border border-slate-100'}`}>
                    <p className="font-bold text-[10px] uppercase tracking-widest mb-1 opacity-60">
                      {isReturn ? '⚠️ Motivo da Devolução' : 'Observação'}
                    </p>
                    <p className="font-medium">{event.observacao}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TimelineHistory;
