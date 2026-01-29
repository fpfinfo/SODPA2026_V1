// ============================================================================
// SODPA - Serviço de Diárias e Passagens Aéreas
// Tipos TypeScript do Sistema
// ============================================================================

// Roles do Sistema
export enum AppRole {
  SODPA = 'SODPA',
  SEFIN = 'SEFIN',
  SOLICITANTE = 'SOLICITANTE',
  ADMIN = 'ADMIN'
}

// Funções da Equipe Técnica
export enum Role {
  ANALISTA = 'ANALISTA',
  COORDENADOR = 'COORDENADOR',
  CHEFE = 'CHEFE'
}

// ============================================================================
// TIPOS DE DIÁRIAS
// ============================================================================

export type TipoDiaria = 'INTEGRAL' | 'MEIA' | 'COMPLEMENTAR';

export type StatusDiaria = 
  | 'SOLICITADA' 
  | 'EM_ANALISE' 
  | 'APROVADA' 
  | 'PAGA' 
  | 'CANCELADA';

export interface SolicitacaoDiaria {
  id: string;
  servidorId: string;
  servidorNome: string;
  nup?: string;
  destino: string;
  municipioDestinoId?: string;
  motivo: string;
  dataInicio: string;
  dataFim: string;
  quantidade: number;
  tipoDiaria: TipoDiaria;
  valorUnitario: number;
  valorTotal: number;
  status: StatusDiaria;
  prioridade: 'NORMAL' | 'URGENTE' | 'EMERGENCIAL';
  assignedToId?: string;
  destinoAtual?: string;
  observacoes?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// TIPOS DE PASSAGENS
// ============================================================================

export type TipoPassagem = 'AEREA' | 'TERRESTRE' | 'FLUVIAL';

export type ClasseTarifa = 'ECONOMICA' | 'EXECUTIVA' | 'PRIMEIRA_CLASSE';

export type StatusPassagem = 
  | 'SOLICITADA' 
  | 'COTACAO' 
  | 'EMITIDA' 
  | 'UTILIZADA' 
  | 'CANCELADA';

export interface Trecho {
  id: string;
  passagemId: string;
  origem: string;
  destino: string;
  dataIda: string;
  dataVolta?: string;
  horaPreferencia?: string;
  ciaAerea?: string;
  voo?: string;
  localizador?: string;
  ordem: number;
  createdAt: string;
}

export interface SolicitacaoPassagem {
  id: string;
  servidorId: string;
  servidorNome: string;
  nup?: string;
  tipoPassagem: TipoPassagem;
  classeTarifa: ClasseTarifa;
  justificativa: string;
  valorEstimado?: number;
  valorFinal?: number;
  status: StatusPassagem;
  prioridade: 'NORMAL' | 'URGENTE' | 'EMERGENCIAL';
  assignedToId?: string;
  destinoAtual?: string;
  observacoes?: string;
  trechos?: Trecho[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// TIPOS UNIFICADOS (para Dashboard)
// ============================================================================

export type TipoProcessoSODPA = 'DIARIA' | 'PASSAGEM';

export type StatusProcessoSODPA = StatusDiaria | StatusPassagem;

export interface ProcessoSODPA {
  id: string;
  tipo: TipoProcessoSODPA;
  protocoloNUP?: string;
  solicitanteId: string;
  solicitanteNome: string;
  solicitanteEmail?: string;
  solicitanteCargo?: string;
  status: StatusProcessoSODPA | string;
  valorTotal: number;
  prioridade: 'NORMAL' | 'URGENTE' | 'EMERGENCIAL' | 'ALTA' | 'BAIXA';
  atribuidoA?: string;
  assignedToId?: string;
  slaDeadline?: string;
  
  // Campos específicos de Diárias
  destino?: string;
  dataInicio?: string;
  dataFim?: string;
  observacoes?: string;
  
  // Campos específicos de Passagens
  tipoPassagem?: TipoPassagem;
  classeTarifa?: ClasseTarifa;
  justificativa?: string;
  
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// PERFIL DE USUÁRIO
// ============================================================================

export interface UserProfile {
  id: string;
  email: string;
  nome: string;
  matricula?: string;
  cargo?: string;
  setor?: string;
  role: AppRole;
  avatarUrl?: string;
  cpf?: string;
  telefone?: string;
  capacidadeDiaria?: number;
  ativo: boolean;
}

// ============================================================================
// EQUIPE TÉCNICA
// ============================================================================

export interface TeamMember {
  id: string;
  nome: string;
  email: string;
  funcao: string;
  avatarUrl?: string;
  capacidadeDiaria: number;
  taskCount: number;
  atrasados: number;
  ocupacaoPercent: number;
  setor: string;
  ativo: boolean;
}

// ============================================================================
// MUNICÍPIO
// ============================================================================

export interface Municipio {
  id: string;
  nome: string;
  uf: string;
  codigoIbge?: string;
  ativo: boolean;
}

// ============================================================================
// ESTATÍSTICAS DO DASHBOARD
// ============================================================================

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

// ============================================================================
// TABS E NAVEGAÇÃO
// ============================================================================

export type SODPATabView = 'PAINEL' | 'DIARIAS' | 'PASSAGENS' | 'RELATORIOS' | 'CONFIG';

export type FilterStatus = 'ALL' | StatusDiaria | StatusPassagem;
