-- ==========================================
-- SISUP - LOCATION TABLES MIGRATION
-- Comarcas, Municípios, Lotações
-- ==========================================

-- ==========================================
-- 1. COMARCAS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS comarcas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(10) NOT NULL UNIQUE,
  nome VARCHAR(200) NOT NULL,
  entrancia VARCHAR(20) NOT NULL CHECK (entrancia IN ('1ª Entrância', '2ª Entrância', '3ª Entrância')),
  varas INTEGER NOT NULL DEFAULT 1,
  
  -- Suprido vinculado (FK opcional)
  suprido_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Orçamento para suprimento ordinário
  teto_anual DECIMAL(12,2) DEFAULT 0,
  dist_elemento_30_01 DECIMAL(5,2) DEFAULT 25, -- Combustível %
  dist_elemento_30_02 DECIMAL(5,2) DEFAULT 25, -- Material de Consumo %
  dist_elemento_33 DECIMAL(5,2) DEFAULT 20,    -- Passagens %
  dist_elemento_36 DECIMAL(5,2) DEFAULT 15,    -- Serviços PF %
  dist_elemento_39 DECIMAL(5,2) DEFAULT 15,    -- Serviços PJ %
  
  status VARCHAR(20) NOT NULL DEFAULT 'ATIVA' CHECK (status IN ('ATIVA', 'INATIVA', 'SEM_SUPRIDO', 'BLOQUEADA')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 2. MUNICIPIOS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS municipios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_ibge VARCHAR(10) NOT NULL UNIQUE,
  nome VARCHAR(200) NOT NULL,
  comarca_id UUID REFERENCES comarcas(id) ON DELETE SET NULL,
  populacao INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. LOTACOES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS lotacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(20) NOT NULL UNIQUE,
  nome VARCHAR(300) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('JURISDICIONAL', 'ADMINISTRATIVA')),
  comarca_id UUID REFERENCES comarcas(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 4. COMARCA_BUDGET_HISTORY (Auditoria)
-- ==========================================
CREATE TABLE IF NOT EXISTS comarca_budget_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comarca_id UUID NOT NULL REFERENCES comarcas(id) ON DELETE CASCADE,
  ano INTEGER NOT NULL,
  quadrimestre INTEGER NOT NULL CHECK (quadrimestre IN (1, 2, 3)),
  valor_liberado DECIMAL(12,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'GERADO' CHECK (status IN ('GERADO', 'ASSINADO', 'LIBERADO', 'EXECUTADO')),
  processo_id UUID REFERENCES solicitacoes(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 5. INDEXES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_comarcas_status ON comarcas(status);
CREATE INDEX IF NOT EXISTS idx_comarcas_suprido ON comarcas(suprido_id);
CREATE INDEX IF NOT EXISTS idx_municipios_comarca ON municipios(comarca_id);
CREATE INDEX IF NOT EXISTS idx_lotacoes_comarca ON lotacoes(comarca_id);
CREATE INDEX IF NOT EXISTS idx_lotacoes_tipo ON lotacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_budget_history_comarca ON comarca_budget_history(comarca_id, ano, quadrimestre);

-- ==========================================
-- 6. RLS POLICIES
-- ==========================================
ALTER TABLE comarcas ENABLE ROW LEVEL SECURITY;
ALTER TABLE municipios ENABLE ROW LEVEL SECURITY;
ALTER TABLE lotacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comarca_budget_history ENABLE ROW LEVEL SECURITY;

-- Comarcas: leitura pública, escrita apenas SOSFU/ADMIN
CREATE POLICY "comarcas_read_all" ON comarcas FOR SELECT USING (true);
CREATE POLICY "comarcas_write_sosfu" ON comarcas FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('SOSFU', 'ADMIN'))
);

-- Municípios/Lotações: mesma política
CREATE POLICY "municipios_read_all" ON municipios FOR SELECT USING (true);
CREATE POLICY "municipios_write_sosfu" ON municipios FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('SOSFU', 'ADMIN'))
);

CREATE POLICY "lotacoes_read_all" ON lotacoes FOR SELECT USING (true);
CREATE POLICY "lotacoes_write_sosfu" ON lotacoes FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('SOSFU', 'ADMIN'))
);

CREATE POLICY "budget_history_read_all" ON comarca_budget_history FOR SELECT USING (true);
CREATE POLICY "budget_history_write_sosfu" ON comarca_budget_history FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('SOSFU', 'ADMIN'))
);

