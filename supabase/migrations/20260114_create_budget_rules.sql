-- ============================================
-- Migration: Create budget rules table
-- Applied via: MCP on 2026-01-14
-- Status: APPLIED (documentation only)
-- ============================================

-- This migration was applied directly via MCP tools.
-- This file serves as historical documentation.

CREATE TABLE IF NOT EXISTS budget_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_category TEXT NOT NULL CHECK (unit_category IN ('JURISDICTIONAL', 'ADMINISTRATIVE', 'ALL')),
  supply_category TEXT NOT NULL CHECK (supply_category IN ('ORDINARY', 'EXTRAORDINARY')),
  element_prefix TEXT NOT NULL,
  target_action_code TEXT NOT NULL,
  target_allocation_code TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create unique constraint to prevent duplicate rules
CREATE UNIQUE INDEX IF NOT EXISTS idx_budget_rules_unique 
  ON budget_rules(unit_category, supply_category, element_prefix);

-- RLS Policies
ALTER TABLE budget_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "budget_rules_select_policy"
  ON budget_rules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "budget_rules_modify_policy"
  ON budget_rules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('SOSFU', 'ADMIN', 'GOVERNANCE')
    )
  );

COMMENT ON TABLE budget_rules IS 'Budget allocation rules (De/Para mapping)';
COMMENT ON COLUMN budget_rules.unit_category IS 'Who requests: JURISDICTIONAL, ADMINISTRATIVE, or ALL';
COMMENT ON COLUMN budget_rules.supply_category IS 'What is requested: ORDINARY or EXTRAORDINARY';
COMMENT ON COLUMN budget_rules.element_prefix IS 'Expense element prefix (e.g., 3.3.90.30)';
COMMENT ON COLUMN budget_rules.target_action_code IS 'Target budget action code (PTRES)';
COMMENT ON COLUMN budget_rules.target_allocation_code IS 'Target allocation code (Fonte/Dotação)';
