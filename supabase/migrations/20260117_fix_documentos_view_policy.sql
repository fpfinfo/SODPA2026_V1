-- Fix: Allow process owner to see ALL documents in their process (not just their own)
-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view their own documents" ON documentos;

-- Create new policy: Process owner can view ALL documents in their process
CREATE POLICY "Process owner can view all process documents" ON documentos
FOR SELECT TO authenticated
USING (
  auth.uid() IN (
    SELECT s.user_id FROM solicitacoes s WHERE s.id = documentos.solicitacao_id
  )
);

-- Also allow document creators to view their own documents (in case they're not the process owner)
CREATE POLICY "Document creator can view own documents" ON documentos
FOR SELECT TO authenticated
USING (created_by = auth.uid());
