import { useMutation } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

/**
 * Hook para gerar próximo número de portaria
 * Chama a função SQL get_next_portaria_number
 */
export const usePortariaNumber = () => {
  const getNextNumber = async (): Promise<string> => {
    const ano = new Date().getFullYear();
    
    const { data, error } = await supabase
      .rpc('get_next_portaria_number', { p_ano: ano });
    
    if (error) {
      console.error('Erro ao gerar número de portaria:', error);
      throw new Error(`Erro ao gerar número: ${error.message}`);
    }
    
    return data as string; // Retorna sequencial: 001
  };

  const mutation = useMutation({
    mutationFn: getNextNumber,
  });

  return { 
    getNextNumber: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error 
  };
};
