-- ============================================
-- ATUALIZAÇÃO NOMES EQUIPE AJSEFIN
-- Execute este script no Supabase SQL Editor
-- ============================================

-- 1. Atualizar servidores_tj
UPDATE servidores_tj SET nome = 'Caroline Valeati da Rocha' WHERE email = 'ajsefin01@tjpa.jus.br';
UPDATE servidores_tj SET nome = 'João Carlos Pinage da Silva' WHERE email = 'ajsefin02@tjpa.jus.br';
UPDATE servidores_tj SET nome = 'Tiago Madson Aragão Domingos' WHERE email = 'ajsefin03@tjpa.jus.br';
UPDATE servidores_tj SET nome = 'Kenia Imbiriba Hesketh' WHERE email = 'ajsefin04@tjpa.jus.br';
UPDATE servidores_tj SET nome = 'Sarah Tavares Carvalho Oliveira' WHERE email = 'ajsefin05@tjpa.jus.br';

-- Novo membro (ajsefin06) - inserir apenas se não existir
INSERT INTO servidores_tj (matricula, nome, email, cargo, vinculo, ativo)
SELECT '100016', 'Ary Cesar Coelho Luz Silva', 'ajsefin06@tjpa.jus.br', 'Técnico Jurídico', 'EFETIVO', true
WHERE NOT EXISTS (SELECT 1 FROM servidores_tj WHERE email = 'ajsefin06@tjpa.jus.br');

-- 2. Atualizar profiles
UPDATE profiles SET nome = 'Caroline Valeati da Rocha' WHERE email = 'ajsefin01@tjpa.jus.br';
UPDATE profiles SET nome = 'João Carlos Pinage da Silva' WHERE email = 'ajsefin02@tjpa.jus.br';
UPDATE profiles SET nome = 'Tiago Madson Aragão Domingos' WHERE email = 'ajsefin03@tjpa.jus.br';
UPDATE profiles SET nome = 'Kenia Imbiriba Hesketh' WHERE email = 'ajsefin04@tjpa.jus.br';
UPDATE profiles SET nome = 'Sarah Tavares Carvalho Oliveira' WHERE email = 'ajsefin05@tjpa.jus.br';

-- Para ajsefin06: primeiro crie o usuário no Supabase Dashboard
-- Authentication > Users > Add User > Email: ajsefin06@tjpa.jus.br, Password: 123456
-- Depois execute:
-- UPDATE profiles SET role = 'ajsefin', nome = 'Ary Cesar Coelho Luz Silva' WHERE email = 'ajsefin06@tjpa.jus.br';

-- 3. Verificar atualizações
SELECT id, email, nome, cargo FROM servidores_tj WHERE email LIKE 'ajsefin%';
SELECT id, email, nome, role FROM profiles WHERE email LIKE 'ajsefin%';
