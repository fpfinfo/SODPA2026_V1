-- Migration: Adiciona colunas para execução de despesa SOSFU
-- Data: 2026-01-15

-- Adicionar colunas de números de documentos de execução
ALTER TABLE solicitacoes ADD COLUMN IF NOT EXISTS ne_numero VARCHAR(50);
ALTER TABLE solicitacoes ADD COLUMN IF NOT EXISTS dl_numero VARCHAR(50);
ALTER TABLE solicitacoes ADD COLUMN IF NOT EXISTS ob_numero VARCHAR(50);

-- Adicionar coluna de atribuição a analista
ALTER TABLE solicitacoes ADD COLUMN IF NOT EXISTS assigned_to_id UUID REFERENCES profiles(id);

-- Comentários
COMMENT ON COLUMN solicitacoes.ne_numero IS 'Número da Nota de Empenho';
COMMENT ON COLUMN solicitacoes.dl_numero IS 'Número do Documento de Liquidação';
COMMENT ON COLUMN solicitacoes.ob_numero IS 'Número da Ordem Bancária';
COMMENT ON COLUMN solicitacoes.assigned_to_id IS 'ID do analista SOSFU atribuído';

-- Índice para buscar por analista
CREATE INDEX IF NOT EXISTS idx_solicitacoes_assigned_to ON solicitacoes(assigned_to_id);
