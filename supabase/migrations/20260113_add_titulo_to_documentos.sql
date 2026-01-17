-- ============================================
-- Migration: Add titulo column to documentos table
-- Applied via: MCP on 2026-01-13
-- Status: APPLIED (documentation only)
-- ============================================

-- This migration was applied directly via MCP tools.
-- This file serves as historical documentation.

ALTER TABLE documentos ADD COLUMN IF NOT EXISTS titulo TEXT;

COMMENT ON COLUMN documentos.titulo IS 'Título do documento';
