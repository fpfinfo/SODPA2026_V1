import React from 'react';

interface StaticPortariaProps {
  processData: any;
  documentData: any;
}

// Mapeamento de códigos de elemento para descrições
const ELEMENT_LABELS: Record<string, string> = {
  '3.3.90.30': 'Material de Consumo',
  '3.3.90.30.01': 'Material de Consumo',
  '3.3.90.30.02': 'Combustíveis e Lubrificantes',
  '3.3.90.33': 'Passagens e Despesas com Locomoção',
  '3.3.90.36': 'Outros Serviços de Terceiros – Pessoa Física',
  '3.3.90.39': 'Outros Serviços de Terceiros – Pessoa Jurídica',
};

// Função para converter valor numérico em extenso
const valorPorExtenso = (valor: number): string => {
  const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
  const especiais = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

  const converteGrupo = (n: number): string => {
    if (n === 0) return '';
    if (n === 100) return 'cem';
    
    let resultado = '';
    const c = Math.floor(n / 100);
    const resto = n % 100;
    
    if (c > 0) {
      resultado = centenas[c];
      if (resto > 0) resultado += ' e ';
    }
    
    if (resto >= 10 && resto <= 19) {
      resultado += especiais[resto - 10];
    } else {
      const d = Math.floor(resto / 10);
      const u = resto % 10;
      if (d > 0) {
        resultado += dezenas[d];
        if (u > 0) resultado += ' e ';
      }
      if (u > 0) {
        resultado += unidades[u];
      }
    }
    return resultado;
  };

  if (valor === 0) return 'zero reais';
  
  const inteiro = Math.floor(valor);
  const centavos = Math.round((valor - inteiro) * 100);
  
  let resultado = '';
  
  // Milhares
  const milhares = Math.floor(inteiro / 1000);
  const resto = inteiro % 1000;
  
  if (milhares > 0) {
    if (milhares === 1) {
      resultado = 'mil';
    } else {
      resultado = converteGrupo(milhares) + ' mil';
    }
    if (resto > 0 && resto < 100) {
      resultado += ' e ';
    } else if (resto >= 100) {
      resultado += ' ';
    }
  }
  
  if (resto > 0) {
    resultado += converteGrupo(resto);
  }
  
  // Reais
  if (inteiro === 1) {
    resultado += ' real';
  } else if (inteiro > 0) {
    resultado += ' reais';
  }
  
  // Centavos
  if (centavos > 0) {
    if (inteiro > 0) resultado += ' e ';
    resultado += converteGrupo(centavos);
    resultado += centavos === 1 ? ' centavo' : ' centavos';
  }
  
  return resultado.trim();
};

