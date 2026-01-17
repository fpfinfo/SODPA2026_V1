-- ============================================
-- Migration: Add document audit trail
-- Applied via: MCP on 2026-01-16
-- Status: APPLIED
-- ============================================

-- Add audit columns to documentos table
ALTER TABLE documentos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE documentos ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Create historico_documentos table for audit trail
CREATE TABLE IF NOT EXISTS historico_documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  documento_id UUID NOT NULL REFERENCES documentos(id) ON DELETE CASCADE,
  acao TEXT NOT NULL CHECK (acao IN ('CREATE', 'UPDATE', 'DELETE')),
  usuario_id UUID REFERENCES auth.users(id),
  usuario_nome TEXT,
  dados_anteriores JSONB,
  dados_novos JSONB,
  data_acao TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE historico_documentos ENABLE ROW LEVEL SECURITY;

-- Policies for historico_documentos
CREATE POLICY "historico_documentos_select_policy"
  ON historico_documentos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "historico_documentos_insert_policy"
  ON historico_documentos FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_historico_documentos_documento ON historico_documentos(documento_id);
CREATE INDEX IF NOT EXISTS idx_historico_documentos_data ON historico_documentos(data_acao DESC);

-- Comments
COMMENT ON TABLE historico_documentos IS 'Audit trail for document CRUD operations';
COMMENT ON COLUMN historico_documentos.acao IS 'Action type: CREATE, UPDATE, DELETE';
COMMENT ON COLUMN historico_documentos.dados_anteriores IS 'Previous state of document (for UPDATE/DELETE)';
COMMENT ON COLUMN historico_documentos.dados_novos IS 'New state of document (for CREATE/UPDATE)';
