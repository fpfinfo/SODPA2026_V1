-- ================================================================
-- Script para criar 5 usuários de teste para AJSEFIN
-- Execute este script no SQL Editor do Supabase
-- ================================================================
-- ABORDAGEM: Como o trigger handle_new_user cria profiles automaticamente,
-- vamos deixar ele criar e depois atualizar o role para AJSEFIN

-- Primeiro, vamos verificar quais usuários AJSEFIN já existem
-- e atualizar seus profiles para role AJSEFIN

-- Atualizar profiles existentes para AJSEFIN
UPDATE public.profiles 
SET role = 'AJSEFIN', 
    nome = 'Assessor Jurídico AJSEFIN 01',
    updated_at = NOW()
WHERE email = 'ajsefin01@tjpa.jus.br';

-- Para os demais, se não existirem, use o Dashboard do Supabase:
-- Authentication > Users > Invite User
-- Email: ajsefin02@tjpa.jus.br (etc)
-- Depois execute o UPDATE abaixo

-- ================================================================
-- ALTERNATIVA: Se preferir criar via SQL, use a função do Supabase:
-- ================================================================

-- Criar usuários usando a extensão supabase_auth_admin (se disponível)
-- Isso depende da versão do Supabase

-- ================================================================
-- SCRIPT SEGURO: Apenas atualiza profiles existentes para AJSEFIN
-- ================================================================

-- Atualizar todos os profiles com email ajsefin* para role AJSEFIN
UPDATE public.profiles 
SET 
  role = 'AJSEFIN',
  updated_at = NOW()
WHERE email LIKE 'ajsefin%@tjpa.jus.br';

-- Verificar resultado
SELECT 
  p.id,
  p.email,
  p.nome,
  p.role,
  au.email as auth_email,
  p.created_at
FROM public.profiles p
LEFT JOIN auth.users au ON au.id = p.id
WHERE p.email LIKE 'ajsefin%@tjpa.jus.br'
ORDER BY p.email;

-- ================================================================
-- INSTRUÇÕES MANUAIS:
-- ================================================================
-- 1. Vá para Supabase Dashboard > Authentication > Users
-- 2. Clique em "Add User" > "Create New User"
-- 3. Preencha:
--    - Email: ajsefin01@tjpa.jus.br
--    - Password: 123456
--    - Email Confirm: marcado
-- 4. Repita para ajsefin02 até ajsefin05
-- 5. Execute este script para atualizar os roles

-- ================================================================
-- Depois de criar os usuários no Dashboard, execute:
-- ================================================================
/*
UPDATE public.profiles SET role = 'AJSEFIN', nome = 'Assessor Jurídico AJSEFIN 01' WHERE email = 'ajsefin01@tjpa.jus.br';
UPDATE public.profiles SET role = 'AJSEFIN', nome = 'Assessor Jurídico AJSEFIN 02' WHERE email = 'ajsefin02@tjpa.jus.br';
UPDATE public.profiles SET role = 'AJSEFIN', nome = 'Assessor Jurídico AJSEFIN 03' WHERE email = 'ajsefin03@tjpa.jus.br';
UPDATE public.profiles SET role = 'AJSEFIN', nome = 'Assessor Jurídico AJSEFIN 04' WHERE email = 'ajsefin04@tjpa.jus.br';
UPDATE public.profiles SET role = 'AJSEFIN', nome = 'Assessor Jurídico AJSEFIN 05' WHERE email = 'ajsefin05@tjpa.jus.br';
*/
