-- MIGRAÇÃO: Sincronizar comprovantes existentes para o Dossiê Digital
-- Execute este script no Supabase SQL Editor

-- 1. Inserir comprovantes existentes no documentos (Dossiê)
INSERT INTO documentos (solicitacao_id, nome, titulo, tipo, status, created_by, file_url, metadata, created_at)
SELECT 
    pc.solicitacao_id,
    c.file_name,
    c.tipo || ' - R$ ' || c.valor::TEXT,
    'COMPROVANTE_DESPESA',
    'ANEXADO',
    pc.submitted_by,
    c.storage_url,
    jsonb_build_object('comprovante_id', c.id, 'valor', c.valor, 'emitente', c.emitente),
    c.created_at
FROM comprovantes_pc c
JOIN prestacao_contas pc ON pc.id = c.prestacao_id
WHERE c.storage_url IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM documentos d 
    WHERE d.metadata->>'comprovante_id' = c.id::TEXT
);

-- 2. Verificar quantos foram migrados
SELECT COUNT(*) as comprovantes_migrados FROM documentos WHERE tipo = 'COMPROVANTE_DESPESA';

-- 3. Liberar RLS para leitura de comprovantes (se não existir)
DROP POLICY IF EXISTS "Receipts_Select_Public" ON comprovantes_pc;
CREATE POLICY "Receipts_Select_Public" ON comprovantes_pc FOR SELECT USING (true);
