-- =============================================================================
-- Migration: Suporte a Documentos Externos (ERP Upload)
-- Criado em: 2026-01-22
-- Descrição: Adiciona campos para suportar upload de PDFs do SIAFE/SIAFI
--            em vez de geração interna de NE, DL e OB.
-- =============================================================================

-- 1. Novos campos na tabela documentos
ALTER TABLE documentos ADD COLUMN IF NOT EXISTS file_path TEXT;
ALTER TABLE documentos ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE documentos ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'INTERNAL';
ALTER TABLE documentos ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ;
ALTER TABLE documentos ADD COLUMN IF NOT EXISTS signed_by UUID REFERENCES auth.users(id);
ALTER TABLE documentos ADD COLUMN IF NOT EXISTS original_filename TEXT;
ALTER TABLE documentos ADD COLUMN IF NOT EXISTS file_size_bytes INTEGER;

-- 2. Constraint para source_type
ALTER TABLE documentos DROP CONSTRAINT IF EXISTS documentos_source_type_check;
ALTER TABLE documentos ADD CONSTRAINT documentos_source_type_check 
  CHECK (source_type IN ('INTERNAL', 'EXTERNAL_ERP'));

-- 3. Índices para performance
CREATE INDEX IF NOT EXISTS idx_documentos_source_type ON documentos(source_type);
CREATE INDEX IF NOT EXISTS idx_documentos_signed_at ON documentos(signed_at);

-- 4. Atualizar documentos existentes
UPDATE documentos 
SET source_type = 'INTERNAL' 
WHERE source_type IS NULL;

-- 5. Comentários para documentação
COMMENT ON COLUMN documentos.source_type IS 'INTERNAL = gerado pelo sistema (Portaria/Certidão), EXTERNAL_ERP = upload de PDF do SIAFE (NE/DL/OB)';
COMMENT ON COLUMN documentos.file_path IS 'Caminho do arquivo no Supabase Storage (ex: execution/{process_id}/ne_timestamp.pdf)';
COMMENT ON COLUMN documentos.file_url IS 'URL pública do arquivo no Storage';
COMMENT ON COLUMN documentos.signed_at IS 'Timestamp da assinatura digital PAdES aplicada pelo Ordenador';
COMMENT ON COLUMN documentos.signed_by IS 'UUID do usuário que aplicou a assinatura digital';
COMMENT ON COLUMN documentos.original_filename IS 'Nome original do arquivo enviado pelo usuário';
COMMENT ON COLUMN documentos.file_size_bytes IS 'Tamanho do arquivo em bytes';

-- =============================================================================
-- FIM DA MIGRATION
-- =============================================================================
