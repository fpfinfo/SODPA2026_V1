-- =====================================================
-- EXECUÇÃO DA DESPESA: FIX RLS POLICIES
-- Data: 2026-01-19
-- Objetivo: Permitir Suprido/Gestor criar e ver documentos
-- =====================================================

-- 1. DROP políticas antigas restritivas
DROP POLICY IF EXISTS "SOSFU e SEFIN podem ver documentos de execução" ON execution_documents;
DROP POLICY IF EXISTS "SOSFU pode criar documentos de execução" ON execution_documents;
DROP POLICY IF EXISTS "SEFIN pode atualizar documentos (assinatura)" ON execution_documents;

-- 2. SELECT: Participantes do processo podem ver + SOSFU/SEFIN/ADMIN
CREATE POLICY "execution_documents_select_policy" ON execution_documents
FOR SELECT
TO authenticated
USING (
  -- Pode ver se for:
  -- 1. Participante do processo (suprido, gestor)
  -- 2. SOSFU, SEFIN ou ADMIN
  EXISTS (
    SELECT 1 FROM solicitacoes s
    WHERE s.id = execution_documents.solicitacao_id
    AND (
      s.suprido_id = auth.uid()              -- Suprido
      OR s.gestor_id = auth.uid()            -- Gestor
      OR EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role IN ('SOSFU', 'SEFIN', 'ADMIN')
      )
    )
  )
);

-- 3. INSERT: Participantes + SOSFU/SEFIN podem criar
CREATE POLICY "execution_documents_insert_policy" ON execution_documents
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM solicitacoes s
    WHERE s.id = execution_documents.solicitacao_id
    AND (
      s.suprido_id = auth.uid()              -- Suprido pode gerar
      OR s.gestor_id = auth.uid()            -- Gestor pode gerar
      OR EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role IN ('SOSFU', 'SEFIN', 'ADMIN')
      )
    )
  )
);

-- 4. UPDATE: Criador ou SEFIN/ADMIN (para assinatura)
CREATE POLICY "execution_documents_update_policy" ON execution_documents
FOR UPDATE
TO authenticated
USING (
  -- Pode atualizar se for:
  -- 1. Participante do processo original
  -- 2. SEFIN/ADMIN (para assinar)
  EXISTS (
    SELECT 1 FROM solicitacoes s
    WHERE s.id = execution_documents.solicitacao_id
    AND (
      s.suprido_id = auth.uid()
      OR s.gestor_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role IN ('SEFIN', 'ADMIN')
      )
    )
  )
);

-- 5. Adicionar coluna created_by se não existir (para rastreabilidade)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'execution_documents' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE execution_documents ADD COLUMN created_by UUID REFERENCES profiles(id);
    
    -- Criar índice para performance
    CREATE INDEX idx_execution_documents_created_by ON execution_documents(created_by);
  END IF;
END $$;

-- 6. Trigger para preencher created_by automaticamente
CREATE OR REPLACE FUNCTION set_execution_document_creator()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS execution_documents_set_creator ON execution_documents;
CREATE TRIGGER execution_documents_set_creator
  BEFORE INSERT ON execution_documents
  FOR EACH ROW
  EXECUTE FUNCTION set_execution_document_creator();

-- 7. Índices para performance (se não existirem)
CREATE INDEX IF NOT EXISTS idx_execution_documents_solicitacao 
  ON execution_documents(solicitacao_id);
  
CREATE INDEX IF NOT EXISTS idx_execution_documents_tipo 
  ON execution_documents(tipo);
  
CREATE INDEX IF NOT EXISTS idx_execution_documents_status 
  ON execution_documents(status);

-- 8. Comentários para documentação
COMMENT ON POLICY "execution_documents_select_policy" ON execution_documents IS 
  'Participantes do processo (suprido, gestor) e SOSFU/SEFIN/ADMIN podem visualizar documentos de execução';

COMMENT ON POLICY "execution_documents_insert_policy" ON execution_documents IS 
  'Participantes do processo (suprido, gestor) e SOSFU/SEFIN/ADMIN podem criar documentos de execução';

COMMENT ON POLICY "execution_documents_update_policy" ON execution_documents IS 
  'Participantes do processo e SEFIN/ADMIN podem atualizar (para assinatura)';

COMMENT ON COLUMN execution_documents.created_by IS 
  'UUID do usuário que criou o documento (preenchido automaticamente)';

-- 9. Verificar se RLS está habilitado (garantir)
ALTER TABLE execution_documents ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================

-- TESTE RÁPIDO:
-- Descomentar para testar se as policies estão OK
-- SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'execution_documents';
