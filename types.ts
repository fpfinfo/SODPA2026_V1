export enum AppRole {
  SUPRIDO = 'SUPRIDO',
  GESTOR = 'GESTOR',
  SOSFU = 'SOSFU',
  SEFIN = 'SEFIN',
  AJSEFIN = 'AJSEFIN',
  SGP = 'SGP',
  SODPA = 'SODPA'
}

// Added Role enum for staff members
export enum Role {
  GOVERNANCE = 'GOVERNANCE',
  CONCESSION = 'CONCESSION',
  FINANCE = 'FINANCE',
  AUDIT_CONSUMPTION = 'AUDIT_CONSUMPTION',
  TAX_ANALYSIS = 'TAX_ANALYSIS'
}

export enum ProcessType {
  CONCESSION = 'CONCESSION',
  ACCOUNTABILITY = 'ACCOUNTABILITY',
  SPECIAL_ACCOUNT = 'SPECIAL_ACCOUNT', // Tomada de Contas Especial
  BATCH_PROGRAMMING = 'BATCH_PROGRAMMING' // Programação de Pagamento (Ofício)
}

// Categoria de Suprimento (Novo Fluxo)
export type SupplyCategory = 'ORDINARY' | 'EXTRAORDINARY';

// Categoria da Unidade Organizacional (Novo)
export type UnitCategory = 'JURISDICTIONAL' | 'ADMINISTRATIVE';

// --- Dados Bancários (Novo) ---
export interface BankData {
  bankName: string;
  bankCode: string;
  agency: string;
  account: string;
}

// --- NOVO: Estrutura da Matriz de Execução Orçamentária ---

export interface BudgetAction {
  code: string; // Ex: 8193, 8163
  description: string; // Ex: Manutenção das Comarcas
  balance: number; // Saldo específico desta ação
}

export interface Allocation {
  code: string; // Ex: 170, 180 (Fonte/Dotação)
  description: string; // Ex: Tesouro do Estado
}

// Regra de Mapeamento (De/Para)
export interface BudgetRule {
  id: string;
  unitCategory: UnitCategory | 'ALL'; // Quem pede
  supplyCategory: SupplyCategory;     // O que pede (Finalidade)
  elementPrefix: string;              // Elemento (Ex: 33.90.30)
  targetActionCode: string;           // Ação Vinculada
  targetAllocationCode: string;       // Dotação Vinculada
}

// ----------------------------------------------------

// Estrutura do Teto Orçamentário Global
export interface AnnualBudget {
  year: number;
  totalCap: number;
  executedOrdinary: number;
  executedExtraordinary: number;
  lastBatchDate?: string;
  actions: BudgetAction[]; // Lista de Ações com seus saldos
}

export interface ExpenseSplit {
  consumption: number; // 3.3.90.30.01 (%)
  fuel: number;        // 3.3.90.30.02 (%)
  transport: number;   // 3.3.90.33 (%)
  servicePF: number;   // 3.3.90.36 (%)
  servicePJ: number;   // 3.3.90.39 (%)
}

// Configuração para Comarcas (Jurisdicional)
export interface BudgetDistribution {
  comarcaId: string;
  comarcaName: string;
  annualValue: number;
  split: ExpenseSplit;
  bankData?: BankData; // Dados bancários da comarca
}

// Configuração para Unidades Administrativas (Novo)
export interface AdminBudget {
  unitId: string;
  unitName: string;
  annualCap: number;
  executed: number; // Controle de saldo para Extra-Emergencial
}

// Added ConcessionStatus enum for workflow steps
export enum ConcessionStatus {
  TRIAGE = 'Triagem',
  ANALYSIS = 'Análise Técnica',
  AWAITING_SIGNATURE = 'AGUARDANDO_ASSINATURA', // Novo status para fluxo SEFIN
  SIGNATURE = 'ASSINATURA', // Status de assinatura em andamento
  FINANCE = 'FINANCEIRO',
  COMPLETE = 'CONCLUIDO',
  GRANTED = 'CONCEDIDO', // Status concluído com sucesso
  // Novos status de tramitação institucional
  SENT_TO_SEFIN = 'ENVIADO_SEFIN',
  RETURNED_FROM_SEFIN = 'RETORNADO_SEFIN',
  AWAITING_SUPRIDO_CONFIRMATION = 'AWAITING_SUPRIDO_CONFIRMATION' // Novo status pós-crédito
}

// Added AccountStatus enum for accountability steps
export enum AccountStatus {
  RECEIVED = 'Recebido',
  AUDIT = 'Em Auditoria / Tributário',
  PENDING = 'Pendência Solicitada',
  APPROVED_CAVEATS = 'Aprovado com Ressalvas',
  ARCHIVED = 'Arquivado',
  // Novos Status de Tomada de Contas
  INSTRUCAO_TCE = 'Instrução TCE',
  PRAZO_RECURSAL = 'Aguardando Prazo Recursal',
  AVERBACAO_SGP = 'Averbação SGP',
  // Novo Status SIAFE
  SIAFE_DONE = 'Baixado no SIAFE',
  // Novo workflow status
  AWAITING_ACCOUNTABILITY = 'AWAITING_ACCOUNTABILITY'
}

