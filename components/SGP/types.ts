// SGP Module Types

export interface SgpAnalyst {
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

export interface SgpRequest {
  id: string;
  protocol: string;
  type: 'PASSAGEM' | 'DIARIA' | 'MISTA';
  category?: string;
  requesterName: string;
  requesterSector: string;
  requesterMatricula?: string;
  dateCreated: string;
  status: string;
  description: string;
  destination?: string;
  isInterstate?: boolean;
  value: number;
  deadline?: string;
  erpStatus?: 'ACTIVE' | 'VACATION' | 'LEAVE' | 'BANK_ERROR';
  assignedTo?: string;
}

// Equipe SGP
export const SGP_TEAM: SgpAnalyst[] = [
  {
    id: 'sgp1',
    name: 'Ana Neri',
    email: 'sgp01@tjpa.jus.br',
    role: 'sgp',
    cargo: 'Coordenadora de Gestão de Pessoas',
    activeProcesses: 8,
    capacity: 60,
    delayedItems: 1,
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop',
    isActive: true
  },
  {
    id: 'sgp2',
    name: 'Carlos Eduardo Lima',
    email: 'sgp02@tjpa.jus.br',
    role: 'sgp',
    cargo: 'Analista de RH',
    activeProcesses: 5,
    capacity: 40,
    delayedItems: 0,
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop',
    isActive: true
  },
  {
    id: 'sgp3',
    name: 'Fernanda Souza',
    email: 'sgp03@tjpa.jus.br',
    role: 'sgp',
    cargo: 'Analista de RH',
    activeProcesses: 3,
    capacity: 25,
    delayedItems: 0,
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop',
    isActive: true
  }
];

// Mock requests for SGP (those awaiting functional validation)
export const MOCK_SGP_REQUESTS: SgpRequest[] = [
  {
    id: 'sgp1',
    protocol: 'TJPA-DIA-2024-5003',
    type: 'DIARIA',
    category: 'TÉCNICO',
    requesterName: 'João Souza',
    requesterSector: 'TI - Infraestrutura',
    requesterMatricula: '550192-3',
    dateCreated: '2024-02-03T09:00:00Z',
    status: 'EM_ANALISE_SGP',
    description: 'Manutenção de servidores em Castanhal (Terrestre).',
    destination: 'Castanhal - PA',
    isInterstate: false,
    value: 250.00,
    deadline: '2024-02-10',
    erpStatus: 'ACTIVE',
    assignedTo: 'sgp1'
  },
  {
    id: 'sgp2',
    protocol: 'TJPA-DIA-2024-5015',
    type: 'DIARIA',
    category: 'ORDINÁRIO',
    requesterName: 'Carlos Ferreira',
    requesterSector: 'Comarca de Breves',
    requesterMatricula: '550210-8',
    dateCreated: '2024-02-04T09:00:00Z',
    status: 'EM_ANALISE_SGP',
    description: 'Treinamento de equipe local.',
    destination: 'Breves - PA',
    isInterstate: false,
    value: 600.00,
    deadline: '2024-02-12',
    erpStatus: 'VACATION' // Conflito com férias
  },
  {
    id: 'sgp3',
    protocol: 'TJPA-DIA-2024-5018',
    type: 'DIARIA',
    category: 'TÉCNICO',
    requesterName: 'Amanda Lima',
    requesterSector: 'Engenharia',
    requesterMatricula: '550225-4',
    dateCreated: '2024-02-04T11:00:00Z',
    status: 'EM_ANALISE_SGP',
    description: 'Vistoria em obra parada.',
    destination: 'Marituba - PA',
    isInterstate: false,
    value: 150.00,
    deadline: '2024-02-08',
    erpStatus: 'BANK_ERROR' // Erro bancário
  },
  {
    id: 'sgp4',
    protocol: 'TJPA-DIA-2024-5022',
    type: 'DIARIA',
    category: 'ORDINÁRIO',
    requesterName: 'Patricia Mendes',
    requesterSector: 'Corregedoria',
    requesterMatricula: '550301-2',
    dateCreated: '2024-02-05T14:00:00Z',
    status: 'EM_ANALISE_SGP',
    description: 'Correição ordinária na Comarca de Tucuruí.',
    destination: 'Tucuruí - PA',
    isInterstate: false,
    value: 480.00,
    deadline: '2024-02-15',
    erpStatus: 'ACTIVE',
    assignedTo: 'sgp2'
  },
  {
    id: 'sgp5',
    protocol: 'TJPA-DIA-2024-5028',
    type: 'DIARIA',
    category: 'TÉCNICO',
    requesterName: 'Roberto Nascimento',
    requesterSector: 'Secretaria Judiciária',
    requesterMatricula: '550340-5',
    dateCreated: '2024-02-06T08:30:00Z',
    status: 'EM_ANALISE_SGP',
    description: 'Capacitação em gestão processual.',
    destination: 'Santarém - PA',
    isInterstate: false,
    value: 720.00,
    deadline: '2024-02-20',
    erpStatus: 'ACTIVE'
  }
];
