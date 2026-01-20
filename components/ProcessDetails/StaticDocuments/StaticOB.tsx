import React from 'react';

interface StaticOBProps {
  processData: any;
  documentData: any;
}

export const StaticOB: React.FC<StaticOBProps> = ({ processData, documentData }) => {
  // Support both form_data wrapper (dossier) and direct metadata (execution_documents)
  const metadata = documentData.metadata?.form_data || documentData.metadata || {};
  
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
      {/* Header Specific for OB */}
      <div className="text-center mb-12 space-y-2">
        <h2 className="text-xl font-bold uppercase tracking-widest border-b-2 border-slate-900 pb-2 inline-block">
          Ordem Bancária
        </h2>
        <div className="flex justify-center gap-8 mt-4 text-sm font-mono">
          <p><strong>Número:</strong> {metadata.numero_completo || metadata.numero_siafe || 'N/A'}</p>
          <p><strong>UG:</strong> {metadata.ug || metadata.fonte_recurso || '040102'}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-8">
        {/* Dados do Favorecido e Pagamento */}
        <div className="bg-slate-50 p-6 border border-slate-200 rounded-sm">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 border-b border-slate-200 pb-2">
            Dados do Pagamento
          </h3>
          <div className="grid grid-cols-2 gap-y-4 text-sm">
             <div>
              <span className="block text-xs text-slate-400 uppercase">Favorecido</span>
              <span className="font-bold">{processData.suprido_nome || processData.interested || 'N/A'}</span>
            </div>
             <div>
              <span className="block text-xs text-slate-400 uppercase">CPF / Matrícula</span>
              <span className="font-bold font-mono">
                {processData.cpf || metadata.cpf || 'Não informado'}
              </span>
            </div>
            
             <div className="col-span-2 pt-4">
               <h4 className="text-[10px] uppercase font-bold text-slate-400 mb-2">Dados Bancários de Destino</h4>
               <div className="bg-white p-3 border border-slate-200 rounded grid grid-cols-3 gap-4 font-mono text-xs">
                 <div>
                   <span className="block text-[8px] uppercase text-slate-400">Banco</span>
                   <span>{metadata.banco || processData.dados_bancarios?.banco || 'BANPARA (037)'}</span>
                 </div>
                 <div>
                   <span className="block text-[8px] uppercase text-slate-400">Agência</span>
                   <span>{metadata.agencia || processData.dados_bancarios?.agencia || 'Não inf.'}</span>
                 </div>
                 <div>
                   <span className="block text-[8px] uppercase text-slate-400">Conta Corrente</span>
                   <span>{metadata.conta_corrente || processData.dados_bancarios?.conta || 'Não inf.'}</span>
                 </div>
               </div>
            </div>
          </div>
        </div>

        {/* Valores */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 border-b border-slate-200 pb-2">
            Valor do Pagamento
          </h3>
          <div className="flex justify-between items-center bg-slate-100 p-4 border-l-4 border-slate-900">
            <span className="font-bold uppercase text-sm">Valor Líquido</span>
            <span className="font-black text-xl font-mono">{formatCurrency(processData.valor_total || processData.value)}</span>
          </div>
        </div>

        {/* Autorização */}
        <div className="mt-12 text-justify text-sm leading-loose">
          <p>
            Autorizo o pagamento da importância acima discriminada, referente à concessão de Suprimento de Fundos, 
            através de crédito em conta corrente do servidor beneficiário.
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-8 mt-16 pt-8">
           <div className="text-center">
             <div className="h-px bg-black w-3/4 mx-auto mb-2"></div>
             <p className="text-xs font-bold uppercase">Ordenador de Despesa</p>
           </div>
           <div className="text-center">
             <div className="h-px bg-black w-3/4 mx-auto mb-2"></div>
             <p className="text-xs font-bold uppercase">Responsável Financeiro</p>
           </div>
        </div>
      </div>
    </div>
  );
};
