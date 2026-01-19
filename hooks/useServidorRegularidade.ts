import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

interface PendenciaResult {
  has_pendencias: boolean;
  detalhes: string[];
}

/**
 * Hook para verificar pendências de um servidor
 * Usado antes de gerar Certidão de Regularidade
 */
export const useServidorRegularidade = (servidorId: string | undefined) => {
  const checkPendencias = async (): Promise<PendenciaResult> => {
    if (!servidorId) {
      throw new Error('ID do servidor não fornecido');
    }

    const { data, error } = await supabase
      .rpc('check_servidor_pendencias', { servidor_id: servidorId });
    
    if (error) {
      console.error('Erro ao verificar pendências:', error);
      throw new Error(`Erro na verificação: ${error.message}`);
    }
    
    // A função retorna array de objetos, pegamos o primeiro
    const result = Array.isArray(data) ? data[0] : data;
    
    return {
      has_pendencias: result?.has_pendencias || false,
      detalhes: result?.detalhes || []
    };
  };

  const query = useQuery<PendenciaResult>({
    queryKey: ['servidor-regularidade', servidorId],
    queryFn: checkPendencias,
    enabled: !!servidorId,
    staleTime: 0, // Sempre buscar dados frescos
  });

  return {
    checkPendencias: query.refetch,
    hasPendencias: query.data?.has_pendencias,
    detalhes: query.data?.detalhes,
    isLoading: query.isLoading,
    error: query.error
  };
};
