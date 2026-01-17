-- Drop all existing SELECT policies and create a single comprehensive one
DROP POLICY IF EXISTS "Process owner can view all process documents" ON documentos;
DROP POLICY IF EXISTS "Document creator can view own documents" ON documentos;
DROP POLICY IF EXISTS "Users can view their own documents" ON documentos;

-- Create unified policy: Anyone involved in the process can see ALL documents
-- This includes: process owner, document creators, and any role with access
CREATE POLICY "Universal dossier access" ON documentos
FOR SELECT TO authenticated
USING (
  -- Process owner can see all documents in their process
  (auth.uid() IN (SELECT s.user_id FROM solicitacoes s WHERE s.id = documentos.solicitacao_id))
  OR
  -- Document creator can see their own documents
  (created_by = auth.uid())
  OR
  -- Assigned signer can see document they need to sign
  (assigned_signer_id = auth.uid())
);
