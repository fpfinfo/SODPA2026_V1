import React from 'react';

interface ProcessData {
  nup?: string;
  tipo?: string;
  type?: string;
  valor_total?: number;
  value?: number;
  suprido_nome?: string;
  interested?: string;
  unidade?: string;
  unit?: string;
  date?: string;
  created_at?: string;
}

interface StaticCoverProps {
  processData: ProcessData;
}

const BRASAO_TJPA_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/217479058_brasao-tjpa.png';

export const StaticCover: React.FC<StaticCoverProps> = ({ processData }) => {
  const formatCurrency = (value?: number) => {
    if (!value) return 'R$ 0,00';
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

  const formatDate = (date?: string) => {
    if (!date) return new Date().toLocaleDateString('pt-BR');
    return new Date(date).toLocaleDateString('pt-BR');
  };

  return (
    <div className="flex flex-col items-center h-full justify-center">
      {/* Brasão */}
      <img src={BRASAO_TJPA_URL} alt="Brasão TJPA" className="w-32 mb-12 opacity-90" />
      
      {/* Header */}
      <h1 className="text-2xl font-black tracking-[0.3em] uppercase text-slate-900 mb-2">
        Poder Judiciário
      </h1>
      <p className="text-lg font-bold uppercase tracking-[0.2em] text-slate-500 mb-16 border-b-2 border-slate-100 pb-4">
        Tribunal de Justiça do Pará
      </p>

      {/* NUP Section */}
      <div className="w-full bg-slate-50 p-12 rounded-3xl border border-slate-100 text-center mb-16">
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] mb-4">
          Número Único de Protocolo
        </h2>
        <p className="text-6xl font-black text-slate-900 font-mono tracking-tighter">
          {processData.nup || 'N/A'}
        </p>
      </div>

      {/* Process Info Grid */}
      <div className="grid grid-cols-2 gap-12 w-full text-left border-t border-slate-100 pt-16 font-serif mt-auto">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Interessado
          </label>
          <p className="text-lg font-black text-slate-800 uppercase leading-none">
            {processData.suprido_nome || processData.interested || 'N/A'}
          </p>
        </div>
        
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Modalidade
          </label>
          <p className="text-lg font-black text-slate-800 uppercase leading-none">
            {processData.tipo || processData.type || 'EXTRA-EMERGENCIAL'}
          </p>
        </div>
        
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Unidade
          </label>
          <p className="text-lg font-black text-slate-800 uppercase leading-none">
            {processData.unidade || processData.unit || 'N/A'}
          </p>
        </div>
        
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Valor Requisitado
          </label>
          <p className="text-lg font-black text-blue-600 uppercase leading-none">
            {formatCurrency(processData.valor_total || processData.value)}
          </p>
        </div>
      </div>

      {/* Footer Date */}
      <div className="mt-16 text-center text-sm text-slate-400">
        <p>Data de Protocolo: {formatDate(processData.date || processData.created_at)}</p>
      </div>
    </div>
  );
};
