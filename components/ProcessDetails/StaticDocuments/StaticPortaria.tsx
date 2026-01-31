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
  // Support both form_data wrapper (dossier) and direct metadata (execution_documents)
  // CRITICAL FIX: Merge root metadata (signature info) with form_data to ensure signed_* fields are available
  const rootMetadata = documentData.metadata || {};
  const formData = rootMetadata.form_data || {};
  const metadata = { ...rootMetadata, ...formData };
  
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
    
    // If it's a full ISO string (like created_at), use Date object to respect local timezone behavior
    if (date.includes('T') && date.length > 10) {
       return new Date(date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    // For plain dates (YYYY-MM-DD), use split to prevent timezone shifts
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

  // Cálculo dos prazos - NOVA LÓGICA: Prazo único de Aplicação e Prestação de Contas
  // Data da emissão da Portaria até (data_fim do formulário + 15 dias)
  const dataEmissao = new Date(documentData.created_at || Date.now());
  const dataFimEvento = processData.end_date ? new Date(processData.end_date) : dataEmissao;
  const prazoAplicacaoPrestacao = new Date(dataFimEvento.getTime() + 15 * 24 * 60 * 60 * 1000); // [SOSFU-UPDATE] Rule: End Date + 15 days

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
          <span className="font-black text-2xl mx-2">
            {(() => {
              const baseNum = (numeroPortaria.includes('/') ? numeroPortaria.split('/')[0] : numeroPortaria).trim();
              return /^\d+$/.test(baseNum) ? baseNum.replace(/^0+/, '').padStart(3, '0') : baseNum;
            })()}
          </span>{' '}
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
          <strong>{processData.suprido_nome || processData.nome || 'N/A'}</strong>, portador do CPF{' '}
          <strong>{processData.servidor_dados?.cpf || processData.suprido_cpf || processData.cpf || '---'}</strong>, lotado na{' '}
          <strong>{processData.lotacao || processData.suprido_lotacao || '---'}</strong>.
        </div>

        {/* Art. 2º - Valor por extenso + Dotações + Dados bancários + Incisos */}
        <div className="leading-loose">
          <span className="font-bold">Art. 2º</span>{' '}
          O valor total do presente Suprimento de Fundos é de{' '}
          <strong>{formatCurrency(valorTotal)}</strong>{' '}
          <strong>({valorPorExtenso(valorTotal)})</strong>, e deverá atender às despesas miúdas de pronto pagamento 
          e ser creditado na conta corrente, abaixo:
        </div>
        
        {/* Parágrafo único - Dados bancários */}
        <div className="pl-8 leading-loose"> {' '}
          Dados bancários para crédito{usarDadosComarca ? ' (Comarca)' : ''}: 
          Banco <strong>{bancoDados.banco}</strong>, 
          Agência <strong>{bancoDados.agencia}</strong>, 
          Conta Corrente <strong>{bancoDados.conta}</strong>.
        </div>
        
        

        {/* Art. 3º - Classificação orçamentária */}
        <div className="leading-loose">
          <span className="font-bold">Art. 3º</span>{' '}
          A despesa a que se refere o item anterior ocorrerá por conta de recursos próprios do Tribunal de Justiça do Estado - TJE/PA e terá a classificação PTRES <strong>{ptresCode || '---'}</strong> e {allDotacoes.length > 1 ? 'Dotações' : 'Dotação'} <strong>{allDotacoes.join(', ')}</strong>, nos seguintes elementos:
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
        

        {/* Art. 4º - Prazo único de Aplicação e Prestação de Contas */}
        <div className="leading-loose">
          <span className="font-bold">Art. 4º</span>{' '}
          A aplicação e a prestação de contas do valor referido no Artigo 2º desta Portaria deverão ser realizadas no seguinte prazo:
        </div>

        <div className="pl-8 space-y-2">
          <div className="leading-relaxed">
            <strong>Parágrafo único</strong> – Prazo de Aplicação e Prestação de Contas:{' '}
            <strong>{formatDateShort(documentData.created_at)}</strong> até{' '}
            <strong>{formatDateShort(prazoAplicacaoPrestacao.toISOString())}</strong>.
          </div>

          <div className="leading-relaxed">
            <strong>Registre-se e Cumpra-se.</strong> </div>
        </div>

        {/* Location and date */}
        <div className="mt-12 text-left">
          Belém-PA, {formatDate(documentData.created_at)}.
        </div>

        {/* Signature */}
        <div className="mt-16 text-center space-y-4">
          <div className="pt-4 border-t border-slate-400 max-w-md mx-auto">
            <p className="text-sm font-semibold">Ordenador de Despesa</p>
            <p className="text-xs text-slate-600">Secretaria de Planejamento, Coordenação e Finanças</p>
          </div>
        </div>

        {/* Digital signature notice - Show when document is signed */}
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
                    {metadata.signer_role || metadata.footer?.signerRole || 'Secretaria de Planejamento, Coordenação e Finanças'}
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
