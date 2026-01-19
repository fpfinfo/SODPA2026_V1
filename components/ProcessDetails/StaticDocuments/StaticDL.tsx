import React from 'react';

interface StaticDLProps {
  processData: any;
  documentData: any;
}

const BRASAO_TJPA_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/217479058_brasao-tjpa.png';

export const StaticDL: React.FC<StaticDLProps> = ({ processData, documentData }) => {
  const metadata = documentData.metadata?.form_data || {};
  
  const formatCurrency = (value?: number) => {
    if (!value && value !== 0) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));
  };

  const formatDate = (date?: string) => {
    if (!date) return new Date().toLocaleDateString('pt-BR');
    // Handle ISO strings/YYYY-MM-DD
    const cleanDate = date.split('T')[0];
    if (cleanDate.includes('-')) {
      const parts = cleanDate.split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return new Date(date).toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-8 font-serif text-slate-900">
      {/* Header Specific for DL */}
      <div className="text-center mb-12 space-y-2">
        <h2 className="text-xl font-bold uppercase tracking-widest border-b-2 border-slate-900 pb-2 inline-block">
          Nota de Liquidação
        </h2>
        <div className="flex justify-center gap-8 mt-4 text-sm font-mono">
          <p><strong>Número:</strong> {metadata.numero_completo || (metadata.numero_siafe ? `${new Date().getFullYear()}040102DL${metadata.numero_siafe}` : (documentData.id?.slice(0, 8).toUpperCase() || 'N/A'))}</p>
          <p><strong>UG:</strong> {metadata.ug || metadata.fonte_recurso || '040102'}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-8">
        {/* Dados do Processo */}
        <div className="bg-slate-50 p-6 border border-slate-200 rounded-sm">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 border-b border-slate-200 pb-2">
            Dados do Processo
          </h3>
          <div className="grid grid-cols-2 gap-y-4 text-sm">
            <div>
              <span className="block text-xs text-slate-400 uppercase">NUP (Protocolo)</span>
              <span className="font-bold font-mono text-base">{processData.nup || 'N/A'}</span>
            </div>
            <div>
              <span className="block text-xs text-slate-400 uppercase">Data de Emissão</span>
              <span className="font-bold">{formatDate(metadata.data_emissao)}</span>
            </div>
            <div className="col-span-2">
              <span className="block text-xs text-slate-400 uppercase">Interessado / Favorecido</span>
              <span className="font-bold">{processData.suprido_nome || processData.interested || 'N/A'}</span>
            </div>
            <div className="col-span-2">
              <span className="block text-xs text-slate-400 uppercase">Objeto da Despesa</span>
              <p className="text-justify leading-relaxed mt-1">
                {processData.descricao || processData.description || 'Concessão de Suprimento de Fundos para despesas de pronto pagamento.'}
              </p>
            </div>
          </div>
        </div>

        {/* Valores */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 border-b border-slate-200 pb-2">
            Valores Liquidados
          </h3>
          <div className="flex justify-between items-center bg-slate-100 p-4 border-l-4 border-slate-900">
            <span className="font-bold uppercase text-sm">Valor Total Bruto</span>
            <span className="font-black text-xl font-mono">{formatCurrency(processData.valor_total || processData.value)}</span>
          </div>
          <div className="mt-2 text-xs text-right text-slate-500 italic">
            Valor a ser creditado ao suprido para execução das despesas.
          </div>
        </div>

        {/* Certificação */}
        <div className="mt-12 text-justify text-sm leading-loose">
          <p>
            Declaro para os devidos fins que a despesa referente a este Suprimento de Fundos foi devidamente liquidada, 
            estando em conformidade com as normas vigentes e com a Nota de Empenho vinculada, aguardando o respectivo pagamento.
          </p>
        </div>
      </div>
    </div>
  );
};
