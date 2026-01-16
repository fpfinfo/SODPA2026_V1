-- ============================================================================
-- SEED LIGHTWEIGHT - Versão Reduzida para Desenvolvimento Ágil
-- ============================================================================
-- Usa apenas 10 comarcas representativas ao invés das 144 completas
-- Reduz tempo de seed de ~5min para ~30seg
-- Mantém integridade referencial completa
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. LIMPAR DADOS EXISTENTES (ordem para respeitar FKs)
-- ============================================================================
DELETE FROM prestacoes_contas;
DELETE FROM solicitacoes;
DELETE FROM profiles;
DELETE FROM lotacoes;
DELETE FROM comarcas;
DELETE FROM unidades;

-- ============================================================================
-- 2. COMARCAS - 10 representativas (cobertura geográfica)
-- ============================================================================
INSERT INTO comarcas (nome, regiao, ativo) VALUES
('Capital - Belém', 'Metropolitana', true),
('Marabá', 'Sul', true),
('Santarém', 'Oeste', true),
('Castanhal', 'Nordeste', true),
('Altamira', 'Sudoeste', true),
('Redenção', 'Sul', true),
('Paragominas', 'Sudeste', true),
('Abaetetuba', 'Nordeste', true),
('Breves', 'Marajó', true),
('Tucuruí', 'Sul', true);

-- ============================================================================
-- 3. UNIDADES - 20 unidades selecionadas (mix de graus e tipos)
-- ============================================================================
INSERT INTO unidades (nome, comarca_id, grau, tipo, ativo) 
SELECT 
  u.nome,
  c.id,
  u.grau,
  u.tipo,
  true
FROM comarcas c
CROSS JOIN LATERAL (
  VALUES
    (c.nome || ' - 1ª Vara Cível', '1º Grau', 'Vara'),
    (c.nome || ' - 2ª Vara Cível', '1º Grau', 'Vara'),
    (c.nome || ' - Vara Criminal', '1º Grau', 'Vara'),
    (c.nome || ' - Vara de Família', '1º Grau', 'Vara'),
    (c.nome || ' - Juizado Especial', '1º Grau', 'Juizado')
) AS u(nome, grau, tipo);

-- ============================================================================
-- 4. LOTAÇÕES - 50 lotações representativas
-- ============================================================================
INSERT INTO lotacoes (nome, unidade_id, ativo)
SELECT 
  l.nome,
  u.id,
  true
FROM unidades u
CROSS JOIN LATERAL (
  VALUES
    ('Gabinete do Juiz'),
    ('Secretaria Administrativa'),
    ('Cartório Judicial'),
    ('Diretoria de Secretaria'),
    ('Seção de Protocolo')
) AS l(nome)
WHERE u.tipo = 'Vara'
LIMIT 50;

-- ============================================================================
-- 5. PROFILES - 30 usuários representativos (6 por perfil)
-- ============================================================================

-- 5.1 Usuários SUPRIDO (6)
INSERT INTO profiles (
  id, email, nome, cpf, celular, role, 
  comarca_id, unidade_id, lotacao_id, 
  gestor_id, ativo
)
SELECT 
  gen_random_uuid(),
  'suprido' || row_number() OVER () || '@dev.local',
  'Suprido ' || row_number() OVER (),
  lpad((1000000000 + (row_number() OVER ())::int)::text, 11, '0'),
  '(91) 98000-' || lpad((row_number() OVER ())::text, 4, '0'),
  'SUPRIDO',
  c.id,
  u.id,
  l.id,
  NULL, -- gestor será atribuído depois
  true
FROM comarcas c
JOIN unidades u ON u.comarca_id = c.id
JOIN lotacoes l ON l.unidade_id = u.id
LIMIT 6;

-- 5.2 Usuários GESTOR (6)
INSERT INTO profiles (
  id, email, nome, cpf, celular, role, 
  comarca_id, unidade_id, lotacao_id, 
  gestor_id, ativo
)
SELECT 
  gen_random_uuid(),
  'gestor' || row_number() OVER () || '@dev.local',
  'Gestor ' || row_number() OVER (),
  lpad((2000000000 + (row_number() OVER ())::int)::text, 11, '0'),
  '(91) 98100-' || lpad((row_number() OVER ())::text, 4, '0'),
  'GESTOR',
  c.id,
  u.id,
  l.id,
  NULL,
  true
FROM comarcas c
JOIN unidades u ON u.comarca_id = c.id
JOIN lotacoes l ON l.unidade_id = u.id
LIMIT 6;

