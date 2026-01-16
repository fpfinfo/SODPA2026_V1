-- ============================================
-- SEED DE USUÁRIOS DE TESTE - SISUP/SCS TJPA
-- Execute este script no Supabase SQL Editor
-- ============================================
-- IMPORTANTE: Para criar usuários no auth.users com senha, 
-- você precisa usar o Supabase Dashboard > Authentication > Users > Add User
-- ou usar a API de autenticação. Este script cria os registros nas tabelas de dados.

-- ============================================
-- 1. INSERIR EM SERVIDORES_TJ
-- ============================================

INSERT INTO servidores_tj (matricula, nome, email, cargo, vinculo, ativo) VALUES
-- Suprido (Servidor básico)
('100001', 'Ademário Silva de Jesus', 'suprido@tjpa.jus.br', 'Técnico Judiciário', 'EFETIVO', true),

-- Chefe SOSFU
('100002', 'Maria Helena Costa Ferreira', 'chefe@tjpa.jus.br', 'Chefe da SOSFU', 'EFETIVO', true),

-- Ordenadores de Despesa
('100003', 'Carlos Alberto Mendes Lima', 'ordenador01@tjpa.jus.br', 'Ordenador de Despesas', 'COMISSIONADO', true),
('100004', 'Fernanda Cristina Souza', 'ordenador02@tjpa.jus.br', 'Ordenador de Despesas', 'COMISSIONADO', true),

-- SGP - Secretaria de Gestão de Pessoas
('100005', 'Roberto Carlos Oliveira', 'sgp01@tjpa.jus.br', 'Analista SGP', 'EFETIVO', true),
('100006', 'Patrícia Andrade Santos', 'sgp02@tjpa.jus.br', 'Analista SGP', 'EFETIVO', true),
('100007', 'Lucas Fernando Martins', 'sgp03@tjpa.jus.br', 'Técnico SGP', 'EFETIVO', true),
('100008', 'Camila Rodrigues Alves', 'sgp04@tjpa.jus.br', 'Técnico SGP', 'EFETIVO', true),
('100009', 'Thiago Henrique Nascimento', 'sgp05@tjpa.jus.br', 'Estagiário SGP', 'ESTAGIARIO', true),

-- AJSEFIN - Assessoria Jurídica da Secretaria de Finanças
('100010', 'Amanda Beatriz Cavalcante', 'ajsefin01@tjpa.jus.br', 'Assessor Jurídico', 'COMISSIONADO', true),
('100011', 'Pedro Augusto Ribeiro', 'ajsefin02@tjpa.jus.br', 'Assessor Jurídico', 'COMISSIONADO', true),
('100012', 'Juliana Fernandes Lopes', 'ajsefin03@tjpa.jus.br', 'Analista Jurídico', 'EFETIVO', true),
('100013', 'Rafael Costa Barbosa', 'ajsefin04@tjpa.jus.br', 'Analista Jurídico', 'EFETIVO', true),
('100014', 'Mariana Silva Gomes', 'ajsefin05@tjpa.jus.br', 'Técnico Jurídico', 'EFETIVO', true)

ON CONFLICT (email) DO UPDATE SET
  nome = EXCLUDED.nome,
  cargo = EXCLUDED.cargo,
  vinculo = EXCLUDED.vinculo,
  ativo = EXCLUDED.ativo,
  updated_at = NOW();

-- ============================================
-- 2. VERIFICAR INSERÇÕES EM SERVIDORES_TJ
-- ============================================
SELECT id, matricula, nome, email, cargo FROM servidores_tj 
WHERE email IN (
  'suprido@tjpa.jus.br', 'chefe@tjpa.jus.br',
  'ordenador01@tjpa.jus.br', 'ordenador02@tjpa.jus.br',
  'sgp01@tjpa.jus.br', 'sgp02@tjpa.jus.br', 'sgp03@tjpa.jus.br', 'sgp04@tjpa.jus.br', 'sgp05@tjpa.jus.br',
  'ajsefin01@tjpa.jus.br', 'ajsefin02@tjpa.jus.br', 'ajsefin03@tjpa.jus.br', 'ajsefin04@tjpa.jus.br', 'ajsefin05@tjpa.jus.br'
);

-- ============================================
-- 3. INSERIR/ATUALIZAR EM PROFILES
-- (Requer que os usuários existam em auth.users primeiro)
-- ============================================
-- NOTA: Você precisa criar os usuários no Supabase Dashboard primeiro:
-- Authentication > Users > Add User
-- Email: [email do usuário]
-- Password: 123456
-- Auto Confirm User: ON

-- Após criar os usuários no Dashboard, execute o script abaixo
-- para atualizar os profiles com os roles corretos:

