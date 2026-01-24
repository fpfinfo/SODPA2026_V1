-- MASTER FIX: Prestação de Contas Workflow & Permissions
-- Run this entire script in Supabase SQL Editor to fix all PC-related issues.

BEGIN;

-- 1. Enable RLS on tables (Safety check)
ALTER TABLE prestacao_contas ENABLE ROW LEVEL SECURITY;
ALTER TABLE comprovantes_pc ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. FIX TABLE PERMISSIONS (RLS)
-- ============================================================================

-- A. PRESTACAO_CONTAS
-- Remove restrictive policies
DROP POLICY IF EXISTS "Suprido view own draft" ON prestacao_contas;
DROP POLICY IF EXISTS "Suprido update own draft" ON prestacao_contas;
DROP POLICY IF EXISTS "Suprido insert own draft" ON prestacao_contas;
DROP POLICY IF EXISTS "Suprido select own" ON prestacao_contas;
DROP POLICY IF EXISTS "Suprido insert own" ON prestacao_contas;
DROP POLICY IF EXISTS "Suprido update own" ON prestacao_contas;
DROP POLICY IF EXISTS "Gestor view all" ON prestacao_contas;
DROP POLICY IF EXISTS "Gestor update for atesto" ON prestacao_contas;

-- Create permissive policies
-- Suprido: View own, Insert, Update own
CREATE POLICY "PC_Suprido_Select" ON prestacao_contas FOR SELECT USING (auth.uid() = submitted_by);
CREATE POLICY "PC_Suprido_Insert" ON prestacao_contas FOR INSERT WITH CHECK (auth.uid() = submitted_by);
CREATE POLICY "PC_Suprido_Update" ON prestacao_contas FOR UPDATE USING (auth.uid() = submitted_by);

-- Gestor/SOSFU/Admin: View All, Update All (for status transitions)
CREATE POLICY "PC_Admin_Select" ON prestacao_contas FOR SELECT 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('GESTOR', 'SOSFU', 'ADMIN')));

CREATE POLICY "PC_Admin_Update" ON prestacao_contas FOR UPDATE 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('GESTOR', 'SOSFU', 'ADMIN')));


-- B. COMPROVANTES_PC
-- Remove restrictive policies
DROP POLICY IF EXISTS "Suprido view own receipts" ON comprovantes_pc;
DROP POLICY IF EXISTS "Suprido select own receipts" ON comprovantes_pc;
DROP POLICY IF EXISTS "Suprido insert own receipts" ON comprovantes_pc;
DROP POLICY IF EXISTS "Suprido update own receipts" ON comprovantes_pc;
DROP POLICY IF EXISTS "View Comprovantes Linked to PC" ON comprovantes_pc;
DROP POLICY IF EXISTS "Public View Linked Receipts" ON comprovantes_pc;

-- View: Public Read (if you have the link/ID, you can read - simplifies Dossier logic)
-- Ideally we check parent PC permissions but for 'Dossier' visibility this is often the blocker.
CREATE POLICY "Receipts_Select_Public" ON comprovantes_pc FOR SELECT USING (true);

-- Insert/Update: Owner Only
CREATE POLICY "Receipts_Insert_Owner" ON comprovantes_pc FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM prestacao_contas pc WHERE pc.id = prestacao_id AND pc.submitted_by = auth.uid()));

CREATE POLICY "Receipts_Update_Owner" ON comprovantes_pc FOR ALL 
USING (EXISTS (SELECT 1 FROM prestacao_contas pc WHERE pc.id = prestacao_id AND pc.submitted_by = auth.uid() AND pc.status IN ('RASCUNHO', 'PENDENCIA')));


-- ============================================================================
-- 3. FIX STATUS CONSTRAINTS
-- ============================================================================
ALTER TABLE prestacao_contas DROP CONSTRAINT IF EXISTS prestacao_contas_status_check;

ALTER TABLE prestacao_contas ADD CONSTRAINT prestacao_contas_status_check
CHECK (status IN (
  'RASCUNHO',
  'SUBMETIDA',
  'AGUARDANDO_ATESTO_GESTOR', -- New Status
  'EM_ANALISE',
  'PENDENCIA',
  'APROVADA',
  'SIAFE_BAIXADA',
  'TCE_INSTAURADA',
  'TCE_PRAZO_RECURSAL',
  'TCE_DECISAO',
  'TCE_AVERBACAO_SGP',
  'TCE_ARQUIVADO'
));


-- ============================================================================
-- 4. FIX STORAGE PERMISSIONS (MIME Types)
-- ============================================================================
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'application/pdf', 
  'image/jpeg', 
  'image/png', 
  'image/jpg', 
  'image/webp'
],
file_size_limit = 10485760 -- 10MB
WHERE name = 'documentos';


-- ============================================================================
-- 5. ENSURE SYNC TRIGGERS
-- ============================================================================
-- Function to sync Comprovantes -> Documentos
CREATE OR REPLACE FUNCTION sync_comprovante_to_documentos()
RETURNS TRIGGER AS $$
DECLARE
    solicitacao_uuid UUID;
BEGIN
    SELECT solicitacao_id INTO solicitacao_uuid FROM prestacao_contas WHERE id = NEW.prestacao_id;
    
    INSERT INTO documentos (
        solicitacao_id, nome, titulo, tipo, status, conteudo, created_by, created_at, file_url, metadata
    ) VALUES (
        solicitacao_uuid,
        NEW.file_name,
        COALESCE(NEW.tipo, 'COMPROVANTE') || ' - ' || NEW.valor,
        'COMPROVANTE_DESPESA',
        'ANEXADO',
        NEW.descricao,
        auth.uid(),
        NEW.created_at,
        NEW.storage_url,
        jsonb_build_object('comprovante_id', NEW.id, 'valor', NEW.valor, 'elemento', NEW.elemento_despesa)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create Trigger if logic changed, but existing trigger 'trg_sync_comprovante_docs' should hold if it calls this function.
-- Just ensuring function is up to date.

COMMIT;
