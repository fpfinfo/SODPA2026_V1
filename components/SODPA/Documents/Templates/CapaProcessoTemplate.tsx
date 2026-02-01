import React from 'react';
import { Scale } from 'lucide-react';
import { SODPARequest } from '../../../../hooks/useSODPARequests';

interface CapaProcessoTemplateProps {
  request: SODPARequest;
}

export const CapaProcessoTemplate: React.FC<CapaProcessoTemplateProps> = ({ request }) => {
  return (
    <div className="bg-white w-full h-full p-16 flex flex-col items-center">
      {/* Header */}
      <div className="flex flex-col items-center mb-16">
        <div className="mb-4">
          <img 
            src="/assets/brasao_pa.png" 
            alt="Brasão PA" 
            className="w-24 h-24 object-contain opacity-80"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement!.innerHTML = '<div class="w-24 h-24 flex items-center justify-center bg-red-900/10 rounded-full text-red-900 border-4 border-double border-red-900/20"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg></div>';
            }}
          />
        </div>
        <h1 className="text-xl font-black tracking-[0.2em] text-slate-900 uppercase mb-2">Poder Judiciário</h1>
        <h2 className="text-lg font-semibold tracking-[0.1em] text-slate-500 uppercase border-b border-slate-200 pb-2">Tribunal de Justiça do Pará</h2>
      </div>

      {/* Main Content Box */}
      <div className="w-full max-w-2xl bg-slate-50 rounded-3xl p-12 mb-16 relative overflow-hidden border border-slate-100 shadow-sm">
        {/* Watermark Logo */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
          <Scale size={400} />
        </div>

        <div className="relative z-10 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-4">Número Único de Protocolo</p>
          <div className="text-5xl font-black text-slate-800 tracking-tight leading-tight">
            {request.nup || 'TJPA-PROC-2026-????'}
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="w-full max-w-2xl grid grid-cols-2 gap-y-12 gap-x-8">
        <div className="border-l-2 border-slate-200 pl-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 mb-2">Interessado</p>
          <p className="text-xl font-bold text-slate-900 leading-tight">{request.solicitante_nome}</p>
          <p className="text-sm text-slate-500 mt-1 uppercase">{request.solicitante_cargo || 'Servidor'}</p>
        </div>

        <div className="border-l-2 border-slate-200 pl-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 mb-2">Modalidade</p>
          <p className="text-xl font-bold text-slate-900 uppercase">
            {request.tipo === 'PASSAGEM' ? 'Solicitação de Passagem' : 'Concessão de Diárias'}
          </p>
        </div>

        <div className="border-l-2 border-slate-200 pl-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 mb-2">Lotação</p>
          <p className="text-lg font-bold text-slate-900 uppercase leading-tight">
            {request.solicitante_lotacao || 'Não informada'}
          </p>
        </div>

        <div className="border-l-2 border-slate-200 pl-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 mb-2">Valor Solicitado</p>
          <p className="text-xl font-bold text-blue-600">
            R$ {(request.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto text-center border-t border-slate-100 pt-8 w-full max-w-2xl">
        <p className="text-xs text-slate-400">
          Data de Protocolo: {new Date(request.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
        </p>
      </div>
    </div>
  );
};
