import { Role, Process, ProcessType, ConcessionStatus, AccountStatus, INSSTable, AnnualBudget, BudgetDistribution, AdminBudget, BudgetAction, Allocation, BudgetRule } from './types';

export const CURRENT_USER_ID = '1';

// --- MOCKS ORÇAMENTÁRIOS (Ações e Dotações) ---

export const MOCK_ACTIONS: BudgetAction[] = [
  { code: '8193', description: 'Custeio e Manutenção das Comarcas (Ordinário)', balance: 8000000.00 },
  { code: '8163', description: 'Realização de Sessões do Júri (Extra-Júri)', balance: 3500000.00 },
  { code: '8183', description: 'Gestão Administrativa e Tecnologia (Emergencial TI)', balance: 2000000.00 },
  { code: '8177', description: 'Capacitação de Servidores (SGP)', balance: 500000.00 },
];

export const MOCK_ALLOCATIONS: Allocation[] = [
  { code: '170', description: 'Tesouro do Estado - Custeio' },
  { code: '171', description: 'Tesouro do Estado - Transporte' },
  { code: '180', description: 'Fundo Especial de Reaparelhamento - Júri' },
  { code: '190', description: 'Fundo de Informatização' },
];

// Regras Canônicas (De/Para)
export const MOCK_BUDGET_RULES: BudgetRule[] = [
  // Cenário A: Comarca Ordinário
  { id: '1', unitCategory: 'JURISDICTIONAL', supplyCategory: 'ORDINARY', elementPrefix: '3.3.90.30', targetActionCode: '8193', targetAllocationCode: '170' },
  { id: '2', unitCategory: 'JURISDICTIONAL', supplyCategory: 'ORDINARY', elementPrefix: '3.3.90.33', targetActionCode: '8193', targetAllocationCode: '171' },
  { id: '3', unitCategory: 'JURISDICTIONAL', supplyCategory: 'ORDINARY', elementPrefix: '3.3.90.36', targetActionCode: '8193', targetAllocationCode: '170' },
  { id: '4', unitCategory: 'JURISDICTIONAL', supplyCategory: 'ORDINARY', elementPrefix: '3.3.90.39', targetActionCode: '8193', targetAllocationCode: '170' },
  
  // Cenário B: Comarca Extra-Júri
  { id: '5', unitCategory: 'JURISDICTIONAL', supplyCategory: 'EXTRAORDINARY', elementPrefix: '3.3.90.30', targetActionCode: '8163', targetAllocationCode: '180' },
  { id: '6', unitCategory: 'JURISDICTIONAL', supplyCategory: 'EXTRAORDINARY', elementPrefix: '3.3.90.39', targetActionCode: '8163', targetAllocationCode: '180' },

  // Cenário C: Administrativo Extra-Emergencial
  { id: '7', unitCategory: 'ADMINISTRATIVE', supplyCategory: 'EXTRAORDINARY', elementPrefix: '3.3.90.30', targetActionCode: '8183', targetAllocationCode: '190' },
  { id: '8', unitCategory: 'ADMINISTRATIVE', supplyCategory: 'EXTRAORDINARY', elementPrefix: '3.3.90.39', targetActionCode: '8183', targetAllocationCode: '190' },
];

// Configuração Orçamentária Inicial (Mock)
export const INITIAL_BUDGET: AnnualBudget = {
  year: 2026,
  totalCap: 15000000.00, 
  executedOrdinary: 3200000.00,
  executedExtraordinary: 1450000.00,
  lastBatchDate: '2025-10-15',
  actions: MOCK_ACTIONS // Vinculando as ações
};