-- ==========================================
-- 7. SEED DATA (10 Comarcas iniciais)
-- ==========================================
INSERT INTO comarcas (codigo, nome, entrancia, varas, teto_anual, dist_elemento_30_01, dist_elemento_30_02, dist_elemento_33, dist_elemento_36, dist_elemento_39, status) VALUES
('BEL', 'Comarca de Belém', '3ª Entrância', 45, 60000.00, 15, 30, 20, 20, 15, 'ATIVA'),
('ANA', 'Comarca de Ananindeua', '3ª Entrância', 8, 48000.00, 20, 25, 20, 20, 15, 'ATIVA'),
('SAN', 'Comarca de Santarém', '3ª Entrância', 12, 48000.00, 25, 25, 20, 15, 15, 'ATIVA'),
('MAR', 'Comarca de Marabá', '3ª Entrância', 10, 42000.00, 25, 25, 25, 15, 10, 'ATIVA'),
('PAR', 'Comarca de Parauapebas', '2ª Entrância', 6, 36000.00, 30, 20, 20, 15, 15, 'ATIVA'),
('CAS', 'Comarca de Castanhal', '2ª Entrância', 5, 36000.00, 25, 25, 20, 15, 15, 'ATIVA'),
('MDR', 'Comarca de Mãe do Rio', '1ª Entrância', 2, 24000.00, 30, 25, 20, 15, 10, 'SEM_SUPRIDO'),
('TUC', 'Comarca de Tucuruí', '2ª Entrância', 4, 30000.00, 25, 25, 25, 15, 10, 'ATIVA'),
('ALT', 'Comarca de Altamira', '2ª Entrância', 5, 36000.00, 30, 20, 25, 15, 10, 'ATIVA'),
('ABA', 'Comarca de Abaetetuba', '2ª Entrância', 4, 30000.00, 25, 25, 25, 15, 10, 'ATIVA')
ON CONFLICT (codigo) DO NOTHING;

-- Seed Municípios
INSERT INTO municipios (codigo_ibge, nome, comarca_id, populacao)
SELECT '1501402', 'Belém', id, 1499641 FROM comarcas WHERE codigo = 'BEL'
ON CONFLICT (codigo_ibge) DO NOTHING;

INSERT INTO municipios (codigo_ibge, nome, comarca_id, populacao)
SELECT '1500800', 'Ananindeua', id, 535547 FROM comarcas WHERE codigo = 'ANA'
ON CONFLICT (codigo_ibge) DO NOTHING;

INSERT INTO municipios (codigo_ibge, nome, comarca_id, populacao)
SELECT '1506807', 'Santarém', id, 306480 FROM comarcas WHERE codigo = 'SAN'
ON CONFLICT (codigo_ibge) DO NOTHING;

INSERT INTO municipios (codigo_ibge, nome, comarca_id, populacao)
SELECT '1504208', 'Marabá', id, 283542 FROM comarcas WHERE codigo = 'MAR'
ON CONFLICT (codigo_ibge) DO NOTHING;

INSERT INTO municipios (codigo_ibge, nome, comarca_id, populacao)
SELECT '1505536', 'Parauapebas', id, 212749 FROM comarcas WHERE codigo = 'PAR'
ON CONFLICT (codigo_ibge) DO NOTHING;

-- Seed Lotações
INSERT INTO lotacoes (codigo, nome, tipo, comarca_id) VALUES
('SOSFU', 'Serviço de Suprimento de Fundos', 'ADMINISTRATIVA', NULL),
('SEPLAN', 'Secretaria de Planejamento, Coordenação e Finanças', 'ADMINISTRATIVA', NULL),
('SGP', 'Secretaria de Gestão de Pessoas', 'ADMINISTRATIVA', NULL),
('AJSEPLAN', 'Assessoria Jurídica da SEPLAN', 'ADMINISTRATIVA', NULL)
ON CONFLICT (codigo) DO NOTHING;

-- Lotações Jurisdicionais vinculadas às comarcas
INSERT INTO lotacoes (codigo, nome, tipo, comarca_id)
SELECT 'CMCBEL', 'Central de Mandados de Belém', 'JURISDICIONAL', id FROM comarcas WHERE codigo = 'BEL'
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO lotacoes (codigo, nome, tipo, comarca_id)
SELECT 'CMCMDR', 'Central de Mandados de Mãe do Rio', 'JURISDICIONAL', id FROM comarcas WHERE codigo = 'MDR'
ON CONFLICT (codigo) DO NOTHING;

-- ==========================================
-- 8. UPDATE TRIGGER
-- ==========================================
CREATE OR REPLACE FUNCTION update_location_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_comarcas_updated
  BEFORE UPDATE ON comarcas
  FOR EACH ROW EXECUTE FUNCTION update_location_timestamp();

CREATE TRIGGER trg_municipios_updated
  BEFORE UPDATE ON municipios
  FOR EACH ROW EXECUTE FUNCTION update_location_timestamp();

CREATE TRIGGER trg_lotacoes_updated
  BEFORE UPDATE ON lotacoes
  FOR EACH ROW EXECUTE FUNCTION update_location_timestamp();
