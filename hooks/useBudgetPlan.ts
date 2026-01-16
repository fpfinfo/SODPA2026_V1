import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { BudgetPlanConfig, BudgetPlanComputedValues, PTRES_CONFIG, EXPENSE_ELEMENTS, createDefaultBudgetPlan, PtresCode, DotacaoItem } from '../types/budgetPlanning';
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

        // Get description from the first item
        const description = dbItems[0]?.description || defaultAlloc.description;

        // Map items: Iterate over Expense Elements to preserve order and grouping
        // For each element type, find ALL matching DB items.
        // If DB has items, use them. If not, use the default item.
        let items: DotacaoItem[] = [];
        
        EXPENSE_ELEMENTS.forEach(element => {
          const matchingDbItems = dbItems.filter(d => d.element_code === element.code);
          
          if (matchingDbItems.length > 0) {
            // Sort matching items? Maybe put active ones first, or by created_at if available?
            // For now, let's trust DB order or sort by active status (active first?)
            // Actually, for "Exhaust & Renew", the NEW (active) item is usually created AFTER the old one.
            // But we want to show history. Let's sort by created_at if possible.
            // Since we select *, created_at is available.
            matchingDbItems.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

            const mappedItems = matchingDbItems.map(dbItem => ({
              id: dbItem.id, // VITAL: Use DB UUID
              element_code: dbItem.element_code,
              element_name: element.name, // Use canonical name
              dotacao_code: dbItem.dotacao_code || '',
              allocated_value: Number(dbItem.allocated_value) || 0,
              committed_value: Number(dbItem.committed_value) || 0,
              is_active: dbItem.is_active ?? true, // Default true if null/missing
              parent_id: dbItem.parent_id,
            }));
            items = items.concat(mappedItems);
          } else {
            // No DB item for this element, use default
            const defaultItem = defaultAlloc.items.find(i => i.element_code === element.code);
            if (defaultItem) items.push(defaultItem);
          }
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
        alloc.items.map(item => {
          // Check if ID is a valid UUID. If not (it's a temp string), send undefined to let DB generate one.
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id);
          
          return {
            id: isUuid ? item.id : undefined, // Only send ID if it's existing UUID
            plan_id: planId,
            ptres_code: alloc.ptres_code,
            element_code: item.element_code,
            dotacao_code: item.dotacao_code,
            allocated_value: item.allocated_value,
            committed_value: item.committed_value,
            description: alloc.description || null,
            is_active: item.is_active,
            parent_id: item.parent_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.parent_id) ? item.parent_id : null, // Only link parent if it was a saved UUID
            updated_at: new Date().toISOString()
          };
        })
      );

      const { error: allocError } = await supabase
        .from('budget_allocations')
        .upsert(dbAllocations, { 
          onConflict: 'id', // Now we upsert by ID!
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