// Mock Inicial da Matriz de Distribuição (Comarcas)
export const MOCK_BUDGET_MATRIX: BudgetDistribution[] = [
  {
    comarcaId: 'C001',
    comarcaName: 'Comarca de Belém',
    annualValue: 60000.00,
    split: { consumption: 20, fuel: 5, transport: 15, servicePF: 10, servicePJ: 50 }
  },
  {
    comarcaId: 'C002',
    comarcaName: 'Comarca de Ananindeua',
    annualValue: 48000.00, // Cenário do Prompt
    split: { consumption: 25, fuel: 10, transport: 15, servicePF: 5, servicePJ: 45 }
  },
  {
    comarcaId: 'C003',
    comarcaName: 'Comarca de Marabá',
    annualValue: 36000.00,
    split: { consumption: 30, fuel: 20, transport: 20, servicePF: 0, servicePJ: 30 }
  },
  {
    comarcaId: 'C004',
    comarcaName: 'Comarca de Santarém',
    annualValue: 36000.00,
    split: { consumption: 20, fuel: 20, transport: 20, servicePF: 10, servicePJ: 30 }
  },
  {
    comarcaId: 'C005',
    comarcaName: 'Comarca de Mãe do Rio',
    annualValue: 24000.00,
    split: { consumption: 40, fuel: 30, transport: 10, servicePF: 0, servicePJ: 20 }
  },
];

// Mock Orçamentos Administrativos (Secretarias)
export const MOCK_ADMIN_BUDGETS: AdminBudget[] = [
  { unitId: 'ADM01', unitName: 'Secretaria de Informática', annualCap: 150000.00, executed: 45000.00 },
  { unitId: 'ADM02', unitName: 'Secretaria de Engenharia', annualCap: 120000.00, executed: 80000.00 },
  { unitId: 'ADM03', unitName: 'Secretaria de Gestão de Pessoas (SGP)', annualCap: 50000.00, executed: 12000.00 },
  { unitId: 'ADM04', unitName: 'Coordenadoria Militar', annualCap: 80000.00, executed: 25000.00 },
  { unitId: 'ADM05', unitName: 'Coordenadoria de Cerimonial', annualCap: 60000.00, executed: 55000.00 },
];

// Lista Simulada de Comarcas para Geração de Lote (Exemplo reduzido, na real seriam 144)
export const MOCK_COMARCAS = [
  { id: 'C001', name: 'Comarca de Belém', holder: 'João Paulo Costa', code: '03.01.01' },
  { id: 'C002', name: 'Comarca de Ananindeua', holder: 'Maria Oliveira', code: '03.01.02' },
  { id: 'C003', name: 'Comarca de Marabá', holder: 'Ana Beatriz Lima', code: '03.01.03' },
  { id: 'C004', name: 'Comarca de Santarém', holder: 'Carlos Drummond', code: '03.01.04' },
  { id: 'C005', name: 'Comarca de Mãe do Rio', holder: 'Ademário Silva', code: '03.01.05' },
  { id: 'C006', name: 'Comarca de Castanhal', holder: 'Fernanda Montenegro', code: '03.01.06' },
  { id: 'C007', name: 'Comarca de Altamira', holder: 'Gilberto Gil', code: '03.01.07' },
  { id: 'C008', name: 'Comarca de Paragominas', holder: 'Caetano Veloso', code: '03.01.08' },
  { id: 'C009', name: 'Comarca de Redenção', holder: 'Gal Costa', code: '03.01.09' },
  { id: 'C010', name: 'Comarca de Abaetetuba', holder: 'Maria Bethânia', code: '03.01.10' },
];

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

// ============================================================================
// PRAZOS LEGAIS - Portaria SEFIN/TJPA (Art. 4° - Prazo Unificado)
// ============================================================================
export const SLA_DEADLINES = {
  // Art. 4°, Parágrafo único - Prazo unificado de Aplicação E Prestação de Contas
  // NOVA LÓGICA: Data emissão Portaria até (data_fim do formulário + 15 dias)
  APPLICATION_ACCOUNTABILITY_DAYS: 15, // +15 dias após data final do evento
  
  // CNJ 169/2013 - Limite de valor para suprimento
  MAX_CONCESSION_VALUE: 15000.00,
  
  // Prazo de análise SOSFU (interno - SLA operacional)
  SOSFU_ANALYSIS_DAYS: 10,
  
  // Prazo para assinatura SEFIN (interno)
  SEFIN_SIGNATURE_DAYS: 5,
  
  // Prazo recursal TCE (Art. 28)
  TCE_RECURSAL_DAYS: 10,
  
  // Prazo para diligências/pendências
  PENDENCY_RESPONSE_DAYS: 10,
  
  // Prazo para baixa SIAFE após aprovação
  SIAFE_WRITEOFF_DAYS: 5,
  
  // DEPRECATED - Mantido para retrocompatibilidade
  ACCOUNTABILITY_DAYS: 15, // Usar APPLICATION_ACCOUNTABILITY_DAYS
} as const;

