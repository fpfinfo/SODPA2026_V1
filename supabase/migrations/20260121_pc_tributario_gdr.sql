-- =============================================================================
-- Migration: Campos Tributários e GDR para Prestação de Contas
-- Criado em: 2026-01-21
-- Autor: Antigravity SOSFU Expert
-- Descrição: Adiciona campos para controle de ISS/INSS, GDRs e dados de PF
-- =============================================================================

-- =============================================================================
-- 1. ADICIONAR CAMPOS TRIBUTÁRIOS À prestacao_contas
-- =============================================================================
ALTER TABLE prestacao_contas ADD COLUMN IF NOT EXISTS total_inss_retido NUMERIC(12,2) DEFAULT 0;
ALTER TABLE prestacao_contas ADD COLUMN IF NOT EXISTS total_inss_patronal NUMERIC(12,2) DEFAULT 0;
ALTER TABLE prestacao_contas ADD COLUMN IF NOT EXISTS total_iss_retido NUMERIC(12,2) DEFAULT 0;

-- =============================================================================
-- 2. CAMPOS DE GDR DE INSS (Recolhimento dos 11% retidos)
-- =============================================================================
ALTER TABLE prestacao_contas ADD COLUMN IF NOT EXISTS gdr_inss_numero VARCHAR(50);
ALTER TABLE prestacao_contas ADD COLUMN IF NOT EXISTS gdr_inss_arquivo_path TEXT;
ALTER TABLE prestacao_contas ADD COLUMN IF NOT EXISTS gdr_inss_arquivo_url TEXT;
ALTER TABLE prestacao_contas ADD COLUMN IF NOT EXISTS gdr_inss_valor NUMERIC(12,2);
ALTER TABLE prestacao_contas ADD COLUMN IF NOT EXISTS gdr_inss_paga BOOLEAN DEFAULT false;
ALTER TABLE prestacao_contas ADD COLUMN IF NOT EXISTS gdr_inss_data_pagamento DATE;

-- =============================================================================
-- 3. CAMPOS DE GDR DE SALDO (Devolução de recursos não utilizados)
-- =============================================================================
ALTER TABLE prestacao_contas ADD COLUMN IF NOT EXISTS gdr_saldo_numero VARCHAR(50);
ALTER TABLE prestacao_contas ADD COLUMN IF NOT EXISTS gdr_saldo_arquivo_path TEXT;
ALTER TABLE prestacao_contas ADD COLUMN IF NOT EXISTS gdr_saldo_arquivo_url TEXT;
ALTER TABLE prestacao_contas ADD COLUMN IF NOT EXISTS gdr_saldo_valor NUMERIC(12,2);
ALTER TABLE prestacao_contas ADD COLUMN IF NOT EXISTS gdr_saldo_paga BOOLEAN DEFAULT false;
ALTER TABLE prestacao_contas ADD COLUMN IF NOT EXISTS gdr_saldo_data_pagamento DATE;

-- =============================================================================
-- 4. CAMPO JSONB PARA DADOS DE PRESTADOR PF NA comprovantes_pc
-- =============================================================================
ALTER TABLE comprovantes_pc ADD COLUMN IF NOT EXISTS prestador_pf_dados JSONB;
-- Estrutura esperada do JSONB:
-- {
--   "nome": "João da Silva",
--   "cpf": "097.705.772-00",
--   "rg": "1234567",
--   "data_nascimento": "1985-05-15",
--   "pis_nit": "123.45678.90-0",
--   "endereco": {
--     "logradouro": "Rua das Flores",
--     "numero": "123",
--     "complemento": "Apto 101",
--     "bairro": "Centro",
--     "cidade": "Belém",
--     "estado": "PA",
--     "cep": "66000-000"
--   },
--   "atividade": "Serviços de manutenção elétrica",
--   "data_prestacao": "2026-01-15",
--   "valor_bruto": 500.00,
--   "iss_retido": 25.00,
--   "inss_retido": 55.00,
--   "valor_liquido": 420.00,
--   "documentos_pessoais_path": "prestacao/xxx/docs_pessoais.pdf",
--   "comprovante_residencia_path": "prestacao/xxx/comp_residencia.pdf"
-- }

