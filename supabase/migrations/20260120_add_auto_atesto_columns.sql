-- Migration: Add auto_atesto columns for Gestor Emergency Execution mode
-- Date: 2026-01-20
-- Description: Adds columns to track auto-atesto for emergency requests made by Gestors

-- Add auto_atesto columns
ALTER TABLE solicitacoes
ADD COLUMN IF NOT EXISTS auto_atesto boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_atesto_by uuid REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS auto_atesto_at timestamptz;

-- Add comments for documentation
COMMENT ON COLUMN solicitacoes.auto_atesto IS 'Flag indicating if request has auto-atesto (for Gestor emergency mode)';
COMMENT ON COLUMN solicitacoes.auto_atesto_by IS 'User ID who performed the auto-atesto';
COMMENT ON COLUMN solicitacoes.auto_atesto_at IS 'Timestamp when auto-atesto was performed';

-- Create index for filtering auto-atesto requests
CREATE INDEX IF NOT EXISTS idx_solicitacoes_auto_atesto ON solicitacoes(auto_atesto) WHERE auto_atesto = true;
