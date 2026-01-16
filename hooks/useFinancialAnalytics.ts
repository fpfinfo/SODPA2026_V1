import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface AnalyticItem {
  name: string;
  value: number;
  // Optional extras for UI
  percent?: number;
  code?: string; // For expense elements
  role?: string; // For Top Supridos
  unit?: string; // For Top Supridos
  color?: string; // For Types
}

export interface FinancialAnalyticsData {
  // Budget
  budget: {
    total: number; // Teto Global (hardcoded ou fetched) -> Vamos usar fixo por enquanto ou somar do banco se houver tabela de teto
    executed: number;
    percentage: number;
  };
  
  // Charts
  byElement: AnalyticItem[];
  byType: AnalyticItem[];
  
  // Geo
  byComarca: AnalyticItem[];
  byEntrancia: AnalyticItem[];
  byPole: AnalyticItem[];
  byRegion: AnalyticItem[];
  
  // Lists
  topSupridos: AnalyticItem[];
  budgetAllocations: {
    ptres_code: string;
    allocated_value: number;
    committed_value: number;
  }[];
  
  isLoading: boolean;
  error: string | null;
}

const TETO_ORCAMENTARIO_GLOBAL = 12500000; // Valor de referência para cálculo de % (Mockado inicial)

const TYPE_COLORS: Record<string, string> = {
  'Ordinário': 'bg-blue-600',
  'Extraordinário - Emergencial': 'bg-red-500', 
  'Extraordinário - Júri': 'bg-amber-500',
  'Outros': 'bg-slate-500'
};

const TYPE_MAPPING: Record<string, string> = {
  'ORDINARY': 'Ordinário',
  'EXTRAORDINARY': 'Extraordinário - Emergencial',
  'JURI': 'Extraordinário - Júri'
};

const ELEMENT_LABELS: Record<string, string> = {
  '3.3.90.30.01': 'Consumo em Geral',
  '3.3.90.30.02': 'Combustíveis e Lubrificantes',
  '3.3.90.33': 'Passagens e Locomoção',
  '3.3.90.36': 'Serviços de Terceiros - PF',
  '3.3.90.39': 'Serviços de Terceiros - PJ',
};

export const useFinancialAnalytics = () => {
  const [data, setData] = useState<FinancialAnalyticsData>({
    budget: { total: TETO_ORCAMENTARIO_GLOBAL, executed: 0, percentage: 0 },
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

      const { data: requests, error } = await supabase
        .from('solicitacoes')
        .select(`
          id,
          valor_aprovado,
          valor_solicitado,
          tipo,
          itens_despesa,
          user_id,
          profiles:user_id (
            nome,
            cargo,
            comarca_id,
            comarcas:comarca_id (
              nome,
              entrancia,
              polo,
              regiao
            )
          )
        `)
        .not('valor_solicitado', 'is', null);

      if (error) throw error;

      // Aggregation Maps
      const comarcaMap = new Map<string, number>();
      const entranciaMap = new Map<string, number>();
      const poloMap = new Map<string, number>();
      const regiaoMap = new Map<string, number>();
      const typeMap = new Map<string, number>();
      const elementMap = new Map<string, number>();
      const supridoMap = new Map<string, { value: number, role: string, unit: string, name: string }>();

      let totalExecuted = 0;

      requests?.forEach((req: any) => {
        const value = Number(req.valor_aprovado || req.valor_solicitado || 0);
        totalExecuted += value;

        // 1. By Type
        const typeLabel = TYPE_MAPPING[req.tipo] || req.tipo || 'Outros';
        typeMap.set(typeLabel, (typeMap.get(typeLabel) || 0) + value);

        // 2. By Element (Parsing JSON)
        if (Array.isArray(req.itens_despesa)) {
          req.itens_despesa.forEach((item: any) => {
             // item structure check: { element: '33.90.30', value: 100 }
             const elementCode = item.element || item.code || 'Outros'; 
             const itemValue = Number(item.value || 0);
             if (itemValue > 0) {
               elementMap.set(elementCode, (elementMap.get(elementCode) || 0) + itemValue);
             }
          });
        }

        // 3. By Geography & Suprido
        const profile = req.profiles;
        if (profile) {
          // Top Supridos
          const supridoName = profile.nome || 'Desconhecido';
          const currentSuprido = supridoMap.get(supridoName) || { 
            value: 0, 
            role: profile.cargo || 'Servidor', 
            unit: profile.comarcas?.nome || 'Lotação Desconhecida',
            name: supridoName 
          };
          currentSuprido.value += value;
          supridoMap.set(supridoName, currentSuprido);

          // Geography
          const comarca = profile.comarcas;
          if (comarca) {
            const comarcaName = comarca.nome || 'Não Identificado';
            comarcaMap.set(comarcaName, (comarcaMap.get(comarcaName) || 0) + value);

            const entranciaName = comarca.entrancia || 'N/I';
            entranciaMap.set(entranciaName, (entranciaMap.get(entranciaName) || 0) + value);

            const poloName = comarca.polo || 'N/I';
            poloMap.set(poloName, (poloMap.get(poloName) || 0) + value);

            const regiaoName = comarca.regiao || 'N/I';
            regiaoMap.set(regiaoName, (regiaoMap.get(regiaoName) || 0) + value);
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
          label: name, // Component expects label
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
        .slice(0, 5); // Take top 5

      const { data: allocations, error: allocationError } = await supabase
        .from('budget_allocations')
        .select(`
          ptres_code,
          allocated_value,
          committed_value,
          budget_plans!inner(year)
        `)
        .eq('budget_plans.year', 2026);

      if (allocationError) {
        console.error('Error fetching allocations:', allocationError);
        // Don't throw, just log and continue with empty allocations
      }

      setData({
        budget: {
          total: TETO_ORCAMENTARIO_GLOBAL,
          executed: totalExecuted,
          percentage: (totalExecuted / TETO_ORCAMENTARIO_GLOBAL) * 100
        },
        byElement: byElementArray,
        byType: byTypeArray,
        byComarca: toArray(comarcaMap),
        byEntrancia: toArray(entranciaMap),
        byPole: toArray(poloMap),
        byRegion: toArray(regiaoMap),
        topSupridos: topSupridosArray,
        budgetAllocations: allocations?.map((a: any) => ({
          ptres_code: a.ptres_code,
          allocated_value: a.allocated_value,
          committed_value: a.committed_value
        })) || [],
        isLoading: false,
        error: null
      });

    } catch (err: any) {
      console.error('Error fetching financial analytics:', err);
      setData(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: err.message || 'Falha ao carregar dados analíticos.' 
      }));
    }
  };

  return { ...data, refetch: fetchAnalytics };
};