ALTER TABLE comprovantes_pc ADD COLUMN IF NOT EXISTS inss_retido NUMERIC(12,2) DEFAULT 0;
ALTER TABLE comprovantes_pc ADD COLUMN IF NOT EXISTS iss_retido NUMERIC(12,2) DEFAULT 0;
ALTER TABLE comprovantes_pc ADD COLUMN IF NOT EXISTS valor_liquido NUMERIC(12,2);

-- =============================================================================
-- 5. NOVOS STATUS DE PRESTAÇÃO DE CONTAS
-- =============================================================================
-- Atualizar constraint de status para incluir novos valores
ALTER TABLE prestacao_contas DROP CONSTRAINT IF EXISTS prestacao_contas_status_check;
ALTER TABLE prestacao_contas ADD CONSTRAINT prestacao_contas_status_check CHECK (status IN (
  'RASCUNHO',
  'SUBMETIDA',
  'GESTOR_ATESTO',       -- Novo: Gestor atestou, enviou para SOSFU
  'EM_ANALISE',
  'PENDENCIA',
  'APROVADA',
  'APTO_BAIXA_SIAFE',    -- Novo: Aprovada, aguardando baixa
  'SIAFE_BAIXADA',
  'ENCERRADA',           -- Novo: Processo totalmente finalizado
  -- Status TCE
  'TCE_INSTAURADA',
  'TCE_PRAZO_RECURSAL',
  'TCE_DECISAO',
  'TCE_AVERBACAO_SGP'
));

-- =============================================================================
-- 6. TABELA: gestao_inss (Para aba de Gestão de INSS na SOSFU)
-- =============================================================================
CREATE TABLE IF NOT EXISTS gestao_inss (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitacao_id UUID NOT NULL REFERENCES solicitacoes(id) ON DELETE CASCADE,
  prestacao_contas_id UUID REFERENCES prestacao_contas(id) ON DELETE CASCADE,
  comprovante_id UUID REFERENCES comprovantes_pc(id) ON DELETE CASCADE,
  
  -- Dados do prestador
  cpf VARCHAR(14) NOT NULL,
  nome TEXT NOT NULL,
  pis_nit VARCHAR(14),
  
  -- Valores
  valor_bruto NUMERIC(12,2) NOT NULL,
  inss_retido_11 NUMERIC(12,2) NOT NULL,    -- 11% pago pelo Suprido via GDR
  inss_patronal_20 NUMERIC(12,2) NOT NULL,  -- 20% a recolher pela SOSFU
  
  -- Dados do processo
  nup TEXT NOT NULL,
  portaria_numero TEXT,
  comarca TEXT,
  atividade TEXT,
  data_prestacao DATE,
  
  -- Status do recolhimento patronal
  status TEXT NOT NULL DEFAULT 'PENDENTE_RECOLHIMENTO' CHECK (status IN (
    'PENDENTE_RECOLHIMENTO',
    'GUIA_GERADA',
    'RECOLHIDO',
    'BAIXADO'
  )),
  
  -- Dados do recolhimento
  guia_numero TEXT,
  guia_data_geracao DATE,
  data_recolhimento DATE,
  comprovante_path TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gestao_inss_status ON gestao_inss(status);
CREATE INDEX IF NOT EXISTS idx_gestao_inss_solicitacao ON gestao_inss(solicitacao_id);

-- RLS
ALTER TABLE gestao_inss ENABLE ROW LEVEL SECURITY;

-- SOSFU pode gerenciar todos os registros
CREATE POLICY "sosfu_gestao_inss_all" ON gestao_inss
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('SOSFU', 'ADMIN', 'SEFIN')
    )
  );

