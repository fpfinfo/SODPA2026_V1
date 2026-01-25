-- ============================================================
-- MIGRATION: CRM Enhancements (Gestão de Supridos)
-- Date: 2026-01-27
-- 
-- Description:
-- Adds blocking capability and private notes for managers.
-- ============================================================

-- 1. Add Blocking Columns to Profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blocking_reason TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blocked_by UUID REFERENCES profiles(id);

-- 2. Create Private Notes Table
CREATE TABLE IF NOT EXISTS suprido_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    suprido_id UUID NOT NULL REFERENCES profiles(id),
    author_id UUID NOT NULL REFERENCES profiles(id),
    content TEXT NOT NULL,
    is_private BOOLEAN DEFAULT TRUE, -- Default to private (manager eyes only)
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for Notes
ALTER TABLE suprido_notes ENABLE ROW LEVEL SECURITY;

-- Admins/Gestores can read notes
CREATE POLICY "Gestores can read notes" ON suprido_notes
    FOR SELECT TO authenticated
    USING (
         EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'SOSFU', 'GESTOR'))
    );

-- Admins/Gestores can write notes
CREATE POLICY "Gestores can write notes" ON suprido_notes
    FOR INSERT TO authenticated
    WITH CHECK (
         EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'SOSFU', 'GESTOR'))
    );

-- Indices
CREATE INDEX IF NOT EXISTS idx_suprido_notes_target ON suprido_notes(suprido_id);
CREATE INDEX IF NOT EXISTS idx_profiles_blocked ON profiles(is_blocked) WHERE is_blocked = TRUE;

-- Comments
COMMENT ON TABLE suprido_notes IS 'Private notes on supridos created by managers';
COMMENT ON COLUMN profiles.is_blocked IS 'If true, suprido cannot receive new funds';
