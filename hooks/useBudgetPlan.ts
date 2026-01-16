import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { BudgetPlanConfig, BudgetPlanComputedValues, PTRES_CONFIG, EXPENSE_ELEMENTS, createDefaultBudgetPlan, PtresCode } from '../types/budgetPlanning';
import { useToast } from '../components/ui/ToastProvider';

interface BudgetAllocationDB {
  id: string;
  plan_id: string;
  ptres_code: string;
  element_code: string;
  dotacao_code: string;
  allocated_value: number;
  committed_value: number;
  description: string | null;
}

export function useBudgetPlan(year: number) {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const fetchBudgetPlan = useCallback(async (): Promise<BudgetPlanConfig | null> => {
    setLoading(true);
    try {
      // 1. Fetch Plan Header
      const { data: planData, error: planError } = await supabase
        .from('budget_plans')
        .select('*')
        .eq('year', year)
        .maybeSingle();

      if (planError) {
        throw planError;
      }

      if (!planData) {
        return null;
      }

      // 2. Fetch Allocations
      const { data: allocData, error: allocError } = await supabase
        .from('budget_allocations')
        .select('*')
        .eq('plan_id', planData.id);

      if (allocError) throw allocError;

      // 3. Reconstruct Config Structure
      // We need to group flat DB allocations back into hierarchical PtresAllocation structure
      const defaultConfig = createDefaultBudgetPlan(year);
      
      const reconstructedAllocations = defaultConfig.allocations.map(defaultAlloc => {
        // Find DB records for this PTRES
        const dbItems = allocData.filter(d => d.ptres_code === defaultAlloc.ptres_code);
        
        // If no DB items, return default
        if (dbItems.length === 0) return defaultAlloc;

        // Get description from the first item (since we store it denormalized or just take one)
        // Ideally description is per PTRES. In our schema it's per allocation row but conceptually per PTRES.
        // We take the description from the first valid record we find for this PTRES.
        const description = dbItems[0]?.description || defaultAlloc.description;

        // Map items
        const items = defaultAlloc.items.map(defaultItem => {
          const dbItem = dbItems.find(d => d.element_code === defaultItem.element_code);
          if (dbItem) {
            return {
              ...defaultItem,
              dotacao_code: dbItem.dotacao_code || defaultItem.dotacao_code,
              allocated_value: Number(dbItem.allocated_value) || 0,
              committed_value: Number(dbItem.committed_value) || 0,
            };
          }
          return defaultItem;
        });

        return {
          ...defaultAlloc,
          description,
          items
        };
      });

      return {
        id: planData.id, // Use DB UUID
        year: planData.year,
        total_budget: Number(planData.total_budget),
        allocations: reconstructedAllocations,
        created_at: planData.created_at,
        updated_at: planData.updated_at
      };

    } catch (error) {
      console.error('Error fetching budget plan:', error);
      showToast({
        title: 'Erro ao carregar',
        message: 'Não foi possível carregar o planejamento do servidor.',
        type: 'error'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [year, showToast]);

  const saveBudgetPlan = useCallback(async (config: BudgetPlanConfig) => {
    setLoading(true);
    try {
      // 1. Upsert Plan Header
      const { data: planData, error: planError } = await supabase
        .from('budget_plans')
        .upsert({
          year: config.year,
          total_budget: config.total_budget,
          updated_at: new Date().toISOString()
        }, { onConflict: 'year' })
        .select()
        .single();

      if (planError) throw planError;

      const planId = planData.id;

      // 2. Upsert Allocations
      // Flatten the structure for DB insertion
      const dbAllocations = config.allocations.flatMap(alloc => 
        alloc.items.map(item => ({
          plan_id: planId,
          ptres_code: alloc.ptres_code,
          element_code: item.element_code,
          dotacao_code: item.dotacao_code,
          allocated_value: item.allocated_value,
          committed_value: item.committed_value,
          description: alloc.description || null, // Denormalized description
          updated_at: new Date().toISOString()
        }))
      );

      const { error: allocError } = await supabase
        .from('budget_allocations')
        .upsert(dbAllocations, { 
          onConflict: 'plan_id,ptres_code,element_code',
          ignoreDuplicates: false 
        });

      if (allocError) throw allocError;

      showToast({
        title: 'Salvo com sucesso',
        message: 'Planejamento orçamentário sincronizado.',
        type: 'success'
      });

      return true;

    } catch (error) {
      console.error('Error saving budget plan:', error);
      showToast({
        title: 'Erro ao salvar',
        message: 'Falha ao persistir dados no servidor.',
        type: 'error'
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  return {
    fetchBudgetPlan,
    saveBudgetPlan,
    loading
  };
}