-- 5.3 Relacionar SUPRIDOS com GESTORES
WITH supridos AS (
  SELECT id, row_number() OVER (ORDER BY id) as rn
  FROM profiles WHERE role = 'SUPRIDO'
),
gestores AS (
  SELECT id, row_number() OVER (ORDER BY id) as rn
  FROM profiles WHERE role = 'GESTOR'
)
UPDATE profiles p
SET gestor_id = g.id
FROM supridos s
JOIN gestores g ON s.rn = g.rn
WHERE p.id = s.id;

-- 5.4 Equipe SOSFU (6)
INSERT INTO profiles (
  id, email, nome, cpf, celular, role, 
  comarca_id, unidade_id, lotacao_id, ativo
)
SELECT 
  gen_random_uuid(),
  'sosfu' || row_number() OVER () || '@dev.local',
  'Analista SOSFU ' || row_number() OVER (),
  lpad((3000000000 + (row_number() OVER ())::int)::text, 11, '0'),
  '(91) 98200-' || lpad((row_number() OVER ())::text, 4, '0'),
  'SOSFU',
  (SELECT id FROM comarcas WHERE nome = 'Capital - Belém'),
  (SELECT id FROM unidades WHERE nome LIKE '%Capital - Belém - 1ª Vara%' LIMIT 1),
  (SELECT id FROM lotacoes WHERE nome = 'Gabinete do Juiz' LIMIT 1),
  true
FROM generate_series(1, 6);

-- 5.5 Equipe AJSEFIN (4)
INSERT INTO profiles (
  id, email, nome, cpf, celular, role, 
  comarca_id, unidade_id, lotacao_id, ativo
)
SELECT 
  gen_random_uuid(),
  'ajsefin' || row_number() OVER () || '@dev.local',
  'Assessor AJSEFIN ' || row_number() OVER (),
  lpad((4000000000 + (row_number() OVER ())::int)::text, 11, '0'),
  '(91) 98300-' || lpad((row_number() OVER ())::text, 4, '0'),
  'AJSEFIN',
  (SELECT id FROM comarcas WHERE nome = 'Capital - Belém'),
  (SELECT id FROM unidades WHERE nome LIKE '%Capital - Belém - 1ª Vara%' LIMIT 1),
  (SELECT id FROM lotacoes WHERE nome = 'Gabinete do Juiz' LIMIT 1),
  true
FROM generate_series(1, 4);

-- 5.6 Equipe SEFIN (4)
INSERT INTO profiles (
  id, email, nome, cpf, celular, role, 
  comarca_id, unidade_id, lotacao_id, ativo
)
SELECT 
  gen_random_uuid(),
  'sefin' || row_number() OVER () || '@dev.local',
  'Analista SEFIN ' || row_number() OVER (),
  lpad((5000000000 + (row_number() OVER ())::int)::text, 11, '0'),
  '(91) 98400-' || lpad((row_number() OVER ())::text, 4, '0'),
  'SEFIN',
  (SELECT id FROM comarcas WHERE nome = 'Capital - Belém'),
  (SELECT id FROM unidades WHERE nome LIKE '%Capital - Belém - 1ª Vara%' LIMIT 1),
  (SELECT id FROM lotacoes WHERE nome = 'Gabinete do Juiz' LIMIT 1),
  true
FROM generate_series(1, 4);

-- 5.7 Equipe SGP (2)
INSERT INTO profiles (
  id, email, nome, cpf, celular, role, 
  comarca_id, unidade_id, lotacao_id, ativo
)
SELECT 
  gen_random_uuid(),
  'sgp' || row_number() OVER () || '@dev.local',
  'Gestor SGP ' || row_number() OVER (),
  lpad((6000000000 + (row_number() OVER ())::int)::text, 11, '0'),
  '(91) 98500-' || lpad((row_number() OVER ())::text, 4, '0'),
  'SGP',
  (SELECT id FROM comarcas WHERE nome = 'Capital - Belém'),
  (SELECT id FROM unidades WHERE nome LIKE '%Capital - Belém - 1ª Vara%' LIMIT 1),
  (SELECT id FROM lotacoes WHERE nome = 'Gabinete do Juiz' LIMIT 1),
  true
FROM generate_series(1, 2);

-- 5.8 Admin (2)
INSERT INTO profiles (
  id, email, nome, cpf, celular, role, 
  comarca_id, unidade_id, lotacao_id, ativo
)
SELECT 
  gen_random_uuid(),
  'admin' || row_number() OVER () || '@dev.local',
  'Administrador ' || row_number() OVER (),
  lpad((9000000000 + (row_number() OVER ())::int)::text, 11, '0'),
  '(91) 98900-' || lpad((row_number() OVER ())::text, 4, '0'),
  'ADMIN',
  (SELECT id FROM comarcas WHERE nome = 'Capital - Belém'),
  (SELECT id FROM unidades WHERE nome LIKE '%Capital - Belém - 1ª Vara%' LIMIT 1),
  (SELECT id FROM lotacoes WHERE nome = 'Gabinete do Juiz' LIMIT 1),
  true
