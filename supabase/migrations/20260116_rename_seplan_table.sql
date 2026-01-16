-- Migration: Rename seplan_tasks to sefin_tasks
-- Date: 2026-01-16
-- Description: Renames the seplan_tasks table to sefin_tasks to align with the global renaming of SEPLAN to SEFIN.

BEGIN;

  -- Rename the table if it exists
  DO $$
  BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'seplan_tasks') THEN
      ALTER TABLE public.seplan_tasks RENAME TO sefin_tasks;
    END IF;
  END $$;

  -- Update any policies that reference the old table name if necessary
  -- (Assuming standard CRUD policies, we might need to recreate them if they are named specifically)
  
  -- Example: Drop old policies and create new ones (generic approach)
  -- DROP POLICY IF EXISTS "Enable read access for all users" ON public.sefin_tasks;
  -- CREATE POLICY "Enable read access for all users" ON public.sefin_tasks FOR SELECT USING (true);
  
  -- Comment on table
  COMMENT ON TABLE public.sefin_tasks IS 'Table for SEFIN signing tasks (previously SEPLAN)';

COMMIT;
