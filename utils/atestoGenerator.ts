
export const generateAtestoContent = (process: { 
  nup: string; 
  interested: string; 
  suprido_nome?: string;
  nup_formatted?: string;
}) => {
  const interestedName = process.interested || process.suprido_nome || 'Servidor';
  const nup = process.nup || process.nup_formatted || 'N/A';

  return `CERTIDÃO DE ATESTO DA CHEFIA IMEDIATA

CERTIFICO, no uso das minhas atribuições legais e em conformidade com o Regulamento de Suprimento de Fundos do TJPA, que a despesa pretendida pelo servidor ${interestedName} no processo ${nup} reveste-se de interesse público e atende aos critérios de conveniência e oportunidade desta unidade judiciária.

Declaro que verifiquei a disponibilidade orçamentária da unidade e a adequação dos itens solicitados.

Atesto, ainda, a impossibilidade de atendimento da demanda via fluxo normal de compras/licitação em tempo hábil.

Encaminhe-se ao Serviço de Suprimento de Fundos (SOSFU) para análise técnica.`;
};

export const generateAtestoTitle = () => {
    // In a real app, this would fetch the next sequence number from sequence_generator table
    // For now, we simulate a sequence
    const year = new Date().getFullYear();
    const randomSeq = Math.floor(Math.random() * 900) + 100; 
    return `Certidão de Atesto Nº ${randomSeq}/${year}`;
};
