-- Script: fix_signature_footer.sql
-- Objetivo: Corrigir documentos assinados que não exibem o rodapé de assinatura eletrônica
-- Motivo: Documentos antigos não tinham 'signed_by_name' no metadata, e a nova lógica depende disso.

BEGIN;

DO $$
DECLARE
    doc_count INTEGER := 0;
BEGIN
    -- 1. Identificar documentos que precisam de correção
    -- Critérios: 
    -- - Tipo: PORTARIA, CERTIDAO, DECISAO
    -- - Status: ASSINADO (ou Assinado)
    -- - Metadata: signed_by_name IS NULL ou signed_at IS NULL
    
    WITH docs_to_fix AS (
        SELECT d.id
        FROM documentos d
        JOIN profiles p ON d.created_by = p.id
        WHERE d.tipo IN ('PORTARIA', 'CERTIDAO', 'DECISAO')
        AND (d.status = 'ASSINADO' OR d.status = 'Assinado')
        AND (
            (d.metadata->>'signed_by_name') IS NULL 
            OR 
            (d.metadata->>'signed_at') IS NULL
        )
    )
    SELECT count(*) INTO doc_count FROM docs_to_fix;

    RAISE NOTICE 'Encontrados % documentos para corrigir...', doc_count;

    -- 2. Atualizar metadata com nome do assinante e data
    -- Se signed_at não existir, usa created_at ou updated_at
    UPDATE documentos d
    SET metadata = 
        -- Garante que o metadata existe
        COALESCE(d.metadata, '{}'::jsonb) 
        || jsonb_build_object(
            'signed_by_name', COALESCE(d.metadata->>'signed_by_name', p.nome, 'Ordenador de Despesa'),
            'signer_role', COALESCE(d.metadata->>'signer_role', p.cargo, p.role, 'Ordenador de Despesa'),
            'signed_at', COALESCE(d.metadata->>'signed_at', d.updated_at::text, d.created_at::text)
        )
    FROM profiles p
    WHERE d.created_by = p.id
    AND d.tipo IN ('PORTARIA', 'CERTIDAO', 'DECISAO')
    AND (d.status = 'ASSINADO' OR d.status = 'Assinado')
    AND (
        (d.metadata->>'signed_by_name') IS NULL 
        OR 
        (d.metadata->>'signed_at') IS NULL
    );

    RAISE NOTICE 'Correção aplicada com sucesso em % documentos.', doc_count;

END $$;

COMMIT;

-- Verificação final
SELECT 
    id, 
    tipo, 
    status, 
    metadata->>'signed_by_name' as assinado_por,
    metadata->>'signed_at' as assinado_em
FROM documentos 
WHERE tipo IN ('PORTARIA', 'CERTIDAO', 'DECISAO')
AND (status = 'ASSINADO' OR status = 'Assinado')
ORDER BY updated_at DESC
LIMIT 10;
