-- Migration: Corrigir política RLS para permitir remoção de membros
-- Problema: with_check impedia setar setor = NULL
-- Solução: Remover with_check da política SODPA

-- Drop política antiga
DROP POLICY IF EXISTS "SODPA can update team member profiles" ON profiles;

-- Recriar sem with_check
CREATE POLICY "SODPA can update team member profiles"
ON profiles FOR UPDATE TO public
USING (
  -- SODPA pode atualizar qualquer profile
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role_id = (SELECT id FROM roles WHERE name = 'Equipe Técnica SODPA')
  )
)
-- ✅ SEM with_check! Permitir qualquer UPDATE
;
