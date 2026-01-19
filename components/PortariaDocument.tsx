import React from 'react';

const BRASAO_TJPA_URL = 'https://www.tjpa.jus.br/images/brasao/brasao-tjpa-400.png';

interface ElementoDespesa {
  codigo: string;
  descricao: string;
  valor: number;
  ptres?: string;      // PTRES code (8193, 8727, 8163)
  dotacao?: string;    // Dotação code (170, 171, etc)
}

interface PortariaDocumentProps {
  numeroPortaria: number;
  anoPortaria: number;
  tipoSuplemento: 'EXTRA-EMERG' | 'SESSÃO DE JÚRI' | 'ORDINÁRIO';
  nomeServidor: string;
  cpfServidor: string;
  lotacao: string;
  valorTotal: number;
  elementosDespesa: ElementoDespesa[];
  contaCorrente: string;
  banco: string;
  agencia: string;
  prazoAplicacao: string; // "Data desta Portaria até o encerramento do Evento"
  prazoPrestacaoContas: number; // days after event
  dataEmissao: Date;
  ordenadorDespesa: string;
  cargoOrdenador: string;
  // Budget data
  ptres?: string;        // PTRES principal do suprimento
  dotacaoPrincipal?: string; // Dotação principal
}

export function PortariaDocument({
  numeroPortaria,
  anoPortaria,
  tipoSuplemento,
  nomeServidor,
  cpfServidor,
  lotacao,
  valorTotal,
  elementosDespesa,
  contaCorrente,
  banco,
  agencia,
  prazoAplicacao,
  prazoPrestacaoContas,
  dataEmissao,
  ordenadorDespesa,
  cargoOrdenador,
  ptres,
  dotacaoPrincipal
}: PortariaDocumentProps) {

  // Format number to Brazilian Real with extenso (simplified)
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Generate hash for signature
  const generateSignatureHash = () => {
    const now = Date.now();
    return `3824331.${now.toString().slice(-8)}`;
  };

  return (
    <div className="bg-white p-12 max-w-4xl mx-auto font-serif text-sm leading-relaxed print:p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <img 
          src={BRASAO_TJPA_URL} 
          alt="Brasão TJPA" 
          className="w-20 mx-auto mb-4"
        />
        <p className="text-base font-bold">PODER JUDICIÁRIO</p>
        <p className="text-sm">Tribunal de Justiça do Estado do Pará</p>
        <p className="text-sm font-semibold">Secretaria de Planejamento e Finanças</p>
        <p className="text-xs text-slate-600">Av. Almirante Barroso, 3089 Cep, 66.613-710 Fone/Fax (091) 3205-3241</p>
      </div>

      {/* Title */}
      <div className="text-left mb-6">
        <p className="text-sm">
          <span className="font-bold">PORTARIA SF Nº</span>{' '}
          <span className="font-black text-lg ml-2">{numeroPortaria}</span>{' '}
          <span className="font-bold">/{anoPortaria}-SEPLAN/TJE</span>
        </p>
      </div>

      {/* Opening paragraph */}
      <div className="mb-6 text-justify text-sm leading-relaxed">
        <p>
          Secretário de Planejamento, Coordenação e Finanças do Tribunal de Justiça do Estado do Pará, 
          no exercício das suas atribuições, estabelecidas na Portaria nº XXXX/2026-GP,
        </p>
      </div>

      {/* RESOLVE */}
      <div className="text-center font-bold mb-6">RESOLVE:</div>

      {/* Articles */}
      <div className="space-y-6">
        {/* Art. 1º */}
        <div>
          <span className="font-bold text-blue-700">Art. 1º</span>{' '}
          Conceder suprimentos de fundos do {tipoSuplemento}. ao servidor(a){' '}
          <strong>{nomeServidor.toUpperCase()}</strong>, portador(a) do CPF nº{' '}
          <strong>{cpfServidor}</strong>, lotado: <strong>{lotacao.toUpperCase()}</strong>
        </div>

        {/* Art. 2º */}
        <div>
          <span className="font-bold text-blue-700">Art. 2º</span>{' '}
          O valor do suprimento de fundos corresponde a{' '}
          <strong>{formatCurrency(valorTotal)}</strong> e deverá atender às despesas miúdas de pronto 
          pagamento a ser creditado na conta corrente, conforme abaixo:
        </div>

        {/* Bank info */}
        <div className="pl-8">
          <p><strong>Banco: {banco} AG: {agencia} C/C: {contaCorrente}</strong></p>
        </div>

        {/* Expense elements with PTRES/Dotação */}
        <div className="pl-8 space-y-1">
          {ptres && (
            <p className="text-xs text-slate-500 mb-2">
              <strong>PTRES:</strong> {ptres} | <strong>Dotação:</strong> {dotacaoPrincipal || '---'}
            </p>
          )}
          {elementosDespesa.map((el, i) => (
            <p key={i}>
              {el.codigo} - {el.descricao} {'.'
                .repeat(Math.max(0, 50 - el.descricao.length - el.codigo.length))} {formatCurrency(el.valor)}
              {el.dotacao && <span className="text-xs text-slate-400 ml-2">(Dot: {el.dotacao})</span>}
            </p>
          ))}
        </div>

        {/* Art. 4º */}
        <div>
          <span className="font-bold text-blue-700">Art. 4º</span>{' '}
          A aplicação e a prestação de contas do valor referido no Artigo 2º desta Portaria deverão 
          observar os prazos a seguir:
        </div>

        <div className="pl-8 space-y-2">
          <p><strong>I - Prazo de Aplicação:</strong> Data desta Portaria até o encerramento do Evento;</p>
          <p>
            <strong>II - Prazo de Prestação de Contas:</strong> até {String(prazoPrestacaoContas).padStart(2, '0')} ({
              prazoPrestacaoContas === 1 ? 'um' :
              prazoPrestacaoContas === 7 ? 'sete' :
              prazoPrestacaoContas === 30 ? 'trinta' :
              prazoPrestacaoContas
            }) dias, a contar do encerramento do prazo previsto no inciso anterior.
          </p>
        </div>

        {/* Registre-se */}
        <div className="text-center mt-8">
          Registre-se e Cumpra-se.
        </div>

        {/* Location and date */}
        <div className="mt-8">
          Belém, {formatDate(dataEmissao)}
        </div>

        {/* Signature blocks */}
        <div className="mt-12 text-center space-y-8">
          {/* Main signature */}
          <div>
            <p className="font-bold text-blue-700 uppercase">{ordenadorDespesa}</p>
            <p className="text-sm">{cargoOrdenador}</p>
          </div>

          {/* Ordenador de Despesa */}
          <div className="pt-4 border-t border-slate-300 max-w-md mx-auto">
            <p className="font-bold">{ordenadorDespesa}</p>
            <p className="text-sm text-blue-700 font-medium">Ordenador de Despesa</p>
            <p className="text-xs text-slate-500">{cargoOrdenador}</p>
          </div>
        </div>

        {/* Footer - signature verification */}
        <div className="mt-12 pt-4 border-t border-slate-300 text-xs text-slate-500 space-y-1">
          <p className="text-amber-600">Assinado com senha por {ordenadorDespesa}.</p>
          <p>Ubs {generateSignatureHash()} - para a consulta à autenticidade em</p>
        </div>
      </div>
    </div>
  );
}

export default PortariaDocument;
