-- Arquivo: scripts/create_ajsefin_users.sql
-- Descrição: Cria usuários AJSEFIN no Supabase
-- Executar no SQL Editor do projeto bnlgogjdoqaqcjjunevu (SODPA-TJPA)

-- Deletar usuários existentes (se houver)
DELETE FROM auth.users WHERE email LIKE 'ajsefin%@tjpa.jus.br';
DELETE FROM public.profiles WHERE email LIKE 'ajsefin%@tjpa.jus.br';

-- Criar usuários AJSEFIN (assessores jurídicos)
DO $$
DECLARE
  user_id uuid;
  i integer;
  nomes text[] := ARRAY['Carlos Drummond', 'Cecília Meireles', 'Mario Quintana', 'Cora Coralina'];
  cargos text[] := ARRAY['Assessor Jurídico I', 'Assessor Jurídico II', 'Assessor Jurídico III', 'Assessor Jurídico IV'];
BEGIN
  FOR i IN 1..4 LOOP
    -- Gerar UUID para o usuário
    user_id := gen_random_uuid();
    
    -- Inserir na tabela auth.users
    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      is_sso_user,
      deleted_at
    ) VALUES (
      user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'ajsefin0' || i || '@tjpa.jus.br',
      crypt('123456', gen_salt('bf')),
      NOW(),
      '',
      '',
      '',
      '',
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      ('{"role": "ajsefin", "nome": "' || nomes[i] || '"}')::jsonb,
      NOW(),
      NOW(),
      false,
      NULL
    );
    
    -- Inserir na tabela auth.identities
    INSERT INTO auth.identities (
      id,
      user_id,
      provider_id,
      provider,
      identity_data,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      user_id,
      'ajsefin0' || i || '@tjpa.jus.br',
      'email',
      ('{"sub": "' || user_id || '", "email": "ajsefin0' || i || '@tjpa.jus.br"}')::jsonb,
      NOW(),
      NOW(),
      NOW()
    );
    
    -- Inserir na tabela profiles
    INSERT INTO public.profiles (
      id,
      email,
      nome,
      matricula,
      cargo,
      role,
      created_at,
      updated_at
    ) VALUES (
      user_id,
      'ajsefin0' || i || '@tjpa.jus.br',
      nomes[i],
      '20260' || (100 + i),
      cargos[i],
      'ajsefin',
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'Criado usuário: ajsefin0%@tjpa.jus.br (%) - %', i, nomes[i], cargos[i];
  END LOOP;
END $$;

-- Verificar usuários criados
SELECT 
  u.email,
  p.nome,
  p.cargo,
  p.role,
  p.matricula
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email LIKE 'ajsefin%@tjpa.jus.br'
ORDER BY u.email;
