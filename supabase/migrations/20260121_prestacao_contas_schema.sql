-- =============================================================================
-- Migration: Módulo de Prestação de Contas (PC) + Tomada de Contas Especial (TCE)
-- Criado em: 2026-01-21
-- Autor: Antigravity SOSFU Expert
-- =============================================================================

-- =============================================================================
-- 1. TABELA PRINCIPAL: prestacao_contas
-- Armazena os metadados da prestação de contas de cada solicitação
-- =============================================================================
CREATE TABLE IF NOT EXISTS prestacao_contas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitacao_id UUID NOT NULL REFERENCES solicitacoes(id) ON DELETE CASCADE,
  
  -- Status do fluxo de PC
  status TEXT NOT NULL DEFAULT 'RASCUNHO' CHECK (status IN (
    'RASCUNHO',           -- Suprido iniciou mas não submeteu
    'SUBMETIDA',          -- Enviada para análise SOSFU
    'EM_ANALISE',         -- SOSFU analisando
    'PENDENCIA',          -- Devolvida ao Suprido para correção
    'APROVADA',           -- Aprovada, aguardando baixa SIAFE
    'SIAFE_BAIXADA',      -- Baixa SIAFE realizada (finalizado)
    -- Status TCE
    'TCE_INSTAURADA',     -- Prazo expirado, TCE iniciada
    'TCE_PRAZO_RECURSAL', -- Aguardando prazo de defesa (30 dias)
    'TCE_DECISAO',        -- Aguardando decisão do Ordenador
    'TCE_AVERBACAO_SGP'   -- Enviada ao SGP para averbação de débito
  )),
  
  -- Valores financeiros
  valor_concedido NUMERIC(12,2) NOT NULL DEFAULT 0,
  valor_gasto NUMERIC(12,2) NOT NULL DEFAULT 0,
  valor_devolvido NUMERIC(12,2) DEFAULT 0,
  
  -- Auditoria e conformidade
  observacoes TEXT,
  motivo_pendencia TEXT,
  nlp_analysis JSONB,  -- Resultado da análise Sentinela
  
  -- Timestamps de submissão
  submitted_at TIMESTAMPTZ,
  submitted_by UUID REFERENCES auth.users(id),
  
  -- Timestamps de análise SOSFU
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  
  -- Dados da Baixa SIAFE
  siafe_nl TEXT,           -- Número da Nota de Lançamento de Baixa
  siafe_date DATE,         -- Data da baixa no SIAFE
  
  -- Dados TCE (quando aplicável)
  tce_instaurada_at TIMESTAMPTZ,
  tce_prazo_recursal_fim DATE,
  tce_decisao TEXT CHECK (tce_decisao IN ('ARQUIVADO', 'AVERBACAO', NULL)),
  tce_decisao_at TIMESTAMPTZ,
  tce_decisao_by UUID REFERENCES auth.users(id),
  tce_sgp_enviado_at TIMESTAMPTZ,
  tce_observacoes TEXT,
  
  -- Audit trail
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_prestacao_solicitacao ON prestacao_contas(solicitacao_id);
CREATE INDEX IF NOT EXISTS idx_prestacao_status ON prestacao_contas(status);
CREATE INDEX IF NOT EXISTS idx_prestacao_submitted_by ON prestacao_contas(submitted_by);

