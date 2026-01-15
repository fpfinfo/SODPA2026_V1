/**
 * useBudgetConfig Hook
 * Centralized budget configuration service for system-wide access
 * Provides PTRES, Dotação, and Elemento data to all components
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BudgetPlanConfig,
  PtresCode,
  PTRES_CONFIG,
  EXPENSE_ELEMENTS,
  createDefaultBudgetPlan,
  calculateBudgetValues,
  formatBRL,
} from '../types/budgetPlanning';
import { supabase } from './supabaseClient';

// Supply category to PTRES mapping
const SUPPLY_CATEGORY_PTRES: Record<string, PtresCode> = {
  'ORDINARY': '8193',
  'EXTRAORDINARY': '8727',
  'JURI': '8163',
};

// Element code normalization (handles sub-elements)
const normalizeElementCode = (code: string): string => {
  // 33.90.30.01, 33.90.30.02 → 33.90.30 (Consumo)
  // 3.3.90.30.01 → 33.90.30
  const cleaned = code.replace(/\./g, '').replace(/^3/, '');
  if (cleaned.startsWith('39030')) return '33.90.30';
  if (cleaned.startsWith('39033')) return '33.90.33';
  if (cleaned.startsWith('39036')) return '33.90.36';
  if (cleaned.startsWith('39039')) return '33.90.39';
  
  // Direct match
  if (code.includes('30.01') || code.includes('30.02') || code === '33.90.30') return '33.90.30';
  if (code.includes('33') || code === '33.90.33') return '33.90.33';
  if (code.includes('36') || code === '33.90.36') return '33.90.36';
  if (code.includes('39') || code === '33.90.39') return '33.90.39';
  
  return '33.90.30'; // Default
};

export interface BudgetLookupResult {
  ptresCode: PtresCode;
  ptresName: string;
  dotacaoCode: string;
  elementCode: string;
  elementName: string;
  allocatedValue: number;
  availableBalance: number;
}

export interface UseBudgetConfigReturn {
  config: BudgetPlanConfig;
  isLoading: boolean;
  error: string | null;
  
  // Lookup functions
  getPtresForSupplyCategory: (category: 'ORDINARY' | 'EXTRAORDINARY' | 'JURI') => PtresCode;
  getDotacaoCode: (ptresCode: PtresCode, elementCode: string) => string;
  getElementName: (elementCode: string) => string;
  
  // Full lookup
  lookupBudgetInfo: (supplyCategory: string, elementCode: string) => BudgetLookupResult | null;
  
  // Balance functions
  getPtresTotal: (ptresCode: PtresCode) => number;
  getGlobalTotal: () => number;
  getGlobalRemaining: () => number;
  isOverBudget: () => boolean;
  
  // For documents
  formatForDocument: (supplyCategory: string, elementCode: string) => {
    ptres: string;
    dotacao: string;
    elementoDescricao: string;
    naturezaDespesa: string;
  };
  
  // Refresh
  refresh: () => Promise<void>;
  updateConfig: (newConfig: BudgetPlanConfig) => void;
}

export function useBudgetConfig(): UseBudgetConfigReturn {
  const [config, setConfig] = useState<BudgetPlanConfig>(createDefaultBudgetPlan(2026));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const computed = useMemo(() => calculateBudgetValues(config), [config]);

  const loadConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      // Try to load from Supabase
      const { data, error: dbError } = await supabase
        .from('budget_ptres_config')
        .select('*')
        .eq('year', 2026)
        .single();

      if (dbError || !data) {
        // Use default config
        console.log('[useBudgetConfig] Using default config');
        setConfig(createDefaultBudgetPlan(2026));
      } else {
        setConfig(data as BudgetPlanConfig);
      }
    } catch (err) {
      console.error('[useBudgetConfig] Error loading config:', err);
      setConfig(createDefaultBudgetPlan(2026));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // Get PTRES code for supply category
  const getPtresForSupplyCategory = useCallback((category: 'ORDINARY' | 'EXTRAORDINARY' | 'JURI'): PtresCode => {
    return SUPPLY_CATEGORY_PTRES[category] || '8193';
  }, []);

  // Get Dotação code
  const getDotacaoCode = useCallback((ptresCode: PtresCode, elementCode: string): string => {
    const normalizedElement = normalizeElementCode(elementCode);
    const allocation = config.allocations.find(a => a.ptres_code === ptresCode);
    if (!allocation) return '---';
    
    const item = allocation.items.find(i => i.element_code === normalizedElement);
    return item?.dotacao_code || '---';
  }, [config]);

  // Get Element name
  const getElementName = useCallback((elementCode: string): string => {
    const normalizedElement = normalizeElementCode(elementCode);
    const element = EXPENSE_ELEMENTS.find(e => e.code === normalizedElement);
    return element?.name || 'Material de Consumo';
  }, []);

  // Full lookup
  const lookupBudgetInfo = useCallback((supplyCategory: string, elementCode: string): BudgetLookupResult | null => {
    const mappedCategory = supplyCategory === 'EXTRAORDINARY' ? 'EXTRAORDINARY' : 
                          supplyCategory === 'JURI' ? 'JURI' : 'ORDINARY';
    const ptresCode = getPtresForSupplyCategory(mappedCategory);
    const normalizedElement = normalizeElementCode(elementCode);
    
    const allocation = config.allocations.find(a => a.ptres_code === ptresCode);
    if (!allocation) return null;
    
    const item = allocation.items.find(i => i.element_code === normalizedElement);
    if (!item) return null;
    
    const ptresValues = computed.ptres_values[ptresCode];
    
    return {
      ptresCode,
      ptresName: PTRES_CONFIG[ptresCode].name,
      dotacaoCode: item.dotacao_code,
      elementCode: normalizedElement,
      elementName: item.element_name,
      allocatedValue: item.allocated_value,
      availableBalance: ptresValues?.total_allocated || 0,
    };
  }, [config, computed, getPtresForSupplyCategory]);

  // Balance functions
  const getPtresTotal = useCallback((ptresCode: PtresCode): number => {
    return computed.ptres_values[ptresCode]?.total_allocated || 0;
  }, [computed]);

  const getGlobalTotal = useCallback((): number => {
    return computed.total_distributed;
  }, [computed]);

  const getGlobalRemaining = useCallback((): number => {
    return computed.remaining;
  }, [computed]);

  const isOverBudget = useCallback((): boolean => {
    return computed.is_over_budget;
  }, [computed]);

  // Format for documents (Portarias, Certidões)
  const formatForDocument = useCallback((supplyCategory: string, elementCode: string) => {
    const info = lookupBudgetInfo(supplyCategory, elementCode);
    
    return {
      ptres: info ? info.ptresCode : '8193',
      dotacao: info ? info.dotacaoCode : '---',
      elementoDescricao: info ? info.elementName : 'Material de Consumo',
      naturezaDespesa: normalizeElementCode(elementCode),
    };
  }, [lookupBudgetInfo]);

  return {
    config,
    isLoading,
    error,
    getPtresForSupplyCategory,
    getDotacaoCode,
    getElementName,
    lookupBudgetInfo,
    getPtresTotal,
    getGlobalTotal,
    getGlobalRemaining,
    isOverBudget,
    formatForDocument,
    refresh: loadConfig,
    updateConfig: setConfig,
  };
}

// Static utility for components without hook access
export const BudgetUtils = {
  normalizeElementCode,
  getPtresForCategory: (category: string): PtresCode => SUPPLY_CATEGORY_PTRES[category] || '8193',
  getElementInfo: (code: string) => EXPENSE_ELEMENTS.find(e => e.code === normalizeElementCode(code)),
  formatCurrency: formatBRL,
};

export default useBudgetConfig;
