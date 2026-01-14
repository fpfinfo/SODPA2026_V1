-- ============================================
-- EXECUTE THIS IN SUPABASE SQL EDITOR
-- Fixes: Gestor inbox empty after tramitation
-- ============================================

-- Allow authenticated users to view all solicitacoes (for gestores, SOSFU, etc.)
drop policy if exists "Authenticated users can view all solicitacoes" on solicitacoes;
create policy "Authenticated users can view all solicitacoes" on solicitacoes 
for select using (auth.role() = 'authenticated');

-- Allow authenticated users to update solicitacoes (for tramitation workflow)
drop policy if exists "Authenticated users can update solicitacoes" on solicitacoes;
create policy "Authenticated users can update solicitacoes" on solicitacoes 
for update using (auth.role() = 'authenticated');

-- Verify the policies were created
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'solicitacoes';
