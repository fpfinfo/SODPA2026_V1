import { Request, TeamMember, User, AllowanceRate, INSSTable, BudgetDistribution, AdminBudget, BudgetRule, AnnualBudget } from './types';

// Constantes stub para BudgetManager (módulo legado)
export const MOCK_BUDGET_MATRIX: BudgetDistribution[] = [];
export const MOCK_ADMIN_BUDGETS: AdminBudget[] = [];
export const MOCK_BUDGET_RULES: BudgetRule[] = [];

// Type e constante stub para BudgetPlanningDashboard (módulo legado)
export type BudgetUnit = 'SOSFU' | 'COMIL' | 'ALL';
export const UNIT_PTRES_MAP: Record<BudgetUnit, readonly string[]> = {
  SOSFU: [],
  COMIL: [],
  ALL: []
};

// Constantes stub para DashboardSOSFU (módulo legado)
export const CURRENT_USER_ID: string = '';
export const INITIAL_BUDGET: AnnualBudget = {
  year: 2026,
  totalCap: 0,
  executedOrdinary: 0,
  executedExtraordinary: 0,
  actions: []
};



// Tabela INSS 2025 (valores oficiais)
export const INSS_TABLE_2025: INSSTable = {
  year: 2025,
  ceiling: 8157.41,
  active: true,
  ranges: [
    { label: 'Faixa 1', min: 0, max: 1518.00, rate: 7.5 },
    { label: 'Faixa 2', min: 1518.01, max: 2793.88, rate: 9 },
    { label: 'Faixa 3', min: 2793.89, max: 4190.83, rate: 12 },
    { label: 'Faixa 4', min: 4190.84, max: 8157.41, rate: 14 },
  ]
};


// Usuário atual simulado (Alterne o ID/Role aqui para testar diferentes visões)
export const CURRENT_USER: User = {
  id: 'pres_chief', 
  name: 'Des. Maria de Nazaré', 
  role: 'PRESIDENCIA', 
  registration: '1001-A',
  position: 'Presidente do Tribunal',
  avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop',
  isMagistrate: true
};

