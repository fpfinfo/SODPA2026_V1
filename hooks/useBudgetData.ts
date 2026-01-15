/**
 * useBudgetData Hook
 * Supabase CRUD for budget actions, allocations, and rules
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { BudgetAction, Allocation, BudgetRule } from '../types';

interface UseBudgetDataReturn {
  // Data
  actions: BudgetAction[];
  allocations: Allocation[];
  rules: BudgetRule[];
  
  // Loading
  isLoading: boolean;
  error: string | null;
  
  // CRUD
  updateActionBalance: (codigo: string, newBalance: number) => Promise<boolean>;
  createRule: (rule: Omit<BudgetRule, 'id'>) => Promise<boolean>;
  deleteRule: (id: string) => Promise<boolean>;
  
  // Refresh
  refresh: () => Promise<void>;
}

export function useBudgetData(): UseBudgetDataReturn {
  const [actions, setActions] = useState<BudgetAction[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [rules, setRules] = useState<BudgetRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch budget actions
      const { data: actionsData, error: actionsError } = await supabase
        .from('acoes_orcamentarias')
        .select('*')
        .eq('ativo', true)
        .order('codigo');
      
      if (actionsError) throw actionsError;
      
      // Map to BudgetAction type
      setActions((actionsData || []).map(a => ({
        code: a.codigo,
        description: a.descricao,
        balance: parseFloat(a.saldo)
      })));

      // Fetch allocations
      const { data: allocData, error: allocError } = await supabase
        .from('dotacoes')
        .select('*')
        .eq('ativo', true)
        .order('codigo');
      
      if (allocError) throw allocError;
      
      setAllocations((allocData || []).map(a => ({
        code: a.codigo,
        description: a.descricao
      })));

      // Fetch rules
      const { data: rulesData, error: rulesError } = await supabase
        .from('regras_orcamentarias')
        .select('*')
        .eq('ativo', true);
      
      if (rulesError) throw rulesError;
      
      setRules((rulesData || []).map(r => ({
        id: r.id,
        unitCategory: r.tipo_unidade as any,
        supplyCategory: r.categoria_suprimento as any,
        elementPrefix: r.prefixo_elemento,
        targetActionCode: r.acao_codigo,
        targetAllocationCode: r.dotacao_codigo
      })));

    } catch (err: any) {
      console.error('Error fetching budget data:', err);
      setError(err.message || 'Erro ao carregar dados orçamentários');
      
      // Fallback to mock data
      setActions(FALLBACK_ACTIONS);
      setAllocations(FALLBACK_ALLOCATIONS);
      setRules(FALLBACK_RULES);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateActionBalance = async (codigo: string, newBalance: number): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('acoes_orcamentarias')
        .update({ saldo: newBalance, updated_at: new Date().toISOString() })
        .eq('codigo', codigo);
      
      if (error) throw error;
      await fetchData();
      return true;
    } catch (err: any) {
      console.error('Error updating action balance:', err);
      setError(err.message);
      return false;
    }
  };

  const createRule = async (rule: Omit<BudgetRule, 'id'>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('regras_orcamentarias')
        .insert([{
          tipo_unidade: rule.unitCategory,
          categoria_suprimento: rule.supplyCategory,
          prefixo_elemento: rule.elementPrefix,
          acao_codigo: rule.targetActionCode,
          dotacao_codigo: rule.targetAllocationCode
        }]);
      
      if (error) throw error;
      await fetchData();
      return true;
    } catch (err: any) {
      console.error('Error creating rule:', err);
      setError(err.message);
      return false;
    }
  };

  const deleteRule = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('regras_orcamentarias')
        .update({ ativo: false })
        .eq('id', id);
      
      if (error) throw error;
      await fetchData();
      return true;
    } catch (err: any) {
      console.error('Error deleting rule:', err);
      setError(err.message);
      return false;
    }
  };

  return {
    actions,
    allocations,
    rules,
    isLoading,
    error,
    updateActionBalance,
    createRule,
    deleteRule,
    refresh: fetchData,
  };
}

// Fallback data if Supabase fails
const FALLBACK_ACTIONS: BudgetAction[] = [
  { code: '8193', description: 'Custeio e Manutenção das Comarcas (Ordinário)', balance: 8000000.00 },
  { code: '8163', description: 'Realização de Sessões do Júri (Extra-Júri)', balance: 3500000.00 },
  { code: '8183', description: 'Gestão Administrativa e Tecnologia (Emergencial TI)', balance: 2000000.00 },
  { code: '8177', description: 'Capacitação de Servidores (SGP)', balance: 500000.00 },
];

const FALLBACK_ALLOCATIONS: Allocation[] = [
  { code: '170', description: 'Tesouro do Estado - Custeio' },
  { code: '171', description: 'Tesouro do Estado - Transporte' },
  { code: '180', description: 'Fundo Especial de Reaparelhamento - Júri' },
  { code: '190', description: 'Fundo de Informatização' },
];

const FALLBACK_RULES: BudgetRule[] = [
  { id: '1', unitCategory: 'JURISDICTIONAL', supplyCategory: 'ORDINARY', elementPrefix: '3.3.90.30', targetActionCode: '8193', targetAllocationCode: '170' },
  { id: '2', unitCategory: 'JURISDICTIONAL', supplyCategory: 'ORDINARY', elementPrefix: '3.3.90.33', targetActionCode: '8193', targetAllocationCode: '171' },
  { id: '3', unitCategory: 'JURISDICTIONAL', supplyCategory: 'ORDINARY', elementPrefix: '3.3.90.36', targetActionCode: '8193', targetAllocationCode: '170' },
  { id: '4', unitCategory: 'JURISDICTIONAL', supplyCategory: 'ORDINARY', elementPrefix: '3.3.90.39', targetActionCode: '8193', targetAllocationCode: '170' },
];