FROM generate_series(1, 2);

-- ============================================================================
-- 6. SOLICITAÇÕES DE TESTE - 20 processos em diversos status
-- ============================================================================
WITH supridos AS (
  SELECT id, row_number() OVER (ORDER BY id) as rn
  FROM profiles WHERE role = 'SUPRIDO'
),
gestores AS (
  SELECT id, row_number() OVER (ORDER BY id) as rn
  FROM profiles WHERE role = 'GESTOR'
)
INSERT INTO solicitacoes (
  numero_pc,
  suprido_id,
  gestor_id,
  tipo,
  status,
  valor_solicitado,
  justificativa,
  data_solicitacao,
  ativo
)
SELECT 
  (2026000 + row_number() OVER ())::text || '/' || EXTRACT(YEAR FROM CURRENT_DATE)::text,
  s.id,
  g.id,
  CASE 
    WHEN row_number() OVER () % 4 = 0 THEN 'JURI'
    WHEN row_number() OVER () % 4 = 1 THEN 'EXTRA'
    WHEN row_number() OVER () % 4 = 2 THEN 'EMERGENCIAL'
    ELSE 'ORDINARIO'
  END,
  CASE 
    WHEN row_number() OVER () % 10 = 0 THEN 'CONCLUIDO'
    WHEN row_number() OVER () % 10 = 1 THEN 'EM_ELABORACAO'
    WHEN row_number() OVER () % 10 = 2 THEN 'AGUARDANDO_AUTORIZACAO'
    WHEN row_number() OVER () % 10 = 3 THEN 'AGUARDANDO_AJSEFIN'
    WHEN row_number() OVER () % 10 = 4 THEN 'AGUARDANDO_SOSFU'
    WHEN row_number() OVER () % 10 = 5 THEN 'AGUARDANDO_SEFIN'
    WHEN row_number() OVER () % 10 = 6 THEN 'DEFERIDO'
    WHEN row_number() OVER () % 10 = 7 THEN 'EM_EXECUCAO'
    WHEN row_number() OVER () % 10 = 8 THEN 'AGUARDANDO_PC'
    ELSE 'PC_EM_ANALISE'
  END,
  (5000 + (row_number() OVER () * 500))::decimal,
  'Justificativa de teste para PC ' || row_number() OVER (),
  CURRENT_DATE - (row_number() OVER () || ' days')::interval,
  true
FROM supridos s
JOIN gestores g ON s.rn = g.rn
LIMIT 20;

-- ============================================================================
-- 7. RELATÓRIO FINAL
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'SEED LIGHTWEIGHT COMPLETO';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Comarcas: %', (SELECT count(*) FROM comarcas WHERE ativo = true);
  RAISE NOTICE 'Unidades: %', (SELECT count(*) FROM unidades WHERE ativo = true);
  RAISE NOTICE 'Lotações: %', (SELECT count(*) FROM lotacoes WHERE ativo = true);
  RAISE NOTICE 'Profiles: %', (SELECT count(*) FROM profiles WHERE ativo = true);
  RAISE NOTICE '  - SUPRIDO: %', (SELECT count(*) FROM profiles WHERE role = 'SUPRIDO');
  RAISE NOTICE '  - GESTOR: %', (SELECT count(*) FROM profiles WHERE role = 'GESTOR');
  RAISE NOTICE '  - SOSFU: %', (SELECT count(*) FROM profiles WHERE role = 'SOSFU');
  RAISE NOTICE '  - AJSEFIN: %', (SELECT count(*) FROM profiles WHERE role = 'AJSEFIN');
  RAISE NOTICE '  - SEFIN: %', (SELECT count(*) FROM profiles WHERE role = 'SEFIN');
  RAISE NOTICE '  - SGP: %', (SELECT count(*) FROM profiles WHERE role = 'SGP');
  RAISE NOTICE '  - ADMIN: %', (SELECT count(*) FROM profiles WHERE role = 'ADMIN');
  RAISE NOTICE 'Solicitações: %', (SELECT count(*) FROM solicitacoes WHERE ativo = true);
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Tempo estimado: ~30 segundos';
  RAISE NOTICE 'vs seed_test_users.sql: ~5 minutos';
  RAISE NOTICE '============================================';
END $$;

COMMIT;
