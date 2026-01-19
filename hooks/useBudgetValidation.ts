import { useMemo } from 'react';
import { useOrcamentoSOSFU } from './useOrcamentoSOSFU';

export type BudgetValidationStatus = 'DENTRO_LIMITE' | 'LIMITE_CRITICO' | 'OVER_BUDGET' | 'LOADING' | 'UNAVAILABLE';

export interface BudgetValidationResult {
  status: BudgetValidationStatus;
  saldoDisponivel: number;
  valorSolicitado: number;
  percentualUtilizado: number;
  tetoAnual: number;
  executadoAteAgora: number;
  message: string;
  canApprove: boolean;
}

interface UseBudgetValidationProps {
  ptresCode?: string;
  valorSolicitado: number;
}

/**
 * Hook para validação orçamentária em tempo real
 * Verifica se o valor solicitado excede o saldo disponível da unidade
 */
export function useBudgetValidation({ ptresCode, valorSolicitado }: UseBudgetValidationProps): BudgetValidationResult {
  const { orcamento, isLoading } = useOrcamentoSOSFU(ptresCode);

  return useMemo(() => {
    // Estado de carregamento
    if (isLoading) {
      return {
        status: 'LOADING',
        saldoDisponivel: 0,
        valorSolicitado,
        percentualUtilizado: 0,
        tetoAnual: 0,
        executadoAteAgora: 0,
        message: 'Carregando dados orçamentários...',
        canApprove: false
      };
    }

    // Orçamento não disponível (PTRES não informado ou erro)
    if (!orcamento || !ptresCode) {
      return {
        status: 'UNAVAILABLE',
        saldoDisponivel: 0,
        valorSolicitado,
        percentualUtilizado: 0,
        tetoAnual: 0,
        executadoAteAgora: 0,
        message: 'Dados orçamentários não disponíveis. Validação manual necessária.',
        canApprove: true // Permite aprovar manualmente
      };
    }

    const tetoAnual = orcamento.tetoAnual || 0;
    const executado = orcamento.executado || 0;
    const saldoDisponivel = tetoAnual - executado;
    const saldoAposAprovacao = saldoDisponivel - valorSolicitado;
    const percentualUtilizado = tetoAnual > 0 ? ((executado + valorSolicitado) / tetoAnual) * 100 : 0;

    // Over Budget - Valor excede saldo disponível
    if (saldoAposAprovacao < 0) {
      return {
        status: 'OVER_BUDGET',
        saldoDisponivel,
        valorSolicitado,
        percentualUtilizado,
        tetoAnual,
        executadoAteAgora: executado,
        message: `Saldo insuficiente! Disponível: R$ ${saldoDisponivel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, Solicitado: R$ ${valorSolicitado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        canApprove: false
      };
    }

    // Limite Crítico - Utilização >= 90%
    if (percentualUtilizado >= 90) {
      return {
        status: 'LIMITE_CRITICO',
        saldoDisponivel,
        valorSolicitado,
        percentualUtilizado,
        tetoAnual,
        executadoAteAgora: executado,
        message: `Atenção: ${percentualUtilizado.toFixed(1)}% do orçamento será utilizado. Saldo após aprovação: R$ ${saldoAposAprovacao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        canApprove: true
      };
    }

    // Dentro do Limite - Tudo OK
    return {
      status: 'DENTRO_LIMITE',
      saldoDisponivel,
      valorSolicitado,
      percentualUtilizado,
      tetoAnual,
      executadoAteAgora: executado,
      message: `Orçamento adequado. Saldo após aprovação: R$ ${saldoAposAprovacao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${(100 - percentualUtilizado).toFixed(1)}% disponível)`,
      canApprove: true
    };
  }, [orcamento, isLoading, ptresCode, valorSolicitado]);
}
