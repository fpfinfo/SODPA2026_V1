-- Arquivo: scripts/hard_reset_servidor01.sql
-- Descrição: Versão FINAL corrigida com base na inspeção do schema real.
-- Tabela profiles: usa 'nome' (não full_name), 'setor', 'cargo'
-- Tabela servidores_tj: usa 'nome', 'funcao', 'setor' (sem matricula, sem cargo, sem lotacao)

BEGIN;

-- 1. DESVINCULAR SERVIDOR EXISTENTE (Evitar FK Error)
UPDATE public.servidores_tj 
SET user_id = NULL 
WHERE email = 'servidor01@tjpa.jus.br';

-- 2. REMOVER DADOS ANTIGOS
DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'servidor01@tjpa.jus.br');
DELETE FROM public.profiles WHERE email = 'servidor01@tjpa.jus.br';
DELETE FROM auth.users WHERE email = 'servidor01@tjpa.jus.br';

-- 3. CRIAR USUÁRIO AUTH
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'servidor01@tjpa.jus.br', 
    crypt('123456', gen_salt('bf')), now(), 
    '{"provider": "email", "providers": ["email"]}', 
    '{"full_name": "Servidor Teste 01", "matricula": "2026001", "role": "suprido"}', 
    now(), now()
);

-- 4. CRIAR IDENTIDADE (Fix Login 500)
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
SELECT id, id, jsonb_build_object('sub', id, 'email', email), 'email', id::text, now(), now(), now()
FROM auth.users WHERE email = 'servidor01@tjpa.jus.br';

-- 5. CRIAR PERFIL (Schema: nome, cargo, setor)
INSERT INTO public.profiles (
    id, email, nome, role, matricula, cargo, setor, created_at, updated_at
)
SELECT 
    id,
    email,
    'Servidor Teste 01',
    'suprido',
    '2026001',
    'Técnico Judiciário',
    'Secretaria Administrativa',
    now(),
    now()
FROM auth.users 
WHERE email = 'servidor01@tjpa.jus.br';

-- 6. VINCULAR SERVIDOR TJ (Schema: nome, funcao, setor)
-- Tenta atualizar se já existe (pelo email)
UPDATE public.servidores_tj
SET 
    user_id = (SELECT id FROM auth.users WHERE email = 'servidor01@tjpa.jus.br'),
    nome = 'Servidor Teste 01',
    funcao = 'Técnico Judiciário',
    setor = 'Secretaria Administrativa'
WHERE email = 'servidor01@tjpa.jus.br';

-- Se não existia (Update retornou 0 linhas), insere
INSERT INTO public.servidores_tj (nome, email, funcao, setor, user_id)
SELECT 
    'Servidor Teste 01', 
    'servidor01@tjpa.jus.br', 
    'Técnico Judiciário', 
    'Secretaria Administrativa', 
    id
FROM auth.users 
WHERE email = 'servidor01@tjpa.jus.br'
AND NOT EXISTS (SELECT 1 FROM public.servidores_tj WHERE email = 'servidor01@tjpa.jus.br');

COMMIT;

SELECT id, email, role, 'User Hard Reset Complete' as status 
FROM auth.users 
WHERE email = 'servidor01@tjpa.jus.br';
