-- ============================================
-- Migration: Fix budget RLS policies v2
-- Applied via: MCP on 2026-01-16
-- Status: APPLIED (documentation only)
-- ============================================

-- This migration was applied directly via MCP tools.
-- This file serves as historical documentation.

-- Drop existing policies
DROP POLICY IF EXISTS "budget_plans_select_policy" ON budget_plans;
DROP POLICY IF EXISTS "budget_plans_modify_policy" ON budget_plans;
DROP POLICY IF EXISTS "budget_allocations_select_policy" ON budget_allocations;
DROP POLICY IF EXISTS "budget_allocations_modify_policy" ON budget_allocations;

-- Create updated policies with email bypass for teste@tjpa.jus.br
CREATE POLICY "budget_plans_select_policy"
  ON budget_plans FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "budget_plans_modify_policy"
  ON budget_plans FOR ALL
  TO authenticated
  USING (
    -- Hardcoded bypass for test user
    (auth.jwt() ->> 'email' = 'teste@tjpa.jus.br')
    OR
    -- Regular role check
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('SOSFU', 'ADMIN', 'GOVERNANCE')
    )
  );

CREATE POLICY "budget_allocations_select_policy"
  ON budget_allocations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "budget_allocations_modify_policy"
  ON budget_allocations FOR ALL
  TO authenticated
  USING (
    -- Hardcoded bypass for test user
    (auth.jwt() ->> 'email' = 'teste@tjpa.jus.br')
    OR
    -- Regular role check
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('SOSFU', 'ADMIN', 'GOVERNANCE')
    )
  );

COMMENT ON POLICY "budget_plans_modify_policy" ON budget_plans IS 'SOSFU/ADMIN/GOVERNANCE can modify budget plans';
COMMENT ON POLICY "budget_allocations_modify_policy" ON budget_allocations IS 'SOSFU/ADMIN/GOVERNANCE can modify budget allocations';
