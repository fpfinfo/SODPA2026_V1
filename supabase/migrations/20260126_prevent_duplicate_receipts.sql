-- Migration: Prevenção de Duplicidade de Comprovantes
-- Data: 2026-01-26
-- Objetivo: Impedir que o mesmo documento seja usado em prestações diferentes (fraude) ou duplicado na mesma.

-- 1. Adicionar coluna Hash do Arquivo
ALTER TABLE comprovantes_pc 
ADD COLUMN IF NOT EXISTS file_hash TEXT;

-- 2. Índice Único para Hash de Arquivo (Bloqueia upload do EXATO mesmo arquivo PDF/JPG)
-- Ignora nulos para compatibilidade com legados, mas novos devem ter.
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_file_hash_global 
ON comprovantes_pc (file_hash) 
WHERE file_hash IS NOT NULL;

-- 3. Índice Único para Metadados (Bloqueia documentos diferentes com mesmos dados fiscais)
-- Chave: (CNPJ Emitente + Número + Série) --> Identidade única de NFe
-- Apenas para documentos que possuem Número e CNPJ definidos.
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_fiscal_metadata 
ON comprovantes_pc (cnpj_cpf, numero, serie) 
WHERE tipo IN ('NOTA_FISCAL', 'CUPOM_FISCAL', 'PASSAGEM') 
  AND numero IS NOT NULL 
  AND cnpj_cpf IS NOT NULL;

-- 4. Função para Mensagem de Erro Amigável (Opcional, mas útil se usarmos triggers)
-- Por enquanto, confiaremos na Unique Violation ("duplicate key value violates unique constraint")

COMMENT ON COLUMN comprovantes_pc.file_hash IS 'SHA-256 do arquivo original para detecção de duplicidade exata';
