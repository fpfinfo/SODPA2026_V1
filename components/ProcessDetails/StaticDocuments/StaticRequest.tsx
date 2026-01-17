import React from 'react';

interface ProcessData {
  nup?: string;
  tipo?: string;
  type?: string;
  valor_total?: number;
  value?: number;
  descricao?: string;
  description?: string;
  suprido_nome?: string;
  interested?: string;
  unidade?: string;
  unit?: string;
  date?: string;
  created_at?: string;
  data_inicio?: string;
  data_fim?: string;
  itens_despesa?: Array<{
    id?: string;
    codigo?: string;
    descricao?: string;
    quantidade?: number;
    valor_unitario?: number;
    valor_total?: number;
  }>;
}

interface StaticRequestProps {
  processData: ProcessData;
}

const BRASAO_TJPA_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/217479058_brasao-tjpa.png';

export const StaticRequest: React.FC<StaticRequestProps> = ({ processData }) => {
  const formatCurrency = (value?: number) => {
    if (!value) return 'R$ 0,00';
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

  const formatDate = (date?: string) => {
    if (!date) return new Date().toLocaleDateString('pt-BR');
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const items = processData.itens_despesa || [];
  const totalValue = processData.valor_total || processData.value || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center mb-12 space-y-2">
        <h2 className="text-lg font-medium text-slate-700">
          Solicitação de Suprimento de Fundos {processData.tipo || processData.type || 'EXTRA-EMERGENCIAL'}
        </h2>
        <h3 className="text-base font-black tracking-widest font-mono mt-4">
          NUP: {processData.nup || 'N/A'}
        </h3>
      </div>

      <div className="w-full h-px bg-slate-900/20 mb-12"></div>

      {/* Section 1: Dados da Solicitação */}
      <div className="space-y-6 mb-12">
        <h4 className="text-base font-black uppercase tracking-tight border-l-4 border-slate-900 pl-4 bg-slate-50 py-2">
          1. DADOS DA SOLICITAÇÃO
        </h4>
        <div className="grid grid-cols-1 gap-3 pl-5">
          <p className="text-sm">
            <strong>Tipo:</strong> {processData.tipo || processData.type || 'EXTRA-EMERGENCIAL'}
          </p>
          <p className="text-sm">
            <strong>Data Início:</strong> {formatDate(processData.data_inicio || processData.date || processData.created_at)}
          </p>
          {processData.data_fim && (
            <p className="text-sm">
              <strong>Data Fim:</strong> {formatDate(processData.data_fim)}
            </p>
          )}
          <p className="text-sm">
            <strong>Unidade:</strong> {processData.unidade || processData.unit || 'N/A'}
          </p>
        </div>
      </div>

      {/* Section 2: Justificativa */}
      <div className="space-y-6 mb-12">
        <h4 className="text-base font-black uppercase tracking-tight border-l-4 border-slate-900 pl-4 bg-slate-50 py-2">
          2. JUSTIFICATIVA
        </h4>
        <div className="pl-5 text-sm leading-relaxed text-justify">
          <p>
            {processData.descricao || processData.description || 
             'Considerando a necessidade urgente de atender demandas emergenciais na Unidade, solicita-se a liberação de suprimento de fundos para cobertura de despesas inadiáveis, conforme previsto no Regulamento Interno do TJPA.'}
          </p>
        </div>
      </div>

      {/* Section 3: Elementos de Despesa */}
      <div className="space-y-6 mb-16">
        <h4 className="text-base font-black uppercase tracking-tight border-l-4 border-slate-900 pl-4 bg-slate-50 py-2">
          3. ELEMENTOS DE DESPESA
        </h4>
        <div className="overflow-hidden border border-slate-200 rounded-lg">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-black uppercase">Código</th>
                <th className="px-4 py-3 font-black uppercase">Descrição</th>
                <th className="px-4 py-3 font-black uppercase text-center">Qtd</th>
                <th className="px-4 py-3 font-black uppercase text-right">Valor Unit.</th>
                <th className="px-4 py-3 font-black uppercase text-right">Valor Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.length > 0 ? (
                items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-3 font-mono">{item.codigo || 'N/A'}</td>
                    <td className="px-4 py-3">{item.descricao || 'Item'}</td>
                    <td className="px-4 py-3 text-center">{item.quantidade || 1}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(item.valor_unitario)}</td>
                    <td className="px-4 py-3 text-right font-bold">{formatCurrency(item.valor_total)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-3 font-mono">3.3.90.33</td>
                  <td className="px-4 py-3">Passagens e Despesas com Locomoção</td>
                  <td className="px-4 py-3 text-center">1</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(totalValue)}</td>
                  <td className="px-4 py-3 text-right font-bold">{formatCurrency(totalValue)}</td>
                </tr>
              )}
              <tr className="bg-slate-50 font-black">
                <td colSpan={4} className="px-4 py-3 text-right uppercase tracking-widest text-slate-500">
                  TOTAL:
                </td>
                <td className="px-4 py-3 text-right">{formatCurrency(totalValue)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Electronic Signatures */}
      <div className="mt-auto space-y-6">
        <div className="p-6 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
          <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">
            ASSINATURAS ELETRÔNICAS:
          </h5>
          <div className="flex items-center gap-3 text-[11px] font-medium text-slate-700">
            <div className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-black text-[9px]">
              OK
            </div>
            <p>
              ASSINADO ELETRONICAMENTE POR: <strong>{processData.suprido_nome || processData.interested || 'Servidor'}</strong> em {formatDate(processData.created_at)} às {new Date().toLocaleTimeString('pt-BR')}
            </p>
          </div>
          <p className="text-[9px] text-slate-400 mt-4 leading-relaxed">
            A autenticidade deste documento pode ser conferida no sistema SISUP através do NUP {processData.nup}.
          </p>
        </div>

        <div className="text-center pt-8 border-t border-slate-100 text-[9px] text-slate-400 uppercase tracking-widest">
          Documento gerado automaticamente pelo Sistema SISUP - TJPA <br />
          Data de geração: {new Date().toLocaleDateString('pt-BR')}, {new Date().toLocaleTimeString('pt-BR')}
        </div>
      </div>
    </div>
  );
};
