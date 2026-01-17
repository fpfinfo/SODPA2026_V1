-- ============================================================
-- MIGRATION: Expense Execution Workflow Fields
-- Date: 2026-01-17
-- 
-- Adiciona campos para controlar o fluxo de execução da despesa
-- ============================================================

-- Campos de controle do workflow de execução
ALTER TABLE solicitacoes ADD COLUMN IF NOT EXISTS execution_started_at TIMESTAMPTZ;
ALTER TABLE solicitacoes ADD COLUMN IF NOT EXISTS execution_completed_at TIMESTAMPTZ;
ALTER TABLE solicitacoes ADD COLUMN IF NOT EXISTS ptres_code VARCHAR(10);
ALTER TABLE solicitacoes ADD COLUMN IF NOT EXISTS dotacao_code VARCHAR(20);

-- Campos para datas de emissão dos documentos
ALTER TABLE solicitacoes ADD COLUMN IF NOT EXISTS ne_data DATE;
ALTER TABLE solicitacoes ADD COLUMN IF NOT EXISTS dl_data DATE;
ALTER TABLE solicitacoes ADD COLUMN IF NOT EXISTS ob_data DATE;

-- Número da Portaria SF
ALTER TABLE solicitacoes ADD COLUMN IF NOT EXISTS portaria_sf_numero VARCHAR(50);

-- Comentários
COMMENT ON COLUMN solicitacoes.execution_started_at IS 'Data/hora de início da execução da despesa';
COMMENT ON COLUMN solicitacoes.execution_completed_at IS 'Data/hora de conclusão da execução';
COMMENT ON COLUMN solicitacoes.ptres_code IS 'Código PTRES vinculado à execução';
COMMENT ON COLUMN solicitacoes.dotacao_code IS 'Código da dotação orçamentária';
COMMENT ON COLUMN solicitacoes.ne_data IS 'Data de emissão da Nota de Empenho';
COMMENT ON COLUMN solicitacoes.dl_data IS 'Data de emissão do Documento de Liquidação';
COMMENT ON COLUMN solicitacoes.ob_data IS 'Data de emissão da Ordem Bancária';
COMMENT ON COLUMN solicitacoes.portaria_sf_numero IS 'Número da Portaria SF';

-- Índice para processos em execução
CREATE INDEX IF NOT EXISTS idx_solicitacoes_execution ON solicitacoes(execution_started_at) 
WHERE execution_started_at IS NOT NULL AND execution_completed_at IS NULL;
