-- Migration: Add documento_validations table for OCR results
-- Description: Stores automated validation results from OCR processing of Portarias and Certidões

CREATE TABLE IF NOT EXISTS documento_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  documento_id UUID REFERENCES documentos(id) ON DELETE CASCADE,
  tipo_validacao TEXT NOT NULL CHECK (tipo_validacao IN ('OCR', 'SIGNATURE', 'FIELD_MATCH')),
  status TEXT NOT NULL CHECK (status IN ('APPROVED', 'REJECTED', 'REVIEW_NEEDED')),
  resultado JSONB NOT NULL DEFAULT '{}', -- extracted data: nome, cpf, data, etc.
  confianca DECIMAL(5,2) CHECK (confianca >= 0 AND confianca <= 100), -- 0-100 confidence score
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_doc_validations_documento ON documento_validations(documento_id);
CREATE INDEX idx_doc_validations_status ON documento_validations(status);
CREATE INDEX idx_doc_validations_tipo ON documento_validations(tipo_validacao);
CREATE INDEX idx_doc_validations_created ON documento_validations(created_at DESC);

-- RLS Policies
ALTER TABLE documento_validations ENABLE ROW LEVEL SECURITY;

-- Policy: READ - Users can read validations for documents they have access to
CREATE POLICY "Users can read their document validations"
  ON documento_validations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM documentos d
      WHERE d.id = documento_validations.documento_id
        AND (
          d.created_by = auth.uid()
          OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
              AND p.role IN ('SOSFU', 'SEFIN', 'ADMIN')
          )
        )
    )
  );

-- Policy: INSERT - Only Edge Functions and admins can insert validations
CREATE POLICY "Edge Functions can insert validations"
  ON documento_validations FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Policy: UPDATE - Only admins can update validations
CREATE POLICY "Admins can update validations"
  ON documento_validations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Trigger: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_documento_validations_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_documento_validations
  BEFORE UPDATE ON documento_validations
  FOR EACH ROW
  EXECUTE FUNCTION update_documento_validations_timestamp();

-- Comments for documentation
COMMENT ON TABLE documento_validations IS 'Stores automated validation results from OCR and field validation of documents';
COMMENT ON COLUMN documento_validations.tipo_validacao IS 'Type of validation: OCR (text extraction), SIGNATURE (digital signature check), FIELD_MATCH (data matching)';
COMMENT ON COLUMN documento_validations.status IS 'Validation result: APPROVED (all checks passed), REJECTED (failed), REVIEW_NEEDED (requires human review)';
COMMENT ON COLUMN documento_validations.resultado IS 'JSON object containing extracted/validated data and detailed results';
COMMENT ON COLUMN documento_validations.confianca IS 'Confidence score from 0-100 based on OCR accuracy and field matching';
