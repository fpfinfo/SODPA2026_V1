import React from 'react';

interface StaticCertidaoProps {
  processData: any;
  documentData: any;
}

export const StaticCertidao: React.FC<StaticCertidaoProps> = ({ processData, documentData }) => {
  // CRITICAL FIX: Merge root metadata (signature info) with form_data to ensure signed_* fields are available
  const rootMetadata = documentData?.metadata || {};
  const formData = rootMetadata.form_data || {};
  // Create a merged metadata object that prioritizes root metadata for signature fields but access form data for document content
  const metadata = { ...formData, ...rootMetadata };

  const formatDate = (date?: string) => {
    if (!date) return new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    const cleanDate = date.split('T')[0];
    if (cleanDate.includes('-')) {
      const [year, month, day] = cleanDate.split('-');
      const monthNames = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
      return `${parseInt(day)} de ${monthNames[parseInt(month) - 1]} de ${year}`;
    }
    return new Date(date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatCurrency = (value?: number) => {
    if (!value && value !== 0) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));
  };

  const supridoNome = processData.suprido_nome || processData.interested || 'Servidor Suprido';
  const unidade = processData.unidade || processData.lotacao || processData.unit || 'Unidade Judiciária';
  const nup = processData.nup || 'N/A';
  const valor = processData.valor_total || processData.value || 0;
  const numeroCertidao = documentData?.metadata?.numero_certidao || Math.floor(Math.random() * 9000 + 1000);
  const anoCertidao = new Date(documentData?.created_at || Date.now()).getFullYear();

  return (
    <div className="space-y-8 font-serif text-slate-900 text-sm leading-relaxed">
      {/* Title */}
      <div className="text-center mb-10">
        <h2 className="text-2xl font-black uppercase tracking-widest mb-2">
          CERTIDÃO DE REGULARIDADE
        </h2>
        <p className="text-sm text-slate-500">CERTIDAO_REGULARIDADE</p>
      </div>

      <div className="w-full h-px bg-slate-900/20 mb-8"></div>

      {/* Certidão Number */}
      <div className="text-center mb-8">
        <p className="text-base">
          <span className="font-bold">CERTIDÃO Nº</span>{' '}
          <span className="font-black text-xl mx-2">{numeroCertidao}</span>{' '}
          <span className="font-bold">/{anoCertidao}-SOSFU/TJE</span>
        </p>
      </div>

      {/* Body */}
      <div className="space-y-6 text-justify">
        <p className="leading-loose">
          CERTIFICO, para os devidos fins, que consultadas as bases de dados do Sistema de Suprimento de Fundos 
          (SISUP) do Tribunal de Justiça do Estado do Pará, foi verificado que o(a) servidor(a){' '}
          <strong>{supridoNome}</strong>, lotado(a) na <strong>{unidade}</strong>, encontra-se{' '}
          <strong className="text-emerald-700">REGULAR</strong> perante este Tribunal, no tocante a prestações de 
          contas de suprimentos de fundos anteriormente concedidos.
        </p>

        <p className="leading-loose">
          Assim, não há impedimentos para a concessão de novo suprimento de fundos ao(à) referido(a) servidor(a), 
          conforme solicitado no processo <strong>{nup}</strong>, no valor de <strong>{formatCurrency(valor)}</strong>.
        </p>

        <p className="leading-loose">
          A presente certidão é expedida com base nas informações constantes nos sistemas de controle interno, 
          não se responsabilizando este órgão por eventuais omissões de informações não registradas nos 
          referidos sistemas, nos termos da Resolução CNJ nº 169/2013.
        </p>

        {/* Validity */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mt-8">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Validade da Certidão</p>
          <p className="text-sm text-slate-600">
            Esta certidão tem validade de <strong>30 (trinta) dias</strong> a contar da data de sua emissão.
          </p>
        </div>

        {/* Location and date */}
        <div className="mt-12 text-right">
          <p>Belém-PA, {formatDate(documentData?.created_at)}.</p>
        </div>

        {/* Signature */}
        <div className="mt-16 text-center space-y-4">
          <div className="pt-4 border-t border-slate-400 max-w-md mx-auto">
            <p className="text-sm font-semibold">Ordenador de Despesa</p>
            <p className="text-xs text-slate-600">Secretaria de Planejamento, Coordenação e Finanças</p>
          </div>
        </div>

        {/* Electronic verification notice */}
        <div className="mt-8 text-center text-xs text-slate-500 italic border-t border-slate-200 pt-4">
          <p>Documento gerado eletronicamente pelo Sistema SISUP.</p>
          <p>A autenticidade pode ser verificada através do ID: <strong>{documentData?.id?.substring(0, 16) || 'N/A'}</strong></p>
        </div>

        {/* Digital signature block - Show when document is signed */}
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
                    Secretaria de Planejamento, Coordenação e Finanças
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
