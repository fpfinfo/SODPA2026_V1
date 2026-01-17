-- ============================================
-- Migration: Add SOSFU/ADMIN RLS policies
-- Applied via: MCP on 2026-01-15
-- Status: APPLIED (documentation only)
-- ============================================

-- This migration was applied directly via MCP tools.
-- This file serves as historical documentation.

-- Add policy for SOSFU and ADMIN to manage role requests
DROP POLICY IF EXISTS "profiles_admin_manage_requests" ON profiles;
CREATE POLICY "profiles_admin_manage_requests"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    -- SOSFU and ADMIN can approve/reject requests
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('SOSFU', 'ADMIN')
    )
    -- Users can create their own requests
    OR auth.uid() = id
  );

-- Allow SOSFU/ADMIN to view all profiles
DROP POLICY IF EXISTS "profiles_sosfu_select_all" ON profiles;
CREATE POLICY "profiles_sosfu_select_all"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    -- Everyone can see their own profile
    auth.uid() = id
    OR
    -- SOSFU and ADMIN can see all profiles
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('SOSFU', 'ADMIN')
    )
  );

COMMENT ON POLICY "profiles_admin_manage_requests" ON profiles IS 'SOSFU/ADMIN can manage role requests, users can edit their own';
COMMENT ON POLICY "profiles_sosfu_select_all" ON profiles IS 'SOSFU/ADMIN can view all profiles';
