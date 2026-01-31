-- Arquivo: scripts/create_magistrados.sql
-- Descrição: Cria perfis de magistrados (juízes e desembargadores) para teste
-- Executar no SQL Editor do projeto bnlgogjdoqaqcjjunevu (SODPA-TJPA)
-- Senha padrão: 123456

BEGIN;

-- =============================================
-- FUNÇÃO AUXILIAR PARA CRIAR USUÁRIO COMPLETO
-- =============================================
CREATE OR REPLACE FUNCTION create_test_user(
    p_email TEXT,
    p_nome TEXT,
    p_cargo TEXT,
    p_matricula TEXT,
    p_role TEXT DEFAULT 'suprido'
) RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Gerar UUID
    v_user_id := gen_random_uuid();
    
    -- Limpar usuário existente (se houver)
    DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email = p_email);
    DELETE FROM public.profiles WHERE email = p_email;
    DELETE FROM auth.users WHERE email = p_email;
    
    -- Criar usuário auth com tokens vazios (não NULL!)
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, 
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
        created_at, updated_at,
        confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', p_email,
        crypt('123456', gen_salt('bf')), now(),
        '{"provider": "email", "providers": ["email"]}',
        jsonb_build_object('full_name', p_nome, 'matricula', p_matricula, 'role', p_role),
        now(), now(),
        '', '', '', ''  -- CRITICAL: tokens vazios, não NULL
    );
    
    -- Criar identidade
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (v_user_id, v_user_id, jsonb_build_object('sub', v_user_id, 'email', p_email), 'email', v_user_id::text, now(), now(), now());
    
    -- Criar perfil público
    INSERT INTO public.profiles (id, email, nome, role, matricula, cargo, setor, created_at, updated_at)
    VALUES (v_user_id, p_email, p_nome, p_role, p_matricula, p_cargo, 'Tribunal de Justiça', now(), now());
    
    -- Vincular em servidores_tj (opcional, mas útil)
    INSERT INTO public.servidores_tj (nome, email, funcao, setor, user_id)
    VALUES (p_nome, p_email, p_cargo, 'Tribunal de Justiça', v_user_id)
    ON CONFLICT (email) DO UPDATE SET user_id = v_user_id, nome = p_nome, funcao = p_cargo;
    
    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- CRIAR JUÍZES (1ª INSTÂNCIA)
-- =============================================
SELECT create_test_user('juiz01@tjpa.jus.br', 'Juiz de Direito 01', 'Juiz de Direito', 'MAG001', 'gestor');
SELECT create_test_user('juiz02@tjpa.jus.br', 'Juiz de Direito 02', 'Juiz de Direito', 'MAG002', 'gestor');
SELECT create_test_user('juiz03@tjpa.jus.br', 'Juiz de Direito 03', 'Juiz de Direito', 'MAG003', 'gestor');

-- =============================================
-- CRIAR DESEMBARGADORES (2ª INSTÂNCIA)
-- =============================================
SELECT create_test_user('desembargador01@tjpa.jus.br', 'Desembargador 01', 'Desembargador', 'DES001', 'gestor');
SELECT create_test_user('desembargador02@tjpa.jus.br', 'Desembargador 02', 'Desembargador', 'DES002', 'gestor');
SELECT create_test_user('desembargador03@tjpa.jus.br', 'Desembargador 03', 'Desembargador', 'DES003', 'gestor');

-- =============================================
-- LIMPAR FUNÇÃO AUXILIAR
-- =============================================
DROP FUNCTION IF EXISTS create_test_user(TEXT, TEXT, TEXT, TEXT, TEXT);

COMMIT;

-- =============================================
-- VERIFICAR USUÁRIOS CRIADOS
-- =============================================
SELECT email, nome, cargo, role, matricula
FROM public.profiles 
WHERE email LIKE 'juiz%@tjpa.jus.br' OR email LIKE 'desembargador%@tjpa.jus.br'
ORDER BY email;
