-- Arquivo: scripts/create_sodpa_users.sql
-- Descrição: Cria usuários SODPA (01-06) no auth.users e public.profiles
-- Senha padrão: 123456
-- Adaptado para schema SODPA-TJPA (sem comarcas/unidades)

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_user_id uuid;
  v_email text;
  v_name text;
  i int;
BEGIN
  RAISE NOTICE 'Iniciando criação de usuários SODPA...';

  -- Loop para criar usuários sodpa01 a sodpa06
  FOR i IN 1..6 LOOP
    v_email := 'sodpa' || lpad(i::text, 2, '0') || '@tjpa.jus.br';
    
    IF i = 1 THEN
        v_name := 'Raquel de Souza Filgueira';
    ELSE
        v_name := 'Analista SODPA ' || lpad(i::text, 2, '0');
    END IF;
    
    -- Verificar se usuário já existe no AUTH
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

    IF v_user_id IS NULL THEN
      v_user_id := gen_random_uuid();
      
      -- Inserir no AUTH.USERS
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, 
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
        created_at, updated_at, confirmation_token
      ) VALUES (
        '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', v_email, crypt('123456', gen_salt('bf')), 
        now(), '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name', v_name), 
        now(), now(), ''
      );
      RAISE NOTICE 'Criado auth.user para %', v_email;
    ELSE
      RAISE NOTICE 'Usuário auth.user já existe para %', v_email;
    END IF;

    -- Inserir/Atualizar no PUBLIC.PROFILES
    INSERT INTO public.profiles (
      id, email, nome, cpf, telefone, role, 
      ativo, setor, cargo
    ) VALUES (
      v_user_id, 
      v_email, 
      v_name, 
      lpad((7000000000 + i)::text, 11, '0'), -- CPF Fictício
      '(91) 98700-' || lpad(i::text, 4, '0'), -- Telefone
      'SODPA', 
      true,
      'SODPA Central',
      'Analista Técnico'
    )
    ON CONFLICT (id) DO UPDATE SET
      role = 'SODPA',
      ativo = true,
      nome = EXCLUDED.nome,
      setor = EXCLUDED.setor,
      cargo = EXCLUDED.cargo;
      
  END LOOP;

END $$;

COMMIT;
