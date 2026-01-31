-- Arquivo: scripts/create_sgp_users.sql
-- Descrição: Cria usuários SGP no Supabase
-- Executar no SQL Editor do projeto bnlgogjdoqaqcjjunevu (SODPA-TJPA)

-- Deletar existentes
DELETE FROM auth.users WHERE email LIKE 'sgp%@tjpa.jus.br';
DELETE FROM public.profiles WHERE email LIKE 'sgp%@tjpa.jus.br';

-- Criar usuários SGP
DO $$
DECLARE
  user_id uuid;
  emails text[] := ARRAY['sgp01@tjpa.jus.br', 'sgp02@tjpa.jus.br', 'sgp03@tjpa.jus.br'];
  nomes text[] := ARRAY['Ana Neri', 'Carlos Eduardo Lima', 'Fernanda Souza'];
  cargos text[] := ARRAY['Coordenadora de Gestão de Pessoas', 'Analista de RH', 'Analista de RH'];
BEGIN
  FOR i IN 1..3 LOOP
    user_id := gen_random_uuid();
    
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at, is_sso_user, deleted_at
    ) VALUES (
      user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      emails[i], crypt('123456', gen_salt('bf')), NOW(),
      '', '', '', '',
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      ('{"role": "sgp", "nome": "' || nomes[i] || '"}')::jsonb,
      NOW(), NOW(), false, NULL
    );
    
    INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), user_id, emails[i], 'email',
      ('{"sub": "' || user_id || '", "email": "' || emails[i] || '"}')::jsonb, NOW(), NOW(), NOW());
    
    INSERT INTO public.profiles (id, email, nome, matricula, cargo, role, created_at, updated_at)
    VALUES (user_id, emails[i], nomes[i], '20260' || (400 + i), cargos[i], 'sgp', NOW(), NOW());
    
    RAISE NOTICE 'Criado: % - %', emails[i], nomes[i];
  END LOOP;
END $$;

-- Verificar usuários criados
SELECT u.email, p.nome, p.cargo, p.role 
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email LIKE 'sgp%@tjpa.jus.br'
ORDER BY u.email;