-- =============================================================================
-- 7. TABELA: gestao_devolucoes (Para aba de Gestão de Devoluções na SOSFU)
-- =============================================================================
CREATE TABLE IF NOT EXISTS gestao_devolucoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitacao_id UUID NOT NULL REFERENCES solicitacoes(id) ON DELETE CASCADE,
  prestacao_contas_id UUID REFERENCES prestacao_contas(id) ON DELETE CASCADE,
  
  -- Dados da devolução
  data_referencia DATE NOT NULL DEFAULT CURRENT_DATE,
  suprido_nome TEXT NOT NULL,
  numero_gdr TEXT,
  
  -- Classificação
  elemento_origem TEXT DEFAULT 'SALDO_NAO_UTILIZADO',
  
  -- Valores
  valor_concedido NUMERIC(12,2) NOT NULL,
  valor_gasto NUMERIC(12,2) NOT NULL,
  valor_devolucao NUMERIC(12,2) NOT NULL,
  
  -- Status da conciliação bancária
  status_gdr TEXT NOT NULL DEFAULT 'PENDENTE' CHECK (status_gdr IN (
    'PENDENTE',               -- Aguardando confirmação de crédito
    'CONFERIDO',              -- Crédito confirmado
    'CONCILIADO',             -- Baixa realizada no sistema
    'DIVERGENCIA'             -- Valor não confere
  )),
  
  -- Confirmação bancária
  data_confirmacao DATE,
  confirmado_por UUID REFERENCES auth.users(id),
  observacoes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gestao_devolucoes_status ON gestao_devolucoes(status_gdr);
CREATE INDEX IF NOT EXISTS idx_gestao_devolucoes_solicitacao ON gestao_devolucoes(solicitacao_id);

-- RLS
ALTER TABLE gestao_devolucoes ENABLE ROW LEVEL SECURITY;

-- SOSFU pode gerenciar todos os registros
CREATE POLICY "sosfu_gestao_devolucoes_all" ON gestao_devolucoes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('SOSFU', 'ADMIN', 'SEFIN')
    )
  );

-- =============================================================================
-- 8. TABELA: baixa_siafe (Para aba de Baixa SIAFE na SOSFU)
-- =============================================================================
CREATE TABLE IF NOT EXISTS baixa_siafe (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitacao_id UUID NOT NULL REFERENCES solicitacoes(id) ON DELETE CASCADE,
  prestacao_contas_id UUID REFERENCES prestacao_contas(id) ON DELETE CASCADE,
  
  -- Identificação
  nup TEXT NOT NULL,
  suprido_nome TEXT NOT NULL,
  unidade TEXT,
  
  -- Valor aprovado na PC
  valor_aprovado NUMERIC(12,2) NOT NULL,
  
  -- Status
  status_pc TEXT NOT NULL DEFAULT 'APROVADO' CHECK (status_pc IN (
    'APROVADO',
    'PENDENTE_CORRECAO'
  )),
  status_baixa TEXT NOT NULL DEFAULT 'PENDENTE' CHECK (status_baixa IN (
    'PENDENTE',
    'EM_PROCESSAMENTO',
    'CONFIRMADA',
    'ERRO'
  )),
  
  -- Dados da baixa SIAFE
  nl_numero TEXT,             -- Número da Nota de Lançamento
  nl_data DATE,               -- Data da NL
  confirmado_por UUID REFERENCES auth.users(id),
  observacoes TEXT,
  
  -- Timestamps
  data_aprovacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_baixa TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_baixa_siafe_status ON baixa_siafe(status_baixa);
CREATE INDEX IF NOT EXISTS idx_baixa_siafe_solicitacao ON baixa_siafe(solicitacao_id);

-- RLS
ALTER TABLE baixa_siafe ENABLE ROW LEVEL SECURITY;

-- SOSFU pode gerenciar todos os registros
CREATE POLICY "sosfu_baixa_siafe_all" ON baixa_siafe
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('SOSFU', 'ADMIN', 'SEFIN')
    )
  );

-- =============================================================================
-- 9. TRIGGERS PARA UPDATED_AT
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER gestao_inss_updated_at
  BEFORE UPDATE ON gestao_inss
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER gestao_devolucoes_updated_at
  BEFORE UPDATE ON gestao_devolucoes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER baixa_siafe_updated_at
  BEFORE UPDATE ON baixa_siafe
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- 10. COMENTÁRIOS
-- =============================================================================
COMMENT ON TABLE gestao_inss IS 'Registros de INSS de prestadores PF para recolhimento patronal (20%)';
COMMENT ON TABLE gestao_devolucoes IS 'GDRs de devolução de saldo pendentes de conciliação bancária';
COMMENT ON TABLE baixa_siafe IS 'Processos aprovados na PC aguardando baixa contábil no SIAFE';
