import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { DocumentValidation } from '../components/DocumentValidationBadge';

export function useDocumentValidation(documentoId?: string) {
  const [validation, setValidation] = useState<DocumentValidation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!documentoId) {
      setValidation(null);
      return;
    }

    const fetchValidation = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('documento_validations')
          .select('*')
          .eq('documento_id', documentoId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (fetchError) throw fetchError;

        setValidation(data);
      } catch (err) {
        console.error('Error fetching document validation:', err);
        setError(err instanceof Error ? err.message : 'Erro ao buscar validação');
        setValidation(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchValidation();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel(`validations:${documentoId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documento_validations',
          filter: `documento_id=eq.${documentoId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setValidation(payload.new as DocumentValidation);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [documentoId]);

  const triggerValidation = async (documentoId: string, pdfUrl: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('process-document', {
        body: { documento_id: documentoId, pdf_url: pdfUrl }
      });

      if (invokeError) throw invokeError;

      return data;
    } catch (err) {
      console.error('Error triggering validation:', err);
      setError(err instanceof Error ? err.message : 'Erro ao processar documento');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    validation,
    isLoading,
    error,
    triggerValidation
  };
}
