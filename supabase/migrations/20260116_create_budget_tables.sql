-- Migration: Create budget planning tables
-- Date: 2026-01-16

-- 1. Budget Plans Table (Header)
CREATE TABLE IF NOT EXISTS budget_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL UNIQUE,
  total_budget DECIMAL(15,2) NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Budget Allocations Table (Details)
CREATE TABLE IF NOT EXISTS budget_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES budget_plans(id) ON DELETE CASCADE,
  
  ptres_code VARCHAR(10) NOT NULL,
  element_code VARCHAR(20) NOT NULL,
  
  -- Editable fields
  dotacao_code VARCHAR(20),
  allocated_value DECIMAL(15,2) DEFAULT 0, -- Dotação Atual
  committed_value DECIMAL(15,2) DEFAULT 0, -- Valor Empenhado
  description TEXT,                        -- Custom description per allocation/PTRES context
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicates per item
  UNIQUE(plan_id, ptres_code, element_code)
);

-- 3. RLS Policies
ALTER TABLE budget_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_allocations ENABLE ROW LEVEL SECURITY;

-- Read: Authenticated users can view budget plans
CREATE POLICY "budget_plans_read" ON budget_plans FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "budget_allocations_read" ON budget_allocations FOR SELECT USING (auth.role() = 'authenticated');

-- Write: Only SOSFU/ADMIN can manage budget
CREATE POLICY "budget_plans_write" ON budget_plans FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('SOSFU', 'ADMIN'))
);
CREATE POLICY "budget_allocations_write" ON budget_allocations FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('SOSFU', 'ADMIN'))
);

-- 4. Audit Triggers
CREATE OR REPLACE FUNCTION update_budget_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_budget_plans_updated
  BEFORE UPDATE ON budget_plans
  FOR EACH ROW EXECUTE FUNCTION update_budget_timestamp();

CREATE TRIGGER trg_budget_allocations_updated
  BEFORE UPDATE ON budget_allocations
  FOR EACH ROW EXECUTE FUNCTION update_budget_timestamp();
