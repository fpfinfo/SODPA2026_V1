-- ============================================
-- Migration: Add editable profile fields to servidores_tj
-- Applied via: MCP on 2026-01-15
-- Status: APPLIED (documentation only)
-- ============================================

-- This migration was applied directly via MCP tools.
-- This file serves as historical documentation.

-- Add fields that users can edit in their profile
ALTER TABLE servidores_tj ADD COLUMN IF NOT EXISTS telefone TEXT;
ALTER TABLE servidores_tj ADD COLUMN IF NOT EXISTS banco TEXT;
ALTER TABLE servidores_tj ADD COLUMN IF NOT EXISTS agencia TEXT;
ALTER TABLE servidores_tj ADD COLUMN IF NOT EXISTS conta_corrente TEXT;
ALTER TABLE servidores_tj ADD COLUMN IF NOT EXISTS gestor_nome TEXT;
ALTER TABLE servidores_tj ADD COLUMN IF NOT EXISTS gestor_email TEXT;

-- Create index for manager lookups
CREATE INDEX IF NOT EXISTS idx_servidores_tj_gestor_email ON servidores_tj(gestor_email);

COMMENT ON COLUMN servidores_tj.telefone IS 'Contact phone number (editable by user)';
COMMENT ON COLUMN servidores_tj.banco IS 'Bank name (editable by user)';
COMMENT ON COLUMN servidores_tj.agencia IS 'Bank agency (editable by user)';
COMMENT ON COLUMN servidores_tj.conta_corrente IS 'Bank account number (editable by user)';
COMMENT ON COLUMN servidores_tj.gestor_nome IS 'Manager name (editable by user)';
COMMENT ON COLUMN servidores_tj.gestor_email IS 'Manager email (editable by user)';
