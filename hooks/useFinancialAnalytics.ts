import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface AnalyticItem {
  name: string;
  value: number;
  percent?: number;
  code?: string;
  role?: string;
  unit?: string;
  color?: string;
}

export interface FinancialAnalyticsData {
  budget: {
    total: number;
    executed: number;
    percentage: number;
    executedOrdinary?: number;
    executedExtraordinary?: number;
  };
  byElement: AnalyticItem[];
  byType: AnalyticItem[];
  byComarca: AnalyticItem[];
  byEntrancia: AnalyticItem[];
  byPole: AnalyticItem[];
  byRegion: AnalyticItem[];
  topSupridos: AnalyticItem[];
  budgetAllocations: {
    ptres_code: string;
    allocated_value: number;
    committed_value: number;
  }[];
  isLoading: boolean;
  error: string | null;
}

interface ExpenseItemRaw {
  element?: string;
  code?: string;
  value?: number;
  val?: number;  // Formulários usam 'val' em vez de 'value'
}

interface FinancialRequestRaw {
  id: string;
  valor_aprovado: number | null;
  valor_solicitado: number | null;
  tipo: string;
  status: string;
  itens_despesa: ExpenseItemRaw[] | null;
  user_id: string;
  profiles: {
    email: string | null;
    nome: string | null;
  } | null;
}

interface BudgetAllocationRaw {
  ptres_code: string;
  allocated_value: number;
  committed_value: number;
  budget_plans: {
    year: number;
  };
}

interface BudgetPlanRaw {
  id: string;
  year: number;
  total_budget: number;
}

interface AnnualBudgetRaw {
  year: number;
  total_cap: number;
}

interface ServidorTjRaw {
  email: string | null;
  nome: string | null;
  cargo: string | null;
  comarca: string | null;
  entrancia: string | null;
  polo: string | null;
  regiao: string | null;
}

interface ElementoDespesaRaw {
  codigo: string;
  descricao: string;
}

const TYPE_COLORS: Record<string, string> = {
  'Ordinário': 'bg-blue-600',
  'Extraordinário - Emergencial': 'bg-red-500', 
  'Extraordinário - Júri': 'bg-amber-500',
  'Extra-Emergencial': 'bg-red-500',
  'Outros': 'bg-slate-500'
};

const TYPE_MAPPING: Record<string, string> = {
  'ORDINARY': 'Ordinário',
  'EXTRAORDINARY': 'Extraordinário - Emergencial',
  'JURI': 'Extraordinário - Júri',
  'Extra-Emergencial': 'Extra-Emergencial'
};

// Status que indicam solicitação ativa/aprovada
const ACTIVE_STATUSES = [
  'APROVADO',
  'APROVADA', 
  'EM_EXECUÇÃO',
  'EM EXECUÇÃO',
  'AGUARDANDO ASSINATURA SEFIN',
  'CONCLUIDO',
  'CONCLUÍDA',
  'PAGO'
];

