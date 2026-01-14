-- Seed Data for Testing (Updated)
-- Run this in Supabase SQL Editor

-- 1. Create a dummy user in auth.users to satisfy Foreign Key
-- Note: This requires admin privileges (which the SQL Editor usually has).
-- We use a fixed UUID for testing.

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000', -- instance_id (legacy, usually ignored or set to same)
  '00000000-0000-0000-0000-000000000000', -- id
  'authenticated',
  'authenticated',
  'teste@tjpa.jus.br',
  crypt('password123', gen_salt('bf')), -- password: password123
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- 2. Create the profile linked to this user
INSERT INTO public.profiles (id, email, nome, matricula, cargo, lotacao, banco, agencia, conta_corrente, gestor_nome, gestor_email)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'teste@tjpa.jus.br', 'Fabio Freitas (Via Supabase)', '99999', 'Desenvolvedor', 'Setor de TI', 'Banco do Brasil', '1111', '22222-2', 'Gestor de Teste', 'gestor@teste.com')
ON CONFLICT (id) DO UPDATE SET 
  nome = EXCLUDED.nome,
  cargo = EXCLUDED.cargo;

-- 3. Create solicitacoes
INSERT INTO public.solicitacoes (user_id, nup, tipo, valor_solicitado, status, descricao, created_at)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'TJPA-TEST-DB-001', 'Extra-Emergencial', 500.00, 'aprovado', 'Teste de integração com Supabase - Dados Reais', NOW()),
  ('00000000-0000-0000-0000-000000000000', 'TJPA-TEST-DB-002', 'Sessão de Júri', 2500.00, 'pendente', 'Solicitação vinda do Banco de Dados', NOW() - INTERVAL '1 day')
ON CONFLICT (nup) DO NOTHING;

-- ==============================================
-- 4. SEED DATA FOR INFRASTRUCTURE TABLES
-- ==============================================

-- Municípios (Pará)
INSERT INTO public.municipios (nome, uf, ativo) VALUES 
  ('Belém', 'PA', true),
  ('Ananindeua', 'PA', true),
  ('Santarém', 'PA', true),
  ('Marabá', 'PA', true),
  ('Castanhal', 'PA', true),
  ('Parauapebas', 'PA', true),
  ('Abaetetuba', 'PA', true),
  ('Itaituba', 'PA', true),
  ('Cametá', 'PA', true),
  ('Bragança', 'PA', true),
  ('Altamira', 'PA', true),
  ('Tucuruí', 'PA', true),
  ('Redenção', 'PA', true),
  ('Tailândia', 'PA', true),
  ('Paragominas', 'PA', true),
  ('Breves', 'PA', true),
  ('Barcarena', 'PA', true),
  ('Capanema', 'PA', true),
  ('Marituba', 'PA', true),
  ('Salinópolis', 'PA', true)
ON CONFLICT (nome, uf) DO NOTHING;

-- Comarcas
INSERT INTO public.comarcas (nome, entrancia, ativo) VALUES 
  ('Belém', '3ª Entrância (Capital)', true),
  ('Ananindeua', '3ª Entrância', true),
  ('Santarém', '3ª Entrância', true),
  ('Marabá', '3ª Entrância', true),
  ('Castanhal', '2ª Entrância', true),
  ('Parauapebas', '2ª Entrância', true),
  ('Abaetetuba', '2ª Entrância', true),
  ('Itaituba', '2ª Entrância', true),
  ('Cametá', '2ª Entrância', true),
  ('Bragança', '2ª Entrância', true),
  ('Altamira', '2ª Entrância', true),
  ('Tucuruí', '1ª Entrância', true),
  ('Redenção', '1ª Entrância', true),
  ('Tailândia', '1ª Entrância', true),
  ('Paragominas', '1ª Entrância', true)
ON CONFLICT DO NOTHING;

-- Unidades (Lotações)
INSERT INTO public.unidades (nome, sigla, tipo, ativo) VALUES 
  ('Secretaria de Planejamento e Gestão', 'SEPLAN', 'Secretaria', true),
  ('Secretaria Judiciária', 'SEJUD', 'Secretaria', true),
  ('Diretoria Judiciária', 'DIJUD', 'Diretoria', true),
  ('Seção de Suprimento de Fundos', 'SOSFU', 'Seção', true),
  ('Assessoria Jurídica da SEFIN', 'AJSEFIN', 'Assessoria', true),
  ('Coordenadoria de Gestão de Pessoas', 'CGP', 'Coordenadoria', true),
  ('Secretaria de Gestão de Pessoas', 'SGP', 'Secretaria', true),
  ('Vara Cível de Belém', 'VCB', 'Vara', true),
  ('Vara Criminal de Belém', 'VCRB', 'Vara', true),
  ('Juizado Especial Cível', 'JEC', 'Juizado', true),
  ('Juizado Especial Criminal', 'JECRIM', 'Juizado', true),
  ('Tribunal do Júri de Belém', 'TJB', 'Tribunal', true),
  ('Vara de Execuções Penais', 'VEP', 'Vara', true),
  ('Vara de Infância e Juventude', 'VIJ', 'Vara', true),
  ('Vara de Família', 'VF', 'Vara', true)
ON CONFLICT DO NOTHING;

-- Elementos de Despesa
INSERT INTO public.elementos_despesa (codigo, descricao, categoria, ativo) VALUES 
  ('3390.30', 'Material de Consumo', 'Custeio', true),
  ('3390.33', 'Passagens e Despesas com Locomoção', 'Custeio', true),
  ('3390.36', 'Outros Serviços de Terceiros – Pessoa Física', 'Custeio', true),
  ('3390.39', 'Outros Serviços de Terceiros – Pessoa Jurídica', 'Custeio', true),
  ('3390.14', 'Diárias - Civil', 'Custeio', true),
  ('3390.46', 'Auxílio-Alimentação', 'Pessoal', true),
  ('3390.49', 'Auxílio-Transporte', 'Pessoal', true),
  ('4490.52', 'Equipamentos e Material Permanente', 'Investimento', true),
  ('4490.51', 'Obras e Instalações', 'Investimento', true),
  ('3390.47', 'Obrigações Tributárias e Contributivas', 'Custeio', true),
  ('3390.92', 'Despesas de Exercícios Anteriores', 'Custeio', true),
  ('3390.93', 'Indenizações e Restituições', 'Custeio', true)
ON CONFLICT DO NOTHING;

-- ==============================================
-- 5. SEED DATA FOR SYSTEM CONFIGURATION
-- ==============================================

-- Jury Form Limits
INSERT INTO public.sistema_configuracoes (chave, valor, descricao, categoria) VALUES 
  ('juri_limites_participantes', '{"servidores": 7, "defensor": 2, "promotor": 2, "policias": 5}', 'Limites máximos de participantes por categoria no Júri', 'juri'),
  ('juri_valores_refeicoes', '{"almoco": 30, "jantar": 30, "lanche": 11}', 'Valores máximos unitários de refeições no Júri (R$)', 'juri')
ON CONFLICT (chave) DO NOTHING;
