/**
 * Batch Processing Types
 * Types for batch generation of ordinary supply processes
 */

// Quarter selection
export type Quarter = '1Q' | '2Q' | '3Q';

export const QUARTER_CONFIG: Record<Quarter, { label: string; months: string }> = {
  '1Q': { label: '1º Quadrimestre', months: 'Jan - Abr' },
  '2Q': { label: '2º Quadrimestre', months: 'Mai - Ago' },
  '3Q': { label: '3º Quadrimestre', months: 'Set - Dez' },
};

// Expense element distribution
export interface ElementDistribution {
  element_30_01: number; // Combustível (%)
  element_30_02: number; // Material de Consumo (%)
  element_33: number;    // Passagens e Locomoção (%)
  element_36: number;    // Serviços PF (%)
  element_39: number;    // Serviços PJ (%)
}

// Comarca budget allocation
export interface ComarcaBudget {
  id: string;
  comarca_id: string;
  comarca_nome: string;
  comarca_codigo: string;
  suprido_id?: string;
  suprido_nome?: string;
  suprido_cpf?: string;
  teto_anual: number;
  distribuicao: ElementDistribution;
  status: 'REGULAR' | 'PENDENTE' | 'SEM_SUPRIDO' | 'BLOQUEADO';
  pendencias?: string[];
}

// Batch generation request
export interface BatchGenerationRequest {
  year: number;
  quarter: Quarter;
  comarcas: ComarcaBudget[];
  ptres_code: string;
  dotacoes: {
    element_30: string;
    element_33: string;
    element_36: string;
    element_39: string;
  };
  generated_by: string;
  generated_at: string;
}

// Generated process in batch
export interface BatchProcess {
  id: string;
  batch_id: string;
  comarca_id: string;
  comarca_nome: string;
  suprido_id: string;
  suprido_nome: string;
  suprido_cpf: string;
  valor_total: number;
  itens: BatchProcessItem[];
  documents: BatchDocument[];
  status: 'AGUARDANDO_ASSINATURA' | 'ASSINADO' | 'LIBERADO' | 'EM_EXECUCAO';
  created_at: string;
}

export interface BatchProcessItem {
  element_code: string;
  element_name: string;
  dotacao_code: string;
  valor: number;
  percentual: number;
}

export interface BatchDocument {
  type: 'PORTARIA' | 'NOTA_EMPENHO' | 'CERTIDAO';
  title: string;
  signed: boolean;
  signed_by?: string;
  signed_at?: string;
  pdf_url?: string;
}

// Batch summary for signing
export interface BatchSummary {
  id: string;
  year: number;
  quarter: Quarter;
  total_processos: number;
  total_valor: number;
  total_documentos: number;
  status: 'GERADO' | 'PARCIALMENTE_ASSINADO' | 'ASSINADO' | 'LIBERADO';
  comarcas_regulares: number;
  comarcas_excluidas: number;
  generated_by: string;
  generated_at: string;
  signed_by?: string;
  signed_at?: string;
}

// Validation result
export interface ComarcaValidation {
  comarca_id: string;
  comarca_nome: string;
  valid: boolean;
  status: 'OK' | 'PENDENTE' | 'SEM_SUPRIDO' | 'BLOQUEADO';
  issues: string[];
}

// Mock data - 20 comarcas sample (real would have 144)
export const MOCK_COMARCAS: ComarcaBudget[] = [
  { id: '1', comarca_id: 'c1', comarca_nome: 'Belém - Vara Criminal', comarca_codigo: 'BEL-VC', suprido_nome: 'Maria Silva', suprido_cpf: '123.456.789-00', teto_anual: 48000, distribuicao: { element_30_01: 20, element_30_02: 30, element_33: 25, element_36: 15, element_39: 10 }, status: 'REGULAR' },
  { id: '2', comarca_id: 'c2', comarca_nome: 'Ananindeua', comarca_codigo: 'ANA', suprido_nome: 'João Santos', suprido_cpf: '987.654.321-00', teto_anual: 36000, distribuicao: { element_30_01: 25, element_30_02: 25, element_33: 20, element_36: 20, element_39: 10 }, status: 'REGULAR' },
  { id: '3', comarca_id: 'c3', comarca_nome: 'Santarém', comarca_codigo: 'STM', suprido_nome: 'Ana Oliveira', suprido_cpf: '456.789.123-00', teto_anual: 42000, distribuicao: { element_30_01: 30, element_30_02: 20, element_33: 25, element_36: 15, element_39: 10 }, status: 'REGULAR' },
  { id: '4', comarca_id: 'c4', comarca_nome: 'Marabá', comarca_codigo: 'MBA', suprido_nome: 'Carlos Pereira', suprido_cpf: '789.123.456-00', teto_anual: 38000, distribuicao: { element_30_01: 20, element_30_02: 35, element_33: 20, element_36: 15, element_39: 10 }, status: 'PENDENTE', pendencias: ['PC 2025/3 atrasada'] },
  { id: '5', comarca_id: 'c5', comarca_nome: 'Castanhal', comarca_codigo: 'CST', suprido_nome: 'Patricia Lima', suprido_cpf: '321.654.987-00', teto_anual: 32000, distribuicao: { element_30_01: 25, element_30_02: 25, element_33: 25, element_36: 15, element_39: 10 }, status: 'REGULAR' },
  { id: '6', comarca_id: 'c6', comarca_nome: 'Altamira', comarca_codigo: 'ALT', suprido_nome: 'Roberto Costa', suprido_cpf: '654.987.321-00', teto_anual: 35000, distribuicao: { element_30_01: 30, element_30_02: 20, element_33: 25, element_36: 15, element_39: 10 }, status: 'REGULAR' },
  { id: '7', comarca_id: 'c7', comarca_nome: 'Abaetetuba', comarca_codigo: 'ABA', teto_anual: 28000, distribuicao: { element_30_01: 20, element_30_02: 30, element_33: 25, element_36: 15, element_39: 10 }, status: 'SEM_SUPRIDO' },
  { id: '8', comarca_id: 'c8', comarca_nome: 'Paragominas', comarca_codigo: 'PGM', suprido_nome: 'Lucia Fernandes', suprido_cpf: '147.258.369-00', teto_anual: 30000, distribuicao: { element_30_01: 25, element_30_02: 25, element_33: 25, element_36: 15, element_39: 10 }, status: 'REGULAR' },
  { id: '9', comarca_id: 'c9', comarca_nome: 'Tucuruí', comarca_codigo: 'TUC', suprido_nome: 'Marcos Souza', suprido_cpf: '258.369.147-00', teto_anual: 33000, distribuicao: { element_30_01: 20, element_30_02: 30, element_33: 25, element_36: 15, element_39: 10 }, status: 'PENDENTE', pendencias: ['Documentos incompletos'] },
  { id: '10', comarca_id: 'c10', comarca_nome: 'Barcarena', comarca_codigo: 'BAR', suprido_nome: 'Fernanda Alves', suprido_cpf: '369.147.258-00', teto_anual: 27000, distribuicao: { element_30_01: 25, element_30_02: 25, element_33: 25, element_36: 15, element_39: 10 }, status: 'REGULAR' },
];

// Utility functions
export function calculateQuarterValue(tetoAnual: number): number {
  return tetoAnual / 3;
}

export function calculateElementValue(quarterValue: number, percentage: number): number {
  return (quarterValue * percentage) / 100;
}

export function validateDistribution(dist: ElementDistribution): boolean {
  const total = dist.element_30_01 + dist.element_30_02 + dist.element_33 + dist.element_36 + dist.element_39;
  return Math.abs(total - 100) < 0.01;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}