-- Atualizar roles de usuários existentes
UPDATE profiles SET role = 'suprido', nome = 'Ademário Silva de Jesus' WHERE email = 'suprido@tjpa.jus.br';
UPDATE profiles SET role = 'chefe_sosfu', nome = 'Maria Helena Costa Ferreira' WHERE email = 'chefe@tjpa.jus.br';
UPDATE profiles SET role = 'ordenador', nome = 'Carlos Alberto Mendes Lima' WHERE email = 'ordenador01@tjpa.jus.br';
UPDATE profiles SET role = 'ordenador', nome = 'Fernanda Cristina Souza' WHERE email = 'ordenador02@tjpa.jus.br';
UPDATE profiles SET role = 'sgp', nome = 'Roberto Carlos Oliveira' WHERE email = 'sgp01@tjpa.jus.br';
UPDATE profiles SET role = 'sgp', nome = 'Patrícia Andrade Santos' WHERE email = 'sgp02@tjpa.jus.br';
UPDATE profiles SET role = 'sgp', nome = 'Lucas Fernando Martins' WHERE email = 'sgp03@tjpa.jus.br';
UPDATE profiles SET role = 'sgp', nome = 'Camila Rodrigues Alves' WHERE email = 'sgp04@tjpa.jus.br';
UPDATE profiles SET role = 'sgp', nome = 'Thiago Henrique Nascimento' WHERE email = 'sgp05@tjpa.jus.br';
UPDATE profiles SET role = 'ajsefin', nome = 'Amanda Beatriz Cavalcante' WHERE email = 'ajsefin01@tjpa.jus.br';
UPDATE profiles SET role = 'ajsefin', nome = 'Pedro Augusto Ribeiro' WHERE email = 'ajsefin02@tjpa.jus.br';
UPDATE profiles SET role = 'ajsefin', nome = 'Juliana Fernandes Lopes' WHERE email = 'ajsefin03@tjpa.jus.br';
UPDATE profiles SET role = 'ajsefin', nome = 'Rafael Costa Barbosa' WHERE email = 'ajsefin04@tjpa.jus.br';
UPDATE profiles SET role = 'ajsefin', nome = 'Mariana Silva Gomes' WHERE email = 'ajsefin05@tjpa.jus.br';

-- ============================================
-- 4. VERIFICAR PROFILES ATUALIZADOS
-- ============================================
SELECT id, email, nome, role FROM profiles 
WHERE email IN (
  'suprido@tjpa.jus.br', 'chefe@tjpa.jus.br',
  'ordenador01@tjpa.jus.br', 'ordenador02@tjpa.jus.br',
  'sgp01@tjpa.jus.br', 'sgp02@tjpa.jus.br', 'sgp03@tjpa.jus.br', 'sgp04@tjpa.jus.br', 'sgp05@tjpa.jus.br',
  'ajsefin01@tjpa.jus.br', 'ajsefin02@tjpa.jus.br', 'ajsefin03@tjpa.jus.br', 'ajsefin04@tjpa.jus.br', 'ajsefin05@tjpa.jus.br'
);

-- ============================================
-- RESUMO DOS USUÁRIOS DE TESTE
-- ============================================
-- | Email                    | Nome                          | Role        | Senha   |
-- |--------------------------|-------------------------------|-------------|---------|
-- | suprido@tjpa.jus.br      | Ademário Silva de Jesus       | suprido     | 123456  |
-- | chefe@tjpa.jus.br        | Maria Helena Costa Ferreira   | chefe_sosfu | 123456  |
-- | ordenador01@tjpa.jus.br  | Carlos Alberto Mendes Lima    | ordenador   | 123456  |
-- | ordenador02@tjpa.jus.br  | Fernanda Cristina Souza       | ordenador   | 123456  |
-- | sgp01@tjpa.jus.br        | Roberto Carlos Oliveira       | sgp         | 123456  |
-- | sgp02@tjpa.jus.br        | Patrícia Andrade Santos       | sgp         | 123456  |
-- | sgp03@tjpa.jus.br        | Lucas Fernando Martins        | sgp         | 123456  |
-- | sgp04@tjpa.jus.br        | Camila Rodrigues Alves        | sgp         | 123456  |
-- | sgp05@tjpa.jus.br        | Thiago Henrique Nascimento    | sgp         | 123456  |
-- | ajsefin01@tjpa.jus.br    | Amanda Beatriz Cavalcante     | ajsefin     | 123456  |
-- | ajsefin02@tjpa.jus.br    | Pedro Augusto Ribeiro         | ajsefin     | 123456  |
-- | ajsefin03@tjpa.jus.br    | Juliana Fernandes Lopes       | ajsefin     | 123456  |
-- | ajsefin04@tjpa.jus.br    | Rafael Costa Barbosa          | ajsefin     | 123456  |
-- | ajsefin05@tjpa.jus.br    | Mariana Silva Gomes           | ajsefin     | 123456  |
