import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { NLPAnalysis } from '../components/JustificationAnalysis';

export function useJustificationAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeJustification = async (solicitacaoId: string): Promise<NLPAnalysis | null> => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('analyze-justification', {
        body: { solicitacao_id: solicitacaoId }
      });

      if (invokeError) {
        throw new Error(invokeError.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to analyze justification');
      }

      return data.analysis;
    } catch (err) {
      console.error('Error analyzing justification:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao analisar justificativa';
      setError(errorMessage);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    analyzeJustification,
    isAnalyzing,
    error
  };
}
