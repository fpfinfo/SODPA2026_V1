-- Fix RLS for Prestacao Contas to allow flow transition

-- 1. Enable RLS (ensure it's on)
ALTER TABLE prestacao_contas ENABLE ROW LEVEL SECURITY;

-- 2. Drop restrictive policies
DROP POLICY IF EXISTS "Suprido view own draft" ON prestacao_contas;
DROP POLICY IF EXISTS "Suprido update own draft" ON prestacao_contas;
DROP POLICY IF EXISTS "Suprido insert own draft" ON prestacao_contas;
DROP POLICY IF EXISTS "Supridos can view their own Pcs" ON prestacao_contas;
DROP POLICY IF EXISTS "Supridos can insert their own Pcs" ON prestacao_contas;
DROP POLICY IF EXISTS "Supridos can update their own Pcs" ON prestacao_contas;

-- 3. Create permissive policies for Owners (Supridos)

-- SELECT: Suprido can see ALL their PCs regardless of status
CREATE POLICY "Suprido select own" ON prestacao_contas
FOR SELECT
USING ( auth.uid() = submitted_by );

-- INSERT: Suprido can create new PCs
CREATE POLICY "Suprido insert own" ON prestacao_contas
FOR INSERT
WITH CHECK ( auth.uid() = submitted_by );

-- UPDATE: Suprido can update their PCs
-- We allow them to update validation fields and status
CREATE POLICY "Suprido update own" ON prestacao_contas
FOR UPDATE
USING ( auth.uid() = submitted_by );

-- 4. Ensure Gestor/SOSFU access (assuming specific roles or public for authenticated for now based on context, 
-- but strictly we should add policies for them too if not present. 
-- Assuming "authenticated" users might need to read if they are in the loop, 
-- but normally checking permissions. For now, focus on Suprido unblocking)

-- (Optional) If Gestor needs to view:
CREATE POLICY "Gestor view all" ON prestacao_contas
FOR SELECT
USING ( 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('GESTOR', 'SOSFU', 'ADMIN')
  )
);

-- (Optional) Gestor needs to update (for Atesto):
CREATE POLICY "Gestor update for atesto" ON prestacao_contas
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('GESTOR', 'SOSFU', 'ADMIN')
  )
);
