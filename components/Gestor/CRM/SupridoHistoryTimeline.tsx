
import React from 'react';
import { Clock, CheckCircle2, AlertTriangle, FileText, XCircle, ArrowRight } from 'lucide-react';

interface TimelineItemProps {
  process: any;
  isLast: boolean;
}

const TimelineItem: React.FC<TimelineItemProps> = ({ process, isLast }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'CONCEDIDO':
      case 'CONCLUIDO':
        return { color: 'bg-emerald-500', icon: CheckCircle2, text: 'text-emerald-700', bg: 'bg-emerald-50' };
      case 'DEVOLVIDO':
        return { color: 'bg-red-500', icon: XCircle, text: 'text-red-700', bg: 'bg-red-50' };
      case 'PRESTANDO CONTAS':
        return { color: 'bg-amber-500', icon: Clock, text: 'text-amber-700', bg: 'bg-amber-50' };
      case 'ARQUIVADO':
        return { color: 'bg-slate-500', icon: FileText, text: 'text-slate-700', bg: 'bg-slate-100' };
      default:
        return { color: 'bg-blue-500', icon: Clock, text: 'text-blue-700', bg: 'bg-blue-50' };
    }
  };

  const config = getStatusConfig(process.status);
  const Icon = config.icon;
  const date = new Date(process.created_at).toLocaleDateString('pt-BR');

  return (
    <div className="flex gap-4 group">
      {/* Time Column */}
      <div className="w-24 text-right pt-2 flex-shrink-0">
        <span className="text-xs font-bold text-slate-500">{date}</span>
      </div>

      {/* Line Column */}
      <div className="relative flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full ${config.color} border-2 border-white shadow-sm z-10 group-hover:scale-125 transition-transform`}></div>
        {!isLast && <div className="w-0.5 flex-1 bg-slate-200 my-1 group-hover:bg-slate-300 transition-colors"></div>}
      </div>

      {/* Content Column */}
      <div className="pb-8 flex-1">
        <div className={`p-4 rounded-2xl border border-slate-100 ${config.bg} relative group-hover:shadow-md transition-all`}>
           <div className="flex justify-between items-start mb-2">
               <div>
                  <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                      <Icon size={16} className={config.text} />
                      {process.type || 'SUPRIMENTO'}
                  </h4>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{process.nup || 'Sem NUP'}</p>
               </div>
               <span className={`px-2 py-0.5 text-[10px] font-black rounded uppercase ${config.text} bg-white/50`}>
                   {process.status}
               </span>
           </div>
           
           <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200/50">
               <p className="text-sm font-black text-slate-800">
                   {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(process.valor_total || 0)}
               </p>
               
               {process.deadline_pc && (
                   <div className="text-[10px] text-slate-500 flex items-center gap-1">
                       <Clock size={12}/> PC até: <strong>{new Date(process.deadline_pc).toLocaleDateString('pt-BR')}</strong>
                   </div>
               )}
           </div>
        </div>
      </div>
    </div>
  );
};

export const SupridoHistoryTimeline: React.FC<{ processes: any[] }> = ({ processes }) => {
  if (!processes || processes.length === 0) {
      return (
          <div className="mt-8 bg-slate-50 p-12 rounded-[32px] border border-slate-200 text-center border-dashed">
              <p className="text-slate-400 font-medium">Nenhum histórico encontrado para este servidor.</p>
          </div>
      );
  }

  return (
    <div className="mt-8 bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm animate-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between mb-8">
          <h4 className="text-lg font-black text-slate-800">Histórico de Concessões</h4>
          <span className="text-xs font-bold bg-slate-100 px-3 py-1 rounded-full text-slate-500">{processes.length} registros</span>
      </div>
      
      <div className="pl-2">
          {processes.map((process, idx) => (
             <TimelineItem 
                key={process.id} 
                process={process} 
                isLast={idx === processes.length - 1} 
             />
          ))}
          
          {/* End Node */}
          <div className="flex gap-4 opacity-50">
              <div className="w-24 text-right pt-1">
                  <span className="text-[10px] font-bold text-slate-400">Início</span>
              </div>
              <div className="relative flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-slate-300"></div>
              </div>
              <div></div>
          </div>
      </div>
    </div>
  );
};
