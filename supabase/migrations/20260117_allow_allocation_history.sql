-- Add new columns for allocation history/management
ALTER TABLE budget_allocations 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES budget_allocations(id);

-- Drop the existing strict unique constraint which prevents history (multiple rows per element)
ALTER TABLE budget_allocations 
DROP CONSTRAINT IF EXISTS budget_allocations_plan_id_ptres_code_element_code_key;

-- Create a new unique index that only enforces uniqueness for ACTIVE items
-- This ensures only one active allocation per element per PTRES, but allows multiple inactive history items
CREATE UNIQUE INDEX IF NOT EXISTS budget_allocations_active_unique_idx 
ON budget_allocations (plan_id, ptres_code, element_code) 
WHERE is_active = true;

-- Update existing rows to be active (redundant due to default but good for clarity)
UPDATE budget_allocations SET is_active = true WHERE is_active IS NULL;
