-- ================================================================
-- Script para criar 4 usuários de teste para SOSFU
-- Execute este script no SQL Editor do Supabase
-- ================================================================
-- 
-- INSTRUÇÕES:
-- 1. Vá para Supabase Dashboard > Authentication > Users
-- 2. Clique em "Add User" > "Create New User"
-- 3. Para cada usuário, preencha:
--    - Email: sosfu01@tjpa.jus.br (até sosfu04)
--    - Password: 123456
--    - Email Confirm: marcado (checkbox)
-- 4. Após criar os 4 usuários, execute o SQL abaixo
--
-- ================================================================

-- ================================================================
-- PASSO 1: Atualizar profiles para role SOSFU
-- Execute DEPOIS de criar os usuários no Dashboard
-- ================================================================

UPDATE public.profiles 
SET role = 'SOSFU', nome = 'Analista SOSFU 01', updated_at = NOW() 
WHERE email = 'sosfu01@tjpa.jus.br';

UPDATE public.profiles 
SET role = 'SOSFU', nome = 'Analista SOSFU 02', updated_at = NOW() 
WHERE email = 'sosfu02@tjpa.jus.br';

UPDATE public.profiles 
SET role = 'SOSFU', nome = 'Analista SOSFU 03', updated_at = NOW() 
WHERE email = 'sosfu03@tjpa.jus.br';

UPDATE public.profiles 
SET role = 'SOSFU', nome = 'Analista SOSFU 04', updated_at = NOW() 
WHERE email = 'sosfu04@tjpa.jus.br';

-- ================================================================
-- PASSO 2: Verificar resultado
-- ================================================================

SELECT 
  p.id,
  p.email,
  p.nome,
  p.role,
  au.email as auth_email,
  p.created_at
FROM public.profiles p
LEFT JOIN auth.users au ON au.id = p.id
WHERE p.email LIKE 'sosfu%@tjpa.jus.br'
ORDER BY p.email;

-- ================================================================
-- ALTERNATIVA: Atualizar todos de uma vez (padrão de email)
-- ================================================================
/*
UPDATE public.profiles 
SET 
  role = 'SOSFU',
  updated_at = NOW()
WHERE email LIKE 'sosfu%@tjpa.jus.br';
*/

-- ================================================================
-- RESUMO DOS USUÁRIOS:
-- ================================================================
-- | Email                  | Nome               | Role  | Senha  |
-- |------------------------|--------------------|-------|--------|
-- | sosfu01@tjpa.jus.br    | Analista SOSFU 01  | SOSFU | 123456 |
-- | sosfu02@tjpa.jus.br    | Analista SOSFU 02  | SOSFU | 123456 |
-- | sosfu03@tjpa.jus.br    | Analista SOSFU 03  | SOSFU | 123456 |
-- | sosfu04@tjpa.jus.br    | Analista SOSFU 04  | SOSFU | 123456 |
-- ================================================================
