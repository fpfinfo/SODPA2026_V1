export interface PortariaData {
  portariaNumero: string; // ex: 001/2026-GAB
  dataEmissao: string;
  cidadeComarca: string;
  
  gestorNome: string;
  gestorCargo: string; // Juiz de Direito e Diretor do Fórum
  unidadeNome: string;
  
  novoSupridoNome: string;
  novoSupridoCargo: string;
  novoSupridoMatricula: string;
  novoSupridoCPF: string;
  
  antigoSupridoNome?: string; // Opcional, se houver substituição
  
  ptres: string[]; // ['8193', '8163']
  dataEfeito: string;
}

export const generatePortariaText = (data: PortariaData): string => {
  const ptresTexto = data.ptres.map(p => 
    p === '8193' ? 'Suprimento de Fundos Ordinário (PTRES 8193)' : 
    p === '8163' ? 'Despesas Extraordinárias do Tribunal do Júri (PTRES 8163)' : p
  ).join(' e ');

  const dataExtenso = new Date(data.dataEmissao).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  const dataEfeitoExtenso = new Date(data.dataEfeito).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

  return `
ESTADO DO PARÁ
PODER JUDICIÁRIO
COMARCA DE ${data.cidadeComarca.toUpperCase()}
DIRETORIA DO FÓRUM

PORTARIA Nº ${data.portariaNumero}

O(A) Doutor(a) ${data.gestorNome.toUpperCase()}, ${data.gestorCargo} da Comarca de ${data.cidadeComarca}, no uso de suas atribuições legais, etc.

CONSIDERANDO a necessidade de designação de servidor para atuar como responsável pelo Suprimento de Fundos desta Comarca;
CONSIDERANDO o disposto na Resolução nº 007/2018-GP, que regulamenta a concessão de Suprimento de Fundos no âmbito do Poder Judiciário do Estado do Pará;

RESOLVE:

Art. 1º DESIGNAR o(a) servidor(a) ${data.novoSupridoNome.toUpperCase()}, ocupante do cargo de ${data.novoSupridoCargo}, matrícula nº ${data.novoSupridoMatricula}, CPF nº ${data.novoSupridoCPF}, para atuar como SUPRIDO(A) responsável pela movimentação dos recursos de ${ptresTexto} desta Comarca de ${data.cidadeComarca}.

${data.antigoSupridoNome ? `Art. 2º CESSAR os efeitos da designação anterior do(a) servidor(a) ${data.antigoSupridoNome.toUpperCase()}.` : ''}

Art. ${data.antigoSupridoNome ? '3º' : '2º'} Esta Portaria entra em vigor na data de ${dataEfeitoExtenso}, revogadas as disposições em contrário.

Dê-se ciência, publique-se e cumpra-se.

Gabinete da Diretoria do Fórum de ${data.cidadeComarca}, em ${dataExtenso}.



___________________________________________________
${data.gestorNome.toUpperCase()}
${data.gestorCargo}
`.trim();
};
