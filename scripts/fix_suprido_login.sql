-- Arquivo: scripts/fix_suprido_login.sql
-- Descrição: Insere registros em auth.identities para garantir login por senha
-- Necessário em algumas versões do Supabase/GoTrue para novos usuários criados manualmente

BEGIN;

DO $$
DECLARE
  r RECORD;
BEGIN
  RAISE NOTICE '--- CORRIGINDO IDENTIDADES SUPRIDO ---';

  FOR r IN 
    SELECT id, email 
    FROM auth.users 
    WHERE email IN (
      'servidor01@tjpa.jus.br', 'servidor02@tjpa.jus.br', 
      'servidor03@tjpa.jus.br', 'servidor04@tjpa.jus.br', 
      'servidor05@tjpa.jus.br'
    )
  LOOP
    -- Tenta inserir identidade se não existir (usando NOT EXISTS para evitar erro de constraint)
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) 
    SELECT 
      r.id,
      r.id,
      jsonb_build_object('sub', r.id, 'email', r.email),
      'email',
      r.id::text, -- provider_id geralmente é o ID do usuário (sub) para email
      now(),
      now(),
      now()
    WHERE NOT EXISTS (
        SELECT 1 FROM auth.identities WHERE user_id = r.id AND provider = 'email'
    );
    
    -- Força confirmação de email
    UPDATE auth.users 
    SET email_confirmed_at = now(), confirmation_token = '' 
    WHERE id = r.id;

    RAISE NOTICE '✅ Identidade verificada para %', r.email;
  END LOOP;

END $$;

COMMIT;
