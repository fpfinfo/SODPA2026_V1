-- ============================================
-- Migration: Update location tables (comarcas, municipios, lotacoes)
-- Applied via: MCP on 2026-01-15
-- Status: APPLIED (documentation only)
-- ============================================

-- This migration was applied directly via MCP tools.
-- This file serves as historical documentation.

-- Add codigo column to comarcas for standardized identification
ALTER TABLE comarcas ADD COLUMN IF NOT EXISTS codigo VARCHAR(10) UNIQUE;

-- Add codigo_ibge to municipios
ALTER TABLE municipios ADD COLUMN IF NOT EXISTS codigo_ibge VARCHAR(10);

-- Update municipios to ensure UF defaults to PA
ALTER TABLE municipios ALTER COLUMN uf SET DEFAULT 'PA';

-- Create lotacoes table if it doesn't exist
CREATE TABLE IF NOT EXISTS lotacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  comarca_id UUID REFERENCES comarcas(id),
  tipo TEXT CHECK (tipo IN ('VARA', 'CARTORIO', 'SECRETARIA', 'GABINETE', 'OUTRO')),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_comarcas_codigo ON comarcas(codigo);
CREATE INDEX IF NOT EXISTS idx_municipios_codigo_ibge ON municipios(codigo_ibge);
CREATE INDEX IF NOT EXISTS idx_lotacoes_comarca ON lotacoes(comarca_id);

-- RLS Policies for lotacoes
ALTER TABLE lotacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lotacoes_select_policy"
  ON lotacoes FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON TABLE lotacoes IS 'Organizational units within comarcas (varas, cartorios, etc.)';
