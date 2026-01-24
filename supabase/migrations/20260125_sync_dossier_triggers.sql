-- =============================================================================
-- SYNC TRIGGER: Comprovantes -> Documentos (Dossier Digital)
-- =============================================================================
-- This trigger automatically creates a dossier entry when a comprovante is added
-- ensuring "single source of truth" - uploads appear in Dossier automatically

-- 1. Function to sync new comprovante to documentos
CREATE OR REPLACE FUNCTION sync_comprovante_to_documentos()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_solicitacao_id UUID;
    v_user_id UUID;
BEGIN
    -- Get the parent solicitacao_id from prestacao_contas
    SELECT pc.solicitacao_id, pc.submitted_by 
    INTO v_solicitacao_id, v_user_id
    FROM prestacao_contas pc 
    WHERE pc.id = NEW.prestacao_id;

    -- Insert into documentos table (Dossier Digital)
    INSERT INTO documentos (
        solicitacao_id,
        nome,
        titulo,
        tipo,
        status,
        conteudo,
        created_by,
        created_at,
        file_url,
        metadata
    ) VALUES (
        v_solicitacao_id,
        NEW.file_name,
        COALESCE(NEW.tipo, 'COMPROVANTE') || ' - R$ ' || NEW.valor::TEXT,
        'COMPROVANTE_DESPESA',
        'ANEXADO',
        COALESCE(NEW.descricao, 'Comprovante de despesa'),
        v_user_id,
        NEW.created_at,
        NEW.storage_url,
        jsonb_build_object(
            'comprovante_id', NEW.id,
            'valor', NEW.valor,
            'elemento', NEW.elemento_despesa,
            'emitente', NEW.emitente,
            'cnpj_cpf', NEW.cnpj_cpf
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create trigger on comprovantes_pc INSERT
DROP TRIGGER IF EXISTS trg_sync_comprovante_to_docs ON comprovantes_pc;

CREATE TRIGGER trg_sync_comprovante_to_docs
AFTER INSERT ON comprovantes_pc
FOR EACH ROW
EXECUTE FUNCTION sync_comprovante_to_documentos();

-- =============================================================================
-- SYNC TRIGGER: GDR Files -> Documentos (Dossier Digital)
-- =============================================================================
-- This trigger syncs GDR files when they are uploaded to prestacao_contas

CREATE OR REPLACE FUNCTION sync_gdr_to_documentos()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Get the user who submitted the PC
    v_user_id := NEW.submitted_by;

    -- Sync GDR INSS if newly uploaded
    IF NEW.gdr_inss_arquivo_url IS NOT NULL AND 
       (OLD.gdr_inss_arquivo_url IS NULL OR NEW.gdr_inss_arquivo_url != OLD.gdr_inss_arquivo_url) THEN
        
        INSERT INTO documentos (
            solicitacao_id, nome, titulo, tipo, status, conteudo, created_by, file_url, metadata
        ) VALUES (
            NEW.solicitacao_id,
            'GDR_INSS_' || NEW.gdr_inss_numero || '.pdf',
            'GDR - Recolhimento INSS',
            'GDR',
            'ANEXADO',
            'Guia de Recolhimento INSS - Nº ' || NEW.gdr_inss_numero,
            v_user_id,
            NEW.gdr_inss_arquivo_url,
            jsonb_build_object('tipo', 'INSS', 'numero', NEW.gdr_inss_numero, 'valor', NEW.gdr_inss_valor)
        );
    END IF;

    -- Sync GDR Saldo if newly uploaded
    IF NEW.gdr_saldo_arquivo_url IS NOT NULL AND 
       (OLD.gdr_saldo_arquivo_url IS NULL OR NEW.gdr_saldo_arquivo_url != OLD.gdr_saldo_arquivo_url) THEN
        
        INSERT INTO documentos (
            solicitacao_id, nome, titulo, tipo, status, conteudo, created_by, file_url, metadata
        ) VALUES (
            NEW.solicitacao_id,
            'GDR_SALDO_' || NEW.gdr_saldo_numero || '.pdf',
            'GDR - Devolução de Saldo',
            'GDR',
            'ANEXADO',
            'Guia de Devolução de Saldo - Nº ' || NEW.gdr_saldo_numero,
            v_user_id,
            NEW.gdr_saldo_arquivo_url,
            jsonb_build_object('tipo', 'SALDO', 'numero', NEW.gdr_saldo_numero, 'valor', NEW.gdr_saldo_valor)
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create trigger on prestacao_contas UPDATE (for GDR uploads)
DROP TRIGGER IF EXISTS trg_sync_gdr_to_docs ON prestacao_contas;

CREATE TRIGGER trg_sync_gdr_to_docs
AFTER UPDATE ON prestacao_contas
FOR EACH ROW
WHEN (
    NEW.gdr_inss_arquivo_url IS DISTINCT FROM OLD.gdr_inss_arquivo_url OR
    NEW.gdr_saldo_arquivo_url IS DISTINCT FROM OLD.gdr_saldo_arquivo_url
)
EXECUTE FUNCTION sync_gdr_to_documentos();

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================
-- Ensure the trigger functions can insert into documentos
GRANT INSERT ON documentos TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
