import React from 'react';

// =============================================================================
// CONSTANTS
// =============================================================================

const BRASAO_TJPA_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/217479058_brasao-tjpa.png';

// =============================================================================
// TYPES
// =============================================================================

interface StaticPrestacaoContasProps {
  data: {
    // Dados do processo
    nup: string;
    portariaOriginal?: string;
    portariaNumero?: string;
    dataPortaria?: string;
    
    // Dados do Suprido
    supridoNome: string;
    supridoCargo?: string;
    supridoLotacao?: string;
    supridoCpf?: string;
    
    // Dados financeiros
    valorConcedido: number;
    valorGasto: number;
    valorDevolvido?: number;
    
    // Dados SIAFE
    siafeNl: string;
    siafeDate: string;
    
    // Assinatura
    ordenadorNome?: string;
    ordenadorCargo?: string;
    signedAt?: string;
    signedBy?: string;
  };
}

// =============================================================================
// COMPONENT
// =============================================================================

export const StaticPrestacaoContas: React.FC<StaticPrestacaoContasProps> = ({ data }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const saldo = data.valorConcedido - data.valorGasto;
  const valorDevolvido = data.valorDevolvido || (saldo > 0 ? saldo : 0);

  return (
    <div className="bg-white min-h-[297mm] w-[210mm] mx-auto p-[25mm] font-serif text-[11pt] leading-relaxed print:p-0">
      {/* Header Institucional */}
      <div className="text-center mb-8">
        <img 
          src={BRASAO_TJPA_URL} 
          alt="Brasão TJPA" 
          className="w-20 h-auto mx-auto mb-3"
        />
        <p className="font-bold text-sm tracking-wide">PODER JUDICIÁRIO</p>
        <p className="text-sm">Tribunal de Justiça do Estado do Pará</p>
        <p className="font-semibold text-sm">Secretaria de Planejamento e Finanças</p>
        <p className="text-[9pt] text-gray-600 mt-1">
          Av. Almirante Barroso, 3089 – CEP 66.613-710 – Fone/Fax (091) 3205-3241
        </p>
      </div>

      {/* Título do Documento */}
      <div className="text-center mb-10">
        <h1 className="text-lg font-bold tracking-wide mb-1">
          PORTARIA DE REGULARIDADE DE PRESTAÇÃO DE CONTAS
        </h1>
        {data.portariaNumero && (
          <p className="text-base font-bold">
            Nº {data.portariaNumero}
          </p>
        )}
      </div>

      {/* Preâmbulo */}
      <div className="text-justify mb-8 indent-12">
        <p>
          <strong>O SECRETÁRIO DE PLANEJAMENTO, COORDENAÇÃO E FINANÇAS</strong> do Tribunal de Justiça 
          do Estado do Pará, no exercício das suas atribuições, e tendo em vista o disposto na 
          Resolução nº 169/2013-CNJ e nas Instruções Normativas internas,
        </p>
      </div>

      {/* Considerandos */}
      <div className="mb-8 space-y-4">
        <p className="text-justify indent-12">
          <strong>CONSIDERANDO</strong> que o(a) servidor(a) <strong>{data.supridoNome}</strong>
          {data.supridoCargo && `, ${data.supridoCargo}`}
          {data.supridoCpf && `, CPF ${data.supridoCpf}`}
          , foi beneficiário(a) de Suprimento de Fundos no valor de <strong>{formatCurrency(data.valorConcedido)}</strong>, 
          conforme Portaria {data.portariaOriginal || 'de concessão'};
        </p>

        <p className="text-justify indent-12">
          <strong>CONSIDERANDO</strong> que foi apresentada Prestação de Contas com comprovantes 
          no valor total de <strong>{formatCurrency(data.valorGasto)}</strong>;
        </p>

        {valorDevolvido > 0 && (
          <p className="text-justify indent-12">
            <strong>CONSIDERANDO</strong> que o saldo não utilizado, no valor de <strong>{formatCurrency(valorDevolvido)}</strong>, 
            foi devidamente devolvido ao erário;
          </p>
        )}

        <p className="text-justify indent-12">
          <strong>CONSIDERANDO</strong> que a análise técnica realizada pela Seção de Suprimento de Fundos (SOSFU) 
          constatou a regularidade dos comprovantes apresentados e a conformidade com os normativos aplicáveis;
        </p>

        <p className="text-justify indent-12">
          <strong>CONSIDERANDO</strong> que foi procedida a baixa de responsabilidade no Sistema Integrado de 
          Administração Financeira para Estados e Municípios (SIAFE), sob a Nota de Lançamento nº <strong>{data.siafeNl}</strong>, 
          em <strong>{formatDate(data.siafeDate)}</strong>;
        </p>
      </div>

      {/* Resolve */}
      <div className="mb-8">
        <p className="text-center font-bold mb-4">RESOLVE:</p>
        
        <div className="space-y-4">
          <p className="text-justify indent-12">
            <strong>Art. 1º</strong> – DECLARAR REGULAR a Prestação de Contas apresentada pelo(a) servidor(a) 
            <strong> {data.supridoNome}</strong>, referente ao Processo Administrativo nº <strong>{data.nup}</strong>.
          </p>

          <p className="text-justify indent-12">
            <strong>Art. 2º</strong> – Esta Portaria entra em vigor na data de sua publicação.
          </p>
        </div>
      </div>

      {/* Data e Local */}
      <div className="text-right my-10">
        <p>Belém/PA, {data.signedAt ? formatDate(data.signedAt) : currentDate}.</p>
      </div>

      {/* Bloco de Assinatura */}
      <div className="mt-16 text-center">
        {data.signedBy ? (
          <div className="border border-emerald-400 bg-emerald-50 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-xs text-emerald-600 font-bold mb-1">✓ ASSINADO DIGITALMENTE</p>
            <p className="font-bold text-base">{data.signedBy}</p>
            <p className="text-sm text-gray-600">{data.ordenadorCargo || 'Secretário de Planejamento e Finanças'}</p>
            {data.signedAt && (
              <p className="text-xs text-gray-500 mt-2">
                Data/Hora: {new Date(data.signedAt).toLocaleString('pt-BR')}
              </p>
            )}
          </div>
        ) : (
          <div className="max-w-md mx-auto">
            <div className="border-t-2 border-black pt-3 mt-20">
              <p className="font-bold">{data.ordenadorNome || '_______________________________'}</p>
              <p className="text-sm text-gray-600">{data.ordenadorCargo || 'Secretário de Planejamento e Finanças'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Rodapé com Referências */}
      <div className="absolute bottom-[25mm] left-[25mm] right-[25mm] text-[8pt] text-gray-500 border-t border-gray-200 pt-2">
        <div className="flex justify-between">
          <span>Ref.: {data.nup}</span>
          <span>NL: {data.siafeNl}</span>
          <span>Data Baixa: {formatDate(data.siafeDate)}</span>
        </div>
      </div>
    </div>
  );
};

export default StaticPrestacaoContas;
