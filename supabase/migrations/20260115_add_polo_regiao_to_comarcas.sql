-- ============================================
-- Migration: Add polo and regiao columns to comarcas
-- Applied via: MCP on 2026-01-15
-- Status: APPLIED (documentation only)
-- ============================================

-- This migration was applied directly via MCP tools.
-- This file serves as historical documentation.

ALTER TABLE comarcas ADD COLUMN IF NOT EXISTS polo VARCHAR(100);
ALTER TABLE comarcas ADD COLUMN IF NOT EXISTS regiao VARCHAR(100);

-- Create indexes for analytics
CREATE INDEX IF NOT EXISTS idx_comarcas_polo ON comarcas(polo);
CREATE INDEX IF NOT EXISTS idx_comarcas_regiao ON comarcas(regiao);

COMMENT ON COLUMN comarcas.polo IS 'Pólo regional (e.g., Pólo Belém)';
COMMENT ON COLUMN comarcas.regiao IS 'Região administrativa (e.g., 1ª Região - Metropolitana)';
