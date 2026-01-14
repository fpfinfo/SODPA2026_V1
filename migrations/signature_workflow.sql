-- Migration: Add Signature Delegation Workflow Columns
-- Run this in Supabase SQL Editor to enable AJSEFIN -> SEPLAN signature flow

-- Add signature workflow columns to documentos table
DO $$
BEGIN
    -- Assigned signer (for delegation to Ordenador)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'documentos' AND column_name = 'assigned_signer_id') THEN
        ALTER TABLE public.documentos ADD COLUMN assigned_signer_id UUID REFERENCES public.profiles(id);
    END IF;
    
    -- Signature status: draft, pending_signature, signed, rejected
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'documentos' AND column_name = 'signature_status') THEN
        ALTER TABLE public.documentos ADD COLUMN signature_status TEXT DEFAULT 'draft';
    END IF;
    
    -- Title column for document display
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'documentos' AND column_name = 'titulo') THEN
        ALTER TABLE public.documentos ADD COLUMN titulo TEXT;
    END IF;
END $$;

-- RLS Policy: AJSEFIN can view all documents for legal review
DROP POLICY IF EXISTS "AJSEFIN can view all documents" ON documentos;
CREATE POLICY "AJSEFIN can view all documents" ON documentos 
FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ajsefin')
);

-- RLS Policy: Ordenador/SEPLAN can view documents assigned to them
DROP POLICY IF EXISTS "Ordenador can view assigned documents" ON documentos;
CREATE POLICY "Ordenador can view assigned documents" ON documentos 
FOR SELECT USING (
  assigned_signer_id = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ordenador', 'seplan'))
);

-- RLS Policy: Ordenador can update documents assigned to them (for signing)
DROP POLICY IF EXISTS "Ordenador can sign assigned documents" ON documentos;
CREATE POLICY "Ordenador can sign assigned documents" ON documentos 
FOR UPDATE USING (
  assigned_signer_id = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ordenador', 'seplan'))
);

-- RLS Policy: AJSEFIN can insert documents
DROP POLICY IF EXISTS "AJSEFIN can create documents" ON documentos;
CREATE POLICY "AJSEFIN can create documents" ON documentos 
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ajsefin')
);

-- Index for faster queries on pending signatures
CREATE INDEX IF NOT EXISTS idx_documentos_signature_status 
  ON public.documentos(signature_status);

CREATE INDEX IF NOT EXISTS idx_documentos_assigned_signer 
  ON public.documentos(assigned_signer_id);
