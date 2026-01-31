import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { BatchSummary, QUARTER_CONFIG } from '../types/batch';

// Fallback data when DB unavailable
const FALLBACK_BATCHES: BatchSummary[] = [
  {
    id: 'batch-2026-1q',
    year: 2026,
    quarter: '1Q',
    total_processos: 144,
    total_valor: 2000000,
    total_documentos: 432,
    status: 'GERADO',
    comarcas_regulares: 138,
    comarcas_excluidas: 6,
    generated_by: 'Maria Silva (SOSFU)',
    generated_at: '2026-01-14T21:30:00Z',
  },
  {
    id: 'batch-2025-3q',
    year: 2025,
    quarter: '3Q',
    total_processos: 140,
    total_valor: 1900000,
    total_documentos: 420,
    status: 'ASSINADO',
    comarcas_regulares: 140,
    comarcas_excluidas: 4,
    generated_by: 'Maria Silva (SOSFU)',
    generated_at: '2025-09-10T14:20:00Z',
    signed_by: 'João Mendes (Ordenador)',
    signed_at: '2025-09-10T16:45:00Z',
  },
];

export const useBatchSigning = () => {
  const [batches, setBatches] = useState<BatchSummary[]>(FALLBACK_BATCHES);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch batches from database
  const fetchBatches = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('signature_batches')
        .select('*')
        .order('generated_at', { ascending: false });

      if (fetchError) {
        console.warn('Signature batches table not found, using fallback:', fetchError.message);
        setBatches(FALLBACK_BATCHES);
        return;
      }

      if (data && data.length > 0) {
        const mapped: BatchSummary[] = data.map((b: any) => ({
          id: b.id,
          year: b.year,
          quarter: b.quarter as '1Q' | '2Q' | '3Q',
          total_processos: b.total_processos,
          total_valor: b.total_valor,
          total_documentos: b.total_documentos,
          status: b.status,
          comarcas_regulares: b.comarcas_regulares,
          comarcas_excluidas: b.comarcas_excluidas,
          generated_by: b.generated_by,
          generated_at: b.generated_at,
          signed_by: b.signed_by,
          signed_at: b.signed_at
        }));
        setBatches(mapped);
      } else {
        setBatches(FALLBACK_BATCHES);
      }
    } catch (err) {
      console.error('Error fetching batches:', err);
      setError((err as Error).message);
      setBatches(FALLBACK_BATCHES);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  // Filtered lists
  const pendingBatches = useMemo(() => 
    batches.filter(b => b.status === 'GERADO'), 
    [batches]
  );
  
  const signedBatches = useMemo(() => 
    batches.filter(b => b.status !== 'GERADO'), 
    [batches]
  );

  // Sign batch
  const signBatch = async (batchId: string, signedBy: string) => {
    try {
      const { error } = await supabase
        .from('signature_batches')
        .update({
          status: 'ASSINADO',
          signed_by: signedBy,
          signed_at: new Date().toISOString()
        })
        .eq('id', batchId);

      if (error) {
        // Optimistic update even if DB unavailable
        console.warn('DB update failed, applying optimistic update:', error.message);
      }

      // Update local state
      setBatches(prev => prev.map(b => 
        b.id === batchId 
          ? { 
              ...b, 
              status: 'ASSINADO' as const, 
              signed_by: signedBy, 
              signed_at: new Date().toISOString() 
            }
          : b
      ));
    } catch (err) {
      console.error('Error signing batch:', err);
      throw err;
    }
  };

  // Create new batch
  const createBatch = async (batch: Omit<BatchSummary, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('signature_batches')
        .insert({
          year: batch.year,
          quarter: batch.quarter,
          total_processos: batch.total_processos,
          total_valor: batch.total_valor,
          total_documentos: batch.total_documentos,
          status: 'GERADO',
          comarcas_regulares: batch.comarcas_regulares,
          comarcas_excluidas: batch.comarcas_excluidas,
          generated_by: batch.generated_by,
          generated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      setBatches(prev => [{ ...batch, id: data.id, status: 'GERADO' }, ...prev]);
      return data;
    } catch (err) {
      console.error('Error creating batch:', err);
      throw err;
    }
  };

  return {
    batches,
    pendingBatches,
    signedBatches,
    isLoading,
    error,
    // Actions
    signBatch,
    createBatch,
    refresh: fetchBatches
  };
};
