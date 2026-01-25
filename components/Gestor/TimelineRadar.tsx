import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Clock, AlertTriangle, CheckCircle2, Siren } from 'lucide-react';
import { differenceInDays, addDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PrazoProcesso {
  id: string;
  nup: string;
  suprido: string;
  valor: number;
  submitted_at: string;
  vencimento: string;
  diasRestantes: number;
  status: string;
}

export const TimelineRadar: React.FC = () => {
  const [processos, setProcessos] = useState<PrazoProcesso[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPrazos() {
      // Regra TJPA: Gestor tem 30 dias para analisar após recebimento? 
      // Ou monitorar o prazo do SUPRIDO (90 dias totais)?
      // Aqui monitoraremos o prazo da PC em análise.
      // Supondo SLA de 15 dias para Gestor.
      
      const { data, error } = await supabase
        .from('prestacao_contas')
        .select(`
          id, 
          status, 
          submitted_at, 
          valor_concedido,
          solicitacoes (nup, profiles(nome))
        `)
        .eq('status', 'PENDENTE_GESTOR'); // Apenas os que estão com o Gestor
        
      if (data) {
        const mapped = data.map((pc: any) => {
           const subDate = new Date(pc.submitted_at);
           const prazoGestor = addDays(subDate, 15); // Meta interna: 15 dias
           const dias = differenceInDays(prazoGestor, new Date());
           
           return {
             id: pc.id,
             nup: pc.solicitacoes?.nup || 'N/A',
             suprido: pc.solicitacoes?.profiles?.nome || 'Desconhecido',
             valor: pc.valor_concedido,
             submitted_at: pc.submitted_at,
             vencimento: prazoGestor.toISOString(),
             diasRestantes: dias,
             status: pc.status
           };
        });
        
        // Ordenar por urgência
        mapped.sort((a, b) => a.diasRestantes - b.diasRestantes);
        setProcessos(mapped);
      }
      setIsLoading(false);
    }
    
    fetchPrazos();
  }, []);

  if (isLoading) return <div className="animate-pulse h-24 bg-slate-100 rounded-xl" />;
  if (processos.length === 0) return null;

  // Estatísticas
  const criticos = processos.filter(p => p.diasRestantes <= 3).length;
  const atencao = processos.filter(p => p.diasRestantes > 3 && p.diasRestantes <= 7).length;

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm mb-6">
       <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-700 flex items-center gap-2">
            <Clock className="text-blue-500" />
            Radar de Prazos (Análise)
          </h3>
          <div className="flex gap-2 text-xs font-bold">
             {criticos > 0 && <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full">{criticos} Críticos</span>}
             {atencao > 0 && <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full">{atencao} Atenção</span>}
          </div>
       </div>

       {/* Timeline Visual */}
       <div className="space-y-3">
          {processos.slice(0, 3).map(p => (
             <div key={p.id} className="flex items-center gap-4 group cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors">
                {/* Status Icon */}
                <div className={`p-2 rounded-full 
                   ${p.diasRestantes < 0 ? 'bg-red-100 text-red-600' : 
                     p.diasRestantes <= 3 ? 'bg-red-50 text-red-500' :
                     p.diasRestantes <= 7 ? 'bg-amber-50 text-amber-500' :
                     'bg-emerald-50 text-emerald-500'}
                `}>
                   {p.diasRestantes < 0 ? <Siren size={18} /> : 
                    p.diasRestantes <= 3 ? <AlertTriangle size={18} /> :
                    <Clock size={18} />}
                </div>

                {/* Progress Bar Container */}
                <div className="flex-1">
                   <div className="flex justify-between text-xs mb-1">
                      <span className="font-bold text-slate-700">{p.nup} - {p.suprido.split(' ')[0]}</span>
                      <span className={`font-bold 
                         ${p.diasRestantes <= 3 ? 'text-red-600' : 'text-slate-500'}
                      `}>
                         {p.diasRestantes < 0 ? `ATRASADO ${Math.abs(p.diasRestantes)} dias` : `Vence em ${p.diasRestantes} dias`}
                      </span>
                   </div>
                   
                   {/* Bar */}
                   <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500
                           ${p.diasRestantes <= 3 ? 'bg-gradient-to-r from-red-500 to-red-600' : 
                             p.diasRestantes <= 7 ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                             'bg-gradient-to-r from-emerald-400 to-emerald-500'}
                        `}
                        style={{ width: `${Math.max(5, Math.min(100, 100 - (p.diasRestantes * 5)))}%` }} // Quanto menos dias, maior a barra
                      />
                   </div>
                </div>
             </div>
          ))}
          
          {processos.length > 3 && (
             <p className="text-center text-xs text-slate-400 mt-2 font-bold cursor-pointer hover:text-blue-600">
               + {processos.length - 3} processos na fila
             </p>
          )}
       </div>
    </div>
  );
};
