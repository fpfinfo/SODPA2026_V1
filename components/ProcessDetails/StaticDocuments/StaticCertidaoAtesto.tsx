import React from 'react';

interface StaticCertidaoAtestoProps {
  processData: any;
  documentData?: any;
}

/**
 * StaticCertidaoAtesto - Renders the Certidão de Atesto do Gestor
 * This component provides WYSIWYG parity between the preview modal and the Dossiê Digital
 */
export const StaticCertidaoAtesto: React.FC<StaticCertidaoAtestoProps> = ({ 
  processData, 
  documentData 
}) => {
  const formatDate = (date?: string) => {
    if (!date) return new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const formatCurrency = (value?: number) => {
    if (!value && value !== 0) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));
  };

  const supridoNome = processData.suprido_nome || processData.interested || 'Servidor Suprido';
  const unidade = processData.unidade || processData.lotacao || processData.unit || 'Unidade Judiciária';
  const nup = processData.nup || 'N/A';
  const valor = processData.valor_total || processData.value || processData.val || 0;
  const modalidade = processData.tipo || processData.type || 'EXTRA-EMERGENCIAL';
  const numeroCertidao = documentData?.metadata?.numero_certidao || String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
  const anoCertidao = new Date(documentData?.created_at || Date.now()).getFullYear();
  const dataAssinatura = formatDate(documentData?.created_at);

  // Signer info from profiles join or metadata
  const signerName = documentData?.profiles?.nome || documentData?.metadata?.signed_by_name || 'Gestor Responsável';
  const signerRole = documentData?.profiles?.cargo || documentData?.metadata?.signer_role || 'Chefia Imediata';

  return (
    <div className="space-y-8 font-serif text-slate-900 text-sm leading-relaxed">


      {/* Certidão Title and Number */}
      <div className="text-center mb-8">
        <h3 className="text-xl font-bold text-slate-900 uppercase tracking-wide mb-2">
          Certidão de Atesto da Chefia Imediata
        </h3>
        <p className="text-sm text-slate-500">
          Nº {anoCertidao}/{numeroCertidao}
        </p>
      </div>

      {/* Body */}
      <div className="space-y-6 text-justify">
        <p className="leading-loose">
          <strong>CERTIFICO</strong>, no uso das minhas atribuições legais e em conformidade com o Regulamento de 
          Suprimento de Fundos do Tribunal de Justiça do Estado do Pará, que a despesa pretendida pelo servidor{' '}
          <strong>{supridoNome}</strong> no processo <strong>{nup}</strong> reveste-se de interesse público e atende aos 
          critérios de conveniência e oportunidade desta unidade judiciária.
        </p>

        <p className="leading-loose">
          <strong>DECLARO</strong> que verifiquei a disponibilidade orçamentária da unidade e a adequação dos 
          itens solicitados às necessidades do serviço, conforme detalhamento abaixo:
        </p>

        {/* Metadata Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 my-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Modalidade</p>
              <p className="font-bold text-slate-800">{modalidade}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Valor Solicitado</p>
              <p className="font-bold text-slate-800">{formatCurrency(valor)}</p>
            </div>
          </div>
        </div>

        <p className="leading-loose">
          <strong>ATESTO</strong>, ainda, a impossibilidade de atendimento da demanda via fluxo normal de 
          compras/licitação em tempo hábil, caracterizando a necessidade emergencial que justifica a 
          concessão do suprimento de fundos.
        </p>

        <p className="leading-loose pt-4">
          Encaminhe-se ao <strong>Serviço de Suprimento de Fundos (SOSFU)</strong> para análise técnica e 
          demais providências cabíveis.
        </p>

        {/* Location and date */}
        <div className="mt-12 text-center">
          <p>{unidade}, {dataAssinatura}.</p>
        </div>

        {/* Signature placeholder (shown only if NOT YET SIGNED) */}
        {documentData?.status !== 'ASSINADO' && (
          <div className="mt-16 text-center space-y-4">
            <div className="pt-4 border-t border-dashed border-slate-400 max-w-md mx-auto inline-block px-12">
              <p className="text-sm text-slate-400 font-medium italic">Assinatura Digital do Gestor</p>
            </div>
          </div>
        )}

        {/* Electronic Signature Block (shown only when SIGNED) */}
        {documentData?.status === 'ASSINADO' && (
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
                    {signerName}
                  </p>
                  <p className="text-xs text-emerald-700 mt-1">
                    {signerRole}
                  </p>
                  <div className="mt-3 text-[11px] font-medium text-emerald-800 space-y-1">
                    <p>
                      <strong>Data:</strong> {dataAssinatura}
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

        {/* Footer */}
        <div className="text-center pt-12 mt-auto border-t border-slate-100 text-[9px] text-slate-400 uppercase tracking-widest">
          Documento gerado pelo Sistema SISUP - TJPA <br />
          ID: {documentData?.id || 'PREVIEW'} • NUP: {nup}
        </div>
      </div>
    </div>
  );
};
