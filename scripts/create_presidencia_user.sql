-- Arquivo: scripts/create_presidencia_user.sql
-- Descrição: Cria usuário PRESIDENCIA no Supabase
-- Executar no SQL Editor do projeto bnlgogjdoqaqcjjunevu (SODPA-TJPA)

-- Deletar existentes
DELETE FROM auth.users WHERE email = 'presidencia@tjpa.jus.br';
DELETE FROM public.profiles WHERE email = 'presidencia@tjpa.jus.br';

-- Criar usuário PRESIDENCIA
DO $$
DECLARE
  user_id uuid;
BEGIN
  user_id := gen_random_uuid();
  
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at, is_sso_user, deleted_at
  ) VALUES (
    user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'presidencia@tjpa.jus.br', crypt('123456', gen_salt('bf')), NOW(),
    '', '', '', '',
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"role": "presidencia", "nome": "Des. Maria de Nazaré Silva"}'::jsonb,
    NOW(), NOW(), false, NULL
  );
  
  INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), user_id, 'presidencia@tjpa.jus.br', 'email',
    ('{"sub": "' || user_id || '", "email": "presidencia@tjpa.jus.br"}')::jsonb, NOW(), NOW(), NOW());
  
  INSERT INTO public.profiles (id, email, nome, matricula, cargo, role, created_at, updated_at)
  VALUES (user_id, 'presidencia@tjpa.jus.br', 'Des. Maria de Nazaré Silva', '1001-A', 'Presidente do Tribunal', 'presidencia', NOW(), NOW());
  
  RAISE NOTICE 'Criado: presidencia@tjpa.jus.br - Des. Maria de Nazaré Silva';
END $$;

-- Verificar usuário criado
SELECT u.email, p.nome, p.cargo, p.role 
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'presidencia@tjpa.jus.br';
