-- ============================================
-- Migration: Fix servidores_tj update policy
-- Applied via: MCP on 2026-01-15
-- Status: APPLIED (documentation only)
-- ============================================

-- This migration was applied directly via MCP tools.
-- This file serves as historical documentation.

-- Drop existing update policy
DROP POLICY IF EXISTS "servidores_tj_update_policy" ON servidores_tj;

-- Create updated policy that allows users to update their own profile fields
CREATE POLICY "servidores_tj_update_policy"
  ON servidores_tj FOR UPDATE
  TO authenticated
  USING (
    -- Users can update their own editable fields
    email = auth.jwt() ->> 'email'
    OR
    -- Admins and SOSFU can update any profile
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('ADMIN', 'SOSFU')
    )
  );

COMMENT ON POLICY "servidores_tj_update_policy" ON servidores_tj IS 'Users can edit their own profile, admins can edit all';
