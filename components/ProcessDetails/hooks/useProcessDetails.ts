import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';

export interface ProcessData {
  id: string;
  nup: string;
  tipo: string;
  status: string;
  valor_total: number;
  valor_solicitado?: number;
  descricao: string;
  data_inicio?: string;
  data_fim?: string;
  urgencia?: string;
  comarca_destino?: string;
  processo_judicial?: string;
  created_at: string;
  updated_at?: string;
  user_id: string;
  
  // Related data
  suprido_nome?: string;
  suprido_cargo?: string;
  unidade?: string;
  comarca?: string;
  
  // Júri specific
  juri_participantes?: number;
  juri_dias?: number;
  juri_frequencia_refeicoes?: string;
  juri_projecao_custos?: any[];
}

interface UseProcessDetailsReturn {
  processData: ProcessData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useProcessDetails = (processId: string): UseProcessDetailsReturn => {
  const [processData, setProcessData] = useState<ProcessData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProcessData = async () => {
    if (!processId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('solicitacoes')
        .select(`
          *,
          profiles:user_id (
            nome,
            cargo,
            unidade,
            comarca
          )
        `)
        .eq('id', processId)
        .single();

      if (fetchError) throw fetchError;

      if (data) {
        // Flatten profile data
        const profileData = data.profiles as any;
        const flattenedData: ProcessData = {
          ...data,
          suprido_nome: profileData?.nome,
          suprido_cargo: profileData?.cargo,
          unidade: profileData?.unidade,
          comarca: profileData?.comarca,
        };
        
        setProcessData(flattenedData);
      }
    } catch (err) {
      console.error('Error fetching process data:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProcessData();
  }, [processId]);

  return {
    processData,
    isLoading,
    error,
    refetch: fetchProcessData,
  };
};
