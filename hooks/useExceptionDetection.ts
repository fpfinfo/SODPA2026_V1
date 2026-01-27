import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface JuriException {
  tipo: 'POLICIAIS' | 'VALOR_ALMOCO' | 'VALOR_JANTAR' | 'VALOR_LANCHE' | 'PRAZO_INSUFICIENTE' | 'PC_FORA_PRAZO';
  solicitado: number;
  limite: number;
  excedente: number;
}

export interface JuriLimits {
  policiais: number;
  almoco: number;
  jantar: number;
  lanche: number;
  prazo_minimo_dias: number;
  pc_prazo_dias: number;
}

export interface ExceptionDetectionResult {
  has_exceptions: boolean;
  exceptions: JuriException[];
  limites: JuriLimits;
}

interface UseExceptionDetectionReturn {
  result: ExceptionDetectionResult | null;
  isLoading: boolean;
  error: Error | null;
  checkExceptions: () => Promise<void>;
  requiresAuthorization: boolean;
}

// Default limits (fallback if not in database)
const DEFAULT_LIMITS: JuriLimits = {
  policiais: 5,
  almoco: 30.00,
  jantar: 30.00,
  lanche: 11.00,
  prazo_minimo_dias: 7,
  pc_prazo_dias: 30
};

/**
 * Verifica se a data do evento está dentro do prazo mínimo de antecedência
 * @param dataEvento - Data de início do evento
 * @returns JuriException se prazo insuficiente, null caso contrário
 */
export const checkDeadlineException = (dataEvento: string | Date | null): JuriException | null => {
  if (!dataEvento) return null;
  
  const eventDate = new Date(dataEvento);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  eventDate.setHours(0, 0, 0, 0);
  
  const diffTime = eventDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < DEFAULT_LIMITS.prazo_minimo_dias && diffDays >= 0) {
    return {
      tipo: 'PRAZO_INSUFICIENTE',
      solicitado: diffDays,
      limite: DEFAULT_LIMITS.prazo_minimo_dias,
      excedente: DEFAULT_LIMITS.prazo_minimo_dias - diffDays
    };
  }
  
  return null;
};

/**
 * Verifica se a prestação de contas está fora do prazo definido na Portaria (Art. 4°, II)
 * @param prazoPrestacao - Data limite para prestação de contas (definida na Portaria)
 * @param dataPrestacao - Data de envio da prestação de contas (default: hoje)
 * @returns JuriException se PC fora do prazo, null caso contrário
 */
export const checkPCDeadlineException = (
  prazoPrestacao: string | Date | null,
  dataPrestacao?: string | Date | null
): JuriException | null => {
  if (!prazoPrestacao) return null;
  
  const prazo = new Date(prazoPrestacao);
  const prestacao = dataPrestacao ? new Date(dataPrestacao) : new Date();
  prazo.setHours(0, 0, 0, 0);
  prestacao.setHours(0, 0, 0, 0);
  
  const diffTime = prestacao.getTime() - prazo.getTime();
  const diasAtraso = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diasAtraso > 0) {
    return {
      tipo: 'PC_FORA_PRAZO',
      solicitado: diasAtraso,
      limite: 0, // 0 dias de atraso é o limite
      excedente: diasAtraso
    };
  }
  
  return null;
};

/**
 * Hook para detectar exceções em processos Extra-Júri
 * Verifica se valores/quantidades excedem os limites autorizados
 */
