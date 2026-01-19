import React from 'react';

interface StaticPortariaProps {
  processData: any;
  documentData: any;
}

export const StaticPortaria: React.FC<StaticPortariaProps> = ({ processData, documentData }) => {
  const metadata = documentData.metadata?.form_data || {};
  
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

  const numeroPortaria = metadata.numero_portaria || '---';
  const anoPortaria = new Date(documentData.created_at || Date.now()).getFullYear();

  return (
    <div className="space-y-6 font-serif text-slate-900 text-sm leading-relaxed">
      {/* Title */}
      <div className="text-left mb-8">
        <p className="text-base">
          <span className="font-bold">PORTARIA SF Nº</span>{' '}
          <span className="font-black text-2xl mx-2">{numeroPortaria}</span>{' '}
          <span className="font-bold">/{anoPortaria}-SEPLAN/TJE</span>
        </p>
      </div>

      {/* Opening paragraph */}
      <div className="mb-8 text-justify leading-loose">
        <p>
          Secretário de Planejamento, Coordenação e Finanças do Tribunal de Justiça do Estado do Pará, 
          no exercício das suas atribuições, estabelecidas na Portaria nº XXXX/2026-GP,
        </p>
      </div>

      {/* RESOLVE */}
      <div className="text-left font-bold mb-6 text-base">RESOLVE:</div>

      {/* Articles */}
      <div className="space-y-6 text-justify">
        {/* Art. 1º */}
        <div className="leading-loose">
          <span className="font-bold">Art. 1º</span>{' '}
          AUTORIZAR a concessão de Suprimento de Fundos ao servidor{' '}
          <strong>{processData.suprido_nome || 'N/A'}</strong>, a ser executado através do PTRES{' '}
          <strong>{metadata.ptres_code || '8727'}</strong> e Dotação Orçamentária{' '}
          <strong>{metadata.dotacao_code || '162'}</strong>, conforme especificações constantes no NUP{' '}
          <strong>{processData.nup || 'TJPA-EXT-2026-7128'}</strong>.
        </div>

        {/* Art. 2º */}
        <div className="leading-loose">
          <span className="font-bold">Art. 2º</span>{' '}
          O valor total do presente Suprimento de Fundos é de{' '}
          <strong>{formatCurrency(processData.valor_total || processData.value)}</strong>, obedecendo aos 
          limites estabelecidos pela Resolução CNJ nº 169/2013.
        </div>

        {/* Art. 3º */}
        <div className="leading-loose">
          <span className="font-bold">Art. 3º</span>{' '}
          O prazo de aplicação é de 90 (noventa) dias contados da data de recebimento do numerário, e o prazo para prestação de contas é de 30 (trinta) dias após o término do prazo de aplicação.
        </div>

        {/* Art. 4º */}
        <div className="leading-loose">
          <span className="font-bold">Art. 4º</span>{' '}
          Esta Portaria entra em vigor na data de sua publicação.
        </div>

        {/* Location and date */}
        <div className="mt-12 text-left">
          Belém-PA, {formatDate(documentData.created_at)}.
        </div>

        {/* Signature */}
        <div className="mt-16 text-center space-y-4">
          <div className="pt-4 border-t border-slate-400 max-w-md mx-auto">
            <p className="font-bold text-base uppercase">
              {metadata.signed_by_name || 'SECRETÁRIO EXECUTIVO DE FINANÇAS'}
            </p>
            <p className="text-sm font-semibold">Ordenador de Despesa</p>
            <p className="text-xs text-slate-600">{metadata.signer_role || 'Secretário de Planejamento, Coordenação e Finanças'}</p>
          </div>
        </div>

        {/* Digital signature notice */}
        {metadata.signed_by_name && (
          <div className="mt-8 text-center text-xs text-slate-500 italic border-t border-slate-200 pt-4">
            <p>Assinado digitalmente por <strong>{metadata.signed_by_name}</strong></p>
            <p>Data: {formatDate(metadata.signed_at || documentData.created_at)}</p>
          </div>
        )}
      </div>
    </div>
  );
};
