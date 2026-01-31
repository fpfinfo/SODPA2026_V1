// SEFIN Module Types

export interface SefinOrdenador {
  id: string;
  name: string;
  email: string;
  role: string;
  cargo: string;
  activeProcesses: number;
  capacity: number;
  delayedItems: number;
  avatarUrl: string;
  isActive?: boolean;
}

export interface SefinRequest {
  id: string;
  protocol: string;
  type: 'PASSAGEM' | 'DIARIA' | 'MISTA';
  category?: string;
  requesterName: string;
  requesterSector: string;
  dateCreated: string;
  status: string;
  description: string;
  destination?: string;
  isInterstate?: boolean;
  value: number;
  deadline?: string;
  legalOpinion?: string;
  legalOpinionAuthor?: string;
  assignedTo?: string;
  expenseAuthorizedBy?: string;
}

// Ordenadores de Despesa oficiais
export const SEFIN_ORDENADORES: SefinOrdenador[] = [
  {
    id: 'ord1',
    name: 'Anailton Paulo de Alencar',
    email: 'ordenador01@tjpa.jus.br',
    role: 'sefin',
    cargo: 'Ordenador de Despesas',
    activeProcesses: 5,
    capacity: 40,
    delayedItems: 0,
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop',
    isActive: true
  },
  {
    id: 'ord2',
    name: 'Miguel Lucivaldo Alves Santos',
    email: 'ordenador02@tjpa.jus.br',
    role: 'sefin',
    cargo: 'Ordenador de Despesas Substituto',
    activeProcesses: 0,
    capacity: 0,
    delayedItems: 0,
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop',
    isActive: false
  }
];

// Mock requests for SEFIN (those awaiting signature)
export const MOCK_SEFIN_REQUESTS: SefinRequest[] = [
  {
    id: 'sf1',
    protocol: 'TJPA-INT-2024-5004',
    type: 'PASSAGEM',
    category: 'ORDINÁRIO',
    requesterName: 'Roberto Almeida',
    requesterSector: 'Auditoria',
    dateCreated: '2024-02-01T11:00:00Z',
    status: 'AGUARDANDO_ASSINATURA_SEFIN',
    description: 'Auditoria na Comarca de Marabá.',
    destination: 'Marabá - PA',
    isInterstate: false,
    value: 1500.00,
    deadline: '2024-02-25',
    legalOpinion: 'MINUTA DE AUTORIZAÇÃO\n\nReferência: Processo TJPA-INT-2024-5004\nInteressado: Roberto Almeida (Auditoria)\nDestino: Marabá - PA\n\n1. Trata-se de solicitação de passagens aéreas para deslocamento a serviço em território estadual.\n\n2. A despesa está em conformidade com a Resolução nº 01/2023-TJPA, havendo disponibilidade orçamentária.\n\n3. OPINO pelo DEFERIMENTO do pedido, encaminhando-se os autos à SEFIN para autorização.\n\nBelém, 04 de Fevereiro de 2024.',
    legalOpinionAuthor: 'Dr. Carlos Drummond',
    assignedTo: 'ord1'
  },
  {
    id: 'sf2',
    protocol: 'TJPA-DIA-2024-5010',
    type: 'DIARIA',
    category: 'TÉCNICO',
    requesterName: 'Ana Paula Costa',
    requesterSector: 'Corregedoria',
    dateCreated: '2024-02-02T09:00:00Z',
    status: 'AGUARDANDO_ASSINATURA_SEFIN',
    description: 'Inspeção ordinária na Comarca de Altamira.',
    destination: 'Altamira - PA',
    isInterstate: false,
    value: 820.00,
    deadline: '2024-02-18',
    legalOpinion: 'MINUTA DE AUTORIZAÇÃO\n\nReferência: Processo TJPA-DIA-2024-5010\nInteressado: Ana Paula Costa (Corregedoria)\n\n1. Certifico a regularidade do pedido de diárias para inspeção ordinária.\n\n2. A concessão ampara-se na Resolução nº 01/2023-TJPA.\n\nBelém, 05 de Fevereiro de 2024.',
    legalOpinionAuthor: 'Dra. Cecília Meireles',
    assignedTo: 'ord1'
  },
  {
    id: 'sf3',
    protocol: 'TJPA-MIS-2024-5015',
    type: 'MISTA',
    category: 'MAGISTRADO',
    requesterName: 'Des. Fernando Brandão',
    requesterSector: 'Gabinete 3ª Câmara Cível',
    dateCreated: '2024-02-03T14:30:00Z',
    status: 'AGUARDANDO_ASSINATURA_SEFIN',
    description: 'Participação em sessão do FONAJE em São Paulo.',
    destination: 'São Paulo - SP',
    isInterstate: true,
    value: 4200.00,
    deadline: '2024-02-28',
    legalOpinion: 'MINUTA DE AUTORIZAÇÃO (Magistratura)\n\nReferência: Processo TJPA-MIS-2024-5015\nExcelentíssimo Senhor Desembargador: Fernando Brandão\n\n1. Certifico a regularidade do pedido de deslocamento institucional.\n\n2. A concessão ampara-se no Art. 5º do Regimento Interno e na LOMAN.\n\nBelém, 06 de Fevereiro de 2024.',
    legalOpinionAuthor: 'Dr. Mario Quintana'
  },
  {
    id: 'sf4',
    protocol: 'TJPA-INT-2024-5020',
    type: 'PASSAGEM',
    category: 'ORDINÁRIO',
    requesterName: 'Carla Montenegro',
    requesterSector: 'Secretaria Judiciária',
    dateCreated: '2024-02-04T10:00:00Z',
    status: 'AGUARDANDO_ASSINATURA_SEFIN',
    description: 'Capacitação em gestão processual.',
    destination: 'Santarém - PA',
    isInterstate: false,
    value: 980.00,
    deadline: '2024-03-01',
    legalOpinion: 'MINUTA DE AUTORIZAÇÃO\n\nCertifico a regularidade do pedido.\n\nBelém, 07 de Fevereiro de 2024.',
    legalOpinionAuthor: 'Dra. Cora Coralina'
  },
  {
    id: 'sf5',
    protocol: 'TJPA-DIA-2024-5025',
    type: 'DIARIA',
    category: 'TÉCNICO',
    requesterName: 'Pedro Henrique Lima',
    requesterSector: 'TI - Infraestrutura',
    dateCreated: '2024-02-05T08:30:00Z',
    status: 'AGUARDANDO_ASSINATURA_SEFIN',
    description: 'Manutenção de datacenter em Belém.',
    destination: 'Belém - PA',
    isInterstate: false,
    value: 350.00,
    deadline: '2024-02-20',
    legalOpinion: 'MINUTA DE AUTORIZAÇÃO\n\nDeferido conforme normativas vigentes.\n\nBelém, 08 de Fevereiro de 2024.',
    legalOpinionAuthor: 'Dr. Guimarães Rosa',
    assignedTo: 'ord1'
  }
];
