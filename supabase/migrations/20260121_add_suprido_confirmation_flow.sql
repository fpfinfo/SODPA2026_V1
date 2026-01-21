-- Migration: Add date tracking fields for Suprido confirmation flow
-- Created: 2026-01-21
-- Description: Adds fields to track credit date, receipt confirmation date, and deadline

-- Add new columns to solicitacoes table
ALTER TABLE solicitacoes 
ADD COLUMN IF NOT EXISTS data_credito TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS data_confirmacao_recebimento TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS prazo_prestacao TIMESTAMPTZ;

-- Add comments for documentation
COMMENT ON COLUMN solicitacoes.data_credito IS 'Date when SOSFU confirmed the credit was deposited';
COMMENT ON COLUMN solicitacoes.data_confirmacao_recebimento IS 'Date when Suprido confirmed receipt of funds';
COMMENT ON COLUMN solicitacoes.prazo_prestacao IS 'Deadline for accountability (30 days after confirmation)';

-- Create index for efficient queries on pending confirmations
CREATE INDEX IF NOT EXISTS idx_solicitacoes_status_workflow 
ON solicitacoes(status_workflow) 
WHERE status_workflow IN ('AWAITING_SUPRIDO_CONFIRMATION', 'AWAITING_ACCOUNTABILITY');

-- Update existing processes with ACCOUNTABILITY_OPEN to have reasonable dates
-- (This is for backward compatibility with existing data)
UPDATE solicitacoes 
SET 
  data_credito = COALESCE(data_liberacao, created_at),
  data_confirmacao_recebimento = COALESCE(data_liberacao, created_at),
  prazo_prestacao = COALESCE(data_liberacao, created_at) + INTERVAL '30 days'
WHERE status_workflow = 'ACCOUNTABILITY_OPEN' 
  AND data_credito IS NULL;
