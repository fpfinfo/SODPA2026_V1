import { supabase } from '../lib/supabaseClient';
import { useState, useEffect } from 'react';

export interface SupridoStats {
  total_processos: number;
  total_aprovados: number;
  total_devolucoes: number;
  valor_total_concedido: number;
  reputacao: 'EXCELENTE' | 'BOM' | 'REGULAR' | 'ATENCAO';
  avg_dias_prestacao: number; // Média de dias para prestar contas
}

export async function fetchSupridoStats(supridoId: string): Promise<SupridoStats> {
  if (!supridoId) throw new Error('ID do suprido é obrigatório');

  // 1. Buscas Contagens de PC
  const { data: pcs, error } = await supabase
    .from('prestacao_contas')
    .select('status, valor_concedido, created_at, submitted_at, motivo_pendencia')
    .eq('submitted_by', supridoId);

  if (error) throw error;
  if (!pcs || pcs.length === 0) {
    return {
      total_processos: 0,
      total_aprovados: 0,
      total_devolucoes: 0,
      valor_total_concedido: 0,
      reputacao: 'BOM', // Neutro
      avg_dias_prestacao: 0
    };
  }

  const total = pcs.length;
  const aprovados = pcs.filter(p => p.status === 'APROVADA' || p.status === 'SIAFE_BAIXADA').length;
  const devolucoes = pcs.filter(p => p.status === 'CORRECAO_SOLICITADA' || (p.motivo_pendencia && p.motivo_pendencia.length > 0)).length;
  const valorTotal = pcs.reduce((acc, curr) => acc + (curr.valor_concedido || 0), 0);
  
  // Calcular média de dias para submissão (usando created_at como inicio aprox)
  let totalDias = 0;
  let countDias = 0;
  pcs.forEach(p => {
    if (p.submitted_at && p.created_at) {
      const diff = new Date(p.submitted_at).getTime() - new Date(p.created_at).getTime();
      const dias = diff / (1000 * 3600 * 24);
      if (dias > 0) {
        totalDias += dias;
        countDias++;
      }
    }
  });
  
  const avgDias = countDias > 0 ? Math.round(totalDias / countDias) : 0;

  // Calcular Reputação
  // Regra: > 30% de devolução = ATENCAO
  // Regra: 0 devoluções e > 3 processos = EXCELENTE
  let rep: SupridoStats['reputacao'] = 'BOM';
  const taxaDevolucao = total > 0 ? devolucoes / total : 0;

  if (total > 2 && taxaDevolucao === 0) rep = 'EXCELENTE';
  else if (taxaDevolucao > 0.3) rep = 'ATENCAO';
  else if (taxaDevolucao > 0.1) rep = 'REGULAR';

  return {
    total_processos: total,
    total_aprovados: aprovados,
    total_devolucoes: devolucoes,
    valor_total_concedido: valorTotal,
    reputacao: rep,
    avg_dias_prestacao: avgDias
  };
}

export function useSupridoCRM(supridoId: string) {
  const [data, setData] = useState<SupridoStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (supridoId) {
      setIsLoading(true);
      fetchSupridoStats(supridoId)
        .then(setData)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [supridoId]);

  return { data, isLoading, fetchSupridoStats };
}
