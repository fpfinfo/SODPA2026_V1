-- Migration: Fix RLS for sefin_tasks to allow insertion
-- Date: 2026-01-17
-- Description: Previous RLS policy was too restrictive and required specific roles

-- Drop old policies and create permissive ones
DROP POLICY IF EXISTS "sefin_tasks_insert_authenticated" ON public.sefin_tasks;
DROP POLICY IF EXISTS "sefin_tasks_update_authenticated" ON public.sefin_tasks;

-- Allow any authenticated user to insert (SOSFU tramits need to insert here)
CREATE POLICY "sefin_tasks_insert_authenticated" ON public.sefin_tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow any authenticated user to update (for signing/rejecting)
CREATE POLICY "sefin_tasks_update_authenticated" ON public.sefin_tasks
  FOR UPDATE
  TO authenticated
  USING (true);

COMMENT ON TABLE public.sefin_tasks IS 'Signing tasks queue - open insert for any authenticated user';
