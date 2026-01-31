import React from 'react';

interface StaticNEProps {
  processData: any;
  documentData: any;
}

export const StaticNE: React.FC<StaticNEProps> = ({ processData, documentData }) => {
  // Support both form_data wrapper (dossier) and direct metadata (execution_documents)
  // CRITICAL FIX: Merge root metadata (signature info) with form_data to ensure signed_* fields are available
  const rootMetadata = documentData?.metadata || {};
  const formData = rootMetadata.form_data || {};
  const metadata = { ...formData, ...rootMetadata };
  
  const formatCurrency = (value?: number) => {
    if (!value && value !== 0) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));
  };

  const formatDate = (date?: string) => {
    if (!date) return new Date().toLocaleDateString('pt-BR');
    // Ensure we handle ISO strings correctly by taking only the date part
    const cleanDate = date.split('T')[0];
    if (cleanDate.includes('-')) {
      const parts = cleanDate.split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return new Date(date).toLocaleDateString('pt-BR');
  };

  // Construct fallback number if missing
  const neNumber = metadata.numero_completo || 
                   (metadata.numero_siafe ? `${new Date().getFullYear()}040102NE${metadata.numero_siafe}` : 'N/A');

  return (
    <div className="space-y-8 font-serif text-slate-900">
      {/* Header Specific for NE */}
      <div className="text-center mb-12 space-y-2">
        <h2 className="text-xl font-bold uppercase tracking-widest border-b-2 border-slate-900 pb-2 inline-block">
          Nota de Empenho
        </h2>
        <div className="flex justify-center gap-8 mt-4 text-sm font-mono">
          <p><strong>Número:</strong> {neNumber}</p>
          <p><strong>UG:</strong> {metadata.ug || metadata.fonte_recurso || '040102'}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-8">
        {/* Dados do Processo */}
        <div className="bg-slate-50 p-6 border border-slate-200 rounded-sm">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 border-b border-slate-200 pb-2">
            Dados do Empenho
          </h3>
          <div className="grid grid-cols-2 gap-y-4 text-sm">
            <div>
              <span className="block text-xs text-slate-400 uppercase">NUP (Protocolo)</span>
              <span className="font-bold font-mono text-base">{processData.nup || 'N/A'}</span>
            </div>
            <div>
              <span className="block text-xs text-slate-400 uppercase">Data de Emissão</span>
              <span className="font-bold">{formatDate(metadata.data_emissao || documentData.created_at)}</span>
            </div>
            <div className="col-span-2">
              <span className="block text-xs text-slate-400 uppercase">Favorecido (Suprido)</span>
              <span className="font-bold">{processData.suprido_nome || processData.interested || 'N/A'}</span>
            </div>
            <div className="col-span-2">
              <span className="block text-xs text-slate-400 uppercase">Objeto</span>
              <p className="text-justify leading-relaxed mt-1">
                {processData.descricao || processData.description || 'Concessão de Suprimento de Fundos para despesas de pronto pagamento.'}
              </p>
            </div>
          </div>
        </div>

        {/* Classificação Orçamentária */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 border border-slate-200 rounded-sm">
            <h4 className="text-[10px] uppercase font-bold text-slate-400 mb-2">Classificação</h4>
            <div className="space-y-3 text-sm">
              <div>
                <span className="block text-[8px] uppercase text-slate-400">PTRES</span>
                <span className="font-mono font-bold">{metadata.ptres || '164005'}</span>
              </div>
              <div>
                <span className="block text-[8px] uppercase text-slate-400">Fonte de Recurso</span>
                <span className="font-mono font-bold">{metadata.fonte_recurso || '0101'}</span>
              </div>
            </div>
          </div>
          
          <div className="p-4 border border-slate-200 rounded-sm">
             <h4 className="text-[10px] uppercase font-bold text-slate-400 mb-2">Natureza de Despesa</h4>
             <div className="space-y-2 text-sm">
               {processData.itens_despesa && processData.itens_despesa.length > 0 ? (
                 processData.itens_despesa.map((item: any, idx: number) => (
                   <div key={idx} className="flex justify-between items-center border-b border-slate-100 pb-1 last:border-0">
                     <span className="font-mono text-xs">{item.codigo || item.element}</span>
                     <span className="font-bold">{formatCurrency(item.valor_total || item.val)}</span>
                   </div>
                 ))
               ) : (
                 <div className="text-slate-400 italic text-xs">Itens não detalhados</div>
               )}
             </div>
          </div>
        </div>

        {/* Valores */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 border-b border-slate-200 pb-2">
            Valor Empenhado
          </h3>
          <div className="flex justify-between items-center bg-slate-100 p-4 border-l-4 border-slate-900">
            <span className="font-bold uppercase text-sm">Valor Total</span>
            <span className="font-black text-xl font-mono">{formatCurrency(processData.valor_total || processData.value)}</span>
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-8 mt-16 pt-8">
           <div className="text-center">
             {(documentData?.status === 'ASSINADO' || documentData?.status === 'Assinado' || metadata.signed_by_name) ? (
               <div className="mb-2">
                 <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mb-1">✓ Assinado Digitalmente</p>
                  <p className="text-sm font-bold border-b border-black inline-block px-4">{metadata.signed_by_name}</p>
               </div>
             ) : (
               <div className="h-px bg-black w-3/4 mx-auto mb-2"></div>
             )}
             <p className="text-xs font-bold uppercase">Ordenador de Despesa</p>
           </div>
           <div className="text-center">
             <div className="h-px bg-black w-3/4 mx-auto mb-2"></div>
             <p className="text-xs font-bold uppercase">Responsável pela Emissão</p>
           </div>
        </div>
        
        {/* Electronic Signature Block (Standardized Style) */}
        {(documentData?.status === 'ASSINADO' || documentData?.status === 'Assinado' || metadata.signed_at) && (
          <div className="mt-16 pt-8 border-t-2 border-slate-200 break-inside-avoid">
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl space-y-4">
              <h5 className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                ASSINATURA ELETRÔNICA CERTIFICADA
              </h5>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-black text-sm shrink-0">
                  OK
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-base font-bold text-emerald-900 uppercase">
                    {metadata.signed_by_name || metadata.footer?.signerName || 'Ordenador de Despesa'}
                  </p>
                  <p className="text-xs text-emerald-700 mt-1">
                    {metadata.signer_role || 'Secretaria de Planejamento, Coordenação e Finanças'}
                  </p>
                  <div className="mt-3 text-[11px] font-medium text-emerald-800 space-y-1">
                    <p>
                      <strong>Data:</strong> {formatDate(metadata.signed_at || documentData?.signed_at || documentData?.updated_at || documentData?.created_at)}
                    </p>
                    <p>
                      <strong>Hash de Verificação:</strong> {documentData?.id?.substring(0, 16)?.toUpperCase() || 'N/A'}...
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-[9px] text-emerald-600 mt-4 leading-relaxed border-t border-emerald-200 pt-3">
                A autenticidade deste documento pode ser conferida no sistema SISUP através do ID {documentData?.id || 'N/A'}. 
                Assinado eletronicamente conforme MP 2.200-2/2001.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