// Parse items from processData (may be JSON string)
const parseItens = (data: any): any[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

export const StaticPortaria: React.FC<StaticPortariaProps> = ({ processData, documentData }) => {
  const metadata = documentData.metadata?.form_data || {};
  
  // Parse expense items and sort by element code
  const rawItens = parseItens(processData.itens_despesa || processData.items);
  const itens = [...rawItens].sort((a, b) => {
    const codeA = a.element || a.codigo || a.elemento || '';
    const codeB = b.element || b.codigo || b.elemento || '';
    return codeA.localeCompare(codeB);
  });
  
  // Get dotações from metadata (may be Record or single string)
  const dotacoes = metadata.dotacoes || {};
  const dotacoesArray = Object.values(dotacoes).filter(Boolean) as string[];
  const dotacaoSingle = metadata.dotacao_code;
  const allDotacoes = dotacoesArray.length > 0 ? dotacoesArray : (dotacaoSingle ? [dotacaoSingle] : ['---']);
  
  // PTRES para lógica de dados bancários
  const ptresCode = metadata.ptres_code || processData.ptres_code || '';
  
  // Lógica: Se PTRES 8193 ou 8163 → Dados da Comarca, senão → Dados do Suprido
  const usarDadosComarca = ptresCode === '8193' || ptresCode === '8163';
  
  // Dados bancários
  const bancoDados = usarDadosComarca ? {
    banco: processData.comarca_banco || processData.lotacao_banco || '---',
    agencia: processData.comarca_agencia || processData.lotacao_agencia || '---',
    conta: processData.comarca_conta || processData.lotacao_conta_corrente || '---',
    titular: processData.lotacao || processData.comarca_nome || 'Comarca'
  } : {
    banco: processData.banco || processData.suprido_banco || '---',
    agencia: processData.agencia || processData.suprido_agencia || '---',
    conta: processData.conta_corrente || processData.suprido_conta || '---',
    titular: processData.suprido_nome || 'Suprido'
  };
  
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

  const formatDateShort = (date?: string) => {
    if (!date) return new Date().toLocaleDateString('pt-BR');
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value?: number) => {
    if (!value && value !== 0) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));
  };

  const numeroPortaria = metadata.numero_portaria || '---';
  const anoPortaria = new Date(documentData.created_at || Date.now()).getFullYear();
  const valorTotal = processData.valor_total || processData.value || 0;

  // Cálculo dos prazos
  const dataEmissao = new Date(documentData.created_at || Date.now());
  const dataFimEvento = processData.end_date ? new Date(processData.end_date) : new Date(dataEmissao.getTime() + 90 * 24 * 60 * 60 * 1000);
  const dataLimitePrestacao = new Date(dataFimEvento.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Formatação das dotações para Art. 2°
  const formatDotacoes = () => {
    if (allDotacoes.length === 1) {
      return <strong>{allDotacoes[0]}</strong>;
    } else if (allDotacoes.length === 2) {
      return <><strong>{allDotacoes[0]}</strong> e <strong>{allDotacoes[1]}</strong></>;
    } else {
      return (
        <>
          {allDotacoes.slice(0, -1).map((d, i) => (
            <span key={i}><strong>{d}</strong>{i < allDotacoes.length - 2 ? ', ' : ''}</span>
          ))}
          {' e '}<strong>{allDotacoes[allDotacoes.length - 1]}</strong>
        </>
      );
    }
  };

  // Numerais romanos para incisos
  const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

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
        {/* Art. 1º - Com múltiplas dotações */}
        <div className="leading-loose">
          <span className="font-bold">Art. 1º</span>{' '}
          AUTORIZAR a concessão de Suprimento de Fundos ao servidor{' '}
          <strong>{processData.suprido_nome || 'N/A'}</strong>, a ser executado através do PTRES{' '}
          <strong>{metadata.ptres_code || '8727'}</strong> e {allDotacoes.length > 1 ? 'Dotações Orçamentárias' : 'Dotação Orçamentária'}{' '}
          {formatDotacoes()}, conforme especificações constantes no NUP{' '}
          <strong>{processData.nup || 'TJPA-EXT-2026-7128'}</strong>.
        </div>

        {/* Art. 2º - Valor por extenso + Dotações + Dados bancários + Incisos */}
        <div className="leading-loose">
          <span className="font-bold">Art. 2º</span>{' '}
          O valor total do presente Suprimento de Fundos é de{' '}
          <strong>{formatCurrency(valorTotal)}</strong>{' '}
          <strong>({valorPorExtenso(valorTotal)})</strong>, nas{' '}
          {allDotacoes.length > 1 ? 'Dotações Orçamentárias' : 'Dotação Orçamentária'}{' '}
          {formatDotacoes()}, e deverá atender às despesas miúdas de pronto pagamento 
          e ser creditado na conta corrente, abaixo:
        </div>
        
        {/* Parágrafo único - Dados bancários */}
        <div className="pl-8 leading-loose">
          <strong>Parágrafo único.</strong>{' '}
          Dados bancários para crédito{usarDadosComarca ? ' (Comarca)' : ''}: 
          Banco <strong>{bancoDados.banco}</strong>, 
          Agência <strong>{bancoDados.agencia}</strong>, 
          Conta Corrente <strong>{bancoDados.conta}</strong>.
        </div>
        
        {/* Incisos com elementos de despesa - Ordenados por código */}
        {itens.length > 0 && (
          <div className="pl-8 space-y-2">
            {itens.map((item: any, index: number) => {
              const codigo = item.element || item.codigo || item.elemento || '3.3.90.30';
              const descricao = ELEMENT_LABELS[codigo] || item.descricao || item.description || 'Despesa';
              const valor = item.total || (item.qty || item.quantity || 1) * (item.val || item.value || item.unitValue || 0);
              
              return (
                <div key={index} className="leading-relaxed">
                  <strong>{romanNumerals[index] || (index + 1)}</strong> – {codigo} – {descricao}: <strong>{formatCurrency(valor)}</strong>
                </div>
              );
            })}
          </div>
        )}

        {/* Art. 3º - Prazos com incisos */}
        <div className="leading-loose">
          <span className="font-bold">Art. 3º</span>{' '}
          Os prazos para execução e prestação de contas são os seguintes:
        </div>
        
        <div className="pl-8 space-y-2">
          <div className="leading-relaxed">
            <strong>I</strong> – Prazo de Aplicação: de <strong>{formatDateShort(documentData.created_at)}</strong> a{' '}
            <strong>{formatDateShort(processData.end_date)}</strong>;
          </div>
          <div className="leading-relaxed">
            <strong>II</strong> – Prazo para Prestação de Contas: até <strong>{formatDateShort(dataLimitePrestacao.toISOString())}</strong>{' '}
            (7 dias após o término do prazo de aplicação).
          </div>
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
