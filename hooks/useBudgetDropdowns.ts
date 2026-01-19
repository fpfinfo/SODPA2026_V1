import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

interface PTRES {
  ptres_code: string;
  ptres_description: string;
  valor_disponivel: number;
}

interface Dotacao {
  dotacao_code: string;
  dotacao_description: string;
  element_code: string;
  element_name: string;
  valor_disponivel: number;
}

/**
 * Hook para gerenciar dropdowns de PTRES e Dotação Orçamentária
 * FONTE: budget_plans + budget_allocations (mesma da aba Orçamento)
 */
export const useBudgetDropdowns = () => {
  const ano = new Date().getFullYear();

  // Buscar lista de PTRES
  const { data: ptresList, isLoading: loadingPTRES, error: errorPTRES } = useQuery<PTRES[]>({
    queryKey: ['budget-ptres', ano],
    queryFn: async () => {
      console.log('🔍 Buscando PTRES do ano', ano);
      
      // 1. Buscar plan_id do ano
      const { data: planData, error: planError } = await supabase
        .from('budget_plans')
        .select('id')
        .eq('year', ano)
        .maybeSingle();
      
      if (planError) {
        console.error('❌ Erro ao buscar plan:', planError);
        throw planError;
      }
      
      if (!planData) {
        console.log('⚠️ Nenhum plano orçamentário encontrado para', ano);
        return [];
      }
      
      console.log('📋 Plan ID encontrado:', planData.id);
      
      // 2. Buscar allocations e agrupar por PTRES
      const { data: allocations, error: allocError } = await supabase
        .from('budget_allocations')
        .select('ptres_code, description, allocated_value, committed_value')
        .eq('plan_id', planData.id)
        .eq('is_active', true); // Apenas dotações ativas
      
      if (allocError) {
        console.error('❌ Erro ao buscar allocations:', allocError);
        throw allocError;
      }
      
      if (!allocations || allocations.length === 0) {
        console.log('⚠️ Nenhuma alocação encontrada');
        return [];
      }
      
      console.log('📊 Allocations encontradas:', allocations.length);
      
      // 3. Agrupar por PTRES e somar valores
      const ptresMap = new Map<string, { description: string, total_allocated: number, total_committed: number }>();
      
      allocations.forEach(alloc => {
        const existing = ptresMap.get(alloc.ptres_code);
        const allocated = Number(alloc.allocated_value) || 0;
        const committed = Number(alloc.committed_value) || 0;
        
        if (existing) {
          existing.total_allocated += allocated;
          existing.total_committed += committed;
        } else {
          ptresMap.set(alloc.ptres_code, {
            description: alloc.description || '',
            total_allocated: allocated,
            total_committed: committed
          });
        }
      });
      
      // 4. Converter para array
      const result = Array.from(ptresMap.entries()).map(([code, data]) => ({
        ptres_code: code,
        ptres_description: data.description,
        valor_disponivel: data.total_allocated - data.total_committed
      })).sort((a, b) => a.ptres_code.localeCompare(b.ptres_code));
      
      console.log('✅ PTRES processados:', result.length);
      console.log('📋 PTRES:', result.map(p => p.ptres_code).join(', '));
      
      return result;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Função para buscar dotações de um PTRES específico
  const getDotacoes = async (ptresCode: string): Promise<Dotacao[]> => {
    if (!ptresCode) {
      console.log('⚠️ getDotacoes: PTRES vazio');
      return [];
    }
    
    console.log('🔍 getDotacoes: Buscando dotações para PTRES', ptresCode);
    
    // 1. Buscar plan_id
    const { data: planData, error: planError } = await supabase
      .from('budget_plans')
      .select('id')
      .eq('year', ano)
      .maybeSingle();
    
    if (planError || !planData) {
      console.error('❌ Erro ao buscar plan:', planError);
      return [];
    }
    
    // 2. Buscar allocations deste PTRES
    const { data: allocations, error: allocError } = await supabase
      .from('budget_allocations')
      .select('element_code, dotacao_code, allocated_value, committed_value')
      .eq('plan_id', planData.id)
      .eq('ptres_code', ptresCode)
      .eq('is_active', true) // Apenas dotações ativas
      .order('element_code');
    
    if (allocError) {
      console.error('❌ Erro ao buscar allocations:', allocError);
      throw allocError;
    }
    
    if (!allocations || allocations.length === 0) {
      console.log('⚠️ Nenhuma dotação encontrada para PTRES', ptresCode);
      return [];
    }
    
    console.log('✅ Dotações encontradas:', allocations.length);
    
    // 3. Mapear para formato do dropdown
    const mapped = allocations.map(alloc => {
      const allocated = Number(alloc.allocated_value) || 0;
      const committed = Number(alloc.committed_value) || 0;
      
      return {
        dotacao_code: alloc.dotacao_code || alloc.element_code, // Usar element_code como fallback
        dotacao_description: getElementName(alloc.element_code),
        element_code: alloc.element_code,
        element_name: getElementName(alloc.element_code),
        valor_disponivel: allocated - committed
      };
    });
    
    console.log('📊 Dotações mapeadas:', mapped);
    
    return mapped;
  };

  return { 
    ptresList, 
    loadingPTRES, 
    errorPTRES,
    getDotacoes 
  };
};

// Helper: Mapear códigos de elemento para nomes
function getElementName(code: string): string {
  const elementMap: { [key: string]: string } = {
    '3.3.90.30': 'Material de Consumo',
    '3.3.90.31': 'Premiações Culturais',
    '3.3.90.33': 'Passagens e Locomoção',
    '3.3.90.36': 'Outros Serviços - Pessoa Física',
    '3.3.90.39': 'Outros Serviços - Pessoa Jurídica',
    '3.3.90.14': 'Diárias',
    '3.3.90.92': 'Despesas de Exercícios Anteriores'
  };
  
  return elementMap[code] || code;
}
