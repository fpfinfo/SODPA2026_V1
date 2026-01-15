-- ============================================
-- Tabela Principal: servidores_tj
-- Migração para criar tabela unificada de servidores do TJPA
-- ============================================

-- Tabela principal
CREATE TABLE IF NOT EXISTS servidores_tj (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  matricula TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  email TEXT,
  cpf TEXT,
  avatar_url TEXT,
  
  -- Vínculo e Categoria
  vinculo TEXT NOT NULL,           -- 'Efetivo', 'Magistrados', 'Estagiario', 'Requisitado', 'Requisitado - Prefeitura', 'Exclusivamente Comissionado', 'Cedido', 'Estatutario nao Estavel', 'Estavel'
  categoria TEXT,                   -- 'SERVIDOR', 'MAGISTRADO', 'ESTAGIARIO'
  tipo_servidor TEXT,               -- Classificação adicional do tipo de servidor
  
  -- Cargo/Função
  cargo TEXT,
  funcao TEXT,
  cargo_funcao TEXT,                -- Campo combinado se necessário
  
  -- Localização
  lotacao TEXT,
  lotacao_id UUID,                  -- FK para lotacoes (se existir)
  lotacao_cumulativa TEXT,
  comarca TEXT,
  comarca_id UUID,                  -- FK para comarcas (se existir)
  municipio TEXT,
  municipio_id UUID,                -- FK para municipios (se existir)
  polo TEXT,                        -- Pólo regional
  regiao TEXT,                      -- Região do estado
  
  -- Situação Funcional
  teletrabalho TEXT,
  tipo_afastamento TEXT,
  situacao TEXT,                    -- 'ATIVO', 'AFASTADO', 'FERIAS', etc.
  
  -- Específicos Estagiários
  tipo_estagio TEXT,                -- 'NÍVEL SUPERIOR', 'NÍVEL MÉDIO', 'PÓS-GRADUAÇÃO', 'CURRICULAR'
  curso TEXT,
  
  -- Classificação Estrutural
  grau TEXT DEFAULT '1G',           -- '1G', '2G', 'APOIO_INDIRETO'
  entrancia TEXT,                   -- '1ª Entrância', '2ª Entrância', '3ª Entrância'
  
  -- Metadados
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_servidores_tj_matricula ON servidores_tj(matricula);
CREATE INDEX IF NOT EXISTS idx_servidores_tj_nome ON servidores_tj(nome);
CREATE INDEX IF NOT EXISTS idx_servidores_tj_categoria ON servidores_tj(categoria);
CREATE INDEX IF NOT EXISTS idx_servidores_tj_vinculo ON servidores_tj(vinculo);
CREATE INDEX IF NOT EXISTS idx_servidores_tj_lotacao ON servidores_tj(lotacao);
CREATE INDEX IF NOT EXISTS idx_servidores_tj_comarca ON servidores_tj(comarca);
CREATE INDEX IF NOT EXISTS idx_servidores_tj_grau ON servidores_tj(grau);
CREATE INDEX IF NOT EXISTS idx_servidores_tj_ativo ON servidores_tj(ativo);
CREATE INDEX IF NOT EXISTS idx_servidores_tj_email ON servidores_tj(email);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_servidores_tj_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_servidores_tj_updated_at ON servidores_tj;
CREATE TRIGGER trigger_servidores_tj_updated_at
  BEFORE UPDATE ON servidores_tj
  FOR EACH ROW
  EXECUTE FUNCTION update_servidores_tj_updated_at();

-- RLS Policies
ALTER TABLE servidores_tj ENABLE ROW LEVEL SECURITY;

-- Select: todos autenticados podem ver
CREATE POLICY "servidores_tj_select_policy"
  ON servidores_tj FOR SELECT
  TO authenticated
  USING (true);

-- Insert/Update/Delete: apenas admins
CREATE POLICY "servidores_tj_insert_policy"
  ON servidores_tj FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('ADMIN', 'SOSFU')
    )
  );

CREATE POLICY "servidores_tj_update_policy"
  ON servidores_tj FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('ADMIN', 'SOSFU')
    )
  );

CREATE POLICY "servidores_tj_delete_policy"
  ON servidores_tj FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('ADMIN', 'SOSFU')
    )
  );

-- Comentários
COMMENT ON TABLE servidores_tj IS 'Tabela unificada de todos servidores, magistrados e estagiários do TJPA';
COMMENT ON COLUMN servidores_tj.matricula IS 'Matrícula única do servidor no RH do TJPA';
COMMENT ON COLUMN servidores_tj.vinculo IS 'Tipo de vínculo funcional (Efetivo, Requisitado, etc.)';
COMMENT ON COLUMN servidores_tj.categoria IS 'Categoria: SERVIDOR, MAGISTRADO ou ESTAGIARIO';
COMMENT ON COLUMN servidores_tj.grau IS 'Grau de jurisdição: 1G, 2G ou APOIO_INDIRETO';
