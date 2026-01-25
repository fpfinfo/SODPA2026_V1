-- Hardening de Auditoria (Imutabilidade)
-- Remove permissão de escrita direta na tabela de logs para garantir que
-- apenas os Triggers do sistema possam gerar registros.

-- 1. Revogar permissões de modificação direta para roles de aplicação
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON audit_log FROM authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON audit_log FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON audit_log FROM public;

-- 2. Criar políticas RLS de bloqueio explícito (Defense in Depth)
-- Garante que mesmo com permissões indevidas, o RLS bloqueie a ação
DROP POLICY IF EXISTS "audit_log_no_update" ON audit_log;
CREATE POLICY "audit_log_no_update" ON audit_log FOR UPDATE USING (false);

DROP POLICY IF EXISTS "audit_log_no_delete" ON audit_log;
CREATE POLICY "audit_log_no_delete" ON audit_log FOR DELETE USING (false);

-- Nota: A inserção continua funcionando via Trigger Functions 
-- pois elas executam como SECURITY DEFINER (bypass RLS/Grants do usuário).
