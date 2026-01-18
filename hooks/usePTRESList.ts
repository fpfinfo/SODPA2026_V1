import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface PTRESItem {
  ptres: string;
  programa_trabalho: string;
  saldo_disponivel?: number;
}

export function usePTRESList() {
  const [ptresList, setPtresList] = useState<PTRESItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPTRES = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const { data, error: fetchError } = await supabase
          .from('orcamento_sosfu')
          .select('ptres, programa_trabalho, saldo_disponivel')
          .order('ptres');

        if (fetchError) throw fetchError;
        
        setPtresList(data || []);
      } catch (err) {
        console.error('Error fetching PTRES:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar PTRES');
        setPtresList([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPTRES();
  }, []);

  return { ptresList, isLoading, error };
}
