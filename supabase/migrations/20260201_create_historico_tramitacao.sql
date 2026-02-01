-- ============================================================================
-- Migration: Create historico_tramitacao table for SODPA
-- Purpose: Track all process tramitation events
-- ============================================================================

-- Create historico_tramitacao table (if not exists)
CREATE TABLE IF NOT EXISTS public.historico_tramitacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitacao_id UUID NOT NULL,
  origem VARCHAR(50) NOT NULL,
  destino VARCHAR(50) NOT NULL,
  status_anterior VARCHAR(100),
  status_novo VARCHAR(100) NOT NULL,
  observacao TEXT,
  tramitado_por UUID REFERENCES public.profiles(id),
  tramitado_por_nome VARCHAR(200),
  data_tramitacao TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.historico_tramitacao ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can read
DROP POLICY IF EXISTS "Authenticated users can read tramitacao" ON public.historico_tramitacao;
CREATE POLICY "Authenticated users can read tramitacao" ON public.historico_tramitacao
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: Authenticated users can insert
DROP POLICY IF EXISTS "Authenticated users can insert tramitacao" ON public.historico_tramitacao;
CREATE POLICY "Authenticated users can insert tramitacao" ON public.historico_tramitacao
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_historico_tramitacao_solicitacao 
  ON public.historico_tramitacao(solicitacao_id, data_tramitacao DESC);

-- ============================================================================
-- Fix existing requests: Update destino_atual and status
-- ============================================================================

-- Update existing NOVO requests to ENVIADO and set destino_atual to SODPA
UPDATE public.sodpa_requests
SET 
  status = 'ENVIADO',
  destino_atual = 'SODPA'
WHERE status = 'NOVO' 
  AND (destino_atual IS NULL OR destino_atual = '');

-- Also fix any requests with ENVIADO but missing destino_atual
UPDATE public.sodpa_requests
SET destino_atual = 'SODPA'
WHERE status = 'ENVIADO' 
  AND (destino_atual IS NULL OR destino_atual = '');

COMMENT ON TABLE public.historico_tramitacao IS 'Histórico de tramitação de processos SODPA';
