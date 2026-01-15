/**
 * Budget Planning Types
 * Hierarchical structure: Global Cap → PTRES → Dotação → Elemento
 */

// PTRES codes with descriptions
export const PTRES_CONFIG = {
  '8193': { name: 'Ordinário', description: 'Suprimento de Fundos Ordinário - Comarcas', color: 'blue' },
  '8727': { name: 'Extra-Emergencial', description: 'Suprimento Extraordinário - Emergências', color: 'amber' },
  '8163': { name: 'Extra-Júri', description: 'Suprimento Extraordinário - Sessões de Júri', color: 'purple' },
} as const;

export type PtresCode = keyof typeof PTRES_CONFIG;

// Expense elements (natureza da despesa)
export const EXPENSE_ELEMENTS = [
  { 
    code: '33.90.30', 
    name: 'Material de Consumo', 
    tooltip: 'Cobre subitens: 30.01 (Geral) e 30.02 (Combustíveis)',
    hasSubitems: true 
  },
  { code: '33.90.33', name: 'Passagens e Locomoção', tooltip: null, hasSubitems: false },
  { code: '33.90.36', name: 'Serviços PF', tooltip: 'Serviços de Terceiros - Pessoa Física', hasSubitems: false },
  { code: '33.90.39', name: 'Serviços PJ', tooltip: 'Serviços de Terceiros - Pessoa Jurídica', hasSubitems: false },
] as const;

// Dotação item within a PTRES
export interface DotacaoItem {
  id: string;
  element_code: string;      // "33.90.30", "33.90.33", etc.
  element_name: string;      // "Material de Consumo"
  dotacao_code: string;      // Editable: "170", "180", etc.
  allocated_value: number;   // R$ value
}

// PTRES allocation container
export interface PtresAllocation {
  id: string;
  ptres_code: PtresCode;
  ptres_name: string;
  items: DotacaoItem[];
}

// Full budget plan configuration
export interface BudgetPlanConfig {
  id: string;
  year: number;
  total_budget: number;
  allocations: PtresAllocation[];
  created_at?: string;
  updated_at?: string;
}

// Computed values for display
export interface PtresComputedValues {
  total_allocated: number;
  percentage_of_global: number;
  items_breakdown: {
    element_code: string;
    value: number;
    percentage: number;
  }[];
}

export interface BudgetPlanComputedValues {
  total_distributed: number;
  remaining: number;
  is_over_budget: boolean;
  percentage_used: number;
  ptres_values: Record<PtresCode, PtresComputedValues>;
}

// Default structure for new budget plan
export function createDefaultBudgetPlan(year: number): BudgetPlanConfig {
  const createPtresAllocation = (code: PtresCode): PtresAllocation => ({
    id: `${code}-${year}`,
    ptres_code: code,
    ptres_name: PTRES_CONFIG[code].name,
    items: EXPENSE_ELEMENTS.map((el, idx) => ({
      id: `${code}-${el.code}-${year}`,
      element_code: el.code,
      element_name: el.name,
      dotacao_code: String(170 + idx), // Default dotação codes
      allocated_value: 0,
    })),
  });

  return {
    id: `budget-${year}`,
    year,
    total_budget: 6000000, // R$ 6 million default
    allocations: [
      createPtresAllocation('8193'),
      createPtresAllocation('8727'),
      createPtresAllocation('8163'),
    ],
  };
}

// Calculate computed values from config
export function calculateBudgetValues(config: BudgetPlanConfig): BudgetPlanComputedValues {
  const ptres_values: Record<string, PtresComputedValues> = {};
  let total_distributed = 0;

  for (const allocation of config.allocations) {
    const ptres_total = allocation.items.reduce((sum, item) => sum + item.allocated_value, 0);
    total_distributed += ptres_total;

    ptres_values[allocation.ptres_code] = {
      total_allocated: ptres_total,
      percentage_of_global: config.total_budget > 0 ? (ptres_total / config.total_budget) * 100 : 0,
      items_breakdown: allocation.items.map(item => ({
        element_code: item.element_code,
        value: item.allocated_value,
        percentage: ptres_total > 0 ? (item.allocated_value / ptres_total) * 100 : 0,
      })),
    };
  }

  return {
    total_distributed,
    remaining: config.total_budget - total_distributed,
    is_over_budget: total_distributed > config.total_budget,
    percentage_used: config.total_budget > 0 ? (total_distributed / config.total_budget) * 100 : 0,
    ptres_values: ptres_values as Record<PtresCode, PtresComputedValues>,
  };
}

// Format currency helper
export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

// Parse BRL input to number
export function parseBRL(value: string): number {
  const cleaned = value.replace(/[^\d,.-]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}