export type ProcessStatus = ConcessionStatus | AccountStatus | string;

export interface UserProfile {
  id: string;
  name: string;
  role: AppRole;
  matricula: string;
  avatarUrl?: string;
  position?: string; // Cargo: Juiz de Direito, Desembargador, etc.
  isMagistrate?: boolean; // Identifica se é Juiz ou Desembargador
}

// StaffMember interface deprecated - usage replaced by teamMembers array (from servidores_tj)

// Added INSS table related interfaces
export interface INSSRange {
  label: string;
  min: number;
  max: number;
  rate: number;
}

export interface INSSTable {
  year: number;
  ceiling: number;
  active: boolean;
  ranges: INSSRange[];
}

// Added TaxData and BalanceData for financial tracking
export interface TaxData {
  serviceDate: string;
  serviceValue: number;
  inssEmployee: number;
  inssPatronal: number;
  effectiveRate: number;
  gdrInssStatus: 'PAID' | 'PENDING';
}

export interface BalanceData {
  amountSpent: number;
  amountReturned: number;
  gdrBalanceNumber: string;
  status: 'PAID' | 'PENDING';
}

export interface ProcessTimelineStep {
  label: string;
  status: 'completed' | 'current' | 'pending' | 'error';
  date?: string;
  description?: string;
}

export interface ProcessItem {
  element: string;
  description: string;
  value: number;
  locked?: boolean;
  // Novos campos de execução orçamentária
  budgetAction?: string;
  allocation?: string;
}

// Tipos para Documentos Gerados
export type DocType = 'PORTARIA' | 'CERTIDAO_REGULARIDADE' | 'NOTA_EMPENHO' | 'LIQUIDACAO' | 'ORDEM_BANCARIA' | 'PORTARIA_ACCOUNTABILITY';

export interface ProcessDocument {
  id: string;
  type: DocType;
  title: string;
  generatedAt: string;
  content?: string; // HTML/Text representation
  metadata?: {
    neNumber?: string;
    dlNumber?: string;
    obNumber?: string;
    siafeNl?: string;
    siafeDate?: string;
  };
}

// Expanded Process interface with optional fields used across different modules
export interface Process {
  id: string;
  protocolNumber: string;
  supridoId?: string;
  interestedParty?: string;
  providerCpf?: string;
  providerPis?: string;
  city?: string;
  type: ProcessType;
  supplyCategory?: SupplyCategory; // New field for budget tracking
  unitCategory?: UnitCategory; // Identifica se é Comarca ou ADM
  status: ProcessStatus;
  value: number;
  items?: ProcessItem[]; // Detalhamento dos itens (Obrigatório para Ordinário Gerado)
  purpose?: string;
  createdAt: string;
  applicationDeadline?: string;
  accountabilityDeadline?: string;
  slaDeadline?: string;
  
  // Controle de origem automática
  isBatchGenerated?: boolean; // Se true, o suprido não pode editar valores, apenas prestar contas
  
  // Controle de Prazos Legais (TCE)
  decisionSignedAt?: string; // Data da assinatura do Ordenador
  legalDeadline?: string;    // Data fim do prazo recursal
  
  // Controle SIAFE
  siafeNl?: string; // Número da Nota de Lançamento de Baixa
  siafeDate?: string; // Data da Baixa
  
  // Controle Financeiro (Concessão)
  neNumber?: string; // Nota de Empenho
  neValue?: number;  // [TRIPLE CHECK]
  dlNumber?: string; // Documento de Liquidação
  dlValue?: number;  // [TRIPLE CHECK]
  obNumber?: string; // Ordem Bancária
  obValue?: number;  // [TRIPLE CHECK]
  generatedDocuments?: ProcessDocument[];

  assignedToId?: string | null;
  destino_atual?: string; // Current destination in workflow (e.g., SOSFU, SEFIN, SUPRIDO)
  priority: 'NORMAL' | 'HIGH' | 'CRITICAL';
  
  // Sentinela Integration (Novo)
  sentinelaRisk?: 'LOW' | 'MEDIUM' | 'CRITICAL' | 'PENDING';
  
  timeline?: ProcessTimelineStep[];
  requiresTaxReview?: boolean;
  taxData?: TaxData;
  hasBalanceReturn?: boolean;
  balanceData?: BalanceData;

  // Extended properties for Financial Registry
  providerName?: string;
  providerBirthDate?: string;
  nup?: string; // Often equivalent to protocolNumber
  portariaSf?: string;
  serviceDescription?: string;
  subject?: string;
  
  // Extra fields for SOSFU view
  bankData?: {
    bankName: string;
    agency: string;
    account: string;
    bankCode?: string;
  };
  manager?: {
    nome: string;
    email: string;
  };
}

// Expanded ViewMode to include SOSFU internal view modes
export type ViewMode = 'DASHBOARD' | 'NEW_REQUEST' | 'MY_REQUESTS' | 'ACCOUNTABILITY' | 'KANBAN' | 'LIST';

