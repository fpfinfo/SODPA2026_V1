/**
 * Location Types
 * TypeScript interfaces for comarcas, municipios, lotacoes tables
 * Matches Supabase schema defined in 20260114_create_location_tables.sql
 */

// Entrância types
export type Entrancia = '1ª Entrância' | '2ª Entrância' | '3ª Entrância';

// Comarca status
export type ComarcaStatus = 'ATIVA' | 'INATIVA' | 'SEM_SUPRIDO' | 'BLOQUEADA';

// Lotação tipo
export type LotacaoTipo = 'JURISDICIONAL' | 'ADMINISTRATIVA';

// Budget history status
export type BudgetHistoryStatus = 'GERADO' | 'ASSINADO' | 'LIBERADO' | 'EXECUTADO';

/**
 * Comarca (Jurisdiction District)
 * Main entity for ordinary supply batch processing
 */
export interface Comarca {
  id: string;
  codigo: string;
  nome: string;
  entrancia: Entrancia;
  varas: number;
  
  // Linked suprido (optional)
  suprido_id?: string;
  suprido?: {
    id: string;
    nome: string;
    cpf: string;
    email?: string;
  };
  
  // Budget for ordinary supply
  teto_anual: number;
  dist_elemento_30_01: number; // Combustível %
  dist_elemento_30_02: number; // Material de Consumo %
  dist_elemento_33: number;    // Passagens %
  dist_elemento_36: number;    // Serviços PF %
  dist_elemento_39: number;    // Serviços PJ %
  
  status: ComarcaStatus;
  
  created_at?: string;
  updated_at?: string;
}

/**
 * Município (City)
 * Linked to a Comarca
 */
export interface Municipio {
  id: string;
  codigo_ibge: string;
  nome: string;
  comarca_id?: string;
  comarca?: Comarca;
  populacao?: number;
  
  created_at?: string;
  updated_at?: string;
}

/**
 * Lotação (Department/Unit)
 * Can be JURISDICIONAL (linked to Comarca) or ADMINISTRATIVA
 */
export interface Lotacao {
  id: string;
  codigo: string;
  nome: string;
  tipo: LotacaoTipo;
  comarca_id?: string;
  comarca?: Comarca;
  
  created_at?: string;
  updated_at?: string;
}

/**
 * ComarcaBudgetHistory
 * Audit trail for batch releases
 */
export interface ComarcaBudgetHistory {
  id: string;
  comarca_id: string;
  comarca?: Comarca;
  ano: number;
  quadrimestre: 1 | 2 | 3;
  valor_liberado: number;
  status: BudgetHistoryStatus;
  processo_id?: string;
  
  created_at?: string;
}

/**
 * Element Distribution (for batch)
 * Percentages that must sum to 100
 */
export interface ElementDistribution {
  element_30_01: number; // Combustível
  element_30_02: number; // Material de Consumo
  element_33: number;    // Passagens e Locomoção
  element_36: number;    // Serviços PF
  element_39: number;    // Serviços PJ
}

/**
 * Convert Comarca to ElementDistribution
 */
export function comarcaToDistribution(comarca: Comarca): ElementDistribution {
  return {
    element_30_01: comarca.dist_elemento_30_01,
    element_30_02: comarca.dist_elemento_30_02,
    element_33: comarca.dist_elemento_33,
    element_36: comarca.dist_elemento_36,
    element_39: comarca.dist_elemento_39,
  };
}

/**
 * Validate distribution percentages sum to 100
 */
export function validateDistribution(dist: ElementDistribution): boolean {
  const total = dist.element_30_01 + dist.element_30_02 + dist.element_33 + dist.element_36 + dist.element_39;
  return Math.abs(total - 100) < 0.01;
}

/**
 * Calculate quarter value from annual ceiling
 */
export function calculateQuarterValue(tetoAnual: number): number {
  return tetoAnual / 3;
}

/**
 * Calculate element value from quarter value and percentage
 */
export function calculateElementValue(quarterValue: number, percentage: number): number {
  return (quarterValue * percentage) / 100;
}

/**
 * Format currency to BRL
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

/**
 * Get comarca status label and color
 */
export function getComarcaStatusBadge(status: ComarcaStatus): { label: string; color: string } {
  switch (status) {
    case 'ATIVA':
      return { label: 'Regular', color: 'emerald' };
    case 'SEM_SUPRIDO':
      return { label: 'Sem Suprido', color: 'amber' };
    case 'BLOQUEADA':
      return { label: 'Bloqueada', color: 'red' };
    case 'INATIVA':
      return { label: 'Inativa', color: 'slate' };
    default:
      return { label: status, color: 'slate' };
  }
}
