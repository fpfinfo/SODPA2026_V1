-- ============================================================================
-- Storage Bucket: documents
-- Para anexos de solicitações SODPA
-- ============================================================================
-- NOTA: Este bucket deve ser criado manualmente via Supabase Dashboard
-- devido a restrições de permissão na tabela storage.buckets
-- 
-- Configurações recomendadas:
-- - Name: documents
-- - Public: false (privado)
-- - File size limit: 10MB (10485760 bytes)
-- - Allowed MIME types: application/pdf, image/jpeg, image/png, image/jpg
-- ============================================================================

-- As policies abaixo devem ser criadas no Dashboard > Storage > Policies

-- Policy: INSERT - Usuários autenticados podem fazer upload
-- Name: "Allow authenticated uploads"
-- Allowed operation: INSERT
-- Target roles: authenticated
-- WITH CHECK expression:
--   bucket_id = 'documents'

-- Policy: SELECT - Usuários autenticados podem visualizar arquivos
-- Name: "Allow authenticated downloads"
-- Allowed operation: SELECT
-- Target roles: authenticated
-- USING expression:
--   bucket_id = 'documents'

-- Policy: DELETE - Usuários podem deletar arquivos na pasta sodpa
-- Name: "Allow delete own files"
-- Allowed operation: DELETE
-- Target roles: authenticated
-- USING expression:
--   bucket_id = 'documents' AND (storage.foldername(name))[1] = 'sodpa'
