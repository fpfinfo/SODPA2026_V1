import jsPDF from 'jspdf';

// Helper de extenso (simplificado para demonstração, ideal usar lib ou função completa)
const valorPorExtenso = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
    // TODO: Implementar extenso real se necessário (ex: "Cem reais")
}

interface ReciboData {
  nup: string;
  supridoNome: string;
  supridoMatricula: string;
  prestadorNome: string;
  prestadorCPF: string;
  prestadorRG?: string;
  prestadorEndereco?: string;
  dataInicio: string;
  dataFim: string;
  valor: number;
  descricaoTrajeto: string;
  cidade: string;
  dataEmissao: string;
}

export const generateReciboTransportePDF = (
  data: ReciboData
) => {
  const doc = new jsPDF();
  
  // Configs
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  let currentY = 20;

  // -- CABEÇALHO --
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('TRIBUNAL DE JUSTIÇA DO ESTADO DO PARÁ', pageWidth / 2, currentY, { align: 'center' });
  currentY += 8;
  doc.setFontSize(12);
  doc.text('RECIBO DE TRANSPORTE - SUPRIMENTO DE FUNDOS', pageWidth / 2, currentY, { align: 'center' });
  currentY += 15;

  // -- VALOR --
  doc.setLineWidth(0.5);
  doc.rect(margin, currentY, pageWidth - (margin * 2), 15);
  doc.setFontSize(14);
  doc.text(`VALOR: ${valorPorExtenso(data.valor)}`, pageWidth / 2, currentY + 10, { align: 'center' });
  currentY += 25;

  // -- TEXTO DO RECIBO --
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setLineHeightFactor(1.5);

  const texto = `       RECEBI do(a) Sr(a). ${data.supridoNome.toUpperCase()}, matrícula ${data.supridoMatricula}, a importância supramencionada, referente ao pagamento de serviços de TRANSPORTE E LOCOMOÇÃO (Elemento 3.3.90.33), para realização de diligências oficiais nos autos do Processo NUP ${data.nup}.`;
  
  const splitText = doc.splitTextToSize(texto, pageWidth - (margin * 2));
  doc.text(splitText, margin, currentY);
  currentY += (splitText.length * 7) + 10;

  // -- DETALHAMENTO --
  doc.setFont('helvetica', 'bold');
  doc.text('DETALHAMENTO DO SERVIÇO:', margin, currentY);
  currentY += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  
  const detalhes = [
    `Período: ${new Date(data.dataInicio).toLocaleDateString()} a ${new Date(data.dataFim).toLocaleDateString()}`,
    `Trajeto/Descrição: ${data.descricaoTrajeto}`,
    `Prestador: ${data.prestadorNome.toUpperCase()}`,
    `CPF: ${data.prestadorCPF}    RG: ${data.prestadorRG || 'Não informado'}`,
    `Endereço: ${data.prestadorEndereco || 'Não informado'}`
  ];

  detalhes.forEach(line => {
    doc.text(line, margin + 5, currentY);
    currentY += 7;
  });

  currentY += 15;

  // -- DATA E LOCAL --
  doc.text(`${data.cidade}, ${new Date(data.dataEmissao).toLocaleDateString()}`, pageWidth - margin, currentY, { align: 'right' });
  
  currentY += 30;

  // -- ASSINATURA PRESTADOR --
  doc.line(margin + 20, currentY, pageWidth - margin - 20, currentY);
  currentY += 5;
  doc.setFont('helvetica', 'bold');
  doc.text(data.prestadorNome.toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
  currentY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`CPF: ${data.prestadorCPF}`, pageWidth / 2, currentY, { align: 'center' });
  doc.text('Prestador do Serviço (Assinatura)', pageWidth / 2, currentY + 5, { align: 'center' });

  // -- ASSINATURA SUPRIDO (Visto) --
  currentY += 30;
  doc.line(margin + 40, currentY, pageWidth - margin - 40, currentY);
  currentY += 5;
  doc.text(`Visto: ${data.supridoNome.toUpperCase()} (Suprido)`, pageWidth / 2, currentY, { align: 'center' });


  // -- RODAPÉ OCR (METADADOS) --
  // Área reservada para OCR ler facilmente
  currentY = doc.internal.pageSize.height - 30;
  doc.setLineWidth(1);
  doc.setDrawColor(200);
  doc.rect(margin, currentY, pageWidth - (margin * 2), 25);
  
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text('ÁREA RESERVADA PARA PROCESSAMENTO AUTOMÁTICO (OCR) - NÃO RASURAR', pageWidth / 2, currentY + 4, { align: 'center' });
  
  doc.setFont('courier', 'bold');
  doc.setTextColor(0);
  doc.setFontSize(10);
  const ocrString = `DATA:${new Date(data.dataEmissao).toISOString().split('T')[0]}|VAL:${data.valor.toFixed(2)}|CPF:${data.prestadorCPF.replace(/\D/g,'')}|DOC:RECIBO_33`;
  doc.text(ocrString, pageWidth / 2, currentY + 15, { align: 'center' });

  // Save
  doc.save(`Recibo_Transporte_${data.prestadorCPF.substring(0,6)}.pdf`);
};