export const useFinancialAnalytics = () => {
  const [data, setData] = useState<FinancialAnalyticsData>({
    budget: { total: 0, executed: 0, percentage: 0 },
    byElement: [],
    byType: [],
    byComarca: [],
    byEntrancia: [],
    byPole: [],
    byRegion: [],
    topSupridos: [],
    budgetAllocations: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

   const fetchAnalytics = async () => {
    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }));

      // 1. Buscar orçamento total do budget_plans
      let tetoOrcamentario = 0;
      let budgetPlanId: string | null = null;
      
      const { data: budgetPlanData, error: budgetPlanError } = await supabase
        .from('budget_plans')
        .select('id, year, total_budget')
        .eq('year', 2026)
        .maybeSingle();

      if (!budgetPlanError && budgetPlanData) {
        tetoOrcamentario = Number((budgetPlanData as BudgetPlanRaw).total_budget) || 0;
        budgetPlanId = (budgetPlanData as BudgetPlanRaw).id;
      }

      // 2. Fallback para annual_budgets
      if (tetoOrcamentario === 0) {
        const { data: annualBudgetData } = await supabase
          .from('annual_budgets')
          .select('year, total_cap')
          .eq('year', 2026)
          .maybeSingle();

        if (annualBudgetData) {
          tetoOrcamentario = Number((annualBudgetData as AnnualBudgetRaw).total_cap) || 0;
        }
      }

      // 3. Buscar elementos de despesa REAIS do banco
      const { data: elementosData } = await supabase
        .from('elementos_despesa')
        .select('codigo, descricao')
        .eq('ativo', true);

      const ELEMENT_LABELS: Record<string, string> = {};
      if (elementosData) {
        (elementosData as ElementoDespesaRaw[]).forEach(el => {
          ELEMENT_LABELS[el.codigo] = el.descricao;
        });
      }

      // 4. Buscar servidores_tj para dados geográficos
      const { data: servidoresData } = await supabase
        .from('servidores_tj')
        .select('email, nome, cargo, comarca, entrancia, polo, regiao')
        .eq('ativo', true);

      // Criar mapa por email (lowercase para match case-insensitive)
      const servidoresByEmail = new Map<string, ServidorTjRaw>();
      if (servidoresData) {
        (servidoresData as ServidorTjRaw[]).forEach(s => {
          if (s.email) {
            servidoresByEmail.set(s.email.toLowerCase().trim(), s);
          }
        });
      }

      // 5. Buscar solicitações com email do profile
      const { data: requestsData, error } = await supabase
        .from('solicitacoes')
        .select(`
          id,
          valor_aprovado,
          valor_solicitado,
          tipo,
          status,
          itens_despesa,
          user_id,
          profiles:user_id (
            email,
            nome
          )
        `)
        .not('valor_solicitado', 'is', null);

      if (error) throw error;
      
      const requests = requestsData as unknown as FinancialRequestRaw[];

      // Aggregation Maps
      const comarcaMap = new Map<string, number>();
      const entranciaMap = new Map<string, number>();
      const poloMap = new Map<string, number>();
      const regiaoMap = new Map<string, number>();
      const typeMap = new Map<string, number>();
      const elementMap = new Map<string, number>();
      const supridoMap = new Map<string, { value: number, role: string, unit: string, name: string }>();

      let totalExecuted = 0;

      requests?.forEach((req) => {
        const value = Number(req.valor_aprovado || req.valor_solicitado || 0);
        
        // Verificar se é uma solicitação ativa/aprovada
        const isActive = ACTIVE_STATUSES.some(s => 
          req.status?.toUpperCase().includes(s.toUpperCase())
        );
        
        if (isActive) {
          totalExecuted += value;
        }

        // 1. By Type
        const typeLabel = TYPE_MAPPING[req.tipo] || req.tipo || 'Outros';
        typeMap.set(typeLabel, (typeMap.get(typeLabel) || 0) + value);

        // 2. By Element (Parsing JSON)
        // itens_despesa pode vir como string JSON ou array
        let itensDespesa = req.itens_despesa;
        if (typeof itensDespesa === 'string') {
          try {
            itensDespesa = JSON.parse(itensDespesa);
          } catch {
            itensDespesa = [];
          }
        }
        
        if (Array.isArray(itensDespesa) && itensDespesa.length > 0) {
          itensDespesa.forEach((item: ExpenseItemRaw) => {
             const elementCode = item.element || item.code || 'Outros'; 
             const itemValue = Number(item.value || item.val || 0);
             if (itemValue > 0) {
               elementMap.set(elementCode, (elementMap.get(elementCode) || 0) + itemValue);
             }
          });
        }

        // 3. By Geography & Suprido - USANDO servidores_tj
        const userEmail = req.profiles?.email?.toLowerCase().trim();
        const servidor = userEmail ? servidoresByEmail.get(userEmail) : null;

        // Top Supridos
        const supridoName = servidor?.nome || req.profiles?.nome || 'Desconhecido';
        const supridoRole = servidor?.cargo || 'Servidor';
        const supridoUnit = servidor?.comarca || 'Lotação Desconhecida';
        
        const currentSuprido = supridoMap.get(supridoName) || { 
          value: 0, 
          role: supridoRole, 
          unit: supridoUnit,
          name: supridoName 
        };
        currentSuprido.value += value;
        supridoMap.set(supridoName, currentSuprido);

        // Geography - de servidores_tj
        if (servidor) {
          if (servidor.comarca) {
            comarcaMap.set(servidor.comarca, (comarcaMap.get(servidor.comarca) || 0) + value);
          }
          if (servidor.entrancia) {
            entranciaMap.set(servidor.entrancia, (entranciaMap.get(servidor.entrancia) || 0) + value);
          }
          if (servidor.polo) {
            poloMap.set(servidor.polo, (poloMap.get(servidor.polo) || 0) + value);
          }
          if (servidor.regiao) {
            regiaoMap.set(servidor.regiao, (regiaoMap.get(servidor.regiao) || 0) + value);
          }
        }
      });

      // Helpers to convert Map to Array
      const toArray = (map: Map<string, number>): AnalyticItem[] => 
        Array.from(map.entries())
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value);

      const byElementArray = Array.from(elementMap.entries())
        .map(([code, value]) => ({
          name: ELEMENT_LABELS[code] || code,
          value,
          code,
          percent: totalExecuted > 0 ? (value / totalExecuted) * 100 : 0
        }))
        .sort((a, b) => b.value - a.value);

      const byTypeArray = Array.from(typeMap.entries())
        .map(([name, value]) => ({
          name,
          label: name,
          value,
          color: TYPE_COLORS[name] || 'bg-slate-400'
        }))
        .sort((a, b) => b.value - a.value);

      const topSupridosArray = Array.from(supridoMap.values())
        .map(item => ({
          name: item.name,
          value: item.value,
          role: item.role,
          unit: item.unit
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      // 6. Buscar alocações orçamentárias usando plan_id
      let allocationsData: any[] = [];
      let allocationError = null;
      
      if (budgetPlanId) {
        const result = await supabase
          .from('budget_allocations')
          .select('ptres_code, allocated_value, committed_value')
          .eq('plan_id', budgetPlanId);
        
        allocationsData = result.data || [];
        allocationError = result.error;
      }

      if (allocationError) {
        console.error('Error fetching allocations:', allocationError);
      }

      // Calcular totais das alocações
      if (allocationsData && allocationsData.length > 0) {
        const totalFromAllocations = allocationsData.reduce((sum, a) => sum + (Number(a.allocated_value) || 0), 0);
        if (tetoOrcamentario === 0 && totalFromAllocations > 0) {
          tetoOrcamentario = totalFromAllocations;
        }
      }

      setData({
        budget: {
          total: tetoOrcamentario,
          executed: totalExecuted,
          percentage: tetoOrcamentario > 0 ? (totalExecuted / tetoOrcamentario) * 100 : 0,
          executedOrdinary: typeMap.get('Ordinário') || 0,
          executedExtraordinary: (typeMap.get('Extraordinário - Emergencial') || 0) + 
                                  (typeMap.get('Extraordinário - Júri') || 0) +
                                  (typeMap.get('Extra-Emergencial') || 0)
        },
        byElement: byElementArray,
        byType: byTypeArray,
        byComarca: toArray(comarcaMap),
        byEntrancia: toArray(entranciaMap),
        byPole: toArray(poloMap),
        byRegion: toArray(regiaoMap),
        topSupridos: topSupridosArray,
        budgetAllocations: allocationsData.map((a: any) => ({
          ptres_code: a.ptres_code,
          allocated_value: Number(a.allocated_value) || 0,
          committed_value: Number(a.committed_value) || 0
        })),
        isLoading: false,
        error: null
      });

    } catch (err: unknown) {
      console.error('Error fetching financial analytics:', err);
      const errorMessage = err instanceof Error ? err.message : 'Falha ao carregar dados analíticos.';
      setData(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));
    }
  };

  return { ...data, refetch: fetchAnalytics };
};