// Removed 'SENTINELA' from FilterTab as it is now merged into ACCOUNTABILITY
export type FilterTab = 'ALL' | 'CONCESSION' | 'ACCOUNTABILITY' | 'FINANCEIRO' | 'ORCAMENTO' | 'TAX_INSS' | 'GDR_CONTROL' | 'INSS_TABLES' | 'SUPRIDO_MANAGEMENT' | 'ORDINARY_MANAGEMENT' | 'SIAFE' | 'SETTINGS';

export type SettingsSubTab = 'USERS' | 'DEPARTMENTS' | 'MUNICIPALITIES' | 'DISTRICTS' | 'EXPENSES' | 'DOCS' | 'PARAMETERS';

// Added Sentinela Audit related interfaces
export interface AuditAlert {
  id: string;
  type: 'CRITICAL' | 'WARNING';
  category: string;
  message: string;
  description: string;
  ruleId: string;
}

export interface SentinelaAnalysis {
  confidenceScore: number;
  status: 'MANUAL_REVIEW' | 'VALIDATED';
  extractedData: {
    cnpj: string;
    invoiceNumber: string;
    issueDate: string;
    totalAmount: number;
    items: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }>;
  };
  alerts: AuditAlert[];
  suggestedGlosaText: string;
}

// --- SODPA Specific Types ---

export type StatusDiaria = 
  | 'SOLICITADA' 
  | 'PENDENTE_ANALISE' 
  | 'EM_ANALISE' 
  | 'COTACAO' // Para passagens, mas as vezes compartilhado
  | 'AGUARDANDO_DOCS' 
  | 'APROVADA' 
  | 'AGUARDANDO_SEFIN' 
  | 'ASSINADA' 
  | 'RETORNO_SEFIN' 
  | 'PAGA' 
  | 'DEVOLVIDA';

export type StatusPassagem = 
  | 'SOLICITADA' 
  | 'PENDENTE_ANALISE' 
  | 'EM_ANALISE' 
  | 'COTACAO' 
  | 'AGUARDANDO_DOCS' 
  | 'APROVADA' 
  | 'AGUARDANDO_SEFIN' 
  | 'ASSINADA' 
  | 'RETORNO_SEFIN' 
  | 'EMITIDA' 
  | 'DEVOLVIDA'
  | 'CONCLUIDA'
  | 'UTILIZADA'
  | 'AGUARDANDO_EMISSAO'
  | 'CANCELADA';

export interface SolicitacaoDiaria {
  id: string;
  servidorId: string;
  servidorNome: string;
  nup: string;
  destino: string;
  motivo: string;
  dataInicio: string;
  dataFim: string;
  quantidade: number;
  tipoDiaria: string;
  valorUnitario: number;
  valorTotal: number;
  status: StatusDiaria;
  prioridade: 'NORMAL' | 'ALTA' | 'URGENTE';
  assignedToId?: string | null;
  destinoAtual?: string;
  observacoes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SolicitacaoPassagem {
  id: string;
  servidorId: string;
  servidorNome: string;
  nup: string;
  tipoPassagem: string;
  classeTarifa: string;
  justificativa: string;
  valorEstimado: number;
  valorFinal: number;
  status: StatusPassagem;
  prioridade: 'NORMAL' | 'ALTA' | 'URGENTE';
  assignedToId?: string | null;
  destinoAtual?: string;
  observacoes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SODPAStats {
  total: number;
  inbox: {
    total: number;
    diarias: number;
    passagens: number;
  };
  minhaMesa: {
    total: number;
    diarias: number;
    passagens: number;
  };
  aguardandoAprovacao: number;
  concluidos: number;
}

export interface ProcessoSODPA {
  id: string;
  tipo: 'DIARIA' | 'PASSAGEM';
  solicitanteId: string;
  solicitanteNome: string;
  solicitanteEmail?: string; // Optional as per current usage
  solicitanteCargo?: string; // Optional as per current usage
  protocoloNUP: string;
  status: StatusDiaria | StatusPassagem;
  prioridade: 'NORMAL' | 'ALTA' | 'URGENTE';
  valorTotal: number;
  
  // Specific fields
  dataInicio?: string;
  dataFim?: string;
  destino?: string;
  tipoPassagem?: string;
  classeTarifa?: string;
  justificativa?: string;
  observacoes?: string;
  
  assignedToId?: string | null; // Renamed/Standardized from atribuidoA
  atribuidoA?: string | null; // Keeping for backward compat if needed, but prefer assignedToId
  createdAt: string;
  updatedAt?: string;
  
  // Control fields
  motivoDevolucao?: string;
  observacoesAnalise?: string;
  dataExecucao?: string;
}

export interface TeamMember {
  id: string;
  nome: string;
  email: string;
  role?: string;
  avatarUrl?: string;
  funcao?: string;
  setor?: string;
  ativo?: boolean;
  taskCount?: number;
  atrasados?: number;
  capacidadeDiaria?: number;
}

export type SODPATabView = 'PAINEL' | 'DIARIAS' | 'PASSAGENS' | 'RELATORIOS' | 'CONFIG';
