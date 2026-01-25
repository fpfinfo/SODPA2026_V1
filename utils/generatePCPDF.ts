import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
// Local formatters used below

// Tipagem básica para os dados
interface PCData {
  nup: string;
  suprido: string;
  valorConcedido: number;
  unidade: string;
  periodo: string;
}

interface ComprovantePDF {
  data: string;
  fornecedor: string;
  documento: string; // NF/Recibo + Numero
  valor: number;
  natureza: string; // Elemento
}

interface TotaisPDF {
  gasto: number;
  inss: number;
  iss: number;
  devolvido: number;
  saldo: number;
}

const formatBRL = (val: number) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

export const generatePCPDF = (
  pcData: PCData,
  comprovantes: ComprovantePDF[],
  totais: TotaisPDF
) => {
  const doc = new jsPDF();
  
  // Configs
  const pageWidth = doc.internal.pageSize.width;
  const margin = 14;
  let currentY = 20;

  // 1. Cabeçalho
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TRIBUNAL DE JUSTIÇA DO ESTADO DO PARÁ', pageWidth / 2, currentY, { align: 'center' });
  currentY += 6;
  doc.setFontSize(10);
  doc.text('SECRETARIA DE FINANÇAS - SEFIN', pageWidth / 2, currentY, { align: 'center' });
  currentY += 6;
  doc.text('COORDENADORIA DE CONTROLE INTERNO', pageWidth / 2, currentY, { align: 'center' });
  currentY += 15;

  doc.setFontSize(14);
  doc.text('PRESTAÇÃO DE CONTAS - SUPRIMENTO DE FUNDOS', pageWidth / 2, currentY, { align: 'center' });
  currentY += 15;

  // 2. Dados do Processo
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const leftCol = margin;
  const rightCol = pageWidth / 2 + 10;

  doc.text(`Processo (NUP): ${pcData.nup}`, leftCol, currentY);
  doc.text(`Unidade: ${pcData.unidade}`, rightCol, currentY);
  currentY += 6;
  doc.text(`Suprido: ${pcData.suprido}`, leftCol, currentY);
  doc.text(`Período: ${pcData.periodo}`, rightCol, currentY);
  currentY += 6;
  doc.text(`Valor Concedido: ${formatBRL(pcData.valorConcedido)}`, leftCol, currentY);
  currentY += 10;

  // 3. Tabela de Despesas
  doc.setFont('helvetica', 'bold');
  doc.text('RELAÇÃO DE DESPESAS', margin, currentY);
  currentY += 4;

  const tableData = comprovantes.map(c => [
    new Date(c.data).toLocaleDateString('pt-BR'),
    c.fornecedor,
    c.documento,
    c.natureza,
    formatBRL(c.valor)
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Data', 'Fornecedor/Prestador', 'Documento', 'Natureza', 'Valor']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [44, 62, 80], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
        0: { cellWidth: 20 },
        4: { halign: 'right' }
    },
    foot: [['TOTAL', '', '', '', formatBRL(totais.gasto)]],
    footStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold', halign: 'right' }
  });

  // @ts-ignore
  currentY = doc.lastAutoTable.finalY + 15;

  // 4. Resumo Financeiro
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMO DA PRESTAÇÃO DE CONTAS', margin, currentY);
  currentY += 8;

  const resumoData = [
    ['(+) Valor Concedido', formatBRL(pcData.valorConcedido)],
    ['(-) Total de Despesas', formatBRL(totais.gasto)],
    ['(-) Valores Recolhidos (INSS/ISS)', formatBRL(totais.inss + totais.iss)],
    ['(-) Saldo Devolvido (GDR)', formatBRL(totais.devolvido)],
    ['(=) DIFICERENÇA/SALDO', formatBRL(pcData.valorConcedido - (totais.gasto + totais.devolvido))] // Simplificado
  ];

  autoTable(doc, {
    startY: currentY,
    body: resumoData,
    theme: 'plain',
    columnStyles: {
        0: { cellWidth: 80, fontStyle: 'bold' },
        1: { halign: 'right' }
    }
  });

  // @ts-ignore
  currentY = doc.lastAutoTable.finalY + 20;

  // 5. Declaração
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const declarationText = "DECLARO, sob as penas da lei, que as despesas relacionadas foram realizadas para o estrito cumprimento das atividades institucionais e que os documentos comprobatórios são autênticos.";
  
  const splitText = doc.splitTextToSize(declarationText, pageWidth - (margin * 2));
  doc.text(splitText, margin, currentY);
  currentY += 30;

  // 6. Assinaturas
  doc.setLineWidth(0.5);
  doc.line(pageWidth / 4, currentY, (pageWidth / 4) * 3, currentY); // Line centered
  currentY += 5;
  
  doc.setFontSize(10);
  doc.text(pcData.suprido.toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
  currentY += 5;
  doc.text('Servidor Suprido', pageWidth / 2, currentY, { align: 'center' });

  // Rodapé
  const pageCount = doc.getNumberOfPages();
  for(let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Gerado digitalmente pelo Sistema SOSFU em ${new Date().toLocaleDateString()}`, margin, doc.internal.pageSize.height - 10);
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin, doc.internal.pageSize.height - 10, { align: 'right' });
  }

  // Save
  doc.save(`PC_${pcData.nup}_${new Date().toISOString().split('T')[0]}.pdf`);
};
