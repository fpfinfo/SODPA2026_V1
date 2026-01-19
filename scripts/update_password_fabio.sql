-- Script para alterar senha do usuário fabio.freitas@tjpa.jus.br
-- Execute este SQL no SQL Editor do Supabase Dashboard
-- Nova senha: 123456

-- Atualizar senha usando a função crypt do pgcrypto
UPDATE auth.users
SET 
  encrypted_password = crypt('123456', gen_salt('bf')),
  updated_at = now()
WHERE email = 'fabio.freitas@tjpa.jus.br';

-- Verificar se a atualização foi bem-sucedida
SELECT 
  id,
  email,
  created_at,
  updated_at,
  last_sign_in_at
FROM auth.users
WHERE email = 'fabio.freitas@tjpa.jus.br';
