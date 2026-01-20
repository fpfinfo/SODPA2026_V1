import React from 'react';

interface StaticCertidaoProps {
  processData: any;
  documentData: any;
}

export const StaticCertidao: React.FC<StaticCertidaoProps> = ({ processData, documentData }) => {
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
            <p className="font-bold text-base uppercase">
              Seção de Suprimento de Fundos - SOSFU
            </p>
            <p className="text-sm text-slate-600">Secretaria Executiva de Finanças - SEFIN</p>
            <p className="text-xs text-slate-500 mt-1">Tribunal de Justiça do Estado do Pará</p>
          </div>
        </div>

        {/* Electronic verification notice */}
        <div className="mt-8 text-center text-xs text-slate-500 italic border-t border-slate-200 pt-4">
          <p>Documento gerado eletronicamente pelo Sistema SISUP.</p>
          <p>A autenticidade pode ser verificada através do ID: <strong>{documentData?.id?.substring(0, 16) || 'N/A'}</strong></p>
        </div>
      </div>
    </div>
  );
};