/*
// Previously used SGP User
export const CURRENT_USER_OLD: User = {
  id: 'sgp_analyst', 
  name: 'Ana Neri', 
  role: 'SGP', 
  registration: '550123',
  position: 'Analista de RH',
  avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop'
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
      id: 'aj1', name: 'Dr. Carlos Drummond', role: 'SODPA',
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
  // 1. Fluxo Interestadual -> Vai para Presidência (URGENTE)
  {
    id: 'p1',
    protocol: 'TJPA-EXT-2024-8821',
    type: 'PASSAGEM',
    category: 'MAGISTRADO',
    requesterName: 'Des. Antonio Santos',
    requesterSector: 'Gabinete Desembargador',
    dateCreated: '2024-02-05T10:00:00Z',
    status: 'EM_ANALISE_PRESIDENCIA',
    description: 'Participação na posse da nova diretoria do CNJ.',
    destination: 'Brasília - DF',
    isInterstate: true,
    value: 4500.00,
    deadline: '2024-02-08',
    legalOpinion: 'Regularidade certificada conforme portaria CNJ 23/2023.'
  },
  // 2. Fluxo Interestadual -> Presidência (NORMAL)
  {
    id: 'p2',
    protocol: 'TJPA-EXT-2024-8840',
    type: 'DIARIA',
    category: 'MAGISTRADO',
    requesterName: 'Juiz Roberto Valente',
    requesterSector: 'Vara Agrária de Altamira',
    dateCreated: '2024-02-04T14:30:00Z',
    status: 'EM_ANALISE_PRESIDENCIA',
    description: 'Workshop Internacional de Direito Ambiental.',
    destination: 'São Paulo - SP',
    isInterstate: true,
    value: 3200.00,
    deadline: '2024-02-20'
  },
  // 3. Em Trânsito (Mock)
  {
    id: 'p3',
    protocol: 'TJPA-EXT-2024-8100',
    type: 'PASSAGEM',
    category: 'MAGISTRADO',
    requesterName: 'Des. Lúcia Fátima',
    requesterSector: 'Vice-Presidência',
    dateCreated: '2024-01-20T09:00:00Z',
    status: 'APROVADO',
    description: 'Visita Institucional ao STF.',
    destination: 'Brasília - DF',
    isInterstate: true,
    value: 2800.00,
    deadline: '2024-02-05',
    returnDate: '2024-02-10' // Currently traveling
  },
  // 4. Fluxo Estadual com Passagem -> AJSEFIN
  {
    id: 'r2',
    protocol: 'TJPA-INT-2024-5002',
    type: 'PASSAGEM',
    category: 'ORDINÁRIO',
    requesterName: 'Maria Silva',
    requesterSector: 'Secretaria Geral',
    dateCreated: '2024-02-02T14:30:00Z',
    status: 'EM_ANALISE_AJSEFIN',
    description: 'Visita técnica urgente em Santarém.',
    destination: 'Santarém - PA',
    isInterstate: false,
    value: 1200.00,
    deadline: '2024-02-15'
  },
  // 5. Fluxo Estadual Apenas Diária -> SGP
  {
    id: 'r3',
    protocol: 'TJPA-DIA-2024-5003',
    type: 'DIARIA',
    category: 'TÉCNICO',
    requesterName: 'João Souza',
    requesterSector: 'TI',
    dateCreated: '2024-02-03T09:00:00Z',
    status: 'EM_ANALISE_SGP',
    description: 'Manutenção de servidores em Castanhal.',
    destination: 'Castanhal - PA',
    isInterstate: false,
    value: 250.00,
    deadline: '2024-02-10'
  },
  // 6. Corregedoria -> Presidência
  {
    id: 'p4',
    protocol: 'TJPA-EXT-2024-8902',
    type: 'PASSAGEM',
    category: 'MAGISTRADO',
    requesterName: 'Des. Carlos Eduardo',
    requesterSector: 'Corregedoria Geral',
    dateCreated: '2024-02-06T08:00:00Z',
    status: 'EM_ANALISE_PRESIDENCIA',
    description: 'Reunião do Conselho Nacional de Corregedores.',
    destination: 'Florianópolis - SC',
    isInterstate: true,
    value: 5200.00,
    deadline: '2024-02-15'
  }
];

// Tabela de Valores de Diárias
export const MOCK_ALLOWANCE_RATES: AllowanceRate[] = [
  // Magistratura
  {
    id: 'val_01',
    userType: 'desembargador_corregedor_juiz_auxiliar',
    travelType: 'NO_ESTADO',
    value: 850.00,
    validFrom: '2023-01-01',
    active: true,
    notes: 'Reajuste Portaria 2023'
  },
  {
    id: 'val_02',
    userType: 'desembargador_corregedor_juiz_auxiliar',
    travelType: 'NO_PAIS',
    value: 1200.00,
    validFrom: '2023-01-01',
    active: true
  },
  {
    id: 'val_03',
    userType: 'juiz_direito',
    travelType: 'NO_ESTADO',
    value: 750.00,
    validFrom: '2023-01-01',
    active: true
  },
  {
    id: 'val_04',
    userType: 'juiz_direito',
    travelType: 'NO_PAIS',
    value: 1050.00,
    validFrom: '2023-01-01',
    active: true
  },
  // Servidores
  {
    id: 'val_05',
    userType: 'analista_judiciario',
    travelType: 'NO_ESTADO',
    value: 450.00,
    validFrom: '2023-01-01',
    active: true
  },
  {
    id: 'val_06',
    userType: 'analista_judiciario',
    travelType: 'NO_PAIS',
    value: 650.00,
    validFrom: '2023-01-01',
    active: true
  },
  {
    id: 'val_07',
    userType: 'oficial_justica_avaliador',
    travelType: 'NO_ESTADO',
    value: 450.00,
    validFrom: '2023-01-01',
    active: true
  },
  // Antigo (Inativo)
  {
    id: 'val_old_01',
    userType: 'analista_judiciario',
    travelType: 'NO_ESTADO',
    value: 400.00,
    validFrom: '2020-01-01',
    validTo: '2022-12-31',
    active: false,
    notes: 'Valor revogado'
  }
];