// Helper para calcular prazo unificado baseado na data do evento
// Art. 4°, Parágrafo único - Prazo de Aplicação e Prestação de Contas
// Fórmula: Data emissão Portaria até (data_fim + 15 dias)
export const calculateDeadlines = (portariaDate: string, eventEndDate: string) => {
  const portaria = new Date(portariaDate);
  const eventEnd = new Date(eventEndDate);
  
  // Prazo unificado de Aplicação e Prestação de Contas = data_fim + 15 dias
  const unifiedDeadline = new Date(eventEnd);
  unifiedDeadline.setDate(unifiedDeadline.getDate() + SLA_DEADLINES.APPLICATION_ACCOUNTABILITY_DAYS);
  
  return {
    portariaDate: portaria.toISOString().split('T')[0],
    // Prazo unificado
    applicationAccountabilityDeadline: unifiedDeadline.toISOString().split('T')[0],
    // DEPRECATED - Mantidos para retrocompatibilidade
    applicationDeadline: eventEnd.toISOString().split('T')[0],
    accountabilityDeadline: unifiedDeadline.toISOString().split('T')[0],
  };
};

// Mock data removed - usage migrated to Supabase (servidores_tj) via useTeamMembers hook

const generateDate = (daysOffset: number) => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString();
};

const generateDateString = (daysOffset: number) => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0];
};

export const MOCK_PROCESSES: Process[] = [
  {
    id: 'P-1',
    protocolNumber: '2025.001.001',
    interestedParty: 'JOÃO DA SILVA',
    providerCpf: '793.805.832-11',
    city: 'Belém',
    type: ProcessType.ACCOUNTABILITY,
    supplyCategory: 'ORDINARY',
    unitCategory: 'JURISDICTIONAL',
    status: AccountStatus.AUDIT,
    value: 1000.00,
    createdAt: generateDate(-1),
    slaDeadline: generateDate(5),
    assignedToId: '5',
    priority: 'NORMAL',
    sentinelaRisk: 'LOW',
    requiresTaxReview: true,
    taxData: {
      serviceDate: '2025-12-17',
      serviceValue: 1000.00,
      inssEmployee: 75.00,
      inssPatronal: 200.00,
      effectiveRate: 7.5,
      gdrInssStatus: 'PAID'
    }
  },
  {
    id: 'P-2',
    protocolNumber: '2025.001.045',
    interestedParty: 'ANTONIO CARLOS PEREIRA',
    providerCpf: '333.444.555-66',
    type: ProcessType.ACCOUNTABILITY,
    supplyCategory: 'EXTRAORDINARY',
    unitCategory: 'JURISDICTIONAL',
    status: AccountStatus.AUDIT,
    value: 4500.00,
    createdAt: generateDate(-3),
    slaDeadline: generateDate(2),
    assignedToId: '5',
    priority: 'HIGH',
    sentinelaRisk: 'CRITICAL',
    requiresTaxReview: true,
    taxData: {
      serviceDate: '2025-02-13',
      serviceValue: 4500.00,
      inssEmployee: 495.00,
      inssPatronal: 900.00,
      effectiveRate: 11,
      gdrInssStatus: 'PENDING'
    }
  },
  {
    id: 'P-3',
    protocolNumber: '2025.001.088',
    interestedParty: 'SECRETARIA DE TI',
    type: ProcessType.ACCOUNTABILITY,
    supplyCategory: 'EXTRAORDINARY',
    unitCategory: 'ADMINISTRATIVE',
    status: AccountStatus.PENDING,
    value: 12000.00,
    createdAt: generateDate(-10),
    slaDeadline: generateDate(1),
    assignedToId: '3',
    priority: 'NORMAL',
    sentinelaRisk: 'MEDIUM',
    hasBalanceReturn: true,
    balanceData: {
      amountSpent: 10500.00,
      amountReturned: 1500.00,
      gdrBalanceNumber: 'GDR-2025-99',
      status: 'PAID'
    }
  },
  // Processo Aprovado com Ressalvas (Pendente de Baixa no SIAFE)
  {
    id: 'P-4-SIAFE',
    protocolNumber: 'TJPA-SIAFE-001',
    interestedParty: 'MARIA DO SOCORRO (SIAFE)',
    type: ProcessType.ACCOUNTABILITY,
    supplyCategory: 'ORDINARY',
    unitCategory: 'JURISDICTIONAL',
    status: AccountStatus.APPROVED_CAVEATS,
    value: 3000.00,
    createdAt: generateDate(-45),
    slaDeadline: generateDate(-5),
    assignedToId: '3',
    priority: 'NORMAL',
    sentinelaRisk: 'LOW',
    purpose: 'Prestação de contas aprovada aguardando baixa no sistema SIAFE.'
  },
  // MOCK TCE (Fluxo SGP) - Processo que chegou na SGP
  {
    id: 'P-TCE-SGP-REAL',
    protocolNumber: 'TCE-2026-999',
    interestedParty: 'CARLOS ALBERTO (EX-SUPRIDO)',
    type: ProcessType.SPECIAL_ACCOUNT,
    supplyCategory: 'ORDINARY',
    unitCategory: 'JURISDICTIONAL',
    status: AccountStatus.AVERBACAO_SGP,
    value: 2500.00,
    createdAt: generateDate(-20),
    slaDeadline: generateDate(2),
    assignedToId: null, // Na caixa de entrada da SGP (conceitual, pois SGP tem usuários próprios)
    priority: 'CRITICAL',
    decisionSignedAt: generateDate(-2), // Decisão SEFIN assinada
    legalDeadline: generateDate(-1), // Prazo recursal expirou
    purpose: 'Tomada de Contas Especial. Decisão SEFIN Nº 001/2026 determinando desconto em folha.'
  }
];

