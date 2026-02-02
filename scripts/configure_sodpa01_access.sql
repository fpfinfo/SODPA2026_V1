-- ====================================================================
-- CONFIGURAÇÃO DE ACESSO SODPA PARA sodpa01@tjpa.jus.br
-- Data: 2026-02-01
-- Objetivo: Adicionar permissões RBAC para acesso ao módulo SODPA
-- ====================================================================

-- 1. Verificar perfil atual
SELECT 
  p.id,
  p.email,
  p.nome,
  p.role as legacy_role,
  p.municipio_id,
  p.comarca_id
FROM profiles p
WHERE p.email = 'sodpa01@tjpa.jus.br';

-- 2. Verificar roles atuais
SELECT 
  ur.id,
  ur.user_id,
  ur.module,
  ur.role,
  ur.comarca_id,
  ur.is_active,
  ur.created_at
FROM user_roles ur
JOIN profiles p ON p.id = ur.user_id
WHERE p.email = 'sodpa01@tjpa.jus.br'
ORDER BY ur.created_at DESC;

-- 3. Adicionar role SODPA (ANALISTA) se não existir
DO $$
DECLARE
  v_user_id uuid;
  v_role_exists boolean;
BEGIN
  -- Obter ID do usuário
  SELECT id INTO v_user_id
  FROM profiles
  WHERE email = 'sodpa01@tjpa.jus.br';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário sodpa01@tjpa.jus.br não encontrado';
  END IF;

  -- Verificar se já possui a role SODPA
  SELECT EXISTS(
    SELECT 1 FROM user_roles
    WHERE user_id = v_user_id
    AND module = 'SODPA'
    AND is_active = true
  ) INTO v_role_exists;

  IF NOT v_role_exists THEN
    -- Inserir nova role SODPA
    INSERT INTO user_roles (user_id, module, role, is_active)
    VALUES (v_user_id, 'SODPA', 'ANALISTA', true)
    ON CONFLICT (user_id, module) DO UPDATE
    SET 
      role = EXCLUDED.role,
      is_active = true,
      updated_at = now();
    
    RAISE NOTICE 'Role SODPA/ANALISTA adicionada com sucesso para sodpa01@tjpa.jus.br';
  ELSE
    RAISE NOTICE 'Usuário sodpa01@tjpa.jus.br já possui role SODPA ativa';
  END IF;

  -- Atualizar role legado no profiles (opcional, para compatibilidade)
  UPDATE profiles
  SET role = 'SODPA'
  WHERE email = 'sodpa01@tjpa.jus.br'
  AND id = v_user_id;

  RAISE NOTICE 'Perfil legado atualizado para SODPA';
END $$;


-- 4. Verificar configuração final
SELECT 
  p.email,
  p.nome,
  p.role as legacy_role,
  ur.module,
  ur.role as rbac_role,
  ur.is_active,
  c.nome as comarca
FROM profiles p
LEFT JOIN user_roles ur ON ur.user_id = p.id
LEFT JOIN "dComarcas" c ON c.id = p.comarca_id
WHERE p.email = 'sodpa01@tjpa.jus.br'
ORDER BY ur.created_at DESC;
