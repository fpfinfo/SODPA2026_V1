-- ============================================
-- SCRIPT DE CORREÇÃO DE AUTENTICAÇÃO - TJPA
-- Este script cria os usuários no auth.users do Supabase
-- e vincula aos profiles da aplicação.
-- ============================================

DO $$
DECLARE
    v_user_id UUID;
    v_instance_id UUID := '00000000-0000-0000-0000-000000000000';
    v_password_hash TEXT := crypt('123456', gen_salt('bf')); -- Senha padrão: 123456
BEGIN
    -- 1. CHEFE SOSFU (chefe@tjpa.jus.br)
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'chefe@tjpa.jus.br') THEN
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, 
            email_confirmed_at, recovery_sent_at, last_sign_in_at, 
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at, 
            confirmation_token, email_change, email_change_token_new, recovery_token
        ) VALUES (
            v_instance_id, gen_random_uuid(), 'authenticated', 'authenticated', 'chefe@tjpa.jus.br', v_password_hash, 
            now(), now(), now(), 
            '{"provider":"email","providers":["email"]}', '{}', now(), now(), 
            '', '', '', ''
        ) RETURNING id INTO v_user_id;

        -- Criar/Atualizar Profile
        INSERT INTO public.profiles (id, email, nome, role, created_at, updated_at)
        VALUES (v_user_id, 'chefe@tjpa.jus.br', 'Maria Helena Costa Ferreira', 'chefe_sosfu', now(), now())
        ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, role = 'chefe_sosfu';
    END IF;

    -- 2. SUPRIDO TESTE (suprido@tjpa.jus.br)
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'suprido@tjpa.jus.br') THEN
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, 
            email_confirmed_at, recovery_sent_at, last_sign_in_at, 
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at, 
            confirmation_token, email_change, email_change_token_new, recovery_token
        ) VALUES (
            v_instance_id, gen_random_uuid(), 'authenticated', 'authenticated', 'suprido@tjpa.jus.br', v_password_hash, 
            now(), now(), now(), 
            '{"provider":"email","providers":["email"]}', '{}', now(), now(), 
            '', '', '', ''
        ) RETURNING id INTO v_user_id;

        -- Criar/Atualizar Profile
        INSERT INTO public.profiles (id, email, nome, role, created_at, updated_at)
        VALUES (v_user_id, 'suprido@tjpa.jus.br', 'Ademário Silva de Jesus', 'suprido', now(), now())
        ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, role = 'suprido';
    END IF;

    -- 3. ORDENADOR 01 (ordenador01@tjpa.jus.br)
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'ordenador01@tjpa.jus.br') THEN
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, 
            email_confirmed_at, recovery_sent_at, last_sign_in_at, 
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at, 
            confirmation_token, email_change, email_change_token_new, recovery_token
        ) VALUES (
            v_instance_id, gen_random_uuid(), 'authenticated', 'authenticated', 'ordenador01@tjpa.jus.br', v_password_hash, 
            now(), now(), now(), 
            '{"provider":"email","providers":["email"]}', '{}', now(), now(), 
            '', '', '', ''
        ) RETURNING id INTO v_user_id;

        -- Criar/Atualizar Profile
        INSERT INTO public.profiles (id, email, nome, role, created_at, updated_at)
        VALUES (v_user_id, 'ordenador01@tjpa.jus.br', 'Carlos Alberto Mendes Lima', 'ordenador', now(), now())
        ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, role = 'ordenador';
    END IF;

END $$;
