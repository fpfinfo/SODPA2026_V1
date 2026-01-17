-- ============================================================
-- MIGRATION: Fix assigned_to_id foreign key reference
-- 
-- Problem: assigned_to_id was referencing profiles(id) but now
-- uses usuarios_sistema.id for team member assignment.
-- 
-- Solution: Drop the incorrect FK and optionally add the correct one.
-- ============================================================

-- Drop existing foreign key constraint (if exists)
ALTER TABLE solicitacoes 
DROP CONSTRAINT IF EXISTS solicitacoes_assigned_to_id_fkey;

-- Add new foreign key referencing usuarios_sistema (optional, for data integrity)
-- Note: Using ON DELETE SET NULL to allow deletion of system users without breaking processes
ALTER TABLE solicitacoes 
ADD CONSTRAINT solicitacoes_assigned_to_id_fkey 
FOREIGN KEY (assigned_to_id) REFERENCES usuarios_sistema(id) ON DELETE SET NULL;

-- Comment to document the change
COMMENT ON COLUMN solicitacoes.assigned_to_id IS 'ID do membro da equipe SOSFU/AJSEFIN (usuarios_sistema)';
