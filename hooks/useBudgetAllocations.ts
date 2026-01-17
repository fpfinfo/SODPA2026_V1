import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface BudgetAllocation {
  id: string;
  plan_id: string;
  ptres_code: string;
  element_code: string;
  dotacao_code?: string;
  allocated_value: number;
  committed_value: number;
  description?: string;
}

export interface PTRESOption {
  code: string;
  description: string;
  availableAmount: number;
}

export interface DotacaoOption {
  code: string;
  elementCode: string;
  description: string;
  availableAmount: number;
}

interface UseBudgetAllocationsReturn {
  ptresOptions: PTRESOption[];
  dotacaoOptions: DotacaoOption[];
  isLoading: boolean;
  error: string | null;
  fetchDotacoesForPTRES: (ptresCode: string) => Promise<DotacaoOption[]>;
  fetchAllPTRES: () => Promise<void>;
}

// PTRES descriptions from the budget planning configuration
const PTRES_DESCRIPTIONS: Record<string, string> = {
  'ORD': 'Ordinário - Suprimentos comuns de manutenção predial',
  'EXT': 'Extra-Emergencial - Atendimentos urgentes e imprevistos',
  'JURI': 'Extra-Juri - Despesas com sessões do Tribunal do Júri',
  'COMIL_1G': 'COMIL - Segurança 1° Grau',
  'COMIL_2G': 'COMIL - Segurança 2° Grau',
  '172493': 'PTRES 172493 - Ação de Suprimento de Fundos',
};

/**
 * Hook para buscar PTRES e Dotações do banco de dados
 * para uso no wizard de execução da despesa
 */
export function useBudgetAllocations(): UseBudgetAllocationsReturn {
  const [ptresOptions, setPtresOptions] = useState<PTRESOption[]>([]);
  const [dotacaoOptions, setDotacaoOptions] = useState<DotacaoOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Busca TODOS os PTRES disponíveis no orçamento do ano atual
   */
  const fetchAllPTRES = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const currentYear = new Date().getFullYear();

      // First, get the budget plan for current year
      const { data: planData, error: planError } = await supabase
        .from('budget_plans')
        .select('id')
        .eq('year', currentYear)
        .maybeSingle();

      if (planError) throw planError;

      if (!planData) {
        console.warn(`No budget plan found for year ${currentYear}`);
        setPtresOptions([]);
        return;
      }

      // Fetch all allocations for this plan
      const { data, error: fetchError } = await supabase
        .from('budget_allocations')
        .select('ptres_code, element_code, dotacao_code, allocated_value, committed_value, description')
        .eq('plan_id', planData.id);

      if (fetchError) throw fetchError;

      // Group by PTRES and sum available values
      const ptresMap = new Map<string, PTRESOption>();
      
      (data || []).forEach((alloc: any) => {
        const available = (Number(alloc.allocated_value) || 0) - (Number(alloc.committed_value) || 0);
        
        if (ptresMap.has(alloc.ptres_code)) {
          const existing = ptresMap.get(alloc.ptres_code)!;
          existing.availableAmount += available;
        } else {
          ptresMap.set(alloc.ptres_code, {
            code: alloc.ptres_code,
            description: PTRES_DESCRIPTIONS[alloc.ptres_code] || alloc.description || `PTRES ${alloc.ptres_code}`,
            availableAmount: available
          });
        }
      });

      const options = Array.from(ptresMap.values());
      console.log('[useBudgetAllocations] PTRES options loaded:', options);
      setPtresOptions(options);
    } catch (err) {
      console.error('Error fetching PTRES options:', err);
      setError((err as Error).message);
      setPtresOptions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Busca dotações disponíveis para um PTRES específico
   */
  const fetchDotacoesForPTRES = useCallback(async (ptresCode: string): Promise<DotacaoOption[]> => {
    if (!ptresCode) {
      setDotacaoOptions([]);
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      const currentYear = new Date().getFullYear();

      // Get the budget plan for current year
      const { data: planData, error: planError } = await supabase
        .from('budget_plans')
        .select('id')
        .eq('year', currentYear)
        .maybeSingle();

      if (planError) throw planError;
      if (!planData) {
        setDotacaoOptions([]);
        return [];
      }

      const { data, error: fetchError } = await supabase
        .from('budget_allocations')
        .select('id, element_code, dotacao_code, allocated_value, committed_value, description')
        .eq('plan_id', planData.id)
        .eq('ptres_code', ptresCode);

      if (fetchError) throw fetchError;

      const options: DotacaoOption[] = (data || []).map((alloc: any) => ({
        code: alloc.dotacao_code || `${ptresCode}.${alloc.element_code}`,
        elementCode: alloc.element_code,
        description: alloc.description || `Elemento ${alloc.element_code}`,
        availableAmount: (Number(alloc.allocated_value) || 0) - (Number(alloc.committed_value) || 0)
      }));

      console.log('[useBudgetAllocations] Dotação options for', ptresCode, ':', options);
      setDotacaoOptions(options);
      return options;
    } catch (err) {
      console.error('Error fetching Dotacao options:', err);
      setError((err as Error).message);
      setDotacaoOptions([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    ptresOptions,
    dotacaoOptions,
    isLoading,
    error,
    fetchDotacoesForPTRES,
    fetchAllPTRES
  };
}

export default useBudgetAllocations;
