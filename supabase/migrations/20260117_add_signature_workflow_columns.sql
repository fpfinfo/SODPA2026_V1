-- Add signature workflow columns to documentos table
ALTER TABLE documentos 
ADD COLUMN IF NOT EXISTS signature_status TEXT DEFAULT 'pending_signature' 
  CHECK (signature_status IN ('pending_signature', 'signed', 'rejected'));

ALTER TABLE documentos 
ADD COLUMN IF NOT EXISTS assigned_signer_id UUID REFERENCES auth.users(id);

ALTER TABLE documentos 
ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ;

ALTER TABLE documentos 
ADD COLUMN IF NOT EXISTS signed_by UUID REFERENCES auth.users(id);

-- Create index for faster queries on pending signatures
CREATE INDEX IF NOT EXISTS idx_documentos_signature_status ON documentos(signature_status);
CREATE INDEX IF NOT EXISTS idx_documentos_assigned_signer ON documentos(assigned_signer_id);

-- Add comment for documentation
COMMENT ON COLUMN documentos.signature_status IS 'Status: pending_signature, signed, rejected';
COMMENT ON COLUMN documentos.assigned_signer_id IS 'User assigned to sign this document';
COMMENT ON COLUMN documentos.signed_at IS 'Timestamp when document was signed';
COMMENT ON COLUMN documentos.signed_by IS 'User who signed the document';
