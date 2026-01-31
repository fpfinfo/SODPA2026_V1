-- Arquivo: scripts/reset_suprido_users.sql
-- Descrição: Limpeza TOTAL e Recriação dos usuários Suprido
-- Também lista triggers da tabela auth.users para debug

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. DIAGNÓSTICO DE TRIGGERS
DO $$
DECLARE
  r RECORD;
BEGIN
  RAISE NOTICE '--- TRIGGERS EM AUTH.USERS ---';
  FOR r IN 
    SELECT tgname, proname 
    FROM pg_trigger t
    JOIN pg_proc p ON p.oid = t.tgfoid
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'auth' AND c.relname = 'users'
  LOOP
    RAISE NOTICE 'Trigger: % | Function: %', r.tgname, r.proname;
  END LOOP;
  RAISE NOTICE '-------------------------------';
END $$;

-- 2. LIMPEZA (HARD DELETE)
DO $$
DECLARE
  v_emails text[] := ARRAY[
    'servidor01@tjpa.jus.br', 'servidor02@tjpa.jus.br', 
    'servidor03@tjpa.jus.br', 'servidor04@tjpa.jus.br', 
    'servidor05@tjpa.jus.br'
  ];
  v_email text;
  v_user_id uuid;
BEGIN
  FOREACH v_email IN ARRAY v_emails LOOP
    RAISE NOTICE 'Limpando usuário: %', v_email;
    
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;
    
    IF v_user_id IS NOT NULL THEN
      -- Deletar dependências diretas conhecidas
      DELETE FROM public.servidores_tj WHERE id = v_user_id;
      DELETE FROM public.servidores_tj WHERE user_id = v_user_id;
      DELETE FROM public.profiles WHERE id = v_user_id;
      
      -- Deletar do AUTH (Cascade deve cuidar do resto, mas deletamos acima por segurança)
      DELETE FROM auth.users WHERE id = v_user_id;
      
      RAISE NOTICE '✅ Usuário % removido com sucesso.', v_email;
    ELSE
      RAISE NOTICE '⚠️ Usuário % não encontrado no auth.users (talvez já limpo).', v_email;
      -- Tenta limpar profiles "orfãos" por email se houver unique constraint de email lá
      DELETE FROM public.profiles WHERE email = v_email;
      DELETE FROM public.servidores_tj WHERE email = v_email;
    END IF;
  END LOOP;
END $$;

-- 3. RECRIAÇÃO (Mesma lógica do create_suprido_users corrigido)
DO $$
DECLARE
  v_user_id uuid;
  v_email text;
  v_name text;
  i int;
  v_cpf text;
BEGIN
  RAISE NOTICE '--- RECRIANDO USUÁRIOS ---';

  -- FIX CONSTRAINT (Novamente, para garantir)
  ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role::text = ANY (ARRAY[
    'SUPRIDO', 'GESTOR', 'SOSFU', 'SEFIN', 'AJSEFIN', 'SGP', 'SODPA', 'ADMIN',
    'suprido', 'gestor', 'sosfu', 'sefin', 'ajsefin', 'sgp', 'sodpa', 'admin',
    'ordenador', 'analista_sosfu', 'chefe_sosfu'
  ]::text[]));

  FOR i IN 1..5 LOOP
    v_email := 'servidor' || lpad(i::text, 2, '0') || '@tjpa.jus.br';
    v_name := 'Servidor Suprido ' || lpad(i::text, 2, '0');
    v_cpf := lpad((8000000000 + i)::text, 11, '0');
    
    v_user_id := gen_random_uuid();
    
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, 
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
      created_at, updated_at, confirmation_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', v_email, crypt('123456', gen_salt('bf')), 
      now(), '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name', v_name), 
      now(), now(), ''
    );

    INSERT INTO public.profiles (
      id, email, nome, cpf, telefone, role, 
      ativo, setor, cargo
    ) VALUES (
      v_user_id, v_email, v_name, v_cpf,
      '(91) 99100-' || lpad(i::text, 4, '0'),
      'SUPRIDO', true, 'Secretaria Geral', 'Analista Judiciário'
    );

    INSERT INTO public.servidores_tj (
      id, user_id, nome, email, funcao, 
      setor, ativo, capacidade_diaria
    ) VALUES (
      v_user_id, v_user_id, v_name, v_email, 
      'ANALISTA JUDICIARIO', 'SECRETARIA', true, 5
    );
    
    RAISE NOTICE '✅ Criado: % (ID: %)', v_email, v_user_id;

  END LOOP;
END $$;

COMMIT;
