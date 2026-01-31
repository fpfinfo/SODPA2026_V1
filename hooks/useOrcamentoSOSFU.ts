import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface OrcamentoSOSFU {
  id: string;
  ptres: string;
  descricao: string;
  teto_anual: number;
  executado: number;
  ano: number;
  created_at: string;
  updated_at: string;
}

export function useOrcamentoSOSFU(ptres?: string) {
  const [orcamento, setOrcamento] = useState<OrcamentoSOSFU | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ptres) {
      setOrcamento(null);
      return;
    }

    const fetchOrcamento = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const { data, error: fetchError } = await supabase
          .from('orcamento_sosfu')
          .select('*')
          .eq('ptres', ptres)
          .eq('ano', new Date().getFullYear())
          .maybeSingle();
        
        if (fetchError) throw fetchError;
        
        setOrcamento(data);
      } catch (err) {
        console.error('Error fetching orcamento SOSFU:', err);
        setError(err instanceof Error ? err.message : 'Erro ao buscar orçamento');
        setOrcamento(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrcamento();
  }, [ptres]);

  return { orcamento, isLoading, error };
}
