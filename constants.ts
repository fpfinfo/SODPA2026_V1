import { Request, TeamMember, User } from './types';

// Usuário atual simulado (Alterne o ID/Role aqui para testar diferentes visões)
export const CURRENT_USER: User = {
  id: 'sefin_sec', 
  name: 'Dr. Machado de Assis', 
  role: 'SEFIN', 
  registration: '102030',
  position: 'Secretário de Finanças',
  avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop'
};

/*
// Previously used AJSEFIN User
export const CURRENT_USER_OLD: User = {
  id: 'aj_coord', 
  name: 'Dra. Clarice Lispector', 
  role: 'AJSEFIN', 
  registration: '882910',
  position: 'Coordenadora Jurídica',
  avatarUrl: 'https://picsum.photos/id/1062/200/200'
};
*/

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'tm1',
    name: 'Fabio Pereira de Freitas',
    role: 'SODPA',
    function: 'GOVERNANCE',
    activeProcesses: 8,
    capacity: 80,
    delayedItems: 1,
    avatarUrl: 'https://picsum.photos/id/1005/200/200'
  },
  {
    id: 'tm2',
    name: 'Ana Clara Souza',
    role: 'SODPA',
    function: 'FINANCIAL',
    activeProcesses: 12,
    capacity: 95,
    delayedItems: 3,
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop'
  },
  {
    id: 'tm3',
    name: 'Roberto Carlos',
    role: 'SODPA',
    function: 'TICKETING',
    activeProcesses: 5,
    capacity: 40,
    delayedItems: 0,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop'
  }
];

// Equipe Jurídica (6 Assessores)
export const AJSEFIN_TEAM: TeamMember[] = [
    {
      id: 'aj1', name: 'Dr. Carlos Drummond', role: 'SODPA', // Reusing Type structure
      function: 'Assessor Jurídico I', activeProcesses: 12, capacity: 95, delayedItems: 3,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop'
    },
    {
      id: 'aj2', name: 'Dra. Cecília Meireles', role: 'SODPA',
      function: 'Assessor Jurídico II', activeProcesses: 4, capacity: 30, delayedItems: 0,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop'
    },
    {
      id: 'aj3', name: 'Dr. Mario Quintana', role: 'SODPA',
      function: 'Assessor Jurídico III', activeProcesses: 8, capacity: 65, delayedItems: 0,
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop'
    },
    {
      id: 'aj4', name: 'Dra. Cora Coralina', role: 'SODPA',
      function: 'Assessor Jurídico IV', activeProcesses: 2, capacity: 15, delayedItems: 0,
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop'
    },
    {
      id: 'aj5', name: 'Dr. Guimarães Rosa', role: 'SODPA',
      function: 'Assessor Jurídico V', activeProcesses: 10, capacity: 85, delayedItems: 1,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop'
    },
    {
      id: 'aj6', name: 'Dra. Rachel de Queiroz', role: 'SODPA',
      function: 'Assessor Jurídico VI', activeProcesses: 5, capacity: 40, delayedItems: 0,
      avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop'
    }
];

export const MOCK_REQUESTS: Request[] = [
  // 1. Fluxo Interestadual -> Vai para Presidência
  {
    id: 'r1',
    protocol: 'TJPA-EXT-2024-5001',
    type: 'PASSAGEM',
    category: 'MAGISTRADO',
    requesterName: 'Des. Antonio Santos',
    requesterSector: 'Gabinete Desembargador',
    dateCreated: '2024-02-01T10:00:00Z',
    status: 'EM_ANALISE_PRESIDENCIA',
    description: 'Viagem para Brasília (CNJ).',
    destination: 'Brasília - DF',
    isInterstate: true,
    value: 2500.00,
    deadline: '2024-02-20'
  },
  // 2. Fluxo Estadual com Passagem -> Vai para AJSEFIN
  {
    id: 'r2',
    protocol: 'TJPA-INT-2024-5002',
    type: 'PASSAGEM',
    category: 'ORDINÁRIO',
    requesterName: 'Maria Silva',
    requesterSector: 'Secretaria Geral',
    dateCreated: '2024-02-02T14:30:00Z',
    status: 'EM_ANALISE_AJSEFIN',
    description: 'Visita técnica urgente em Santarém (Aéreo Necessário).',
    destination: 'Santarém - PA',
    isInterstate: false,
    value: 1200.00,
    deadline: '2024-02-15'
  },
  // 3. Fluxo Estadual Apenas Diária -> Vai para SGP
  {
    id: 'r3',
    protocol: 'TJPA-DIA-2024-5003',
    type: 'DIARIA',
    category: 'TÉCNICO',
    requesterName: 'João Souza',
    requesterSector: 'TI',
    dateCreated: '2024-02-03T09:00:00Z',
    status: 'EM_ANALISE_SGP',
    description: 'Manutenção de servidores em Castanhal (Terrestre).',
    destination: 'Castanhal - PA',
    isInterstate: false,
    value: 250.00,
    deadline: '2024-02-10'
  },
  // 4. Fluxo Pós-AJSEFIN -> Vai para SEFIN assinar (EXISTING)
  {
    id: 'r4',
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
    legalOpinion: 'MINUTA DE AUTORIZAÇÃO\n\nCertifico que a despesa consta no orçamento vigente e atende aos princípios da legalidade e economicidade. Opino pelo deferimento da compra das passagens aéreas.\n\nBelém, 04 de Fevereiro de 2024.',
    legalOpinionAuthor: 'Dra. Clarice Lispector'
  },
  // 4b. Another Request waiting for SEFIN (New for Demo)
  {
    id: 'r4b',
    protocol: 'TJPA-INT-2024-5009',
    type: 'PASSAGEM',
    category: 'MAGISTRADO',
    requesterName: 'Dra. Júlia Rocha',
    requesterSector: 'Vara da Infância',
    dateCreated: '2024-02-03T08:00:00Z',
    status: 'AGUARDANDO_ASSINATURA_SEFIN',
    description: 'Mutirão de Audiências em Altamira.',
    destination: 'Altamira - PA',
    isInterstate: false,
    value: 3200.00,
    deadline: '2024-02-28',
    legalOpinion: 'MINUTA DE AUTORIZAÇÃO\n\nConforme solicitação e parecer jurídico favorável, autorizo a emissão das passagens para deslocamento da magistrada.\n\nBelém, 05 de Fevereiro de 2024.',
    legalOpinionAuthor: 'Dr. Carlos Drummond'
  },
  // SODPA Mock Data
  {
    id: 'r5',
    protocol: 'TJPA-JURI-2024-2938',
    type: 'DIARIA',
    category: 'EXTRAORDINÁRIO',
    requesterName: 'ADEMARIO SILVA DE JESUS TESTE',
    requesterSector: '3ª Vara Cível',
    dateCreated: '2023-10-25T10:00:00Z',
    status: 'NOVO',
    description: 'Participação em congresso jurídico em Brasília.',
    destination: 'Brasília - DF',
    isInterstate: true,
    value: 820.00,
    deadline: '2024-02-04'
  }
];
