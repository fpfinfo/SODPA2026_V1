import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface BudgetAllocation {
  id: string;
  plan_id: string;
  ptres_code: string;
  element_code: string;
  authorized_amount: number;
  committed_amount: number;
  available_amount: number;
  description?: string;
  is_active: boolean;
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
  fetchPTRESForElements: (elementCodes: string[]) => Promise<void>;
}

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
   * Busca PTRES disponíveis para os elementos de despesa da solicitação
   */
  const fetchPTRESForElements = useCallback(async (elementCodes: string[]) => {
    if (!elementCodes || elementCodes.length === 0) {
      setPtresOptions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Buscar alocações ativas para os elementos de despesa
      const { data, error: fetchError } = await supabase
        .from('budget_allocations')
        .select('ptres_code, element_code, authorized_amount, committed_amount, description')
        .in('element_code', elementCodes)
        .eq('is_active', true);

      if (fetchError) throw fetchError;

      // Agrupar por PTRES e somar valores disponíveis
      const ptresMap = new Map<string, PTRESOption>();
      
      (data || []).forEach((alloc: any) => {
        const available = (alloc.authorized_amount || 0) - (alloc.committed_amount || 0);
        
        if (ptresMap.has(alloc.ptres_code)) {
          const existing = ptresMap.get(alloc.ptres_code)!;
          existing.availableAmount += available;
        } else {
          ptresMap.set(alloc.ptres_code, {
            code: alloc.ptres_code,
            description: alloc.description || `PTRES ${alloc.ptres_code}`,
            availableAmount: available
          });
        }
      });

      setPtresOptions(Array.from(ptresMap.values()));
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
      const { data, error: fetchError } = await supabase
        .from('budget_allocations')
        .select('id, element_code, authorized_amount, committed_amount, description')
        .eq('ptres_code', ptresCode)
        .eq('is_active', true);

      if (fetchError) throw fetchError;

      const options: DotacaoOption[] = (data || []).map((alloc: any) => ({
        code: `${ptresCode}.${alloc.element_code}`,
        elementCode: alloc.element_code,
        description: alloc.description || `Elemento ${alloc.element_code}`,
        availableAmount: (alloc.authorized_amount || 0) - (alloc.committed_amount || 0)
      }));

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
    fetchPTRESForElements
  };
}

export default useBudgetAllocations;
