-- Migration: Criar contas auth para membros da equipe SODPA
-- Data: 2026-02-01
-- Senha padrão: 123456

-- Função helper para criar usuário com senha
CREATE OR REPLACE FUNCTION create_sodpa_user(
  user_email TEXT,
  user_password TEXT DEFAULT '123456'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
  result JSONB;
BEGIN
  -- Criar usuário no auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  SELECT
    '00000000-0000-0000-0000-000000000000',
    p.id,
    'authenticated',
    'authenticated',
    user_email,
    crypt(user_password, gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('nome', p.nome, 'email', user_email),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  FROM profiles p
  WHERE p.email = user_email
  RETURNING id INTO user_id;

  -- Criar identidade
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    user_id,
    jsonb_build_object('sub', user_id::TEXT, 'email', user_email),
    'email',
    NOW(),
    NOW(),
    NOW()
  );

  result := jsonb_build_object(
    'success', true,
    'user_id', user_id,
    'email', user_email,
    'message', 'Usuário criado com sucesso'
  );

  RETURN result;
EXCEPTION WHEN OTHERS THEN
  result := jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'email', user_email
  );
  RETURN result;
END;
$$;

-- Criar contas para os 4 usuários SODPA
DO $$
DECLARE
  emails TEXT[] := ARRAY[
    'abel.bonfim@tjpa.jus.br',
    'aclenelma.ferreira@tjpa.jus.br',
    'acrisio.tajra@tjpa.jus.br',
    'ada.maria@tjpa.jus.br'
  ];
  email TEXT;
  resultado JSONB;
BEGIN
  FOREACH email IN ARRAY emails
  LOOP
    SELECT create_sodpa_user(email, '123456') INTO resultado;
    RAISE NOTICE 'Resultado para %: %', email, resultado;
  END LOOP;
END;
$$;

-- Limpar função helper
DROP FUNCTION IF EXISTS create_sodpa_user(TEXT, TEXT);

-- Comentário
COMMENT ON TABLE auth.users IS 'Usuários SODPA provisionados com senha padrão 123456';
