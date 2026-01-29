// ============================================================================
// SODPA - Serviço de Diárias e Passagens Aéreas
// Constantes do Sistema
// ============================================================================

import { StatusDiaria, StatusPassagem } from './types';

// ============================================================================
// VALORES DE DIÁRIAS - Decreto Estadual (Referência TJPA)
// ============================================================================

export const DIARIAS_CONFIG = {
  // Valores por cargo/nível (em R$)
  VALORES: {
    DESEMBARGADOR: { INTEGRAL: 500.00, MEIA: 250.00, COMPLEMENTAR: 125.00 },
    JUIZ: { INTEGRAL: 450.00, MEIA: 225.00, COMPLEMENTAR: 112.50 },
    ANALISTA: { INTEGRAL: 380.00, MEIA: 190.00, COMPLEMENTAR: 95.00 },
    TECNICO: { INTEGRAL: 320.00, MEIA: 160.00, COMPLEMENTAR: 80.00 },
    AUXILIAR: { INTEGRAL: 280.00, MEIA: 140.00, COMPLEMENTAR: 70.00 },
  },
  // Limites de acúmulo
  LIMITES: {
    MAX_DIARIAS_MENSAL: 15,
    MAX_DIARIAS_CONTINUAS: 7,
    MAX_VALOR_MENSAL: 10000.00,
  },
  // Adicional por destino
  ADICIONAL_CAPITAL: 1.2, // 20% adicional para capitais
  ADICIONAL_EXTERIOR: 1.5, // 50% adicional para exterior
} as const;

// ============================================================================
// PASSAGENS - Configurações
// ============================================================================

export const PASSAGENS_CONFIG = {
  // Classes de tarifa
  CLASSES: {
    ECONOMICA: { label: 'Econômica', multiplicador: 1.0 },
    EXECUTIVA: { label: 'Executiva', multiplicador: 2.5 },
    PRIMEIRA_CLASSE: { label: 'Primeira Classe', multiplicador: 4.0 },
  },
  // Tipos de passagem
  TIPOS: {
    AEREA: { label: 'Aérea', icone: 'Plane' },
    TERRESTRE: { label: 'Terrestre', icone: 'Bus' },
    FLUVIAL: { label: 'Fluvial', icone: 'Ship' },
  },
  // Antecedência mínima para solicitação (dias)
  ANTECEDENCIA_MINIMA: 5,
  ANTECEDENCIA_URGENTE: 2,
} as const;

// ============================================================================
// SLA - PRAZOS DE ANÁLISE
// ============================================================================

export const SLA_SODPA = {
  // Análise técnica
  ANALISE_DIARIA_DIAS: 3,
  ANALISE_PASSAGEM_DIAS: 5,
  // Aprovação SEFIN
  APROVACAO_SEFIN_DIAS: 2,
  // Emissão de passagem
  EMISSAO_PASSAGEM_DIAS: 2,
  // Pagamento
  PAGAMENTO_DIARIA_DIAS: 5,
} as const;

// ============================================================================
// STATUS COLUMNS - Kanban/Dashboard
// ============================================================================

export const DIARIAS_STATUS_COLUMNS = [
  { id: 'SOLICITADA', label: 'Solicitadas', color: 'blue' },
  { id: 'EM_ANALISE', label: 'Em Análise', color: 'amber' },
  { id: 'APROVADA', label: 'Aprovadas', color: 'green' },
  { id: 'PAGA', label: 'Pagas', color: 'emerald' },
  { id: 'CANCELADA', label: 'Canceladas', color: 'red' },
];

export const PASSAGENS_STATUS_COLUMNS = [
  { id: 'SOLICITADA', label: 'Solicitadas', color: 'blue' },
  { id: 'COTACAO', label: 'Em Cotação', color: 'amber' },
  { id: 'EMITIDA', label: 'Emitidas', color: 'green' },
  { id: 'UTILIZADA', label: 'Utilizadas', color: 'emerald' },
  { id: 'CANCELADA', label: 'Canceladas', color: 'red' },
];

export const UNIFIED_STATUS_COLUMNS = [
  { 
    id: 'ENTRADA', 
    label: 'Entrada / Triagem', 
    statuses: ['SOLICITADA'] as (StatusDiaria | StatusPassagem)[],
    color: 'blue'
  },
  { 
    id: 'ANALISE', 
    label: 'Análise Técnica', 
    statuses: ['EM_ANALISE', 'COTACAO'] as (StatusDiaria | StatusPassagem)[],
    color: 'amber'
  },
  { 
    id: 'APROVACAO', 
    label: 'Aprovação / Emissão', 
    statuses: ['APROVADA', 'EMITIDA'] as (StatusDiaria | StatusPassagem)[],
    color: 'green'
  },
  { 
    id: 'CONCLUIDO', 
    label: 'Concluído', 
    statuses: ['PAGA', 'UTILIZADA'] as (StatusDiaria | StatusPassagem)[],
    color: 'emerald'
  },
];

// ============================================================================
// PRIORIDADES
// ============================================================================

export const PRIORIDADES = {
  NORMAL: { label: 'Normal', color: 'gray', ordem: 0 },
  URGENTE: { label: 'Urgente', color: 'amber', ordem: 1 },
  EMERGENCIAL: { label: 'Emergencial', color: 'red', ordem: 2 },
} as const;

// ============================================================================
// BRASÃO E IDENTIDADE VISUAL
// ============================================================================

export const BRASAO_TJPA_URL = 'https://bnlgogjdoqaqcjjunevu.supabase.co/storage/v1/object/public/assets/brasao-tjpa.png';

// Cores do tema SODPA
export const SODPA_THEME = {
  primary: '#2563eb', // blue-600
  secondary: '#7c3aed', // violet-600
  accent: '#0891b2', // cyan-600
  success: '#059669', // emerald-600
  warning: '#d97706', // amber-600
  danger: '#dc2626', // red-600
} as const;

// ============================================================================
// HELPERS
// ============================================================================

// Calcula o valor total da diária
export const calcularValorDiaria = (
  tipoDiaria: 'INTEGRAL' | 'MEIA' | 'COMPLEMENTAR',
  cargo: keyof typeof DIARIAS_CONFIG.VALORES,
  quantidade: number,
  isCapital: boolean = false,
  isExterior: boolean = false
): number => {
  const valorBase = DIARIAS_CONFIG.VALORES[cargo][tipoDiaria];
  let multiplicador = 1;
  
  if (isExterior) {
    multiplicador = DIARIAS_CONFIG.ADICIONAL_EXTERIOR;
  } else if (isCapital) {
    multiplicador = DIARIAS_CONFIG.ADICIONAL_CAPITAL;
  }
  
  return valorBase * quantidade * multiplicador;
};

// Formata valor em Real
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Formata data
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('pt-BR');
};

// Calcula dias úteis
export const calcularDiasUteis = (dataInicio: string, dataFim: string): number => {
  const inicio = new Date(dataInicio);
  const fim = new Date(dataFim);
  let dias = 0;
  
  const atual = new Date(inicio);
  while (atual <= fim) {
    const diaSemana = atual.getDay();
    if (diaSemana !== 0 && diaSemana !== 6) {
      dias++;
    }
    atual.setDate(atual.getDate() + 1);
  }
  
  return dias;
};