-- =============================================================================
-- 2. TABELA: comprovantes_pc
-- Armazena notas fiscais, recibos e cupons anexados à PC
-- =============================================================================
CREATE TABLE IF NOT EXISTS comprovantes_pc (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prestacao_id UUID NOT NULL REFERENCES prestacao_contas(id) ON DELETE CASCADE,
  
  -- Tipo de comprovante
  tipo TEXT NOT NULL CHECK (tipo IN (
    'NOTA_FISCAL',
    'CUPOM_FISCAL',
    'RECIBO',
    'FATURA',
    'OUTROS'
  )),
  
  -- Dados do documento
  numero TEXT,                   -- Número do documento
  serie TEXT,                    -- Série (para NF)
  emitente TEXT NOT NULL,        -- Nome do fornecedor/prestador
  cnpj_cpf TEXT,                 -- CNPJ ou CPF do emitente
  valor NUMERIC(12,2) NOT NULL,  -- Valor do documento
  data_emissao DATE NOT NULL,    -- Data de emissão
  descricao TEXT,                -- Descrição dos itens/serviços
  
  -- Classificação orçamentária
  elemento_despesa TEXT NOT NULL CHECK (elemento_despesa IN (
    '3.3.90.30',  -- Material de Consumo
    '3.3.90.33',  -- Passagens e Locomoção
    '3.3.90.36',  -- Serviços PF
    '3.3.90.39'   -- Serviços PJ
  )),
  
  -- Storage
  file_path TEXT NOT NULL,       -- Caminho no Supabase Storage
  file_name TEXT NOT NULL,       -- Nome original do arquivo
  storage_url TEXT,              -- URL pública (se aplicável)
  file_size_bytes INTEGER,       -- Tamanho do arquivo
  mime_type TEXT,                -- Tipo MIME (application/pdf, image/jpeg, etc.)
  
  -- Resultado do OCR/Sentinela
  ocr_data JSONB,                -- Dados extraídos pelo OCR
  ocr_confidence NUMERIC(5,2),   -- Confiança do OCR (0-100)
  sentinela_risk TEXT CHECK (sentinela_risk IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  sentinela_alerts JSONB,        -- Alertas de auditoria
  
  -- Validação manual
  validado BOOLEAN DEFAULT FALSE,
  validado_at TIMESTAMPTZ,
  validado_by UUID REFERENCES auth.users(id),
  glosa_valor NUMERIC(12,2),     -- Valor glosado (se houver)
  glosa_motivo TEXT,             -- Motivo da glosa
  
  -- Audit trail
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_comprovante_prestacao ON comprovantes_pc(prestacao_id);
CREATE INDEX IF NOT EXISTS idx_comprovante_tipo ON comprovantes_pc(tipo);
CREATE INDEX IF NOT EXISTS idx_comprovante_elemento ON comprovantes_pc(elemento_despesa);

-- =============================================================================
-- 3. RLS POLICIES
-- =============================================================================

-- Habilitar RLS
ALTER TABLE prestacao_contas ENABLE ROW LEVEL SECURITY;
ALTER TABLE comprovantes_pc ENABLE ROW LEVEL SECURITY;

-- Policy: Suprido pode ver/editar sua própria PC
CREATE POLICY "suprido_prestacao_select" ON prestacao_contas
  FOR SELECT USING (
    submitted_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM solicitacoes s 
      WHERE s.id = prestacao_contas.solicitacao_id 
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "suprido_prestacao_insert" ON prestacao_contas
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM solicitacoes s 
      WHERE s.id = solicitacao_id 
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "suprido_prestacao_update" ON prestacao_contas
  FOR UPDATE USING (
    submitted_by = auth.uid() AND status IN ('RASCUNHO', 'PENDENCIA')
  );

-- Policy: SOSFU pode ver/analisar todas as PC
CREATE POLICY "sosfu_prestacao_all" ON prestacao_contas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('SOSFU', 'SEFIN', 'SGP')
    )
  );

-- Policy: Comprovantes seguem as mesmas regras da PC pai
CREATE POLICY "comprovante_select" ON comprovantes_pc
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM prestacao_contas pc 
      WHERE pc.id = comprovantes_pc.prestacao_id
      AND (
        pc.submitted_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles p 
          WHERE p.id = auth.uid() 
          AND p.role IN ('SOSFU', 'SEFIN', 'SGP')
        )
      )
    )
  );

CREATE POLICY "comprovante_insert" ON comprovantes_pc
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM prestacao_contas pc 
      WHERE pc.id = prestacao_id
      AND pc.submitted_by = auth.uid()
      AND pc.status IN ('RASCUNHO', 'PENDENCIA')
    )
  );

CREATE POLICY "comprovante_delete" ON comprovantes_pc
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM prestacao_contas pc 
      WHERE pc.id = comprovantes_pc.prestacao_id
      AND pc.submitted_by = auth.uid()
      AND pc.status IN ('RASCUNHO', 'PENDENCIA')
    )
  );

-- =============================================================================
-- 4. TRIGGER: Atualizar updated_at automaticamente
-- =============================================================================
CREATE OR REPLACE FUNCTION update_prestacao_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prestacao_updated_at
  BEFORE UPDATE ON prestacao_contas
  FOR EACH ROW
  EXECUTE FUNCTION update_prestacao_updated_at();

