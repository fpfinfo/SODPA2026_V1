-- Migration: Add PTRES to solicitacoes and create orcamento_sosfu table
-- Created: 2026-01-18

-- 1. Add PTRES column to solicitacoes
ALTER TABLE solicitacoes 
ADD COLUMN IF NOT EXISTS ptres VARCHAR(4);

-- 2. Create orcamento_sosfu table
CREATE TABLE IF NOT EXISTS orcamento_sosfu (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ptres VARCHAR(4) NOT NULL UNIQUE,
  descricao TEXT NOT NULL,
  teto_anual DECIMAL(12,2) NOT NULL,
  executado DECIMAL(12,2) DEFAULT 0,
  ano INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Seed inicial - Orçamentos SOSFU 2026
INSERT INTO orcamento_sosfu (ptres, descricao, teto_anual, executado, ano) VALUES
('8727', 'Recursos Extra-Emergenciais', 250000.00, 0, 2026),
('8163', 'Recursos para Concursos/Exames', 150000.00, 0, 2026),
('8193', 'Recursos Ordinários', 500000.00, 0, 2026)
ON CONFLICT (ptres) DO NOTHING;

-- 4. Enable RLS
ALTER TABLE orcamento_sosfu ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
CREATE POLICY "Public read access for orcamento_sosfu" 
ON orcamento_sosfu FOR SELECT 
USING (true);

CREATE POLICY "SOSFU can update orcamento_sosfu" 
ON orcamento_sosfu FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'SOSFU'
  )
);

CREATE POLICY "SOSFU can insert orcamento_sosfu" 
ON orcamento_sosfu FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'SOSFU'
  )
);

-- 6. Create index for performance
CREATE INDEX IF NOT EXISTS idx_orcamento_sosfu_ptres_ano 
ON orcamento_sosfu(ptres, ano);

-- 7. Comment
COMMENT ON TABLE orcamento_sosfu IS 'Orçamentos gerenciados pela SOSFU por PTRES';
COMMENT ON COLUMN orcamento_sosfu.ptres IS 'Código PTRES (8727, 8163, 8193, etc)';
COMMENT ON COLUMN orcamento_sosfu.teto_anual IS 'Teto anual autorizado para o PTRES';
COMMENT ON COLUMN orcamento_sosfu.executado IS 'Valor já executado no ano';
