-- Unlock visibility for Comprovantes and GDRs (Receipts)

-- 1. Enable RLS
ALTER TABLE comprovantes_pc ENABLE ROW LEVEL SECURITY;

-- 2. Drop restrictive policies
DROP POLICY IF EXISTS "Suprido view own receipts" ON comprovantes_pc;
DROP POLICY IF EXISTS "Suprido select own receipts" ON comprovantes_pc;
DROP POLICY IF EXISTS "Suprido insert own receipts" ON comprovantes_pc;
DROP POLICY IF EXISTS "Suprido update own receipts" ON comprovantes_pc;
DROP POLICY IF EXISTS "Suprido delete own receipts" ON comprovantes_pc;

-- 3. Create permissive policies

-- VIEW: Everyone involved (Suprido, Gestor, SOSFU) can VIEW
-- Logic: If you can view the parent Prestacao, you can view the Receipt
CREATE POLICY "View Comprovantes Linked to PC" ON comprovantes_pc
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM prestacao_contas pc
    WHERE pc.id = comprovantes_pc.prestacao_id
    -- The user relies on the permissions of the parent PC record
    -- We assume the user has SELECT access to the parent PC (which we fixed previously)
  )
);

-- INSERT: Suprido can insert (linked to their own PC)
CREATE POLICY "Insert Comprovantes Own PC" ON comprovantes_pc
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM prestacao_contas pc
    WHERE pc.id = prestacao_id
    AND pc.submitted_by = auth.uid()
  )
);

-- UPDATE/DELETE: Suprido can edit their own (only if Draft/Pendency)
CREATE POLICY "Manage Comprovantes Own PC" ON comprovantes_pc
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM prestacao_contas pc
    WHERE pc.id = prestacao_id
    AND pc.submitted_by = auth.uid()
    AND pc.status IN ('RASCUNHO', 'PENDENCIA') -- Only editable in these states
  )
);

-- 4. Grant explicit access to Gestor/SOSFU Roles just in case
CREATE POLICY "Gestor SOSFU View All Receipts" ON comprovantes_pc
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('GESTOR', 'SOSFU', 'ADMIN')
  )
);