-- =============================================================================
-- 5. TRIGGER: Calcular totais de comprovantes automaticamente
-- =============================================================================
CREATE OR REPLACE FUNCTION update_prestacao_valor_gasto()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE prestacao_contas
  SET valor_gasto = COALESCE((
    SELECT SUM(c.valor - COALESCE(c.glosa_valor, 0))
    FROM comprovantes_pc c
    WHERE c.prestacao_id = COALESCE(NEW.prestacao_id, OLD.prestacao_id)
  ), 0)
  WHERE id = COALESCE(NEW.prestacao_id, OLD.prestacao_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_comprovante_valor
  AFTER INSERT OR UPDATE OR DELETE ON comprovantes_pc
  FOR EACH ROW
  EXECUTE FUNCTION update_prestacao_valor_gasto();

-- =============================================================================
-- 6. FUNÇÃO: Instaurar TCE automaticamente por prazo expirado
-- (Pode ser chamada por cron job diário)
-- =============================================================================
CREATE OR REPLACE FUNCTION instaurar_tce_prazo_expirado()
RETURNS INTEGER AS $$
DECLARE
  count_tce INTEGER := 0;
BEGIN
  -- Buscar solicitações com prazo de PC expirado
  UPDATE prestacao_contas pc
  SET 
    status = 'TCE_INSTAURADA',
    tce_instaurada_at = NOW(),
    tce_prazo_recursal_fim = NOW() + INTERVAL '30 days'
  FROM solicitacoes s
  WHERE 
    pc.solicitacao_id = s.id
    AND pc.status IN ('RASCUNHO', 'SUBMETIDA', 'PENDENCIA')
    AND s.prazo_prestacao < NOW()
    AND pc.tce_instaurada_at IS NULL;
  
  GET DIAGNOSTICS count_tce = ROW_COUNT;
  
  -- Também atualizar o status_workflow das solicitações
  UPDATE solicitacoes s
  SET 
    status_workflow = 'TCE_INSTAURADA',
    updated_at = NOW()
  FROM prestacao_contas pc
  WHERE 
    pc.solicitacao_id = s.id
    AND pc.status = 'TCE_INSTAURADA'
    AND s.status_workflow != 'TCE_INSTAURADA';
    
  RETURN count_tce;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 7. TABELA HISTÓRICO: Auditoria de mudanças de status PC
-- =============================================================================
CREATE TABLE IF NOT EXISTS historico_prestacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prestacao_id UUID NOT NULL REFERENCES prestacao_contas(id) ON DELETE CASCADE,
  status_anterior TEXT,
  status_novo TEXT NOT NULL,
  observacao TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_historico_prestacao ON historico_prestacao(prestacao_id);

-- Trigger para registrar histórico
CREATE OR REPLACE FUNCTION log_prestacao_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO historico_prestacao (prestacao_id, status_anterior, status_novo, created_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_prestacao_status
  AFTER UPDATE ON prestacao_contas
  FOR EACH ROW
  EXECUTE FUNCTION log_prestacao_status_change();

-- =============================================================================
-- 8. ADICIONAR NOVOS STATUS AO WORKFLOW (solicitacoes)
-- =============================================================================

-- Nota: PostgreSQL não permite adicionar valores CHECK de forma simples.
-- Alternativa: Adicionar coluna de texto livre + validação na aplicação
-- Ou garantir que o status_workflow já suporte os novos valores como TEXT.

-- Comentário sobre status de workflow esperados:
-- PC_DRAFT, PC_SUBMITTED, PC_AUDIT, PC_PENDENCY, PC_APPROVED, PC_SIAFE_DONE
-- TCE_INSTAURADA, TCE_PRAZO_RECURSAL, TCE_DECISAO, TCE_AVERBACAO_SGP

COMMENT ON TABLE prestacao_contas IS 'Módulo de Prestação de Contas do SOSFU - Armazena metadados e status de cada PC';
COMMENT ON TABLE comprovantes_pc IS 'Comprovantes (NF, Recibos, Cupons) anexados à Prestação de Contas';
COMMENT ON TABLE historico_prestacao IS 'Trilha de auditoria para mudanças de status na Prestação de Contas';
COMMENT ON FUNCTION instaurar_tce_prazo_expirado IS 'Função para ser chamada por cron job diário - instaura TCE quando prazo de PC expira';
