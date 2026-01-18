import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface DotacaoItem {
  codigo: string;
  descricao: string;
  saldo?: number;
}

export function useDotacoes(ptres: string | null) {
  const [dotacoes, setDotacoes] = useState<DotacaoItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ptres) {
      setDotacoes([]);
      setIsLoading(false);
      return;
    }

    const fetchDotacoes = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const { data, error: fetchError } = await supabase
          .from('orcamento_sosfu')
          .select('dotacoes')
          .eq('ptres', ptres)
          .single();

        if (fetchError) throw fetchError;
        
        // dotacoes is JSONB array: [{codigo, descricao, saldo}]
        const dotacoesArray = data?.dotacoes || [];
        setDotacoes(Array.isArray(dotacoesArray) ? dotacoesArray : []);
      } catch (err) {
        console.error('Error fetching dotações:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar dotações');
        setDotacoes([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDotacoes();
  }, [ptres]);

  return { dotacoes, isLoading, error };
}