export const CONCESSION_COLUMNS = [
  ConcessionStatus.TRIAGE,
  ConcessionStatus.ANALYSIS,
  ConcessionStatus.SIGNATURE,
  ConcessionStatus.FINANCE,
  ConcessionStatus.GRANTED
];

export const ACCOUNT_COLUMNS = [
  AccountStatus.RECEIVED,
  AccountStatus.AUDIT,
  AccountStatus.PENDING,
  AccountStatus.APPROVED_CAVEATS,
  AccountStatus.ARCHIVED
];

export const UNIFIED_COLUMNS = [
  { id: 'NEW', label: 'Entrada / Triagem', statuses: [ConcessionStatus.TRIAGE, AccountStatus.RECEIVED] },
  { id: 'WIP', label: 'Análise / Auditoria / Tributário', statuses: [ConcessionStatus.ANALYSIS, AccountStatus.AUDIT, AccountStatus.INSTRUCAO_TCE] },
  { id: 'PENDING', label: 'Pendências / Assinaturas / Prazos', statuses: [ConcessionStatus.SIGNATURE, AccountStatus.PENDING, AccountStatus.PRAZO_RECURSAL] },
  { id: 'DONE', label: 'Concluídos / Financeiro / SGP', statuses: [ConcessionStatus.FINANCE, ConcessionStatus.GRANTED, AccountStatus.APPROVED_CAVEATS, AccountStatus.ARCHIVED, AccountStatus.AVERBACAO_SGP, AccountStatus.SIAFE_DONE] }
];

export const UNIT_PTRES_MAP = {
  'SOSFU': ['8193', '8727', '8163'],
  'COMIL': ['8176', '8177', '8178'],
  'EJPA': ['8716', '8164'],
  'SETIC': ['8180', '8181', '8182'],
} as const;

export type BudgetUnit = keyof typeof UNIT_PTRES_MAP;
