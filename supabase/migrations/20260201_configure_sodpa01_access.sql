-- ====================================================================
-- Migration: Configurar Acesso SODPA para sodpa01@tjpa.jus.br
-- Created: 2026-02-01
-- Updated: 2026-02-01 20:05
-- Description: Adiciona permissões RBAC para o usuário sodpa01 acessar o módulo SODPA
-- ====================================================================

-- Adicionar role SODPA para sodpa01@tjpa.jus.br
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
    RAISE EXCEPTION 'Usuário sodpa01@tjpa.jus.br não encontrado no sistema';
  END IF;

  -- Verificar se já possui a role SODPA ativa
  SELECT EXISTS(
    SELECT 1 FROM user_roles
    WHERE user_id = v_user_id
    AND module = 'SODPA'
    AND is_active = true
  ) INTO v_role_exists;

  IF NOT v_role_exists THEN
    -- Inserir nova role SODPA/ANALISTA
    INSERT INTO user_roles (user_id, module, role, is_active)
    VALUES (v_user_id, 'SODPA', 'ANALISTA', true)
    ON CONFLICT (user_id, module) DO UPDATE
    SET 
      role = EXCLUDED.role,
      is_active = true,
      updated_at = now();
    
    RAISE NOTICE 'Role SODPA/ANALISTA configurada com sucesso para sodpa01@tjpa.jus.br';
  ELSE
    RAISE NOTICE 'Usuário sodpa01@tjpa.jus.br já possui role SODPA ativa';
  END IF;

  -- Atualizar role legado no profiles (para compatibilidade com código legacy)
  UPDATE profiles
  SET role = 'SODPA'
  WHERE id = v_user_id;

  RAISE NOTICE 'Perfil legado atualizado para SODPA';
END $$;

-- Verificar configuração final
DO $$
DECLARE
  v_result record;
BEGIN
  SELECT 
    p.email,
    p.nome,
    p.role as legacy_role,
    ur.module,
    ur.role as rbac_role,
    ur.is_active
  INTO v_result
  FROM profiles p
  LEFT JOIN user_roles ur ON ur.user_id = p.id
  WHERE p.email = 'sodpa01@tjpa.jus.br'
  AND ur.module = 'SODPA';

  IF v_result IS NOT NULL THEN
    RAISE NOTICE '✓ Configuração concluída:';
    RAISE NOTICE '  Email: %', v_result.email;
    RAISE NOTICE '  Nome: %', v_result.nome;
    RAISE NOTICE '  Módulo: %', v_result.module;
    RAISE NOTICE '  Role RBAC: %', v_result.rbac_role;
    RAISE NOTICE '  Role Legacy: %', v_result.legacy_role;
    RAISE NOTICE '  Status: %', CASE WHEN v_result.is_active THEN 'ATIVA' ELSE 'INATIVA' END;
  END IF;
END $$;

