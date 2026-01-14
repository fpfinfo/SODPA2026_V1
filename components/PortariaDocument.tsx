import React from 'react';

const BRASAO_TJPA_URL = 'https://www.tjpa.jus.br/images/brasao/brasao-tjpa-400.png';

interface ElementoDespesa {
  codigo: string;
  descricao: string;
  valor: number;
}

interface PortariaDocumentProps {
  numeroPortaria: number;
  anoPortaria: number;
  tipoSuplemento: 'EXTRA-EMERG' | 'SESSÃO DE JÚRI';
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
  cargoOrdenador
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
        <p className="text-lg font-bold">PODER JUDICIÁRIO</p>
        <p className="text-lg font-bold">TRIBUNAL DE JUSTIÇA DO ESTADO DO PARÁ</p>
        <p className="text-sm text-slate-600">Secretaria de Planejamento, Coordenação e Finanças</p>
        <p className="text-xs text-slate-500">Av. Almirante Barroso, 3089 - CEP 66.613-710 - Fone/Fax (091) 3205-3241</p>
      </div>

      {/* Title */}
      <div className="bg-slate-700 text-white text-center py-2 px-4 mb-8 font-bold">
        PORTARIA DE SUPRIMENTO DE FUNDOS Nº {numeroPortaria}/{anoPortaria}-SEPLAN/TJE
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

        {/* Expense elements */}
        <div className="pl-8 space-y-1">
          {elementosDespesa.map((el, i) => (
            <p key={i}>
              {el.codigo} - {el.descricao} {'.'
                .repeat(Math.max(0, 50 - el.descricao.length - el.codigo.length))} {formatCurrency(el.valor)}
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
