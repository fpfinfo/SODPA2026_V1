import React from 'react';
import { Scale } from 'lucide-react';
import { SODPARequest } from '../../../../hooks/useSODPARequests';

interface RequerimentoTemplateProps {
  request: SODPARequest;
}

export const RequerimentoTemplate: React.FC<RequerimentoTemplateProps> = ({ request }) => {
  const isPassagem = request.tipo === 'PASSAGEM';
  
  return (
    <div className="bg-white w-full h-full p-16 flex flex-col">
      {/* Header */}
      <div className="flex flex-col items-center mb-12 border-b border-gray-100 pb-8">
         <div className="mb-4">
          <img 
            src="/assets/brasao_pa.png" 
            alt="Brasão PA" 
            className="w-20 h-20 object-contain opacity-80"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement!.innerHTML = '<div class="w-16 h-16 flex items-center justify-center bg-red-900/10 rounded-full text-red-900 border-2 border-double border-red-900/20"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg></div>';
            }}
          />
        </div>
        <h1 className="text-lg font-bold tracking-widest text-slate-800 uppercase text-center">TRIBUNAL DE JUSTIÇA DO ESTADO DO PARÁ</h1>
      </div>

      {/* Main Title */}
      <div className="text-center mb-12">
        <h2 className="text-2xl font-bold text-slate-700 mb-2">
          Solicitação de Suprimento de Fundos {isPassagem ? 'Passagem Aérea' : 'Diárias'}
        </h2>
        <p className="font-mono text-slate-500 font-bold tracking-wider">
          NUP: {request.nup || 'EM PROCESSAMENTO'}
        </p>
      </div>

      {/* 1. Dados da Solicitação */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4 bg-slate-50 p-2 border-l-4 border-slate-800">
           <span className="font-bold text-lg text-slate-900">1. DADOS DA SOLICITAÇÃO</span>
        </div>
        
        <div className="grid grid-cols-1 gap-y-2 pl-4 text-sm">
          <p><span className="font-bold text-slate-700 w-32 inline-block">Tipo:</span> {isPassagem ? 'Passagem Aérea' : 'Diárias'}</p>
          <p><span className="font-bold text-slate-700 w-32 inline-block">Data Início:</span> {new Date(request.data_inicio).toLocaleDateString('pt-BR')}</p>
          <p><span className="font-bold text-slate-700 w-32 inline-block">Data Fim:</span> {new Date(request.data_fim).toLocaleDateString('pt-BR')}</p>
          <p><span className="font-bold text-slate-700 w-32 inline-block">Lotação:</span> {request.solicitante_lotacao || 'VARA UNICA DA COMARCA DE MAE DO RIO'}</p>
        </div>
      </div>

      {/* 2. Justificativa */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4 bg-slate-50 p-2 border-l-4 border-slate-800">
           <span className="font-bold text-lg text-slate-900">2. JUSTIFICATIVA</span>
        </div>
        
        <div className="pl-4 text-sm text-slate-700 leading-relaxed text-justify">
          <p>
            Solicito a concessão de suprimento de fundos para a {request.solicitante_lotacao || 'Comarca'}, visando atender a 
            deslocamento referente ao {request.motivo || 'serviço essencial'}. O dimensionamento 
            contempla {isPassagem ? 'passagem aérea' : `${request.dias} dias de diárias`}, totalizando uma projeção estimada de 
            <span className="font-bold text-slate-900 ml-1">
              R$ {(request.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.
            </span>
          </p>
        </div>
      </div>

      {/* 3. Elementos de Despesa */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4 bg-slate-50 p-2 border-l-4 border-slate-800">
           <span className="font-bold text-lg text-slate-900">3. ELEMENTOS DE DESPESA</span>
        </div>
        
        <div className="pl-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 font-bold text-slate-800 w-32 uppercase text-xs">Código</th>
                <th className="text-left py-2 font-bold text-slate-800 uppercase text-xs">Descrição</th>
                <th className="text-right py-2 font-bold text-slate-800 w-32 uppercase text-xs">Valor Total</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-4 text-slate-600 font-mono text-xs">{isPassagem ? '3.3.90.33' : '3.3.90.14'}</td>
                <td className="py-4 text-slate-600">{isPassagem ? 'Passagens e Despesas com Locomoção' : 'Diárias - Civil'}</td>
                <td className="py-4 text-slate-900 font-bold text-right">R$ {(request.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2} className="py-4 text-right font-bold text-slate-400 text-xs uppercase pr-4">Total:</td>
                <td className="py-4 text-right font-black text-slate-900 text-lg">R$ {(request.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

    </div>
  );
};
