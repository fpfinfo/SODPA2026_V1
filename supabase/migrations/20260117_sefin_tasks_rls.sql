-- Migration: Add RLS policies for sefin_tasks table
-- Date: 2026-01-17
-- Description: Ensures SOSFU can insert tasks for SEFIN signature

-- Enable RLS
ALTER TABLE public.sefin_tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "sefin_tasks_select_all" ON public.sefin_tasks;
DROP POLICY IF EXISTS "sefin_tasks_insert_authenticated" ON public.sefin_tasks;
DROP POLICY IF EXISTS "sefin_tasks_update_authenticated" ON public.sefin_tasks;

-- SELECT: All authenticated users can read
CREATE POLICY "sefin_tasks_select_all" ON public.sefin_tasks
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: Authenticated users with SOSFU, ADMIN, or SEFIN roles can insert
CREATE POLICY "sefin_tasks_insert_authenticated" ON public.sefin_tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('ADMIN', 'SOSFU', 'SEFIN', 'ORDENADOR')
    )
  );

-- UPDATE: Authenticated users with proper roles can update
CREATE POLICY "sefin_tasks_update_authenticated" ON public.sefin_tasks
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('ADMIN', 'SOSFU', 'SEFIN', 'ORDENADOR')
    )
  );

-- DELETE: Only ADMIN can delete
CREATE POLICY "sefin_tasks_delete_admin" ON public.sefin_tasks
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

COMMENT ON TABLE public.sefin_tasks IS 'Signing tasks queue for SEFIN (Ordenador de Despesas) module';
