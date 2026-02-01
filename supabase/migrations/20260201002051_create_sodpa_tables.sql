-- ============================================================================
-- SODPA - Tabela de Solicitações de Diárias e Passagens
-- Criada em: 2026-02-01
-- ============================================================================

-- Tabela principal de solicitações
CREATE TABLE IF NOT EXISTS sodpa_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tipo e Status
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('DIARIA', 'PASSAGEM')),
  status VARCHAR(50) NOT NULL DEFAULT 'NOVO',
  
  -- Dados do Solicitante
  solicitante_id UUID REFERENCES auth.users(id),
  solicitante_nome VARCHAR(255) NOT NULL,
  solicitante_email VARCHAR(255),
  solicitante_cpf VARCHAR(14),
  solicitante_matricula VARCHAR(20),
  solicitante_cargo VARCHAR(100),
  solicitante_vinculo VARCHAR(50),
  solicitante_telefone VARCHAR(20),
  solicitante_lotacao VARCHAR(255),
  solicitante_municipio VARCHAR(100),
  
  -- Gestor
  gestor_nome VARCHAR(255),
  gestor_email VARCHAR(255),
  
  -- Dados Bancários
  banco VARCHAR(100),
  agencia VARCHAR(20),
  conta_corrente VARCHAR(30),
  
  -- Dados da Viagem
  tipo_destino VARCHAR(20) CHECK (tipo_destino IN ('ESTADO', 'PAIS', 'INTERNACIONAL')),
  origem VARCHAR(255),
  destino VARCHAR(255),
  data_inicio DATE,
  data_fim DATE,
  dias INTEGER,
  motivo TEXT,
  
  -- Valores (calculados posteriormente)
  valor_diaria DECIMAL(10,2),
  valor_total DECIMAL(10,2),
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- NUP e Portaria (gerados no fluxo)
  nup VARCHAR(50),
  numero_portaria VARCHAR(50)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_sodpa_requests_status ON sodpa_requests(status);
CREATE INDEX IF NOT EXISTS idx_sodpa_requests_tipo ON sodpa_requests(tipo);
CREATE INDEX IF NOT EXISTS idx_sodpa_requests_solicitante ON sodpa_requests(solicitante_id);
CREATE INDEX IF NOT EXISTS idx_sodpa_requests_created ON sodpa_requests(created_at DESC);

-- Tabela de anexos
CREATE TABLE IF NOT EXISTS sodpa_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES sodpa_requests(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER,
  file_type VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sodpa_attachments_request ON sodpa_attachments(request_id);

-- RLS Policies
ALTER TABLE sodpa_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE sodpa_attachments ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver suas próprias solicitações
CREATE POLICY "sodpa_requests_select_own" ON sodpa_requests
  FOR SELECT TO authenticated
  USING (solicitante_id = auth.uid());

-- Policy: Usuários podem inserir suas próprias solicitações
CREATE POLICY "sodpa_requests_insert_own" ON sodpa_requests
  FOR INSERT TO authenticated
  WITH CHECK (solicitante_id = auth.uid());

-- Policy: Usuários podem atualizar suas próprias solicitações
CREATE POLICY "sodpa_requests_update_own" ON sodpa_requests
  FOR UPDATE TO authenticated
  USING (solicitante_id = auth.uid());

-- Policy: Analistas SODPA podem ver todas as solicitações
CREATE POLICY "sodpa_requests_select_analyst" ON sodpa_requests
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('SODPA', 'ADMIN', 'SUPERUSER')
    )
  );

-- Policy: Analistas SODPA podem atualizar solicitações
CREATE POLICY "sodpa_requests_update_analyst" ON sodpa_requests
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('SODPA', 'ADMIN', 'SUPERUSER')
    )
  );

-- Policies para anexos (herdam da solicitação)
CREATE POLICY "sodpa_attachments_select" ON sodpa_attachments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sodpa_requests sr
      WHERE sr.id = request_id
      AND (
        sr.solicitante_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM user_roles ur
          JOIN roles r ON ur.role_id = r.id
          WHERE ur.user_id = auth.uid()
          AND r.name IN ('SODPA', 'ADMIN', 'SUPERUSER')
        )
      )
    )
  );

CREATE POLICY "sodpa_attachments_insert" ON sodpa_attachments
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sodpa_requests sr
      WHERE sr.id = request_id
      AND sr.solicitante_id = auth.uid()
    )
  );

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_sodpa_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sodpa_requests_updated_at
  BEFORE UPDATE ON sodpa_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_sodpa_requests_updated_at();

-- Comentários
COMMENT ON TABLE sodpa_requests IS 'Solicitações de diárias e passagens aéreas - SODPA';
COMMENT ON TABLE sodpa_attachments IS 'Anexos das solicitações SODPA';
