-- ================================================================
-- Script para Configurar Membros da Equipe SOSFU
-- Data: 30/01/2026
-- ================================================================

-- ================================================================
-- INSTRUÇÕES INICIAIS (Supabase Dashboard)
-- ================================================================
-- 1. Acesse o Supabase Dashboard > Authentication > Users
-- 2. Clique em "Add User" > "Create New User"
-- 3. Crie os seguintes usuários (um por um):
-- 
--    Email:                | Senha:
--    ----------------------|-------
--    sosfu01@tjpa.jus.br   | 123456
--    sosfu02@tjpa.jus.br   | 123456
--    sosfu03@tjpa.jus.br   | 123456
--    sosfu04@tjpa.jus.br   | 123456
--
--    (Marque a opção "Auto Confirm User" se disponível, ou confirme manualmente)
--
-- 4. APÓS criar os usuários acima, execute o script SQL abaixo para
--    configurar os Nomes e Perfis corretos.
-- ================================================================

-- Atualizar Regeane Kelly Holanda do Carmo (sosfu01)
UPDATE public.profiles 
SET 
  role = 'SOSFU', 
  nome = 'Regeane Kelly Holanda do Carmo', 
  updated_at = NOW() 
WHERE email = 'sosfu01@tjpa.jus.br';

-- Atualizar André Evaristo Bezerra Lourenço (sosfu02)
UPDATE public.profiles 
SET 
  role = 'SOSFU', 
  nome = 'André Evaristo Bezerra Lourenço', 
  updated_at = NOW() 
WHERE email = 'sosfu02@tjpa.jus.br';

-- Atualizar Jaires Costa Sarraf (sosfu03)
UPDATE public.profiles 
SET 
  role = 'SOSFU', 
  nome = 'Jaires Costa Sarraf', 
  updated_at = NOW() 
WHERE email = 'sosfu03@tjpa.jus.br';

-- Atualizar Roziani Rodrigues Costa Lopes (sosfu04)
UPDATE public.profiles 
SET 
  role = 'SOSFU', 
  nome = 'Roziani Rodrigues Costa Lopes', 
  updated_at = NOW() 
WHERE email = 'sosfu04@tjpa.jus.br';

-- ================================================================
-- VERIFICAÇÃO FINAL
-- ================================================================
SELECT 
  email, 
  nome, 
  role, 
  created_at 
FROM public.profiles 
WHERE email IN (
  'sosfu01@tjpa.jus.br', 
  'sosfu02@tjpa.jus.br', 
  'sosfu03@tjpa.jus.br', 
  'sosfu04@tjpa.jus.br'
);
