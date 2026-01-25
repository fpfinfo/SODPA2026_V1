import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface FornecedorSuggestion {
  emitente: string;
  cnpj_cpf: string;
}

export function useFornecedoresHistory() {
  const [suggestions, setSuggestions] = useState<FornecedorSuggestion[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const searchFornecedores = useCallback(async (termo: string) => {
    if (!termo || termo.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      setIsLoadingHistory(true);
      
      // Busca fornecedores anteriores que contenham o termo
      // Limitamos a 50 para não sobrecarregar, pois faremos dedup no cliente
      const { data, error } = await supabase
        .from('comprovantes_pc')
        .select('emitente, cnpj_cpf')
        .ilike('emitente', `%${termo}%`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Deduplicar por CNPJ (ou Nome se s/ CNPJ)
      const uniqueMap = new Map();
      
      data?.forEach((item: any) => {
        if (!item.emitente) return;
        
        // Chave única: preferencialmente CNPJ, senão o Nome limpo
        const key = item.cnpj_cpf || item.emitente.trim().toLowerCase();
        
        if (!uniqueMap.has(key)) {
            uniqueMap.set(key, {
                emitente: item.emitente,
                cnpj_cpf: item.cnpj_cpf || ''
            });
        }
      });

      setSuggestions(Array.from(uniqueMap.values()));
    } catch (error) {
      console.error('Erro ao buscar histórico de fornecedores:', error);
      // Fail silently for user, just clear suggestions
      setSuggestions([]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  return {
    suggestions,
    isLoadingHistory,
    searchFornecedores,
    clearSuggestions
  };
}
