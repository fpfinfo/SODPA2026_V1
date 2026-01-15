/**
 * useComarcasBudget Hook
 * Fetches comarcas from Supabase with budget data for batch processing
 * Maps Supabase comarcas to ComarcaBudget type used by batch components
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ComarcaBudget, ElementDistribution } from '../types/batch';

interface UseComarcasBudgetReturn {
  comarcas: ComarcaBudget[];
  isLoading: boolean;
  error: string | null;
  
  // Update budget
  updateComarcaBudget: (id: string, teto: number, dist: ElementDistribution) => Promise<boolean>;
  
  // Refresh
  refresh: () => Promise<void>;
}

export function useComarcasBudget(): UseComarcasBudgetReturn {
  const [comarcas, setComarcas] = useState<ComarcaBudget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch comarcas with suprido data
      const { data, error: fetchError } = await supabase
        .from('comarcas')
        .select(`
          id,
          codigo,
          nome,
          entrancia,
          varas,
          teto_anual,
          dist_elemento_30_01,
          dist_elemento_30_02,
          dist_elemento_33,
          dist_elemento_36,
          dist_elemento_39,
          status,
          suprido:profiles!suprido_id(id, nome, cpf)
        `)
        .order('nome');
      
      if (fetchError) throw fetchError;
      
      // Map to ComarcaBudget type - use correct property names
      const mapped: ComarcaBudget[] = (data || []).map(c => {
        const supridoData = Array.isArray(c.suprido) ? c.suprido[0] : c.suprido;
        return {
          id: c.id,
          comarca_id: c.id,
          comarca_nome: c.nome,
          comarca_codigo: c.codigo || '',
          suprido_id: supridoData?.id,
          suprido_nome: supridoData?.nome || '',
          suprido_cpf: supridoData?.cpf || '',
          teto_anual: parseFloat(c.teto_anual) || 36000,
          distribuicao: {
            element_30_01: parseFloat(c.dist_elemento_30_01) || 25,
            element_30_02: parseFloat(c.dist_elemento_30_02) || 25,
            element_33: parseFloat(c.dist_elemento_33) || 20,
            element_36: parseFloat(c.dist_elemento_36) || 15,
            element_39: parseFloat(c.dist_elemento_39) || 15,
          },
          status: mapStatus(c.status, supridoData),
          pendencias: c.status === 'BLOQUEADA' ? ['Comarca bloqueada'] : undefined,
        };
      });
      
      setComarcas(mapped);
    } catch (err: any) {
      console.error('Error fetching comarcas budget:', err);
      setError(err.message || 'Erro ao carregar comarcas');
      
      // Fallback to mock data
      setComarcas(FALLBACK_COMARCAS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateComarcaBudget = async (id: string, teto: number, dist: ElementDistribution): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('comarcas')
        .update({
          teto_anual: teto,
          dist_elemento_30_01: dist.element_30_01,
          dist_elemento_30_02: dist.element_30_02,
          dist_elemento_33: dist.element_33,
          dist_elemento_36: dist.element_36,
          dist_elemento_39: dist.element_39,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      
      if (error) throw error;
      await fetchData();
      return true;
    } catch (err: any) {
      console.error('Error updating comarca budget:', err);
      setError(err.message);
      return false;
    }
  };

  return {
    comarcas,
    isLoading,
    error,
    updateComarcaBudget,
    refresh: fetchData,
  };
}

function mapStatus(dbStatus: string | null, suprido: any): 'REGULAR' | 'PENDENTE' | 'SEM_SUPRIDO' | 'BLOQUEADO' {
  if (!suprido || dbStatus === 'SEM_SUPRIDO') return 'SEM_SUPRIDO';
  if (dbStatus === 'BLOQUEADA') return 'BLOQUEADO';
  return 'REGULAR';
}

// Fallback mock data - using correct ComarcaBudget type
const FALLBACK_COMARCAS: ComarcaBudget[] = [
  { id: '1', comarca_id: '1', comarca_nome: 'Comarca de Belém', comarca_codigo: 'BEL', suprido_nome: 'João Silva', teto_anual: 60000, distribuicao: { element_30_01: 15, element_30_02: 30, element_33: 20, element_36: 20, element_39: 15 }, status: 'REGULAR' },
  { id: '2', comarca_id: '2', comarca_nome: 'Comarca de Ananindeua', comarca_codigo: 'ANA', suprido_nome: 'Maria Santos', teto_anual: 48000, distribuicao: { element_30_01: 20, element_30_02: 25, element_33: 20, element_36: 20, element_39: 15 }, status: 'REGULAR' },
  { id: '3', comarca_id: '3', comarca_nome: 'Comarca de Santarém', comarca_codigo: 'SAN', suprido_nome: 'Pedro Costa', teto_anual: 48000, distribuicao: { element_30_01: 25, element_30_02: 25, element_33: 20, element_36: 15, element_39: 15 }, status: 'REGULAR' },
  { id: '4', comarca_id: '4', comarca_nome: 'Comarca de Marabá', comarca_codigo: 'MAR', suprido_nome: 'Ana Lima', teto_anual: 42000, distribuicao: { element_30_01: 25, element_30_02: 25, element_33: 25, element_36: 15, element_39: 10 }, status: 'REGULAR' },
  { id: '5', comarca_id: '5', comarca_nome: 'Comarca de Mãe do Rio', comarca_codigo: 'MDR', suprido_nome: '', teto_anual: 24000, distribuicao: { element_30_01: 30, element_30_02: 25, element_33: 20, element_36: 15, element_39: 10 }, status: 'SEM_SUPRIDO' },
];
