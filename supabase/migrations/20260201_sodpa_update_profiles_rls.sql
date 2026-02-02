-- Migration: Permitir SODPA atualizar profiles de membros da equipe
-- Data: 2026-02-01
-- Descrição: Adiciona política RLS para permitir que usuários SODPA atualizem
--            o setor e cargo de outros usuários ao adicionar à equipe

-- Criar política para permitir SODPA atualizar profiles
CREATE POLICY "SODPA can update team member profiles"
ON profiles
FOR UPDATE
TO public
USING (
  -- Permite se o usuário logado tem role SODPA
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role_id = (SELECT id FROM roles WHERE name = 'Equipe Técnica SODPA')
  )
)
WITH CHECK (
  -- Permite se o usuário logado tem role SODPA
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role_id = (SELECT id FROM roles WHERE name = 'Equipe Técnica SODPA')
  )
);

-- Comentário
COMMENT ON POLICY "SODPA can update team member profiles" ON profiles IS 
  'Permite que usuários com role SODPA atualizem perfis de outros usuários ao adicionar à equipe técnica';
