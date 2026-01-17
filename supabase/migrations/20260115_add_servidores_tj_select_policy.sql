-- ============================================
-- Migration: Add servidores_tj select policy
-- Applied via: MCP on 2026-01-15
-- Status: APPLIED (documentation only)
-- ============================================

-- This migration was applied directly via MCP tools.
-- This file serves as historical documentation.

-- Ensure servidores_tj has proper select policy
DROP POLICY IF EXISTS "servidores_tj_select_policy" ON servidores_tj;

CREATE POLICY "servidores_tj_select_policy"
  ON servidores_tj FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON POLICY "servidores_tj_select_policy" ON servidores_tj IS 'All authenticated users can view employee registry';
