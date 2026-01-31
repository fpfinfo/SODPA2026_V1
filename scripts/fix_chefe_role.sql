-- ============================================
-- CORREÇÃO: Role do usuário chefe@tjpa.jus.br
-- Data: 2026-01-29
-- ============================================
-- O usuário chefe@tjpa.jus.br é o Gestor da Comarca de Mãe do Rio,
-- não "Chefe da SOSFU". Ele atesta as solicitações do suprido Ademário.

-- 1. Corrigir role na tabela profiles
UPDATE profiles 
SET role = 'GESTOR', 
    updated_at = NOW()
WHERE email = 'chefe@tjpa.jus.br';

-- 2. Corrigir cargo na tabela servidores_tj
UPDATE servidores_tj 
SET cargo = 'Gestor da Comarca de Mãe do Rio',
    updated_at = NOW()
WHERE email = 'chefe@tjpa.jus.br';

-- 3. Verificar a correção
SELECT 
  p.email, 
  p.role as profile_role, 
  p.nome, 
  s.cargo as servidor_cargo
FROM profiles p
LEFT JOIN servidores_tj s ON LOWER(p.email) = LOWER(s.email)
WHERE p.email = 'chefe@tjpa.jus.br';

-- Resultado esperado:
-- | email             | profile_role | nome                        | servidor_cargo                  |
-- |-------------------|--------------|-----------------------------|---------------------------------|
-- | chefe@tjpa.jus.br | GESTOR       | Maria Helena Costa Ferreira | Gestor da Comarca de Mãe do Rio |
