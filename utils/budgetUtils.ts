/**
 * Budget Utilities
 * Helper functions for PTRES-based budget logic
 */

export type PTRESCategory = 'EXTRAORDINARIO' | 'ORDINARIO' | 'ESPECIFICO';

export interface BudgetInfo {
  label: string; // "Orçamento da Unidade" ou "Orçamento Disponível"
  source: 'SOSFU' | 'UNIDADE';
  ptres: string;
  unitName: string;
  unitCode?: string;
  annualLimit: number;
  executed: number;
  currentRequest: number;
}

/**
 * Determina a categoria do PTRES
 */
export function getPTRESCategory(ptres?: string): PTRESCategory {
  if (!ptres) return 'ESPECIFICO';
  
  // Extra-Emergenciais e Concursos
  if (ptres === '8727' || ptres === '8163') {
    return 'EXTRAORDINARIO';
  }
  
  // Ordinários
  if (ptres === '8193') {
    return 'ORDINARIO';
  }
  
  // PTRES específico da unidade
  return 'ESPECIFICO';
}

/**
 * Retorna o label apropriado baseado no PTRES
 */
export function getBudgetLabel(ptres?: string): string {
  const category = getPTRESCategory(ptres);
  
  if (category === 'EXTRAORDINARIO') {
    return 'Orçamento Disponível';
  }
  
  return 'Orçamento da Unidade';
}

/**
 * Verifica se deve buscar do SOSFU
 */
export function shouldFetchFromSOSFU(ptres?: string): boolean {
  const category = getPTRESCategory(ptres);
  return category === 'EXTRAORDINARIO' || category === 'ORDINARIO';
}

/**
 * Formata valor monetário
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  }).format(value);
}
