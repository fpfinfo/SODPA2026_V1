-- ============================================================================
-- AUDIT LOG TABLE AND TRIGGERS
-- Purpose: Track all changes to critical tables (solicitacoes, documentos)
-- ============================================================================

-- Create audit_log table
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    user_id UUID REFERENCES auth.users(id),
    user_email TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_record_id ON audit_log(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_operation ON audit_log(operation);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);

-- Enable RLS
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Only SOSFU and ADMIN users can view audit logs
CREATE POLICY "audit_log_select_sosfu" ON audit_log
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('SOSFU', 'ADMIN', 'GOVERNANCA')
        )
    );

-- ============================================================================
-- GENERIC AUDIT TRIGGER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_audit_log_trigger()
RETURNS TRIGGER AS $$
DECLARE
    old_row JSONB := NULL;
    new_row JSONB := NULL;
    changed TEXT[] := ARRAY[]::TEXT[];
    current_user_id UUID;
    current_user_email TEXT;
    col TEXT;
BEGIN
    -- Get current user info
    current_user_id := auth.uid();
    SELECT email INTO current_user_email FROM auth.users WHERE id = current_user_id;
    
    -- Determine operation type and capture data
    IF TG_OP = 'INSERT' THEN
        new_row := to_jsonb(NEW);
        INSERT INTO audit_log (
            table_name, record_id, operation, 
            old_values, new_values, changed_fields,
            user_id, user_email
        ) VALUES (
            TG_TABLE_NAME, NEW.id, 'INSERT',
            NULL, new_row, NULL,
            current_user_id, current_user_email
        );
        RETURN NEW;
        
    ELSIF TG_OP = 'UPDATE' THEN
        old_row := to_jsonb(OLD);
        new_row := to_jsonb(NEW);
        
        -- Find changed fields
        FOR col IN SELECT key FROM jsonb_each(new_row)
        LOOP
            IF (old_row->col) IS DISTINCT FROM (new_row->col) THEN
                changed := array_append(changed, col);
            END IF;
        END LOOP;
        
        -- Only log if something actually changed
        IF array_length(changed, 1) > 0 THEN
            INSERT INTO audit_log (
                table_name, record_id, operation,
                old_values, new_values, changed_fields,
                user_id, user_email
            ) VALUES (
                TG_TABLE_NAME, NEW.id, 'UPDATE',
                old_row, new_row, changed,
                current_user_id, current_user_email
            );
        END IF;
        RETURN NEW;
        
    ELSIF TG_OP = 'DELETE' THEN
        old_row := to_jsonb(OLD);
        INSERT INTO audit_log (
            table_name, record_id, operation,
            old_values, new_values, changed_fields,
            user_id, user_email
        ) VALUES (
            TG_TABLE_NAME, OLD.id, 'DELETE',
            old_row, NULL, NULL,
            current_user_id, current_user_email
        );
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ATTACH TRIGGERS TO CRITICAL TABLES
-- ============================================================================

-- Solicitacoes (main process table)
DROP TRIGGER IF EXISTS trg_audit_solicitacoes ON solicitacoes;
CREATE TRIGGER trg_audit_solicitacoes
    AFTER INSERT OR UPDATE OR DELETE ON solicitacoes
    FOR EACH ROW EXECUTE FUNCTION fn_audit_log_trigger();

-- Documentos (document records)
DROP TRIGGER IF EXISTS trg_audit_documentos ON documentos;
CREATE TRIGGER trg_audit_documentos
    AFTER INSERT OR UPDATE OR DELETE ON documentos
    FOR EACH ROW EXECUTE FUNCTION fn_audit_log_trigger();

-- Historico Tramitacao (tramitation history) - if exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'historico_tramitacao') THEN
        DROP TRIGGER IF EXISTS trg_audit_historico_tramitacao ON historico_tramitacao;
        CREATE TRIGGER trg_audit_historico_tramitacao
            AFTER INSERT OR UPDATE OR DELETE ON historico_tramitacao
            FOR EACH ROW EXECUTE FUNCTION fn_audit_log_trigger();
    END IF;
END $$;

-- Profiles (user profile changes)
DROP TRIGGER IF EXISTS trg_audit_profiles ON profiles;
CREATE TRIGGER trg_audit_profiles
    AFTER INSERT OR UPDATE OR DELETE ON profiles
    FOR EACH ROW EXECUTE FUNCTION fn_audit_log_trigger();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON audit_log TO authenticated;
GRANT INSERT ON audit_log TO authenticated;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify table was created
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_log') THEN
        RAISE NOTICE 'SUCCESS: audit_log table created';
    ELSE
        RAISE EXCEPTION 'FAILED: audit_log table not created';
    END IF;
END $$;
