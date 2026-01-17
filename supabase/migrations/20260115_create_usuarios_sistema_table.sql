-- ============================================
-- Migration: Create usuarios_sistema table
-- Applied via: MCP on 2026-01-15
-- Status: APPLIED (documentation only)
-- ============================================

-- This migration was applied directly via MCP tools.
-- This file serves as historical documentation.

CREATE TABLE IF NOT EXISTS usuarios_sistema (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servidor_id UUID REFERENCES servidores_tj(id),
  role TEXT NOT NULL CHECK (role IN ('GOVERNANCE', 'CONCESSION', 'FINANCE', 'AUDIT_CONSUMPTION', 'TAX_ANALYSIS')),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(servidor_id, role)
);

-- RLS Policies
ALTER TABLE usuarios_sistema ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuarios_sistema_select_policy"
  ON usuarios_sistema FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "usuarios_sistema_modify_policy"
  ON usuarios_sistema FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('ADMIN', 'SOSFU')
    )
  );

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_usuarios_sistema_servidor ON usuarios_sistema(servidor_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_sistema_role ON usuarios_sistema(role);

COMMENT ON TABLE usuarios_sistema IS 'SOSFU team member role assignments';
COMMENT ON COLUMN usuarios_sistema.role IS 'Technical role within SOSFU module';
