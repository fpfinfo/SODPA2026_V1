-- Arquivo: scripts/create_suprido_users.sql
-- Descrição: Cria usuários SUPRIDO (servidor01-05) no auth.users, public.profiles e servidores_tj
-- Senha padrão: 123456

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. FIX CONSTRAINT (Ensure SUPRIDO/suprido are valid)
DO $$
BEGIN
  -- Drop existing constraint to reset rules
  ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
  
  -- Re-add with comprehensive list (Upper and Lower case to prevent future issues)
  ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_role_check 
  CHECK (role::text = ANY (ARRAY[
    'SUPRIDO', 'GESTOR', 'SOSFU', 'SEFIN', 'AJSEFIN', 'SGP', 'SODPA', 'ADMIN',
    'suprido', 'gestor', 'sosfu', 'sefin', 'ajsefin', 'sgp', 'sodpa', 'admin',
    'ordenador', 'analista_sosfu', 'chefe_sosfu'
  ]::text[]));
  
  RAISE NOTICE 'Constraint profiles_role_check updated successfully.';
END $$;

DO $$
DECLARE
  v_user_id uuid;
  v_email text;
  v_name text;
  i int;
  v_cpf text;
BEGIN
  RAISE NOTICE 'Iniciando criação de usuários SUPRIDO...';

  -- Loop para criar servidor01 a servidor05
  FOR i IN 1..5 LOOP
    v_email := 'servidor' || lpad(i::text, 2, '0') || '@tjpa.jus.br';
    v_name := 'Servidor Suprido ' || lpad(i::text, 2, '0');
    v_cpf := lpad((8000000000 + i)::text, 11, '0'); -- CPF Fictício 800...
    
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
      v_cpf,
      '(91) 99100-' || lpad(i::text, 4, '0'), -- Telefone
      'SUPRIDO', 
      true,
      'Secretaria Geral',
      'Analista Judiciário'
    )
    ON CONFLICT (id) DO UPDATE SET
      role = 'SUPRIDO',
      ativo = true,
      nome = EXCLUDED.nome,
      setor = EXCLUDED.setor,
      cargo = EXCLUDED.cargo;

    -- Inserir/Atualizar no SERVIDORES_TJ
    INSERT INTO public.servidores_tj (
      id, user_id, nome, email, funcao, 
      setor, ativo, capacidade_diaria
    ) VALUES (
      v_user_id, 
      v_user_id, 
      v_name, 
      v_email, 
      'ANALISTA JUDICIARIO', 
      'SECRETARIA',
      true,
      5
    )
    ON CONFLICT (email) DO UPDATE SET
      user_id = EXCLUDED.user_id,
      nome = EXCLUDED.nome,
      setor = 'SECRETARIA',
      ativo = true;
      
  END LOOP;

END $$;

COMMIT;