export const useExceptionDetection = (solicitacaoId: string | null): UseExceptionDetectionReturn => {
  const [result, setResult] = useState<ExceptionDetectionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const checkExceptions = useCallback(async () => {
    if (!solicitacaoId) {
      setResult(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Try to use the database function first
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('detect_juri_exceptions', { p_solicitacao_id: solicitacaoId });

      if (!rpcError && rpcData) {
        setResult(rpcData as ExceptionDetectionResult);
        return;
      }

      // Fallback: Calculate on client side
      console.log('[useExceptionDetection] Using client-side detection');
      
      const { data: solicitacao, error: fetchError } = await supabase
        .from('solicitacoes')
        .select('juri_participantes_aprovados, juri_projecao_aprovados, juri_participantes, juri_projecao_custos')
        .eq('id', solicitacaoId)
        .single();

      if (fetchError) throw fetchError;

      const participantes = solicitacao?.juri_participantes_aprovados || solicitacao?.juri_participantes || {};
      const projecao = solicitacao?.juri_projecao_aprovados || solicitacao?.juri_projecao_custos || [];

      const exceptions: JuriException[] = [];

      // Check policiais
      const policiais = Number(participantes.policiais) || 0;
      if (policiais > DEFAULT_LIMITS.policiais) {
        exceptions.push({
          tipo: 'POLICIAIS',
          solicitado: policiais,
          limite: DEFAULT_LIMITS.policiais,
          excedente: policiais - DEFAULT_LIMITS.policiais
        });
      }

      // Check meal values
      if (Array.isArray(projecao)) {
        projecao.forEach((item: any) => {
          const unitValue = item.approvedUnitValue ?? item.unitValue ?? 0;

          if (item.id === 'almoco' && unitValue > DEFAULT_LIMITS.almoco) {
            exceptions.push({
              tipo: 'VALOR_ALMOCO',
              solicitado: unitValue,
              limite: DEFAULT_LIMITS.almoco,
              excedente: unitValue - DEFAULT_LIMITS.almoco
            });
          }

          if (item.id === 'jantar' && unitValue > DEFAULT_LIMITS.jantar) {
            exceptions.push({
              tipo: 'VALOR_JANTAR',
              solicitado: unitValue,
              limite: DEFAULT_LIMITS.jantar,
              excedente: unitValue - DEFAULT_LIMITS.jantar
            });
          }

          if (item.id === 'lanche' && unitValue > DEFAULT_LIMITS.lanche) {
            exceptions.push({
              tipo: 'VALOR_LANCHE',
              solicitado: unitValue,
              limite: DEFAULT_LIMITS.lanche,
              excedente: unitValue - DEFAULT_LIMITS.lanche
            });
          }
        });
      }

      setResult({
        has_exceptions: exceptions.length > 0,
        exceptions,
        limites: DEFAULT_LIMITS
      });

    } catch (err) {
      console.error('[useExceptionDetection] Error:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [solicitacaoId]);

  useEffect(() => {
    checkExceptions();
  }, [checkExceptions]);

  return {
    result,
    isLoading,
    error,
    checkExceptions,
    requiresAuthorization: result?.has_exceptions ?? false
  };
};

/**
 * Helper para formatar o tipo de exceção em texto amigável
 */
export const formatExceptionType = (tipo: JuriException['tipo']): string => {
  const labels: Record<JuriException['tipo'], string> = {
    POLICIAIS: 'Quantidade de Policiais',
    VALOR_ALMOCO: 'Valor do Almoço',
    VALOR_JANTAR: 'Valor do Jantar',
    VALOR_LANCHE: 'Valor do Lanche',
    PRAZO_INSUFICIENTE: 'Prazo de Antecedência',
    PC_FORA_PRAZO: 'Prestação de Contas Atrasada'
  };
  return labels[tipo] || tipo;
};

/**
 * Helper para formatar valor (moeda ou quantidade)
 */
export const formatExceptionValue = (tipo: JuriException['tipo'], value: number): string => {
  if (tipo === 'POLICIAIS') {
    return `${value} policial${value !== 1 ? 'is' : ''}`;
  }
  if (tipo === 'PRAZO_INSUFICIENTE' || tipo === 'PC_FORA_PRAZO') {
    return `${value} dia${value !== 1 ? 's' : ''}`;
  }
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export default useExceptionDetection;
