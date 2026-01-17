-- ============================================
-- Migration: Create annual budgets table (legacy)
-- Applied via: MCP on 2026-01-14
-- Status: APPLIED (documentation only)
-- Note: May have been superseded by create_budget_tables.sql
-- ============================================

-- This migration was applied directly via MCP tools.
-- This file serves as historical documentation.

CREATE TABLE IF NOT EXISTS annual_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL UNIQUE,
  total_cap DECIMAL(15,2) NOT NULL,
  executed_ordinary DECIMAL(15,2) DEFAULT 0,
  executed_extraordinary DECIMAL(15,2) DEFAULT 0,
  last_batch_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE annual_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "annual_budgets_select_policy"
  ON annual_budgets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "annual_budgets_modify_policy"
  ON annual_budgets FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('SOSFU', 'ADMIN', 'GOVERNANCE')
    )
  );

COMMENT ON TABLE annual_budgets IS 'Legacy annual budget tracking table';
